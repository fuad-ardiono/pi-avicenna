# Pi Avicenna Project Mode Design

## Summary

Add a manual Pi project mode, triggered with `/pi-avicenna`, that warms up the repo in a native Pi-friendly way and loads reusable runtime assets from the home directory. The project repository stays minimal and only owns `.avicenna/` state. Shared scripts, skills, agents, and home-side archives live under `~/.avicenna-agent`.

## Goals

- Provide a native-feeling Pi project mode for `pi-avicenna` repos.
- Keep the project side limited to `.avicenna/`.
- Install reusable runtime assets to `~/.avicenna-agent`.
- Make `/pi-avicenna` a manual warm-up command, not an auto-start behavior.
- Store task state and archives in Markdown.
- Mirror completed archives to both project and home locations.

## Non-Goals

- No automatic warm-up on project open.
- No task execution policy changes beyond loading and warming up.
- No project-local copies of reusable skills, agents, or scripts.
- No JSON task records for the project workflow files.

## User Experience

1. User opens a repo.
2. User runs `/pi-avicenna` inside Pi.
3. Pi loads the home-side runtime bundle.
4. Pi reads the repo’s `.avicenna/` state.
5. Pi shows a warm-up summary.
6. User continues chatting normally.

## Directory Layout

### Project side

Only these live in the repo:

- `./.avicenna/hub/`
- `./.avicenna/state/current-task.md`
- `./.avicenna/draft/`
- `./.avicenna/archive/`

### Home side

Reusable runtime assets live here:

- `~/.avicenna-agent/skills/`
- `~/.avicenna-agent/agents/`
- `~/.avicenna-agent/scripts/`
- `~/.avicenna-agent/config/`
- `~/.avicenna-agent/project/{repo-name}/archive/`

## File Format

All task and workflow files on the project side are Markdown:

- current task: `current-task.md`
- hub files: Markdown documents
- drafts: Markdown documents
- archives: Markdown documents named by task id

Task IDs are represented in filenames, for example:

- `./.avicenna/archive/abc123.md`
- `~/.avicenna-agent/project/{repo-name}/archive/abc123.md`

## Archive Behavior

When a task reaches completion, Pi must write the archive record to both locations:

- `./.avicenna/archive/{task-id}.md`
- `~/.avicenna-agent/project/{repo-name}/archive/{task-id}.md`

The archive content should be Markdown and preserve the task id in the filename.

## Warm-Up Behavior

The `/pi-avicenna` command should:

1. load the home-side runtime bundle
2. load project-local `.avicenna/` files
3. initialize current task state
4. surface any loaded skills, agents, or scripts relevant to the repo
5. present a short warm-up status
6. return control to normal chat

The command should not force a workflow stage transition by itself.

## Design Choice

Use a Pi extension/command instead of a prompt template.

### Why

- Feels native inside Pi.
- Can perform real warm-up logic.
- Can load home-side resources and project state deterministically.
- Keeps the user interaction as a command, not a pasted prompt.

## Risks and Constraints

- Home-side installation must not overwrite unrelated user files.
- Repo-local state must remain isolated to `.avicenna/`.
- Archive mirroring must keep both destinations in sync.
- Markdown parsing must stay simple and predictable.

## Testing Strategy

- Verify `/pi-avicenna` loads without requiring auto-start.
- Verify project repos only contain `.avicenna/` state.
- Verify home install writes to `~/.avicenna-agent`.
- Verify completion creates matching `.md` archives in both locations.
- Verify current-task, hub, and draft files are Markdown.

## Acceptance Criteria

- Manual `/pi-avicenna` trigger exists.
- Home-side assets install into `~/.avicenna-agent`.
- Project side uses only `.avicenna/`.
- `current-task`, `hub`, `draft`, and archives are Markdown.
- Completed tasks archive to both project and home paths.
- The repo can be warmed up and then used in normal Pi chat.
