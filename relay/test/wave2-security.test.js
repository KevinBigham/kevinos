const { readFile } = require("node:fs/promises");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, message + " (expected " + expected + ", got " + actual + ")");
}

function assertMatch(value, pattern, message) {
  assert(pattern.test(String(value || "")), message + " (got " + value + ")");
}

function jsonResponse(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ "Content-Type": "application/json" }, headers || {}),
  });
}

async function workerSource() {
  return readFile(path.join(__dirname, "..", "worker.js"), "utf8");
}

async function indexSource() {
  return readFile(path.join(__dirname, "..", "..", "index.html"), "utf8");
}

async function loadWorker() {
  const source = await workerSource();
  const href = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  const mod = await import(href);
  return mod.default;
}

function parseRoutePolicies(source) {
  const match = source.match(/const ROUTES = \{([\s\S]*?)\n\};/);
  assert(match, "worker.js should define a centralized ROUTES table");
  const routes = {};
  const re = /"((?:GET|POST) [^"]+)"\s*:\s*\{\s*class:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(match[1]))) routes[m[1]] = m[2];
  return routes;
}

function parseDispatchedRoutes(source) {
  const routes = [];
  const re = /request\.method\s*===\s*"([^"]+)"\s*&&\s*url\.pathname\s*===\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(source))) routes.push(m[1] + " " + m[2]);
  return routes;
}

async function testRoutePolicyCompleteness() {
  const source = await workerSource();
  const policies = parseRoutePolicies(source);
  const dispatched = parseDispatchedRoutes(source);
  assert(dispatched.length > 20, "static scan should find explicit HTTP dispatch routes");
  for (const key of dispatched) assert(policies[key], key + " is dispatched without a ROUTES policy entry");
  for (const key of Object.keys(policies)) {
    assert(/^(public|owner|session)$/.test(policies[key]), key + " has an invalid policy class");
  }

  [
    "GET /",
    "GET /push/key",
    "GET /github/login",
    "GET /github/callback",
    "GET /github/status",
    "GET /google/login",
    "GET /google/callback",
    "GET /google/status",
  ].forEach((key) => assertEqual(policies[key], "public", key + " should be public"));

  [
    "POST /ai",
    "POST /council",
    "POST /summarize",
    "POST /brief",
    "POST /weekly",
    "POST /launch",
    "POST /calendar/parse",
  ].forEach((key) => assert(policies[key] && policies[key] !== "public", key + " should not be public"));

  [
    "POST /github/graphql",
    "POST /google/threads",
    "POST /google/send",
    "POST /calendar/create",
  ].forEach((key) => assertEqual(policies[key], "session", key + " should be a session route"));
}

async function relayRequest(worker, env, opts) {
  const method = opts.method || "POST";
  const headers = Object.assign({}, opts.headers || {});
  let body = opts.body;
  if (method !== "GET" && body === undefined) body = "{}";
  if (method !== "GET" && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (opts.token) headers["X-KevinOS-Token"] = opts.token;
  return worker.fetch(new Request("https://relay.test" + opts.path, { method, headers, body }), env);
}

async function readJson(res) {
  try { return await res.json(); } catch (e) { return null; }
}

class MockKV {
  constructor(seed) {
    this.map = new Map(Object.entries(seed || {}));
    this.puts = [];
    this.deletes = [];
  }
  async get(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  async put(key, value, opts) {
    this.map.set(key, value);
    this.puts.push({ key, value, opts: opts || {} });
  }
  async delete(key) {
    this.map.delete(key);
    this.deletes.push(key);
  }
}

function stateFromRedirect(res) {
  const location = res.headers.get("Location") || "";
  assert(location, "OAuth login should redirect");
  return new URL(location).searchParams.get("state") || "";
}

async function testOAuthStateLifecycle() {
  const worker = await loadWorker();
  const kv = new MockKV();
  const env = {
    RELAY_TOKEN: "owner-token",
    PUSH: kv,
    GITHUB_CLIENT_ID: "gh-client",
    GITHUB_CLIENT_SECRET: "gh-secret",
    GOOGLE_CLIENT_ID: "google-client",
    GOOGLE_CLIENT_SECRET: "google-secret",
  };

  let res = await relayRequest(worker, env, { method: "GET", path: "/github/login?session=app-session" });
  assertEqual(res.status, 302, "GitHub login should redirect");
  const ghState = stateFromRedirect(res);
  assert(ghState && ghState !== "app-session", "GitHub redirect state should be server-issued, not the app session");
  const ghStatePut = kv.puts.find((p) => p.key === "oauth:state:" + ghState);
  assert(ghStatePut, "GitHub login should store an OAuth state record");
  assertEqual(ghStatePut.opts.expirationTtl, 600, "GitHub OAuth state should have a 10-minute TTL");
  const ghStateRec = JSON.parse(ghStatePut.value);
  assertEqual(ghStateRec.provider, "github", "GitHub OAuth state should record provider");
  assertEqual(ghStateRec.session, "app-session", "GitHub OAuth state should record app session");

  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async function mockFetch(url) {
    fetchCalls++;
    const u = String(url);
    if (u.indexOf("github.com/login/oauth/access_token") !== -1) return jsonResponse({ access_token: "gh-test-token" });
    if (u.indexOf("api.github.com/user") !== -1) return jsonResponse({ login: "kevin-test" });
    throw new Error("unexpected fetch: " + u);
  };
  try {
    res = await relayRequest(worker, env, { method: "GET", path: "/github/callback?code=ok&state=missing" });
    assertEqual(res.status, 200, "Unknown GitHub state should return an HTML response");
    assertEqual(fetchCalls, 0, "Unknown GitHub state should reject before provider fetch");

    const wrongGithubState = "wrong-provider-for-github";
    await kv.put("oauth:state:" + wrongGithubState, JSON.stringify({ provider: "google", session: "app-session", createdAt: Date.now(), expiresAt: Date.now() + 600000 }), { expirationTtl: 600 });
    res = await relayRequest(worker, env, { method: "GET", path: "/github/callback?code=ok&state=" + encodeURIComponent(wrongGithubState) });
    assertEqual(res.status, 200, "Wrong-provider GitHub state should return an HTML response");
    assertEqual(fetchCalls, 0, "Wrong-provider GitHub state should reject before provider fetch");
    assert(!kv.map.has("oauth:state:" + wrongGithubState), "Wrong-provider GitHub state should still be consumed");

    res = await relayRequest(worker, env, { method: "GET", path: "/github/callback?code=ok&state=" + encodeURIComponent(ghState) });
    assertEqual(res.status, 200, "Valid GitHub callback should return an HTML response");
    assert(kv.deletes.includes("oauth:state:" + ghState), "Valid GitHub callback should consume state");
    assert(kv.map.has("gh:app-session"), "GitHub token should be stored under existing gh:<session> shape");
    const ghTokenRec = JSON.parse(kv.map.get("gh:app-session"));
    assertEqual(ghTokenRec.token, "gh-test-token", "GitHub token record should keep token field");

    const callsAfterValid = fetchCalls;
    res = await relayRequest(worker, env, { method: "GET", path: "/github/callback?code=ok&state=" + encodeURIComponent(ghState) });
    assertEqual(res.status, 200, "Replayed GitHub callback should return an HTML response");
    assertEqual(fetchCalls, callsAfterValid, "Replayed GitHub callback should reject before provider fetch");
  } finally {
    globalThis.fetch = originalFetch;
  }

  res = await relayRequest(worker, env, { method: "GET", path: "/google/login?session=app-session" });
  assertEqual(res.status, 302, "Google login should redirect");
  const googleState = stateFromRedirect(res);
  assert(googleState && googleState !== "app-session", "Google redirect state should be server-issued, not the app session");
  const googleStatePut = kv.puts.find((p) => p.key === "oauth:state:" + googleState);
  assert(googleStatePut, "Google login should store an OAuth state record");
  assertEqual(googleStatePut.opts.expirationTtl, 600, "Google OAuth state should have a 10-minute TTL");
  const googleStateRec = JSON.parse(googleStatePut.value);
  assertEqual(googleStateRec.provider, "google", "Google OAuth state should record provider");
  assertEqual(googleStateRec.session, "app-session", "Google OAuth state should record app session");

  fetchCalls = 0;
  globalThis.fetch = async function mockFetch(url) {
    fetchCalls++;
    const u = String(url);
    if (u.indexOf("oauth2.googleapis.com/token") !== -1) return jsonResponse({ access_token: "google-test-token", refresh_token: "google-refresh", expires_in: 3600 });
    if (u.indexOf("www.googleapis.com/oauth2/v2/userinfo") !== -1) return jsonResponse({ email: "kevin@example.test" });
    throw new Error("unexpected fetch: " + u);
  };
  try {
    res = await relayRequest(worker, env, { method: "GET", path: "/google/callback?code=ok&state=missing" });
    assertEqual(res.status, 200, "Unknown Google state should return an HTML response");
    assertEqual(fetchCalls, 0, "Unknown Google state should reject before provider fetch");

    const wrongGoogleState = "wrong-provider-for-google";
    await kv.put("oauth:state:" + wrongGoogleState, JSON.stringify({ provider: "github", session: "app-session", createdAt: Date.now(), expiresAt: Date.now() + 600000 }), { expirationTtl: 600 });
    res = await relayRequest(worker, env, { method: "GET", path: "/google/callback?code=ok&state=" + encodeURIComponent(wrongGoogleState) });
    assertEqual(res.status, 200, "Wrong-provider Google state should return an HTML response");
    assertEqual(fetchCalls, 0, "Wrong-provider Google state should reject before provider fetch");
    assert(!kv.map.has("oauth:state:" + wrongGoogleState), "Wrong-provider Google state should still be consumed");

    res = await relayRequest(worker, env, { method: "GET", path: "/google/callback?code=ok&state=" + encodeURIComponent(googleState) });
    assertEqual(res.status, 200, "Valid Google callback should return an HTML response");
    assert(kv.deletes.includes("oauth:state:" + googleState), "Valid Google callback should consume state");
    assert(kv.map.has("gml:app-session"), "Google accounts should stay under the existing gml:<session> shape");
    const googleRec = JSON.parse(kv.map.get("gml:app-session"));
    assertEqual(googleRec.accounts[0].email, "kevin@example.test", "Google account record should keep account email");

    const callsAfterValid = fetchCalls;
    res = await relayRequest(worker, env, { method: "GET", path: "/google/callback?code=ok&state=" + encodeURIComponent(googleState) });
    assertEqual(res.status, 200, "Replayed Google callback should return an HTML response");
    assertEqual(fetchCalls, callsAfterValid, "Replayed Google callback should reject before provider fetch");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testSummarizeSafety() {
  const worker = await loadWorker();
  const source = await workerSource();
  assert(/async function resolveHostnameForSafety\(/.test(source), "worker.js should expose a mockable hostname resolver seam");
  assert(/async function assertSafeResolvedHost\(/.test(source), "worker.js should validate resolved summarize hosts through one safety seam");
  const env = { RELAY_TOKEN: "owner-token", GEMINI_API_KEY: "gemini-key" };
  function envWithResolver(records) {
    return {
      RELAY_TOKEN: "owner-token",
      GEMINI_API_KEY: "gemini-key",
      SUMMARIZE_DNS_RESOLVER: async function resolve(hostname) {
        if (!Object.prototype.hasOwnProperty.call(records, hostname)) throw new Error("dns failed");
        const value = records[hostname];
        if (value instanceof Error) throw value;
        return value;
      },
    };
  }
  const blockedTargets = [
    "http://127.0.0.1/",
    "http://localhost/",
    "http://192.168.1.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
    "http://[fe80::1]/",
    "http://[fd00::1]/",
    "http://[::ffff:127.0.0.1]/",
  ];
  const originalFetch = globalThis.fetch;
  for (const target of blockedTargets) {
    let calls = 0;
    globalThis.fetch = async function mockFetch() { calls++; throw new Error("blocked targets should not fetch"); };
    try {
      const res = await relayRequest(worker, env, { path: "/summarize", token: "owner-token", body: JSON.stringify({ url: target }) });
      const data = await readJson(res);
      assertEqual(res.status, 200, "Blocked summarize target should use calm JSON response");
      assert(data && data.ok === false, "Blocked summarize target should return ok:false");
      assertEqual(calls, 0, "Blocked summarize target should reject before fetch: " + target);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  const blockedResolvedTargets = [
    { host: "ten-private.example", answers: ["10.0.0.7"] },
    { host: "loopback-name.example", answers: ["127.0.0.1"] },
    { host: "metadata-name.example", answers: ["169.254.169.254"] },
    { host: "172-private.example", answers: ["172.16.0.5"] },
    { host: "lan-name.example", answers: ["192.168.1.5"] },
    { host: "ipv6-loopback.example", answers: ["::1"] },
    { host: "ipv6-ula.example", answers: ["fc00::1"] },
    { host: "ipv6-linklocal.example", answers: ["fe80::1"] },
    { host: "mapped-loopback.example", answers: ["::ffff:127.0.0.1"] },
    { host: "ipv4-compatible.example", answers: ["::93.184.216.34"] },
    { host: "mixed-answer.example", answers: ["93.184.216.34", "10.0.0.7"] },
  ];
  for (const item of blockedResolvedTargets) {
    let calls = 0;
    const resolvedEnv = envWithResolver({ [item.host]: item.answers });
    globalThis.fetch = async function mockFetch() { calls++; throw new Error("unsafe resolved hosts should not fetch"); };
    try {
      const res = await relayRequest(worker, resolvedEnv, { path: "/summarize", token: "owner-token", body: JSON.stringify({ url: "https://" + item.host + "/page" }) });
      const data = await readJson(res);
      assertEqual(res.status, 200, "Blocked resolved summarize target should use calm JSON response");
      assert(data && data.ok === false, "Blocked resolved summarize target should return ok:false");
      assertEqual(calls, 0, "Unsafe resolved host should reject before fetch: " + item.host);
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  let dnsFailCalls = 0;
  globalThis.fetch = async function mockFetch() { dnsFailCalls++; throw new Error("dns failures should not fetch"); };
  try {
    const res = await relayRequest(worker, envWithResolver({ "dns-fail.example": new Error("lookup failed") }), { path: "/summarize", token: "owner-token", body: JSON.stringify({ url: "https://dns-fail.example/page" }) });
    const data = await readJson(res);
    assert(data && data.ok === false, "DNS lookup failure should fail closed");
    assertEqual(dnsFailCalls, 0, "DNS lookup failure should reject before fetch");
  } finally {
    globalThis.fetch = originalFetch;
  }

  let unresolvedCalls = 0;
  globalThis.fetch = async function mockFetch() { unresolvedCalls++; throw new Error("unresolved hostnames should not fetch without a resolver"); };
  try {
    const res = await relayRequest(worker, env, { path: "/summarize", token: "owner-token", body: JSON.stringify({ url: "https://arbitrary-host.example/page" }) });
    const data = await readJson(res);
    assert(data && data.ok === false, "Arbitrary hostname without resolver should fail closed");
    assertEqual(unresolvedCalls, 0, "Arbitrary hostname without resolver should reject before fetch");
  } finally {
    globalThis.fetch = originalFetch;
  }

  let calls = [];
  globalThis.fetch = async function mockFetch(url) {
    calls.push(String(url));
    return new Response(null, { status: 302, headers: { Location: "http://127.0.0.1/private" } });
  };
  try {
    const res = await relayRequest(worker, envWithResolver({ "safe.example": ["93.184.216.34"] }), { path: "/summarize", token: "owner-token", body: JSON.stringify({ url: "https://safe.example/start" }) });
    const data = await readJson(res);
    assert(data && data.ok === false, "Summarize should reject redirects to blocked targets");
    assertEqual(calls.length, 1, "Redirect-to-local should stop before fetching redirected target");
  } finally {
    globalThis.fetch = originalFetch;
  }

  calls = [];
  globalThis.fetch = async function mockFetch(url) {
    calls.push(String(url));
    return new Response(null, { status: 302, headers: { Location: "https://redirect-private.example/private" } });
  };
  try {
    const res = await relayRequest(worker, envWithResolver({ "safe.example": ["93.184.216.34"], "redirect-private.example": ["10.0.0.7"] }), { path: "/summarize", token: "owner-token", body: JSON.stringify({ url: "https://safe.example/start" }) });
    const data = await readJson(res);
    assert(data && data.ok === false, "Summarize should reject redirects to hostnames that resolve unsafe");
    assertEqual(calls.length, 1, "Redirect-to-private-resolved should stop before fetching redirected target");
  } finally {
    globalThis.fetch = originalFetch;
  }

  calls = [];
  globalThis.fetch = async function mockFetch(url) {
    calls.push(String(url));
    return new Response("<html></html>", { status: 200, headers: { "Content-Type": "text/html", "Content-Length": String(2 * 1024 * 1024) } });
  };
  try {
    const res = await relayRequest(worker, envWithResolver({ "safe.example": ["93.184.216.34", "2606:2800:220:1:248:1893:25c8:1946"] }), { path: "/summarize", token: "owner-token", body: JSON.stringify({ url: "https://safe.example/large" }) });
    const data = await readJson(res);
    assert(data && data.ok === false, "Summarize should reject oversized Content-Length");
    assertEqual(calls.length, 1, "Oversized Content-Length should not call the model");
  } finally {
    globalThis.fetch = originalFetch;
  }

  let cancelled = false;
  const bigStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(1024 * 1024));
      controller.enqueue(new Uint8Array(700 * 1024));
    },
    cancel() { cancelled = true; },
  });
  calls = [];
  globalThis.fetch = async function mockFetch(url) {
    calls.push(String(url));
    return new Response(bigStream, { status: 200, headers: { "Content-Type": "text/html" } });
  };
  try {
    const res = await relayRequest(worker, envWithResolver({ "safe.example": ["93.184.216.34"] }), { path: "/summarize", token: "owner-token", body: JSON.stringify({ url: "https://safe.example/stream" }) });
    const data = await readJson(res);
    assert(data && data.ok === false, "Summarize should stop reading streams over the cap");
    assert(cancelled, "Oversized stream should be cancelled");
    assertEqual(calls.length, 1, "Oversized stream should not call the model");
  } finally {
    globalThis.fetch = originalFetch;
  }

  calls = [];
  globalThis.fetch = async function mockFetch(url) {
    calls.push(String(url));
    return new Response("plain text", { status: 200, headers: { "Content-Type": "text/plain" } });
  };
  try {
    const res = await relayRequest(worker, envWithResolver({ "public-only.example": ["93.184.216.34", "2606:2800:220:1:248:1893:25c8:1946"] }), { path: "/summarize", token: "owner-token", body: JSON.stringify({ url: "https://public-only.example/page" }) });
    const data = await readJson(res);
    assert(data && data.ok === false, "Public-only resolved hostname should proceed to content-type protections");
    assertEqual(calls.length, 1, "Public-only resolved hostname should be fetched once");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testClientSecureIdStaticChecks() {
  const source = await indexSource();
  assert(/function secureId\(\)/.test(source), "index.html should define secureId()");
  assert(/var sid=secureId\(\);[\s\S]{0,200}state\.github\.session=sid/.test(source), "GitHub OAuth session should use secureId()");
  assert(/window\.open\(base\+"\/github\/login\?session="\+encodeURIComponent\(sid\)/.test(source), "GitHub OAuth start should pass the secure session to the relay");
  assert(/if\(!e\.session\)e\.session=secureId\(\);/.test(source), "Google/email session should use secureId()");
  assert(/if\(!state\.email\.session\)state\.email\.session=secureId\(\);/.test(source), "Calendar Google session bootstrap should use secureId()");
  assert(/function syncDeviceId\(\)\{var s=syncCfg\(\);if\(!s\.deviceId\)s\.deviceId=secureId\(\);return s\.deviceId;\}/.test(source), "syncDeviceId() should use secureId()");
  assert(/state\.items\.unshift\(\{id:uid\(\)/.test(source), "Task content IDs should continue using uid()");
  assert(/state\.notes\.unshift\(\{id:id/.test(source) && /var id=uid\(\);[\s\S]{0,160}state\.notes\.unshift/.test(source), "Note content IDs should continue using uid()");
  assert(/state\.events\.(push|unshift)\(\{id:uid\(\)/.test(source), "Event content IDs should continue using uid()");
}

(async function main() {
  await testRoutePolicyCompleteness();
  console.log("wave2 route policy checks passed");
  await testOAuthStateLifecycle();
  console.log("wave2 oauth state checks passed");
  await testSummarizeSafety();
  console.log("wave2 summarize safety checks passed");
  await testClientSecureIdStaticChecks();
  console.log("wave2 client secure-id checks passed");
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
