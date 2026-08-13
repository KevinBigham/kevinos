"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

async function loadWorker() {
  const src = fs.readFileSync(path.join(__dirname, "..", "worker.js"), "utf8");
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

function requestFixture(extra) {
  return Object.assign({
    requestId: "req-1", feature: "commitment-extract", lane: "FAST_STRUCTURED", requiredCapabilities: ["text", "structured"],
    privacyClass: "SANITIZED", packetFingerprint: "sha256:fixture", promptVersion: "commitment-extract-v1",
    input: "Fictional public email with a Friday promise.", maxOutputTokens: 500, timeoutMs: 5000,
    approvalState: "approved", allowPaid: false, synthetic: false,
    manifest: { approved: true, purpose: "Extract fictional commitments", deidentified: true, redactionCount: 1, records: [{ id: "fixture-1", type: "synthetic-email", fields: ["body"], redactedFields: ["person"] }] }
  }, extra || {});
}

function envFor(ids) {
  const env = { AI_ENABLED_PROVIDERS: ids.join(","), AI_FREE_VERIFIED_MODELS: "" };
  const pairs = [];
  for (const id of ids) {
    const key = id.toUpperCase();
    if (id === "cloudflare") env.AI = { async run() { return { response: JSON.stringify({ proposals: [{ text: "Do the thing" }] }), usage: { input_tokens: 4, output_tokens: 6 } }; } };
    else env[key === "NVIDIA" ? "NVIDIA_API_KEY" : key + "_API_KEY"] = "server-test-secret";
  }
  return env;
}

(async function () {
  const worker = await loadWorker();
  assert.strictEqual(worker.FABRIC_PROVIDER_SPECS.length, 8, "all eight bounded provider adapters are registered");
  assert.deepStrictEqual(worker.FABRIC_PRIVACY, ["PUBLIC", "SANITIZED", "PERSONAL", "WORK_INTERNAL", "YOUTH_SENSITIVE", "FINANCIAL_SENSITIVE", "SECRET"]);
  assert.strictEqual(worker.FABRIC_VERIFIED_AT, "2026-08-13");
  assert.strictEqual(worker.FABRIC_GOLDEN_FIXTURES.length, 9, "synthetic golden set covers Kevin-shaped feature, recovery, and optional-provider health probes");
  assert.strictEqual(worker.fabricPolicyStale(Date.UTC(2026, 7, 13)), false);
  assert.strictEqual(worker.fabricPolicyStale(Date.UTC(2026, 8, 20)), true, "provider policy becomes visibly stale after the bounded refresh window");

  const disabled = worker.redactedFabricDescriptors({});
  assert.ok(disabled.every((d) => d.status === "CREDENTIAL_MISSING" && d.model.priceClass === "UNKNOWN"), "no credential or free claim is invented");
  assert.doesNotMatch(JSON.stringify(disabled), /server-test-secret|secretEnv|GROQ_API_KEY/, "redacted descriptors expose status but no key names or values");

  let calls = 0;
  const realFetch = global.fetch;
  global.fetch = async function () { calls++;throw new Error("transport must not run"); };
  try {
    for (const privacyClass of ["YOUTH_SENSITIVE", "FINANCIAL_SENSITIVE", "SECRET", "WORK_INTERNAL", "PERSONAL"]) {
      const req = requestFixture({ privacyClass });
      const decision = worker.fabricRequestDecision(req);
      assert.strictEqual(decision.allowed, false, privacyClass + " fails before routing");
      const result = await worker.runFabricRequest(req, envFor(["groq"]), {});
      assert.strictEqual(result.ok, false);
    }
    const secret = requestFixture({ input: "api_key=sk-example-not-real" });
    assert.strictEqual(worker.fabricPrivacyDecision(secret).code, "SECRET_PATTERN_BLOCKED");
    assert.strictEqual(calls, 0, "restricted and secret-pattern packets fail before transport");
  } finally { global.fetch = realFetch; }

  const invalidCases = [
    [{ allowPaid: true }, "allowPaid"], [{ approvalState: "draft" }, "approvalState"], [{ packetFingerprint: "" }, "packetFingerprint"],
    [{ manifest: { approved: false, purpose: "x", deidentified: true, records: [{ id: "x", fields: ["body"] }] } }, "MANIFEST_APPROVAL_REQUIRED"],
    [{ privacyClass: "SANITIZED", manifest: { approved: true, purpose: "x", deidentified: false, records: [{ id: "x", fields: ["body"] }] } }, "DEIDENTIFICATION_REQUIRED"]
  ];
  for (const [change, expected] of invalidCases) {
    const d = worker.fabricRequestDecision(requestFixture(change));
    assert.strictEqual(d.allowed, false);
    assert.ok(d.errors.includes(expected) || d.code === expected, expected + " blocks");
  }
  const optionalProbe = worker.fabricFixtureRequest(worker.fabricGoldenFixture("provider-probe-public"), "openrouter");
  assert.strictEqual(worker.fabricRequestDecision(optionalProbe).allowed, true, "named optional-provider probe is synthetic, sanitized, and bounded");
  assert.strictEqual(worker.fabricRequestDecision(Object.assign({}, optionalProbe, { synthetic: false })).errors.includes("syntheticOnly"), true, "provider probe cannot be repurposed for ordinary content");
  optionalProbe.strictProvider = true;
  const optionalPreview = worker.fabricRoutePreview(optionalProbe, Object.assign(envFor(["openrouter", "sambanova"]), { AI_FREE_VERIFIED_MODELS: "openrouter:openrouter/free,sambanova:gpt-oss-120b" }), {});
  assert.strictEqual(optionalPreview.selected, "openrouter", "optional emergency lane is probeable only through its bounded route");
  assert.strictEqual(optionalPreview.candidates.length, 1, "strict synthetic probe cannot spill into another provider");
  const cloudflareProbe = worker.fabricFixtureRequest(worker.fabricGoldenFixture("commitments-public"), "cloudflare");
  cloudflareProbe.strictProvider = true;
  const cloudflarePreview = worker.fabricRoutePreview(cloudflareProbe, Object.assign(envFor(["cloudflare"]), { AI_FREE_VERIFIED_MODELS: "cloudflare:@cf/meta/llama-3.3-70b-instruct-fp8-fast" }), {});
  assert.strictEqual(cloudflareProbe.estimatedNeurons, 250, "synthetic evals carry a conservative deterministic Neuron estimate");
  assert.strictEqual(cloudflarePreview.selected, "cloudflare", "strict Workers AI probes are eligible only after the exact model and Neuron estimate pass");

  const routeEnv = envFor(["groq", "mistral"]);
  routeEnv.AI_FREE_VERIFIED_MODELS = "groq:openai/gpt-oss-20b,mistral:mistral-small-latest";
  let preview = worker.fabricRoutePreview(requestFixture(), routeEnv, {});
  assert.strictEqual(preview.selected, "groq", "fixed lane order selects Groq first");
  assert.strictEqual(preview.candidates[0].eligible, true);
  preview = worker.fabricRoutePreview(requestFixture(), routeEnv, { usage: { groq: 900 } });
  assert.strictEqual(preview.selected, "mistral", "quota exclusion is deterministic and visible");
  assert.ok(preview.candidates[0].reasons.includes("QUOTA_EXHAUSTED"));
  preview = worker.fabricRoutePreview(requestFixture(), routeEnv, { circuits: { groq: "OPEN" } });
  assert.strictEqual(preview.selected, "mistral");
  assert.ok(preview.candidates[0].reasons.includes("CIRCUIT_OPEN"));
  const unknownPrice = Object.assign({}, routeEnv, { AI_FREE_VERIFIED_MODELS: "" });
  assert.strictEqual(worker.fabricRoutePreview(requestFixture(), unknownPrice, {}).selected, null, "unknown pricing blocks every route");

  const rows = new Map(), PUSH = { async get(k) { return rows.has(k) ? rows.get(k) : null; }, async put(k, v) { rows.set(k, String(v)); } };
  await worker.recordFabricOutcome({ PUSH }, { ok: true, provenance: { providerId: "groq" }, usage: {} }, Date.UTC(2026, 7, 13));
  assert.strictEqual(rows.get("aifabric:usage:2026-08-13:groq"), "1", "usage state is a content-free daily counter");
  assert.doesNotMatch(JSON.stringify([...rows]), /Fictional public email|Do the thing/, "quota/circuit storage contains no prompt or response");
  await worker.recordFabricOutcome({ PUSH }, { ok: false, attempted: [{ providerId: "groq", error: "RATE_LIMITED" }] }, Date.UTC(2026, 7, 13));
  let runtime = await worker.loadFabricRuntime({ PUSH }, Date.UTC(2026, 7, 13));
  assert.strictEqual(runtime.circuits.groq, "OPEN", "429 opens the provider circuit");
  runtime = await worker.loadFabricRuntime({ PUSH }, Date.UTC(2026, 7, 13) + 61000);
  assert.strictEqual(runtime.circuits.groq, "HALF_OPEN", "expired circuit allows one conservative probe state");

  assert.deepStrictEqual(worker.classifyFabricError(401), "AUTH_INVALID");
  assert.deepStrictEqual(worker.classifyFabricError(402), "PAYMENT_REQUIRED");
  assert.deepStrictEqual(worker.classifyFabricError(403), "FORBIDDEN");
  assert.deepStrictEqual(worker.classifyFabricError(404), "MODEL_NOT_FOUND");
  assert.deepStrictEqual(worker.classifyFabricError(408), "TIMEOUT");
  assert.deepStrictEqual(worker.classifyFabricError(429), "RATE_LIMITED");
  assert.deepStrictEqual(worker.classifyFabricError(503), "PROVIDER_UNAVAILABLE");
  assert.deepStrictEqual(worker.classifyFabricError(0, new Error("stream interrupted")), "MALFORMED_RESPONSE");
  const headers = new Headers({ "retry-after": "30", "x-ratelimit-remaining-requests": "12", "x-ratelimit-reset-requests": "1m" });
  assert.deepStrictEqual(worker.normalizeRateHeaders(headers).requestRemaining, "12");
  assert.deepStrictEqual(worker.normalizeRateHeaders(headers).retryAfter, "30");

  assert.strictEqual(worker.validateFabricOutput(JSON.stringify({ proposals: [] }), worker.FABRIC_PROMPTS["commitment-extract-v1"]).ok, true);
  assert.strictEqual(worker.validateFabricOutput("not json", worker.FABRIC_PROMPTS["commitment-extract-v1"]).code, "OUTPUT_SCHEMA");
  assert.strictEqual(worker.validateFabricOutput(JSON.stringify({ api_key: "never" }), worker.FABRIC_PROMPTS["commitment-extract-v1"]).code, "FORBIDDEN_OUTPUT_FIELD");
  assert.match(worker.validateFabricOutput(JSON.stringify({ proposal: {} }), worker.FABRIC_PROMPTS["commitment-extract-v1"]).code, /OUTPUT_REQUIRED_FIELD/);
  assert.strictEqual(worker.validateFabricOutput(JSON.stringify({ proposal: { nested: { accessToken: "x" } } }), worker.FABRIC_PROMPTS["resume-capsule-v1"]).code, "FORBIDDEN_OUTPUT_FIELD", "forbidden fields are rejected recursively");
  assert.strictEqual(worker.validateFabricOutput(JSON.stringify({ proposal: "Call test@example.com", redactions: [] }), worker.FABRIC_PROMPTS["public-copy-v1"]).code, "PUBLIC_OUTPUT_REDACTION", "public output blocks direct identifiers");
  assert.strictEqual(worker.validateFabricOutput(JSON.stringify({ proposal: "Public copy", redactions: ["none found"] }), worker.FABRIC_PROMPTS["public-copy-v1"]).ok, true);

  const evalPlan = worker.fabricEvaluationPlan("code-review-public", ["groq", "groq", "mistral", "unknown"]);
  assert.strictEqual(evalPlan.sequential, true);
  assert.deepStrictEqual(evalPlan.requests.map((x) => x.preferredProviderId), ["groq", "mistral"], "synthetic comparison is deduplicated, bounded, and sequential");
  assert.ok(evalPlan.requests.every((x) => x.synthetic && x.manifest.records[0].type === "synthetic-golden"));
  const score = worker.fabricEvalScorecard("code-review-public", { ok: true, provenance: { providerId: "groq", modelId: "m", routeAlias: "groq-current", promptVersion: "studio-second-opinion-v1", packetFingerprint: "golden:x", fallbackChain: [] }, validation: { schema: "PASS", forbiddenData: "PASS", businessRules: "PROPOSAL_ONLY" }, latencyMs: 900, proposal: { proposal: "content must be discarded" } });
  assert.strictEqual(score.latencyBucket, "under-2s");
  assert.strictEqual(score.latencyMs, 900);
  assert.deepStrictEqual(score.usage, { inputTokens: 0, outputTokens: 0, totalTokens: 0, neurons: 0 });
  assert.doesNotMatch(JSON.stringify(score), /content must be discarded/, "scorecards are content-free");
  const failedScore = worker.fabricEvalScorecard("code-review-public", { ok: false, code: "ALL_ROUTES_FAILED", attempted: [{ providerId: "groq", modelId: "openai/gpt-oss-20b", error: "REQUEST_INVALID" }] });
  assert.deepStrictEqual({ provider: failedScore.providerId, model: failedScore.modelId, error: failedScore.errorCode }, { provider: "groq", model: "openai/gpt-oss-20b", error: "REQUEST_INVALID" }, "failed scorecards preserve only safe route diagnostics");
  const strictFormat = worker.fabricResponseFormat(worker.FABRIC_PROMPTS["studio-second-opinion-v1"]);
  assert.strictEqual(strictFormat.type, "json_schema");
  assert.deepStrictEqual(strictFormat.json_schema.schema.required, ["proposal"]);
  assert.strictEqual(strictFormat.json_schema.strict, true);
  const recommendation = worker.fabricRouteRecommendation([score, score, score, score, score], "mistral");
  assert.deepStrictEqual({ status: recommendation.status, proposed: recommendation.proposedProviderId, lkg: recommendation.lastKnownGood, auto: recommendation.autoApplied }, { status: "AWAITING_KEVIN", proposed: "groq", lkg: "mistral", auto: false }, "recommendations preserve approval and rollback boundaries");

  const adapterResponses = {
    gemini: { candidates: [{ content: { parts: [{ text: JSON.stringify({ proposals: [] }) }] } }], usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 3 } },
    cohere: { message: { content: [{ text: JSON.stringify({ proposals: [] }) }] }, usage: { input_tokens: 2, output_tokens: 3 } },
    standard: { model: "actual-returned-model", choices: [{ message: { content: JSON.stringify({ proposals: [] }) } }], usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 } }
  };
  for (const spec of worker.FABRIC_PROVIDER_SPECS) {
    const env = envFor([spec.id]);env.AI_FREE_VERIFIED_MODELS = spec.id + ":" + worker.fabricModel(spec, env);
    if (spec.id !== "cloudflare") {
      global.fetch = async function () { const data = spec.id === "gemini" ? adapterResponses.gemini : spec.id === "cohere" ? adapterResponses.cohere : adapterResponses.standard;return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json", "x-ratelimit-remaining-requests": "9" } }); };
    }
    try {
      const out = await worker.callFabricAdapter(spec, requestFixture(), env);
      assert.ok(worker.fabricText(spec.id, out.data), spec.id + " normalizes text");
      assert.ok(out.actualModel, spec.id + " records exact/selected model");
    } finally { global.fetch = realFetch; }
  }

  const edgeSpec = worker.FABRIC_PROVIDER_SPECS.find((spec) => spec.id === "groq"), edgeEnv = envFor(["groq"]);
  for (const edge of [
    { status: 400, code: "REQUEST_INVALID" }, { status: 401, code: "AUTH_INVALID" }, { status: 403, code: "FORBIDDEN" },
    { status: 404, code: "MODEL_NOT_FOUND" }, { status: 408, code: "TIMEOUT" },
    { status: 429, code: "RATE_LIMITED" }, { status: 503, code: "PROVIDER_UNAVAILABLE" }
  ]) {
    global.fetch = async function () { return new Response(JSON.stringify({ error: "synthetic edge" }), { status: edge.status }); };
    try {
      await assert.rejects(worker.callFabricAdapter(edgeSpec, requestFixture(), edgeEnv), function (err) {
        return worker.classifyFabricError(err.status, err) === edge.code;
      }, "adapter normalizes synthetic HTTP " + edge.status);
    } finally { global.fetch = realFetch; }
  }
  for (const id of ["groq", "mistral"]) {
    const spec = worker.FABRIC_PROVIDER_SPECS.find((item) => item.id === id), env = envFor([id]);let requestBody;
    global.fetch = async function (_url, options) { requestBody = JSON.parse(options.body);return new Response(JSON.stringify(adapterResponses.standard), { status: 200 }); };
    try {
      await worker.callFabricAdapter(spec, Object.assign(requestFixture(), { responseFormat: strictFormat }), env);
      assert.strictEqual(requestBody.response_format.type, "json_schema", id + " receives the strict proposal schema");
      if (id === "groq") {
        assert.strictEqual(requestBody.max_completion_tokens, 500);
        assert.strictEqual(requestBody.reasoning_format, "hidden");
        assert.strictEqual(Object.prototype.hasOwnProperty.call(requestBody, "max_tokens"), false);
      }
    } finally { global.fetch = realFetch; }
  }
  global.fetch = async function () { return new Response("{interrupted", { status: 200 }); };
  try {
    await assert.rejects(worker.callFabricAdapter(edgeSpec, requestFixture(), edgeEnv), function (err) {
      return worker.classifyFabricError(err.status, err) === "MALFORMED_RESPONSE";
    }, "adapter rejects a malformed or interrupted response before output validation");
  } finally { global.fetch = realFetch; }

  let fallbackCalls = [];
  global.fetch = async function (url) {
    fallbackCalls.push(String(url));
    if (String(url).includes("groq.com")) return new Response(JSON.stringify({ error: { message: "limited" } }), { status: 429, headers: { "retry-after": "10" } });
    return new Response(JSON.stringify(adapterResponses.standard), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const result = await worker.runFabricRequest(requestFixture(), routeEnv, {});
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.provenance.providerId, "mistral", "compatible sequential fallback succeeds");
    assert.strictEqual(result.provenance.fallbackChain[0].providerId, "groq");
    assert.strictEqual(fallbackCalls.length, 2, "fallback is sequential and bounded, never fan-out");
  } finally { global.fetch = realFetch; }

  let res = await worker.default.fetch(new Request("https://relay.test/ai/providers", { method: "GET", headers: { "X-KevinOS-Token": "wrong" } }), { KEVINOS_TOKEN: "secret" });
  assert.strictEqual(res.status, 401, "provider status is protected");
  res = await worker.default.fetch(new Request("https://relay.test/ai/providers", { method: "GET", headers: { "X-KevinOS-Token": "secret" } }), { KEVINOS_TOKEN: "secret" });
  const status = await res.json();
  assert.strictEqual(status.allowPaid, false);
  assert.strictEqual(status.providers.length, 8);
  assert.doesNotMatch(JSON.stringify(status), /API_KEY|server-test-secret/);

  res = await worker.default.fetch(new Request("https://relay.test/ai/route", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestFixture({ privacyClass: "YOUTH_SENSITIVE" })) }), routeEnv);
  assert.strictEqual(res.status, 403, "privacy denial is an explicit route response");
  res = await worker.default.fetch(new Request("https://relay.test/ai/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestFixture()) }), routeEnv);
  assert.strictEqual(res.status, 400, "evaluation route accepts synthetic fixtures only");
  res = await worker.default.fetch(new Request("https://relay.test/ai/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ synthetic: true, fixtureId: "missing" }) }), routeEnv);
  assert.strictEqual(res.status, 400, "evaluation route accepts named built-in fixtures only");
  res = await worker.default.fetch(new Request("https://relay.test/ai/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ synthetic: true, fixtureId: "commitments-public", providerIds: ["groq"], strictProvider: true }) }), {});
  const evalResponse = await res.json();
  assert.strictEqual(evalResponse.syntheticOnly, true);
  assert.strictEqual(evalResponse.strictProvider, true);
  assert.strictEqual(evalResponse.responseContentStored, false);
  assert.doesNotMatch(JSON.stringify(evalResponse.scorecards), /publish the approved recap/, "evaluation responses discard fixture and provider content");

  const scaleStarted = Date.now();
  for (let i = 0; i < 500; i++) worker.fabricRoutePreview(requestFixture({ requestId: "scale-" + i }), routeEnv, { usage: { groq: i % 10 }, circuits: {} });
  for (let i = 0; i < 50; i++) worker.fabricEvalScorecard("code-review-public", { ok: true, provenance: { providerId: "groq", modelId: "m", routeAlias: "groq-current", promptVersion: "studio-second-opinion-v1", packetFingerprint: "golden:" + i, fallbackChain: [] }, validation: { schema: "PASS", forbiddenData: "PASS", businessRules: "PROPOSAL_ONLY" }, latencyMs: 500 });
  assert.ok(Date.now() - scaleStarted < 2000, "representative route and scorecard scale remains comfortably interactive");

  console.log("provider-neutral AI fabric contracts ok");
})().catch((err) => { console.error(err); process.exit(1); });
