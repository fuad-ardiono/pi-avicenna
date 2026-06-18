# pi-avicenna

Pi Avicenna is a Pi package that installs orchestration skills plus the `pi_avicenna_spawn` delegation extension.

## Install

From this repository:

```bash
npm install
npm run build
pi install .
```

Or smoke-test the extension entrypoint without writing Pi settings:

```bash
pi -e ./assets/extensions/subagent.ts
```

For full package testing, use `pi install .`, then restart Pi or run `/reload`.

## Use

Invoke the package explicitly:

```text
/pi-avicenna
```

You can also invoke the skill directly:

```text
/skill:pi-avicenna
```

The package exposes:

- `assets/extensions/subagent.ts` — registers the `pi_avicenna_spawn` tool.
- `assets/skills/pi-avicenna/SKILL.md` — front door skill.
- `assets/agents/` and `assets/config/` — bundled role contracts and defaults used by the extension.

## Verify package contents

```bash
npm run check
npm pack --dry-run
```

The dry-run output should include `assets/extensions/subagent.ts`, `assets/extensions/pi-routing.js`, and `assets/skills/pi-avicenna/SKILL.md`.
