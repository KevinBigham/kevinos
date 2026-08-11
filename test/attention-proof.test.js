const assert = require("assert");
const { loadApp } = require("./harness");

(async function () {
  const { app } = await loadApp();
  let off = app.recordAttentionReceipt({ enabled: false }, "capture-created", { source: "test" }, 1000);
  assert.deepStrictEqual(off.receipts, [], "disabled recording creates no receipts");
  let a = { enabled: true, retentionDays: 30, receipts: [] };
  a = app.recordAttentionReceipt(a, "day-opened", { source: "today", entityId: "secret" }, 1000);
  a = app.recordAttentionReceipt(a, "day-opened", { source: "today" }, 1001);
  a = app.recordAttentionReceipt(a, "focus-confirmed", { source: "today", entityType: "task", entityId: "opaque" }, 2000);
  assert.strictEqual(a.receipts.length, 2, "daily open is idempotent");
  assert.deepStrictEqual(Object.keys(a.receipts[0]).sort(), ["day", "entityId", "id", "source", "ts", "type"]);
  assert.strictEqual(a.receipts[0].title, undefined, "receipts have no content fields");
  let bad = app.sanitizeAttention({ enabled: true, retentionDays: 7, receipts: [{ type: "unknown" }, { type: "task-completed", ts: "bad" }] });
  assert.deepStrictEqual(bad.receipts, [], "malformed state is rejected safely");
  let old = app.recordAttentionReceipt({ enabled: true, receipts: [] }, "task-completed", { source: "test" }, 0);
  assert.strictEqual(app.pruneAttention(old, 31 * 86400000).receipts.length, 0, "retention is deterministic");
  let dig = app.attentionDigest(a, 3000);
  assert.strictEqual(dig.completions, 0);
  assert.strictEqual(app.attentionSignal({ receipts: 0 }).kind, "insufficient");
  assert.strictEqual(app.attentionSignal({ receipts: 6, focusChanges: 4 }).kind, "friction");
  assert.ok(app.missionCapsule({ outcome: "Ship", next: "Test", relayToken: "never" }).fingerprint);
  const st = app.getState();
  assert.ok(!Object.prototype.hasOwnProperty.call(app.buildSyncDoc(), "attention"), "sync excludes attention");
  assert.ok(!Object.prototype.hasOwnProperty.call(app.portableDoc(st), "attention"), "backup excludes attention");
  console.log("attention-proof harness ok");
})().catch((err) => { console.error(err); process.exitCode = 1; });
