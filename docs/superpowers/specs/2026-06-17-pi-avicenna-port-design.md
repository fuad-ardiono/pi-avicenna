# Pi Avicenna Port Design

## Goal
Port `mothershipv2` concepts into `pi-avicenna` as a Pi-native workflow harness that runs cleanly inside Pi, keeps the project repo uncluttered, and supports install/update via the Pi plugin GitHub flow.

## Requirements
- Run inside Pi only; no standalone CLI is required.
- Keep project directories clean.
  - Repo-local state lives only in `./.avicenna/`.
  - `./.avicenna/` is gitignored.
- Core engine assets live in `~/.avicenna-agent`.
  - skills
  - scripts
  - config
  - bootstrap/update logic
- `./.avicenna/` contains state only:
  - hub/runtime state
  - current task
  - archive mirror
- Mandatory bundled capabilities:
  - `obra`
  - `pr_monkey`
  - `qa`
- Integrate with pi-crew when performing coding or QA work.
- Auto-bootstrap and auto-update `~/.avicenna-agent` on Pi plugin install/update.
- Use Pi-native conventions, not mothershipv2 file formats.
- Preserve the lifecycle semantics:
  - capture → active → archive
- Support the minimum workflow stages:
  - intake
  - planning
  - coding
  - qa
  - qa loops
  - fix issues found in QA
  - completion
- Automatic task capture from workflow events.
- Archive tasks to both locations:
  - `./.avicenna/archive`
  - `~/.avicenna-agent/project/{repo-name}/archive`

## Architecture

### 1. Pi Plugin Layer
The plugin is the user-facing entrypoint inside Pi. It triggers the workflow, surfaces current task state, and delegates all engine behavior to the user-level install under `~/.avicenna-agent`.

### 2. User-Level Engine
`~/.avicenna-agent` is the durable runtime and knowledge layer. It stores:
- shared config
- reusable skills and scripts
- bootstrap/update logic
- project-level mirrored archives
- mandatory workflows/tools (`obra`, `pr_monkey`, `qa`)
- pi-crew integration used for coding and QA delegation

### 3. Project State Layer
`./.avicenna/` is the repo-local state layer. It stores only ephemeral project state and mirrored archives. It must not introduce extra top-level clutter in the repository.

## Workflow

### Intake
- Detect or receive a task from Pi workflow events.
- Capture the task automatically.
- Assign it a current status and store it in `.avicenna/`.

### Planning
- Create the execution path for the task.
- Preserve the same lifecycle semantics as mothershipv2, but use Pi-native data structures and naming.

### Coding
- Execute the planned work through the Pi workflow harness.
- Use pi-crew for coding tasks when execution is delegated.
- Keep implementation details in the engine layer, not the repo-local state layer.

### QA
- Run QA after coding.
- Use pi-crew for QA tasks and QA loop handling.
- Support QA loops when issues are found.
- Route fixes back into coding, then return to QA.

### Completion
- Mark the task complete only after QA passes.
- Archive the task to both archive locations.
- Preserve traceability for orchestration and knowledge reuse.

## Data Flow
1. Pi workflow event triggers intake.
2. Engine records current task in `./.avicenna/`.
3. Planning and coding execute through the user-level engine.
4. QA runs and may loop back to coding.
5. Completion archives the task to both archive paths.
6. Archived data remains available for orchestration and knowledge-agent reuse.

## Non-Goals
- Do not preserve mothershipv2 file formats.
- Do not require a standalone CLI.
- Do not place engine assets in the project repo.
- Do not add extra repo root folders beyond `.avicenna/`.

## Risks
- Bootstrap/update drift between plugin code and `~/.avicenna-agent`.
- Archive mirroring inconsistencies if one path fails.
- QA loop complexity if state transitions are not strictly controlled.
- Pi plugin installation constraints may require careful separation between repo-local state and user-level runtime assets.

## Verification
- Plugin installs and updates `~/.avicenna-agent` automatically.
- Workflow runs inside Pi.
- Repo remains clean except for gitignored `.avicenna/`.
- Task capture happens automatically.
- QA loops work and can send tasks back to coding.
- Archive exists in both required locations.
- Mandatory `obra`, `pr_monkey`, and `qa` capabilities are available.
- pi-crew is integrated for coding and QA delegation.

## Acceptance Criteria
- A new task can move from intake to completion entirely inside Pi.
- The repo contains only `.avicenna/` for local state.
- `~/.avicenna-agent` contains the engine and config.
- Archived tasks are mirrored in both archive locations.
- The workflow supports QA failures and fixes before completion.
