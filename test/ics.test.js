// W1 item 25 — parseICS characterization: RRULE, EXDATE, DTEND, UTC,
// line folding, escaping, all-day handling. The v0.17 bug class must
// never return.

"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

function ics(lines) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0"].concat(lines, ["END:VCALENDAR"]).join("\r\n");
}

(async function main() {
  const { app } = await loadApp();

  // ── basics: date-only = all day; floating local time kept literal ──────
  let r = app.parseICS(ics([
    "X-WR-CALNAME:Team\\, Swim",
    "BEGIN:VEVENT", "UID:e1", "SUMMARY:All day thing", "DTSTART;VALUE=DATE:20260715", "DTEND;VALUE=DATE:20260716", "END:VEVENT",
    "BEGIN:VEVENT", "UID:e2", "SUMMARY:Practice", "DTSTART;TZID=America/New_York:20260715T160000", "DTEND;TZID=America/New_York:20260715T173000", "LOCATION:BSPC pool", "DESCRIPTION:Bring fins\\nand snorkel", "END:VEVENT",
  ]));
  assert.strictEqual(r.calName, "Team, Swim", "CALNAME unescaped");
  assert.strictEqual(r.events.length, 2);
  const [allday, timed] = r.events;
  assert.deepStrictEqual([allday.date, allday.time, allday.allDay], ["2026-07-15", null, true]);
  assert.strictEqual(allday.end, null, "single-day all-day: exclusive DTEND is start+1, no distinct end");
  assert.deepStrictEqual([timed.date, timed.time, timed.allDay], ["2026-07-15", "16:00", false]);
  assert.strictEqual(timed.end, "2026-07-15 17:30");
  assert.strictEqual(timed.location, "BSPC pool");
  assert.strictEqual(timed.notes, "Bring fins\nand snorkel", "DESCRIPTION \\n unescaped");

  // ── W6.0d contract change: multi-day date-only DTEND is preserved as the
  //    INCLUSIVE last day (old pin: end was dropped to null). DTEND-before-
  //    DTSTART ordering also resolves correctly. ─────────────────────────
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "UID:trip", "SUMMARY:Swim trip", "DTSTART;VALUE=DATE:20260715", "DTEND;VALUE=DATE:20260718", "END:VEVENT",
    "BEGIN:VEVENT", "UID:conf", "SUMMARY:Conference", "DTEND;VALUE=DATE:20260803", "DTSTART;VALUE=DATE:20260801", "END:VEVENT",
  ]));
  assert.strictEqual(r.events[0].end, "2026-07-17", "exclusive DTEND 07-18 becomes inclusive end 07-17");
  assert.strictEqual(r.events[1].end, "2026-08-02", "DTEND line before DTSTART still resolves");

  // W6.0d: recurring occurrences shift their end with each date instead of
  // copying the base end verbatim (timed and multi-day all-day).
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:Timed pair", "DTSTART;TZID=America/New_York:20260706T070000", "DTEND;TZID=America/New_York:20260706T083000", "RRULE:FREQ=DAILY;COUNT=2", "END:VEVENT",
  ]));
  assert.deepStrictEqual(r.events.map((e) => e.end), ["2026-07-06 08:30", "2026-07-07 08:30"], "timed end follows each occurrence");
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:Two-day camp", "DTSTART;VALUE=DATE:20260706", "DTEND;VALUE=DATE:20260708", "RRULE:FREQ=WEEKLY;COUNT=2", "END:VEVENT",
  ]));
  assert.deepStrictEqual(r.events.map((e) => [e.date, e.end]), [["2026-07-06", "2026-07-07"], ["2026-07-13", "2026-07-14"]], "multi-day span follows each occurrence");

  // ── UTC (Z) times convert to device-local ──────────────────────────────
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:Zulu", "DTSTART:20260715T140000Z", "END:VEVENT",
  ]));
  const d = new Date(Date.UTC(2026, 6, 15, 14, 0, 0));
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  const expDate = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const expTime = pad(d.getHours()) + ":" + pad(d.getMinutes());
  assert.deepStrictEqual([r.events[0].date, r.events[0].time, r.events[0].allDay], [expDate, expTime, false], "Z time localized");

  // ── line folding (RFC 5545 §3.1): continuation lines unfold ────────────
  r = app.parseICS(["BEGIN:VCALENDAR", "BEGIN:VEVENT", "SUMMARY:A very long su", " mmary folded across lines", "DTSTART;VALUE=DATE:20260701", "END:VEVENT", "END:VCALENDAR"].join("\r\n"));
  assert.strictEqual(r.events[0].title, "A very long summary folded across lines");

  // ── weekly RRULE with BYDAY + COUNT + EXDATE ──────────────────────────
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "UID:wk", "SUMMARY:MWF practice",
    "DTSTART;TZID=America/New_York:20260706T070000", // Monday 2026-07-06
    "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=6",
    "EXDATE;TZID=America/New_York:20260708T070000",  // skip Wednesday
    "END:VEVENT",
  ]));
  // W6.0c contract change: EXDATE no longer consumes COUNT — the rule keeps
  // generating until 6 occurrences are DELIVERED (old pin: the excluded
  // Wednesday counted against COUNT, yielding 5; RFC-strict reading).
  assert.deepStrictEqual(
    r.events.map((e) => e.date),
    ["2026-07-06", "2026-07-10", "2026-07-13", "2026-07-15", "2026-07-17", "2026-07-20"],
    "COUNT=6 delivers 6 occurrences; EXDATE removes the 07-08 Wednesday without consuming the count"
  );
  assert.ok(r.events.every((e) => e.time === "07:00"), "occurrences keep the start time");
  assert.strictEqual(r.events[0].uid, "wk-2026-07-06", "per-occurrence uid gets the date suffix");

  // ── daily RRULE with UNTIL ─────────────────────────────────────────────
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:Daily", "DTSTART;VALUE=DATE:20260701", "RRULE:FREQ=DAILY;UNTIL=20260704", "END:VEVENT",
  ]));
  assert.deepStrictEqual(r.events.map((e) => e.date), ["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04"], "UNTIL inclusive");

  // ── monthly + interval ─────────────────────────────────────────────────
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:Bimonthly", "DTSTART;VALUE=DATE:20260115", "RRULE:FREQ=MONTHLY;INTERVAL=2;COUNT=3", "END:VEVENT",
  ]));
  assert.deepStrictEqual(r.events.map((e) => e.date), ["2026-01-15", "2026-03-15", "2026-05-15"]);

  // ── W6.0b: monthly on the 31st clamps to short months but keeps its
  //    anchor day, so longer months recover the 31st (no drift) ───────────
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:Rent due", "DTSTART;VALUE=DATE:20260131", "RRULE:FREQ=MONTHLY;COUNT=4", "END:VEVENT",
  ]));
  assert.deepStrictEqual(r.events.map((e) => e.date), ["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"], "monthly clamp keeps the 31st anchor");

  // ── W6.0b: yearly Feb 29 clamps to Feb 28 off-leap, recovers on leap ───
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:Leap day", "DTSTART;VALUE=DATE:20240229", "RRULE:FREQ=YEARLY;COUNT=5", "END:VEVENT",
  ]));
  assert.deepStrictEqual(r.events.map((e) => e.date), ["2024-02-29", "2025-02-28", "2026-02-28", "2027-02-28", "2028-02-29"], "yearly leap-day clamp with anchor recovery");

  // ── yearly ─────────────────────────────────────────────────────────────
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:Anniversary", "DTSTART;VALUE=DATE:20260220", "RRULE:FREQ=YEARLY;COUNT=3", "END:VEVENT",
  ]));
  assert.deepStrictEqual(r.events.map((e) => e.date), ["2026-02-20", "2027-02-20", "2028-02-20"]);

  // ── unbounded recurrence is capped, not infinite ───────────────────────
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:Forever", "DTSTART;VALUE=DATE:20260101", "RRULE:FREQ=DAILY", "END:VEVENT",
  ]));
  assert.ok(r.events.length > 300 && r.events.length <= 366, "unbounded daily capped near a year, got " + r.events.length);

  // ── DST week: local floating times don't shift across the change ──────
  // US DST ends 2026-11-01; a daily 09:00 event stays 09:00 across it.
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:DST", "DTSTART;TZID=America/New_York:20261030T090000", "RRULE:FREQ=DAILY;COUNT=4", "END:VEVENT",
  ]));
  assert.deepStrictEqual(r.events.map((e) => e.date), ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  assert.ok(r.events.every((e) => e.time === "09:00"), "floating local time survives the DST boundary");

  // ── events without DTSTART are dropped; escaping round-trip ────────────
  r = app.parseICS(ics([
    "BEGIN:VEVENT", "SUMMARY:No date", "END:VEVENT",
    "BEGIN:VEVENT", "SUMMARY:Semi\\; colon\\, comma\\\\ backslash", "DTSTART;VALUE=DATE:20260801", "END:VEVENT",
  ]));
  assert.strictEqual(r.events.length, 1, "dateless VEVENT filtered");
  assert.strictEqual(r.events[0].title, "Semi; colon, comma\\ backslash");

  // icsEscape is the inverse.
  assert.strictEqual(app.icsEscape("a;b,c\\d\ne"), "a\\;b\\,c\\\\d\\ne");

  // ── buildICS: timed events export as UTC Z stamps ──────────────────────
  const built = app.buildICS([{ id: "x1", title: "Meet", date: "2026-07-20", time: "09:30", allDay: false }]);
  assert.ok(/^DTSTART:\d{8}T\d{6}Z$/m.test(built), "timed export uses UTC Z form");
  assert.ok(built.indexOf("SUMMARY:Meet") >= 0);
  const builtAllDay = app.buildICS([{ id: "x2", title: "Trip", date: "2026-07-20", allDay: true }]);
  assert.ok(builtAllDay.indexOf("DTSTART;VALUE=DATE:20260720") >= 0, "all-day export uses VALUE=DATE");
  assert.ok(builtAllDay.indexOf("DTEND;VALUE=DATE:20260721") >= 0, "all-day DTEND is exclusive next day");

  console.log("parseICS fixtures ok");
})().catch((err) => { console.error(err); process.exit(1); });
