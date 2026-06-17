import { mkdir } from 'node:fs/promises';
import {
  agentArchiveRoot,
  agentBootstrapRoot,
  agentConfigRoot,
  agentProjectRoot,
  agentRoot,
  agentSkillsRoot,
  localArchiveRoot,
  localAvicennaRoot,
  localHubRoot,
  localStateRoot,
  localTasksRoot,
  projectRoot,
  repoName,
} from './config.js';
import { registerCapabilities, requiredCapabilities } from './capabilities.js';
import type { RuntimeManifest } from './state.js';

export interface BootstrapResult {
  manifest: RuntimeManifest;
  createdDirectories: string[];
}

export async function bootstrapRuntime(): Promise<BootstrapResult> {
  const createdDirectories = [
    localAvicennaRoot,
    localStateRoot,
    localHubRoot,
    localTasksRoot,
    localArchiveRoot,
    agentRoot,
    agentProjectRoot,
    agentArchiveRoot,
    agentSkillsRoot,
    agentConfigRoot,
    agentBootstrapRoot,
  ];

  await Promise.all(createdDirectories.map((directory) => mkdir(directory, { recursive: true })));

  const capabilities = registerCapabilities(requiredCapabilities);

  return {
    createdDirectories,
    manifest: {
      repoName,
      projectRoot,
      localAvicennaRoot,
      localStateRoot,
      localHubRoot,
      localTasksRoot,
      localArchiveRoot,
      agentRoot,
      agentProjectRoot,
      agentArchiveRoot,
      mandatoryCapabilities: capabilities.registered,
      qaLoopEnabled: true,
    },
  };
}

export const bootstrapContext = {
  projectRoot,
  repoName,
  localAvicennaRoot,
  localStateRoot,
  localHubRoot,
  localTasksRoot,
  localArchiveRoot,
  agentRoot,
  agentProjectRoot,
  agentArchiveRoot,
};
