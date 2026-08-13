"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadApp } = require("./harness");

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "v39-personalization.json"), "utf8"));

(async function main() {
  const { app } = await loadApp();
  assert.strictEqual(typeof app.migrateV39ToV40, "function", "v39 migration seam exists");
  assert.strictEqual(typeof app.normalizeStateV40, "function", "v40 state normalizer exists");

  const result = app.migrateV39ToV40(fixture, 1000);
  assert.strictEqual(result.state.v, 40, "migration stamps v40 after validation");
  assert.strictEqual(result.receipt.fromVersion, 39);
  assert.strictEqual(result.receipt.toVersion, 40);
  assert.strictEqual(result.receipt.beforeFingerprint.length > 0, true, "pre-migration portable fingerprint recorded");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(result.receipt, "content"), false, "receipt contains no content");
  assert.strictEqual(result.snapshot.reason, "pre-v40-personalization");
  assert.strictEqual(result.snapshot.doc.v, 39, "checkpoint is the pre-migration portable document");

  const st = result.state;
  assert.strictEqual(st.roles.filter((r) => r.id === "role-teaching").length, 1, "stable roles seed once");
  assert.strictEqual(st.roles.filter((r) => r.id === "role-legacy-work").length, 1, "Work remains a stable legacy role");
  assert.strictEqual(st.roles.filter((r) => r.id === "role-legacy-coaching").length, 1, "Coaching remains a stable legacy role");
  assert.ok(st.roles.some((r) => r.legacyArea === "Community"), "unknown areas receive a legacy role");
  assert.ok(st.roles.some((r) => r.legacyArea === "Archive-X"), "unknown note area is not orphaned");

  const byTask = Object.fromEntries(st.items.map((x) => [x.id, x]));
  assert.strictEqual(byTask["t-teach"].roleId, "role-teaching");
  assert.strictEqual(byTask["t-ana"].roleId, "role-family");
  assert.strictEqual(byTask["t-work"].roleId, "role-legacy-work");
  assert.strictEqual(byTask["t-coach"].roleId, "role-legacy-coaching");
  assert.strictEqual(byTask["t-custom"].area, "Community", "legacy area remains byte-for-byte visible");
  assert.strictEqual(byTask["t-custom"].privacyClass, "youth-sensitive", "migration never weakens existing privacy");
  assert.strictEqual(byTask["t-ana"].privacyClass, "family-private", "family defaults conservatively");
  assert.strictEqual(st.projects.find((p) => p.id === "pr-active").status, "Active", "project status is unchanged");
  assert.strictEqual(st.projects.find((p) => p.id === "pr-active").wipClass, "admitted", "active compatibility WIP class is explicit");
  assert.strictEqual(st.projects.find((p) => p.id === "pr-paused").status, "Paused", "paused status is unchanged");

  const again = app.migrateV39ToV40(st, 2000);
  assert.deepStrictEqual(again.state, st, "migration is idempotent after v40");
  assert.strictEqual(again.migrated, false, "v40 state does not remigrate");

  const normalizerCases = [
    [app.normalizeRoleRecord, { id: "role-x", label: "X", custom: 1 }],
    [app.normalizeTaskRecord, { id: "task-x", text: "X", custom: 1 }],
    [app.normalizeProjectRecord, { id: "project-x", title: "X", custom: 1 }],
    [app.normalizeBuildRecord, { id: "build-x", name: "X", custom: 1 }],
    [app.normalizeEventRecord, { id: "event-x", title: "X", custom: 1 }],
    [app.normalizePersonRecord, { id: "person-x", name: "X", custom: 1 }],
    [app.normalizeGoalRecord, { id: "goal-x", title: "X", custom: 1 }],
    [app.normalizeDecisionRecord, { id: "decision-x", question: "X", custom: 1 }],
    [app.normalizeBriefRecord, { id: "brief-x", title: "X", custom: 1 }],
    [app.normalizePortfolio, { projectWipLimit: 4, custom: 1 }],
  ];
  for (const [normalize, input] of normalizerCases) {
    const before = JSON.parse(JSON.stringify(input));
    const once = normalize(input);
    assert.deepStrictEqual(input, before, "normalizer does not mutate its input");
    assert.deepStrictEqual(normalize(once), once, "normalizer is idempotent");
    assert.strictEqual(once.custom, 1, "normalizer preserves unknown compatible fields");
  }
  assert.strictEqual(app.normalizeRoleRecord({}).id, undefined, "normalization never invents role ids");
  assert.strictEqual(app.normalizeDecisionRecord({}).id, undefined, "normalization never invents decision ids");
  assert.strictEqual(app.normalizeTaskRecord({ privacyClass: "youth-sensitive", roleId: "role-inbox" }).privacyClass, "youth-sensitive", "normalization never weakens explicit privacy");

  const boot = await loadApp({ storedState: fixture });
  const bootState = boot.app.getState();
  assert.strictEqual(bootState.v, 40, "representative v39 save boots as v40");
  assert.strictEqual(bootState.roles.filter((r) => r.id === "role-teaching").length, 1, "boot migration seeds stable roles once");
  assert.strictEqual(bootState.items.find((x) => x.id === "t-teach").roleId, "role-teaching", "boot migration applies unambiguous role links");
  assert.strictEqual(bootState.items.find((x) => x.id === "t-work").roleId, "role-legacy-work", "boot migration preserves ambiguous Work as legacy");
  assert.strictEqual(bootState.items.length, fixture.items.length, "migration loses no tasks");
  assert.strictEqual(bootState.events.length, fixture.events.length, "migration loses no events");
  assert.strictEqual(bootState.projects.length, fixture.projects.length, "migration loses no projects");
  assert.strictEqual(bootState.relay.token, "device-token", "device-local relay connection survives boot migration");
  assert.strictEqual(bootState.github.token, "device-github", "device-local GitHub connection survives boot migration");
  assert.strictEqual(bootState.sync.key, "device-sync", "device-local sync connection survives boot migration");
  await new Promise((resolve) => setTimeout(resolve, 30));
  const migrationReceipt = JSON.parse(boot.localStorage._dump()["kevinos:migration:v40"]);
  assert.strictEqual(migrationReceipt.fromVersion, 39, "boot writes the bounded migration receipt");
  assert.strictEqual(migrationReceipt.toVersion, 40);
  assert.strictEqual(migrationReceipt.snapshotSaved, false, "headless harness honestly reports unavailable IndexedDB checkpoint");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(migrationReceipt, "content"), false, "boot receipt remains content-free");

  const portable = app.portableDoc(st);
  assert.ok(Array.isArray(portable.roles) && Array.isArray(portable.decisions), "new canonical arrays are portable");
  assert.strictEqual(portable.portfolio.projectWipLimit, 3, "portfolio is portable");
  ["sync", "push", "github", "email", "calendar"].forEach((key) => assert.strictEqual(portable[key], undefined, key + " remains excluded"));
  assert.strictEqual(portable.relay.token, "", "relay token remains blank");

  const imported = await loadApp({ storedState: st });
  const importedState = imported.app.getState();
  imported.app.applyPortableDoc({
    v: 40,
    items: [{ id: "t-custom", text: "Incoming weaker copy", area: "Community", privacyClass: "public" }],
    roles: st.roles,
    decisions: [{ id: "d-1", question: "Ship?", privacyClass: "work-internal" }],
    portfolio: { projectWipLimit: 5, dailyCommitmentLimit: 2 },
  });
  assert.strictEqual(importedState.items[0].privacyClass, "youth-sensitive", "portable import cannot weaken record privacy");
  assert.strictEqual(importedState.decisions[0].question, "Ship?", "decisions import through the canonical array");
  assert.strictEqual(importedState.portfolio.projectWipLimit, 5, "portfolio imports through the portable object allowlist");

  const merged = app.mergeById(
    [{ id: "privacy", text: "local", u: 1, privacyClass: "youth-sensitive" }],
    [{ id: "privacy", text: "remote", u: 2, privacyClass: "public" }]
  );
  assert.strictEqual(merged[0].text, "remote", "newer record content still wins");
  assert.strictEqual(merged[0].privacyClass, "youth-sensitive", "merge privacy is monotonic");
  const reverse = app.mergeById(
    [{ id: "privacy", text: "remote", u: 2, privacyClass: "public" }],
    [{ id: "privacy", text: "local", u: 1, privacyClass: "youth-sensitive" }]
  );
  assert.strictEqual(reverse[0].privacyClass, "youth-sensitive", "privacy convergence is order-independent");

  const remapHarness = await loadApp({ storedState: st });
  const remapApp = remapHarness.app;
  const remapState = remapApp.getState();
  const beforeRemap = remapApp.portableDoc(remapState);
  const beforeRemapFingerprint = remapApp.aiFingerprint(remapApp.canonicalAiString(beforeRemap));
  const plan = remapApp.roleRemapPlan(remapState, "role-legacy-work", "role-studio");
  assert.strictEqual(plan.affectedCount, 3, "remap preview counts every linked Work record");
  assert.deepStrictEqual(plan.types, { items: 1, projects: 1, builds: 1 }, "remap preview counts by record type");
  assert.ok(plan.titles.includes("Review release") && plan.titles.includes("KevinOS v40") && plan.titles.includes("Migration mission"), "remap preview names affected records");
  const remapped = remapApp.applyRoleRemapToState(remapState, "role-legacy-work", "role-studio");
  assert.strictEqual(remapped.state.items.find((x) => x.id === "t-work").roleId, "role-studio");
  assert.strictEqual(remapped.state.items.find((x) => x.id === "t-work").area, "Work", "explicit remap preserves legacy display area");
  assert.strictEqual(remapped.state.projects.find((x) => x.id === "pr-active").status, "Active", "remap does not change project status");
  remapApp.restorePortableCheckpoint(beforeRemap);
  assert.strictEqual(remapApp.aiFingerprint(remapApp.canonicalAiString(remapApp.portableDoc(remapApp.getState()))), beforeRemapFingerprint, "remap Undo restores the exact before fingerprint");

  console.log("schema v40 migration contracts ok");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
