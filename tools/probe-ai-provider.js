"use strict";

const http = require("http");

const PROVIDER_FIXTURES = Object.freeze({
  groq: "code-review-public",
  mistral: "code-review-public",
  gemini: "capsule-public",
  cloudflare: "commitments-public",
  cohere: "code-review-public",
  openrouter: "provider-probe-public",
  sambanova: "provider-probe-public",
  nvidia: "provider-probe-public",
});

function usage() {
  return "Usage: node tools/probe-ai-provider.js --redacted --provider <id> [--relay http://127.0.0.1:8787]\n" +
    "Provider ids: " + Object.keys(PROVIDER_FIXTURES).join(", ") + "\n" +
    "The probe accepts no credential arguments and contacts only a loopback relay.";
}

function parseArgs(argv) {
  if (argv.length === 1 && argv[0] === "--self-test") return { selfTest: true };
  const out = { redacted: false, provider: "", relay: "http://127.0.0.1:8787" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--redacted") out.redacted = true;
    else if (arg === "--provider" && argv[i + 1]) out.provider = argv[++i];
    else if (arg === "--relay" && argv[i + 1]) out.relay = argv[++i];
    else throw new Error("Unsupported argument. Credential values are never accepted.\n" + usage());
  }
  if (!out.redacted || !PROVIDER_FIXTURES[out.provider]) throw new Error(usage());
  const url = new URL(out.relay);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
    throw new Error("The initial provider probe is restricted to a loopback relay.");
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  out.relay = url.toString().replace(/\/$/, "");
  return out;
}

function safeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function safeText(value, max) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function redactedReceipt(provider, response, data) {
  const rows = Array.isArray(data && data.scorecards) ? data.scorecards : [];
  const row = rows[0] || {};
  const usage = row.usage || {}, rate = row.rateLimit || {};
  const passed = response.ok && data && data.syntheticOnly === true && data.responseContentStored === false &&
    data.strictProvider === true && row.ok === true && row.providerId === provider && row.schema === "PASS";
  return {
    provider,
    result: passed ? "PASS" : "FAIL",
    relayHttpCategory: response.ok ? "2XX" : "NON_2XX",
    providerResultCategory: row.ok === true ? "OK" : safeText(row.errorCode, 80) || "NOT_RUN",
    exactModel: safeText(row.modelId, 160),
    schema: safeText(row.schema, 40) || "NOT_RUN",
    privacy: safeText(row.privacy, 40) || "NOT_RUN",
    businessRules: safeText(row.businessRules, 40) || "NOT_RUN",
    latencyMs: row.latencyMs === null ? null : safeNumber(row.latencyMs),
    usage: {
      inputTokens: safeNumber(usage.inputTokens),
      outputTokens: safeNumber(usage.outputTokens),
      totalTokens: safeNumber(usage.totalTokens),
      neurons: safeNumber(usage.neurons),
    },
    rateLimit: {
      requestLimit: safeText(rate.requestLimit, 80),
      requestRemaining: safeText(rate.requestRemaining, 80),
      requestReset: safeText(rate.requestReset, 80),
      tokenLimit: safeText(rate.tokenLimit, 80),
      tokenRemaining: safeText(rate.tokenRemaining, 80),
      tokenReset: safeText(rate.tokenReset, 80),
      retryAfter: safeText(rate.retryAfter, 80),
    },
    freeEligibility: "RUNTIME_ALLOWLIST; ACCOUNT_CONFIRMATION_REQUIRED",
    responseContentStored: false,
    measuredAt: safeText(row.measuredAt, 40),
  };
}

async function probe(options, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  let response;
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["X-KevinOS-Token"] = token;
    response = await fetch(options.relay + "/ai/evaluate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        synthetic: true,
        fixtureId: PROVIDER_FIXTURES[options.provider],
        providerIds: [options.provider],
        strictProvider: true,
      }),
      signal: controller.signal,
    });
    let data = null;
    try { data = await response.json(); } catch (_) {}
    return redactedReceipt(options.provider, response, data);
  } finally {
    clearTimeout(timer);
  }
}

async function selfTest() {
  let observed = null;
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      observed = { path: req.url, token: req.headers["x-kevinos-token"], body: JSON.parse(body) };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, syntheticOnly: true, responseContentStored: false, strictProvider: true, scorecards: [{ providerId: "openrouter", modelId: "synthetic/model", ok: true, schema: "PASS", privacy: "PASS", businessRules: "PROPOSAL_ONLY", latencyMs: 17, usage: { inputTokens: 3, outputTokens: 4, totalTokens: 7, neurons: 0 }, rateLimit: { requestRemaining: "9" }, measuredAt: "2026-08-13T00:00:00.000Z" }] }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    const options = parseArgs(["--redacted", "--provider", "openrouter", "--relay", "http://127.0.0.1:" + address.port]);
    const receipt = await probe(options, "dummy-relay-token");
    if (!observed || observed.path !== "/ai/evaluate" || observed.token !== "dummy-relay-token") throw new Error("self-test request boundary failed");
    if (observed.body.strictProvider !== true || observed.body.providerIds.join(",") !== "openrouter" || observed.body.fixtureId !== "provider-probe-public") throw new Error("self-test strict probe contract failed");
    const rendered = JSON.stringify(receipt);
    if (receipt.result !== "PASS" || rendered.includes("dummy-relay-token")) throw new Error("self-test redaction failed");
    console.log("provider probe self-test ok — loopback-only, strict single-provider, synthetic, content-free, and redacted");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.selfTest) return selfTest();
  const receipt = await probe(options, process.env.KEVINOS_TOKEN || "");
  console.log("KevinOS provider probe — REDACTED");
  console.log(JSON.stringify(receipt, null, 2));
  if (receipt.result !== "PASS") process.exitCode = 1;
}

main().catch((error) => {
  console.error("Provider probe failed without emitting response content or credentials: " + safeText(error && error.name, 60));
  process.exit(1);
});
