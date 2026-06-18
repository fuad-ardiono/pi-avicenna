import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export type WorkflowStage =
  | 'intake'
  | 'research'
  | 'planning'
  | 'coding'
  | 'qa'
  | 'qa_loop'
  | 'fixing'
  | 'completion'
  | 'archive';

export type TaskStatus = 'captured' | 'active' | 'blocked' | 'done' | 'archived';

export interface PiAvicennaTask {
  id: string;
  title: string;
  description?: string;
  stage: WorkflowStage;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface RuntimePaths {
  projectRoot: string;
  localAvicennaRoot: string;
  localStateRoot: string;
  localHubRoot: string;
  localDraftRoot: string;
  localArchiveRoot: string;
  localTasksRoot: string;
  localTaskRecordsRoot: string;
  agentRoot: string;
  agentProjectRoot: string;
  agentProjectStateRoot: string;
  agentProjectHubRoot: string;
  agentProjectDraftRoot: string;
  agentProjectTaskRecordsRoot: string;
  agentArchiveRoot: string;
  agentSkillsRoot: string;
  agentAgentsRoot: string;
  agentScriptsRoot: string;
  agentConfigRoot: string;
  agentBootstrapRoot: string;
  agentExtensionsRoot: string;
}

export interface RuntimeManifest extends RuntimePaths {
  repoName: string;
  mandatoryCapabilities: string[];
  currentTaskId?: string;
  qaLoopEnabled: boolean;
}

export interface WorkflowEvent {
  id: string;
  kind:
    | 'task-captured'
    | 'stage-changed'
    | 'research-started'
    | 'planning-started'
    | 'coding-requested'
    | 'qa-requested'
    | 'qa-failed'
    | 'qa-passed'
    | 'fix-requested'
    | 'retest-requested'
    | 'archived';
  taskId: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
}

export interface PhaseRecord {
  id: string;
  taskId: string;
  phase: WorkflowStage;
  actor: 'commander' | 'researcher' | 'coder' | 'qa' | 'pr_monkey';
  summary: string;
  details?: string;
  skills: string[];
  occurredAt: string;
}

export interface ArchiveRecord {
  task: PiAvicennaTask;
  manifest: RuntimeManifest;
  capturedEvents: WorkflowEvent[];
  phaseRecords: PhaseRecord[];
}

export async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function appendJsonLine(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(value)}\n`, 'utf8');
}
