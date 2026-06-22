// KevinOS relay — a tiny Cloudflare Worker that holds your AI key server-side
// and answers the Council queue. The browser never sees the key.
//
// Provider is switchable via the PROVIDER env var: "claude" or "gemini".
// You set ONE secret (ANTHROPIC_API_KEY or GEMINI_API_KEY) to match.
//
// Endpoints:
//   GET  /        -> health check { ok, provider }
//   POST /ai      -> { prompt, system? }  ->  { text, provider }

const DEFAULTS = {
  claudeModel: "claude-haiku-4-5-20251001",
  geminiModel: "gemini-2.5-flash",
  maxTokens: 1024,
};

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...cors(origin) },
  });
}

async function callClaude(env, system, prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL || DEFAULTS.claudeModel,
      max_tokens: Number(env.MAX_TOKENS) || DEFAULTS.maxTokens,
      system: system || undefined,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data.error && data.error.message) || "Claude error " + r.status);
  return (data.content || []).map((b) => b.text || "").join("").trim();
}

async function callGemini(env, system, prompt) {
  const model = env.GEMINI_MODEL || DEFAULTS.geminiModel;
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    model +
    ":generateContent?key=" +
    env.GEMINI_API_KEY;
  const body = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data.error && data.error.message) || "Gemini error " + r.status);
  const cand = (data.candidates || [])[0];
  return (((cand && cand.content && cand.content.parts) || []).map((p) => p.text || "").join("")).trim();
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || "*";
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });

    const url = new URL(request.url);
    const provider = (env.PROVIDER || "claude").toLowerCase();

    if (request.method === "GET" && url.pathname === "/") {
      return json({ ok: true, service: "kevinos-relay", provider }, 200, origin);
    }

    if (request.method === "POST" && url.pathname === "/ai") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body" }, 400, origin);
      }
      const prompt = ((payload && payload.prompt) || "").toString().trim();
      const system = ((payload && payload.system) || "").toString();
      if (!prompt) return json({ error: "Missing prompt" }, 400, origin);

      try {
        let text;
        if (provider === "gemini") {
          if (!env.GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY not set on the relay" }, 500, origin);
          text = await callGemini(env, system, prompt);
        } else {
          if (!env.ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY not set on the relay" }, 500, origin);
          text = await callClaude(env, system, prompt);
        }
        return json({ text, provider }, 200, origin);
      } catch (err) {
        return json({ error: (err && err.message) || "AI request failed" }, 502, origin);
      }
    }

    return json({ error: "Not found" }, 404, origin);
  },
};
