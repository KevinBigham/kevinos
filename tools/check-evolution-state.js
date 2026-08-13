"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const modeIndex = process.argv.indexOf("--mode");
const mode = modeIndex >= 0 ? process.argv[modeIndex + 1] : "structure";
const errors = [];

const missionDir = "docs/evolution/2026-08-12-kevin-personalization-ai-fabric-v40";
const stateRel = missionDir + "/MISSION_STATE.json";
const ledgerRel = missionDir + "/06_EXECUTION_LEDGER.md";
const matrixRel = missionDir + "/05_ACCEPTANCE_TEST_MATRIX.md";
const promptRel = "CODEX_5_6_SOL_HIGH_FAST_KEVINOS_AI_FABRIC_GOAT_MARATHON.md";
const expectedMissionId = "kevinos-personalization-ai-fabric-v40-2026-08-12";
const expectedWaves = ["K-1", "K0", "K1", "K2", "K3", "K4", "K5", "K6", "K7", "K7A", "K8", "K9", "K10"];
const liveActivationIds = new Set([
  "AT-141", "AT-142", "AT-143", "AT-144", "AT-145", "AT-146", "AT-147", "AT-148",
  "AT-156", "AT-157", "AT-158", "AT-159", "AT-160", "AT-161",
]);

function read(rel) {
  const full = path.join(root, rel);
  try {
    return fs.readFileSync(full, "utf8");
  } catch (error) {
    errors.push("missing or unreadable " + rel);
    return "";
  }
}

function parseJson(rel) {
  const text = read(rel);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push("invalid JSON in " + rel + ": " + error.message);
    return null;
  }
}

function requireFile(rel) {
  if (!fs.existsSync(path.join(root, rel))) errors.push("required mission file is missing: " + rel);
}

function requireText(text, needle, label) {
  if (text.indexOf(needle) < 0) errors.push(label + " missing required contract: " + needle);
}

function unresolvedCheckboxes(text) {
  return text.split(/\r?\n/).filter((line) => /- \[ \]/.test(line) && line.indexOf("BLOCKED-EXTERNAL") < 0);
}

function evidencePresent(item) {
  return Array.isArray(item.evidence) && item.evidence.length > 0;
}

function resolvedStatus(status) {
  return ["PASS", "BLOCKED-EXTERNAL", "WAIVED"].indexOf(status) >= 0;
}

if (["structure", "preactivation", "final"].indexOf(mode) < 0) {
  errors.push("unsupported --mode " + mode + " (use structure, preactivation, or final)");
}

const requiredFiles = [
  "AGENTS.md",
  "ACTIVE_MISSION.md",
  promptRel,
  missionDir + "/00_START_HERE.md",
  missionDir + "/01_HARDCORE_PERSONALIZATION_AUDIT.md",
  missionDir + "/02_NEW_GOALS_AND_PRODUCT_CONSTITUTION.md",
  missionDir + "/03_GITHUB_DEEP_RESEARCH.md",
  missionDir + "/04_V40_PERSONALIZATION_BLUEPRINT.md",
  matrixRel,
  ledgerRel,
  missionDir + "/07_FREE_AI_PROVIDER_RESEARCH.md",
  missionDir + "/08_AI_PROVIDER_FABRIC_BLUEPRINT.md",
  missionDir + "/09_CREDENTIALS_LAST_ACTIVATION_RUNBOOK.md",
  missionDir + "/ASSUMPTIONS.md",
  missionDir + "/DECISIONS.md",
  missionDir + "/PROGRESS.md",
  missionDir + "/EVIDENCE_INDEX.md",
  missionDir + "/FINAL_HANDOFF_TEMPLATE.md",
  stateRel,
  "docs/AI_PROVIDER_SECURITY_POLICY.md",
  "docs/AI_PROVIDER_CAPABILITY_MATRIX.md",
  "relay/.dev.vars.example",
  "tools/scan-secret-values.js",
  "tools/run-evolution-gates.sh",
];
for (const rel of requiredFiles) requireFile(rel);

const state = parseJson(stateRel);
const ledger = read(ledgerRel);
const matrix = read(matrixRel);
const prompt = read(promptRel);
const agents = read("AGENTS.md");
const active = read("ACTIVE_MISSION.md");
const example = read("relay/.dev.vars.example");

requireText(prompt, "Credentials-last exception", "root prompt");
requireText(prompt, "allowPaid=false", "root prompt");
requireText(prompt, "do not paste keys into chat", "root prompt");
requireText(prompt, "Wave K7A", "root prompt");
requireText(prompt, "Wave K10", "root prompt");
requireText(agents, "## AI provider law", "AGENTS.md");
requireText(agents, "preactivation", "AGENTS.md");
requireText(active, expectedMissionId, "ACTIVE_MISSION.md");
requireText(example, "AI_ALLOW_PAID=false", "relay/.dev.vars.example");

const staleNeedles = [
  "docs/evolution/2026-08-12-kevin-" + "personalization-v40/",
  "kevinos-" + "personalization-v40-2026-08-12",
  "CODEX_5_6_SOL_HIGH_FAST_KEVINOS_" + "GOAT_MARATHON.md",
];
for (const rel of ["AGENTS.md", "ACTIVE_MISSION.md", "docs/CURRENT_STATE.md", missionDir + "/00_START_HERE.md", "tools/run-evolution-gates.sh"]) {
  const text = read(rel);
  for (const needle of staleNeedles) {
    if (text.indexOf(needle) >= 0) errors.push(rel + " contains stale mission reference " + needle);
  }
}

const taskCount = (ledger.match(/- \[[ xX]\]/g) || []).length;
if (taskCount !== 244) errors.push("expected 244 ledger tasks, found " + taskCount);
const expectedAcceptance = Array.from(new Set(matrix.match(/AT-\d{3}/g) || [])).sort();
if (expectedAcceptance.length !== 72) errors.push("expected 72 acceptance IDs, found " + expectedAcceptance.length);

if (state) {
  if (state.missionId !== expectedMissionId) errors.push("unexpected missionId " + state.missionId);

  const actualAcceptance = (state.acceptance || []).map((item) => item.id).sort();
  const missingAcceptance = expectedAcceptance.filter((id) => actualAcceptance.indexOf(id) < 0);
  const extraAcceptance = actualAcceptance.filter((id) => expectedAcceptance.indexOf(id) < 0);
  if (missingAcceptance.length) errors.push("MISSION_STATE missing acceptance IDs: " + missingAcceptance.join(", "));
  if (extraAcceptance.length) errors.push("MISSION_STATE has unknown acceptance IDs: " + extraAcceptance.join(", "));
  if (new Set(actualAcceptance).size !== actualAcceptance.length) errors.push("duplicate acceptance ID in MISSION_STATE");

  const actualWaves = (state.waves || []).map((item) => item.id);
  for (const id of expectedWaves) if (actualWaves.indexOf(id) < 0) errors.push("MISSION_STATE missing wave " + id);
  for (const id of actualWaves) if (expectedWaves.indexOf(id) < 0) errors.push("MISSION_STATE has unknown wave " + id);
  if (new Set(actualWaves).size !== actualWaves.length) errors.push("duplicate wave ID in MISSION_STATE");

  const allowedMission = ["READY", "RUNNING", "PREACTIVATION_READY", "BLOCKED-EXTERNAL", "COMPLETE"];
  const allowedWave = ["TODO", "IN_PROGRESS", "BLOCKED-EXTERNAL", "COMPLETE"];
  const allowedAcceptance = ["TODO", "IN_PROGRESS", "PENDING-LIVE", "PASS", "FAIL", "BLOCKED-EXTERNAL", "WAIVED"];
  if (allowedMission.indexOf(state.status) < 0) errors.push("invalid mission status " + state.status);
  for (const wave of state.waves || []) {
    if (allowedWave.indexOf(wave.status) < 0) errors.push("invalid wave status " + wave.id + ": " + wave.status);
  }
  for (const item of state.acceptance || []) {
    if (allowedAcceptance.indexOf(item.status) < 0) errors.push("invalid acceptance status " + item.id + ": " + item.status);
  }

  const cp = state.credentialPolicy || {};
  if (cp.requestCredentialsOnlyAfterWave !== "K9") errors.push("credentials must be requested only after K9");
  if (cp.preactivationRequired !== true) errors.push("credential policy must require preactivation");
  if (cp.pasteKeysIntoChat !== false) errors.push("credential policy must forbid pasting keys into chat");
  if (cp.allowPaid !== false) errors.push("credential policy must hard-disable paid use");
  if (cp.allowRemoteSecretMutation !== false) errors.push("credential policy must forbid implicit remote secret mutation");
  if (cp.allowDeploy !== false) errors.push("credential policy must forbid implicit deploy");

  if (mode === "preactivation") {
    if (state.status !== "PREACTIVATION_READY") errors.push("preactivation mode requires mission status PREACTIVATION_READY");

    for (const wave of state.waves || []) {
      if (wave.id === "K10") {
        if (wave.status !== "TODO") errors.push("preactivation requires K10 to remain TODO before credentials are requested");
        continue;
      }
      if (["COMPLETE", "BLOCKED-EXTERNAL"].indexOf(wave.status) < 0) {
        errors.push("preactivation unresolved wave " + wave.id + ": " + wave.status);
      }
      if (!evidencePresent(wave)) errors.push("preactivation wave lacks evidence " + wave.id);
    }

    for (const item of state.acceptance || []) {
      if (liveActivationIds.has(item.id)) continue;
      if (!resolvedStatus(item.status)) errors.push("preactivation unresolved credentialless acceptance " + item.id + ": " + item.status);
      if (!evidencePresent(item)) errors.push("preactivation credentialless acceptance lacks evidence " + item.id);
      if (item.status === "WAIVED" && !(item.notes || "").trim()) errors.push("waived acceptance lacks Kevin authorization note " + item.id);
    }

    const beforeK10 = ledger.split(/^## K10\b/m)[0];
    const unresolved = unresolvedCheckboxes(beforeK10);
    if (unresolved.length) errors.push("preactivation has " + unresolved.length + " unchecked K-1 through K9 ledger item(s)");

    const requiredPreGates = [
      "doctor", "fullSuite", "browserWidths", "offlineReload", "migrationRecovery", "privacySecurity",
      "performance", "providerFabricCredentialless", "zeroDollarPolicy", "preactivation", "secretLeakScan", "finalReview",
    ];
    for (const key of requiredPreGates) {
      if (["PASS", "MANUAL-PASS", "BLOCKED-EXTERNAL"].indexOf((state.finalGates || {})[key]) < 0) {
        errors.push("preactivation gate unresolved " + key + ": " + (state.finalGates || {})[key]);
      }
    }

    if (!fs.existsSync(path.join(root, "FINAL_KEVINOS_V40_HANDOFF.md"))) {
      errors.push("preactivation draft FINAL_KEVINOS_V40_HANDOFF.md is missing");
    }
  }

  if (mode === "final") {
    if (state.status !== "COMPLETE") errors.push("final mode requires mission status COMPLETE");
    for (const wave of state.waves || []) {
      if (["COMPLETE", "BLOCKED-EXTERNAL"].indexOf(wave.status) < 0) errors.push("final mode unresolved wave " + wave.id + ": " + wave.status);
      if (!evidencePresent(wave)) errors.push("final mode wave lacks evidence " + wave.id);
    }
    for (const item of state.acceptance || []) {
      if (!resolvedStatus(item.status)) errors.push("final mode unresolved acceptance " + item.id + ": " + item.status);
      if (!evidencePresent(item)) errors.push("final mode acceptance lacks evidence " + item.id);
      if (item.status === "WAIVED" && !(item.notes || "").trim()) errors.push("waived acceptance lacks Kevin authorization note " + item.id);
    }

    const unresolved = unresolvedCheckboxes(ledger);
    if (unresolved.length) errors.push("final mode has " + unresolved.length + " unchecked ledger item(s)");

    const allowedFinalGate = ["PASS", "MANUAL-PASS", "BLOCKED-EXTERNAL"];
    for (const key of Object.keys(state.finalGates || {})) {
      if (allowedFinalGate.indexOf(state.finalGates[key]) < 0) errors.push("final gate unresolved " + key + ": " + state.finalGates[key]);
    }

    if (!fs.existsSync(path.join(root, "FINAL_KEVINOS_V40_HANDOFF.md"))) errors.push("FINAL_KEVINOS_V40_HANDOFF.md is missing");
  }
}

if (errors.length) {
  console.error("KevinOS evolution mission check found " + errors.length + " problem(s):");
  for (const error of errors) console.error("- " + error);
  process.exit(1);
}

console.log("KevinOS evolution mission state ok — mode " + mode + ", " + taskCount + " tasks, " + expectedAcceptance.length + " acceptance contracts");
