const DEFAULT_ROLE_TEAM_MAP = {
  researcher: "research",
  coder: "implementation",
  qa: "review",
  pr_monkey: "default",
};

const SAFE_TEAM_TOOL_ALLOWLIST = new Set(["team"]);

function parseModelFallbackChain(raw) {
  if (Array.isArray(raw)) return raw.map((v) => `${v}`.trim()).filter(Boolean);
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function parseBooleanFlag(raw) {
  if (raw === true || raw === false) return raw;
  if (typeof raw !== "string") return false;
  const normalized = raw.trim().toLowerCase();
  return ["1", "true", "yes", "on", "strict"].includes(normalized);
}

function getStrictTeamMode(pi) {
  return parseBooleanFlag(pi.strict_team_mode ?? pi.team_strict) || parseBooleanFlag(process.env.PI_AVICENNA_STRICT_TEAM_MODE);
}

function withStrict(route, strictTeamMode) {
  return { ...route, strictTeamMode };
}

export function decidePiRoute({ role, config, availableTools }) {
  const pi = config?.pi || {};
  const strictTeamMode = getStrictTeamMode(pi);
  const teamTool = pi.team_tool || "team";
  const enabled = pi.team_path_enabled !== false;

  if (!enabled) {
    return withStrict({ path: "legacy", reason: "team_path_disabled", teamTool }, strictTeamMode);
  }

  const unsafeToolAllowed = pi.team_tool_allow_unsafe === true;
  if (!SAFE_TEAM_TOOL_ALLOWLIST.has(teamTool) && !unsafeToolAllowed) {
    return withStrict({ path: "legacy", reason: "team_tool_unsafe", teamTool }, strictTeamMode);
  }

  const teamName = pi.team || DEFAULT_ROLE_TEAM_MAP[role];
  if (!teamName) {
    return withStrict({ path: "legacy", reason: "team_mapping_missing", teamTool }, strictTeamMode);
  }

  if (!availableTools.includes(teamTool)) {
    return withStrict({ path: "legacy", reason: "team_tool_unavailable", teamTool, teamName }, strictTeamMode);
  }

  const modelFallbackChain = parseModelFallbackChain(pi.model_fallback_chain);
  return withStrict({
    path: "team",
    teamTool,
    teamName,
    modelHint: pi.model_hint,
    modelFallbackChain,
  }, strictTeamMode);
}

function taskWithRoleContract(task, roleContract) {
  if (!roleContract?.content) return task;
  return [
    `Pi Avicenna role contract for ${roleContract.role}:`,
    "```markdown",
    roleContract.content,
    "```",
    `Contract source: ${roleContract.source}`,
    `Contract path: ${roleContract.path}`,
    "",
    "Delegated task:",
    task,
  ].join("\n");
}

export function buildTeamInvocation({ teamName, task, modelHint, modelFallbackChain, roleContract }) {
  const payload = {
    action: "run",
    team: teamName,
    goal: taskWithRoleContract(task, roleContract),
  };
  if (roleContract) payload.role_contract = roleContract;
  if (modelHint) payload.model = modelHint;
  if (Array.isArray(modelFallbackChain) && modelFallbackChain.length > 0) {
    payload.model_fallback_chain = modelFallbackChain;
  }
  return payload;
}

export { DEFAULT_ROLE_TEAM_MAP, SAFE_TEAM_TOOL_ALLOWLIST, parseBooleanFlag, getStrictTeamMode };
