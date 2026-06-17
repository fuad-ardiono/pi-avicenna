import { basename, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';

export function findProjectRoot(startDir: string): string {
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

export const projectRoot = findProjectRoot(process.cwd());
export const repoName = basename(projectRoot);
export const localAvicennaRoot = resolve(projectRoot, '.avicenna');
export const localStateRoot = resolve(localAvicennaRoot, 'state');
export const localHubRoot = resolve(localAvicennaRoot, 'hub');
export const localDraftRoot = resolve(localAvicennaRoot, 'draft');
export const localArchiveRoot = resolve(localAvicennaRoot, 'archive');
export const localTasksRoot = localHubRoot;
export const agentRoot = resolve(homedir(), '.avicenna-agent');
export const agentProjectRoot = resolve(agentRoot, 'project', repoName);
export const agentArchiveRoot = resolve(agentProjectRoot, 'archive');
export const agentSkillsRoot = resolve(agentRoot, 'skills');
export const agentAgentsRoot = resolve(agentRoot, 'agents');
export const agentScriptsRoot = resolve(agentRoot, 'scripts');
export const agentConfigRoot = resolve(agentRoot, 'config');
export const agentBootstrapRoot = resolve(agentRoot, 'bootstrap');
export const agentExtensionsRoot = resolve(agentRoot, 'extensions');
