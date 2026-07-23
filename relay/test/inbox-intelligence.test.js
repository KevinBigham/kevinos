// Inbox Intelligence — two bounded relay stages:
// 1) scan/rank recent inbox messages,
// 2) search relationship history and draft exactly three reviewable replies.
// Gmail and Gemini are fully stubbed; no network or mailbox is touched.

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

async function loadWorker() {
  const src = fs.readFileSync(path.join(__dirname, "..", "worker.js"), "utf8");
  const url = "data:text/javascript;base64," + Buffer.from(src).toString("base64");
  return import(url);
}

function b64(s) {
  return Buffer.from(s, "utf8").toString("base64url");
}

function message(id, threadId, from, subject, body, date) {
  return {
    id,
    threadId,
    internalDate: String(Date.parse(date)),
    snippet: body.slice(0, 80),
    labelIds: ["INBOX", "UNREAD", "CATEGORY_PERSONAL"],
    payload: {
      mimeType: "text/plain",
      headers: [
        { name: "From", value: from },
        { name: "To", value: "Kevin <kevin@example.com>" },
        { name: "Subject", value: subject },
        { name: "Date", value: date },
        { name: "Message-ID", value: "<" + id + "@example.com>" },
      ],
      body: { data: b64(body) },
    },
  };
}

function responseJson(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json" },
  });
}

function fakePush() {
  const values = {
    "gml:session-1": JSON.stringify({
      accounts: [{
        email: "kevin@example.com",
        access: "gmail-access",
        refresh: "gmail-refresh",
        exp: Date.now() + 3600000,
      }],
    }),
  };
  return {
    async get(key) { return values[key] || null; },
    async put(key, value) { values[key] = value; },
    async delete(key) { delete values[key]; },
  };
}

async function post(worker, env, pathname, body) {
  const res = await worker.default.fetch(
    new Request("https://relay.test" + pathname, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    env
  );
  const data = await res.json();
  return { res, data };
}

(async function main() {
  const worker = await loadWorker();
  const originalFetch = global.fetch;
  const historyQueries = [];
  const inboxQueries = [];
  const aiBudgets = [];
  const aiSystems = [];
  const aiConfigs = [];
  let phase = "scan";
  let phaseFetches = 0;
  let sendCalls = 0;

  const messages = {
    m001: message("m001", "thread-current-1", "Coach Carter <coach@example.com>", "Meet plan", "Can you confirm Saturday's lineup by tonight?", "Wed, 22 Jul 2026 15:00:00 GMT"),
    m002: message("m002", "thread-current-2", "Dana Reed <dana@example.com>", "Budget approval", "Please let me know whether I can release the order.", "Thu, 23 Jul 2026 14:00:00 GMT"),
    m003: message("m003", "thread-news", "News Bot <news@example.com>", "Weekly newsletter", "This is an automated newsletter.", "Thu, 23 Jul 2026 13:00:00 GMT"),
  };

  global.fetch = async function (input, init) {
    phaseFetches++;
    const url = typeof input === "string" ? input : input.url;
    if (url.indexOf("gmail.googleapis.com") >= 0) {
      const u = new URL(url);
      if (u.pathname.endsWith("/messages/send")) {
        sendCalls++;
        return responseJson({ id: "sent" });
      }
      if (u.pathname.endsWith("/messages") && u.searchParams.get("maxResults") === "40") {
        inboxQueries.push(u.searchParams.get("q") || "");
        return responseJson({ messages: [{ id: "m002", threadId: "thread-current-2" }, { id: "m001", threadId: "thread-current-1" }, { id: "m003", threadId: "thread-news" }] });
      }
      if (u.pathname.endsWith("/messages") && u.searchParams.get("maxResults") === "8") {
        const q = u.searchParams.get("q") || "";
        historyQueries.push(q);
        const coach = q.indexOf("coach@example.com") >= 0;
        return responseJson({ messages: [{ id: coach ? "old-coach" : "old-dana", threadId: coach ? "history-coach" : "history-dana" }] });
      }
      const mm = u.pathname.match(/\/messages\/([^/]+)$/);
      if (mm && messages[mm[1]]) return responseJson(messages[mm[1]]);
      const tm = u.pathname.match(/\/threads\/([^/]+)$/);
      if (tm) {
        if (tm[1] === "thread-current-1") return responseJson({ id: tm[1], messages: [messages.m001] });
        if (tm[1] === "thread-current-2") return responseJson({ id: tm[1], messages: [messages.m002] });
        const coach = tm[1] === "history-coach";
        return responseJson({
          id: tm[1],
          messages: [
            message(
              coach ? "hc1" : "hd1",
              tm[1],
              coach ? "Kevin <kevin@example.com>" : "Dana Reed <dana@example.com>",
              coach ? "Re: Spring meet" : "Re: Equipment order",
              coach ? "Thanks Coach — the last lineup worked well." : "Thanks, I will hold the order until you confirm.",
              "Mon, 01 Jun 2026 12:00:00 GMT"
            ),
          ],
        });
      }
      throw new Error("Unexpected Gmail URL: " + url);
    }
    if (url.indexOf("generativelanguage.googleapis.com") >= 0) {
      const req = JSON.parse(init.body);
      const system = req.systemInstruction.parts[0].text;
      aiSystems.push(system);
      aiBudgets.push(req.generationConfig.maxOutputTokens);
      aiConfigs.push(req.generationConfig);
      if (system.indexOf("Gmail search planner") >= 0) {
        return responseJson({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ query: "in:inbox -from:me" }) }] } }],
        });
      }
      if (phase === "scan") {
        return responseJson({
          candidates: [{ content: { parts: [{ text: JSON.stringify({ candidates: [
            { id: "m002", reason: "Dana asked for a decision." },
            { id: "m001", reason: "Coach asked for lineup confirmation." },
            { id: "not-supplied", reason: "Must be rejected." },
          ] }) }] } }],
        });
      }
      return responseJson({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ results: [
          {
            id: "m002",
            why: "Dana is waiting on approval.",
            relationship: "You normally give Dana clear go/no-go decisions.",
            responses: [
              { label: "Direct", body: "Approved — please release the order." },
              { label: "Warm", body: "Thanks for checking, Dana. Please go ahead and release it." },
              { label: "Concise", body: "Approved. Please release." },
            ],
          },
          {
            id: "m001",
            why: "Coach needs a lineup answer tonight.",
            relationship: "Your prior notes with Coach are collaborative and brief.",
            responses: [
              { label: "Direct", body: "Confirmed — I will send the lineup tonight." },
              { label: "Warm", body: "Absolutely, Coach. I will get the lineup to you tonight." },
              { label: "Concise", body: "Yes — lineup coming tonight." },
            ],
          },
        ] }) }] } }],
      });
    }
    throw new Error("Unexpected fetch URL: " + url);
  };

  try {
    const env = {
      PUSH: fakePush(),
      GEMINI_API_KEY: "gemini-test",
      GOOGLE_CLIENT_ID: "client",
      GOOGLE_CLIENT_SECRET: "secret",
      AI_RATE_LIMIT_PER_HOUR: "0",
    };

    phase = "scan";
    phaseFetches = 0;
    const scan = await post(worker, env, "/google/inbox-scan", {
      session: "session-1",
      account: "kevin@example.com",
      prompt: "Find the two newest messages where I owe a response.",
      limit: 2,
    });
    assert.strictEqual(scan.res.status, 200, "scan route should answer");
    assert.strictEqual(scan.data.ok, true);
    assert.strictEqual(scan.data.scanned, 3, "scan reports the bounded mailbox sample");
    assert.deepStrictEqual(inboxQueries, ["in:inbox -from:me"], "the free-form request is translated into a full-inbox Gmail query");
    assert.deepStrictEqual(scan.data.candidates.map((c) => c.id), ["m002", "m001"], "AI ranking is allowlisted to supplied message ids and preserves order");
    assert.strictEqual(scan.data.candidates[0].body, undefined, "stage 1 never sends message bodies back to the browser");
    assert.deepStrictEqual(aiBudgets.slice(0, 2), [512, 4096], "scan uses bounded query-planning and selection budgets");
    assert.ok(aiConfigs[0].responseSchema && aiConfigs[1].responseSchema, "scan uses Gemini structured-output schemas");
    assert.deepStrictEqual(aiConfigs.slice(0, 2).map((c) => c.thinkingConfig.thinkingBudget), [0, 0], "scan reserves its output budget for complete JSON");
    assert.ok(aiSystems[1].indexOf("untrusted evidence") >= 0, "scan prompt defends against email prompt injection");
    assert.ok(phaseFetches < 50, "scan stays below the Worker external-subrequest limit");

    phase = "research";
    phaseFetches = 0;
    const research = await post(worker, env, "/google/inbox-research", {
      session: "session-1",
      account: "kevin@example.com",
      prompt: "Find the two newest messages where I owe a response.",
      candidates: scan.data.candidates,
    });
    assert.strictEqual(research.res.status, 200, "research route should answer");
    assert.strictEqual(research.data.ok, true);
    assert.strictEqual(research.data.results.length, 2, "both selected messages were researched");
    assert.deepStrictEqual(research.data.results.map((r) => r.responses.length), [3, 3], "every result has three reply choices");
    assert.strictEqual(research.data.results[0].to, "dana@example.com", "reply routing uses the parsed sender email");
    assert.ok(historyQueries.some((q) => q.indexOf('from:"Coach Carter"') >= 0 && q.indexOf('to:"coach@example.com"') >= 0), "relationship search uses sender name and email");
    assert.strictEqual(aiBudgets[2], 8192, "research has room for ten sets of three replies");
    assert.ok(aiConfigs[2].responseSchema, "research uses a Gemini structured-output schema");
    assert.strictEqual(aiConfigs[2].thinkingConfig.thinkingBudget, 0, "research reserves its output budget for complete JSON");
    assert.ok(aiSystems[2].indexOf("Nothing is being sent") >= 0, "research explicitly remains draft-only");
    assert.ok(phaseFetches < 50, "research stays below the Worker external-subrequest limit");
    assert.strictEqual(sendCalls, 0, "Inbox Intelligence never calls Gmail send");

    console.log("inbox intelligence ok");
  } finally {
    global.fetch = originalFetch;
  }
})().catch(function (err) {
  console.error(err);
  process.exit(1);
});
