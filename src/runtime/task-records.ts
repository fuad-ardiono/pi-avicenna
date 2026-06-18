import { join } from 'node:path';
import { phaseRecordFileName, renderPhaseRecordMarkdown, writeMarkdown } from './markdown.js';
import type { PhaseRecord, RuntimeManifest } from './state.js';

/**
 * Write a per-phase task record file to all hub locations.
 *
 * Each phase of a task gets its own timestamped markdown file under
 * `<hub>/tasks/<taskId>/`, e.g.:
 *   tasks/T-20260618-001/2026-06-18T10-30-00-000Z-intake.md
 *   tasks/T-20260618-001/2026-06-18T10-45-00-000Z-research.md
 *   tasks/T-20260618-001/2026-06-18T11-00-00-000Z-planning.md
 *   tasks/T-20260618-001/2026-06-18T11-30-00-000Z-coding.md
 *   tasks/T-20260618-001/2026-06-18T12-00-00-000Z-qa.md
 *
 * Files are written to both the local project hub and the home project hub.
 */
export async function writePhaseRecord(
  manifest: RuntimeManifest,
  record: PhaseRecord,
): Promise<string[]> {
  const content = renderPhaseRecordMarkdown(record);
  const fileName = phaseRecordFileName(record);
  const taskDir = join('tasks', record.taskId);
  const relativePath = join(taskDir, fileName);

  const writeTargets = [
    join(manifest.localTaskRecordsRoot, relativePath),
    join(manifest.agentProjectTaskRecordsRoot, relativePath),
  ];

  await Promise.all(writeTargets.map((path) => writeMarkdown(path, content)));

  return writeTargets;
}
