import { join } from 'node:path';
import { renderTaskMarkdown, writeMarkdown } from './markdown.js';
import type { PiAvicennaTask, WorkflowEvent } from './state.js';

export interface TaskCaptureEnvelope {
  task: PiAvicennaTask;
  event: WorkflowEvent;
}

export async function captureTask(
  stateRoot: string,
  hubRoot: string,
  draftRoot: string,
  envelope: TaskCaptureEnvelope,
): Promise<void> {
  const currentTaskPath = join(stateRoot, 'current-task.md');
  const hubTaskPath = join(hubRoot, 'current-task.md');
  const draftTaskPath = join(draftRoot, 'current-task.md');
  const content = [
    renderTaskMarkdown(envelope.task),
    '',
    '## Latest event',
    `- **Event**: ${envelope.event.kind}`,
    `- **Event ID**: ${envelope.event.id}`,
    `- **Occurred**: ${envelope.event.occurredAt}`,
  ].join('\n');

  await Promise.all([
    writeMarkdown(currentTaskPath, content),
    writeMarkdown(hubTaskPath, content),
    writeMarkdown(draftTaskPath, content),
  ]);
}
