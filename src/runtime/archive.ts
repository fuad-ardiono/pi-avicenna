import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
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

/**
 * Copy all per-phase task record files from the task records directory
 * into the archive directory, preserving the `tasks/<taskId>/` structure.
 *
 * Source: `<taskRecordsRoot>/tasks/<taskId>/*.md`
 * Dest:   `<archiveRoot>/<taskId>/tasks/*.md`
 */
export async function archiveTaskRecords(
  taskRecordsRoots: readonly string[],
  archiveRoots: readonly string[],
  taskId: string,
): Promise<string[]> {
  const archivedFiles: string[] = [];
  const taskDir = join('tasks', taskId);

  for (const recordsRoot of taskRecordsRoots) {
    const sourceDir = join(recordsRoot, taskDir);
    let entries: string[];
    try {
      entries = await readdir(sourceDir);
    } catch {
      // Directory may not exist if no records were written here
      continue;
    }

    const mdFiles = entries.filter((name) => name.endsWith('.md'));

    for (const archiveRoot of archiveRoots) {
      const destDir = join(archiveRoot, taskId, 'tasks');
      await mkdir(destDir, { recursive: true });

      for (const fileName of mdFiles) {
        const src = join(sourceDir, fileName);
        const dest = join(destDir, fileName);
        const fileContent = await readFile(src, 'utf8');
        await writeFile(dest, fileContent, 'utf8');
        archivedFiles.push(dest);
      }
    }
  }

  return archivedFiles;
}

export function archiveFileName(taskId: string): string {
  return `${taskId}.md`;
}

export function archiveTargetPaths(localArchiveRoot: string, agentArchiveRoot: string, taskId: string): string[] {
  return [join(localArchiveRoot, archiveFileName(taskId)), join(agentArchiveRoot, archiveFileName(taskId))];
}
