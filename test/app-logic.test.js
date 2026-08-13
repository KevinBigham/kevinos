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
    "buildSyncDoc", "applySyncDoc", "escapeHtml", "todayKey", "addDaysKey", "normalizeTaskRecord",
  ];
  for (const n of required) assert.strictEqual(typeof app[n], "function", "export missing: " + n);
  assert.strictEqual(typeof app.SCHEMA_VERSION, "number", "SCHEMA_VERSION exported");
  assert.strictEqual(typeof app.APP_VERSION, "string", "APP_VERSION exported");

  // Boot persisted a fresh state stamped with the current schema.
  const stored = JSON.parse(localStorage.getItem("kevinos:v1"));
  assert.ok(stored && typeof stored === "object", "boot persisted state");
  assert.strictEqual(stored.v, app.SCHEMA_VERSION, "persisted v === SCHEMA_VERSION");

  // Fresh normal mode is real blank state, never silent demo content.
  assert.deepStrictEqual(stored.builds, [], "fresh boot does not seed sample builds");
  assert.strictEqual(stored.briefs.length, app.PLAYBOOK_SEEDS.length, "fresh boot seeds reusable first-party playbook templates only");
  assert.ok(stored.briefs.every((b) => b.kind === "Playbook" && b.builtIn && b.createdAt === 0), "fresh briefs are config-like templates, never fake active work");
  assert.deepStrictEqual(stored.links, [], "fresh boot does not seed sample links");
  assert.deepStrictEqual(stored.prompts, [], "fresh boot does not seed sample prompts");

  // K0 canonical task ingress: complete optional shape, legacy safety, and
  // repeated normalization without source mutation.
  const legacyTask = { id: "legacy-task", text: 7, area: "Work", due: undefined, personId: "person-a", custom: { keep: true } };
  const legacyBefore = JSON.stringify(legacyTask);
  const normalizedTask = app.normalizeTaskRecord(legacyTask);
  assert.strictEqual(JSON.stringify(legacyTask), legacyBefore, "task normalization is pure");
  assert.deepStrictEqual(app.normalizeTaskRecord(normalizedTask), normalizedTask, "task normalization is idempotent");
  assert.strictEqual(normalizedTask.text, "7");
  assert.strictEqual(normalizedTask.personId, "person-a");
  assert.strictEqual(normalizedTask.projectId, null);
  assert.strictEqual(normalizedTask.due, null);
  assert.strictEqual(normalizedTask.dueTime, "");
  assert.strictEqual(normalizedTask.repeat, "");
  assert.deepStrictEqual(normalizedTask.custom, { keep: true }, "unknown compatible fields survive");
  const malformedTask = app.normalizeTaskRecord(null);
  assert.strictEqual(malformedTask.text, "");
  assert.strictEqual(malformedTask.area, "Inbox");
  assert.strictEqual(malformedTask.personId, null);

  const linkedStored = {
    v: app.SCHEMA_VERSION,
    items: [{ id: "linked-task", text: "Call Avery", area: "Inbox", personId: "person-a" }],
    people: [{ id: "person-a", name: "Avery", note: "Private canonical note" }],
  };
  const linkedBoot = await loadApp({ storedState: linkedStored });
  assert.strictEqual(linkedBoot.app.getState().items[0].personId, "person-a", "task-person link survives reload");
  const linkedPortable = linkedBoot.app.portableDoc(linkedBoot.app.getState());
  linkedBoot.app.getState().items = [];
  assert.strictEqual(linkedBoot.app.applyPortableDoc(linkedPortable), true);
  assert.strictEqual(linkedBoot.app.getState().items[0].personId, "person-a", "task-person link survives portable export/import");
  const changedPerson = linkedBoot.app.normalizeTaskRecord(Object.assign({}, linkedBoot.app.getState().items[0], { personId: "person-b" }));
  assert.strictEqual(changedPerson.personId, "person-b", "task-person link can change");
  const clearedPerson = linkedBoot.app.normalizeTaskRecord(Object.assign({}, changedPerson, { personId: null }));
  assert.strictEqual(clearedPerson.personId, null, "task-person link can clear");

  // Boot room is Today.
  assert.strictEqual(app.getRoom(), "today", "boot room is today");
  assert.strictEqual(app.normalizeRoom("home"), "today");
  assert.strictEqual(app.normalizeRoom("launch"), "today");
  assert.strictEqual(app.normalizeRoom("next"), "next", "next is NOT aliased");
  assert.strictEqual(app.normalizeRoom("nonsense"), "today", "unknown routes converge on Today");
  assert.strictEqual(app.roomDef("next").label, "Plan & Review", "compat route has canonical label");
  assert.strictEqual(new Set(app.ROOM_DEFS.map((d) => d.id)).size, app.ROOM_DEFS.length, "room ids are unique");
  for (const d of app.ROOM_DEFS) assert.strictEqual(typeof d.renderer, "function", d.id + " has a renderer");

  // escapeHtml — contract since W2 item 14: escapes & < > " AND ' (the
  // apostrophe is defense-in-depth; the app's attributes stay double-quoted).
  assert.strictEqual(app.escapeHtml('<a b="c">&\''), "&lt;a b=&quot;c&quot;&gt;&amp;&#39;");
  assert.strictEqual(app.normalizeUrl("example.com/path"), "https://example.com/path");
  assert.strictEqual(app.normalizeUrl("javascript://alert(1)"), "", "active URL schemes are rejected");
  assert.strictEqual(app.safeHttpUrl("data:text/html,bad"), "", "non-web provider URLs are inert");
  assert.strictEqual(app.safeHttpUrl("https://user:pass@example.com/"), "", "credential-bearing URLs are rejected");
  const highRisk = app.highStakesCardHTML("replace-test", "Replace local data?", "Checked", "Current content changes.", 'data-yes="1"', "Replace", 'data-no="1"');
  assert.match(highRisk, /role="alertdialog"/);
  assert.match(highRisk, /aria-modal="true"/);
  assert.match(highRisk, /Consequence:/);
  assert.match(highRisk, /data-no="1"/, "high-stakes card always has an explicit cancel action");
  const errorSummary = app.errorSummaryHTML("errors", "Fix these", [{ href: "field-one", text: "Review field one" }]);
  assert.match(errorSummary, /role="alert"/);
  assert.match(errorSummary, /href="#field-one"/, "error summaries navigate directly to invalid fields");
  const drillStateBefore = JSON.stringify(app.getState());
  const drillDoc = app.portableDoc(app.getState());
  const drillRaw = JSON.stringify(drillDoc);
  const drillPass = app.recoveryDrillDocument(drillRaw, drillDoc);
  assert.strictEqual(drillPass.ok, true, "portable backup passes the read-only drill");
  assert.strictEqual(drillPass.collectionsPresent, app.CONTENT_ARRAYS.length);
  assert.strictEqual(drillPass.connectionsExcluded, true);
  assert.strictEqual(drillPass.differences, 0);
  assert.ok(drillPass.fingerprint, "drill records a content fingerprint, not titles");
  assert.strictEqual(JSON.stringify(app.getState()), drillStateBefore, "drill parsing is byte-identical for canonical state");
  assert.strictEqual(app.recoveryDrillDocument("{bad", drillDoc).status, "malformed", "malformed backup fails closed");
  assert.strictEqual(app.recoveryDrillDocument(JSON.stringify({ v: app.SCHEMA_VERSION + 1, items: [] }), drillDoc).warnings[0].includes("newer"), true, "newer schema is reported safely");
  assert.strictEqual(app.recoveryDrillDocument(JSON.stringify({ v: app.SCHEMA_VERSION - 1, items: [] }), drillDoc).warnings[0].includes("older"), true, "older schema remains inspectable");
  assert.strictEqual(app.recoveryDrillDocument("x".repeat(app.RECOVERY_DRILL_MAX_BYTES + 1), drillDoc).status, "too-large", "oversized drill input is rejected before parse");
  const connectionBackup = Object.assign({}, drillDoc, { sync: { key: "must-not-travel" } });
  assert.strictEqual(app.recoveryDrillDocument(JSON.stringify(connectionBackup), drillDoc).connectionsExcluded, false, "unexpected connection fields are surfaced, not imported");
  app.recordRecoveryDrill(drillPass);
  assert.strictEqual(app.recoveryDrillMeta().status, "pass", "only bounded device-local drill metadata is retained");
  assert.strictEqual(JSON.stringify(app.getState()), drillStateBefore, "recording drill metadata does not touch portable/synced state");

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

  // v0.51 — focus reorder is a daily metadata overlay, never storage order.
  const st45 = app.getState();
  st45.items = [
    { id: "f1", text: "pinned A", area: "Work", done: false, today: true },
    { id: "skip", text: "not on the plate", area: "Work", done: false },
    { id: "f2", text: "due today", area: "Work", done: false, due: tk },
    { id: "f3", text: "pinned B", area: "Work", done: false, today: true },
  ];
  const storageBeforeFocusMove = st45.items.map((i) => i.id);
  assert.deepStrictEqual(app.windItems().map((i) => i.id), ["f1", "f2", "f3"], "plate = pinned + due-today, array order");
  assert.strictEqual(app.moveFocusTask("f2", "up"), true);
  assert.deepStrictEqual(app.focusItems(tk).map((i) => i.id), ["f2", "f1", "f3"], "f2 moved above f1 in focus only");
  assert.deepStrictEqual(st45.items.map((i) => i.id), storageBeforeFocusMove, "canonical item order and bystander stay untouched");
  assert.strictEqual(app.moveFocusTask("f2", "up"), false, "top row can't move up");
  assert.strictEqual(app.moveFocusTask("f3", "down"), false, "bottom row can't move down");
  assert.strictEqual(app.moveFocusTask("skip", "up"), false, "off-plate tasks don't move");
  st45.items = [];
  app.invalidateDayCache();

  // Convergence NOW: deterministic focus, physical action, hard stop, and
  // overdue risk come only from local authoritative state.
  const stNow = app.getState();
  stNow.projects = [{ id: "np1", title: "Release", outcome: "Ship safely", nextAction: "Run the focused gate", status: "Active" }];
  stNow.items = [
    { id: "n1", text: "Ship KevinOS", area: "Work", projectId: "np1", today: true, done: false, due: app.addDaysKey(tk, -1) },
    { id: "n2", text: "Review notes", area: "Inbox", today: true, done: false },
    { id: "n3", text: "Close loop", area: "Personal", today: true, done: false },
    { id: "n4", text: "Hidden fourth", area: "Work", today: true, done: false },
  ];
  stNow.events = [{ id: "hs1", title: "Practice", date: tk, time: "18:00" }];
  app.invalidateDayCache();
  const now = app.nowModel(tk, "12:00");
  assert.strictEqual(now.outcome, "Ship KevinOS");
  assert.strictEqual(now.nextAction, "Run the focused gate", "linked project supplies the physical action");
  assert.deepStrictEqual(now.commitments.map((x) => x.id), ["n1", "n2", "n3"], "NOW shows at most three commitments in chosen order");
  assert.strictEqual(now.overdue, 1, "overdue risk is deterministic");
  assert.deepStrictEqual(now.hardStop, { time: "18:00", title: "Practice" });
  stNow.items = []; stNow.projects = []; stNow.events = []; app.invalidateDayCache();

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
  const evCtx = deep.app.aiContext("event", "ev-66", {});
  assert.ok(evCtx && /Dentist/.test(evCtx.text) && /2026-07-20 at 09:30/.test(evCtx.text), "event context carries title and time");
  assert.doesNotMatch(evCtx.text, /Main St/, "event location stays local unless explicitly shared");
  assert.match(deep.app.aiContext("event", "ev-66", { calendarDetails: true }).text, /Main St/, "event location can be explicitly shared");
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

  // W8 boot-restore fix — the loader whitelist dropped six post-v0.39 fields
  // on every reload (devices, sweepLog, closeHour, theme, lanePins, seatStats).
  // Pin the full round-trip: persisted values must survive a fresh boot.
  const rt = await loadApp({
    storedState: {
      v: app.SCHEMA_VERSION,
      items: [], // arrays come via CONTENT_ARRAYS; one is enough to prove the path
      devices: { "dev-1": { name: "Mac", lastSeen: 111 } },
      sweepLog: { "2026-07-06": 222 },
      closeHour: 21,
      theme: "dark",
      lanePins: { groq: "devil" },
      seatStats: { groq: { ok: 9, fail: 1 } },
    },
  });
  const rtState = rt.app.getState();
  assert.deepStrictEqual(rtState.devices, { "dev-1": { name: "Mac", lastSeen: 111 } }, "devices survive boot");
  assert.deepStrictEqual(rtState.sweepLog, { "2026-07-06": 222 }, "sweepLog survives boot (streak intact)");
  assert.strictEqual(rtState.closeHour, 21, "closeHour survives boot");
  assert.strictEqual(rtState.theme, "dark", "manual theme survives boot");
  assert.deepStrictEqual(rtState.lanePins, { groq: "devil" }, "lanePins survive boot");
  assert.deepStrictEqual(rtState.seatStats, { groq: { ok: 9, fail: 1 } }, "seatStats survive boot");

  // V2-F1 — auto-discovery round-trip. The six-field pin above catches the
  // fields that were already lost once; this walker catches the seventh.
  // It boots a fresh app, takes the app's OWN persisted doc as the source of
  // truth for "what is a persisted field", plants a sentinel in every
  // top-level key, and asserts each survives a second boot. A new state
  // field the boot whitelist doesn't restore fails here loudly, by name.
  // Rule (CONTRIBUTING-AI): new persisted field ⇒ same-commit round-trip coverage.
  const fresh = await loadApp({});
  const freshSaved = JSON.parse(fresh.localStorage._dump()["kevinos:v1"]);
  const RT_SKIP = { v: true }; // stamped to SCHEMA_VERSION at boot by design
  // Bespoke sentinels for fields the loader rebuilds by shape or value-guards;
  // everything else gets a generic sentinel by type. A new field of a type the
  // walker doesn't understand fails below until it gets a rule — deliberately.
  const sentinels = {};
  for (const k of Object.keys(freshSaved)) {
    if (RT_SKIP[k]) continue;
    const v = freshSaved[k];
    if (k === "github") {
      sentinels[k] = {
        plant(d) { d.github = { token: "", session: "", login: "rt-login", pendingOAuth: false }; },
        check(s) { return !!(s.github && s.github.login === "rt-login"); },
      };
    } else if (k === "relay") {
      sentinels[k] = {
        plant(d) { d.relay = { url: "https://rt.example", token: "" }; },
        check(s) { return !!(s.relay && s.relay.url === "https://rt.example"); },
      };
    } else if (k === "theme") {
      sentinels[k] = { plant(d) { d.theme = "dark"; }, check(s) { return s.theme === "dark"; } };
    } else if (k === "attention") {
      sentinels[k] = { plant(d) { d.attention = { version: 1, enabled: true, retentionDays: 30, lastPrunedAt: 7, receipts: [{ id: "rt-attention", ts: Date.now(), day: new Date().toISOString().slice(0, 10), type: "task-completed", source: "test" }] }; }, check(s) { return !!(s.attention && s.attention.enabled && s.attention.receipts && s.attention.receipts.some((r) => r && r.id === "rt-attention")); } };
    } else if (k === "weatherLoc") {
      sentinels[k] = {
        plant(d) { d.weatherLoc = { lat: 1, lon: 2, __rt: "rt-w" }; },
        check(s) { return !!(s.weatherLoc && s.weatherLoc.__rt === "rt-w"); },
      };
    } else if (Array.isArray(v)) {
      const sid = "rt" + k.toLowerCase();
      sentinels[k] = {
        plant(d) { d[k].unshift({ id: sid, text: "rt sentinel", u: 1 }); },
        check(s) { return Array.isArray(s[k]) && s[k].some((it) => it && it.id === sid); },
      };
    } else if (typeof v === "number") {
      const want = (v || 0) + 7;
      sentinels[k] = { plant(d) { d[k] = want; }, check(s) { return s[k] === want; } };
    } else if (typeof v === "string") {
      const want = "rt-" + k;
      sentinels[k] = { plant(d) { d[k] = want; }, check(s) { return s[k] === want; } };
    } else if (v && typeof v === "object") {
      const want = "rt-" + k;
      sentinels[k] = { plant(d) { d[k].__rt = want; }, check(s) { return !!(s[k] && s[k].__rt === want); } };
    } else {
      assert.fail("persisted field '" + k + "' has no round-trip sentinel rule — teach the V2-F1 walker to plant one (new persisted field => same-commit round-trip coverage)");
    }
  }
  const rtDoc = JSON.parse(JSON.stringify(freshSaved));
  for (const k of Object.keys(sentinels)) sentinels[k].plant(rtDoc);
  const rt2 = await loadApp({ storedState: rtDoc });
  const rtSt2 = rt2.app.getState();
  const lost = Object.keys(sentinels).filter((k) => !sentinels[k].check(rtSt2));
  assert.deepStrictEqual(lost, [], "boot dropped persisted field(s): [" + lost.join(", ") + "] — restore them in index.html's boot whitelist in the SAME commit that adds them");

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

  // Inbox Intelligence — selecting one AI option prepares the existing human
  // review draft contract; it never skips straight to /google/send.
  const intelDraft = app.emailIntelDraftFrom(
    { to: "coach@example.com", subject: "Re: Meet plan", threadId: "thread-1", messageId: "msg-header-1", account: "kevin@example.com" },
    { label: "Warm", body: "Thanks — this plan works for me." },
    "fallback@example.com"
  );
  assert.deepStrictEqual(intelDraft, {
    to: "coach@example.com",
    subject: "Re: Meet plan",
    body: "Thanks — this plan works for me.",
    threadId: "thread-1",
    messageId: "msg-header-1",
    account: "kevin@example.com",
    intelligence: true,
  }, "Inbox Intelligence reply enters the normal editable draft gate");

  const intelState = app.getState();
  intelState.relay.url = "https://relay.example";
  intelState.email.session = "session-1";
  intelState.email.accounts = ["kevin@example.com"];
  intelState.email.active = "kevin@example.com";
  const intelHTML = app.emailIntelHTML();
  assert.match(intelHTML, /Inbox Intelligence/, "connected Email room renders the intelligence card");
  assert.match(intelHTML, /find the 10 most recent emails/i, "card starts with the relationship-aware default prompt");
  assert.match(intelHTML, /Nothing sends without your review and approval/, "card states the human send gate");

  assert.strictEqual(app.relay401IsAccount({ error: "not connected", status: 401 }), true, "Google session 401 is not mistaken for relay auth");
  assert.strictEqual(app.relay401IsAccount({ error: "reconnect", reconnect: true, status: 401 }), true, "Google reconnect 401 is preserved");
  assert.strictEqual(app.relay401IsAccount({ error: "unauthorized", status: 401 }), false, "real relay rejection still trips the auth guard");
  assert.match(
    app.emailConnectionError({ error: "not connected", status: 401 }),
    /disconnect this account, then connect Gmail again/,
    "stale Gmail sessions get an actionable reconnect message"
  );
  assert.match(
    app.emailConnectionError({ error: "unauthorized", status: 401 }),
    /re-enter the relay token/,
    "relay-token failures get the correct repair instruction"
  );

  // Convergence AI proposals: bounded roles, opt-in sensitive context,
  // provenance, deterministic application, and an exact undo receipt.
  assert.deepStrictEqual(Object.keys(app.AI_PROMPTS), ["Decide", "Plan", "Review", "Draft", "Challenge"]);
  assert.strictEqual(app.AI_PROMPTS.Draft.version, 2, "prompt versions are explicit");
  const aiState = app.getState();
  aiState.people = [{ id: "aiperson", name: "Avery", email: "secret@example.com", note: "private canonical note", lastContact: "2026-08-01" }];
  const safePerson = app.aiContext("person", "aiperson", {});
  assert.doesNotMatch(safePerson.text, /secret@example|private canonical note/, "person email and notes are not silently shared");
  const sharedPerson = app.aiContext("person", "aiperson", { personEmail: true, personNotes: true });
  assert.match(sharedPerson.text, /secret@example.com/);
  assert.match(sharedPerson.text, /private canonical note/, "canonical singular note is shared only after opt-in");
  assert.strictEqual(app.aiFingerprint("same"), app.aiFingerprint("same"), "context receipt is deterministic");
  assert.strictEqual(app.AI_RECEIPT_VERSION, 2, "AI receipt policy is explicitly versioned");
  assert.strictEqual(app.canonicalAiString({ b: 2, a: 1 }), app.canonicalAiString({ a: 1, b: 2 }), "canonical request serialization ignores property order");
  assert.strictEqual(app.utf8ByteCount("A😀"), 5, "context budget counts exact UTF-8 bytes");
  const planDef = app.AI_PROMPTS.Plan;
  const manifest = app.buildAiContextManifest(safePerson, { profile: true }, app.buildAiSharedContext(safePerson, { profile: true }));
  assert.ok(manifest.recordCount >= 1 && manifest.approximateBytes > 0, "context manifest records count and bytes");
  const reorderedManifest = Object.assign({}, manifest, { categories: manifest.categories.slice().reverse() });
  assert.strictEqual(app.aiRequestFingerprint("Plan", planDef, manifest), app.aiRequestFingerprint("Plan", planDef, reorderedManifest), "set-like context categories normalize before request hashing");
  assert.strictEqual(app.runAiValidators("Do next: run the focused gate", "Plan").status, "pass", "valid Plan text passes named local checks");
  assert.strictEqual(app.runAiValidators("", "Plan").status, "needs-review", "empty output remains reviewable but does not pass");
  assert.strictEqual(app.runAiValidators("x".repeat(app.AI_MODE_REGISTRY.Plan.maxOutputCharacters + 1), "Plan").status, "needs-review", "oversized output fails the bounded contract");
  aiState.pending.unshift({
    id: "aip1", kind: "ai", mode: "Plan", status: "review", title: '<img src=x onerror="bad">',
    body: '<script>alert("bad")</script> Run the gate', sourceKind: "task", sourceId: "none",
    provider: "test", model: "fixture", seat: "Planner", promptId: "plan", promptVersion: 1,
    contextCategories: ["source item"], createdAt: Date.now(),
  });
  aiState.pending.push({ id: "legacy-event-proposal", title: "Legacy extracted event", date: app.todayKey(), time: "15:00", area: "Inbox" });
  aiState.pending.push({ id: "typed-event-proposal", kind: "event", title: "Typed extracted event", date: app.todayKey(), time: null, area: "Inbox" });
  assert.deepStrictEqual(app.calendarPendings().map((p) => p.id), ["legacy-event-proposal", "typed-event-proposal"], "Calendar sees legacy and typed event proposals, never AI text proposals");
  app.dismissAllPending();
  assert.ok(aiState.pending.some((p) => p.id === "aip1"), "Calendar bulk dismiss preserves AI proposals");
  assert.ok(!aiState.pending.some((p) => p.id === "legacy-event-proposal" || p.id === "typed-event-proposal"), "Calendar bulk dismiss removes only event proposals");
  const proposalHTML = app.renderAiReviewHTML();
  assert.doesNotMatch(proposalHTML, /<script>|<img src=/, "proposal inbox escapes hostile provider output");
  assert.match(proposalHTML, /&lt;script&gt;/, "escaped output remains reviewable");
  assert.match(proposalHTML, /legacy \/ unrecorded/, "legacy proposals do not fabricate receipt facts");
  app.applyAIProposal("aip1", "note");
  const applied = aiState.pending.find((p) => p.id === "aip1");
  assert.strictEqual(applied.status, "applied");
  assert.ok(aiState.notes.some((n) => n.id === applied.undo.id), "approved proposal uses canonical note state");
  app.undoAIProposal("aip1");
  assert.strictEqual(applied.status, "undone");
  assert.strictEqual(applied.application.state, "undone", "Undo updates application state without rewriting response identity");
  assert.ok(!aiState.notes.some((n) => n.id === applied.undo?.id), "undo removes the created record");
  app.rejectAIProposal("aip1");
  assert.strictEqual(applied.feedback, "undone", "a terminal Undo cannot be rejected or reapplied without a new review transition");
  aiState.pending.unshift({
    id: "aip-event", kind: "ai", mode: "Plan", status: "review", title: "Protect the hard stop",
    body: "Call the dentist\nConfirm the new appointment", sourceKind: "event", sourceId: "ev-66",
    provider: "test", model: "fixture", seat: "Planner", promptId: "plan", promptVersion: 1,
    contextCategories: ["source item"], createdAt: Date.now(),
  });
  app.applyAIProposal("aip-event", "event");
  const eventProposal = aiState.pending.find((p) => p.id === "aip-event");
  assert.strictEqual(eventProposal.targetKind, "event");
  assert.ok(aiState.events.some((event) => event.id === eventProposal.targetId && event.source === "ai-approved"), "approved proposal creates a canonical event");
  app.undoAIProposal("aip-event");
  assert.ok(!aiState.events.some((event) => event.id === eventProposal.targetId), "event application has an exact undo receipt");
  const receiptFixture = {
    id: "receipt-v2", kind: "ai", mode: "Plan", status: "review", title: "Receipt", body: "Do next: verify",
    sourceKind: "task", sourceId: "f-a", provider: "test", model: "fixture", seat: "Planner", promptId: "plan", promptVersion: 1,
    contextCategories: manifest.categories, contextFingerprint: manifest.fingerprint, createdAt: 10,
    receipt: { version: 2, jobId: "receipt-v2", mode: "Plan", createdAt: 10, startedAt: 10, completedAt: 20, latencyMs: 10, prompt: { id: "plan", version: 1, fingerprint: "p" }, provider: { id: "test", model: "fixture", seat: "Planner" }, context: manifest, requestFingerprint: "req", responseFingerprint: "resp", output: { kind: "text", schemaVersion: 1, parseStatus: "text" }, validation: app.runAiValidators("Do next: verify", "Plan"), attempts: [{ id: "attempt-1", startedAt: 10, completedAt: 20, status: "complete", responseFingerprint: "resp" }] },
    review: { action: "pending" }, application: { state: "not-applied", undoAvailable: false },
  };
  aiState.pending.unshift(receiptFixture);
  const rv = app.aiReceiptView(receiptFixture);
  assert.deepStrictEqual({ version: rv.version, passed: rv.passed, total: rv.total, legacy: rv.legacy }, { version: 2, passed: 4, total: 4, legacy: false }, "receipt view summarizes only recorded facts");
  assert.strictEqual(app.aiReceiptView({ kind: "ai", receipt: { version: 99, attempts: "bad" } }).legacy, true, "malformed or future receipts fall back safely");
  const receiptBytes = JSON.stringify(receiptFixture.receipt);
  for (const forbidden of ["relayToken", "providerKey", "oauthToken", "hiddenReasoning", "secret@example.com", "private note"]) assert.ok(!receiptBytes.includes(forbidden), "receipt excludes private field/content: " + forbidden);
  app.rejectAIProposal("receipt-v2");
  assert.strictEqual(receiptFixture.review.action, "rejected", "review decision is recorded separately from provider output");
  assert.strictEqual(receiptFixture.application.state, "rejected", "rejection cannot create an application target");
  const invalidTarget = { id: "invalid-target", kind: "ai", mode: "Draft", status: "review", title: "Target", body: "Text", sourceKind: "task", sourceId: "f-a" };
  aiState.pending.unshift(invalidTarget);
  const itemCountBeforeInvalidTarget = aiState.items.length;
  assert.strictEqual(app.applyAIProposal("invalid-target", "unknown"), false, "unsupported AI application targets fail closed");
  assert.strictEqual(aiState.items.length, itemCountBeforeInvalidTarget, "invalid target creates no record");
  const feedback = app.aiFeedbackSummary([
    { feedback: "accepted", status: "applied", createdAt: 1000, resolvedAt: 61000 },
    { feedback: "edited-accepted", status: "applied", createdAt: 1000, resolvedAt: 121000 },
    { feedback: "rejected", status: "rejected", createdAt: 1000, resolvedAt: 181000 },
    { status: "error" },
  ]);
  assert.deepStrictEqual({ accepted: feedback.accepted, edited: feedback.edited, rejected: feedback.rejected, errors: feedback.errors, medianMinutes: feedback.medianMinutes }, { accepted: 2, edited: 1, rejected: 1, errors: 1, medianMinutes: 2 }, "local outcomes and median resolution time are deterministic");
  aiState.pending = aiState.pending.filter((p) => p.id !== "aip1");
  aiState.people = [];

  // v0.51 Focus Rail: explicit daily focus overlays legacy storage order.
  const focusDay = app.todayKey();
  aiState.items = [
    { id: "f-a", text: "Legacy first", today: true, done: false },
    { id: "f-b", text: "Due today", today: false, due: focusDay, done: false },
    { id: "f-c", text: "Overdue", today: true, due: app.addDaysKey(focusDay, -1), done: false },
    { id: "f-d", text: "Later fallback", today: true, done: false },
  ];
  const legacyOrder = aiState.items.map((t) => t.id);
  assert.deepStrictEqual(app.focusItems(focusDay).map((t) => t.id), legacyOrder, "legacy focus order is byte-for-byte compatible");
  assert.strictEqual(app.moveFocusTask("f-c", "up"), true, "explicit move succeeds");
  assert.deepStrictEqual(aiState.items.map((t) => t.id), legacyOrder, "focus move never reorders canonical task storage");
  assert.deepStrictEqual(app.focusItems(focusDay).slice(0, 3).map((t) => t.id), ["f-a", "f-c", "f-b"], "daily ranks drive the visible rail");
  assert.deepStrictEqual(app.attentionReasons(aiState.items[2], focusDay).slice(0, 2), ["manual-focus", "overdue"], "reason order is stable");
  aiState.items[3].focusDate = app.addDaysKey(focusDay, -1); aiState.items[3].focusRank = 1;
  assert.strictEqual(app.validFocusRank(aiState.items[3], focusDay), false, "stale daily focus is ignored");
  aiState.items[1].focusRank = 1; aiState.items[1].focusSetAt = 20;
  aiState.items[0].focusRank = 1; aiState.items[0].focusSetAt = 10;
  assert.deepStrictEqual(app.focusItems(focusDay).slice(0, 2).map((t) => t.id), ["f-a", "f-b"], "same-rank ties use timestamp then id");
  assert.deepStrictEqual(app.duplicateFocusRanks(focusDay), [1], "duplicate focus ranks are diagnostic, not a render-time mutation");
  assert.strictEqual(app.resetFocus(focusDay), true, "explicit focus can be cleared");
  assert.deepStrictEqual(app.focusItems(focusDay).map((t) => t.id), legacyOrder, "reset restores legacy fallback order");

  // Studio mission packets are complete enough to hand to another AI cold,
  // while the shipped state remains evidence-gated.
  const mission = {
    name: "Converge navigation", outcome: "One canonical room path", currentState: "Registry exists",
    next: "Run the route tests", assignedAI: "Codex", aiRole: "Verifier", repo: "/repo", branch: "mission/nav", worktree: "/repo-wt",
    allowedScope: "index.html and route tests", forbiddenFiles: ".env and unrelated rooms", acceptance: "Aliases resolve and navigation agrees",
    tests: "node test/app-logic.test.js", verificationStatus: "machine", evidence: "All route assertions passed",
    commitRef: "checkpoint-42", blockers: "", lastHandoff: "Registry and renderers now share one source",
  };
  assert.strictEqual(app.missionVerified(mission), false, "legacy evidence is never silently treated as structured proof");
  assert.match(app.missionProofStatus(mission).label, /Legacy evidence/);
  assert.strictEqual(app.convertMissionProof(mission), true, "reviewed acceptance lines convert to stable checklist items");
  assert.strictEqual(mission.proofBundle.version, 1);
  assert.match(mission.proofBundle.acceptanceItems[0].id, /^ac-[a-f0-9]+$/);
  const firstFingerprint = app.missionPacketFingerprint(mission);
  assert.strictEqual(firstFingerprint, app.missionPacketFingerprint(Object.assign({}, mission, { notes: "irrelevant UI note" })), "irrelevant mission notes do not change packet identity");
  const reorderedSets = Object.assign({}, mission, { allowedScope: "route tests\nindex.html", forbiddenFiles: "unrelated rooms\n.env" });
  mission.allowedScope = "index.html\nroute tests"; mission.forbiddenFiles = ".env\nunrelated rooms"; app.refreshProofFingerprint(mission);
  assert.strictEqual(app.missionPacketFingerprint(mission), app.missionPacketFingerprint(reorderedSets), "set-like scope lists normalize before hashing");
  assert.strictEqual(app.missionVerified(mission), false, "pending acceptance blocks shipping");
  mission.proofBundle.acceptanceItems[0].status = "pass";
  mission.verificationStatus = "machine";
  app.refreshProofFingerprint(mission);
  assert.strictEqual(app.recordMissionAttempt(mission), true);
  assert.strictEqual(app.missionVerified(mission), true, "all acceptance pass plus current local proof verifies");
  const workPacket = app.missionPacket(mission, "work");
  for (const requiredText of ["One canonical room path", "Verifier", "/repo", "mission/nav", "/repo-wt", "Allowed scope", "Forbidden files", "Canonical constraints", "Acceptance criteria", "Verification commands", "Packet fingerprint", "checkpoint-42", mission.proofBundle.acceptanceItems[0].id]) {
    assert.match(workPacket, new RegExp(requiredText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "packet includes " + requiredText);
  }
  assert.match(app.missionPacket(mission, "handoff"), /Last handoff/);
  assert.strictEqual(app.missionVerified({ verificationStatus: "machine", evidence: "" }), false, "status without receipt is not proof");
  mission.allowedScope += "\nnew-file.js";
  assert.strictEqual(app.missionVerified(mission), false, "scope changes make the latest attempt stale");
  app.refreshProofFingerprint(mission); app.recordMissionAttempt(mission);
  assert.strictEqual(app.missionVerified(mission), true, "a current-packet attempt restores verification");
  mission.proofBundle.acceptanceItems[0].status = "waived"; mission.proofBundle.acceptanceItems[0].waiverReason = "";
  assert.strictEqual(app.missionVerified(mission), false, "waiver without reason blocks proof");
  mission.proofBundle.acceptanceItems[0].waiverReason = "Not applicable on this archive"; app.refreshProofFingerprint(mission); app.recordMissionAttempt(mission);
  assert.strictEqual(app.missionVerified(mission), true, "reasoned waiver plus local proof is shippable");
  mission.proofBundle.attempts[mission.proofBundle.attempts.length - 1].verificationReceipts[0].localStatus = "fail";
  assert.strictEqual(app.missionVerified(mission), false, "any current local failure blocks proof");
  mission.proofBundle.override = { reason: "Explicitly accepted known limitation", at: Date.now() };
  assert.strictEqual(app.missionVerified(mission), false, "override never masquerades as verification");
  assert.strictEqual(app.missionCanShip(mission), true, "visible reasoned override can authorize Shipped");
  const malformedProof = app.normalizeProofBundle({ proofBundle: { acceptanceItems: [{ id: "dup", text: "A" }, { id: "dup", text: "B", status: "bogus" }], attempts: "bad" } });
  assert.strictEqual(new Set(malformedProof.acceptanceItems.map((x) => x.id)).size, 2, "duplicate proof IDs normalize safely");
  assert.strictEqual(malformedProof.acceptanceItems[1].status, "pending", "malformed statuses fail closed");

  const checkpoint = app.getState();
  checkpoint.pending = [{ id: "checkpoint-ai", kind: "ai", mode: "Review", status: "review", provider: "relay", model: "model", seat: "Reviewer", promptId: "review", promptVersion: 1, contextCategories: ["source item"], contextFingerprint: "abc", applicationState: "not-applied", title: "Check", body: "Evidence", receipt: receiptFixture.receipt, review: { action: "pending" }, application: { state: "not-applied", undoAvailable: false } }];
  checkpoint.builds = [Object.assign({ id: "checkpoint-mission", stage: "Testing" }, mission)];
  const checkpointDoc = app.portableDoc(checkpoint);
  const checkpointLoad = await loadApp({ storedState: checkpointDoc });
  assert.strictEqual(checkpointLoad.app.getState().pending[0].contextFingerprint, "abc", "AI provenance survives backup/boot round trip");
  assert.strictEqual(checkpointLoad.app.getState().pending[0].receipt.version, 2, "AI receipt v2 survives backup/boot round trip");
  assert.strictEqual(checkpointLoad.app.getState().builds[0].acceptance, mission.acceptance, "mission contract survives backup/boot round trip");
  assert.strictEqual(checkpointLoad.app.getState().builds[0].proofBundle.version, 1, "proof bundle identity survives backup/boot round trip");
  assert.strictEqual(checkpointLoad.app.getState().v, app.SCHEMA_VERSION, "compatible nested extensions do not churn the schema");

  console.log("app-logic harness ok");
})().catch((err) => { console.error(err); process.exit(1); });
