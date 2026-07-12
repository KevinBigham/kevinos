// W1 item 21 — harness sanity + pure-core characterization.
// Pins CURRENT v0.40 behavior ahead of the W2 refactors.

"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const { app, localStorage } = await loadApp();

  // The harness resolved every export we rely on.
  const required = [
    "parseCaptureText", "mergeById", "mergeRemoteDoc", "portableDoc", "applyPortableDoc",
    "parseICS", "expandRecurrence", "rollRecurring", "habitCurrentStreak", "habitLongestStreak",
    "buildSyncDoc", "applySyncDoc", "escapeHtml", "todayKey", "addDaysKey",
  ];
  for (const n of required) assert.strictEqual(typeof app[n], "function", "export missing: " + n);
  assert.strictEqual(typeof app.SCHEMA_VERSION, "number", "SCHEMA_VERSION exported");
  assert.strictEqual(typeof app.APP_VERSION, "string", "APP_VERSION exported");

  // Boot persisted a fresh state stamped with the current schema.
  const stored = JSON.parse(localStorage.getItem("kevinos:v1"));
  assert.ok(stored && typeof stored === "object", "boot persisted state");
  assert.strictEqual(stored.v, app.SCHEMA_VERSION, "persisted v === SCHEMA_VERSION");

  // Fresh boot seeds (prevV<4 / <5 gates fire on empty storage).
  assert.ok(stored.builds.length >= 1, "seedDefaults ran");
  assert.ok(stored.prompts.length >= 1, "seedPrompts ran");

  // Boot room is Today.
  assert.strictEqual(app.getRoom(), "today", "boot room is today");
  assert.strictEqual(app.normalizeRoom("home"), "today");
  assert.strictEqual(app.normalizeRoom("launch"), "today");
  assert.strictEqual(app.normalizeRoom("next"), "next", "next is NOT aliased");

  // escapeHtml — CURRENT contract: escapes & < > " but NOT ' (safe only
  // because every attribute in the app is double-quoted; W2 item 14 upgrades
  // this and must update this pin).
  assert.strictEqual(app.escapeHtml('<a b="c">&\''), "&lt;a b=&quot;c&quot;&gt;&amp;'");

  // Date helpers round-trip.
  const tk = app.todayKey();
  assert.match(tk, /^\d{4}-\d{2}-\d{2}$/);
  assert.strictEqual(app.addDaysKey(tk, 0), tk);
  assert.strictEqual(app.addDaysKey(app.addDaysKey(tk, 40), -40), tk);
  assert.strictEqual(app.addDaysKey("2026-02-28", 1), "2026-03-01", "non-leap rollover");
  assert.strictEqual(app.addDaysKey("2028-02-28", 1), "2028-02-29", "leap year");

  // nextRepeatKey semantics.
  assert.strictEqual(app.nextRepeatKey("2026-07-10", "daily"), "2026-07-11");
  assert.strictEqual(app.nextRepeatKey("2026-07-10", "weekly"), "2026-07-17");
  assert.strictEqual(app.nextRepeatKey("2026-01-31", "monthly"), "2026-03-03", "monthly overflow rolls via Date (current behavior)");
  assert.strictEqual(app.nextRepeatKey("2026-07-10", "weekdays"), "2026-07-13", "Fri+weekdays -> Mon");
  assert.strictEqual(app.nextRepeatKey("2026-07-11", "weekdays"), "2026-07-13", "Sat+weekdays -> Mon");
  assert.strictEqual(app.nextRepeatKey("2026-07-10", "nope"), null);

  // uid shape (ids are [a-z0-9]; the W2 ingress sanitizer relies on this).
  for (let i = 0; i < 20; i++) assert.match(app.uid(), /^[a-z0-9]+$/);

  console.log("app-logic harness ok");
})().catch((err) => { console.error(err); process.exit(1); });
