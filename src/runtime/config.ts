import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';

const moduleDir = dirname(fileURLToPath(import.meta.url));

function findProjectRoot(startDir: string): string {
  let currentDir = startDir;

  while (true) {
    if (existsSync(resolve(currentDir, 'package.json'))) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return startDir;
    }

    currentDir = parentDir;
  }
}

export const projectRoot = findProjectRoot(moduleDir);
export const repoName = basename(projectRoot);
export const localAvicennaRoot = resolve(projectRoot, '.avicenna');
export const localStateRoot = resolve(localAvicennaRoot, 'state');
export const localHubRoot = resolve(localAvicennaRoot, 'hub');
export const localTasksRoot = resolve(localAvicennaRoot, 'tasks');
export const localArchiveRoot = resolve(localAvicennaRoot, 'archive');
export const agentRoot = resolve(homedir(), '.aviceena-agent');
export const agentProjectRoot = resolve(agentRoot, 'project', repoName);
export const agentArchiveRoot = resolve(agentProjectRoot, 'archive');
export const agentSkillsRoot = resolve(agentRoot, 'skills');
export const agentConfigRoot = resolve(agentRoot, 'config');
export const agentBootstrapRoot = resolve(agentRoot, 'bootstrap');
