"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const first = await loadApp();
  const app = first.app;
  const raw = JSON.parse(JSON.stringify(app.getState()));
  const now = 1770000000000;
  raw.projects = [{
    id: "project-kevinos",
    title: "KevinOS evolution",
    area: "Work",
    status: "Active",
    roleId: "role-studio",
    privacyClass: "work-internal",
    outcome: "Ship the Project Spine",
    currentState: "Typed links are implemented",
    nextAction: "Run the Project Spine suite",
    blockers: ["Browser receipt pending"],
    resumeChecklist: ["Open CURRENT_STATE", "Run doctor"],
    repoRefs: [{ label: "KevinOS", url: "https://github.com/KevinBigham/kevinos", branch: "codex/project-spine", worktree: "/tmp/kevinos" }],
    lastProof: "Focused suite passed",
    lastProofAt: now,
    nextHardStop: "Friday release review",
    notDoingNow: "Provider activation",
    goalIds: ["goal-command-center"],
    createdAt: now,
  }];
  raw.items = [{ id: "task-next", text: "Run the Project Spine suite", projectId: "project-kevinos", goalId: "goal-command-center", personId: "person-kevin", roleId: "role-studio", privacyClass: "work-internal" }];
  raw.events = [{ id: "event-review", title: "Release review", projectId: "project-kevinos", personIds: ["person-kevin"], roleId: "role-studio", privacyClass: "work-internal" }];
  raw.builds = [{ id: "build-spine", name: "Build Project Spine", projectId: "project-kevinos", roleId: "role-studio", privacyClass: "work-internal" }];
  raw.goals = [{ id: "goal-command-center", title: "Kevin command center", projectIds: ["project-kevinos"], roleIds: ["role-studio"], privacyClass: "work-internal" }];
  raw.people = [{ id: "person-kevin", name: "Kevin", projectIds: ["project-kevinos"], roleIds: ["role-studio"], privacyClass: "private-personal" }];
  raw.decisions = [{ id: "decision-zero-rooms", question: "Add another room?", projectId: "project-kevinos", roleId: "role-studio", privacyClass: "work-internal" }];
  raw.briefs = [{ id: "brief-plan", title: "Project Spine plan", projectId: "project-kevinos", roleId: "role-studio", privacyClass: "work-internal" }];
  raw.notes = [{ id: "note-design", title: "Hub notes", projectId: "project-kevinos", roleId: "role-studio", privacyClass: "work-internal" }];
  raw.links = [{ id: "link-repo", label: "Repository", url: "https://github.com/KevinBigham/kevinos", projectId: "project-kevinos", roleId: "role-studio", privacyClass: "work-internal" }];
  raw.prompts = [{ id: "prompt-review", title: "Review prompt", projectId: "project-kevinos", roleId: "role-studio", privacyClass: "work-internal" }];
  raw.stash = [{ id: "stash-source", title: "Source research", projectId: "project-kevinos", roleId: "role-studio", privacyClass: "work-internal" }];

  const before = JSON.parse(JSON.stringify(raw));
  const normalized = app.normalizeStateV40(raw);
  assert.deepStrictEqual(raw, before, "v40/link normalization never mutates source state");
  assert.deepStrictEqual(app.normalizeStateV40(normalized), normalized, "linked state normalization is idempotent");
  assert.strictEqual(app.normalizeLinkedRecord({ projectId: 7, personIds: [1, "2", "2"], custom: true }).projectId, "7");
  assert.deepStrictEqual(app.normalizeLinkedRecord({ personIds: [1, "2", "2"] }).personIds, ["1", "2"], "typed person links are unique strings");

  const index = app.relationshipIndex(normalized);
  const related = index.byProject["project-kevinos"];
  ["tasks", "events", "builds", "goals", "people", "decisions", "briefs", "notes", "links", "prompts", "stash"].forEach((kind) => {
    assert.strictEqual(related[kind].length, 1, "Project Hub indexes canonical " + kind);
  });
  assert.strictEqual(index.byPerson["person-kevin"].tasks[0].id, "task-next", "person links index without copied state");
  assert.strictEqual(index.byGoal["goal-command-center"].tasks[0].id, "task-next", "goal links index without copied state");
  assert.strictEqual(index.byRole["role-studio"].builds[0].id, "build-spine", "role links index without copied state");
  assert.strictEqual(app.portableDoc(normalized).relationshipIndex, undefined, "derived relationship index is never persisted");

  const capsule = app.projectResumeCapsule(normalized.projects[0], normalized);
  assert.strictEqual(capsule.currentState, "Typed links are implemented");
  assert.strictEqual(capsule.nextPhysicalAction, "Run the Project Spine suite");
  assert.deepStrictEqual(capsule.blockers, ["Browser receipt pending"]);
  assert.strictEqual(capsule.keyLinks.repositories[0].branch, "codex/project-spine");
  assert.strictEqual(capsule.keyLinks.links[0].id, "link-repo");
  assert.strictEqual(capsule.lastTrustedProof, "Focused suite passed");
  assert.deepStrictEqual(capsule.restartChecklist, ["Open CURRENT_STATE", "Run doctor"]);

  const packet = app.projectContextPacket(normalized, "project-kevinos");
  assert.strictEqual(packet.version, 3);
  assert.strictEqual(packet.project.id, "project-kevinos");
  assert.strictEqual(packet.provenance.source, "KevinOS Project Hub");
  assert.ok(packet.contextManifest.some((x) => x.recordId === "note-design" && x.includedFields.includes("title")), "ordinary project context declares exact included fields");
  const protectedState = JSON.parse(JSON.stringify(normalized));
  protectedState.notes.push({ id: "note-athlete", title: "Athlete medical detail", body: "must never copy", projectId: "project-kevinos", privacyClass: "youth-sensitive" });
  const protectedPacket = app.projectContextPacket(protectedState, "project-kevinos");
  assert.strictEqual(protectedPacket.records.notes.find((x) => x.id === "note-athlete").title, "[protected]", "protected titles are redacted from default context copy");
  assert.ok(protectedPacket.contextManifest.find((x) => x.recordId === "note-athlete").redactedFields.includes("body"), "redaction manifest is explicit");

  const broken = JSON.parse(JSON.stringify(normalized));
  broken.prompts.push({ id: "prompt-orphan", title: "Orphan", projectId: "missing-project", privacyClass: "work-internal" });
  const diagnostics = app.relationshipDiagnostics(broken);
  assert.ok(diagnostics.some((x) => x.recordId === "prompt-orphan" && x.kind === "project" && /choose an existing project/.test(x.proposal)), "broken links are preserved and receive a repair proposal");
  assert.strictEqual(broken.prompts[1].projectId, "missing-project", "diagnostics never silently relink data");

  const portable = app.portableDoc(normalized);
  const reload = await loadApp({ storedState: portable });
  const rp = reload.app.getState().projects.find((x) => x.id === "project-kevinos");
  assert.strictEqual(rp.currentState, "Typed links are implemented", "resume state survives portable reload");
  assert.deepStrictEqual(rp.resumeChecklist, ["Open CURRENT_STATE", "Run doctor"], "restart checklist survives portable reload");
  assert.strictEqual(reload.app.relationshipIndex(reload.app.getState()).byProject["project-kevinos"].notes[0].id, "note-design", "Project Spine relationships reconstruct after reload");

  const studio = await loadApp();
  const studioInput = studio.document.getElementById("buildInput");
  const studioProject = studio.document.getElementById("buildProjectSelect");
  studioInput.value = "Unlinked mission";
  studioProject.value = "";
  studio.app.addBuild();
  assert.strictEqual(studio.app.getState().builds.length, 0, "new Studio mission cannot be created without project choice");
  studioInput.value = "Incubated mission";
  studioProject.value = "__incubator__";
  studio.app.addBuild();
  assert.strictEqual(studio.app.getState().builds[0].projectId, "project-studio-incubator", "explicit Incubator choice creates a real canonical project link");
  assert.strictEqual(studio.app.getState().builds[0].incubatorPlaceholder, true);
  assert.strictEqual(studio.app.getState().projects.filter((x) => x.id === "project-studio-incubator").length, 1, "Incubator placeholder seeds once");
  studioInput.value = "Second incubated mission";
  studioProject.value = "__incubator__";
  studio.app.addBuild();
  assert.strictEqual(studio.app.getState().projects.filter((x) => x.id === "project-studio-incubator").length, 1, "repeated explicit Incubator use does not duplicate the placeholder");

  console.log("project spine contracts ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
