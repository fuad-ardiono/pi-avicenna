import { mkdir } from 'node:fs/promises';
import {
  agentAgentsRoot,
  agentArchiveRoot,
  agentBootstrapRoot,
  agentConfigRoot,
  agentExtensionsRoot,
  agentProjectDraftRoot,
  agentProjectHubRoot,
  agentProjectRoot,
  agentProjectStateRoot,
  agentProjectTaskRecordsRoot,
  agentRoot,
  agentScriptsRoot,
  agentSkillsRoot,
  localArchiveRoot,
  localAvicennaRoot,
  localDraftRoot,
  localHubRoot,
  localStateRoot,
  localTaskRecordsRoot,
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
    localTaskRecordsRoot,
    agentRoot,
    agentProjectRoot,
    agentProjectStateRoot,
    agentProjectHubRoot,
    agentProjectDraftRoot,
    agentProjectTaskRecordsRoot,
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
    localTaskRecordsRoot,
    agentRoot,
    agentProjectRoot,
    agentProjectStateRoot,
    agentProjectHubRoot,
    agentProjectDraftRoot,
    agentProjectTaskRecordsRoot,
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
      localTaskRecordsRoot,
      localArchiveRoot,
      agentRoot,
      agentProjectRoot,
      agentProjectStateRoot,
      agentProjectHubRoot,
      agentProjectDraftRoot,
      agentProjectTaskRecordsRoot,
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
  localTaskRecordsRoot,
  localArchiveRoot,
  agentRoot,
  agentProjectRoot,
  agentProjectStateRoot,
  agentProjectHubRoot,
  agentProjectDraftRoot,
  agentProjectTaskRecordsRoot,
  agentArchiveRoot,
  agentSkillsRoot,
  agentAgentsRoot,
  agentScriptsRoot,
  agentConfigRoot,
  agentBootstrapRoot,
  agentExtensionsRoot,
};
