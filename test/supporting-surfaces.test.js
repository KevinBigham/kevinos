"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const loaded = await loadApp();
  const app = loaded.app;
  const raw = JSON.parse(JSON.stringify(app.getState()));
  raw.projects = [{ id: "project-one", title: "Command center", outcome: "Release the command center", status: "Active", roleId: "role-studio", privacyClass: "work-internal", lastProof: "Focused suite passed", lastProofAt: 200 }];
  raw.people = [{ id: "person-one", name: "Reviewer", organization: "Studio", privacyClass: "private-personal" }];
  raw.events = [{ id: "event-one", title: "Release review", projectId: "project-one", adminKind: "publishing-deadline", date: "2026-08-20", privacyClass: "work-internal" }];
  raw.items = [
    { id: "task-communication", text: "Send reviewed public recap", projectId: "project-one", personId: "person-one", eventId: "event-one", roleId: "role-studio", commitmentType: "externalPromise", communicationState: "ready", communicationChannel: "email", reviewDate: "2026-08-13", sourceRef: "email:fixture", privacyClass: "work-internal" },
    { id: "task-admin", text: "Renew explicit certification", projectId: "project-one", adminKind: "certification", due: "2026-08-12", privacyClass: "work-internal" },
    { id: "task-keyword-only", text: "Budget discussion but no explicit classification", privacyClass: "work-internal" }
  ];
  raw.decisions = [{ id: "decision-one", question: "Which bounded path?", context: "Fixture", options: [{ id: "a", label: "A", tradeoffs: "Fast" }, { id: "a", label: "duplicate", tradeoffs: "ignored" }], choiceId: "a", why: "Reversible", assumptions: ["Tests stay green", "Tests stay green"], reversible: true, revisitAt: "2026-08-13", status: "decided", projectId: "project-one", roleId: "role-studio", sourceRef: "brief:fixture", privacyClass: "work-internal", createdAt: 100, decidedAt: 101 }];
  raw.goals = [{ id: "goal-one", title: "Trustworthy release", projectIds: ["project-one"], roleIds: ["role-studio"], evidenceRefs: [{ at: 150, proof: "Browser receipt", sourceRef: "receipt:browser" }], privacyClass: "work-internal" }];
  raw.notes = [{ id: "note-one", title: "Release notes", body: "Bounded source text", projectId: "project-one", roleId: "role-studio", personId: "person-one", sourceRef: "doc:notes", privacyClass: "work-internal" }];
  raw.spend = [{ id: "spend-one", merchant: "Fixture service", category: "Subscriptions", date: "2026-08-10" }, { id: "spend-two", merchant: "Ordinary", category: "Other", date: "2026-08-10" }];
  raw.portfolio.labBudget = [{ id: "lab-search", feature: "Typed search", frictionEvidence: "Fixture friction", successTest: "Find linked record", owner: "Kevin", adoptionCheck: "Review after use", sunsetPlan: "Remove controls", reviewDate: "2026-08-20", status: "active" }];

  const before = JSON.parse(JSON.stringify(raw));
  const normalized = app.normalizeStateV40(raw);
  assert.deepStrictEqual(raw, before, "supporting-surface normalization never mutates source state");
  assert.deepStrictEqual(app.normalizeStateV40(normalized), normalized, "supporting records normalize idempotently");
  assert.strictEqual(normalized.decisions[0].options.length, 1, "duplicate decision option ids are removed deterministically");
  assert.deepStrictEqual(normalized.decisions[0].assumptions, ["Tests stay green"]);
  assert.strictEqual(normalized.items[0].communicationState, "ready");
  assert.strictEqual(normalized.items[0].eventId, "event-one");
  assert.strictEqual(normalized.items[1].adminKind, "certification");

  const due = app.dueDecisionRevisits(normalized, "2026-08-13");
  assert.deepStrictEqual(due.map((x) => x.id), ["decision-one"], "due decision revisits are stable and explicit");
  assert.strictEqual(app.communicationCommitments(normalized)[0].id, "task-communication");
  const index = app.relationshipIndex(normalized);
  assert.strictEqual(index.byEvent["event-one"].tasks[0].id, "task-communication", "communication commitment joins to its event without copying data");
  assert.strictEqual(index.byPerson["person-one"].tasks[0].id, "task-communication");

  let results = app.typedSearchRecords(normalized, "release", {});
  assert.deepStrictEqual(app.typedSearchRecords(normalized, "release", {}), results, "typed search ordering is deterministic");
  assert.strictEqual(results[0].id, "note-one", "title-prefix relevance wins without a hidden weighted score");
  assert.ok(results.some((x) => x.id === "project-one") && results.some((x) => x.id === "goal-one"), "typed search includes project and goal records");
  results = app.typedSearchRecords(normalized, "release", { type: "note", roleId: "role-studio", projectId: "project-one", personId: "person-one", status: "", source: "doc:" });
  assert.deepStrictEqual(results.map((x) => x.id), ["note-one"], "all explicit typed-search filters compose");
  assert.strictEqual(app.typedSearchRecords(normalized, "", {}).length, 0, "blank search remains calm");

  const admin = app.adminMoneyRadar(normalized, "2026-08-13");
  assert.ok(admin.some((x) => x.id === "task-admin" && x.overdue));
  assert.ok(admin.some((x) => x.id === "event-one" && x.adminKind === "publishing-deadline"));
  assert.ok(admin.some((x) => x.id === "spend-one" && x.adminKind === "subscription"));
  assert.ok(!admin.some((x) => x.id === "task-keyword-only" || x.id === "spend-two"), "radar uses explicit typed facts, never keyword guesses");

  const evidence = app.evidenceTimeline(normalized);
  assert.deepStrictEqual(evidence.map((x) => x.kind), ["project-proof", "goal-evidence"]);
  assert.ok(evidence.every((x) => x.score === undefined && x.points === undefined), "evidence timeline has no engagement score");

  assert.strictEqual(app.knowledgeConversionPlan(normalized, normalized.notes[0], "attach", "project-one", "public").allowed, false, "knowledge conversion cannot weaken privacy");
  assert.strictEqual(app.knowledgeConversionPlan(normalized, normalized.notes[0], "decision", "project-one", "work-internal").allowed, true);
  assert.strictEqual(app.knowledgeConversionPlan(normalized, normalized.notes[0], "decision", "missing", "work-internal").reason, "PROJECT_REQUIRED");

  const portable = app.portableDoc(normalized);
  assert.strictEqual(portable.portfolio.labBudget[0].sunsetPlan, "Remove controls", "Lab Budget metadata is portable inside the existing portfolio object");
  const reloaded = await loadApp({ storedState: portable });
  assert.strictEqual(reloaded.app.getState().portfolio.labBudget[0].reviewDate, "2026-08-20", "Lab Budget round-trips without a new top-level field");
  assert.strictEqual(reloaded.app.getState().items[0].communicationState, "ready");
  assert.strictEqual(reloaded.app.getState().decisions[0].sourceRef, "brief:fixture");

  assert.strictEqual(app.recordLabSignal("open-promises", "2026-08-13", 9), true);
  assert.strictEqual(app.recordLabSignal("open-promises", "2026-08-13", 9), false, "same content-free signal counts at most once per day");
  const signalRaw = loaded.localStorage.getItem("kevinos:lab-signals:v1");
  assert.ok(signalRaw && JSON.parse(signalRaw).counts["open-promises"] === 9);
  assert.doesNotMatch(signalRaw, /Send reviewed|Fixture friction|Reviewer/, "device signal sidecar stores no record content");

  const hostile = JSON.parse(JSON.stringify(portable));
  hostile.projects[0].title = '<img src=x onerror="globalThis.pwned=1">';
  hostile.decisions[0].question = '<svg onload="globalThis.pwned=1">';
  const hostileLoad = await loadApp({ storedState: hostile });
  const html = hostileLoad.app.projectHubHTML(hostileLoad.app.getState().projects[0]);
  assert.doesNotMatch(html, /<img|<svg/, "decision/project support surfaces escape hostile record content");
  assert.match(html, /&lt;svg/);

  const scale = JSON.parse(JSON.stringify(normalized));
  scale.items = [];
  scale.notes = [];
  for (let i = 0; i < 1000; i++) scale.items.push({ id: "scale-task-" + i, text: "Scale fixture " + i, projectId: i % 2 ? "project-one" : null, personId: i % 5 === 0 ? "person-one" : null, goalId: i % 7 === 0 ? "goal-one" : null, eventId: i % 11 === 0 ? "event-one" : null, roleId: "role-studio", sourceRef: "scale:task", privacyClass: "work-internal" });
  for (let i = 0; i < 500; i++) scale.notes.push({ id: "scale-note-" + i, title: "Scale note " + i, body: "Scale fixture knowledge " + i, projectId: i % 2 ? "project-one" : null, personId: i % 5 === 0 ? "person-one" : null, roleId: "role-studio", sourceRef: "scale:note", privacyClass: "work-internal" });
  const scaleNow = Date.now();
  const friction = [];
  for (let i = 0; i < 200; i++) friction.push({ id: "scale-friction-" + i, type: "kevinos.friction.marked", surface: i % 2 ? "now" : "capture", targetKind: "task", targetId: "scale-task-" + i, category: "still-too-big", timestamp: scaleNow - i });
  loaded.localStorage.setItem("kevinos:friction", JSON.stringify(friction));
  const started = Date.now();
  assert.strictEqual(app.typedSearchRecords(scale, "Scale fixture", {}).length, 100, "typed search returns its bounded result window");
  const scaleIndex = app.relationshipIndex(scale);
  assert.strictEqual(scaleIndex.byProject["project-one"].tasks.length, 500, "representative relationship index retains linked tasks");
  assert.strictEqual(scaleIndex.byProject["project-one"].notes.length, 250, "representative relationship index retains linked notes");
  assert.strictEqual(app.loadFrictionEvents(scaleNow).length, 200, "maximum friction sidecar remains bounded at representative scale");
  const scaleElapsed = Date.now() - started;
  assert.ok(scaleElapsed < 2000, "1,000 tasks, 500 notes, 200 friction marks, and added relationships remain interactive (" + scaleElapsed + "ms)");

  console.log("supporting surfaces contracts ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
