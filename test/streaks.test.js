// W1 item 27 — habit streak math with crafted done maps.

"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const { app } = await loadApp();
  const tk = app.todayKey();
  const D = (n) => app.addDaysKey(tk, n); // D(-1) = yesterday

  function habit(days) {
    const done = {};
    for (const d of days) done[d] = 1;
    return { id: "h", name: "test", done };
  }

  // Empty and null-safe.
  assert.strictEqual(app.habitCurrentStreak(null), 0);
  assert.strictEqual(app.habitCurrentStreak({}), 0);
  assert.strictEqual(app.habitLongestStreak(habit([])), 0);

  // Today checked: streak counts back from today.
  assert.strictEqual(app.habitCurrentStreak(habit([tk])), 1);
  assert.strictEqual(app.habitCurrentStreak(habit([D(-2), D(-1), tk])), 3);

  // THE law: current streak survives an unchecked *today* (counts from yesterday).
  assert.strictEqual(app.habitCurrentStreak(habit([D(-3), D(-2), D(-1)])), 3, "unchecked today does not break the streak");

  // But a gap at yesterday (and today unchecked) means 0.
  assert.strictEqual(app.habitCurrentStreak(habit([D(-3), D(-2)])), 0, "missed yesterday + today = broken");

  // Gap in the middle: only the tail counts.
  assert.strictEqual(app.habitCurrentStreak(habit([D(-5), D(-4), D(-2), D(-1), tk])), 3);

  // Longest scan finds the historical best, independent of today.
  const h = habit([D(-10), D(-9), D(-8), D(-7), /* gap */ D(-2), D(-1)]);
  assert.strictEqual(app.habitLongestStreak(h), 4);
  assert.strictEqual(app.habitCurrentStreak(h), 2);

  // Longest across a month boundary.
  const feb = habit(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
  assert.strictEqual(app.habitLongestStreak(feb), 4, "streak spans month boundary");

  // Falsy values in the done map don't count.
  const withFalsy = { id: "h", done: {} };
  withFalsy.done[D(-1)] = 0;
  withFalsy.done[tk] = 1;
  assert.strictEqual(app.habitCurrentStreak(withFalsy), 1, "0-valued day breaks the chain");
  assert.strictEqual(app.habitLongestStreak(withFalsy), 1);

  // habitDoneToday + toggle round-trip.
  const t = habit([]);
  assert.strictEqual(app.habitDoneToday(t), false);
  app.toggleHabitToday(t);
  assert.strictEqual(app.habitDoneToday(t), true);
  app.toggleHabitToday(t);
  assert.strictEqual(app.habitDoneToday(t), false);
  assert.ok(!(tk in t.done), "untoggle deletes the key rather than storing false");

  // habitGrid7: 7 cells ending today, oldest first.
  const g = app.habitGrid7(habit([D(-6), tk]));
  assert.strictEqual(g.length, 7);
  assert.deepStrictEqual([g[0].key, g[6].key], [D(-6), tk]);
  assert.deepStrictEqual(g.map((c) => c.done), [true, false, false, false, false, false, true]);

  console.log("habit streaks ok");
})().catch((err) => { console.error(err); process.exit(1); });
