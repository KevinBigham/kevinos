const assert = require("assert");
const fs = require("fs");
const path = require("path");

async function loadWorker() {
  const src = fs.readFileSync(path.join(__dirname, "..", "worker.js"), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(src).toString("base64");
  return import(url);
}

async function request(worker, pathname, opts) {
  const init = Object.assign({ method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }, opts || {});
  return worker.default.fetch(new Request("https://relay.test" + pathname, init), { KEVINOS_TOKEN: "secret" });
}

(async function main() {
  const worker = await loadWorker();

  let res = await worker.default.fetch(new Request("https://relay.test/council", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: "hi" }) }), {});
  assert.notStrictEqual(res.status, 401, "existing deployments without token env should not require route auth");

  res = await worker.default.fetch(new Request("https://relay.test/council", { method: "OPTIONS" }), { KEVINOS_TOKEN: "secret" });
  assert.strictEqual(res.status, 200, "preflight should remain public");
  assert.match(res.headers.get("Access-Control-Allow-Headers") || "", /X-KevinOS-Token/i, "CORS should allow the relay token header");

  res = await worker.default.fetch(new Request("https://relay.test/github/status?session=x", { method: "GET" }), { KEVINOS_TOKEN: "secret" });
  assert.notStrictEqual(res.status, 401, "GitHub status polling should stay public");

  res = await worker.default.fetch(new Request("https://relay.test/google/callback?state=x", { method: "GET" }), { KEVINOS_TOKEN: "secret" });
  assert.notStrictEqual(res.status, 401, "Google OAuth callback should stay public");

  res = await request(worker, "/council", { body: JSON.stringify({ prompt: "hi" }) });
  assert.strictEqual(res.status, 401, "protected POST should reject missing token");

  res = await request(worker, "/council", { headers: { "Content-Type": "application/json", "X-KevinOS-Token": "wrong" }, body: JSON.stringify({ prompt: "hi" }) });
  assert.strictEqual(res.status, 401, "protected POST should reject wrong token");

  res = await request(worker, "/council", { headers: { "Content-Type": "application/json", "X-KevinOS-Token": "secret" }, body: JSON.stringify({ prompt: "hi" }) });
  assert.notStrictEqual(res.status, 401, "protected POST should allow correct token");

  res = await worker.default.fetch(new Request("https://relay.test/", { method: "GET" }), { KEVINOS_TOKEN: "secret" });
  assert.strictEqual(res.status, 200, "public health route should stay public");
  let health = await res.json();
  assert.strictEqual(health.auth, true, "health should advertise auth:true when a token is set");

  res = await worker.default.fetch(new Request("https://relay.test/", { method: "GET" }), {});
  health = await res.json();
  assert.strictEqual(health.auth, false, "health should advertise auth:false on an unlocked relay");

  console.log("route auth ok");
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
