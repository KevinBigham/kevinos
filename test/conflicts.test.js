// Test-only material-ambiguity fixtures. These diagnostics deliberately do
// not enter production state or UI until a real sync ambiguity is observed.
"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

function norm(v) {
  if (typeof v === "string") return v.trim().replace(/\s+/g, " ").toLowerCase();
  if (v == null) return "";
  return JSON.stringify(v);
}

const NAMED_FIELDS = {
  items: ["text", "done", "focusDate", "focusRank"],
  projects: ["nextAction"],
  builds: ["next"],
};

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24); }
  return (h >>> 0).toString(16);
}

function diagnose(collection, a, b, deleted) {
  if (!a || !b || a.id !== b.id || deleted[a.id] || (a.u || 0) !== (b.u || 0)) return null;
  const fields = (NAMED_FIELDS[collection] || []).filter((field) => norm(a[field]) !== norm(b[field]));
  if (!fields.length) return null;
  const pair = [JSON.stringify(a), JSON.stringify(b)].sort();
  return { id: "conflict-" + hash(collection + "|" + a.id + "|" + pair.join("|")), collection, recordId: a.id, fields, status: "open" };
}

function resolve(receipt, choice) {
  if (!receipt || receipt.status !== "open" || (choice !== "local" && choice !== "remote" && choice !== "combined")) return receipt;
  return Object.assign({}, receipt, { status: "resolved", resolution: choice, resolvedAt: 1 });
}

(async function main() {
  const { app } = await loadApp();

  const local = { id: "task-1", text: "Email the parent group", done: false, u: 100 };
  const remote = { id: "task-1", text: "Call the parent representative", done: false, u: 100 };
  const receipt = diagnose("items", local, remote, {});
  assert.ok(receipt, "material same-stamp ambiguity produces one test diagnostic");
  assert.deepStrictEqual(receipt.fields, ["text"]);
  assert.strictEqual(diagnose("items", remote, local, {}).id, receipt.id, "candidate order cannot duplicate the same ambiguity");
  assert.strictEqual(app.mergeById([local], [remote])[0].text, remote.text, "production remote-tie rule remains unchanged");

  assert.strictEqual(diagnose("items", local, Object.assign({}, remote, { text: "  EMAIL   THE PARENT GROUP " }), {}), null, "equal normalized values stay quiet");
  assert.strictEqual(diagnose("items", local, Object.assign({}, remote, { u: 101 }), {}), null, "routine newer-wins edits stay quiet");
  assert.strictEqual(diagnose("items", local, remote, { "task-1": 200 }), null, "tombstones take precedence without retaining alternate text");

  const completion = diagnose("items", { id: "task-2", text: "Draft", done: true, u: 200 }, { id: "task-2", text: "Draft revised", done: false, u: 200 }, {});
  assert.deepStrictEqual(completion.fields, ["text", "done"], "complete/edit race is one record diagnostic, not one card per field");
  const focus = diagnose("items", { id: "task-3", text: "A", focusDate: "2026-08-11", focusRank: 1, u: 300 }, { id: "task-3", text: "A", focusDate: "2026-08-11", focusRank: 2, u: 300 }, {});
  assert.deepStrictEqual(focus.fields, ["focusRank"], "focus-rank race is named and bounded");

  const closed = resolve(receipt, "combined");
  assert.strictEqual(closed.status, "resolved");
  assert.strictEqual(resolve(closed, "remote"), closed, "a stale choice cannot reopen a terminal diagnostic");
  assert.strictEqual(diagnose("unknown", local, remote, {}), null, "unnamed collections never produce diagnostics");
  assert.strictEqual(diagnose("items", { bad: true }, remote, {}), null, "malformed candidates are ignored");

  console.log("material conflict fixtures ok (test-only; production gate remains closed)");
})().catch((err) => { console.error(err); process.exit(1); });
