import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RuntimePaths } from './state.js';

export interface HomeInstallResult {
  createdDirectories: string[];
  seededFiles: string[];
}

export type HomeInstallManifest = RuntimePaths & {
  repoName: string;
};

const runtimeDir = dirname(fileURLToPath(import.meta.url));
const bundledAssetsRoot = resolve(runtimeDir, '../../../assets');

async function ensureMarkdown(path: string, content: string): Promise<boolean> {
  await mkdir(dirname(path), { recursive: true });

  try {
    await writeFile(path, `${content.endsWith('\n') ? content : `${content}\n`}`, { flag: 'wx', encoding: 'utf8' });
    return true;
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'EEXIST') {
      return false;
    }

    throw error;
  }
}

async function copyTree(sourceRoot: string, targetRoot: string): Promise<string[]> {
  const createdFiles: string[] = [];
  const entries = await readdir(sourceRoot, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceRoot, entry.name);
    const targetPath = join(targetRoot, entry.name);

    if (entry.isDirectory()) {
      await mkdir(targetPath, { recursive: true });
      createdFiles.push(...await copyTree(sourcePath, targetPath));
      continue;
    }

    const content = await readFile(sourcePath, 'utf8');
    const created = await ensureMarkdown(targetPath, content);
    if (created) createdFiles.push(targetPath);
  }

  return createdFiles;
}

export async function ensureHomeInstall(manifest: HomeInstallManifest): Promise<HomeInstallResult> {
  const createdDirectories = [
    manifest.agentRoot,
    manifest.agentProjectRoot,
    manifest.agentArchiveRoot,
    manifest.agentSkillsRoot,
    manifest.agentAgentsRoot,
    manifest.agentScriptsRoot,
    manifest.agentConfigRoot,
    manifest.agentBootstrapRoot,
    manifest.agentExtensionsRoot,
  ];

  await Promise.all(createdDirectories.map((directory) => mkdir(directory, { recursive: true })));

  const seededFiles = [
    ...(await copyTree(join(bundledAssetsRoot, 'skills'), manifest.agentSkillsRoot)),
    ...(await copyTree(join(bundledAssetsRoot, 'agents'), manifest.agentAgentsRoot)),
    ...(await copyTree(join(bundledAssetsRoot, 'extensions'), manifest.agentExtensionsRoot)),
    ...(await copyTree(join(bundledAssetsRoot, 'config'), manifest.agentConfigRoot)),
  ];

  return {
    createdDirectories,
    seededFiles,
  };
}
