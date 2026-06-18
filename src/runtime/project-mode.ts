import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { bootstrapRuntime, type BootstrapResult } from './bootstrap.js';
import { getRequiredSkills, skillRelativePath } from './skill-registry.js';

export interface SkillPreflightResult {
  name: string;
  found: boolean;
  path?: string;
}

export interface PiAvicennaWarmupResult {
  bootstrap: BootstrapResult;
  warmupMarkdown: string;
  loadedFiles: string[];
  skillPreflight: SkillPreflightResult[];
  missingSkills: string[];
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

/**
 * Verify that all required skills have their SKILL.md files present
 * in the home install skills root.
 */
function preflightSkills(skillsRoot: string): {
  results: SkillPreflightResult[];
  missing: string[];
} {
  const required = getRequiredSkills();
  const results: SkillPreflightResult[] = [];
  const missing: string[] = [];

  for (const skill of required) {
    const relPath = skillRelativePath(skill.name);
    const fullPath = join(skillsRoot, relPath);
    const found = existsSync(fullPath);

    results.push({
      name: skill.name,
      found,
      path: found ? fullPath : undefined,
    });

    if (!found) {
      missing.push(skill.name);
    }
  }

  return { results, missing };
}

export async function warmupPiAvicennaProjectMode(): Promise<PiAvicennaWarmupResult> {
  const bootstrap = await bootstrapRuntime();
  const manifestPath = join(bootstrap.manifest.localStateRoot, 'manifest.md');
  const currentTaskPath = join(bootstrap.manifest.localStateRoot, 'current-task.md');
  const hubPath = join(bootstrap.manifest.localHubRoot, 'current-task.md');
  const draftPath = join(bootstrap.manifest.localDraftRoot, 'current-task.md');
  const agentProjectTaskPath = join(bootstrap.manifest.agentProjectStateRoot, 'current-task.md');
  const agentProjectHubPath = join(bootstrap.manifest.agentProjectHubRoot, 'current-task.md');

  const loadedFiles: string[] = [];
  const manifest = await readMaybe(manifestPath);
  const currentTask = await readMaybe(currentTaskPath);
  const hub = await readMaybe(hubPath);
  const draft = await readMaybe(draftPath);

  const agentProjectTask = await readMaybe(agentProjectTaskPath);
  const agentProjectHub = await readMaybe(agentProjectHubPath);

  // Scan task records directories for existing phase files
  const taskRecordDirs = [
    bootstrap.manifest.localTaskRecordsRoot,
    bootstrap.manifest.agentProjectTaskRecordsRoot,
  ];
  const taskRecordFiles: string[] = [];
  for (const recordsRoot of taskRecordDirs) {
    if (!existsSync(recordsRoot)) continue;
    const taskDirs = readdirSync(recordsRoot, { withFileTypes: true });
    for (const taskDir of taskDirs) {
      if (!taskDir.isDirectory()) continue;
      const taskRoot = join(recordsRoot, taskDir.name);
      const files = readdirSync(taskRoot);
      for (const file of files) {
        if (file.endsWith('.md')) {
          taskRecordFiles.push(join(taskRoot, file));
        }
      }
    }
  }

  if (manifest) loadedFiles.push(manifestPath);
  if (currentTask) loadedFiles.push(currentTaskPath);
  if (hub) loadedFiles.push(hubPath);
  if (draft) loadedFiles.push(draftPath);
  if (agentProjectTask) loadedFiles.push(agentProjectTaskPath);
  if (agentProjectHub) loadedFiles.push(agentProjectHubPath);
  for (const recordFile of taskRecordFiles) {
    loadedFiles.push(recordFile);
  }

  // Skill preflight — verify required skills are installed
  const { results: skillPreflight, missing: missingSkills } = preflightSkills(
    bootstrap.manifest.agentSkillsRoot,
  );

  const skillStatusLines = skillPreflight.map((result) => {
    const icon = result.found ? '[ok]' : '[missing]';
    const path = result.found ? ` (${result.path})` : '';
    return `- ${icon} \`${result.name}\`${path}`;
  });

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
    '## Skill preflight',
    ...skillStatusLines,
    ...(missingSkills.length > 0 ? ['', `**Missing ${missingSkills.length} required skill(s):** ${missingSkills.join(', ')}`] : []),
    '',
    '## Next step',
    missingSkills.length > 0
      ? 'Resolve missing skills before proceeding with orchestration.'
      : 'Chat normally in Pi.',
  ].join('\n');

  return {
    bootstrap,
    warmupMarkdown,
    loadedFiles,
    skillPreflight,
    missingSkills,
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
