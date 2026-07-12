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

  // W6 item 45 — focus reorder: windItems lists today's plate in ARRAY
  // order; moveFocusTask swaps adjacent displayed rows in state.items.
  const st45 = app.getState();
  st45.items = [
    { id: "f1", text: "pinned A", area: "Work", done: false, today: true },
    { id: "skip", text: "not on the plate", area: "Work", done: false },
    { id: "f2", text: "due today", area: "Work", done: false, due: tk },
    { id: "f3", text: "pinned B", area: "Work", done: false, today: true },
  ];
  assert.deepStrictEqual(app.windItems().map((i) => i.id), ["f1", "f2", "f3"], "plate = pinned + due-today, array order");
  assert.strictEqual(app.moveFocusTask("f2", "up"), true);
  assert.deepStrictEqual(app.windItems().map((i) => i.id), ["f2", "f1", "f3"], "f2 moved above f1");
  assert.deepStrictEqual(st45.items.map((i) => i.id), ["f2", "skip", "f1", "f3"], "swap happened in state.items; bystander untouched");
  assert.strictEqual(app.moveFocusTask("f2", "up"), false, "top row can't move up");
  assert.strictEqual(app.moveFocusTask("f3", "down"), false, "bottom row can't move down");
  assert.strictEqual(app.moveFocusTask("skip", "up"), false, "off-plate tasks don't move");
  st45.items = [];
  app.invalidateDayCache();

  // W6 item 48 — library records surface in the ⌘K palette with 2+ chars.
  const st48 = app.getState();
  st48.notes.unshift({ id: "n48", title: "Zebra migration notes", para: "Resource", area: "Work", tags: "", body: "stripes", createdAt: 1 });
  const libHits = app.libraryPaletteEntries("zebra");
  assert.strictEqual(libHits.length, 1, "note found by title");
  assert.strictEqual(libHits[0].label, "Zebra migration notes");
  assert.strictEqual(libHits[0].badge, "Note", "badge shows the record kind");
  assert.strictEqual(typeof libHits[0].run, "function", "palette entries are runnable");
  assert.strictEqual(app.libraryPaletteEntries("stripes").length, 1, "body text matches too");
  assert.deepStrictEqual(app.libraryPaletteEntries("z"), [], "under 2 chars stays commands-only");
  assert.deepStrictEqual(app.libraryPaletteEntries("nomatchxyz"), [], "no false hits");
  st48.notes = st48.notes.filter((n) => n.id !== "n48");

  // W6 item 46 — configurable Close hour: defensive read defaults to 17,
  // accepts sane values, is device-local (SYNC_SKIP) but rides backups.
  const st46 = app.getState();
  const tomorrowKey = app.addDaysKey(tk, 1);
  assert.strictEqual(app.closeHourVal(), 17, "default close hour");
  st46.closeHour = 19;
  assert.strictEqual(app.closeHourVal(), 19);
  st46.closeHour = "7pm";
  assert.strictEqual(app.closeHourVal(), 17, "garbage falls back to 17");
  st46.closeHour = 3;
  assert.strictEqual(app.closeHourVal(), 17, "out-of-range falls back to 17");
  st46.closeHour = 19;
  assert.ok(app.SYNC_SKIP.closeHour, "closeHour never syncs (device-local)");
  assert.strictEqual(app.portableDoc(st46).closeHour, 19, "closeHour rides backups");
  // tomorrow's chosen top-3 reaches the fallback narration
  st46.items.push({ id: "nf1", text: "Ship v0.45", area: "Work", done: false, due: tomorrowKey, today: true, focusTomorrow: true });
  app.updateTomorrowFocus();
  assert.deepStrictEqual(st46.launch.nextFocus, ["Ship v0.45"]);
  assert.ok(app.launchBodyShort(tomorrowKey).indexOf("Focus: Ship v0.45") >= 0, "narration names the chosen focus");
  st46.items = st46.items.filter((i) => i.id !== "nf1");
  st46.closeHour = 17;
  app.invalidateDayCache();

  // W6 item 47 — Life Sweep streak: consecutive swept weeks; the current
  // week still being pending doesn't break the chain; a gap does.
  const st47 = app.getState();
  const w0 = app.weekStartKey(tk);
  const wMinus = (n) => app.addDaysKey(w0, -7 * n);
  st47.sweepLog = {};
  assert.strictEqual(app.sweepStreak(), 0, "no sweeps, no streak");
  st47.sweepLog[wMinus(1)] = 100; st47.sweepLog[wMinus(2)] = 90;
  assert.strictEqual(app.sweepStreak(), 2, "pending current week doesn't break the chain");
  st47.sweepLog[w0] = 110;
  assert.strictEqual(app.sweepStreak(), 3, "this week's sweep counts");
  st47.sweepLog = {}; st47.sweepLog[w0] = 110; st47.sweepLog[wMinus(2)] = 90;
  assert.strictEqual(app.sweepStreak(), 1, "a skipped week breaks the chain");
  // merge: newest timestamp wins per week (roomStats pattern)
  app.mergeSweepLog({ [wMinus(1)]: 95, [w0]: 50 });
  assert.strictEqual(st47.sweepLog[wMinus(1)], 95, "remote week merged in");
  assert.strictEqual(st47.sweepLog[w0], 110, "older remote stamp doesn't clobber");
  assert.strictEqual(app.sweepStreak(), 3, "merge heals the chain");
  assert.ok(app.portableDoc(st47).sweepLog, "sweepLog rides backups (PORTABLE_OBJS)");
  st47.sweepLog = {};

  // W7 item 60 — ?room= deep link (fresh app instances; boot reads the param).
  const deep = await loadApp({ search: "?room=tasks" });
  assert.strictEqual(deep.app.getRoom(), "tasks", "?room=tasks boots into Tasks");
  const deepAlias = await loadApp({ search: "?room=launch" });
  assert.strictEqual(deepAlias.app.getRoom(), "today", "aliases normalize (launch -> today)");
  const deepBad = await loadApp({ search: "?room=nonsense" });
  assert.strictEqual(deepBad.app.getRoom(), "today", "unknown rooms fall back to today");

  // W8 item 62 — lane pins: defensive read, lane-key filtering, sync skip.
  const st62 = deep.app.getState();
  delete st62.lanePins;
  assert.strictEqual(deep.app.lanePinsClean(), null, "missing lanePins reads as none");
  st62.lanePins = { gemini: "devil", groq: "", cloudflare: "bogus", zai: "outside" };
  assert.deepStrictEqual(deep.app.lanePinsClean(), { gemini: "devil", zai: "outside" },
    "clean keeps only real lane keys (seat ids are the relay's to validate)");
  assert.strictEqual(deep.app.buildSyncDoc().lanePins, undefined, "lanePins is device-local (SYNC_SKIP)");
  assert.ok(deep.app.portableDoc(st62).lanePins, "lanePins rides portable backups");
  const roster62 = deep.app.councilRosterList();
  assert.ok(Array.isArray(roster62) && roster62.length === 6 && roster62[0].id === "gemini",
    "roster falls back to the six known seats before any relay contact");

  // W8 item 61 — seat health memory: device-local counts, 3-sample floor,
  // decay past 50 samples, and the dot color bands.
  delete st62.seatStats; // defensive read on states saved before v0.47
  deep.app.recordSeatResult("groq", true);
  deep.app.recordSeatResult("groq", true);
  assert.strictEqual(deep.app.seatReliability("groq"), null, "fewer than 3 samples -> no verdict");
  deep.app.recordSeatResult("groq", false);
  const rel61 = deep.app.seatReliability("groq");
  assert.ok(rel61 && rel61.n === 3 && Math.abs(rel61.rate - 2 / 3) < 1e-9, "rate = ok/(ok+fail)");
  assert.match(deep.app.seatDotHTML("groq"), /seat-dot meh/, "2/3 lands in the amber band");
  for (let i = 0; i < 30; i++) deep.app.recordSeatResult("groq", true);
  assert.match(deep.app.seatDotHTML("groq"), /seat-dot good/, "sustained wins go green");
  for (let i = 0; i < 60; i++) deep.app.recordSeatResult("zai", false);
  const rel61b = deep.app.seatReliability("zai");
  assert.ok(rel61b.n <= 50, "counts decay past 50 samples");
  assert.match(deep.app.seatDotHTML("zai"), /seat-dot bad/, "sustained failures go red");
  assert.strictEqual(deep.app.seatDotHTML("mistral"), "", "unseen seat -> no dot");
  assert.strictEqual(deep.app.buildSyncDoc().seatStats, undefined, "seatStats is device-local (SYNC_SKIP)");

  // W8 item 63 — Council presets: four framings, empty for unknown keys.
  assert.deepStrictEqual(deep.app.COUNCIL_PRESETS.map((p) => p[0]), ["decision", "plan", "devil", "coach"]);
  for (const [key] of deep.app.COUNCIL_PRESETS) {
    assert.ok(deep.app.councilPresetSystem(key).length > 40, key + " has a real framing");
    assert.ok(deep.app.councilPresetLabel(key), key + " has a label");
  }
  assert.match(deep.app.councilPresetSystem("devil"), /Do not balance it with upside/, "devil framing is one-sided by design");
  assert.strictEqual(deep.app.councilPresetSystem("nope"), "", "unknown preset adds nothing");

  // W8 item 67 — only brief/deep ride the ask; Standard sends nothing.
  assert.strictEqual(deep.app.councilLengthOk("brief"), true);
  assert.strictEqual(deep.app.councilLengthOk("deep"), true);
  assert.strictEqual(deep.app.councilLengthOk(""), false, "Standard is the relay default, not a request field");
  assert.strictEqual(deep.app.councilLengthOk("huge"), false);

  // W8 item 66 — universal AI context now covers events and stash items.
  st62.events.push({ id: "ev-66", title: "Dentist", date: "2026-07-20", time: "09:30", end: null, area: "Inbox", source: "app", location: "Main St" });
  st62.stash.push({ id: "st-66", title: "ES5 tricks", url: "https://example.com/es5", tags: "js,notes", summary: "Old-school patterns.", status: "done", ts: 0 });
  const evCtx = deep.app.aiContext("event", "ev-66");
  assert.ok(evCtx && /Dentist/.test(evCtx.text) && /2026-07-20 at 09:30/.test(evCtx.text) && /Main St/.test(evCtx.text), "event context carries when/where");
  const stCtx = deep.app.aiContext("stash", "st-66");
  assert.ok(stCtx && /example\.com\/es5/.test(stCtx.text) && /Old-school patterns/.test(stCtx.text), "stash context carries url+summary");
  assert.strictEqual(deep.app.aiContext("event", "nope"), null, "unknown event -> null");
  assert.strictEqual(deep.app.aiContext("stash", "nope"), null, "unknown stash -> null");

  // W8 item 65 — weekly Council retro: client-side digest rides the question
  // as q.ctx (no server doc read); the queue card text stays short.
  st62.items.unshift({ id: "t-65", text: "File the taxes", area: "Money", today: false, done: false, due: deep.app.todayKey(), projectId: null, repeat: "" });
  const wc65 = deep.app.weeklyContextText(deep.app.todayKey());
  assert.ok(/^Week starting: /.test(wc65) && /File the taxes/.test(wc65), "digest is built from local state");
  deep.app.councilRetroAsk();
  const q65 = deep.app.getState().council[0];
  assert.match(q65.text, /Weekly retro:/, "retro question queued");
  assert.ok(/^My week:\n/.test(q65.ctx) && /File the taxes/.test(q65.ctx), "week digest rides as ctx, not in the visible text");
  assert.strictEqual(q65.status, "queued", "no relay in tests -> stays queued");

  // W8 item 70 — profile-fact hygiene: dedupe keeps the freshest copy and
  // tombstones the rest; the stale card surfaces the oldest unreviewed fact.
  const now70 = Date.now();
  st62.profile = [
    { id: "f-old", t: "Kevin ships KevinOS.", cat: "context", createdAt: now70 - 200 * 86400000 },
    { id: "f-new", t: "kevin  ships kevinos", cat: "context", createdAt: now70, u: now70 },
    { id: "f-keep", t: "Coaches football on Fridays", cat: "schedule", createdAt: now70 - 100 * 86400000, u: now70 - 100 * 86400000 },
    { id: "f-fresh", t: "Prefers ES5", cat: "preference", createdAt: now70 },
  ];
  assert.deepStrictEqual(deep.app.profileDupeIds(), ["f-old"], "case/space/punctuation variants collapse; freshest survives");
  assert.strictEqual(deep.app.staleFact().id, "f-old", "oldest stale fact surfaces first");
  assert.strictEqual(deep.app.dedupeProfileFacts(), 1, "one duplicate removed");
  assert.ok(deep.app.getState().deleted["f-old"], "removed duplicate is tombstoned for sync");
  assert.strictEqual(deep.app.staleFact().id, "f-keep", "next-oldest stale fact is up for review");
  deep.app.touch(deep.app.getState().profile.filter((f) => f.id === "f-keep")[0]);
  assert.strictEqual(deep.app.staleFact(), null, "touch marks a fact reviewed for another " + deep.app.FACT_STALE_DAYS + " days");

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
