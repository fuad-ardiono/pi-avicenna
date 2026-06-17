import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { ArchiveRecord, PiAvicennaTask, RuntimeManifest, WorkflowEvent } from './state.js';

async function writeMarkdown(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${content.endsWith('\n') ? content : `${content}\n`}`, 'utf8');
}

function bullet(label: string, value: string | undefined): string | undefined {
  return value && value.length > 0 ? `- **${label}**: ${value}` : undefined;
}

export function renderTaskMarkdown(task: PiAvicennaTask): string {
  const lines = [
    `# ${task.title}`,
    '',
    bullet('Task ID', task.id),
    bullet('Stage', task.stage),
    bullet('Status', task.status),
    bullet('Source', task.source),
    bullet('Created', task.createdAt),
    bullet('Updated', task.updatedAt),
    '',
    task.description ? '## Description' : undefined,
    task.description,
    '',
    task.metadata ? '## Metadata' : undefined,
    task.metadata ? '```json' : undefined,
    task.metadata ? JSON.stringify(task.metadata, null, 2) : undefined,
    task.metadata ? '```' : undefined,
  ];

  return lines.filter((line) => line !== undefined).join('\n').trimEnd();
}

export function renderManifestMarkdown(manifest: RuntimeManifest): string {
  const lines = [
    '# Pi Avicenna Manifest',
    '',
    bullet('Repo', manifest.repoName),
    bullet('Project root', manifest.projectRoot),
    bullet('Local avicenna', manifest.localAvicennaRoot),
    bullet('State', manifest.localStateRoot),
    bullet('Hub', manifest.localHubRoot),
    bullet('Draft', manifest.localDraftRoot),
    bullet('Archive', manifest.localArchiveRoot),
    bullet('Agent root', manifest.agentRoot),
    bullet('Agent project', manifest.agentProjectRoot),
    bullet('Agent archive', manifest.agentArchiveRoot),
    bullet('Agent skills', manifest.agentSkillsRoot),
    bullet('Agent agents', manifest.agentAgentsRoot),
    bullet('Agent scripts', manifest.agentScriptsRoot),
    bullet('Agent config', manifest.agentConfigRoot),
    bullet('Agent bootstrap', manifest.agentBootstrapRoot),
    bullet('Agent extensions', manifest.agentExtensionsRoot),
    bullet('Capabilities', manifest.mandatoryCapabilities.join(', ')),
    bullet('Current task', manifest.currentTaskId),
    bullet('QA loop enabled', String(manifest.qaLoopEnabled)),
  ];

  return lines.filter((line) => line !== undefined).join('\n').trimEnd();
}

export function renderEventMarkdown(event: WorkflowEvent): string {
  const lines = [
    `# Event ${event.kind}`,
    '',
    bullet('Event ID', event.id),
    bullet('Task ID', event.taskId),
    bullet('Occurred', event.occurredAt),
    '',
    event.payload ? '## Payload' : undefined,
    event.payload ? '```json' : undefined,
    event.payload ? JSON.stringify(event.payload, null, 2) : undefined,
    event.payload ? '```' : undefined,
  ];

  return lines.filter((line) => line !== undefined).join('\n').trimEnd();
}

export function renderArchiveMarkdown(record: ArchiveRecord): string {
  const eventSummary = record.capturedEvents.length > 0
    ? record.capturedEvents.map((event) => `- ${event.occurredAt} — ${event.kind} (${event.id})`).join('\n')
    : '- None';

  return [
    `# Archive ${record.task.id}`,
    '',
    renderTaskMarkdown(record.task),
    '',
    '## Captured events',
    eventSummary,
    '',
    '## Manifest snapshot',
    '```json',
    JSON.stringify(record.manifest, null, 2),
    '```',
  ].join('\n').trimEnd();
}

export { writeMarkdown };
