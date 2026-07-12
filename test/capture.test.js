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

  // W6 item 44 fixtures: +person / //project resolve by prefix match.
  const st = app.getState();
  st.people.push({ id: "p-ana", name: "Ana Bigham", email: "", cadence: "30", lastContact: "", birthday: "", note: "", createdAt: 1 });
  st.projects.push({ id: "pr-mfd", title: "Mr Football", area: "Work", status: "Active", outcome: "", nextAction: "", notes: "", createdAt: 1 });

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
    // W6.0a contract change: @tokens now match at start-of-string, same as
    // mid-string (old pin: "@tomorrow only" was neither parsed nor stripped).
    ["@tomorrow only", { type: "task", text: "only", area: "Inbox", due: tomorrow, today: false }],
    ["@tomorrow", { type: "task", text: "@tomorrow", area: "Inbox", due: tomorrow, today: false }], // token-only: date parsed, raw kept as text fallback (mirrors "#Work")
    ["@notaday thing", { type: "task", text: "thing", area: "Inbox", due: null, today: false }], // leading unknown @token stripped like mid-string ones
    ["#groceries milk", { type: "task", text: "#groceries milk", area: "Inbox", due: null, today: false }], // unknown leading #tag stays (44 kept @/+/// deterministic; # grammar unchanged)
    // ── W6 item 44: @time / +person / //project tokens ──────────────────
    ["call mom @3pm", { type: "task", text: "call mom", area: "Inbox", due: tk, dueTime: "15:00", today: false }], // time with no date means today
    ["standup @9:30am @tomorrow", { type: "task", text: "standup", area: "Inbox", due: tomorrow, dueTime: "09:30", today: false }],
    ["deploy @15:45 @fri", { type: "task", text: "deploy", area: "Inbox", due: nextWD(5), dueTime: "15:45", today: false }],
    ["gift wrap @12/25 @5pm", { type: "task", text: "gift wrap", area: "Inbox", due: mdKey(12, 25), dueTime: "17:00", today: false }], // date + time coexist
    ["bare @3 stays", { type: "task", text: "bare @3 stays", area: "Inbox", due: null, dueTime: null, today: false }], // bare @N is ambiguous — untouched
    ["call +ana about swim", { type: "task", text: "call about swim", area: "Inbox", due: null, personId: "p-ana", today: false }],
    ["+ANA leading", { type: "task", text: "leading", area: "Inbox", due: null, personId: "p-ana", today: false }], // case-insensitive, start-of-string
    ["ping +zzz nobody", { type: "task", text: "ping +zzz nobody", area: "Inbox", due: null, personId: null, today: false }], // unmatched +token stays in text
    ["ship v2 //mrfootball", { type: "task", text: "ship v2", area: "Inbox", due: null, projectId: "pr-mfd", today: false }],
    ["ship //mrf !", { type: "task", text: "ship", area: "Inbox", due: null, projectId: "pr-mfd", today: true }], // prefix match + pin still works
    ["fix //nomatch thing", { type: "task", text: "fix //nomatch thing", area: "Inbox", due: null, projectId: null, today: false }],
    ["event: team dinner @fri @7pm", { type: "event", title: "team dinner", date: nextWD(5), time: "19:00" }], // events get the time token
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
      if ("dueTime" in exp) assert.strictEqual(r.task.dueTime, exp.dueTime, "dueTime for: " + input);
      if ("personId" in exp) assert.strictEqual(r.task.personId, exp.personId, "personId for: " + input);
      if ("projectId" in exp) assert.strictEqual(r.task.projectId, exp.projectId, "projectId for: " + input);
    } else if (exp.type === "note") {
      assert.strictEqual(r.note.text, exp.text, "note text for: " + input);
      assert.strictEqual(r.note.area, exp.area, "note area for: " + input);
    } else {
      assert.strictEqual(r.event.title, exp.title, "event title for: " + input);
      assert.strictEqual(r.event.date, exp.date, "event date for: " + input);
      if ("time" in exp) assert.strictEqual(r.event.time, exp.time, "event time for: " + input);
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

  // W6 item 44 — parseCaptureTime direct pins.
  assert.strictEqual(app.parseCaptureTime("3pm"), "15:00");
  assert.strictEqual(app.parseCaptureTime("12am"), "00:00");
  assert.strictEqual(app.parseCaptureTime("12pm"), "12:00");
  assert.strictEqual(app.parseCaptureTime("9:05am"), "09:05");
  assert.strictEqual(app.parseCaptureTime("15:45"), "15:45");
  assert.strictEqual(app.parseCaptureTime("3:30"), "03:30"); // colon without meridiem reads as 24h
  assert.strictEqual(app.parseCaptureTime("3"), null, "bare hour is ambiguous");
  assert.strictEqual(app.parseCaptureTime("13pm"), null);
  assert.strictEqual(app.parseCaptureTime("24:00"), null);
  assert.strictEqual(app.parseCaptureTime("9:60"), null);

  // tokenEntityId prefix semantics (spaces collapse: "+anabigham" also hits).
  assert.strictEqual(app.tokenEntityId("anabigham", st.people, "name"), "p-ana");
  assert.strictEqual(app.tokenEntityId("mrfoot", st.projects, "title"), "pr-mfd");
  assert.strictEqual(app.tokenEntityId("xyz", st.people, "name"), null);

  console.log("capture table ok (" + n + " cases)");
})().catch((err) => { console.error(err); process.exit(1); });
