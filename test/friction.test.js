"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadApp } = require("./harness");

(async function main() {
  const { app, localStorage } = await loadApp();
  const now = Date.now();

  assert.strictEqual(app.frictionEnabled(), false, "pilot is disabled by default");
  assert.strictEqual(app.markFriction("now", "task", "task-1", "unclear", now), false, "disabled pilot records nothing");
  assert.strictEqual(localStorage._dump()["kevinos:friction"], undefined);

  assert.strictEqual(app.setFrictionEnabled(true), true, "Kevin can explicitly opt in on this device");
  assert.strictEqual(app.markFriction("now", "task", "task-1", "unclear", now - 3600000), true);
  assert.strictEqual(app.markFriction("now", "task", "task-1", "unclear", now), false, "same mark compacts within 12 hours");
  assert.strictEqual(app.markFriction("now", "task", "task-1", "still-too-big", now), true, "a changed category remains a distinct explicit mark");
  assert.strictEqual(app.markFriction("capture", "", "", "still-too-big", now), true);
  assert.strictEqual(app.markFriction("capture", "", "", "<img src=x onerror=alert(1)>", now), false, "categories are closed, not free text");

  const aggregate = app.frictionAggregate(now);
  assert.strictEqual(aggregate.total, 3);
  assert.strictEqual(aggregate.categories["still-too-big"], 2);
  assert.strictEqual(aggregate.suggestion, "Split the next action into a smaller visible move.", "one fixed suggestion follows the strongest repeated mark");
  assert.match(app.frictionWeeklyHTML(), /Local to this device; no task text is recorded/);

  const raw = localStorage._dump()["kevinos:friction"];
  assert.ok(!raw.includes("Private task title"), "sidecar cannot contain task text it was never given");
  assert.ok(!app.portableDoc(app.getState()).friction, "portable state excludes the device-local pilot");

  const rows = [];
  for (let i = 0; i < app.FRICTION_KEEP + 20; i++) rows.push({ id: "mark-" + i, type: "kevinos.friction.marked", surface: i % 2 ? "now" : "capture", targetKind: "", targetId: "", category: "unclear", timestamp: now - i });
  app.saveFrictionEvents(rows);
  assert.strictEqual(app.loadFrictionEvents(now).length, app.FRICTION_KEEP, "retention is capped at 200 rows");
  rows.unshift({ id: "too-old", type: "kevinos.friction.marked", surface: "now", targetKind: "", targetId: "", category: "unclear", timestamp: now - (app.FRICTION_DAYS + 1) * 86400000 });
  app.saveFrictionEvents(rows);
  assert.ok(!app.loadFrictionEvents(now).some((x) => x.id === "too-old"), "marks expire after 30 days");

  localStorage.setItem("kevinos:friction", "{corrupt");
  assert.deepStrictEqual(app.loadFrictionEvents(), [], "corrupt pilot data cannot block canonical state");
  app.clearFrictionEvents();
  assert.strictEqual(localStorage._dump()["kevinos:friction"], undefined, "clear removes local marks immediately");
  app.setFrictionEnabled(false);
  assert.strictEqual(app.frictionEnabled(), false, "pilot can be turned off immediately");

  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.doesNotMatch(html.slice(html.indexOf("var FRICTION_KEY"), html.indexOf("function onboardingDone")), /Notification|relayPost|sendBeacon|fetch\(/, "pilot has no notification, relay, or telemetry path");

  console.log("calm friction pilot ok");
})().catch((err) => { console.error(err); process.exit(1); });
