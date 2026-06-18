import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { archiveTargetPaths, archiveTaskRecords, mirrorArchiveRecord } from './archive.js';
import { createPiCrewHooks, type PiCrewAdapter } from './pi-crew.js';
import { advanceFixRetestStage, advanceQaStage, type QaOutcome } from './qa-loop.js';
import { captureTask } from './task-capture.js';
import { renderManifestMarkdown, writeMarkdown } from './markdown.js';
import { getSkillsForPhase } from './skill-registry.js';
import { writePhaseRecord } from './task-records.js';
import {
  type ArchiveRecord,
  type PhaseRecord,
  type PiAvicennaTask,
  type RuntimeManifest,
  type TaskStatus,
  type WorkflowEvent,
  type WorkflowStage,
} from './state.js';

export interface WorkflowTaskIntake {
  id: string;
  title: string;
  description?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface StepActivity {
  actor: PhaseRecord['actor'];
  summary: string;
  details?: string;
}

export interface WorkflowStepResult {
  manifest: RuntimeManifest;
  task: PiAvicennaTask;
  event: WorkflowEvent;
  phaseRecord: PhaseRecord;
}

export interface WorkflowArchiveResult extends WorkflowStepResult {
  archiveTargets: string[];
  record: ArchiveRecord;
}

export interface WorkflowHarness {
  intake(input: WorkflowTaskIntake, activity?: StepActivity): Promise<WorkflowStepResult>;
  research(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowStepResult>;
  plan(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowStepResult>;
  code(task: PiAvicennaTask, instructions?: string, activity?: StepActivity): Promise<WorkflowStepResult>;
  qa(task: PiAvicennaTask, instructions?: string, activity?: StepActivity): Promise<WorkflowStepResult>;
  qaLoop(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowStepResult>;
  requestFix(task: PiAvicennaTask, instructions?: string, activity?: StepActivity): Promise<WorkflowStepResult>;
  retest(task: PiAvicennaTask, outcome: QaOutcome, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowStepResult>;
  fixAndRetest(task: PiAvicennaTask, outcome: QaOutcome, instructions?: string, activity?: StepActivity): Promise<WorkflowStepResult>;
  complete(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowArchiveResult>;
  archive(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowArchiveResult>;
}

function timestamp(): string {
  return new Date().toISOString();
}

function buildTask(input: WorkflowTaskIntake): PiAvicennaTask {
  const now = timestamp();
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    stage: 'intake',
    status: 'captured',
    createdAt: now,
    updatedAt: now,
    source: input.source,
    metadata: input.metadata,
  };
}

function updateTask(task: PiAvicennaTask, stage: WorkflowStage, status: TaskStatus): PiAvicennaTask {
  return {
    ...task,
    stage,
    status,
    updatedAt: timestamp(),
  };
}

function createEvent(taskId: string, kind: WorkflowEvent['kind'], payload?: Record<string, unknown>): WorkflowEvent {
  return {
    id: randomUUID(),
    kind,
    taskId,
    occurredAt: timestamp(),
    payload,
  };
}

function eventForOutcome(outcome: QaOutcome): WorkflowEvent['kind'] {
  switch (outcome) {
    case 'pass':
      return 'qa-passed';
    case 'fail':
      return 'qa-failed';
    case 'retry':
      return 'retest-requested';
  }
}

function buildPhaseRecord(
  taskId: string,
  phase: WorkflowStage,
  activity: StepActivity,
): PhaseRecord {
  const skillSet = getSkillsForPhase(phase);
  const skills = [...skillSet.required, ...skillSet.optional].map((s) => s.name);

  return {
    id: randomUUID(),
    taskId,
    phase,
    actor: activity.actor,
    summary: activity.summary,
    details: activity.details,
    skills,
    occurredAt: timestamp(),
  };
}

function defaultActivity(phase: WorkflowStage, actor: PhaseRecord['actor'] = 'commander'): StepActivity {
  const summaries: Record<WorkflowStage, string> = {
    intake: 'Task captured and intake started',
    research: 'Research phase started',
    planning: 'Planning phase started',
    coding: 'Coding phase started',
    qa: 'QA review requested',
    qa_loop: 'QA loop iteration',
    fixing: 'Fix requested after QA failure',
    completion: 'Task completed',
    archive: 'Task archived',
  };
  return { actor, summary: summaries[phase] ?? `${phase} phase` };
}

export function createWorkflowHarness(options: { manifest: RuntimeManifest; adapter?: PiCrewAdapter }): WorkflowHarness {
  const hooks = createPiCrewHooks(options.adapter);
  let manifest: RuntimeManifest = { ...options.manifest };
  const manifestPath = join(manifest.localStateRoot, 'manifest.md');
  const capturedEvents: WorkflowEvent[] = [];
  const phaseRecords: PhaseRecord[] = [];

  async function persistManifest(): Promise<void> {
    const content = renderManifestMarkdown(manifest);
    const agentManifestPath = join(manifest.agentProjectStateRoot, 'manifest.md');
    await Promise.all([
      writeMarkdown(manifestPath, content),
      writeMarkdown(agentManifestPath, content),
    ]);
  }

  async function persistStep(
    task: PiAvicennaTask,
    event: WorkflowEvent,
    activity: StepActivity,
  ): Promise<WorkflowStepResult> {
    capturedEvents.push(event);
    manifest = { ...manifest, currentTaskId: task.id };

    const phaseRecord = buildPhaseRecord(task.id, task.stage, activity);
    phaseRecords.push(phaseRecord);

    await Promise.all([
      captureTask(manifest, { task, event }),
      persistManifest(),
      writePhaseRecord(manifest, phaseRecord),
    ]);

    return {
      manifest: { ...manifest },
      task,
      event,
      phaseRecord,
    };
  }

  async function archiveTask(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowArchiveResult> {
    const archivedTask = updateTask(task, 'archive', 'archived');
    const event = createEvent(task.id, 'archived', notes);
    const step = await persistStep(archivedTask, event, activity ?? defaultActivity('archive'));
    const record: ArchiveRecord = {
      task: archivedTask,
      manifest: step.manifest,
      capturedEvents: [...capturedEvents],
      phaseRecords: [...phaseRecords],
    };
    const archiveTargets = archiveTargetPaths(manifest.localArchiveRoot, manifest.agentArchiveRoot, task.id);
    const taskRecordsRoots = [manifest.localTaskRecordsRoot, manifest.agentProjectTaskRecordsRoot];
    const archiveRoots = [manifest.localArchiveRoot, manifest.agentArchiveRoot];

    await Promise.all([
      mirrorArchiveRecord(archiveTargets, record),
      archiveTaskRecords(taskRecordsRoots, archiveRoots, task.id),
    ]);

    return {
      ...step,
      archiveTargets,
      record,
    };
  }

  async function requestFixStep(task: PiAvicennaTask, instructions?: string, activity?: StepActivity): Promise<WorkflowStepResult> {
    const nextTask = updateTask(task, 'fixing', 'active');
    const event = createEvent(task.id, 'fix-requested', instructions ? { instructions } : undefined);
    await hooks.sendToCoding({ task: nextTask, instructions });
    return persistStep(nextTask, event, activity ?? defaultActivity('fixing', 'coder'));
  }

  async function retestStep(task: PiAvicennaTask, outcome: QaOutcome, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowStepResult> {
    const nextTask = advanceFixRetestStage(task, outcome);
    const event = createEvent(task.id, eventForOutcome(outcome), notes);
    if (nextTask.stage === 'coding') {
      await hooks.sendToCoding({ task: nextTask });
    }
    return persistStep(nextTask, event, activity ?? defaultActivity(nextTask.stage));
  }

  return {
    async intake(input: WorkflowTaskIntake, activity?: StepActivity): Promise<WorkflowStepResult> {
      const task = buildTask(input);
      const event = createEvent(task.id, 'task-captured', {
        title: task.title,
        source: task.source,
      });
      return persistStep(task, event, activity ?? defaultActivity('intake'));
    },

    async research(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowStepResult> {
      const nextTask = updateTask(task, 'research', 'active');
      const event = createEvent(task.id, 'research-started', notes);
      return persistStep(nextTask, event, activity ?? defaultActivity('research', 'researcher'));
    },

    async plan(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowStepResult> {
      const nextTask = updateTask(task, 'planning', 'active');
      const event = createEvent(task.id, 'planning-started', notes);
      return persistStep(nextTask, event, activity ?? defaultActivity('planning'));
    },

    async code(task: PiAvicennaTask, instructions?: string, activity?: StepActivity): Promise<WorkflowStepResult> {
      const nextTask = updateTask(task, 'coding', 'active');
      const event = createEvent(task.id, 'coding-requested', instructions ? { instructions } : undefined);
      await hooks.sendToCoding({ task: nextTask, instructions });
      return persistStep(nextTask, event, activity ?? defaultActivity('coding', 'coder'));
    },

    async qa(task: PiAvicennaTask, instructions?: string, activity?: StepActivity): Promise<WorkflowStepResult> {
      const nextTask = updateTask(task, 'qa', 'active');
      const event = createEvent(task.id, 'qa-requested', instructions ? { instructions } : undefined);
      await hooks.sendToQa({ task: nextTask, instructions });
      return persistStep(nextTask, event, activity ?? defaultActivity('qa', 'qa'));
    },

    async qaLoop(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowStepResult> {
      const nextTask = advanceQaStage(task, 'retry');
      const event = createEvent(task.id, 'qa-failed', notes);
      return persistStep(nextTask, event, activity ?? defaultActivity('qa_loop', 'qa'));
    },

    async requestFix(task: PiAvicennaTask, instructions?: string, activity?: StepActivity): Promise<WorkflowStepResult> {
      return requestFixStep(task, instructions, activity);
    },

    async retest(task: PiAvicennaTask, outcome: QaOutcome, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowStepResult> {
      return retestStep(task, outcome, notes, activity);
    },

    async fixAndRetest(task: PiAvicennaTask, outcome: QaOutcome, instructions?: string, activity?: StepActivity): Promise<WorkflowStepResult> {
      const fixed = await requestFixStep(task, instructions, activity);
      return retestStep(fixed.task, outcome, instructions ? { instructions } : undefined, activity);
    },

    async complete(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowArchiveResult> {
      const completedTask = updateTask(task, 'completion', 'done');
      const completionEvent = createEvent(task.id, 'stage-changed', {
        stage: 'completion',
        ...notes,
      });
      const completed = await persistStep(completedTask, completionEvent, activity ?? defaultActivity('completion'));
      return archiveTask(completed.task, notes, activity);
    },

    async archive(task: PiAvicennaTask, notes?: Record<string, unknown>, activity?: StepActivity): Promise<WorkflowArchiveResult> {
      return archiveTask(task, notes, activity);
    },
  };
}
