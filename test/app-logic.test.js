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

  // escapeHtml — contract since W2 item 14: escapes & < > " AND ' (the
  // apostrophe is defense-in-depth; the app's attributes stay double-quoted).
  assert.strictEqual(app.escapeHtml('<a b="c">&\''), "&lt;a b=&quot;c&quot;&gt;&amp;&#39;");

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
  assert.strictEqual(app.nextRepeatKey("2026-01-31", "monthly"), "2026-02-28", "W6.0b: monthly overflow clamps to the target month's last day (old pin: 2026-03-03 via Date rollover)");
  assert.strictEqual(app.nextRepeatKey("2026-07-10", "weekdays"), "2026-07-13", "Fri+weekdays -> Mon");
  assert.strictEqual(app.nextRepeatKey("2026-07-11", "weekdays"), "2026-07-13", "Sat+weekdays -> Mon");
  assert.strictEqual(app.nextRepeatKey("2026-07-10", "nope"), null);

  // uid shape (ids are [a-z0-9]; the W2 ingress sanitizer relies on this).
  for (let i = 0; i < 20; i++) assert.match(app.uid(), /^[a-z0-9]+$/);

  // W6 item 54 — day-change model: same-day check is a no-op that reports
  // false; the midnight flip itself is a MANUAL-UNVERIFIED on-device drill.
  assert.strictEqual(app.checkDayChange(), false, "same-day checkDayChange is a no-op");
  assert.strictEqual(app.DAY_CHECK_MS, 60000, "foreground day-check cadence");

  // W6 item 33 — dayDigest memo: identical object on a repeat call, flushed
  // by every mutation funnel (touch / bury / explicit invalidation).
  const st33 = app.getState();
  st33.items.unshift({ id: "m33", text: "memo probe", area: "Work", due: tk, done: false });
  app.invalidateDayCache();
  const d1 = app.dayDigest(tk);
  assert.strictEqual(app.dayDigest(tk), d1, "memo hit returns the same digest object");
  assert.strictEqual(d1.tasks.some((t) => t.id === "m33"), true, "digest sees the seeded task");
  app.touch(st33.items[0]);
  assert.notStrictEqual(app.dayDigest(tk), d1, "touch() flushes the memo");
  const d2 = app.dayDigest(tk);
  app.bury("m33");
  assert.notStrictEqual(app.dayDigest(tk), d2, "bury() flushes the memo");
  st33.items = st33.items.filter((i) => i.id !== "m33");
  app.invalidateDayCache();

  // W6 item 43 — generalized undo. Undo-delete restores under a FRESH id
  // (the old id's tombstone may have synced; a re-minted id survives every
  // merge path). Undo-complete reopens and removes the rolled recurring clone.
  const st43 = app.getState();
  st43.items = [
    { id: "u1", text: "first", area: "Work", done: false },
    { id: "u2", text: "victim", area: "Work", done: false, today: true },
    { id: "u3", text: "third", area: "Work", done: false },
  ];
  // delete + undo
  const victim = st43.items[1];
  app.bury("u2"); st43.items = st43.items.filter((i) => i.id !== "u2");
  app.armUndo({ kind: "delete", item: JSON.parse(JSON.stringify(victim)), index: 1 }, "Task deleted");
  app.runUndo();
  assert.strictEqual(st43.items.length, 3, "deleted task restored");
  assert.strictEqual(st43.items[1].text, "victim", "restored at its old position");
  assert.notStrictEqual(st43.items[1].id, "u2", "restored under a FRESH id");
  assert.ok(st43.deleted["u2"], "the old id's tombstone stays (the delete really happened)");
  // complete + undo (with a rolled recurring clone)
  const rec = { id: "u4", text: "swim", area: "Coaching", done: false, today: true, due: tk, repeat: "daily" };
  st43.items.push(rec);
  rec.done = true; rec.today = false;
  const rolledId = app.rollRecurring(rec);
  assert.ok(rolledId, "rollRecurring returns the clone id now");
  app.armUndo({ kind: "complete", id: "u4", today: true, rolledId: rolledId }, "Done");
  app.runUndo();
  assert.strictEqual(app.findItem("u4").done, false, "undo reopened the task");
  assert.strictEqual(app.findItem("u4").today, true, "pin state restored");
  assert.strictEqual(app.findItem(rolledId), null, "rolled clone removed");
  assert.ok(st43.deleted[rolledId], "rolled clone buried so sync can't resurrect it");
  app.runUndo(); // no-op when nothing armed
  st43.items = [];
  app.invalidateDayCache();

  // W4.15 — v2 sync-key derivation: deterministic, prefixed, and exactly
  // PBKDF2-SHA256(passphrase, "kevinos-sync-v2", SYNC_KDF_ITERS, 32 bytes).
  const k2a = await app.deriveSyncKeyV2("correct horse battery");
  const k2b = await app.deriveSyncKeyV2("correct horse battery");
  assert.strictEqual(k2a, k2b, "v2 derivation is deterministic");
  assert.match(k2a, /^v2:[a-f0-9]{64}$/);
  const expected = "v2:" + require("crypto").pbkdf2Sync("correct horse battery", "kevinos-sync-v2", app.SYNC_KDF_ITERS, 32, "sha256").toString("hex");
  assert.strictEqual(k2a, expected, "matches the PBKDF2 reference vector");
  const k1 = await app.deriveSyncKey("correct horse battery");
  assert.match(k1, /^[a-f0-9]{64}$/);
  assert.notStrictEqual("v2:" + k1, k2a, "v1 and v2 keys differ");

  console.log("app-logic harness ok");
})().catch((err) => { console.error(err); process.exit(1); });
