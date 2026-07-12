// W8 item 62 — Council lane pinning. LANE_PINS (wrangler var) sets the server
// default; a per-request `lanes` map overrides it. Unknown ids/lanes are
// ignored. The cloudflare seat runs against a stubbed AI binding, so the
// /council override path is covered end-to-end with zero network.

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

async function loadWorker() {
  const src = fs.readFileSync(path.join(__dirname, "..", "worker.js"), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(src).toString("base64");
  return import(url);
}

function stubAI() {
  return { run: async () => ({ response: "stub answer" }) };
}

async function health(worker, env) {
  const res = await worker.default.fetch(new Request("https://relay.test/", { method: "GET" }), env);
  assert.strictEqual(res.status, 200, "health should answer");
  return res.json();
}

(async function main() {
  const worker = await loadWorker();

  // Defaults: each seat sits in its own lane.
  let h = await health(worker, { GEMINI_API_KEY: "x", AI: stubAI() });
  assert.deepStrictEqual(h.seats, ["gemini", "cloudflare"], "seat ids stay as before");
  assert.deepStrictEqual(
    h.roster.map((s) => s.id + ":" + s.lane),
    ["gemini:Grounded", "cloudflare:Open-model"],
    "health roster carries default lanes"
  );
  assert.deepStrictEqual(
    h.lanes,
    ["grounded", "open", "tactical", "research", "devil", "outside"],
    "health advertises the pinnable lane keys"
  );

  // LANE_PINS re-pins server-side; whitespace tolerated; unknown lane ignored.
  h = await health(worker, {
    GEMINI_API_KEY: "x", AI: stubAI(),
    LANE_PINS: " cloudflare = devil , gemini=bogus ",
  });
  assert.deepStrictEqual(
    h.roster.map((s) => s.id + ":" + s.lane),
    ["gemini:Grounded", "cloudflare:Devil's advocate"],
    "LANE_PINS re-pins known lanes and ignores unknown ones"
  );

  // Request override beats LANE_PINS — no redeploy for lane swaps.
  const res = await worker.default.fetch(
    new Request("https://relay.test/council", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "hi", synthesize: false, lanes: { cloudflare: "outside", nosuchseat: "devil" } }),
    }),
    { AI: stubAI(), LANE_PINS: "cloudflare=devil" }
  );
  assert.strictEqual(res.status, 200, "council with stubbed AI seat should answer");
  const body = await res.json();
  assert.strictEqual(body.seats.length, 1, "one stubbed seat");
  assert.strictEqual(body.seats[0].lane, "Outside view", "request lanes override LANE_PINS");
  assert.strictEqual(body.seats[0].text, "stub answer", "stubbed seat answered");

  console.log("lane pins ok");
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
