import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { renderArchiveMarkdown } from './markdown.js';
import type { ArchiveRecord } from './state.js';

async function writeMarkdown(path: string, value: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${value.endsWith('\n') ? value : `${value}\n`}`, 'utf8');
}

export async function mirrorArchiveRecord(targetPaths: readonly string[], record: ArchiveRecord): Promise<void> {
  const content = renderArchiveMarkdown(record);
  await Promise.all(targetPaths.map((targetPath) => writeMarkdown(targetPath, content)));
}

export function archiveFileName(taskId: string): string {
  return `${taskId}.md`;
}

export function archiveTargetPaths(localArchiveRoot: string, agentArchiveRoot: string, taskId: string): string[] {
  return [join(localArchiveRoot, archiveFileName(taskId)), join(agentArchiveRoot, archiveFileName(taskId))];
}
