// KevinOS app-logic test harness (W1 item 21).
// Loads index.html's single IIFE script in Node with a tiny DOM stub and
// returns the app's internal functions for characterization testing.
// These tests pin CURRENT behavior — they are the safety net for the W2
// refactors. The app itself stays ES5; this harness runs only in Node,
// so modern syntax is fine here.

"use strict";

const fs = require("fs");
const path = require("path");

function makeStubElement(id) {
  const el = {
    id: id || "",
    innerHTML: "",
    textContent: "",
    value: "",
    hidden: false,
    disabled: false,
    className: "",
    checked: false,
    type: "",
    style: {},
    dataset: {},
    children: [],
    parentNode: null,
    isConnected: true,
    classList: {
      add() {}, remove() {}, toggle() {}, contains() { return false; },
    },
    addEventListener() {},
    removeEventListener() {},
    appendChild(c) { el.children.push(c); if (c && typeof c === "object") c.parentNode = el; return c; },
    removeChild(c) { const i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); return c; },
    insertAdjacentHTML() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    setAttribute(k, v) { el["_attr_" + k] = String(v); },
    getAttribute(k) { const v = el["_attr_" + k]; return v == null ? null : v; },
    hasAttribute(k) { return el["_attr_" + k] != null; },
    focus() {}, blur() {}, click() {}, select() {},
    contains() { return false; },
    scrollIntoView() {},
  };
  return el;
}

function makeStubDocument() {
  const byId = Object.create(null);
  return {
    getElementById(id) {
      if (!byId[id]) byId[id] = makeStubElement(id);
      return byId[id];
    },
    createElement(tag) { const el = makeStubElement(""); el.tagName = String(tag).toUpperCase(); return el; },
    createTextNode(t) { return { nodeValue: String(t) }; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    activeElement: null,
    visibilityState: "visible",
    hidden: false,
    title: "KevinOS",
    body: makeStubElement("body"),
  };
}

function makeStubLocalStorage(initial) {
  const map = Object.create(null);
  if (initial) for (const k of Object.keys(initial)) map[k] = String(initial[k]);
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null; },
    setItem(k, v) { map[k] = String(v); },
    removeItem(k) { delete map[k]; },
    _dump() { return Object.assign({}, map); },
  };
}

function extractScript(html) {
  const start = html.indexOf("<script>");
  const end = html.lastIndexOf("</script>");
  if (start < 0 || end < 0) throw new Error("script tag not found in index.html");
  return html.slice(start + "<script>".length, end);
}

// The names the tests need, harvested from inside the IIFE.
const EXPORT_NAMES = [
  "APP_VERSION", "SCHEMA_VERSION", "AREAS", "SYNC_ARRAYS", "SYNC_SKIP", "CONTENT_ARRAYS", "PORTABLE_OBJS",
  "PRIVACY_CLASSES", "PROJECT_STATUSES", "WIP_CLASSES", "COMMITMENT_TYPES", "EXECUTION_STATES", "ENERGY_LEVELS", "DECISION_STATES", "COMMUNICATION_STATES", "ADMIN_MONEY_KINDS", "SEARCH_TYPES", "LAB_SIGNAL_NAMES", "CAPACITY_MODES", "CAPACITY_REGISTRY", "DAY_MODES", "DAY_MODE_REGISTRY", "TODAY_REASON_CODES", "TODAY_DEFER_CODES", "STUCK_REASONS", "COMMITMENT_RISK_REASONS", "COMMITMENT_VIEWS", "ROLE_SEEDS", "PLAYBOOK_SEEDS", "ROLE_SWEEP_PROMPTS", "roleSweepSteps", "MISSION_STATES", "MISSION_EVENT_KEEP", "AGENT_PROFILES",
  "uid", "touch", "bury", "cloneJSON", "escapeHtml", "safeHttpUrl", "normalizeUrl", "highStakesCardHTML", "errorSummaryHTML", "highStakesFocusSelector", "rememberHighStakesFocus", "restoreHighStakesFocus", "cancelHighStakes",
  "pad", "dateKey", "keyToParts", "todayKey", "addDaysKey", "prettyDate",
  "nextRepeatKey", "rollRecurring",
  "normalizeRoleRecord", "normalizeTaskRecord", "normalizeProjectRecord", "normalizeBuildRecord", "normalizeEventRecord", "normalizePersonRecord", "normalizeGoalRecord", "normalizeDecisionRecord", "normalizeBriefRecord", "normalizeLinkedRecord", "normalizeLabBudget", "normalizePortfolio", "normalizeStateV40", "migrateV39ToV40", "validateStateV40", "legacyRoleId", "roleIdForLegacyArea", "strongerPrivacy", "protectArrayPrivacy", "seedV40Playbooks",
  "relationshipIndex", "relationshipDiagnostics", "dueDecisionRevisits", "communicationCommitments", "typedSearchRecords", "typedPaletteEntries", "adminMoneyRadar", "evidenceTimeline", "normalizeLabSignals", "loadLabSignals", "recordLabSignal", "knowledgeConversionPlan", "parseDecisionOptions", "projectResumeCapsule", "projectContextPacket", "projectHubHTML", "ensureStudioIncubatorProject", "addBuild",
  "projectWipSummary", "projectAdmissionDecision", "projectHealthFacts", "weeklyPortfolioModel", "wipGovernorHTML", "weeklyPortfolioReviewHTML", "portfolioNotNowIds",
  "playbookSourceRef", "playbookInstantiationPlan", "playbookPreviewHTML",
  "roleRemapPlan", "applyRoleRemapToState", "restorePortableCheckpoint", "rolesSettingsHTML", "legacyRoleRemapHTML", "remapPreviewHTML",
  "parseCaptureDate", "parseCaptureText", "parseCaptureTime", "tokenEntityId", "captureRoleId",
  "validDateKey", "taskStartBy", "taskRiskReasons", "taskActionability", "selectActionableTasks", "commitmentReasonLabel", "taskMatchesCommitmentView",
  "registryRecord", "activeDayModeId", "setActiveDayModeId", "capacityCommitmentLimit", "dayModeSuggestion", "todayReasonLabel", "nextHardStop", "timeMinutes", "todayPlanModel", "stuckAction", "stuckReasonLabel", "todayOperatingControlsHTML", "stuckCoachHTML",
  "portableDoc", "applyPortableDoc",
  "buildSyncDoc", "applySyncDoc", "mergeById", "mergeBuildsById", "mergeProofBundles", "mergeRemoteDoc", "unionDeleted", "mergeRoomStats",
  "unfold", "icsUnescape", "parseDT", "parseRRule", "expandRecurrence", "parseICS", "icsEscape", "buildICS",
  "habitDoneToday", "habitCurrentStreak", "habitLongestStreak", "habitGrid7", "toggleHabitToday",
  "trimCouncil", "COUNCIL_KEEP", "entityBytes", "docCountsText", "verifyBackup", "RECOVERY_DRILL_MAX_BYTES", "backupDifferenceCount", "recoveryDrillDocument", "recoveryDrillMeta", "recordRecoveryDrill",
  "deriveSyncKey", "deriveSyncKeyV2", "SYNC_KDF_ITERS",
  "computeStreaks", "weekStartKey",
  "go", "normalizeRoom", "ROOM_DEFS", "roomDef",
  "checkDayChange", "DAY_CHECK_MS",
  "dayDigest", "invalidateDayCache",
  "armUndo", "runUndo", "findItem",
  "OPERATIONS_KEEP", "OPERATION_TYPES", "canonicalOperationType", "loadOperations", "saveOperations", "operationStateFingerprint", "beginOperation", "finishOperation", "latestApplyOperation", "operationsHTML",
  "FRICTION_KEEP", "FRICTION_DAYS", "FRICTION_COMPACT_MS", "FRICTION_CATEGORIES", "frictionCategory", "frictionEnabled", "setFrictionEnabled", "loadFrictionEvents", "saveFrictionEvents", "clearFrictionEvents", "markFriction", "frictionAggregate", "frictionWeeklyHTML", "frictionControlsHTML", "openFrictionPrompt", "closeFrictionPrompt", "frictionPromptHTML",
  "validFocusRank", "focusItems", "attentionReasons", "attentionReasonLabel", "compactFocusRanks", "resetFocus", "duplicateFocusRanks", "moveFocusTask", "windItems", "nowModel",
  "makeTaskRow", "buildEditPanel", "projCard", "buildCard", "noteCard", "personCardHTML", "renderProfileList", "launchAgendaCardHTML", "emailRowHTML",
  "libraryPaletteEntries", "libraryRecords", "PALETTE_LIB_MAX",
  "closeHourVal", "updateTomorrowFocus", "launchBodyShort",
  "sweepStreak", "mergeSweepLog",
  "lanePinsClean", "councilRosterList",
  "recordSeatResult", "seatReliability", "seatDotHTML",
  "COUNCIL_PRESETS", "councilPresetSystem", "councilPresetLabel",
  "councilLengthOk", "aiContext", "AI_PROMPTS", "AI_RECEIPT_VERSION", "AI_MODE_REGISTRY", "aiFingerprint", "canonicalAiString", "utf8ByteCount", "buildAiSharedContext", "buildAiContextManifest", "aiRequestFingerprint", "runAiValidators", "findDuplicateAiResponse", "aiReceiptView",
  "FABRIC_LANE_OPTS", "FABRIC_PRIVACY_OPTS", "FABRIC_FEATURE_OPTS", "FABRIC_GOLDEN_OPTS", "FABRIC_LAB_RECEIPT_KEEP", "fabricFeature", "fabricProposalText", "buildFabricProposalRequest", "sanitizeFabricScorecard", "normalizeFabricLab", "loadFabricLab", "saveFabricLab", "recordFabricScorecards", "fabricLabRecommendation", "approveFabricLabRecommendation", "rollbackFabricLabRoute", "fabricProposalComposerHTML", "fabricEvalLabHTML", "aiFabricControlHTML",
  "normalizeAiProposal", "renderAiReviewHTML", "aiFeedbackSummary", "aiWorkflowSummary", "aiWorkflowEvidenceHTML", "applyAIProposal", "rejectAIProposal", "undoAIProposal", "calendarPendings", "approveAllPending", "dismissAllPending",
  "systemHealthHTML",
  "AI_ROLES", "VERIFY_STATUS", "PROOF_BUNDLE_VERSION", "proofLines", "proofItemId", "normalizeProofBundle", "missionStatusFromLegacy", "normalizeStringList", "normalizeMissionEvents", "agentProfileById", "missionStageForStatus", "missionTargetFiles", "missionWriterLockDecision", "missionDependencyFacts", "appendMissionEvent", "setMissionStatus", "intakeMissionHandoff", "missionReviewDecision", "missionPacketFingerprint", "refreshProofFingerprint", "convertMissionProof", "recordMissionAttempt", "missionProofStatus", "missionVerified", "missionCanShip", "missionProofEditorHTML", "missionReviewHTML", "agentRegistryHTML", "missionPacket", "missionMatches",
  "relay401IsAccount", "emailConnectionError", "emailIntelDraftFrom", "emailIntelHTML",
  "weeklyContextText", "councilRetroAsk",
  "factNorm", "profileDupeIds", "dedupeProfileFacts", "staleFact", "FACT_STALE_DAYS",
  "ATTENTION_VERSION", "ATTENTION_RETENTION_DAYS", "ATTENTION_HARD_CAP", "ATTENTION_DIGEST_DAYS", "ATTENTION_MIN_RECEIPTS", "ATTENTION_AI_MIN_SAMPLE", "ATTENTION_EVENT_TYPES", "ATTENTION_SOURCE_TYPES", "ATTENTION_ENTITY_TYPES", "sanitizeAttention", "recordAttentionReceipt", "pruneAttention", "attentionDigest", "attentionSignal", "attentionCardHTML", "attentionTodaySignalHTML", "missionCapsule",
];

// Load the app. opts.storedState: object persisted at kevinos:v1 before boot.
// Returns a promise for { app: <exports>, window, document, localStorage }.
function loadApp(opts) {
  opts = opts || {};
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  let src = extractScript(html);

  const open = src.indexOf("(function(){");
  const close = src.lastIndexOf("})();");
  if (open < 0 || close < 0) throw new Error("IIFE wrapper not found");
  let body = src.slice(open + "(function(){".length, close);

  const harvest =
    "\nreturn {" +
    EXPORT_NAMES.map((n) => n + ":(typeof " + n + '==="undefined"?undefined:' + n + ")").join(",") +
    ',getState:function(){return state;},getRoom:function(){return room;},"__store":store};\n';
  body += harvest;

  const stubLS = makeStubLocalStorage(
    opts.storedState ? { "kevinos:v1": JSON.stringify(opts.storedState) } : null
  );
  const documentStub = makeStubDocument();
  const windowStub = {
    localStorage: stubLS,
    indexedDB: undefined,
    addEventListener() {},
    removeEventListener() {},
    atob(s) { return Buffer.from(s, "base64").toString("binary"); },
    open() {},
    alert() {},
    confirm() { return true; },
  };
  const navigatorStub = { onLine: true, userAgent: "kevinos-test" };
  const locationStub = { search: opts.search || "", protocol: "file:", origin: "null", pathname: "/", hash: "" };
  const historyStub = { replaceState() {} };
  const setIntervalStub = function () { return 0; };

  // Silence the expected one-time "snapshots unavailable" warn from the stubbed IDB.
  const realWarn = console.warn;
  console.warn = function (m) { if (String(m).indexOf("snapshots unavailable") < 0) realWarn.apply(console, arguments); };

  let app;
  try {
    const factory = new Function(
      "window", "document", "navigator", "location", "history", "setInterval",
      body
    );
    app = factory(windowStub, documentStub, navigatorStub, locationStub, historyStub, setIntervalStub);
  } finally {
    // boot continues async; keep warn suppressed a moment longer
    setTimeout(() => { console.warn = realWarn; }, 100);
  }

  // Boot (store.load().then(...)) resolves on microtasks + a save round-trip.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ app, window: windowStub, document: documentStub, localStorage: stubLS });
    }, 25);
  });
}

module.exports = { loadApp, makeStubLocalStorage };
