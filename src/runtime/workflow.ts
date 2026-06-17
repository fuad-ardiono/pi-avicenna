import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { archiveTargetPaths, mirrorArchiveRecord } from './archive.js';
import { createPiCrewHooks, type PiCrewAdapter } from './pi-crew.js';
import { advanceFixRetestStage, advanceQaStage, type QaOutcome } from './qa-loop.js';
import { captureTask } from './task-capture.js';
import {
  type ArchiveRecord,
  type PiAvicennaTask,
  type RuntimeManifest,
  type TaskStatus,
  type WorkflowEvent,
  type WorkflowStage,
  writeJsonFile,
} from './state.js';

export interface WorkflowTaskIntake {
  id: string;
  title: string;
  description?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowStepResult {
  manifest: RuntimeManifest;
  task: PiAvicennaTask;
  event: WorkflowEvent;
}

export interface WorkflowArchiveResult extends WorkflowStepResult {
  archiveTargets: string[];
  record: ArchiveRecord;
}

export interface WorkflowHarness {
  intake(input: WorkflowTaskIntake): Promise<WorkflowStepResult>;
  plan(task: PiAvicennaTask, notes?: Record<string, unknown>): Promise<WorkflowStepResult>;
  code(task: PiAvicennaTask, instructions?: string): Promise<WorkflowStepResult>;
  qa(task: PiAvicennaTask, instructions?: string): Promise<WorkflowStepResult>;
  qaLoop(task: PiAvicennaTask, notes?: Record<string, unknown>): Promise<WorkflowStepResult>;
  requestFix(task: PiAvicennaTask, instructions?: string): Promise<WorkflowStepResult>;
  retest(task: PiAvicennaTask, outcome: QaOutcome, notes?: Record<string, unknown>): Promise<WorkflowStepResult>;
  fixAndRetest(task: PiAvicennaTask, outcome: QaOutcome, instructions?: string): Promise<WorkflowStepResult>;
  complete(task: PiAvicennaTask, notes?: Record<string, unknown>): Promise<WorkflowArchiveResult>;
  archive(task: PiAvicennaTask, notes?: Record<string, unknown>): Promise<WorkflowArchiveResult>;
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

export function createWorkflowHarness(options: { manifest: RuntimeManifest; adapter?: PiCrewAdapter }): WorkflowHarness {
  const hooks = createPiCrewHooks(options.adapter);
  let manifest: RuntimeManifest = { ...options.manifest };
  const manifestPath = join(manifest.localStateRoot, 'manifest.json');
  const capturedEvents: WorkflowEvent[] = [];

  async function persistManifest(): Promise<void> {
    await writeJsonFile(manifestPath, manifest);
  }

  async function persistStep(task: PiAvicennaTask, event: WorkflowEvent): Promise<WorkflowStepResult> {
    capturedEvents.push(event);
    manifest = { ...manifest, currentTaskId: task.id };

    await Promise.all([
      captureTask(manifest.localStateRoot, manifest.localTasksRoot, { task, event }),
      persistManifest(),
    ]);

    return {
      manifest: { ...manifest },
      task,
      event,
    };
  }

  async function archiveTask(task: PiAvicennaTask, notes?: Record<string, unknown>): Promise<WorkflowArchiveResult> {
    const archivedTask = updateTask(task, 'archive', 'archived');
    const event = createEvent(task.id, 'archived', notes);
    const step = await persistStep(archivedTask, event);
    const record: ArchiveRecord = {
      task: archivedTask,
      manifest: step.manifest,
      capturedEvents: [...capturedEvents],
    };
    const archiveTargets = archiveTargetPaths(manifest.localArchiveRoot, manifest.agentArchiveRoot, task.id);

    await mirrorArchiveRecord(archiveTargets, record);

    return {
      ...step,
      archiveTargets,
      record,
    };
  }

  async function requestFixStep(task: PiAvicennaTask, instructions?: string): Promise<WorkflowStepResult> {
    const nextTask = updateTask(task, 'fixing', 'active');
    const event = createEvent(task.id, 'fix-requested', instructions ? { instructions } : undefined);
    await hooks.sendToCoding({ task: nextTask, instructions });
    return persistStep(nextTask, event);
  }

  async function retestStep(task: PiAvicennaTask, outcome: QaOutcome, notes?: Record<string, unknown>): Promise<WorkflowStepResult> {
    const nextTask = advanceFixRetestStage(task, outcome);
    const event = createEvent(task.id, eventForOutcome(outcome), notes);
    if (nextTask.stage === 'coding') {
      await hooks.sendToCoding({ task: nextTask });
    }
    return persistStep(nextTask, event);
  }

  return {
    async intake(input: WorkflowTaskIntake): Promise<WorkflowStepResult> {
      const task = buildTask(input);
      const event = createEvent(task.id, 'task-captured', {
        title: task.title,
        source: task.source,
      });
      return persistStep(task, event);
    },

    async plan(task: PiAvicennaTask, notes?: Record<string, unknown>): Promise<WorkflowStepResult> {
      const nextTask = updateTask(task, 'planning', 'active');
      const event = createEvent(task.id, 'planning-started', notes);
      return persistStep(nextTask, event);
    },

    async code(task: PiAvicennaTask, instructions?: string): Promise<WorkflowStepResult> {
      const nextTask = updateTask(task, 'coding', 'active');
      const event = createEvent(task.id, 'coding-requested', instructions ? { instructions } : undefined);
      await hooks.sendToCoding({ task: nextTask, instructions });
      return persistStep(nextTask, event);
    },

    async qa(task: PiAvicennaTask, instructions?: string): Promise<WorkflowStepResult> {
      const nextTask = updateTask(task, 'qa', 'active');
      const event = createEvent(task.id, 'qa-requested', instructions ? { instructions } : undefined);
      await hooks.sendToQa({ task: nextTask, instructions });
      return persistStep(nextTask, event);
    },

    async qaLoop(task: PiAvicennaTask, notes?: Record<string, unknown>): Promise<WorkflowStepResult> {
      const nextTask = advanceQaStage(task, 'retry');
      const event = createEvent(task.id, 'qa-failed', notes);
      return persistStep(nextTask, event);
    },

    async requestFix(task: PiAvicennaTask, instructions?: string): Promise<WorkflowStepResult> {
      return requestFixStep(task, instructions);
    },

    async retest(task: PiAvicennaTask, outcome: QaOutcome, notes?: Record<string, unknown>): Promise<WorkflowStepResult> {
      return retestStep(task, outcome, notes);
    },

    async fixAndRetest(task: PiAvicennaTask, outcome: QaOutcome, instructions?: string): Promise<WorkflowStepResult> {
      const fixed = await requestFixStep(task, instructions);
      return retestStep(fixed.task, outcome, instructions ? { instructions } : undefined);
    },

    async complete(task: PiAvicennaTask, notes?: Record<string, unknown>): Promise<WorkflowArchiveResult> {
      const completedTask = updateTask(task, 'completion', 'done');
      const completionEvent = createEvent(task.id, 'stage-changed', {
        stage: 'completion',
        ...notes,
      });
      const completed = await persistStep(completedTask, completionEvent);
      return archiveTask(completed.task, notes);
    },

    async archive(task: PiAvicennaTask, notes?: Record<string, unknown>): Promise<WorkflowArchiveResult> {
      return archiveTask(task, notes);
    },
  };
}
