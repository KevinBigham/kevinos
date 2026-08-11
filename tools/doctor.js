"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const errors = [];
const required = [
  "AGENTS.md", "relay/AGENTS.md", "docs/CURRENT_STATE.md", "docs/ARCHITECTURE.md",
  "docs/STATE_CONTRACT.md", "docs/ROOM_MAP.md", "docs/RELAY_ROUTE_MATRIX.md",
  "docs/DECISIONS.md", "docs/ADOPTION_SOAK.md", "docs/RELEASE_v0.50.md", "docs/REAL_DEVICE_VALIDATION_v0.50.md",
  "docs/ai/WORK_PACKET_TEMPLATE.md", "docs/ai/HANDOFF_TEMPLATE.md",
  ".agents/skills/kevinos-change/SKILL.md", ".agents/skills/kevinos-release/SKILL.md",
  ".agents/skills/kevinos-audit/SKILL.md",
];

function read(rel) {
  try { return fs.readFileSync(path.join(root, rel), "utf8"); }
  catch (e) { errors.push("missing or unreadable " + rel); return ""; }
}

for (const rel of required) read(rel);

const html = read("index.html");
const sw = read("sw.js");
const worker = read("relay/worker.js");
const current = read("docs/CURRENT_STATE.md");
const routeMatrix = read("docs/RELAY_ROUTE_MATRIX.md");
const roomMap = read("docs/ROOM_MAP.md");
const canonicalDocs = ["AGENTS.md", "README.md", "GETTING_STARTED.md", "relay/RELAY_SETUP.md", "docs/CURRENT_STATE.md", "docs/ROOM_MAP.md"];

for (const rel of canonicalDocs) {
  const text = read(rel);
  if (text.indexOf("/Users/kevin/KevinOS/app") >= 0) errors.push(rel + " contains the obsolete archive-era checkout path");
}
if (/This supplied archive has no `\.git`/.test(read("AGENTS.md"))) errors.push("AGENTS.md incorrectly claims the real checkout has no Git metadata");
if (/git push origin main/.test(read("GETTING_STARTED.md"))) errors.push("GETTING_STARTED.md teaches direct-to-main as the default publish path");

const appMatch = html.match(/var APP_VERSION="([^"]+)"/);
const schemaMatch = html.match(/var SCHEMA_VERSION=(\d+)/);
const cacheMatch = sw.match(/CACHE\s*=\s*"kevinos-v(\d+)_(\d+)"/);
if (!appMatch) errors.push("APP_VERSION pattern missing");
if (!schemaMatch) errors.push("SCHEMA_VERSION pattern missing");
if (!cacheMatch) errors.push("service-worker CACHE pattern missing");
if (appMatch && cacheMatch && appMatch[1].replace(".", "_") !== cacheMatch[1] + "_" + cacheMatch[2]) {
  errors.push("APP_VERSION " + appMatch[1] + " does not match service-worker cache " + cacheMatch[1] + "." + cacheMatch[2]);
}
if (appMatch && html.indexOf("KevinOS v" + appMatch[1]) < 0) errors.push("static footer fallback does not match APP_VERSION");
if (schemaMatch && !/^\d+$/.test(schemaMatch[1])) errors.push("invalid SCHEMA_VERSION");
if (appMatch && current.indexOf("app v" + appMatch[1]) < 0) errors.push("CURRENT_STATE current release version is stale");
if (schemaMatch && current.indexOf("schema v" + schemaMatch[1]) < 0) errors.push("CURRENT_STATE schema version is stale");

const scriptStart = html.indexOf("<script>");
const scriptEnd = html.lastIndexOf("</script>");
const appScript = scriptStart >= 0 && scriptEnd > scriptStart ? html.slice(scriptStart + 8, scriptEnd) : "";
if (!appScript) errors.push("app script block missing");
const contraband = [
  [/=>/, "arrow function"], [/`/, "template literal"],
  [/(^|[;{}(])\s*(const|let)\s+[A-Za-z_$]/m, "const/let declaration"],
  [/\basync\s+function|\bawait\s+/, "async/await"],
];
for (const [re, label] of contraband) if (re.test(appScript)) errors.push("app-side ES5 contraband: " + label);

const domRooms = [];
for (const m of html.matchAll(/\bid="room-([a-z0-9-]+)"/g)) domRooms.push(m[1]);
const seenRooms = new Set();
for (const id of domRooms) {
  if (seenRooms.has(id)) errors.push("duplicate room DOM id: " + id);
  seenRooms.add(id);
}
const roomDefsMatch = appScript.match(/var ROOM_DEFS=\[([\s\S]*?)\n  \];/);
const rendererMatch = appScript.match(/var RENDERERS=\{([^;]+)\};/);
if (!roomDefsMatch && !rendererMatch) errors.push("room renderer registry missing");
else if (!roomDefsMatch) {
  const rendererIds = [...rendererMatch[1].matchAll(/(?:^|,)\s*([a-z0-9]+)\s*:/g)].map((m) => m[1]);
  for (const id of rendererIds) if (!seenRooms.has(id)) errors.push("renderer has no room DOM node: " + id);
  for (const id of domRooms) if (rendererIds.indexOf(id) < 0) errors.push("room has no renderer: " + id);
}

if (roomDefsMatch) {
  const registryIds = [...roomDefsMatch[1].matchAll(/\{id:"([a-z0-9-]+)",label:/g)].map((m) => m[1]);
  const unique = new Set(registryIds);
  if (unique.size !== registryIds.length) errors.push("duplicate ROOM_DEFS id");
  for (const id of domRooms) if (!unique.has(id)) errors.push("room missing from ROOM_DEFS: " + id);
  const rendererCount = [...roomDefsMatch[1].matchAll(/renderer:[A-Za-z_$][A-Za-z0-9_$]*/g)].length;
  if (rendererCount !== registryIds.length) errors.push("ROOM_DEFS entry missing renderer");
  const registryLabels = new Map([...roomDefsMatch[1].matchAll(/\{id:"([a-z0-9-]+)",label:"([^"]+)"/g)].map((m) => [m[1], m[2]]));
  for (const row of roomMap.matchAll(/^\| `([a-z0-9-]+)` \| ([^|]+?) \|/gm)) {
    const expected = registryLabels.get(row[1]);
    if (!expected) errors.push("ROOM_MAP documents unknown room: " + row[1]);
    else if (expected !== row[2].trim()) errors.push("ROOM_MAP label for " + row[1] + " is " + row[2].trim() + ", expected " + expected);
  }
}

const workerRoutes = new Set();
for (const m of worker.matchAll(/url\.pathname\s*===\s*"([^"]+)"/g)) workerRoutes.add(m[1]);
for (const route of workerRoutes) if (routeMatrix.indexOf("`" + route + "`") < 0) errors.push("relay route missing from matrix: " + route);

for (const rel of required) {
  const text = read(rel);
  for (const m of text.matchAll(/`((?:docs|relay)\/[A-Za-z0-9_./-]+\.md|AGENTS\.md)`/g)) {
    if (!fs.existsSync(path.join(root, m[1]))) errors.push(rel + " links missing " + m[1]);
  }
}

const secretPatterns = [
  [/-----BEGIN (?:EC|RSA|OPENSSH) PRIVATE KEY-----/, "private key"],
  [/\bghp_[A-Za-z0-9]{30,}\b/, "GitHub token"],
  [/\bsk-[A-Za-z0-9]{32,}\b/, "provider key"],
  [/\bAIza[0-9A-Za-z_-]{30,}\b/, "Google API key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
];
const scanFiles = ["index.html", "relay/worker.js", "relay/wrangler.toml", ...required];
for (const rel of scanFiles) {
  const text = read(rel);
  for (const [re, label] of secretPatterns) if (re.test(text)) errors.push("possible " + label + " in " + rel);
}

if (errors.length) {
  console.error("KevinOS doctor found " + errors.length + " problem(s):");
  for (const e of errors) console.error("- " + e);
  process.exit(1);
}

console.log("KevinOS doctor ok — app v" + appMatch[1] + ", schema v" + schemaMatch[1] + ", " + domRooms.length + " rooms, " + workerRoutes.size + " relay routes");
