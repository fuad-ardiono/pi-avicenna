import type { WorkflowStage } from './state.js';

export type SkillCategory = 'core' | 'obra' | 'git' | 'setup';

export interface SkillDefinition {
  /** Unique skill name, e.g. 'obra/brainstorming' */
  name: string;
  /** Category for grouping */
  category: SkillCategory;
  /** Which workflow phases this skill is used in */
  phases: WorkflowStage[];
  /** Whether the skill is mandatory for the phases it's mapped to */
  required: boolean;
  /** Short description */
  description: string;
}

/**
 * Canonical skill registry for pi-avicenna.
 *
 * This is the single source of truth for which skills are available
 * and which phases they belong to. The workflow harness reads this
 * to record active skills per phase and verify availability during warmup.
 */
export const SKILLS: readonly SkillDefinition[] = [
  // --- Core workflow skills ---
  {
    name: 'task-intake-and-decomposition',
    category: 'core',
    phases: ['intake'],
    required: true,
    description: 'Turn an incoming request into an actionable execution plan with scoping, decomposition, and success criteria',
  },
  {
    name: 'risk-assessment',
    category: 'core',
    phases: ['intake'],
    required: true,
    description: 'Classify task risk before choosing execution strategy',
  },
  {
    name: 'research-execution',
    category: 'core',
    phases: ['research'],
    required: true,
    description: 'Investigate a task before implementation planning with hypothesis formation and context gathering',
  },
  {
    name: 'parallelization-decision',
    category: 'core',
    phases: ['planning'],
    required: true,
    description: 'Decide whether work should be assigned to one coder or multiple in parallel',
  },
  {
    name: 'worktree-management',
    category: 'core',
    phases: ['planning', 'coding', 'completion'],
    required: false,
    description: 'Manage isolated git worktrees for coder agents',
  },
  {
    name: 'qa-review-loop',
    category: 'core',
    phases: ['qa', 'qa_loop', 'fixing'],
    required: true,
    description: 'Review cycle between coder agents, QA, and commander',
  },
  {
    name: 'human-escalation',
    category: 'core',
    phases: ['intake', 'research', 'planning', 'coding', 'qa', 'qa_loop', 'fixing', 'completion'],
    required: false,
    description: 'Request human input when escalation triggers are met',
  },
  {
    name: 'github-issue-management',
    category: 'core',
    phases: ['intake', 'planning', 'completion'],
    required: false,
    description: 'Use GitHub issues as durable workflow artifacts',
  },

  // --- Obra skills ---
  {
    name: 'obra/brainstorming',
    category: 'obra',
    phases: ['intake', 'research', 'planning'],
    required: true,
    description: 'Explore intent, requirements, and design before implementation',
  },
  {
    name: 'obra/superpowers',
    category: 'obra',
    phases: ['research'],
    required: true,
    description: 'Broad context gathering and option mapping for research',
  },
  {
    name: 'obra/making-plans',
    category: 'obra',
    phases: ['research', 'planning'],
    required: true,
    description: 'Turn explored requirements into an explicit implementation plan',
  },
  {
    name: 'obra/executing-plans',
    category: 'obra',
    phases: ['coding', 'fixing'],
    required: true,
    description: 'Execute an approved implementation plan step-by-step',
  },
  {
    name: 'obra/systematical-debugging',
    category: 'obra',
    phases: ['fixing'],
    required: true,
    description: 'Structured debugging after QA feedback',
  },
  {
    name: 'obra/creating-plan',
    category: 'obra',
    phases: ['planning'],
    required: false,
    description: 'Structured plan creation helper',
  },

  // --- Git skills ---
  {
    name: 'commit',
    category: 'git',
    phases: ['completion'],
    required: false,
    description: 'Create a local git commit for scoped changes',
  },
  {
    name: 'commit-push',
    category: 'git',
    phases: ['completion'],
    required: false,
    description: 'Commit and push the current branch to remote',
  },
  {
    name: 'create-pr',
    category: 'git',
    phases: ['completion'],
    required: false,
    description: 'Create a pull request for the current branch',
  },
  {
    name: 'pr-maintainer',
    category: 'git',
    phases: ['completion'],
    required: false,
    description: 'Maintain a PR through GitHub CLI with feedback routing',
  },

  // --- Setup skills (not phase-bound, used during warmup) ---
  {
    name: 'pi-avicenna-setup',
    category: 'setup',
    phases: [],
    required: false,
    description: 'Configure the pi-avicenna wiki for the current project',
  },
  {
    name: 'model-policy-setup',
    category: 'setup',
    phases: [],
    required: false,
    description: 'Bootstrap pi-avicenna model policy config',
  },
] as const;

export interface PhaseSkillSet {
  phase: WorkflowStage;
  required: SkillDefinition[];
  optional: SkillDefinition[];
}

/**
 * Get all skills mapped to a specific workflow phase.
 */
export function getSkillsForPhase(phase: WorkflowStage): PhaseSkillSet {
  const required: SkillDefinition[] = [];
  const optional: SkillDefinition[] = [];

  for (const skill of SKILLS) {
    if (skill.phases.includes(phase)) {
      if (skill.required) {
        required.push(skill);
      } else {
        optional.push(skill);
      }
    }
  }

  return { phase, required, optional };
}

/**
 * Get all required skills across all phases.
 * Used by warmup to verify skill availability.
 */
export function getRequiredSkills(): SkillDefinition[] {
  return SKILLS.filter((skill) => skill.required);
}

/**
 * Get all skills in a given category.
 */
export function getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
  return SKILLS.filter((skill) => skill.category === category);
}

/**
 * Resolve the expected file path for a skill's SKILL.md
 * relative to a skills root directory.
 */
export function skillRelativePath(skillName: string): string {
  return `${skillName}/SKILL.md`;
}
