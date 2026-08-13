"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const { app } = await loadApp();
  const state = app.getState();

  assert.deepStrictEqual(app.COMMITMENT_TYPES, ["externalPromise", "scheduled", "projectAction", "maintenance", "idea"], "commitment types are a closed registry");
  assert.deepStrictEqual(app.EXECUTION_STATES, ["actionable", "waiting", "delegated", "scheduled", "someday", "done", "canceled"], "execution states are a closed registry");
  assert.deepStrictEqual(app.ENERGY_LEVELS, ["low", "normal", "high"], "energy is bounded and qualitative");
  assert.deepStrictEqual(app.COMMITMENT_RISK_REASONS, ["PROMISE_OVERDUE", "PROMISE_DUE_TODAY", "PROMISE_START_BY", "HARD_STOP_PREP", "WAITING_REVIEW", "DELEGATION_REVIEW", "MISSING_START_BY"], "risk reasons have a stable deterministic order");

  const source = {
    id: "task-contract",
    text: "Send the release receipt",
    area: "Work",
    due: "2026-08-20",
    repeat: "weekly",
    roleId: "role-studio",
    goalId: "goal-ship",
    projectId: "project-kevinos",
    personId: "person-kevin",
    commitmentType: "externalPromise",
    executionStatus: "waiting",
    startBy: "2026-08-17",
    leadDays: 3,
    hardStop: "2026-08-20T15:00",
    waitingOn: "Claude review",
    delegatedToPersonId: "person-claude",
    reviewDate: "2026-08-18",
    effortMinutes: 35,
    energy: "high",
    sourceRef: "mission-k3",
    promiseOwnerPersonId: "person-kevin",
    beneficiaryPersonId: "person-kevin",
    privacyClass: "private-personal",
    reasonNote: "Kevin promised a bounded receipt",
  };
  const before = JSON.parse(JSON.stringify(source));
  const normalized = app.normalizeTaskRecord(source);
  assert.deepStrictEqual(source, before, "task normalization never mutates its source");
  assert.deepStrictEqual(app.normalizeTaskRecord(normalized), normalized, "commitment normalization is idempotent");
  Object.keys(source).forEach((key) => assert.deepStrictEqual(normalized[key], source[key], "normalizer preserves " + key));

  const malformed = app.normalizeTaskRecord({
    text: "Malformed",
    commitmentType: "emergency",
    executionStatus: "maybe",
    leadDays: -4,
    effortMinutes: -1,
    energy: "infinite",
    privacyClass: "secret",
  });
  assert.strictEqual(malformed.commitmentType, "idea");
  assert.strictEqual(malformed.executionStatus, "actionable");
  assert.strictEqual(malformed.leadDays, 0);
  assert.strictEqual(malformed.effortMinutes, null);
  assert.strictEqual(malformed.energy, "normal");
  assert.strictEqual(malformed.privacyClass, "work-internal");
  assert.strictEqual(app.normalizeTaskRecord({ done: true, executionStatus: "waiting" }).executionStatus, "done", "done truth is canonical");

  assert.strictEqual(app.validDateKey("2026-02-29"), null, "invalid calendar dates do not enter selectors");
  assert.strictEqual(app.validDateKey("2028-02-29"), "2028-02-29");
  assert.strictEqual(app.taskStartBy({ startBy: "2026-08-17", due: "2026-08-20", leadDays: 9 }), "2026-08-17", "explicit start-by is authoritative");
  assert.strictEqual(app.taskStartBy({ due: "2026-03-09", leadDays: 2 }), "2026-03-07", "lead-day math crosses spring DST without clock drift");
  assert.strictEqual(app.taskStartBy({ due: "2026-11-02", leadDays: 2 }), "2026-10-31", "lead-day math crosses fall DST without clock drift");
  assert.strictEqual(app.taskStartBy({ due: "2026-08-20", leadDays: 0 }), null, "KevinOS does not invent a start-by estimate");

  function reasons(task, day) { return app.taskRiskReasons(app.normalizeTaskRecord(task), day); }
  assert.deepStrictEqual(reasons({ commitmentType: "externalPromise", due: "2026-08-12" }, "2026-08-13"), ["PROMISE_OVERDUE", "MISSING_START_BY"]);
  assert.deepStrictEqual(reasons({ commitmentType: "externalPromise", due: "2026-08-13", hardStop: "2026-08-13T17:00" }, "2026-08-13"), ["PROMISE_DUE_TODAY", "HARD_STOP_PREP", "MISSING_START_BY"]);
  assert.deepStrictEqual(reasons({ commitmentType: "externalPromise", due: "2026-08-20", leadDays: 7 }, "2026-08-13"), ["PROMISE_START_BY"]);
  assert.deepStrictEqual(reasons({ commitmentType: "externalPromise", due: "2026-08-20", startBy: "2026-08-19" }, "2026-08-13"), []);
  assert.deepStrictEqual(reasons({ executionStatus: "waiting", reviewDate: "2026-08-13", commitmentType: "projectAction" }, "2026-08-13"), ["WAITING_REVIEW"]);
  assert.deepStrictEqual(reasons({ executionStatus: "delegated", reviewDate: "2026-08-13", commitmentType: "projectAction" }, "2026-08-13"), ["DELEGATION_REVIEW"]);

  function action(task, day) { return app.taskActionability(app.normalizeTaskRecord(task), day).actionable; }
  assert.strictEqual(action({ commitmentType: "projectAction", executionStatus: "actionable" }, "2026-08-13"), true);
  assert.strictEqual(action({ commitmentType: "idea", executionStatus: "actionable" }, "2026-08-13"), false, "ideas never leak into actionable work");
  assert.strictEqual(action({ commitmentType: "projectAction", executionStatus: "waiting", reviewDate: "2026-08-14" }, "2026-08-13"), false, "waiting work stays out before review");
  assert.strictEqual(action({ commitmentType: "projectAction", executionStatus: "waiting", reviewDate: "2026-08-13" }, "2026-08-13"), true, "waiting work returns on its review date");
  assert.strictEqual(action({ commitmentType: "projectAction", executionStatus: "delegated", reviewDate: "2026-08-14" }, "2026-08-13"), false, "delegated work stays out before review");
  assert.strictEqual(action({ commitmentType: "scheduled", executionStatus: "scheduled", startBy: "2026-08-14" }, "2026-08-13"), false);
  assert.strictEqual(action({ commitmentType: "scheduled", executionStatus: "scheduled", startBy: "2026-08-13" }, "2026-08-13"), true);
  assert.strictEqual(action({ commitmentType: "projectAction", executionStatus: "someday" }, "2026-08-13"), false);
  assert.strictEqual(action({ commitmentType: "projectAction", executionStatus: "canceled" }, "2026-08-13"), false);

  const ordered = [
    app.normalizeTaskRecord({ id: "a", text: "First", commitmentType: "projectAction", executionStatus: "actionable" }),
    app.normalizeTaskRecord({ id: "b", text: "Second", commitmentType: "externalPromise", executionStatus: "actionable", due: "2026-08-13" }),
    app.normalizeTaskRecord({ id: "c", text: "Waiting", commitmentType: "projectAction", executionStatus: "waiting", reviewDate: "2026-08-14" }),
  ];
  const orderedBefore = JSON.parse(JSON.stringify(ordered));
  const selectedA = app.selectActionableTasks(ordered, "2026-08-13");
  const selectedB = app.selectActionableTasks(ordered, "2026-08-13");
  assert.deepStrictEqual(ordered, orderedBefore, "selection is pure");
  assert.deepStrictEqual(selectedA, selectedB, "selection is deterministic across repeated runs");
  assert.deepStrictEqual(selectedA.map((x) => x.task.id), ["a", "b"], "selector preserves canonical source order rather than inventing a score");

  const promise = ordered[1];
  assert.strictEqual(app.taskMatchesCommitmentView(promise, "External Promises", "2026-08-13"), true);
  assert.strictEqual(app.taskMatchesCommitmentView(promise, "Start-by Risk", "2026-08-13"), true);
  assert.strictEqual(app.taskMatchesCommitmentView(app.normalizeTaskRecord({ commitmentType: "maintenance" }), "Admin / Maintenance", "2026-08-13"), true);
  assert.strictEqual(app.taskMatchesCommitmentView(app.normalizeTaskRecord({ commitmentType: "idea" }), "Ideas", "2026-08-13"), true);
  assert.strictEqual(app.taskMatchesCommitmentView(app.normalizeTaskRecord({ executionStatus: "someday", commitmentType: "projectAction" }), "Someday", "2026-08-13"), true);

  state.people.push({ id: "person-ana", name: "Ana Bigham" }, { id: "person-claude", name: "Claude Reviewer" });
  state.projects.push({ id: "project-kevinos", title: "KevinOS Evolution" });
  const capture = app.parseCaptureText("Send receipt //kevinos type:promise status:waiting role:studio start:2026-08-17 review:2026-08-18 wait:Claude-review owner:ana for:ana source:mission-k3");
  assert.strictEqual(capture.task.text, "Send receipt");
  assert.strictEqual(capture.task.projectId, "project-kevinos");
  assert.strictEqual(capture.task.commitmentType, "externalPromise");
  assert.strictEqual(capture.task.executionStatus, "waiting");
  assert.strictEqual(capture.task.roleId, "role-studio");
  assert.strictEqual(capture.task.startBy, "2026-08-17");
  assert.strictEqual(capture.task.reviewDate, "2026-08-18");
  assert.strictEqual(capture.task.waitingOn, "Claude review");
  assert.strictEqual(capture.task.promiseOwnerPersonId, "person-ana");
  assert.strictEqual(capture.task.beneficiaryPersonId, "person-ana");
  assert.strictEqual(capture.task.sourceRef, "mission-k3");
  assert.strictEqual(app.parseCaptureText("Ask delegate:claude review:2026-08-18").task.delegatedToPersonId, "person-claude");
  assert.strictEqual(app.parseCaptureText("Keep role:no-such-alias token").task.text, "Keep role:no-such-alias token", "unresolved bounded tokens remain visible");

  state.items = [];
  app.rollRecurring(app.normalizeTaskRecord(source));
  const rolled = state.items[0];
  ["roleId", "goalId", "personId", "commitmentType", "startBy", "leadDays", "hardStop", "waitingOn", "delegatedToPersonId", "reviewDate", "effortMinutes", "energy", "sourceRef", "promiseOwnerPersonId", "beneficiaryPersonId", "privacyClass", "reasonNote"].forEach((key) => {
    assert.deepStrictEqual(rolled[key], normalized[key], "recurrence preserves commitment field " + key);
  });
  assert.strictEqual(rolled.executionStatus, "actionable", "a non-scheduled recurrence becomes explicitly actionable");

  const portableState = JSON.parse(JSON.stringify(state));
  portableState.items = [normalized];
  const portable = app.portableDoc(portableState);
  const reload = await loadApp({ storedState: portable });
  const restored = reload.app.getState().items.find((x) => x.id === "task-contract");
  assert.ok(restored, "commitment survives portable reload");
  ["commitmentType", "executionStatus", "startBy", "leadDays", "hardStop", "waitingOn", "reviewDate", "effortMinutes", "energy", "sourceRef", "promiseOwnerPersonId", "beneficiaryPersonId", "privacyClass", "reasonNote"].forEach((key) => {
    assert.deepStrictEqual(restored[key], normalized[key], "portable round trip preserves " + key);
  });

  console.log("commitment contract ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
