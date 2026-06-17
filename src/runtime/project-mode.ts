import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { bootstrapRuntime, type BootstrapResult } from './bootstrap.js';

export interface PiAvicennaWarmupResult {
  bootstrap: BootstrapResult;
  warmupMarkdown: string;
  loadedFiles: string[];
}

export interface PiAvicennaCommand {
  name: '/pi-avicenna';
  description: string;
  run(): Promise<PiAvicennaWarmupResult>;
}

async function readMaybe(path: string): Promise<string | undefined> {
  if (!existsSync(path)) {
    return undefined;
  }

  return readFile(path, 'utf8');
}

export async function warmupPiAvicennaProjectMode(): Promise<PiAvicennaWarmupResult> {
  const bootstrap = await bootstrapRuntime();
  const manifestPath = join(bootstrap.manifest.localStateRoot, 'manifest.md');
  const currentTaskPath = join(bootstrap.manifest.localStateRoot, 'current-task.md');
  const hubPath = join(bootstrap.manifest.localHubRoot, 'current-task.md');
  const draftPath = join(bootstrap.manifest.localDraftRoot, 'current-task.md');

  const loadedFiles: string[] = [];
  const manifest = await readMaybe(manifestPath);
  const currentTask = await readMaybe(currentTaskPath);
  const hub = await readMaybe(hubPath);
  const draft = await readMaybe(draftPath);

  if (manifest) loadedFiles.push(manifestPath);
  if (currentTask) loadedFiles.push(currentTaskPath);
  if (hub) loadedFiles.push(hubPath);
  if (draft) loadedFiles.push(draftPath);

  const warmupMarkdown = [
    '# Pi Avicenna Warm-up',
    '',
    '## Loaded directories',
    ...bootstrap.createdDirectories.map((directory) => `- ${directory}`),
    '',
    '## Seeded home install',
    ...(bootstrap.seededFiles.length > 0 ? bootstrap.seededFiles.map((file) => `- ${file}`) : ['- Nothing new seeded']),
    '',
    '## Loaded files',
    ...(loadedFiles.length > 0 ? loadedFiles.map((file) => `- ${file}`) : ['- None yet']),
    '',
    '## Next step',
    'Chat normally in Pi.',
  ].join('\n');

  return {
    bootstrap,
    warmupMarkdown,
    loadedFiles,
  };
}

export function createPiAvicennaCommand(): PiAvicennaCommand {
  return {
    name: '/pi-avicenna',
    description: 'Warm up Pi Avicenna runtime and load project state.',
    async run() {
      return warmupPiAvicennaProjectMode();
    },
  };
}
