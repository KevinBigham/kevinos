// W5 item 79 — three-device convergence proof.
// Three REAL app instances (harness) sync through the REAL worker (fake D1)
// using the actual protocol: baseRev push, stale → mergeRemoteDoc → re-push,
// clean pull → applySyncDoc. The math says it converges; this proves it.

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadApp } = require("./harness");

async function loadWorker() {
  const src = fs.readFileSync(path.join(__dirname, "..", "relay", "worker.js"), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(src).toString("base64");
  return import(url);
}

function fakeSync() {
  const rows = new Map();
  return {
    _rows: rows,
    prepare(sql) {
      return { bind(...args) { return {
        async first() {
          const r = rows.get(args[0]);
          if (sql.indexOf("SELECT doc") === 0) return r ? { doc: r.doc, updated_at: r.updated_at, rev: r.rev } : null;
          if (sql.indexOf("SELECT rev") === 0) return r ? { rev: r.rev } : null;
          if (sql.indexOf("SELECT updated_at") === 0) return r ? { updated_at: r.updated_at } : null;
          throw new Error("unexpected first(): " + sql);
        },
        async run() {
          if (sql.indexOf("UPDATE docs") === 0) {
            const [doc, updated_at, device_id, id, baseRev] = args;
            const r = rows.get(id);
            if (r && r.rev === baseRev) { rows.set(id, { doc, updated_at, rev: r.rev + 1, device_id }); return { meta: { changes: 1 } }; }
            return { meta: { changes: 0 } };
          }
          if (sql.indexOf("ON CONFLICT") >= 0) { const [id, doc, updated_at, rev, device_id] = args; rows.set(id, { doc, updated_at, rev, device_id }); return { meta: { changes: 1 } }; }
          if (sql.indexOf("INSERT INTO docs") === 0) {
            const [id, doc, updated_at, rev, device_id] = args;
            if (rows.has(id)) throw new Error("UNIQUE constraint");
            rows.set(id, { doc, updated_at, rev, device_id });
            return { meta: { changes: 1 } };
          }
          throw new Error("unexpected run(): " + sql);
        },
      }; } };
    },
  };
}

const KEY = "v2:" + "ab".repeat(32); // prove convergence under the new key format too

(async function main() {
  const worker = await loadWorker();
  const env = { SYNC: fakeSync() };

  async function call(pathname, body) {
    const res = await worker.default.fetch(
      new Request("https://relay.test" + pathname, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
      env
    );
    return res.json();
  }

  function device(app, name) {
    return {
      app, name, rev: 0,
      // The app's real push protocol: baseRev, stale → merge → re-push.
      async push() {
        for (let attempt = 0; attempt < 4; attempt++) {
          const doc = this.app.buildSyncDoc();
          const j = await call("/sync/push", { key: KEY, doc, baseRev: this.rev, deviceId: this.name });
          if (j.ok) { this.rev = j.rev; return; }
          if (j.stale) { if (j.doc) this.app.mergeRemoteDoc(j.doc); this.rev = j.rev || this.rev; continue; }
          throw new Error(this.name + " push failed: " + JSON.stringify(j));
        }
        throw new Error(this.name + " did not converge in 4 attempts");
      },
      // The app's clean-pull path (no local dirt): authoritative apply.
      async pull() {
        const j = await call("/sync/pull", { key: KEY });
        if (j.doc && (j.rev || 0) > this.rev) { this.app.applySyncDoc(j.doc); this.rev = j.rev; }
      },
      items() { return this.app.getState().items.map((i) => ({ id: i.id, text: i.text, u: i.u || 0 })).sort((a, b) => (a.id < b.id ? -1 : 1)); },
    };
  }

  const [ha, hb, hc] = await Promise.all([loadApp(), loadApp(), loadApp()]);
  // Clean the fresh-boot seeds so the proof reads on items only.
  for (const h of [ha, hb, hc]) { const st = h.app.getState(); st.builds = []; st.briefs = []; st.links = []; st.prompts = []; st.items = []; st.deleted = {}; }
  const A = device(ha.app, "mac"), B = device(hb.app, "phone"), C = device(hc.app, "ipad");

  // 1. A creates two tasks and pushes.
  A.app.getState().items = [{ id: "t1", text: "original t1", u: 100 }, { id: "t2", text: "original t2", u: 100 }];
  await A.push();

  // 2. B pulls, edits t1 (newer), adds t3, pushes.
  await B.pull();
  assert.strictEqual(B.items().length, 2, "B received A's tasks");
  const bt1 = B.app.getState().items.find((i) => i.id === "t1"); bt1.text = "t1 edited on phone"; bt1.u = 200;
  B.app.getState().items.push({ id: "t3", text: "born on phone", u: 200 });
  await B.push();

  // 3. A concurrently (still at rev 1) edits t2 and adds t4 — its push is
  //    stale, merges B's changes, re-pushes the union.
  const at2 = A.app.getState().items.find((i) => i.id === "t2"); at2.text = "t2 edited on mac"; at2.u = 300;
  A.app.getState().items.push({ id: "t4", text: "born on mac", u: 300 });
  await A.push();

  // 4. C joins fresh and pulls everything.
  await C.pull();
  assert.deepStrictEqual(C.items().map((i) => i.id), ["t1", "t2", "t3", "t4"], "C sees the full union");
  assert.strictEqual(C.items().find((i) => i.id === "t1").text, "t1 edited on phone", "newer t1 edit won");
  assert.strictEqual(C.items().find((i) => i.id === "t2").text, "t2 edited on mac", "concurrent t2 edit survived the merge");

  // 5. B deletes t2 (tombstone) and pushes; everyone converges without
  //    resurrection.
  await B.pull();
  const stB = B.app.getState();
  stB.deleted["t2"] = Date.now();
  stB.items = stB.items.filter((i) => i.id !== "t2");
  await B.push();
  await A.pull();
  await C.pull();

  const finalA = A.items(), finalB = B.items(), finalC = C.items();
  assert.deepStrictEqual(finalA, finalB, "A and B converged");
  assert.deepStrictEqual(finalB, finalC, "B and C converged");
  assert.deepStrictEqual(finalA.map((i) => i.id), ["t1", "t3", "t4"], "t2 stays deleted everywhere");
  assert.ok(A.app.getState().deleted["t2"] && C.app.getState().deleted["t2"], "tombstone propagated to every device");

  // 6. One more full round-trip: nothing changes (stability).
  await A.push();
  await B.pull(); await C.pull();
  assert.deepStrictEqual(A.items(), B.items());
  assert.deepStrictEqual(B.items(), C.items());

  console.log("three-device convergence ok");
})().catch((err) => { console.error(err); process.exit(1); });
