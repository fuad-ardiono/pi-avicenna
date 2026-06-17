import { join } from 'node:path';
import { appendJsonLine, writeJsonFile } from './state.js';
import type { PiAvicennaTask, WorkflowEvent } from './state.js';

export interface TaskCaptureEnvelope {
  task: PiAvicennaTask;
  event: WorkflowEvent;
}

export async function captureTask(stateRoot: string, tasksRoot: string, envelope: TaskCaptureEnvelope): Promise<void> {
  const currentTaskPath = join(stateRoot, 'current-task.json');
  const stateEventLogPath = join(stateRoot, 'events.jsonl');
  const taskCurrentPath = join(tasksRoot, 'current-task.json');
  const eventPath = join(tasksRoot, 'events', `${envelope.event.id}.json`);

  await Promise.all([
    writeJsonFile(currentTaskPath, envelope.task),
    writeJsonFile(taskCurrentPath, envelope.task),
    appendJsonLine(stateEventLogPath, envelope.event),
    writeJsonFile(eventPath, envelope.event),
  ]);
}
