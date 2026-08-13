const assert = require("assert");
const { loadApp } = require("./harness");

(async function () {
  const { app } = await loadApp();

  assert.deepStrictEqual(app.MISSION_STATES, ["queued", "ready", "running", "awaiting-human", "awaiting-proof", "blocked", "review", "complete", "paused"], "mission state registry is closed and ordered");
  assert.ok(app.AGENT_PROFILES.length >= 4, "secret-free local agent profiles are available");
  assert.ok(app.AGENT_PROFILES.every((p) => p.id && p.name && p.modelLabel && p.defaultRole && p.allowedActions.length), "every profile declares identity, role, and allowed actions");
  assert.doesNotMatch(JSON.stringify(app.AGENT_PROFILES), /api[_ -]?key|authorization|token/i, "agent profiles contain no credential contract");

  const malformed = { id: "legacy", stage: "Building", missionStatus: "bogus", targetFiles: ["index.html", "", "index.html"], dependencies: "a\nb\na", missionEvents: new Array(40).fill(null).map((_, i) => ({ at: i, type: "state", from: "ready", to: "running" })) };
  const malformedCopy = JSON.parse(JSON.stringify(malformed));
  const normalized = app.normalizeBuildRecord(malformed);
  assert.strictEqual(normalized.missionStatus, "running", "legacy stage maps conservatively into the new queue");
  assert.deepStrictEqual(normalized.targetFiles, ["index.html"], "target files normalize as a stable set");
  assert.deepStrictEqual(normalized.dependencies, ["a", "b"], "dependencies normalize without a second database");
  assert.strictEqual(normalized.missionEvents.length, app.MISSION_EVENT_KEEP, "event history stays bounded");
  assert.deepStrictEqual(malformed, malformedCopy, "mission normalization is pure");

  const writer = app.normalizeBuildRecord({ id: "writer", name: "Writer", stage: "Building", missionStatus: "running", targetFiles: ["index.html", "test/a.js"], writerLockOwner: "Codex", projectId: "project-1" });
  const candidate = app.normalizeBuildRecord({ id: "candidate", name: "Candidate", missionStatus: "ready", targetFiles: ["index.html"], writerLockOwner: "Claude Code", projectId: "project-1" });
  let decision = app.missionWriterLockDecision([writer, candidate], candidate, "");
  assert.strictEqual(decision.allowed, false, "same-file simultaneous writer is denied");
  assert.strictEqual(decision.reasonCode, "WRITER_COLLISION");
  assert.deepStrictEqual(decision.conflicts[0].files, ["index.html"], "collision names the exact file and current owner");
  decision = app.missionWriterLockDecision([writer, candidate], candidate, "Kevin requests a clean handoff");
  assert.strictEqual(decision.reasonCode, "HANDOFF_REQUIRED", "reason requests a handoff instead of silently creating two writers");
  const handoff = app.setMissionStatus([writer, candidate], candidate, "running", "Kevin requests a clean handoff", 100);
  assert.strictEqual(handoff.allowed, false);
  assert.strictEqual(candidate.missionStatus, "awaiting-human", "collision override becomes an explicit Kevin waitpoint");
  assert.strictEqual([writer, candidate].filter((b) => b.missionStatus === "running").length, 1, "one writer remains authoritative");

  const independent = app.normalizeBuildRecord({ id: "independent", name: "Independent", missionStatus: "ready", targetFiles: ["relay/worker.js"], writerLockOwner: "Codex", projectId: "project-1" });
  assert.strictEqual(app.setMissionStatus([writer, independent], independent, "running", "", 200).allowed, true, "disjoint target can run");
  assert.strictEqual(independent.missionStatus, "running");
  assert.strictEqual(app.missionWriterLockDecision([], { targetFiles: [], writerLockOwner: "Codex" }, "").reasonCode, "TARGETS_REQUIRED", "running fails closed without target files");
  assert.strictEqual(app.missionWriterLockDecision([], { targetFiles: ["a.js"] }, "").reasonCode, "OWNER_REQUIRED", "running fails closed without lock owner");

  const dependency = app.normalizeBuildRecord({ id: "dep", name: "Dependency", missionStatus: "ready", targetFiles: ["a.js"], writerLockOwner: "Codex", projectId: "project-1" });
  const dependent = app.normalizeBuildRecord({ id: "dependent", name: "Dependent", missionStatus: "queued", dependencies: ["dep", "missing"], targetFiles: ["b.js"], writerLockOwner: "Codex", projectId: "project-1" });
  const facts = app.missionDependencyFacts([dependency, dependent], dependent);
  assert.strictEqual(facts.ready, false);
  assert.deepStrictEqual(facts.missing, ["missing"]);
  assert.deepStrictEqual(facts.open.map((x) => x.id), ["dep"]);
  assert.strictEqual(app.setMissionStatus([dependency, dependent], dependent, "running", "", 300).reasonCode, "DEPENDENCY_BLOCKED", "open dependency blocks Running");

  const pausable = app.normalizeBuildRecord({ id: "pause", name: "Pause", missionStatus: "ready", projectId: "project-1", targetFiles: ["pause.js"], writerLockOwner: "Codex" });
  assert.strictEqual(app.setMissionStatus([pausable], pausable, "paused", "Hard stop", 400).allowed, true);
  assert.strictEqual(pausable.pausedFrom, "ready");
  assert.strictEqual(app.setMissionStatus([pausable], pausable, "resume", "Back", 500).allowed, true);
  assert.strictEqual(pausable.missionStatus, "ready", "resume returns to serialized prior state");
  assert.strictEqual(pausable.missionEvents.length, 2, "pause and resume retain compact history");

  const mission = app.normalizeBuildRecord({
    id: "reviewed", name: "Review mission", missionStatus: "awaiting-proof", packetVersion: 1, projectId: "project-1",
    outcome: "Prove the bounded queue", currentState: "Implemented", next: "Run local tests", agentProfileId: "agent-codex",
    assignedAI: "Codex", aiRole: "Builder", reviewer: "Claude Code", repo: "/repo", branch: "codex/studio", worktree: "/repo-wt",
    targetFiles: ["index.html", "test/studio-command.test.js"], writerLockOwner: "Codex", allowedScope: "index.html\ntest/studio-command.test.js",
    forbiddenFiles: ".env", sourceEvidence: "AGENTS.md", contextPolicy: "Project capsule fields only", privacyBoundary: "No credentials or protected records",
    dataClassification: "public and work-internal metadata", acceptance: "Writer collision blocks", tests: "node test/studio-command.test.js",
    verificationStatus: "unverified", claimSummary: "Implemented queue", claimEvidenceRefs: ["handoff.md"], changedFiles: ["index.html"]
  });
  assert.strictEqual(app.convertMissionProof(mission), true);
  const initialFingerprint = app.missionPacketFingerprint(mission);
  assert.notStrictEqual(app.missionPacketFingerprint(Object.assign({}, mission, { targetFiles: ["relay/worker.js"] })), initialFingerprint, "target change invalidates packet identity");
  assert.notStrictEqual(app.missionPacketFingerprint(Object.assign({}, mission, { contextPolicy: "Different selected fields" })), initialFingerprint, "selected context change invalidates packet identity");
  assert.notStrictEqual(app.missionPacketFingerprint(Object.assign({}, mission, { tests: "node test/run.sh" })), initialFingerprint, "command change invalidates packet identity");
  assert.match(app.missionPacket(mission, "work"), /Target files \/ writer lock/);
  assert.match(app.missionPacket(mission, "work"), /Privacy manifest/);
  assert.match(app.missionPacket(mission, "work"), /Studio does not launch terminals, agents, worktrees, pushes, deploys, or provider actions/);

  assert.strictEqual(app.intakeMissionHandoff(mission, "Collaborator says all checks pass", "artifact://reported", "index.html", 600), true);
  let proof = app.missionProofStatus(mission);
  assert.strictEqual(mission.missionStatus, "review");
  assert.strictEqual(proof.verified, false, "handoff prose and references never become local proof");
  const latest = proof.bundle.attempts[proof.bundle.attempts.length - 1];
  assert.strictEqual(latest.verificationReceipts[0].localStatus, "unverified");
  assert.strictEqual(app.missionReviewDecision([mission], mission, "approve", "", 700).reasonCode, "PROOF_REQUIRED", "review approval fails closed without current proof");
  assert.strictEqual(app.missionReviewDecision([mission], mission, "rework", "Clarify the test", 800).allowed, true);
  assert.strictEqual(mission.missionStatus, "ready");

  mission.proofBundle.acceptanceItems.forEach((x) => { x.status = "pass"; });
  mission.verificationStatus = "machine";
  app.refreshProofFingerprint(mission);
  assert.strictEqual(app.recordMissionAttempt(mission), true);
  assert.ok(mission.lastProofAt > 0, "local proof stamps last-proof metadata");
  assert.strictEqual(app.missionReviewDecision([mission], mission, "approve", "Current local test passes", 900).allowed, true);
  assert.strictEqual(mission.missionStatus, "complete");

  const reviewHtml = app.missionReviewHTML(mission);
  assert.match(reviewHtml, /Claim vs evidence review/);
  assert.match(reviewHtml, /Approve current proof/);
  assert.match(reviewHtml, /Request rework/);
  assert.match(app.agentRegistryHTML(), /Profiles are secret-free local configuration/);

  const state = app.getState();
  state.projects = [{ id: "project-1", title: "Project", status: "Active", area: "Work", createdAt: 1 }];
  state.builds = [mission, pausable];
  const roundTrip = await loadApp({ storedState: app.portableDoc(state) });
  const saved = roundTrip.app.getState().builds.find((b) => b.id === "pause");
  assert.strictEqual(saved.missionStatus, "ready", "mission state survives portable boot");
  assert.strictEqual(saved.missionEvents.length, 2, "bounded pause/resume history survives portable boot");

  console.log("Studio command queue contracts ok");
})().catch((err) => { console.error(err); process.exit(1); });
