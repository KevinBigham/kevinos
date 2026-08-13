"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const { app } = await loadApp();
  const day = "2026-08-13";
  const now = new Date(day + "T12:00:00Z").getTime();
  const projects = [];
  for (let i = 1; i <= 7; i++) {
    projects.push(app.normalizeProjectRecord({
      id: "project-" + i,
      title: "Project " + i,
      status: "Active",
      wipClass: "admitted",
      roleId: i < 5 ? "role-studio" : "role-bspc",
      outcome: "Ship outcome " + i,
      currentState: "Fixture state " + i,
      nextAction: "Do physical action " + i,
      reviewAt: "2026-08-20",
      lastProof: i === 1 ? "Gate passed" : "",
      lastProofAt: i === 1 ? now : 0,
      createdAt: now - i * 86400000,
    }));
  }
  const fixture = {
    portfolio: { projectWipLimit: 3, roleWipLimits: { "role-studio": 2 } },
    projects,
    items: [
      app.normalizeTaskRecord({ id: "promise", text: "Send meet entries", commitmentType: "externalPromise", executionStatus: "actionable", due: day }),
      app.normalizeTaskRecord({ id: "waiting", text: "Review collaborator answer", commitmentType: "projectAction", executionStatus: "waiting", reviewDate: day }),
    ],
    builds: [{ id: "build-unverified", name: "Unverified release", stage: "Shipped", acceptance: "Gate passes" }],
  };
  const before = JSON.parse(JSON.stringify(fixture));

  const wip = app.projectWipSummary(fixture);
  assert.deepStrictEqual({ count: wip.count, cap: wip.cap, overBy: wip.overBy }, { count: 7, cap: 3, overBy: 4 });
  assert.deepStrictEqual(wip.roleOver["role-studio"], { count: 4, cap: 2, overBy: 2 });
  assert.deepStrictEqual(fixture, before, "showing overload never mutates any project status or WIP class");

  fixture.portfolio.projectWipLimit = 1;
  const tightened = app.projectWipSummary(fixture);
  assert.strictEqual(tightened.count, 7, "changing the cap exposes overload but does not auto-pause projects");
  assert.ok(fixture.projects.every((p) => p.status === "Active" && p.wipClass === "admitted"));

  const candidate = app.normalizeProjectRecord({ id: "candidate", title: "Candidate", status: "Someday", wipClass: "incubator", roleId: "role-studio" });
  assert.strictEqual(app.projectAdmissionDecision(fixture, candidate, "", "", day).reasonCode, "OVERRIDE_REASON_REQUIRED");
  assert.strictEqual(app.projectAdmissionDecision(fixture, candidate, "Finish release", "2026-08-12", day).reasonCode, "OVERRIDE_REVIEW_REQUIRED");
  assert.deepStrictEqual(app.projectAdmissionDecision(fixture, candidate, "Finish release", "2026-08-20", day).allowed, true);
  assert.deepStrictEqual(fixture.projects, before.projects, "admission preflight is pure and does not admit the candidate");

  const weekly = app.weeklyPortfolioModel(fixture, day, now);
  assert.strictEqual(weekly.wins.length, 1, "recent trusted proof is a win");
  assert.strictEqual(weekly.externalPromises.length, 1);
  assert.strictEqual(weekly.waitingReviews.length, 1);
  assert.strictEqual(weekly.staleActive.length, 6, "six Active projects have stale or missing proof");
  assert.strictEqual(weekly.unverifiedMissions.length, 1, "Ready/Shipped is not treated as verified proof");
  assert.deepStrictEqual(fixture.projects, before.projects, "weekly review is a derived view");

  const unknown = app.normalizeProjectRecord({ id: "legacy", title: "Legacy", status: "Warm", notes: "keep me" });
  assert.strictEqual(unknown.status, "Someday", "unknown legacy status is conservatively non-active");
  assert.strictEqual(unknown.legacyStatus, "Warm", "unknown vocabulary is preserved without data loss");
  assert.strictEqual(unknown.notes, "keep me");

  projects[0].repoRefs = [{ label: "Canonical repo", url: "https://example.com/repo", branch: "codex/k5", worktree: "/workspace" }];
  const restartState = { v: 40, projects, items: [], events: [], people: [], goals: [], builds: [], decisions: [], briefs: [], notes: [], links: [{ id: "link-1", label: "Gate receipt", url: "https://example.com/receipt", projectId: "project-1", privacyClass: "work-internal" }], prompts: [], stash: [], roles: [], portfolio: {}, github: {}, relay: {}, push: {}, sync: {}, email: {}, calendar: {} };
  const restartedApp = (await loadApp({ storedState: restartState })).app;
  const restartedProject = restartedApp.getState().projects.find((p) => p.id === "project-1");
  const resume = restartedApp.projectResumeCapsule(restartedProject, restartedApp.getState());
  assert.strictEqual(resume.currentState, "Fixture state 1");
  assert.strictEqual(resume.nextPhysicalAction, "Do physical action 1");
  assert.strictEqual(resume.lastTrustedProof, "Gate passed", "seven-day resume uses canonical linked data and proof");
  assert.strictEqual(resume.keyLinks.repositories[0].branch, "codex/k5");
  assert.strictEqual(resume.keyLinks.links[0].label, "Gate receipt", "restart reload derives actual linked records instead of copying a second truth store");

  const html = app.wipGovernorHTML();
  assert.match(html, /WIP Governor/);
  assert.match(app.weeklyPortfolioReviewHTML(), /Weekly Portfolio Review/);

  console.log("WIP Governor and weekly portfolio contracts ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
