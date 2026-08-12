"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadApp } = require("./harness");

(async function main() {
  const loaded = await loadApp();
  const app = loaded.app;
  const day = 86400000;
  const now = Date.UTC(2026, 7, 11, 18, 0, 0);

  let off = app.recordAttentionReceipt({ enabled: false }, "capture-created", { source: "test", title: "never" }, now);
  assert.deepStrictEqual(off.receipts, [], "disabled recording creates no receipts");
  off = app.recordAttentionReceipt({ enabled: true, retentionDays: 30, receipts: [] }, "unknown", { source: "test" }, now);
  assert.deepStrictEqual(off.receipts, [], "unknown receipt types are rejected");

  let a = { enabled: true, retentionDays: 30, receipts: [] };
  a = app.recordAttentionReceipt(a, "day-opened", { source: "today", entityId: "opaque-open", title: "secret", notes: "secret" }, now - 600000);
  a = app.recordAttentionReceipt(a, "day-opened", { source: "today" }, now - 599000);
  a = app.recordAttentionReceipt(a, "capture-created", { source: "today", entityType: "task", entityId: "opaque-task", body: "secret" }, now - 500000);
  a = app.recordAttentionReceipt(a, "focus-confirmed", { source: "today", entityType: "task", entityId: "opaque-task", url: "https://secret" }, now - 300000);
  assert.strictEqual(a.receipts.filter((r) => r.type === "day-opened").length, 1, "daily open is idempotent");
  for (const receipt of a.receipts) {
    assert.ok(app.ATTENTION_EVENT_TYPES.includes(receipt.type), "only allowlisted types survive");
    assert.deepStrictEqual(Object.keys(receipt).sort().filter((k) => !["day", "entityId", "entityType", "id", "source", "ts", "type"].includes(k)), [], "receipt has only content-minimized fields");
    assert.strictEqual(receipt.title, undefined);
    assert.strictEqual(receipt.notes, undefined);
    assert.strictEqual(receipt.body, undefined);
    assert.strictEqual(receipt.url, undefined);
  }

  const malformed = app.sanitizeAttention({ enabled: true, retentionDays: 30, receipts: [{ type: "unknown" }, { id: "x", type: "task-completed", ts: "bad", day: "2026-08-11", source: "test" }, { id: "x2", type: "task-completed", ts: now, day: "not-a-day", source: "test" }, { id: "x3", type: "task-completed", ts: now, day: "2026-08-11", source: "task title disguised as source" }, { id: "x4", type: "task-completed", ts: now, day: "2026-08-11", source: "test", entityId: "notes are not opaque" }] });
  assert.deepStrictEqual(malformed.receipts, [], "malformed state is rejected safely");
  let bounded = { enabled: true, retentionDays: 30, receipts: [] };
  for (let i = 0; i < app.ATTENTION_HARD_CAP + 20; i++) bounded = app.recordAttentionReceipt(bounded, "task-completed", { source: "test", entityId: "t" + i }, now - (app.ATTENTION_HARD_CAP + 20 - i));
  assert.strictEqual(bounded.receipts.length, app.ATTENTION_HARD_CAP, "hard cap is deterministic");
  const old = app.recordAttentionReceipt({ enabled: true, retentionDays: 30, receipts: [] }, "task-completed", { source: "test" }, now - 31 * day);
  assert.strictEqual(app.pruneAttention(old, now).receipts.length, 0, "30-day retention is deterministic");

  const st = app.getState();
  st.attention = a;
  st.items = [{ id: "now-task", text: "Physical action", area: "Work", today: true, done: false }];
  const beforeNow = app.nowModel("2026-08-11", "12:00");
  st.attention = bounded;
  const afterNow = app.nowModel("2026-08-11", "12:00");
  assert.deepStrictEqual(afterNow, beforeNow, "attention state cannot alter deterministic NOW");

  const portable = app.portableDoc(st);
  const sync = app.buildSyncDoc();
  assert.ok(!Object.prototype.hasOwnProperty.call(portable, "attention"), "backup excludes raw attention");
  assert.ok(!Object.prototype.hasOwnProperty.call(sync, "attention"), "sync excludes raw attention");
  st.attention = app.recordAttentionReceipt(a, "task-completed", { source: "test", entityId: "AI_CONTEXT_SECRET_MARKER" }, now);
  assert.ok(!JSON.stringify(app.portableDoc(st)).includes("AI_CONTEXT_SECRET_MARKER"));
  assert.ok(!JSON.stringify(app.buildSyncDoc()).includes("AI_CONTEXT_SECRET_MARKER"));
  assert.ok(!app.buildAiSharedContext({ text: "Safe source" }, {}).includes("AI_CONTEXT_SECRET_MARKER"), "AI and relay context exclude raw attention");

  const bootDoc = JSON.parse(JSON.stringify(st));
  bootDoc.attention = a;
  const reboot = await loadApp({ storedState: bootDoc });
  const rebootReceipts = reboot.app.getState().attention.receipts;
  const bootIds = new Set(rebootReceipts.map((r) => r.id));
  assert.ok(a.receipts.every((r) => bootIds.has(r.id)), "valid device-local receipts survive ordinary boot");
  assert.ok(rebootReceipts.length === a.receipts.length || rebootReceipts.length === a.receipts.length + 1, "boot adds at most today's idempotent day-opened receipt");

  let evidence = { enabled: true, retentionDays: 30, receipts: [] };
  evidence = app.recordAttentionReceipt(evidence, "day-opened", { source: "today" }, now - 600000);
  evidence = app.recordAttentionReceipt(evidence, "capture-created", { source: "today", entityType: "task", entityId: "cap-1" }, now - 500000);
  evidence = app.recordAttentionReceipt(evidence, "focus-confirmed", { source: "today", entityType: "task", entityId: "cap-1" }, now - 300000);
  for (let i = 0; i < 4; i++) evidence = app.recordAttentionReceipt(evidence, "focus-moved", { source: "today", entityId: "focus-" + i }, now - 200000 + i);
  evidence = app.recordAttentionReceipt(evidence, "close-completed", { source: "close" }, now - 2 * day);
  evidence = app.recordAttentionReceipt(evidence, "close-completed", { source: "close" }, now - day);
  evidence = app.recordAttentionReceipt(evidence, "close-completed", { source: "close" }, now);
  evidence = app.recordAttentionReceipt(evidence, "task-completed", { source: "test", entityId: "prior-task" }, now - 8 * day);
  const digest = app.attentionDigest(evidence, now);
  assert.strictEqual(digest.capturesActed, 1);
  assert.strictEqual(digest.focusChangesToday, 4);
  assert.strictEqual(digest.closeCompletions, 3);
  assert.strictEqual(digest.timeToFirstFocusMinutes, 5);
  assert.strictEqual(digest.comparison.previousCompletions, 1, "prior seven-day comparison is deterministic");
  assert.deepStrictEqual(app.attentionDigest(evidence, now), digest, "digest is deterministic");
  assert.strictEqual(app.attentionSignal({ receipts: 0 }).kind, "insufficient");
  assert.strictEqual(app.attentionSignal({ receipts: app.ATTENTION_MIN_RECEIPTS - 1 }).kind, "insufficient", "small evidence sets are not called healthy");
  assert.deepStrictEqual(app.attentionSignal(digest), { kind: "friction", text: "Focus changed four times today. Consider freezing NOW for one work interval." }, "fixed precedence returns one calm signal");

  const proposals = [
    { kind: "ai", mode: "Review", seat: "Verifier", provider: "local", model: "m1", promptId: "proof", promptVersion: 2, feedback: "accepted", status: "applied", createdAt: 0, resolvedAt: 60000 },
    { kind: "ai", mode: "Review", seat: "Verifier", provider: "local", model: "m1", promptId: "proof", promptVersion: 2, feedback: "edited-accepted", status: "applied", createdAt: 60000, resolvedAt: 180000 },
    { kind: "ai", mode: "Review", seat: "Verifier", provider: "local", model: "m1", promptId: "proof", promptVersion: 2, feedback: "rejected", status: "rejected", createdAt: 120000, resolvedAt: 300000 },
    { kind: "ai", mode: "Draft", seat: "Writer", provider: "local", model: "m2", promptId: "draft", promptVersion: 1, feedback: "escalated", status: "escalated", createdAt: 0, resolvedAt: 60000 },
  ];
  const workflow = app.aiWorkflowSummary(proposals, 3);
  const review = workflow.modes.find((g) => g.label === "Review");
  const draft = workflow.modes.find((g) => g.label === "Draft");
  assert.strictEqual(review.enough, true);
  assert.strictEqual(review.accepted, 2);
  assert.strictEqual(review.edited, 1);
  assert.strictEqual(review.rejected, 1);
  assert.strictEqual(review.medianReviewMinutes, 2);
  assert.strictEqual(draft.enough, false, "small samples are explicitly insufficient");
  const hostileEvidence = app.aiWorkflowEvidenceHTML([{ kind: "ai", mode: '<img src=x onerror="bad">', feedback: "rejected", status: "rejected" }]);
  assert.ok(!hostileEvidence.includes("<img"), "hostile workflow labels stay escaped");

  const capsuleInput = {
    outcome: "Ship", currentState: "Testing", next: "Run tests", assignedAI: "Luna", aiRole: "Verifier", repo: "kevinos", branch: "agent/proof", worktree: "/tmp/work", allowedScope: "index.html", forbiddenFiles: ".env", sourceEvidence: "tests", contextPolicy: "mission only", privacyBoundary: "no secrets", dataClassification: "device-local", expectedArtifact: "PR", acceptance: "green", tests: "sh test/run.sh", evidence: "receipts", rollbackPlan: "revert commit", blockers: "none", lastHandoff: "ready", relayToken: "NEVER", oauthSession: "NEVER", email: { session: "NEVER" }, sync: { key: "NEVER" }
  };
  const capsule = app.missionCapsule(capsuleInput);
  const capsuleAgain = app.missionCapsule(capsuleInput);
  assert.deepStrictEqual(capsuleAgain, capsule, "capsule ordering and fingerprint are stable");
  assert.deepStrictEqual(Object.keys(capsule), ["capsuleVersion", "outcome", "currentState", "nextPhysicalAction", "assignedAI", "role", "repository", "branch", "worktree", "allowedScope", "forbiddenScope", "sourceEvidence", "contextPolicy", "privacyBoundary", "dataClassification", "expectedArtifact", "acceptanceCriteria", "verificationCommands", "evidence", "rollbackPlan", "blockers", "lastHandoff", "fingerprint"]);
  assert.ok(capsule.fingerprint);
  assert.ok(!JSON.stringify(capsule).includes("NEVER"), "connection data cannot enter capsules implicitly");

  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const runner = fs.readFileSync(path.join(__dirname, "run.sh"), "utf8");
  assert.match(runner, /node test\/attention-proof\.test\.js/, "focused suite is part of the full release gate");
  assert.match(html, /briefCardHTML\(\)\+[\s\S]*attentionCardHTML\(\)/, "attention controls live in Plan & Review");
  assert.match(html, /Why this is NOW:/, "Today explains deterministic NOW");
  assert.match(html, /bExpectedArtifact/, "Studio exposes Mission Capsule policy fields");

  console.log("attention proof loop contracts ok");
})().catch((err) => { console.error(err); process.exitCode = 1; });
