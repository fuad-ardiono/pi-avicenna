#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../../.." && pwd)"
validator="${repo_root}/skills/pi-avicenna/scripts/validate-model-policy.sh"

echo "[test] valid policy shape"
valid_dir="$(mktemp -d)"
mkdir -p "${valid_dir}/.pi-avicenna"
cat > "${valid_dir}/.pi-avicenna/model-policy.yaml" <<'YAML'
version: 1
fallback:
  on_missing: warn
host_aliases:
  claude: claude
  codex: codex
  pi: pi
  hermes: hermes
role_tiers:
  commander: high
  researcher: high
  coder: medium
  qa: medium
  pr_monkey: low
risk_overrides:
  low: {}
  medium: {}
  high: {}
host_models:
  claude:
    high: ""
    medium: ""
    low: ""
  codex:
    high: ""
    medium: ""
    low: ""
  pi:
    high: ""
    medium: ""
    low: ""
  hermes:
    high: ""
    medium: ""
    low: ""
tiers:
  high:
    description: high
    default_model: high
  medium:
    description: medium
    default_model: medium
  low:
    description: low
    default_model: low
YAML
ALLOW_MISSING_POLICY=0 WARN_ONLY_POLICY=0 "${validator}" "${valid_dir}" >/dev/null
rm -rf "${valid_dir}"

echo "[test] fallback when missing policy"
tmp_dir="$(mktemp -d)"
mkdir -p "${tmp_dir}/config"
ALLOW_MISSING_POLICY=1 WARN_ONLY_POLICY=1 "${validator}" "${tmp_dir}" >/dev/null
rm -rf "${tmp_dir}"

echo "[test] malformed policy shape"
invalid_dir="$(mktemp -d)"
mkdir -p "${invalid_dir}/.pi-avicenna"
cat > "${invalid_dir}/.pi-avicenna/model-policy.yaml" <<'YAML'
version: 1
host_aliases:
  claude: claude
YAML
ALLOW_MISSING_POLICY=0 WARN_ONLY_POLICY=1 "${validator}" "${invalid_dir}" >/dev/null
rm -rf "${invalid_dir}"

echo "model-policy validation tests: PASS"
