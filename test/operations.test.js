"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const { app, localStorage } = await loadApp();
  const state = app.getState();
  assert.deepStrictEqual(app.loadOperations(), [], "flight recorder is optional and empty by default");

  const before = app.operationStateFingerprint();
  const op = app.beginOperation("state.import", { source: "Kevin", affectedCount: 2, checkpointReason: "pre-import" });
  assert.strictEqual(app.loadOperations().length, 1, "start creates one operation identity");
  assert.strictEqual(app.loadOperations()[0].status, "started");
  assert.strictEqual(app.loadOperations()[0].type, "kevinos.state.imported", "legacy call aliases normalize to the documented local event name");
  assert.strictEqual(app.beginOperation("retention.test", {}), "", "the production recorder rejects unapproved operation types");
  state.items.push({ id: "op-item", text: "Canonical content never copied into the operation", u: 1 });
  assert.strictEqual(app.finishOperation(op, "succeeded", { affectedCount: 1 }), true);
  const finished = app.loadOperations()[0];
  assert.strictEqual(finished.id, op, "start and terminal state share one operation ID");
  assert.strictEqual(finished.status, "succeeded");
  assert.strictEqual(finished.beforeFingerprint, before);
  assert.notStrictEqual(finished.afterFingerprint, before);
  assert.match(app.operationsHTML(), /View checkpoint/, "checkpoint-backed operations link to recovery history");

  const countBeforeTyping = app.loadOperations().length;
  state.items[0].text = "Ordinary edit";
  assert.strictEqual(app.loadOperations().length, countBeforeTyping, "ordinary typing is never recorded");

  state.pending = [{ id: "op-proposal", kind: "ai", mode: "Draft", status: "review", title: "Proposal", body: "Private provider text", sourceKind: "task", sourceId: "source" }];
  assert.strictEqual(app.applyAIProposal("op-proposal", "note"), true);
  let rows = app.loadOperations();
  const applied = rows.find((x) => x.type === "kevinos.ai.proposal.applied");
  assert.ok(applied && applied.status === "succeeded" && applied.undoAvailable, "AI application gets one successful terminal receipt");
  assert.match(app.operationsHTML(), /data-op-undo="op-proposal"/, "targeted Undo appears only while the canonical inverse exists");
  assert.strictEqual(app.undoAIProposal("op-proposal"), true);
  rows = app.loadOperations();
  const undone = rows.find((x) => x.type === "kevinos.ai.proposal.undone");
  assert.strictEqual(undone.revertsOperationId, applied.id, "Undo is a new operation linked to the application");
  assert.doesNotMatch(app.operationsHTML(), /data-op-undo="op-proposal"/, "pruning/invalidation cannot strand an unsafe Undo button");
  assert.strictEqual(app.undoAIProposal("op-proposal"), false, "targeted Undo is idempotent");

  const sidecarBytes = localStorage._dump()["kevinos:operations"];
  assert.ok(!sidecarBytes.includes("Private provider text"), "operation sidecar does not duplicate provider or canonical content");
  for (const secret of ["relayToken", "providerKey", "oauthToken", "hiddenReasoning"]) assert.ok(!sidecarBytes.includes(secret));

  for (let i = 0; i < app.OPERATIONS_KEEP + 8; i++) {
    const id = app.beginOperation("state.import", {});
    app.finishOperation(id, "cancelled", {});
  }
  assert.strictEqual(app.loadOperations().length, app.OPERATIONS_KEEP, "operation history is bounded");

  localStorage.setItem("kevinos:operations", "{corrupt");
  assert.deepStrictEqual(app.loadOperations(), [], "corrupt operation sidecar never blocks canonical state");
  assert.ok(state.items.length, "canonical state remains available after sidecar corruption");

  console.log("local operation receipts ok");
})().catch((err) => { console.error(err); process.exit(1); });
