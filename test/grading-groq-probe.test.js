"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const probe = require("../tools/probe-grading-groq-pilot");

(async function () {
  assert.throws(() => probe.parseArgs(["--redacted", "--provider", "groq"]), /INVALID_ARGUMENTS/);
  assert.throws(() => probe.parseArgs(["secret-value"]), /INVALID_ARGUMENTS/);
  assert.strictEqual(probe.parseArgs(["--redacted", "--zdr-confirmed"]).zdrConfirmed, true);
  const groqKeyName = ["GROQ", "API", "KEY"].join("_");
  assert.deepStrictEqual(probe.parseLocalConfig(groqKeyName + "=fixture-safe-value\nAI_ALLOW_PAID=false\n"), { [groqKeyName]: "fixture-safe-value", AI_ALLOW_PAID: "false" });
  assert.throws(() => probe.parseLocalConfig(groqKeyName + "=one\n" + groqKeyName + "=two\n"), /LOCAL_CONFIG_INVALID/);
  const source = fs.readFileSync(path.join(__dirname, "..", "tools", "probe-grading-groq-pilot.js"), "utf8");
  assert.match(source, /server\.listen\(0, "127\.0\.0\.1"/);
  assert.match(source, /url\.hostname === "api\.groq\.com"/);
  assert.match(source, /providerCalls === 0/);
  assert.doesNotMatch(source, /console\.(?:log|error)\([^\n]*(?:GROQ_API_KEY|local\.GROQ)/, "credential value is never rendered");
  const receipt = probe.redactedReceipt(true, { ok: true, syntheticOnly: true, proposal: { status: "REVIEW_REQUIRED", criteria: [{ evidence: [{}] }], review: { required: true }, studentNote: "must be discarded" }, provenance: { providerId: "groq", modelId: probe.MODEL, fallbackChain: [] }, validation: { schema: "PASS", forbiddenData: "PASS", businessRules: "PROPOSAL_ONLY" }, usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } }, 1, 200);
  assert.strictEqual(receipt.result, "PASS");
  assert.doesNotMatch(JSON.stringify(receipt), /must be discarded/);
  const failure = probe.redactedReceipt(false, { ok: false, code: "ALL_ROUTES_FAILED", attempted: [{ providerId: "groq", error: "MODEL_NOT_FOUND", raw: "must be discarded" }] }, 1, 502);
  assert.deepStrictEqual({ result: failure.result, httpStatus: failure.httpStatus, routeCode: failure.routeCode, providerErrorCode: failure.providerErrorCode }, { result: "FAIL", httpStatus: 502, routeCode: "ALL_ROUTES_FAILED", providerErrorCode: "MODEL_NOT_FOUND" });
  assert.doesNotMatch(JSON.stringify(failure), /must be discarded/);
  console.log("grading Groq pilot live-probe boundary ok");
})().catch(function (error) { console.error(error);process.exit(1); });
