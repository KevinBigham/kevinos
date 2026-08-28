"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");

const PACKET = "grading-groq-zdr-pilot-v1-f85f024dfaa65e676a29";
const MODEL = "openai/gpt-oss-20b";

function usage() {
  return "Usage: node tools/probe-grading-groq-pilot.js --redacted --zdr-confirmed\n" +
    "       node tools/probe-grading-groq-pilot.js --self-test\n" +
    "Runs one fixed synthetic grading capsule through a loopback-only relay. No credential argument is accepted.";
}

function parseArgs(argv) {
  if (argv.length === 1 && argv[0] === "--self-test") return { selfTest: true, redacted: true, zdrConfirmed: false };
  const allowed = argv.length === 2 && argv.includes("--redacted") && argv.includes("--zdr-confirmed");
  if (!allowed) throw new Error("INVALID_ARGUMENTS");
  return { selfTest: false, redacted: true, zdrConfirmed: true };
}

function parseLocalConfig(text) {
  const out = {};
  for (const line of String(text || "").split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue;
    const at = line.indexOf("=");if (at <= 0) continue;
    const key = line.slice(0, at).trim();if (!/^[A-Z][A-Z0-9_]*$/.test(key) || Object.prototype.hasOwnProperty.call(out, key)) throw new Error("LOCAL_CONFIG_INVALID");
    out[key] = line.slice(at + 1);
  }
  return out;
}

async function loadWorker(root) {
  const src = fs.readFileSync(path.join(root, "relay", "worker.js"), "utf8");
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

async function fixedCapsule(worker) {
  const payload = {
    pilotVersion: "1", packetFingerprint: PACKET, promptVersion: "grading-groq-shadow-v1", schemaVersion: "1",
    synthetic: true, allowPaid: false, privacyClass: "SANITIZED", shadowSubmissionToken: "SUB-A1B2C3D4E5F6071829",
    rubricFingerprint: "sha256:" + "a".repeat(64), rubricVersion: 1,
    rubric: { criteria: [{ criterionId: "criterion-1", name: "Evidence", description: "Use a concrete detail to support the fictional claim.", maxPoints: 10, performanceLevels: "Meets|Approaching|Insufficient", requiredEvidence: "Cite one supplied paragraph.", feedbackExpectation: "Name one strength and one next step." }] },
    source: { paragraphs: [{ id: "P1", text: "The fictional response supports an emergency fund with a seventy-five dollar monthly example and explains that the buffer prevents new debt." }] },
    manifest: { approved: true, purpose: "Synthetic grading proposal shadow pilot", deidentified: true, redactionCount: 0, byteCount: 640, included: ["one-time shadow token", "rubric criteria", "synthetic source paragraphs"], omitted: ["local identity", "student name", "source filename", "course", "hour", "assignment name", "accommodations", "teacher-only notes", "vault submission token", "official total", "letter grade", "finalization state", "original bytes"], records: [{ id: "synthetic-shadow", type: "synthetic-grading-capsule", fields: ["shadowSubmissionToken", "rubric", "source"], redactedFields: [] }] },
    capsuleFingerprint: ""
  };
  payload.capsuleFingerprint = await worker.gradingPilotFingerprint(payload);
  return payload;
}

function safeReceiptCode(value, fallback) {
  const code = String(value || "");
  return /^[A-Z][A-Z0-9_: -]{0,79}$/.test(code) ? code : fallback;
}

function redactedReceipt(httpOk, data, providerCalls, httpStatus) {
  const provenance = data && data.provenance || {}, validation = data && data.validation || {}, usage = data && data.usage || {}, proposal = data && data.proposal || {}, criteria = Array.isArray(proposal.criteria) ? proposal.criteria : [], attempted = data && Array.isArray(data.attempted) ? data.attempted : [], lastAttempt = attempted.length ? attempted[attempted.length - 1] : null;
  const pass = httpOk && data && data.ok === true && data.syntheticOnly === true && providerCalls === 1 && provenance.providerId === "groq" && Array.isArray(provenance.fallbackChain) && provenance.fallbackChain.length === 0 && validation.schema === "PASS" && validation.businessRules === "PROPOSAL_ONLY" && proposal.status === "REVIEW_REQUIRED" && proposal.review && proposal.review.required === true && criteria.length === 1 && criteria[0] && Array.isArray(criteria[0].evidence) && criteria[0].evidence.length > 0;
  return {
    packetFingerprint: PACKET,
    result: pass ? "PASS" : "FAIL",
    httpStatus: Number.isInteger(httpStatus) ? httpStatus : 0,
    routeCode: pass ? "PASS" : safeReceiptCode(data && data.code, "NOT_AVAILABLE"),
    providerErrorCode: pass ? "NONE" : safeReceiptCode(lastAttempt && lastAttempt.error, "NOT_AVAILABLE"),
    syntheticOnly: true,
    provider: provenance.providerId === "groq" ? "groq" : "NOT_CONFIRMED",
    exactModel: typeof provenance.modelId === "string" ? provenance.modelId.slice(0, 160) : "",
    schema: typeof validation.schema === "string" ? validation.schema.slice(0, 40) : "NOT_RUN",
    privacy: typeof validation.forbiddenData === "string" ? validation.forbiddenData.slice(0, 40) : "NOT_RUN",
    businessRules: typeof validation.businessRules === "string" ? validation.businessRules.slice(0, 40) : "NOT_RUN",
    proposalStatus: ["READY_FOR_REVIEW", "REVIEW_REQUIRED", "CANNOT_GRADE"].includes(proposal.status) ? proposal.status : "NOT_RETURNED",
    reviewRequired: proposal && proposal.review && proposal.review.required === true,
    criterionCount: criteria.length,
    evidenceCount: criteria.reduce((n, row) => n + (Array.isArray(row && row.evidence) ? row.evidence.length : 0), 0),
    fallbackHops: Array.isArray(provenance.fallbackChain) ? provenance.fallbackChain.length : 0,
    providerCalls,
    responseContentStored: false,
    posted: false,
    finalized: false,
    usage: { inputTokens: Number(usage.inputTokens || 0), outputTokens: Number(usage.outputTokens || 0), totalTokens: Number(usage.totalTokens || 0) }
  };
}

async function liveProbe(root) {
  const configPath = path.join(root, "relay", ".dev.vars"), stat = fs.statSync(configPath);
  if ((stat.mode & 0o077) !== 0) throw new Error("LOCAL_CONFIG_PERMISSIONS");
  const local = parseLocalConfig(fs.readFileSync(configPath, "utf8"));
  const groqKeyName = ["GROQ", "API", "KEY"].join("_"), groqKey = local[groqKeyName];
  if (!groqKey || groqKey.length < 12) throw new Error("GROQ_NOT_CONFIGURED");
  const worker = await loadWorker(root), payload = await fixedCapsule(worker), rows = new Map(), relayToken = "grading-pilot-loopback-only";
  const env = { GROQ_MODEL: MODEL, GROQ_ZDR_CONFIRMED: "1", AI_ALLOW_PAID: "false", AI_ENABLED_PROVIDERS: "groq", AI_FREE_VERIFIED_MODELS: "groq:" + MODEL, AI_MAX_FALLBACK_HOPS: "0", AI_MAX_RETRIES_PER_PROVIDER: "0", AI_FREE_HEADROOM_PERCENT: "25", GROQ_DAILY_CEILING: "900", GRADING_GROQ_PILOT_ENABLED: "1", GRADING_GROQ_PILOT_SYNTHETIC_ONLY: "1", KEVINOS_TOKEN: relayToken, AI_RATE_LIMIT_PER_HOUR: "2", PUSH: { async get(key) { return rows.has(key) ? rows.get(key) : null; }, async put(key, value) { rows.set(key, String(value)); }, async delete(key) { rows.delete(key); } } };
  env[groqKeyName] = groqKey;
  let providerCalls = 0;const nativeFetch = global.fetch;
  global.fetch = async function guardedFetch(input, init) {
    const url = new URL(typeof input === "string" ? input : input.url);
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return nativeFetch(input, init);
    if (url.protocol === "https:" && url.hostname === "api.groq.com" && url.pathname === "/openai/v1/chat/completions" && providerCalls === 0) { providerCalls++;return nativeFetch(input, init); }
    throw new Error("TRANSPORT_DESTINATION_BLOCKED");
  };
  const server = http.createServer(async (req, res) => {
    try {
      let body = "";for await (const chunk of req) { body += chunk;if (Buffer.byteLength(body) > 256 * 1024) throw new Error("BODY_LIMIT"); }
      const response = await worker.default.fetch(new Request("http://relay.loopback" + req.url, { method: req.method, headers: req.headers, body }), env);
      res.writeHead(response.status, Object.fromEntries(response.headers));res.end(await response.text());
    } catch (_) { res.writeHead(500, { "content-type": "application/json" });res.end('{"ok":false,"code":"LOOPBACK_FAILURE"}'); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address(), response = await global.fetch("http://127.0.0.1:" + address.port + "/grading/pilot/route", { method: "POST", headers: { "content-type": "application/json", "X-KevinOS-Token": relayToken }, body: JSON.stringify(payload) });
    let data = null;try { data = await response.json(); } catch (_) {}
    return redactedReceipt(response.ok, data, providerCalls, response.status);
  } finally {
    local[groqKeyName] = "";env[groqKeyName] = "";global.fetch = nativeFetch;await new Promise((resolve) => server.close(resolve));rows.clear();
  }
}

async function selfTest(root) {
  const worker = await loadWorker(root), payload = await fixedCapsule(worker);
  if (parseArgs(["--redacted", "--zdr-confirmed"]).zdrConfirmed !== true || !/^sha256:[a-f0-9]{64}$/.test(payload.capsuleFingerprint)) throw new Error("SELF_TEST_CONTRACT");
  const receipt = redactedReceipt(true, { ok: true, syntheticOnly: true, proposal: { status: "REVIEW_REQUIRED", criteria: [{ evidence: [{}] }], review: { required: true } }, provenance: { providerId: "groq", modelId: MODEL, fallbackChain: [] }, validation: { schema: "PASS", forbiddenData: "PASS", businessRules: "PROPOSAL_ONLY" }, usage: {} }, 1, 200);
  if (receipt.result !== "PASS" || JSON.stringify(receipt).includes("seventy-five")) throw new Error("SELF_TEST_REDACTION");
  console.log("grading Groq pilot probe self-test ok — fixed synthetic capsule, loopback-only, one provider call, content-free receipt");
}

async function main() {
  const options = parseArgs(process.argv.slice(2)), root = path.join(__dirname, "..");
  if (options.selfTest) return selfTest(root);
  const receipt = await liveProbe(root);
  console.log("KevinOS grading Groq pilot probe — REDACTED");
  console.log(JSON.stringify(receipt, null, 2));
  if (receipt.result !== "PASS") process.exitCode = 1;
}

if (require.main === module) main().catch(function (error) { console.error("Grading Groq pilot probe failed safely: " + String(error && error.message || "UNKNOWN").replace(/[^A-Z0-9_ -]/gi, "").slice(0, 80));process.exit(1); });

module.exports = { PACKET, MODEL, parseArgs, parseLocalConfig, fixedCapsule, redactedReceipt };
