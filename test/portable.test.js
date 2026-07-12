// W1 item 24 — portableDoc / applyPortableDoc round-trips.
// The "connections never travel" law, pinned: backups strip credentials,
// applying a doc never touches device connections, versions never leak in.

"use strict";

const assert = require("assert");
const { loadApp } = require("./harness");

(async function main() {
  const { app } = await loadApp();
  const st = app.getState();

  // Dress the state up like a fully connected device.
  st.items = [{ id: "t1", text: "task", u: 1 }];
  st.notes = [{ id: "n1", title: "note" }];
  st.relay = { url: "https://relay.example.workers.dev", token: "SECRET-TOKEN" };
  st.sync = { on: true, key: "deadbeef".repeat(4), deviceId: "dev1", rev: 7 };
  st.push = { enabled: true, endpoint: "https://push.example/ep", hour: 8, syncedAt: 1 };
  st.github = { token: "ghp_secret", session: "ghsess", login: "kevin", pendingOAuth: false, cache: { stale: true }, fetchedAt: 123 };
  st.email = { session: "gmlsess", accounts: ["kevin@example.com"], active: "kevin@example.com" };
  st.calendar = { connected: true, calId: "primary", calIds: ["primary"], lastSyncAt: 9 };
  st.sheetsCache = { at: 1, text: "leftover" };
  st.swim = { at: 1, items: ["leftover"] };
  st.lastBackupAt = 111;
  st.lastShutdown = "2026-07-10";
  st.roomStats = { today: { visits: 3, last: 5 } };

  // ── portableDoc: allowlist + credential stripping ──────────────────────
  const doc = app.portableDoc(st);
  for (const banned of ["sync", "push", "github", "email", "calendar", "sheetsCache", "swim"]) {
    assert.ok(!(banned in doc), "portableDoc must exclude " + banned);
  }
  assert.strictEqual(doc.relay.url, "https://relay.example.workers.dev", "relay.url preserved");
  assert.strictEqual(doc.relay.token, "", "relay.token blanked");
  assert.strictEqual(doc.v, app.SCHEMA_VERSION, "doc stamped with current schema");
  assert.strictEqual(doc.lastBackupAt, 111);
  assert.strictEqual(doc.lastShutdown, "2026-07-10");
  assert.deepStrictEqual(doc.roomStats, { today: { visits: 3, last: 5 } });
  assert.deepStrictEqual(doc.items, [{ id: "t1", text: "task", u: 1 }]);
  // Deep copy, not references.
  doc.items[0].text = "mutated";
  assert.strictEqual(st.items[0].text, "task", "portableDoc deep-clones");
  // The serialized backup never contains the secrets.
  const serialized = JSON.stringify(app.portableDoc(st));
  assert.ok(serialized.indexOf("SECRET-TOKEN") < 0, "no relay token in backup bytes");
  assert.ok(serialized.indexOf("ghp_secret") < 0, "no GitHub token in backup bytes");
  assert.ok(serialized.indexOf("gmlsess") < 0, "no email session in backup bytes");
  // Missing arrays in source become empty arrays, not undefined.
  const empt = app.portableDoc({});
  assert.deepStrictEqual(empt.items, []);
  assert.deepStrictEqual(empt.relay, { url: "", token: "" });

  // ── applyPortableDoc: connections never applied ────────────────────────
  const beforeRelay = JSON.stringify(st.relay);
  const beforeEmail = JSON.stringify(st.email);
  const beforeCal = JSON.stringify(st.calendar);
  const beforePushEnabled = st.push.enabled;

  // A hostile/pre-fix backup that tries to smuggle connections + a version.
  const hostile = {
    v: 99,
    items: [{ id: "imported", text: "from backup", u: 2 }],
    relay: { url: "https://evil.example", token: "EVIL" },
    sync: { on: true, key: "attacker" },
    push: { enabled: false },
    github: { token: "stolen" },
    email: { session: "evil", accounts: ["evil@example.com"] },
    calendar: { connected: false },
    deleted: { gone: 1 },
  };
  const ok = app.applyPortableDoc(hostile, { reason: "import" });
  assert.strictEqual(ok, true);
  assert.deepStrictEqual(st.items, [{ id: "imported", text: "from backup", u: 2 }], "arrays replaced");
  assert.strictEqual(JSON.stringify(st.relay), beforeRelay, "relay untouched by import");
  assert.strictEqual(JSON.stringify(st.email), beforeEmail, "email untouched by import");
  assert.strictEqual(JSON.stringify(st.calendar), beforeCal, "calendar untouched by import");
  assert.strictEqual(st.push.enabled, beforePushEnabled, "push untouched by import");
  assert.strictEqual(st.sync.on, true, "sync connection untouched");
  assert.strictEqual(st.sync.key, "deadbeef".repeat(4), "sync key untouched");
  assert.strictEqual(st.v, app.SCHEMA_VERSION, "doc.v NEVER applied — current schema stamped");
  assert.deepStrictEqual(st.deleted, { gone: 1 }, "tombstones applied");
  // Sync marked dirty for re-push after import.
  assert.strictEqual(st.sync.dirty, true, "import marks sync dirty");
  assert.strictEqual(st.sync.rev, 0, "import resets rev for merge-push");

  // Legacy backup missing keys: current state preserved for those keys.
  st.notes = [{ id: "keepme", title: "existing note" }];
  app.applyPortableDoc({ items: [{ id: "only-items" }] }, { reason: "import" });
  assert.deepStrictEqual(st.notes.map((n) => n.id), ["keepme"], "missing key in legacy backup leaves current data");
  assert.deepStrictEqual(st.items.map((i) => i.id), ["only-items"]);

  // Garbage input rejected.
  assert.strictEqual(app.applyPortableDoc(null), false);
  assert.strictEqual(app.applyPortableDoc("string"), false);

  // ── full round-trip: export → apply reproduces content ────────────────
  st.items = [{ id: "rt1", text: "round trip", u: 3 }];
  st.habits = [{ id: "h1", name: "swim", done: {} }];
  const snap = app.portableDoc(st);
  st.items = []; st.habits = [];
  app.applyPortableDoc(snap, { reason: "snapshot" });
  assert.deepStrictEqual(st.items, [{ id: "rt1", text: "round trip", u: 3 }]);
  assert.deepStrictEqual(st.habits, [{ id: "h1", name: "swim", done: {} }]);

  console.log("portable-doc round-trips ok");
})().catch((err) => { console.error(err); process.exit(1); });
