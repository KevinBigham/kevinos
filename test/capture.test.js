// W1 item 22 — parseCaptureText characterization table (25+ cases).
// Pins the deterministic capture grammar: #Area, @date tokens, ! pin,
// note:/event: prefixes, unknown-tag stripping, fallbacks.

"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const { app } = await loadApp();
  const tk = app.todayKey();
  const tomorrow = app.addDaysKey(tk, 1);

  // next occurrence of a weekday (strictly future — matches nextWeekdayKey).
  function nextWD(wd) {
    let k = app.addDaysKey(tk, 1);
    while (true) {
      const p = k.split("-").map(Number);
      if (new Date(p[0], p[1] - 1, p[2]).getDay() === wd) return k;
      k = app.addDaysKey(k, 1);
    }
  }

  // 12/25-style: this year if not past, else next year.
  function mdKey(m, d) {
    const now = new Date();
    let dt = new Date(now.getFullYear(), m - 1, d);
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dt.getTime() < today0.getTime()) dt = new Date(now.getFullYear() + 1, m - 1, d);
    return app.dateKey(dt);
  }

  const cases = [
    // [input, expected]
    ["buy milk", { type: "task", text: "buy milk", area: "Inbox", due: null, today: false }],
    ["email parent #Teaching @tomorrow !", { type: "task", text: "email parent", area: "Teaching", due: tomorrow, today: true }],
    ["plan sprint #Work", { type: "task", text: "plan sprint", area: "Work", due: null, today: false }],
    ["plan sprint #work", { type: "task", text: "plan sprint", area: "Work", due: null, today: false }], // area tag is case-insensitive
    ["call Ana #Ana @today", { type: "task", text: "call Ana", area: "Ana", due: tk, today: false }],
    ["swim entries #Coaching @fri", { type: "task", text: "swim entries", area: "Coaching", due: nextWD(5), today: false }],
    ["dentist @tue", { type: "task", text: "dentist", area: "Inbox", due: nextWD(2), today: false }],
    ["taxes @12/25", { type: "task", text: "taxes", area: "Inbox", due: mdKey(12, 25), today: false }],
    ["gift @1/2", { type: "task", text: "gift", area: "Inbox", due: mdKey(1, 2), today: false }],
    ["thing @notaday", { type: "task", text: "thing", area: "Inbox", due: null, today: false }], // unknown @token stripped, no date
    ["thing #NotAnArea", { type: "task", text: "thing", area: "Inbox", due: null, today: false }], // unknown #tag stripped
    ["ship it !", { type: "task", text: "ship it", area: "Inbox", due: null, today: true }],
    ["! lead pin", { type: "task", text: "lead pin", area: "Inbox", due: null, today: true }],
    ["not!pinned", { type: "task", text: "not!pinned", area: "Inbox", due: null, today: false }], // bang only as own token
    ["note: swim lineup ideas", { type: "note", text: "swim lineup ideas", area: "Inbox" }],
    ["NOTE: shouty note", { type: "note", text: "shouty note", area: "Inbox" }],
    ["note: tagged #Work", { type: "note", text: "tagged", area: "Work" }],
    ["event: team dinner @fri", { type: "event", title: "team dinner", date: nextWD(5) }],
    ["event: standup", { type: "event", title: "standup", date: tk }], // dateless event -> today
    ["event: review #Work @tomorrow", { type: "event", title: "review", date: tomorrow }],
    ["  padded   spaces  ", { type: "task", text: "padded spaces", area: "Inbox", due: null, today: false }],
    ["#Work", { type: "task", text: "#Work", area: "Work", due: null, today: false }], // tag-only: area set, raw kept as text fallback
    ["émoji task 🏊 #Personal", { type: "task", text: "émoji task 🏊", area: "Personal", due: null, today: false }],
    ["multi @tue @fri", { type: "task", text: "multi", area: "Inbox", due: nextWD(5), today: false }], // last date token wins
    ["two tags #Work #Teaching", { type: "task", text: "two tags", area: "Work", due: null, today: false }], // first known area wins, rest stripped
    ["@tomorrow only", { type: "task", text: "@tomorrow only", area: "Inbox", due: null, today: false }], // leading @token needs a preceding space per regex — neither parsed nor stripped (pre-existing quirk, logged in Wave Log)
  ];

  let n = 0;
  for (const [input, exp] of cases) {
    const r = app.parseCaptureText(input);
    assert.ok(r && r.ok, "ok for: " + input);
    assert.strictEqual(r.type, exp.type, "type for: " + input);
    if (exp.type === "task") {
      assert.strictEqual(r.task.text, exp.text, "text for: " + input);
      assert.strictEqual(r.task.area, exp.area, "area for: " + input);
      assert.strictEqual(r.task.due, exp.due, "due for: " + input);
      assert.strictEqual(r.task.today, exp.today, "pin for: " + input);
    } else if (exp.type === "note") {
      assert.strictEqual(r.note.text, exp.text, "note text for: " + input);
      assert.strictEqual(r.note.area, exp.area, "note area for: " + input);
    } else {
      assert.strictEqual(r.event.title, exp.title, "event title for: " + input);
      assert.strictEqual(r.event.date, exp.date, "event date for: " + input);
    }
    n++;
  }

  // Empty input: current behavior returns a task whose text falls back to raw ("").
  const empty = app.parseCaptureText("");
  assert.strictEqual(empty.type, "task");
  assert.strictEqual(empty.task.text, "");

  // parseCaptureDate direct pins.
  assert.strictEqual(app.parseCaptureDate("today"), tk);
  assert.strictEqual(app.parseCaptureDate("TOMORROW".toLowerCase()), tomorrow);
  assert.strictEqual(app.parseCaptureDate("thurs"), nextWD(4));
  assert.strictEqual(app.parseCaptureDate("nonsense"), null);

  console.log("capture table ok (" + n + " cases)");
})().catch((err) => { console.error(err); process.exit(1); });
