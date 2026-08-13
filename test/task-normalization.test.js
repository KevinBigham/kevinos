"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadApp } = require("./harness");

(async function main() {
  const { app } = await loadApp();
  const source = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

  const raw = { id: "task-1", text: "Normalize me", customReceipt: { proof: true } };
  const normalized = app.normalizeTaskRecord(raw);
  assert.notStrictEqual(normalized, raw, "normalization is pure");
  assert.deepStrictEqual(raw, { id: "task-1", text: "Normalize me", customReceipt: { proof: true } }, "source is unchanged");
  assert.deepStrictEqual(app.normalizeTaskRecord(normalized), normalized, "normalization is idempotent");
  assert.deepStrictEqual(normalized.customReceipt, { proof: true }, "unknown fields survive");
  assert.strictEqual(normalized.personId, null, "optional person link is present");
  assert.strictEqual(normalized.projectId, null, "optional project link is present");
  assert.strictEqual(normalized.dueTime, "", "optional due time is present");

  assert.strictEqual(/state\.items\.unshift\s*\(\s*\{/.test(source), false, "task constructors cannot bypass normalization");
  assert.strictEqual(/state\.items\s*=\s*\[\s*\{/.test(source), false, "task array constructors cannot bypass normalization");

  [
    "function applyPortableDoc",
    "function applySyncDoc",
    "function mergeRemoteDoc",
    "store.load().then(function(loadResult)",
  ].forEach(function (anchor) {
    const start = source.indexOf(anchor);
    assert.ok(start >= 0, "ingress anchor exists: " + anchor);
    const window = source.slice(start, start + 5000);
    assert.ok(window.indexOf("state.items=(state.items||[]).map(normalizeTaskRecord);") >= 0, "ingress normalizes tasks: " + anchor);
  });

  console.log("task normalization contracts ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
