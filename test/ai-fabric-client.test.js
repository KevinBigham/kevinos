"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function () {
  const { app } = await loadApp();
  assert.strictEqual(app.FABRIC_FEATURE_OPTS.length, 16, "all contextual proposal-only feature paths are registered");
  assert.deepStrictEqual(app.FABRIC_FEATURE_OPTS.map((x) => x.key), [
    "commitment-extract", "resume-capsule-draft", "weekly-review-draft", "capture-suggest",
    "playbook-draft", "public-copy-draft", "studio-second-opinion", "now-challenge",
    "daily-brief-draft", "project-truth-draft", "blocker-challenge", "restart-checklist-draft",
    "repo-brief-draft", "mission-review", "awaiting-question-draft", "search-rerank",
  ]);

  const projectPolicy = app.normalizeProjectAiPolicy({ enabled: true, allowedJobIds: ["project-truth-draft", "unknown"], allowedPrivacyClasses: ["WORK_INTERNAL", "SECRET"], preferredProviderIds: ["groq", "bad provider"], dailyCallCeiling: 500 });
  assert.deepStrictEqual(projectPolicy.allowedJobIds, ["project-truth-draft"]);
  assert.deepStrictEqual(projectPolicy.allowedPrivacyClasses, ["WORK_INTERNAL"]);
  assert.deepStrictEqual(projectPolicy.preferredProviderIds, ["groq"]);
  assert.strictEqual(projectPolicy.dailyCallCeiling, 50);
  const oldProject = app.normalizeProjectRecord({ id: "old-project", title: "Old" });
  assert.strictEqual(Object.prototype.hasOwnProperty.call(oldProject, "aiPolicy"), false, "old projects remain AI-disabled without shape inflation");
  const optedProject = app.normalizeProjectRecord({ id: "ai-project", title: "AI", privacyClass: "work-internal", aiPolicy: projectPolicy, outcome: "Ship", currentState: "Green", nextAction: "Review" });
  const capsule = app.buildProjectAiContextCapsule({ projects: [optedProject], items: [{ id: "t2", text: "Second", projectId: "ai-project", privacyClass: "work-internal" }, { id: "t1", text: "First", projectId: "ai-project", privacyClass: "work-internal" }], roles: [], events: [], builds: [], briefs: [], links: [], prompts: [], notes: [], stash: [], people: [], spend: [], goals: [], habits: [], council: [], pending: [], profile: [], sheets: [], decisions: [], portfolio: {} }, "ai-project", [{ type: "tasks", id: "t2" }, { type: "project", id: "ai-project" }, { type: "tasks", id: "t1" }], [{ path: "b.js", content: "b" }, { path: "a.js", content: "a" }]);
  assert.deepStrictEqual(capsule.records.map((x) => x.id), ["ai-project", "t1", "t2"], "selected records are stable-sorted");
  assert.deepStrictEqual(capsule.repoFiles.map((x) => x.path), ["a.js", "b.js"], "selected files are stable-sorted");
  assert.ok(capsule.manifest.byteCount > 0 && capsule.fingerprint);
  assert.strictEqual(capsule.bounds.maxRecords, 20);
  assert.strictEqual(capsule.bounds.maxRepoFiles, 5);
  assert.ok(capsule.bounds.totalChars <= 24000, "records and repository excerpts share one exact content ceiling");

  const boundedState = { projects: [{ id: "bounded", title: "Bounded", privacyClass: "public" }], items: [{ id: "long", projectId: "bounded", privacyClass: "public", text: "x".repeat(23900) }], roles: [], events: [], builds: [], briefs: [], links: [], prompts: [], notes: [], stash: [], people: [], spend: [], goals: [], habits: [], council: [], pending: [], profile: [], sheets: [], decisions: [], portfolio: {} };
  const boundedCapsule = app.buildProjectAiContextCapsule(boundedState, "bounded", [{ type: "project", id: "bounded" }, { type: "tasks", id: "long" }], [{ path: "large.txt", content: "y".repeat(12000) }]);
  assert.ok(boundedCapsule.bounds.recordChars + boundedCapsule.bounds.repoChars <= 24000, "repository context cannot push a capsule beyond 24,000 content characters");
  const protectedState = Object.assign({}, boundedState, { projects: [{ id: "youth", title: "Youth", privacyClass: "youth-sensitive" }] });
  const protectedCapsule = app.buildProjectAiContextCapsule(protectedState, "youth", [{ type: "project", id: "youth" }], [{ path: "roster.txt", content: "synthetic roster" }]);
  assert.strictEqual(protectedCapsule.privacyClass, "YOUTH_SENSITIVE");
  assert.strictEqual(protectedCapsule.repoFiles.length, 0, "protected projects reject repository excerpts before transport");

  const request = app.buildFabricProposalRequest("Fictional public project evidence.", "resume-capsule-draft", "SANITIZED", true, true);
  assert.strictEqual(request.lane, "DEEP_SYNTHESIS");
  assert.strictEqual(request.promptVersion, "resume-capsule-v1");
  assert.strictEqual(request.allowPaid, false, "browser cannot opt into paid routing");
  assert.strictEqual(request.approvalState, "approved");
  assert.strictEqual(request.manifest.records.length, 1, "only the explicitly approved manual record is manifested");
  assert.deepStrictEqual(request.manifest.records[0].fields, ["input"]);
  assert.strictEqual(request.manifest.deidentified, true);
  assert.ok(request.packetFingerprint);
  assert.strictEqual(
    request.packetFingerprint,
    app.buildFabricProposalRequest("Fictional public project evidence.", "resume-capsule-draft", "SANITIZED", true, true).packetFingerprint,
    "identical approved packets have stable identities"
  );
  assert.notStrictEqual(
    request.packetFingerprint,
    app.buildFabricProposalRequest("Changed evidence.", "resume-capsule-draft", "SANITIZED", true, true).packetFingerprint,
    "changed source evidence creates a new packet identity"
  );

  const unapproved = app.buildFabricProposalRequest("Public text", "public-copy-draft", "PUBLIC", false, false);
  assert.strictEqual(unapproved.approvalState, "draft");
  assert.strictEqual(unapproved.manifest.approved, false, "unapproved input cannot masquerade as approved");
  assert.strictEqual(app.fabricFeature("unknown").key, "commitment-extract", "unknown feature fails to the bounded default");
  assert.strictEqual(app.fabricProposalText({ proposal: "Draft one" }), "Draft one");
  assert.strictEqual(app.fabricProposalText({ proposals: [{ text: "A" }, { proposal: "B" }] }), "A\nB");

  const state = app.getState();
  state.pending.unshift({
    id: "fabric-proof", kind: "ai", proposalType: "fabric", mode: "Resume Capsule draft", status: "review",
    title: "Resume Capsule draft", body: "Do next: run the local gate", sourceKind: "fabric", sourceId: "",
    provider: "groq", model: "actual-model", seat: "Provider fabric", promptId: "resume-capsule-v1", promptVersion: 1,
    contextCategories: ["manual approved input"], contextFingerprint: request.packetFingerprint, createdAt: Date.now(),
    fabricProvenance: { providerId: "groq", modelId: "actual-model", routeAlias: "groq-current", promptVersion: "resume-capsule-v1", packetFingerprint: request.packetFingerprint, privacyClass: "SANITIZED", fallbackChain: [], timestamp: "2026-08-13T00:00:00.000Z" },
  });
  const before = JSON.stringify(state.pending[0].fabricProvenance);
  assert.strictEqual(app.applyAIProposal("fabric-proof", "note"), true, "fabric output remains proposal-only until explicit application");
  assert.strictEqual(JSON.stringify(state.pending[0].fabricProvenance), before, "apply preserves exact route provenance");
  assert.strictEqual(app.undoAIProposal("fabric-proof"), true);
  assert.strictEqual(JSON.stringify(state.pending[0].fabricProvenance), before, "Undo preserves provider, model, prompt, packet, privacy, and fallback identity");

  const html = app.fabricProposalComposerHTML();
  assert.match(html, /Public or genuinely de-identified text/);
  assert.match(html, /cannot change KevinOS until you explicitly apply it/);
  assert.doesNotMatch(html, /api[_-]?key|provider secret/i, "composer never renders secret inputs");

  const hostileScore = app.sanitizeFabricScorecard({ fixtureId: "x", providerId: "groq", ok: true, prompt: "PRIVATE PROMPT", response: "PRIVATE RESPONSE", apiKey: "secret", latencyBucket: "under-2s" });
  assert.doesNotMatch(JSON.stringify(hostileScore), /PRIVATE|secret|apiKey/, "local eval receipts use a content-free allowlist");
  const receipts = [];
  for (let i = 0; i < app.FABRIC_LAB_RECEIPT_KEEP + 10; i++) receipts.push({ fixtureId: "f" + i, providerId: "groq", ok: true });
  const bounded = app.normalizeFabricLab({ receipts });
  assert.strictEqual(bounded.receipts.length, app.FABRIC_LAB_RECEIPT_KEEP, "device-local eval receipts prune to the named cap");
  const rec = app.fabricLabRecommendation(receipts.slice(0, 5), "synthetic");
  assert.deepStrictEqual({ status: rec.status, providerId: rec.providerId, autoApplied: rec.autoApplied }, { status: "awaiting-kevin", providerId: "groq", autoApplied: false });
  app.recordFabricScorecards(receipts.slice(0, 5));
  assert.strictEqual(app.approveFabricLabRecommendation(), true, "Lab recommendation requires an explicit approval call");
  assert.strictEqual(app.rollbackFabricLabRoute("synthetic"), true, "approved Lab route has instant last-known-good rollback");
  assert.match(app.fabricEvalLabHTML(), /Built-in fictional fixtures only/);
  assert.match(app.fabricEvalLabHTML(), /never fan out Kevin data/);
  console.log("AI fabric browser proposal contracts ok");
})().catch((err) => { console.error(err); process.exit(1); });
