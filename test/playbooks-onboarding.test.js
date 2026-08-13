"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadApp } = require("./harness");

(async function main() {
  const { app } = await loadApp();
  assert.ok(app.PLAYBOOK_SEEDS.length >= 15, "first-party library covers Kevin's role workflows");
  assert.strictEqual(new Set(app.PLAYBOOK_SEEDS.map((x) => x.id)).size, app.PLAYBOOK_SEEDS.length, "playbook IDs are stable and unique");
  for (const role of ["role-teaching", "role-bshs-swim", "role-bspc", "role-bswildcats", "role-studio", "role-family", "role-personal-finance"]) {
    assert.ok(app.PLAYBOOK_SEEDS.some((x) => x.roleId === role), role + " has a first-party playbook");
  }
  assert.ok(app.PLAYBOOK_SEEDS.every((x) => x.kind === "Playbook" && x.templateVersion === 1 && x.versionLocked && x.sourceRefs.length === 1));
  assert.ok(app.PLAYBOOK_SEEDS.every((x) => x.steps.length >= 5 && x.steps.every((s) => typeof s === "string" && s.trim())), "templates are executable checklists, not vague cards");

  const seeded = { briefs: [], roles: app.ROLE_SEEDS.map(app.normalizeRoleRecord) };
  const first = app.seedV40Playbooks(seeded);
  const snapshot = JSON.stringify(first.state);
  const second = app.seedV40Playbooks(first.state);
  assert.strictEqual(first.changed, true);
  assert.strictEqual(second.changed, false, "template seeding is idempotent");
  assert.strictEqual(JSON.stringify(second.state), snapshot);
  for (const role of second.state.roles.filter((x) => x.status === "active" && x.id !== "role-inbox")) {
    assert.ok(role.playbookBriefIds.length > 0, role.id + " links its canonical playbooks");
  }

  const publish = app.PLAYBOOK_SEEDS.find((x) => x.id === "playbook-publish");
  assert.match(publish.steps.join(" "), /no private, school-protected, athlete-protected, or finance-private/i);
  assert.match(publish.safeguards.join(" "), /Ready never means Published/);
  const swim = app.PLAYBOOK_SEEDS.filter((x) => x.roleId === "role-bshs-swim" || x.roleId === "role-bspc");
  assert.ok(swim.every((x) => x.privacyClass === "youth-sensitive"), "swim templates default to youth-sensitive");
  assert.doesNotMatch(JSON.stringify(swim), /@[A-Za-z]|\b\d{3}-\d{2}-\d{4}\b/, "templates contain no email or identity fixture");
  const family = app.PLAYBOOK_SEEDS.find((x) => x.id === "playbook-family-week");
  assert.strictEqual(family.privacyClass, "family-private");
  assert.match(family.safeguards.join(" "), /non-gamified/i);

  const fixture = app.normalizeStateV40({
    v: 40,
    projects: [{ id: "project-k6", title: "KevinOS", area: "Work", status: "Active", roleId: "role-studio", privacyClass: "work-internal" }],
    briefs: app.PLAYBOOK_SEEDS,
    items: [], events: [], builds: [], links: [], prompts: [], notes: [], stash: [], people: [], spend: [], goals: [], habits: [], council: [], pending: [], profile: [], sheets: [], roles: app.ROLE_SEEDS, decisions: [], portfolio: {},
  });
  const before = JSON.parse(JSON.stringify(fixture));
  const plan = app.playbookInstantiationPlan(fixture, "playbook-studio-mission", "project-k6");
  assert.strictEqual(plan.allowed, true);
  assert.strictEqual(plan.tasks.length, 6);
  assert.ok(plan.tasks.every((x) => x.projectId === "project-k6" && x.roleId === "role-studio"));
  assert.ok(plan.tasks.every((x) => !x.today && x.due === null && x.executionStatus === "actionable"), "approval creates editable unscheduled tasks, never executes work");
  assert.ok(plan.tasks.every((x) => x.sourceRef === "playbook:playbook-studio-mission:v1:project-k6"));
  assert.deepStrictEqual(fixture, before, "preview and instantiation planning are pure");
  fixture.items.push(app.normalizeTaskRecord(plan.tasks[0]));
  const partial = app.playbookInstantiationPlan(fixture, "playbook-studio-mission", "project-k6");
  assert.strictEqual(partial.tasks.length, 5);
  assert.strictEqual(partial.duplicateCount, 1, "same version/project duplicate prevention is deterministic");

  const sweep = app.roleSweepSteps(app.ROLE_SEEDS);
  assert.strictEqual(sweep.filter((x) => x.type === "area").length, 8);
  assert.ok(sweep.some((x) => x.roleId === "role-bspc" && x.privacyClass === "youth-sensitive"));
  assert.ok(sweep.every((x) => x.type !== "area" || /^role:/.test(x.shortcut)), "every role lane shows its capture shortcut");
  assert.match(sweep.find((x) => x.roleId === "role-teaching").prompt, /Do not enter student names/);

  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /Read-only preview/);
  assert.match(html, /Nothing runs, sends, schedules, publishes, deploys/);
  assert.match(html, /data-playbook-instantiate=/);
  assert.match(html, /data-playbook-undo=/);
  assert.match(html, /KevinOS v40 · returning safely/);
  assert.match(html, /Work and Coaching stayed as reviewable legacy roles/);
  assert.match(html, /Step 7 of 7/);

  console.log("role playbook and onboarding contracts ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
