const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadApp } = require("./harness");

async function loadWorker() {
  const src = fs.readFileSync(path.join(__dirname, "..", "relay", "worker.js"), "utf8");
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

(async function () {
  const source = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const { app } = await loadApp();
  const protectedMarker = "SYNTHETIC_STUDENT_ZEPHYR_PRIVATE_SCORE_93";

  assert.match(source, /indexedDB\.open\(GM_DB_NAME,GM_DB_VERSION\)/, "vault uses a separate IndexedDB database");
  for (const store of app.GM_STORES) assert.match(source, new RegExp('"' + store + '"'), store + " store is declared");
  assert.strictEqual(app.CONTENT_ARRAYS.some((x) => /grading|submission|rubric|result|artifact/i.test(x)), false, "vault records are not canonical content arrays");
  assert.strictEqual(app.PORTABLE_OBJS.some((x) => /grading|vault/i.test(x)), false, "vault records are not portable objects");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(app.getState(), "grading"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(app.getState(), "gradingVault"), false);

  const portable = app.portableDoc(app.getState());
  const sync = app.buildSyncDoc();
  assert.strictEqual(JSON.stringify(portable).includes(protectedMarker), false, "backup has no vault content");
  assert.strictEqual(JSON.stringify(sync).includes(protectedMarker), false, "sync has no vault content");
  assert.strictEqual(app.typedSearchRecords(app.getState(), "ZEPHYR", {}).length, 0, "typed search has no vault content");
  assert.strictEqual(JSON.stringify(app.aiContext("search", "", {})).includes(protectedMarker), false, "general AI context has no vault content");

  const batchA = "BATCH-A";
  const batchB = "BATCH-B";
  app.gmMemPut("batches", { id: batchA });
  app.gmMemPut("batches", { id: batchB });
  for (const name of app.GM_STORES.slice(1)) {
    app.gmMemPut(name, { id: name + "-a", batchId: batchA, protectedMarker });
    app.gmMemPut(name, { id: name + "-b", batchId: batchB });
  }
  const counts = await app.gmVaultDeleteBatch(batchA);
  assert.strictEqual(counts.batches, 1);
  for (const name of app.GM_STORES.slice(1)) assert.strictEqual(counts[name], 1, name + " target record deleted");
  assert.strictEqual(app.gmMem.batches.some((x) => x.id === batchA), false);
  assert.strictEqual(app.gmMem.batches.some((x) => x.id === batchB), true, "unrelated batch survives deletion");
  assert.strictEqual(JSON.stringify(app.gmMem).includes(protectedMarker), false, "all associated protected records are gone");

  const original = new TextEncoder().encode("immutable synthetic original");
  const before = await app.gmSha256Bytes(original);
  const feedback = app.gmFeedbackHtml({ token: "SUB-ABCDEF12", text: "immutable synthetic original" }, null, "Local 1");
  const after = await app.gmSha256Bytes(original);
  assert.strictEqual(before, after, "feedback generation cannot mutate original bytes");
  assert.match(feedback, /No final grade was produced/);

  assert.doesNotMatch(source, /FABRIC_DENIED_PRIVACY\s*=\s*new Set\([^\n]*grading/i, "grading does not weaken the Fabric privacy denylist");
  assert.doesNotMatch(source, /relayCall\([^\n]*grading/i, "Phase A exposes no grading relay call");

  const worker = await loadWorker();
  let calls = 0;
  const realFetch = global.fetch;
  global.fetch = async function () { calls++; throw new Error("grading privacy denial must precede transport"); };
  try {
    const req = {
      requestId: "grading-original-fixture", feature: "commitment-extract", lane: "FAST_STRUCTURED", requiredCapabilities: ["text", "structured"],
      privacyClass: "YOUTH_SENSITIVE", packetFingerprint: "sha256:synthetic-grading-fixture", promptVersion: "commitment-extract-v1",
      input: "Synthetic identified assignment fixture", maxOutputTokens: 100, timeoutMs: 1000, approvalState: "approved", allowPaid: false,
      manifest: { approved: true, purpose: "Attempted original grading record", deidentified: false, records: [{ id: "synthetic-student", fields: ["assignment"], privacyClass: "YOUTH_SENSITIVE" }] },
    };
    assert.strictEqual(worker.fabricRequestDecision(req).allowed, false, "identified grading data is denied by the existing Fabric");
    const env = { AI_ENABLED_PROVIDERS: "groq", AI_FREE_VERIFIED_MODELS: "groq:openai/gpt-oss-20b", GROQ_API_KEY: "server-test-secret", PUSH: { async get() { return "0"; }, async put() {} } };
    assert.strictEqual((await worker.runFabricRequest(req, env, {})).ok, false);
    assert.strictEqual(calls, 0, "blocked grading records make zero provider calls");
  } finally { global.fetch = realFetch; }
  console.log("grading vault isolation and deletion contracts ok");
})().catch((err) => { console.error(err); process.exit(1); });
