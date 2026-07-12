// W8 item 67 — per-ask response-length control. body.length brief/deep swaps
// the MAX_TOKENS budget for that council only; anything else keeps the env
// default. The stubbed AI binding captures the max_tokens each run receives.

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

async function loadWorker() {
  const src = fs.readFileSync(path.join(__dirname, "..", "worker.js"), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(src).toString("base64");
  return import(url);
}

function capturingAI(seen) {
  return { run: async (model, opts) => { seen.push(opts.max_tokens); return { response: "ok" }; } };
}

async function council(worker, env, body) {
  const res = await worker.default.fetch(
    new Request("https://relay.test/council", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ prompt: "hi", synthesize: false }, body)),
    }),
    env
  );
  assert.strictEqual(res.status, 200, "council should answer");
  return res.json();
}

(async function main() {
  const worker = await loadWorker();
  const seen = [];

  await council(worker, { AI: capturingAI(seen) }, {});
  assert.strictEqual(seen.pop(), 1024, "no length -> env/default budget");

  await council(worker, { AI: capturingAI(seen) }, { length: "brief" });
  assert.strictEqual(seen.pop(), 320, "brief -> 320 tokens");

  await council(worker, { AI: capturingAI(seen) }, { length: "Deep" });
  assert.strictEqual(seen.pop(), 2048, "deep -> 2048 tokens (case-insensitive)");

  await council(worker, { AI: capturingAI(seen), MAX_TOKENS: "512" }, { length: "gigantic" });
  assert.strictEqual(seen.pop(), 512, "unknown length falls back to the env budget");

  await council(worker, { AI: capturingAI(seen), MAX_TOKENS: "512" }, { length: "brief" });
  assert.strictEqual(seen.pop(), 320, "brief overrides an env MAX_TOKENS too");

  console.log("length control ok");
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
