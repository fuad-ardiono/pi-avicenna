import { mkdir } from 'node:fs/promises';
import {
  agentAgentsRoot,
  agentArchiveRoot,
  agentBootstrapRoot,
  agentConfigRoot,
  agentExtensionsRoot,
  agentProjectRoot,
  agentRoot,
  agentScriptsRoot,
  agentSkillsRoot,
  localArchiveRoot,
  localAvicennaRoot,
  localDraftRoot,
  localHubRoot,
  localStateRoot,
  localTasksRoot,
  projectRoot,
  repoName,
} from './config.js';
import { registerCapabilities, requiredCapabilities } from './capabilities.js';
import { ensureHomeInstall } from './home-install.js';
import type { RuntimeManifest } from './state.js';

export interface BootstrapResult {
  manifest: RuntimeManifest;
  createdDirectories: string[];
  installedDirectories: string[];
  seededFiles: string[];
}

export async function bootstrapRuntime(): Promise<BootstrapResult> {
  const createdDirectories = [
    localAvicennaRoot,
    localStateRoot,
    localHubRoot,
    localDraftRoot,
    localArchiveRoot,
    agentRoot,
    agentProjectRoot,
    agentArchiveRoot,
    agentSkillsRoot,
    agentAgentsRoot,
    agentScriptsRoot,
    agentConfigRoot,
    agentBootstrapRoot,
    agentExtensionsRoot,
  ];

  await Promise.all(createdDirectories.map((directory) => mkdir(directory, { recursive: true })));

  const capabilities = registerCapabilities(requiredCapabilities);
  const install = await ensureHomeInstall({
    repoName,
    projectRoot,
    localAvicennaRoot,
    localStateRoot,
    localHubRoot,
    localDraftRoot,
    localArchiveRoot,
    localTasksRoot,
    agentRoot,
    agentProjectRoot,
    agentArchiveRoot,
    agentSkillsRoot,
    agentAgentsRoot,
    agentScriptsRoot,
    agentConfigRoot,
    agentBootstrapRoot,
    agentExtensionsRoot,
  });

  return {
    createdDirectories,
    installedDirectories: install.createdDirectories,
    seededFiles: install.seededFiles,
    manifest: {
      repoName,
      projectRoot,
      localAvicennaRoot,
      localStateRoot,
      localHubRoot,
      localDraftRoot,
      localTasksRoot,
      localArchiveRoot,
      agentRoot,
      agentProjectRoot,
      agentArchiveRoot,
      agentSkillsRoot,
      agentAgentsRoot,
      agentScriptsRoot,
      agentConfigRoot,
      agentBootstrapRoot,
      agentExtensionsRoot,
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
  localDraftRoot,
  localTasksRoot,
  localArchiveRoot,
  agentRoot,
  agentProjectRoot,
  agentArchiveRoot,
  agentSkillsRoot,
  agentAgentsRoot,
  agentScriptsRoot,
  agentConfigRoot,
  agentBootstrapRoot,
  agentExtensionsRoot,
};
