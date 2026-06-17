import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ArchiveRecord } from './state.js';

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export async function mirrorArchiveRecord(targetPaths: readonly string[], record: ArchiveRecord): Promise<void> {
  await Promise.all(targetPaths.map((targetPath) => writeJson(targetPath, record)));
}

export function archiveFileName(taskId: string): string {
  return `${taskId}.json`;
}

export function archiveTargetPaths(localArchiveRoot: string, agentArchiveRoot: string, taskId: string): string[] {
  return [join(localArchiveRoot, archiveFileName(taskId)), join(agentArchiveRoot, archiveFileName(taskId))];
}
