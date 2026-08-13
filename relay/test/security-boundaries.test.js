"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

async function loadWorker() {
  const src = fs.readFileSync(path.join(__dirname, "..", "worker.js"), "utf8");
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

function fakeKV() {
  const rows = new Map();
  return {
    rows,
    async get(k) { return rows.has(k) ? rows.get(k) : null; },
    async put(k, v) { rows.set(k, String(v)); },
    async delete(k) { rows.delete(k); },
  };
}

async function post(worker, pathname, declared, body) {
  const headers = { "Content-Type": "application/json" };
  if (declared != null) headers["Content-Length"] = String(declared);
  return worker.default.fetch(new Request("https://relay.test" + pathname, { method: "POST", headers, body: body == null ? "{}" : body }), {});
}

(async function main() {
  const worker = await loadWorker();
  const limits = [
    ["/push/test", 64 * 1024],
    ["/ai", 256 * 1024],
    ["/google/inbox-scan", 512 * 1024],
    ["/sync/push", 4.5 * 1024 * 1024],
    ["/extract", 8 * 1024 * 1024],
  ];
  for (const [route, limit] of limits) {
    let res = await post(worker, route, limit, "{}");
    assert.notStrictEqual(res.status, 413, route + " accepts its documented boundary");
    res = await post(worker, route, limit + 1, "{}");
    assert.strictEqual(res.status, 413, route + " rejects one declared byte over");
    const j = await res.json();
    assert.deepStrictEqual([j.ok, j.code, j.limit], [false, "body_too_large", limit]);
  }
  const actualOver = "x".repeat(64 * 1024 + 1);
  const actualRes = await post(worker, "/push/test", null, actualOver);
  assert.strictEqual(actualRes.status, 413, "actual encoded bytes are checked when Content-Length is absent/untrusted");

  const PUSH = fakeKV();
  const env = { PUSH, GITHUB_CLIENT_ID: "gh-client", GITHUB_CLIENT_SECRET: "gh-secret", GOOGLE_CLIENT_ID: "g-client", GOOGLE_CLIENT_SECRET: "g-secret" };
  let res = await worker.default.fetch(new Request("https://relay.test/github/login?session=session123", { method: "GET" }), env);
  assert.strictEqual(res.status, 302);
  const ghState = new URL(res.headers.get("location")).searchParams.get("state");
  assert.match(ghState, /^[a-f0-9]{48}$/);
  assert.notStrictEqual(ghState, "session123", "GitHub provider state is a cryptographic nonce, not the app session");
  assert.ok(PUSH.rows.has("oauth:github:" + ghState), "server stores the nonce-to-session binding");

  const realFetch = global.fetch;
  global.fetch = async function (url) {
    if (String(url).includes("access_token")) return new Response(JSON.stringify({ access_token: "provider-secret" }), { status: 200, headers: { "Content-Type": "application/json" } });
    if (String(url).includes("api.github.com/user")) return new Response(JSON.stringify({ login: "kevin" }), { status: 200, headers: { "Content-Type": "application/json" } });
    throw new Error("unexpected provider call");
  };
  try {
    res = await worker.default.fetch(new Request("https://relay.test/github/callback?code=abc&state=" + ghState, { method: "GET" }), env);
    assert.strictEqual(res.status, 200);
    assert.ok(!PUSH.rows.has("oauth:github:" + ghState), "OAuth nonce is consumed before token exchange finishes");
    assert.ok(PUSH.rows.has("gh:session123"), "provider token lands under the opaque app session");
    const replay = await worker.default.fetch(new Request("https://relay.test/github/callback?code=abc&state=" + ghState, { method: "GET" }), env);
    assert.match(await replay.text(), /expired or was already used/i, "OAuth callback replay is rejected");
  } finally { global.fetch = realFetch; }

  res = await worker.default.fetch(new Request("https://relay.test/google/login?session=session456", { method: "GET" }), env);
  const googleState = new URL(res.headers.get("location")).searchParams.get("state");
  assert.match(googleState, /^[a-f0-9]{48}$/);
  assert.notStrictEqual(googleState, "session456", "Google provider state is independently random");
  assert.notStrictEqual(googleState, ghState);

  global.fetch = async function () {
    return new Response(JSON.stringify({ error: { message: "upstream leaked secret sk-test-123" } }), { status: 500, headers: { "Content-Type": "application/json" } });
  };
  try {
    res = await worker.default.fetch(new Request("https://relay.test/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: "hello" }) }), { PROVIDER: "gemini", GEMINI_API_KEY: "server-secret", AI_ENABLED_PROVIDERS: "gemini", AI_FREE_VERIFIED_MODELS: "gemini:gemini-flash-latest", PUSH: { async get() { return null; }, async put() {} } });
    assert.strictEqual(res.status, 502);
    const safe = await res.json();
    assert.strictEqual(safe.error, "AI request failed.");
    assert.doesNotMatch(JSON.stringify(safe), /sk-test|upstream leaked|server-secret/, "provider failures do not expose internals");
  } finally { global.fetch = realFetch; }

  let ssrfCalls = 0;
  global.fetch = async function () { ssrfCalls++;throw new Error("must not fetch"); };
  try {
    res = await worker.default.fetch(new Request("https://relay.test/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: "http://127.0.0.1/latest/meta-data" }) }), { GEMINI_API_KEY: "configured" });
    const blocked = await res.json();
    assert.match(blocked.error, /public http/i);
    assert.strictEqual(ssrfCalls, 0, "private-network link targets are rejected before fetch");
  } finally { global.fetch = realFetch; }

  console.log("relay security boundaries ok");
})().catch((err) => { console.error(err); process.exit(1); });
