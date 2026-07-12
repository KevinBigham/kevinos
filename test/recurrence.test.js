// W1 item 26 — rollRecurring characterization: month boundaries, weekday
// rules, DST weeks, field propagation.

"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const { app } = await loadApp();
  const st = app.getState();

  function roll(it) {
    st.items = [];
    app.rollRecurring(it);
    return st.items[0] || null;
  }

  // Daily across a month boundary.
  let n = roll({ text: "daily", area: "Work", due: "2026-07-31", repeat: "daily" });
  assert.strictEqual(n.due, "2026-08-01");

  // Weekly across the US spring-forward DST week (2026-03-08) — key math is
  // calendar-pure, no hour drift.
  n = roll({ text: "weekly", area: "Work", due: "2026-03-06", repeat: "weekly" });
  assert.strictEqual(n.due, "2026-03-13");

  // Weekly across the fall-back week (2026-11-01).
  n = roll({ text: "weekly", area: "Work", due: "2026-10-30", repeat: "weekly" });
  assert.strictEqual(n.due, "2026-11-06");

  // Monthly across a year boundary.
  n = roll({ text: "monthly", area: "Work", due: "2026-12-15", repeat: "monthly" });
  assert.strictEqual(n.due, "2027-01-15");

  // W6.0b contract change: monthly overflow clamps to the target month's
  // last day (old pin: Jan 31 + 1 month = Mar 3 via Date rollover).
  n = roll({ text: "monthly", area: "Work", due: "2026-01-31", repeat: "monthly" });
  assert.strictEqual(n.due, "2026-02-28");
  // Leap year: Jan 31 2028 clamps to Feb 29.
  n = roll({ text: "monthly", area: "Work", due: "2028-01-31", repeat: "monthly" });
  assert.strictEqual(n.due, "2028-02-29");
  // 31st into a 30-day month.
  n = roll({ text: "monthly", area: "Work", due: "2026-03-31", repeat: "monthly" });
  assert.strictEqual(n.due, "2026-04-30");
  // Known drift (pinned deliberately): task repeats re-anchor from the rolled
  // task's own due, so a clamped Feb 28 rolls to Mar 28, not back to the 31st.
  // Recovering the original day would need an anchor field on the item
  // (schema change) — deferred. The ICS expander DOES keep its anchor.
  n = roll({ text: "monthly", area: "Work", due: "2026-02-28", repeat: "monthly" });
  assert.strictEqual(n.due, "2026-03-28");

  // Weekdays: Fri -> Mon, Sat -> Mon, Sun -> Mon, Mon -> Tue.
  assert.strictEqual(roll({ text: "wd", due: "2026-07-10", repeat: "weekdays" }).due, "2026-07-13"); // Fri
  assert.strictEqual(roll({ text: "wd", due: "2026-07-11", repeat: "weekdays" }).due, "2026-07-13"); // Sat
  assert.strictEqual(roll({ text: "wd", due: "2026-07-12", repeat: "weekdays" }).due, "2026-07-13"); // Sun
  assert.strictEqual(roll({ text: "wd", due: "2026-07-13", repeat: "weekdays" }).due, "2026-07-14"); // Mon

  // No repeat -> nothing rolls.
  assert.strictEqual(roll({ text: "one-off", due: "2026-07-10", repeat: "" }), null);
  assert.strictEqual(roll(null), null);

  // Dueless recurring item rolls from today.
  const tk = app.todayKey();
  n = roll({ text: "dueless daily", repeat: "daily" });
  assert.strictEqual(n.due, app.addDaysKey(tk, 1));

  // Field propagation: text/area/dueTime/projectId/repeat copied; fresh id;
  // not done, not pinned.
  n = roll({ id: "orig", text: "swim practice", area: "Coaching", due: "2026-07-10", dueTime: "16:30", projectId: "p1", repeat: "weekly", done: true, today: true });
  assert.strictEqual(n.text, "swim practice");
  assert.strictEqual(n.area, "Coaching");
  assert.strictEqual(n.dueTime, "16:30");
  assert.strictEqual(n.projectId, "p1");
  assert.strictEqual(n.repeat, "weekly");
  assert.strictEqual(n.done, false);
  assert.strictEqual(n.today, false);
  assert.notStrictEqual(n.id, "orig", "rolled task gets a fresh id");

  console.log("recurrence roll-forward ok");
})().catch((err) => { console.error(err); process.exit(1); });
