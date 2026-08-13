"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function () {
  const { app } = await loadApp();
  assert.strictEqual(app.FABRIC_FEATURE_OPTS.length, 7, "all seven proposal-only feature paths are registered");
  assert.deepStrictEqual(app.FABRIC_FEATURE_OPTS.map((x) => x.key), [
    "commitment-extract", "resume-capsule-draft", "weekly-review-draft", "capture-suggest",
    "playbook-draft", "public-copy-draft", "studio-second-opinion",
  ]);

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
