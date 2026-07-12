// W1 item 28 — /sync/push + /sync/pull semantics against a fake D1 binding.
// Pins: key regex rejection, first-push insert, baseRev accept, stale return
// with current doc, legacy `rev` back-compat, force overwrite, corrupt-row
// handling, and the lost-race re-read path.

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

async function loadWorker() {
  const src = fs.readFileSync(path.join(__dirname, "..", "worker.js"), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(src).toString("base64");
  return import(url);
}

function fakeSync() {
  const rows = new Map(); // id -> { doc, updated_at, rev, device_id }
  return {
    _rows: rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.indexOf("SELECT doc") === 0) {
                const r = rows.get(args[0]);
                return r ? { doc: r.doc, updated_at: r.updated_at, rev: r.rev } : null;
              }
              if (sql.indexOf("SELECT rev") === 0) {
                const r = rows.get(args[0]);
                return r ? { rev: r.rev } : null;
              }
              throw new Error("unexpected first(): " + sql);
            },
            async run() {
              if (sql.indexOf("UPDATE docs") === 0) {
                const [doc, updated_at, device_id, id, baseRev] = args;
                const r = rows.get(id);
                if (r && r.rev === baseRev) {
                  rows.set(id, { doc, updated_at, rev: r.rev + 1, device_id });
                  return { meta: { changes: 1 } };
                }
                return { meta: { changes: 0 } };
              }
              if (sql.indexOf("ON CONFLICT") >= 0) {
                const [id, doc, updated_at, rev, device_id] = args;
                rows.set(id, { doc, updated_at, rev, device_id });
                return { meta: { changes: 1 } };
              }
              if (sql.indexOf("INSERT INTO docs") === 0) {
                const [id, doc, updated_at, rev, device_id] = args;
                if (rows.has(id)) throw new Error("UNIQUE constraint failed: docs.id");
                rows.set(id, { doc, updated_at, rev, device_id });
                return { meta: { changes: 1 } };
              }
              throw new Error("unexpected run(): " + sql);
            },
          };
        },
      };
    },
  };
}

const KEY = "ab12cd34ef56ab12cd34ef56ab12cd34"; // matches /^[a-f0-9]{16,128}$/

async function post(worker, env, pathname, body) {
  const res = await worker.default.fetch(
    new Request("https://relay.test" + pathname, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    env
  );
  return { status: res.status, j: await res.json() };
}

(async function main() {
  const worker = await loadWorker();
  const SYNC = fakeSync();
  const env = { SYNC };

  // Key regex rejection (push + pull).
  let r = await post(worker, env, "/sync/push", { key: "not-a-key!", doc: { items: [] } });
  assert.strictEqual(r.status, 400);
  r = await post(worker, env, "/sync/pull", { key: "short" });
  assert.strictEqual(r.status, 400);

  // Missing doc rejected.
  r = await post(worker, env, "/sync/push", { key: KEY });
  assert.strictEqual(r.status, 400);

  // Pull unknown key: ok with empty doc, rev 0.
  r = await post(worker, env, "/sync/pull", { key: KEY });
  assert.deepStrictEqual([r.status, r.j.ok, r.j.doc, r.j.rev], [200, true, null, 0]);

  // First push (no existing row): INSERT at rev 1.
  r = await post(worker, env, "/sync/push", { key: KEY, doc: { items: [{ id: "a" }] }, baseRev: 0, deviceId: "mac" });
  assert.deepStrictEqual([r.j.ok, r.j.rev], [true, 1]);

  // Matching baseRev: accepted, rev increments deterministically.
  r = await post(worker, env, "/sync/push", { key: KEY, doc: { items: [{ id: "a" }, { id: "b" }] }, baseRev: 1, deviceId: "mac" });
  assert.deepStrictEqual([r.j.ok, r.j.rev], [true, 2]);

  // Stale baseRev: NOT ok, stale:true, current doc + rev handed back.
  r = await post(worker, env, "/sync/push", { key: KEY, doc: { items: [{ id: "phone-only" }] }, baseRev: 1, deviceId: "phone" });
  assert.strictEqual(r.j.ok, false);
  assert.strictEqual(r.j.stale, true);
  assert.strictEqual(r.j.rev, 2);
  assert.deepStrictEqual(r.j.doc.items.map((x) => x.id), ["a", "b"], "stale response carries the current cloud doc");

  // Legacy `rev` field (older app builds) works as baseRev.
  r = await post(worker, env, "/sync/push", { key: KEY, doc: { items: [{ id: "legacy" }] }, rev: 2, deviceId: "old-app" });
  assert.deepStrictEqual([r.j.ok, r.j.rev], [true, 3]);

  // Force: unconditional overwrite, rev = stored + 1.
  r = await post(worker, env, "/sync/push", { key: KEY, doc: { items: [{ id: "forced" }] }, baseRev: 0, force: true, deviceId: "rescue" });
  assert.deepStrictEqual([r.j.ok, r.j.rev], [true, 4]);
  r = await post(worker, env, "/sync/pull", { key: KEY });
  assert.deepStrictEqual(r.j.doc.items.map((x) => x.id), ["forced"]);
  assert.strictEqual(r.j.rev, 4);

  // Corrupt row: pull treats it as empty doc but keeps the rev.
  SYNC._rows.set(KEY, { doc: "{{{not json", updated_at: 1, rev: 9 });
  r = await post(worker, env, "/sync/pull", { key: KEY });
  assert.deepStrictEqual([r.j.ok, r.j.doc, r.j.rev], [true, null, 9]);

  // Stale push against the corrupt row: stale with doc:null (app force-reseeds).
  r = await post(worker, env, "/sync/push", { key: KEY, doc: { items: [] }, baseRev: 1 });
  assert.deepStrictEqual([r.j.stale, r.j.doc], [true, null]);

  // Lost-race path: SELECT sees baseRev match but the conditional UPDATE
  // lands 0 changes (another writer won) → worker re-reads and returns stale.
  const racy = fakeSync();
  racy._rows.set(KEY, { doc: JSON.stringify({ items: [{ id: "winner" }] }), updated_at: 1, rev: 5 });
  const realPrepare = racy.prepare.bind(racy);
  racy.prepare = (sql) => {
    if (sql.indexOf("UPDATE docs") === 0) {
      return { bind: () => ({ run: async () => {
        // Simulate the concurrent writer landing between SELECT and UPDATE.
        racy._rows.set(KEY, { doc: JSON.stringify({ items: [{ id: "winner" }] }), updated_at: 2, rev: 6 });
        return { meta: { changes: 0 } };
      } }) };
    }
    return realPrepare(sql);
  };
  r = await post(worker, { SYNC: racy }, "/sync/push", { key: KEY, doc: { items: [{ id: "loser" }] }, baseRev: 5 });
  assert.strictEqual(r.j.stale, true, "lost race returns stale");
  assert.strictEqual(r.j.rev, 6, "stale response carries the winner's rev");

  // No SYNC binding: structured 500.
  r = await post(worker, {}, "/sync/push", { key: KEY, doc: { items: [] } });
  assert.strictEqual(r.status, 500);

  // Token-locked relay: sync routes are protected.
  r = await post(worker, { SYNC, KEVINOS_TOKEN: "secret" }, "/sync/pull", { key: KEY });
  assert.strictEqual(r.status, 401, "sync routes require the relay token when set");

  // ── W4.15: v2 sync keys accepted alongside v1 ──────────────────────────
  const V2KEY = "v2:" + "ab12cd34".repeat(8); // v2: + 64 hex
  r = await post(worker, env, "/sync/push", { key: V2KEY, doc: { items: [{ id: "v2item" }] }, baseRev: 0, deviceId: "phone" });
  assert.deepStrictEqual([r.j.ok, r.j.rev], [true, 1], "v2-prefixed key accepted for push");
  r = await post(worker, env, "/sync/pull", { key: V2KEY });
  assert.deepStrictEqual(r.j.doc.items.map((x) => x.id), ["v2item"], "v2 key pulls its own row");
  r = await post(worker, env, "/sync/pull", { key: "v3:" + "ab12cd34".repeat(8) });
  assert.strictEqual(r.status, 400, "unknown version prefix rejected");
  r = await post(worker, env, "/sync/pull", { key: "v2:NOT-HEX" });
  assert.strictEqual(r.status, 400, "v2 with non-hex body rejected");

  // ── W4.17: AI-route rate limiting via a KV counter ─────────────────────
  function fakeKV(seed) {
    const map = new Map(Object.entries(seed || {}));
    return {
      _map: map,
      async get(k) { return map.has(k) ? map.get(k) : null; },
      async put(k, v) { map.set(k, v); },
    };
  }
  // Under the limit: request passes through to the route (500: no seats configured — not 429).
  let kv = fakeKV();
  r = await post(worker, { PUSH: kv }, "/council", { prompt: "hi" });
  assert.notStrictEqual(r.status, 429, "first call is not rate limited");
  assert.strictEqual([...kv._map.keys()].filter((k) => k.indexOf("rl:") === 0).length, 1, "counter written");

  // At the limit: 429.
  kv = fakeKV();
  const bucketKey = "rl:" + Math.floor(Date.now() / 3600000) + ":";
  // pre-seed by making 3 calls with limit 3, then the 4th trips
  const envRl = { PUSH: kv, AI_RATE_LIMIT_PER_HOUR: "3" };
  for (let i = 0; i < 3; i++) {
    r = await post(worker, envRl, "/council", { prompt: "hi" });
    assert.notStrictEqual(r.status, 429, "call " + (i + 1) + " under the cap");
  }
  r = await post(worker, envRl, "/council", { prompt: "hi" });
  assert.strictEqual(r.status, 429, "4th call in the hour is limited");
  assert.ok([...kv._map.keys()].some((k) => k.indexOf(bucketKey) === 0), "hour-bucketed key");

  // Non-AI routes are never limited.
  r = await post(worker, { SYNC, PUSH: fakeKV({}), AI_RATE_LIMIT_PER_HOUR: "0" }, "/sync/pull", { key: KEY });
  assert.notStrictEqual(r.status, 429);
  // "0" disables the limiter entirely.
  r = await post(worker, { PUSH: fakeKV(), AI_RATE_LIMIT_PER_HOUR: "0" }, "/council", { prompt: "hi" });
  assert.notStrictEqual(r.status, 429, "limit 0 disables");
  // No PUSH binding: fails open.
  r = await post(worker, {}, "/council", { prompt: "hi" });
  assert.notStrictEqual(r.status, 429, "no KV = no limiting");

  console.log("sync push semantics ok");
})().catch((err) => { console.error(err); process.exit(1); });
