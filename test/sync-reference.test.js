// Research-only operation stream reference model. It exercises the current
// snapshot merge/tombstone laws; it is not a production sync implementation.
"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

function rng(seed) {
  let x = seed >>> 0;
  return function () { x = (x * 1664525 + 1013904223) >>> 0; return x; };
}

function referenceFold(ops) {
  const records = new Map();
  const deleted = Object.create(null);
  for (const op of ops.slice().sort((a, b) => a.clock - b.clock || a.id.localeCompare(b.id))) {
    if (op.type === "delete") { deleted[op.targetId] = Math.max(deleted[op.targetId] || 0, op.clock); records.delete(op.targetId); }
    else if (!deleted[op.targetId]) { const current = records.get(op.targetId); if (!current || op.clock > current.u) records.set(op.targetId, { id: op.targetId, text: op.value, u: op.clock }); }
  }
  return { items: [...records.values()].sort((a, b) => a.id.localeCompare(b.id)), deleted };
}

function deviceFold(ops) { return referenceFold(ops); }

function mergeDocs(app, local, remote) {
  const deleted = Object.assign({}, local.deleted);
  for (const id of Object.keys(remote.deleted)) deleted[id] = Math.max(deleted[id] || 0, remote.deleted[id]);
  const items = app.mergeById(local.items, remote.items).filter((x) => !deleted[x.id]);
  return { items, deleted };
}

function canonical(doc) {
  return JSON.stringify({ items: doc.items.slice().sort((a, b) => a.id.localeCompare(b.id)), deleted: Object.keys(doc.deleted).sort().map((id) => [id, doc.deleted[id]]) });
}

function permutations(xs) {
  if (xs.length < 2) return [xs];
  const out = [];
  xs.forEach((x, i) => permutations(xs.slice(0, i).concat(xs.slice(i + 1))).forEach((rest) => out.push([x].concat(rest))));
  return out;
}

function fixture(seed) {
  const next = rng(seed), ops = [];
  let clock = seed * 1000 + 1;
  for (let i = 0; i < 12; i++) {
    const targetId = "task-" + i;
    ops.push({ id: "op-" + clock, type: "put", targetId, value: "seed " + seed + " item " + i, clock: clock++, device: next() % 3 });
    const edits = next() % 3;
    for (let j = 0; j < edits; j++) ops.push({ id: "op-" + clock, type: "put", targetId, value: "seed " + seed + " item " + i + " edit " + j, clock: clock++, device: next() % 3 });
    if (next() % 5 === 0) ops.push({ id: "op-" + clock, type: "delete", targetId, clock: clock++, device: next() % 3 });
  }
  return ops;
}

(async function main() {
  const { app } = await loadApp();
  const orders = permutations([0, 1, 2]);

  for (let seed = 1; seed <= 50; seed++) {
    const ops = fixture(seed);
    const expected = canonical(referenceFold(ops));
    const docs = [0, 1, 2].map((device) => deviceFold(ops.filter((op) => op.device === device)));
    for (const order of orders) {
      let merged = { items: [], deleted: {} };
      for (const device of order) merged = mergeDocs(app, merged, docs[device]);
      assert.strictEqual(canonical(merged), expected, "seed " + seed + " converges in device order " + order.join("-"));
      assert.strictEqual(canonical(mergeDocs(app, merged, docs[order[0]])), expected, "replay is idempotent for seed " + seed);
    }
  }

  console.log("operation-based sync reference ok (50 fixed seeds × 6 permutations)");
})().catch((err) => { console.error(err); process.exit(1); });
