import { join } from 'node:path';
import { renderTaskMarkdown, writeMarkdown } from './markdown.js';
import type { PiAvicennaTask, RuntimeManifest, WorkflowEvent } from './state.js';

export interface TaskCaptureEnvelope {
  task: PiAvicennaTask;
  event: WorkflowEvent;
}

export async function captureTask(
  manifest: RuntimeManifest,
  envelope: TaskCaptureEnvelope,
): Promise<void> {
  const content = [
    renderTaskMarkdown(envelope.task),
    '',
    '## Latest event',
    `- **Event**: ${envelope.event.kind}`,
    `- **Event ID**: ${envelope.event.id}`,
    `- **Occurred**: ${envelope.event.occurredAt}`,
  ].join('\n');

  const writeTargets = [
    join(manifest.localStateRoot, 'current-task.md'),
    join(manifest.localHubRoot, 'current-task.md'),
    join(manifest.localDraftRoot, 'current-task.md'),
    join(manifest.agentProjectStateRoot, 'current-task.md'),
    join(manifest.agentProjectHubRoot, 'current-task.md'),
    join(manifest.agentProjectDraftRoot, 'current-task.md'),
  ];

  await Promise.all(writeTargets.map((path) => writeMarkdown(path, content)));
}
