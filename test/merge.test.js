// W1 item 23 — mergeById / mergeRemoteDoc convergence characterization.
// 11 convergence cases + tombstone-resurrection attempts. This is the net
// under the sync engine before W2 touches anything near it.

"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const { app } = await loadApp();
  const m = app.mergeById;

  // ── mergeById: the 11 convergence cases ────────────────────────────────
  // 1. remote-only survives
  assert.deepStrictEqual(m([], [{ id: "r", x: 1 }]), [{ id: "r", x: 1 }]);
  // 2. local-only survives
  assert.deepStrictEqual(m([{ id: "l", x: 1 }], []), [{ id: "l", x: 1 }]);
  // 3. shared id, remote newer u → remote wins
  assert.deepStrictEqual(m([{ id: "a", v: "L", u: 1 }], [{ id: "a", v: "R", u: 2 }])[0].v, "R");
  // 4. shared id, local newer u → local wins
  assert.deepStrictEqual(m([{ id: "a", v: "L", u: 5 }], [{ id: "a", v: "R", u: 2 }])[0].v, "L");
  // 5. shared id, equal u → remote wins the tie
  assert.deepStrictEqual(m([{ id: "a", v: "L", u: 3 }], [{ id: "a", v: "R", u: 3 }])[0].v, "R");
  // 6. shared id, both unstamped → remote wins
  assert.deepStrictEqual(m([{ id: "a", v: "L" }], [{ id: "a", v: "R" }])[0].v, "R");
  // 7. shared id, local stamped vs remote unstamped → local wins
  assert.deepStrictEqual(m([{ id: "a", v: "L", u: 1 }], [{ id: "a", v: "R" }])[0].v, "L");
  // 8. ordering: remote order first, then local-only in local order
  assert.deepStrictEqual(
    m([{ id: "l1" }, { id: "s", u: 9 }, { id: "l2" }], [{ id: "r1" }, { id: "s" }, { id: "r2" }]).map((x) => x.id),
    ["r1", "s", "r2", "l1", "l2"]
  );
  // 9. non-array inputs treated as empty
  assert.deepStrictEqual(m(null, undefined), []);
  assert.deepStrictEqual(m(null, [{ id: "x" }]).length, 1);
  // 10. items without an id are dropped
  assert.deepStrictEqual(m([{ noid: 1 }], [{ id: "k" }, { also: "noid" }]).map((x) => x.id), ["k"]);
  // 11. duplicate ids never duplicate in the output
  const dup = m([{ id: "d", u: 1 }], [{ id: "d", u: 2 }, { id: "d", u: 3 }]);
  assert.strictEqual(dup.length, 1);
  assert.strictEqual(dup[0].u, 3, "newest duplicate wins the slot");

  // Nothing either side added is ever dropped (the lossless-union law).
  const union = m(
    [{ id: "a" }, { id: "b" }, { id: "c", u: 2 }],
    [{ id: "c", u: 1 }, { id: "d" }]
  );
  assert.deepStrictEqual(union.map((x) => x.id).sort(), ["a", "b", "c", "d"]);
  assert.strictEqual(union.find((x) => x.id === "c").u, 2);

  // ── mergeRemoteDoc: tombstones + meta ──────────────────────────────────
  const st = app.getState();

  // Tombstone resurrection attempt #1: remote still carries an item this
  // device deleted → merge must filter it back out.
  st.items = [{ id: "keep1", text: "mine", u: 10 }];
  st.deleted = { zombie: Date.now() };
  app.mergeRemoteDoc({ items: [{ id: "zombie", text: "back from the dead", u: 99 }, { id: "keep2", text: "theirs", u: 5 }] });
  assert.deepStrictEqual(st.items.map((x) => x.id).sort(), ["keep1", "keep2"], "tombstoned id filtered out of the union");

  // Tombstone resurrection attempt #2: remote tombstone kills a local item.
  st.items = [{ id: "dying", text: "still here", u: 1 }];
  st.deleted = {};
  app.mergeRemoteDoc({ items: [], deleted: { dying: Date.now() } });
  assert.deepStrictEqual(st.items, [], "remote tombstone unions in and filters the local item");

  // unionDeleted: newer timestamp wins per id.
  st.deleted = { a: 100, b: 500 };
  app.unionDeleted({ a: 200, b: 300, c: 50 });
  assert.deepStrictEqual(st.deleted, { a: 200, b: 500, c: 50 });

  // mergeRoomStats: max, never sum.
  st.roomStats = { today: { visits: 10, last: 1000 } };
  app.mergeRoomStats({ today: { visits: 4, last: 2000 }, tasks: { visits: 7, last: 500 } });
  assert.deepStrictEqual(st.roomStats.today, { visits: 10, last: 2000 });
  assert.deepStrictEqual(st.roomStats.tasks, { visits: 7, last: 500 });

  // lastBackupAt: max wins; lastShutdown: string-later wins.
  st.lastBackupAt = 1000; st.lastShutdown = "2026-07-10";
  app.mergeRemoteDoc({ items: [], lastBackupAt: 500, lastShutdown: "2026-07-01" });
  assert.strictEqual(st.lastBackupAt, 1000);
  assert.strictEqual(st.lastShutdown, "2026-07-10");
  app.mergeRemoteDoc({ items: [], lastBackupAt: 9999, lastShutdown: "2026-07-11" });
  assert.strictEqual(st.lastBackupAt, 9999);
  assert.strictEqual(st.lastShutdown, "2026-07-11");

  // applySyncDoc (authoritative apply): arrays replace, tombstones still union.
  st.items = [{ id: "local-only", u: 1 }];
  st.deleted = { old: 42 };
  app.applySyncDoc({ items: [{ id: "cloud", u: 2 }], deleted: { newer: 7 } });
  assert.deepStrictEqual(st.items.map((x) => x.id), ["cloud"], "applySyncDoc replaces arrays");
  assert.deepStrictEqual(st.deleted, { old: 42, newer: 7 }, "tombstones union even on authoritative apply");

  // buildSyncDoc: skips SYNC_SKIP keys and GC-drops tombstones older than 30 days
  // — from the doc AND from state itself (item 80's GC pin).
  st.deleted = { fresh: Date.now(), stale: Date.now() - 31 * 86400000 };
  const doc = app.buildSyncDoc();
  assert.ok(!("sync" in doc) && !("relay" in doc) && !("push" in doc) && !("email" in doc), "SYNC_SKIP respected");
  assert.ok("fresh" in doc.deleted, "fresh tombstone kept");
  assert.ok(!("stale" in doc.deleted), "30-day tombstone GC in the doc");
  assert.ok(!("stale" in st.deleted), "30-day tombstone GC prunes state.deleted too");

  // trimCouncil (item 5): newest kept, trimmed ids buried so sync can't resurrect.
  st.council = [];
  for (let i = 0; i < 60; i++) st.council.push({ id: "c" + i, text: "q" + i });
  st.deleted = {};
  const trimmed = app.trimCouncil(app.COUNCIL_KEEP);
  assert.strictEqual(trimmed, 10);
  assert.strictEqual(st.council.length, 50);
  assert.strictEqual(st.council[0].id, "c0", "newest (front) kept");
  assert.ok(st.deleted["c59"] && st.deleted["c50"], "trimmed sessions tombstoned");
  assert.strictEqual(app.trimCouncil(app.COUNCIL_KEEP), 0, "no-op under the cap");

  // W2.12 — hostile ids in a synced doc are re-minted at ingress.
  st.items = []; st.deleted = {};
  app.mergeRemoteDoc({ items: [{ id: 'evil" onload="x', text: "hostile", u: 1 }, { id: "goodid", text: "ok", u: 1 }] });
  assert.strictEqual(st.items.length, 2);
  for (const it of st.items) assert.match(String(it.id), /^[a-z0-9-]{1,40}$/i);
  assert.ok(st.items.some((i) => i.id === "goodid"), "safe id kept");
  st.items = [];
  app.applySyncDoc({ items: [{ id: "<img src=x>", text: "hostile2" }] });
  assert.match(String(st.items[0].id), /^[a-z0-9-]{1,40}$/i, "applySyncDoc sanitizes too");

  console.log("merge convergence ok");
})().catch((err) => { console.error(err); process.exit(1); });
