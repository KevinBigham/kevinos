"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const { app, localStorage } = await loadApp();

  assert.strictEqual(new Set(app.DAY_MODE_REGISTRY.map((x) => x.id)).size, app.DAY_MODE_REGISTRY.length, "day-mode IDs are unique");
  ["school-day", "bshs-practice", "bshs-meet-day", "bspc-practice", "bspc-meet-week", "bspc-meet-day", "studio-deep-work", "bswildcats-publish", "personal-family", "recovery-reset", "travel"].forEach((id) => {
    const mode = app.registryRecord(app.DAY_MODE_REGISTRY, id);
    assert.ok(mode && mode.label && mode.transitionCue, id + " has a visible label and transition cue");
    assert.ok(Number.isInteger(mode.transitionMinutes) && mode.transitionMinutes >= 0, id + " has explicit transition minutes");
  });
  assert.deepStrictEqual(app.CAPACITY_REGISTRY.map((x) => x.id), ["full", "normal", "low"]);
  assert.strictEqual(app.capacityCommitmentLimit("full", 3), 3);
  assert.strictEqual(app.capacityCommitmentLimit("normal", 3), 3);
  assert.strictEqual(app.capacityCommitmentLimit("low", 3), 1);
  assert.strictEqual(app.capacityCommitmentLimit("full", 2), 2, "configured limit is authoritative below the ceiling");
  assert.strictEqual(app.capacityCommitmentLimit("full", 99), 3, "Today never exceeds three commitments");

  assert.strictEqual(app.activeDayModeId(), "");
  assert.strictEqual(app.setActiveDayModeId("studio-deep-work"), "studio-deep-work");
  assert.strictEqual(app.activeDayModeId(), "studio-deep-work");
  assert.strictEqual(localStorage._dump()["kevinos:active-day-mode"], "studio-deep-work", "active mode is device-local");
  assert.ok(!JSON.stringify(app.portableDoc(app.getState())).includes("studio-deep-work"), "device-local active mode does not enter portable state");
  assert.strictEqual(app.setActiveDayModeId("not-a-mode"), "");
  assert.strictEqual(app.activeDayModeId(), "");

  const suggestionEvents = [
    { id: "cal-1", title: "Morning work", date: "2026-08-13", roleId: "role-teaching" },
    { id: "cal-2", title: "BSPC championship meet", date: "2026-08-14" },
  ];
  assert.deepStrictEqual(app.dayModeSuggestion(suggestionEvents, "2026-08-13"), { modeId: "school-day", reason: "Teaching calendar item", eventId: "cal-1" });
  assert.deepStrictEqual(app.dayModeSuggestion(suggestionEvents, "2026-08-14"), { modeId: "bspc-meet-day", reason: "BSPC calendar item", eventId: "cal-2" });
  assert.strictEqual(app.activeDayModeId(), "", "calendar suggestion never applies itself");

  const day = "2026-08-13";
  function task(raw) { return app.normalizeTaskRecord(Object.assign({ area: "Work", done: false, executionStatus: "actionable", createdAt: 1 }, raw)); }
  const fixture = {
    portfolio: { activeRoleId: "role-studio", capacityMode: "full", dailyCommitmentLimit: 3 },
    projects: [{ id: "project-studio", title: "KevinOS", status: "Active", roleId: "role-studio", nextAction: "Run the role-aware Today gate" }],
    events: [{ id: "stop-practice", title: "Practice", date: day, time: "14:00", roleId: "role-bshs-swim" }],
    items: [
      task({ id: "promise-cross", text: "Send BSPC entries", roleId: "role-bspc", commitmentType: "externalPromise", due: "2026-08-12", effortMinutes: 30 }),
      task({ id: "hard-prep", text: "Pack meet timing kit", roleId: "role-bspc", commitmentType: "projectAction", hardStop: "2026-08-13T14:00", effortMinutes: 20 }),
      task({ id: "manual", text: "Kevin chose this", roleId: "role-studio", commitmentType: "projectAction", today: true, focusDate: day, focusRank: 1, focusSetAt: 10 }),
      task({ id: "project-next", text: "Run the role-aware Today gate", roleId: "role-studio", projectId: "project-studio", commitmentType: "projectAction", today: true }),
      task({ id: "review-due", text: "Check Claude response", roleId: "role-studio", commitmentType: "projectAction", executionStatus: "waiting", reviewDate: day }),
      task({ id: "ordinary", text: "Clean workspace", roleId: "role-studio", commitmentType: "maintenance", today: true }),
      task({ id: "waiting-future", text: "Wait for reply", roleId: "role-studio", commitmentType: "projectAction", executionStatus: "waiting", reviewDate: "2026-08-14" }),
      task({ id: "family", text: "Home handoff", roleId: "role-family", commitmentType: "projectAction", today: true }),
      task({ id: "idea", text: "Maybe later", roleId: "role-studio", commitmentType: "idea" }),
    ],
  };
  const before = JSON.parse(JSON.stringify(fixture));
  const full = app.todayPlanModel(fixture, { day, time: "12:00", modeId: "studio-deep-work" });
  assert.deepStrictEqual(fixture, before, "Today selection never mutates task, project, event, or portfolio state");
  assert.deepStrictEqual(full.commitments.map((x) => x.task.id), ["promise-cross", "hard-prep", "manual"], "fixed rule precedence chooses hard promise, hard-stop prep, then Focus Rail");
  assert.strictEqual(full.primary.task.id, "promise-cross", "exactly one primary action is selected");
  assert.strictEqual(full.commitments.length, 3, "full capacity respects the configured three-commitment ceiling");
  assert.ok(full.primary.reasons.includes("PROMISE_OVERDUE"));
  assert.ok(full.primary.reasons.includes("ROLE_CROSSOVER_PROMISE"), "hard external promise crosses active role with an explanation");
  assert.ok(full.commitments[1].reasons.includes("HARD_STOP_PREP"));
  assert.ok(full.commitments[2].reasons.includes("MANUAL_FOCUS"), "manual Focus Rail remains an explicit overlay");
  assert.deepStrictEqual(full.hardStop, { time: "14:00", title: "Practice", id: "stop-practice" });
  assert.strictEqual(full.availableMinutes, 120);
  assert.strictEqual(full.focusMinutes, 110, "selected mode reserves explicit transition time");
  assert.deepStrictEqual(full.fit, { known: true, fits: true, effortMinutes: 30, availableMinutes: 110 });
  assert.strictEqual(full.deferred.find((x) => x.task.id === "waiting-future").reasons[0], "WAITING_UNTIL_REVIEW");
  assert.strictEqual(full.deferred.find((x) => x.task.id === "family").reasons[0], "ROLE_FILTERED");
  assert.strictEqual(full.deferred.find((x) => x.task.id === "project-next").reasons[0], "CAPACITY_LIMIT");
  assert.deepStrictEqual(app.todayPlanModel(fixture, { day, time: "12:00", modeId: "studio-deep-work" }), full, "identical Today input produces identical order and reasons");

  const low = app.todayPlanModel(fixture, { day, time: "12:00", modeId: "studio-deep-work", capacityMode: "low" });
  assert.deepStrictEqual(low.commitments.map((x) => x.task.id), ["promise-cross"], "low capacity protects one commitment");
  assert.deepStrictEqual(fixture, before, "low capacity never changes source status or WIP state");
  assert.ok(low.deferred.some((x) => x.task.id === "hard-prep" && x.reasons[0] === "CAPACITY_LIMIT"));

  const modeOnly = JSON.parse(JSON.stringify(fixture));
  modeOnly.portfolio.activeRoleId = "";
  const bspc = app.todayPlanModel(modeOnly, { day, time: "12:00", modeId: "bspc-practice", capacityMode: "full" });
  assert.ok(bspc.commitments.some((x) => x.task.id === "promise-cross"));
  assert.ok(bspc.deferred.some((x) => x.task.id === "manual" && x.reasons[0] === "ROLE_FILTERED"), "mode role visibility applies only when Kevin did not choose a role");

  const mismatch = JSON.parse(JSON.stringify(fixture));
  mismatch.items[0].effortMinutes = 150;
  assert.deepStrictEqual(app.todayPlanModel(mismatch, { day, time: "12:00", modeId: "studio-deep-work" }).fit, { known: true, fits: false, effortMinutes: 150, availableMinutes: 110 }, "explicit mismatch stays visible");
  const unknownFit = JSON.parse(JSON.stringify(fixture));
  unknownFit.items[0].effortMinutes = null;
  assert.strictEqual(app.todayPlanModel(unknownFit, { day, time: "12:00", modeId: "studio-deep-work" }).fit.known, false, "KevinOS never invents task duration");

  const coachTask = { id: "coach", text: "Ship release", executionStatus: "actionable" };
  const coachBefore = JSON.parse(JSON.stringify(coachTask));
  for (const reason of app.STUCK_REASONS) {
    const first = app.stuckAction(reason, coachTask);
    assert.ok(first && first.length > 20, reason + " returns a concrete safe action");
    assert.strictEqual(app.stuckAction(reason, coachTask), first, reason + " is deterministic");
  }
  assert.deepStrictEqual(coachTask, coachBefore, "Do Next Coach never mutates its task");

  const empty = app.todayPlanModel({ items: [], projects: [], events: [], portfolio: {} }, { day, time: "12:00", modeId: "recovery-reset" });
  assert.strictEqual(empty.primary, null, "empty Today does not invent a primary action");
  assert.deepStrictEqual(empty.commitments, []);
  assert.match(empty.transitionCue, /recovery/i, "empty mode still keeps the transition explicit");

  console.log("role-aware Today contracts ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
