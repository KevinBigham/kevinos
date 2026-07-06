const { readFile } = require("node:fs/promises");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, message + " (expected " + expected + ", got " + actual + ")");
}

async function loadWorker() {
  const source = await readFile(path.join(__dirname, "..", "worker.js"), "utf8");
  const href = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  const mod = await import(href);
  return mod.default;
}

async function request(worker, env, opts) {
  const method = opts.method || "POST";
  const headers = {};
  let body;
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    body = opts.body === undefined ? "{}" : opts.body;
  }
  if (opts.token) headers["X-KevinOS-Token"] = opts.token;
  const res = await worker.fetch(new Request("https://relay.test" + opts.path, { method, headers, body }), env);
  let json = null;
  try { json = await res.json(); } catch (e) { /* non-JSON is fine for redirect/html routes not used here */ }
  return { status: res.status, json };
}

(async function main() {
  const worker = await loadWorker();
  const goodToken = "tok_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const wrongToken = "wrong_" + Math.random().toString(36).slice(2);
  const enforcingEnv = { RELAY_TOKEN: goodToken, PROVIDER: "claude" };

  let res = await request(worker, enforcingEnv, { path: "/ai", body: "not-json" });
  assertEqual(res.status, 401, "POST /ai without token should be unauthorized");
  assert(res.json && res.json.error === "unauthorized", "POST /ai without token should return unauthorized JSON");

  res = await request(worker, enforcingEnv, { path: "/council", body: "not-json" });
  assertEqual(res.status, 401, "POST /council without token should be unauthorized");
  assert(res.json && res.json.error === "unauthorized", "POST /council without token should return unauthorized JSON");

  res = await request(worker, enforcingEnv, { path: "/ai", token: wrongToken, body: "not-json" });
  assertEqual(res.status, 401, "POST /ai with wrong token should be unauthorized");
  assert(res.json && res.json.error === "unauthorized", "POST /ai with wrong token should return unauthorized JSON");

  res = await request(worker, enforcingEnv, { path: "/council", token: wrongToken, body: "not-json" });
  assertEqual(res.status, 401, "POST /council with wrong token should be unauthorized");
  assert(res.json && res.json.error === "unauthorized", "POST /council with wrong token should return unauthorized JSON");

  res = await request(worker, enforcingEnv, { path: "/ai", token: goodToken, body: "{}" });
  assertEqual(res.status, 400, "POST /ai with correct token and missing prompt should reach route validation");
  assert(res.json && res.json.error === "Missing prompt", "POST /ai correct token should return route validation JSON");

  res = await request(worker, enforcingEnv, { path: "/", method: "GET" });
  assertEqual(res.status, 200, "GET / should remain public");
  assert(res.json && res.json.ok === true, "GET / should return health JSON");

  res = await request(worker, enforcingEnv, { path: "/github/status", method: "GET" });
  assertEqual(res.status, 200, "GET /github/status should remain public");
  assert(res.json && res.json.connected === false, "GET /github/status should return public status JSON");

  const warnMessages = [];
  const originalWarn = console.warn;
  console.warn = function warnOnce(message) { warnMessages.push(String(message)); };
  try {
    res = await request(worker, {}, { path: "/ai", body: "{}" });
    assertEqual(res.status, 400, "POST /ai without RELAY_TOKEN should fail open to route validation");
    assert(res.json && res.json.error === "Missing prompt", "Fail-open /ai should return route validation JSON");

    res = await request(worker, {}, { path: "/council", body: "{}" });
    assertEqual(res.status, 400, "Second fail-open protected request should reach route validation");
    assert(res.json && res.json.error === "Missing prompt", "Fail-open /council should return route validation JSON");
  } finally {
    console.warn = originalWarn;
  }

  assertEqual(warnMessages.length, 1, "Unset RELAY_TOKEN should warn exactly once");
  assert(/RELAY_TOKEN is not set/.test(warnMessages[0] || ""), "Fail-open warning should name RELAY_TOKEN");

  console.log("route-auth offline tests passed");
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
