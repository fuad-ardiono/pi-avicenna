#!/usr/bin/env bash
# kb-stale.sh — Report stale wiki pages
# Usage: bash skills/pi-avicenna/scripts/kb-stale.sh
set -euo pipefail

# Allow override for installed-package scenario; fall back to script-relative path
if [ -n "${PI_AVICENNA_PROJECT_ROOT:-}" ]; then
  repo_root="${PI_AVICENNA_PROJECT_ROOT}"
else
  repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
fi
wiki_config="${repo_root}/.avicenna/wiki.yaml"
helper="${repo_root}/skills/pi-avicenna/scripts/wiki-hygiene.py"

if [ ! -f "${wiki_config}" ]; then
  echo "No wiki configured (${wiki_config} not found)."
  exit 0
fi

python3 "${helper}" kb-stale --config "${wiki_config}"
