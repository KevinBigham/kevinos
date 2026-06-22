// KevinOS relay — a small Cloudflare Worker that holds your AI keys server-side
// and powers the Council. The browser never sees a key.
//
// Two ways to ask:
//   POST /ai       -> { prompt, system? }              -> { text, provider }              (one model)
//   POST /council  -> { prompt, system?, synthesize? } -> { seats:[...], synthesis, ... } (every model)
//
// Each Council seat is enabled only if its credential is present, so you can add
// providers one at a time: set a secret, redeploy, and the seat joins automatically.
//
//   Gemini      -> secret GEMINI_API_KEY        (already set)
//   Cloudflare  -> [ai] binding "AI"            (no key — just the binding in wrangler.toml)
//   Groq        -> secret GROQ_API_KEY
//   Mistral     -> secret MISTRAL_API_KEY
//   OpenRouter  -> secret OPENROUTER_API_KEY
//
// Models are overridable per seat via vars (GEMINI_MODEL, CF_MODEL, GROQ_MODEL, …).

const DEFAULTS = {
  claudeModel: "claude-haiku-4-5-20251001",
  geminiModel: "gemini-2.5-flash",
  cfModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  groqModel: "llama-3.3-70b-versatile",
  mistralModel: "mistral-small-latest",
  openrouterModel: "deepseek/deepseek-chat-v3-0324:free",
  maxTokens: 1024,
  seatTimeoutMs: 45000,
};

const COUNCIL_SYSTEM =
  "You are one voice on Kevin's Council inside KevinOS, his calm personal operating system. " +
  "Answer the question directly, concisely, and practically. Lead with your recommendation, then the why. " +
  "Plain text, no preamble.";

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

function maxTokens(env) {
  return Number(env.MAX_TOKENS) || DEFAULTS.maxTokens;
}

// Resolve a promise, or reject if it takes longer than `ms` — so one slow seat
// can never hold up the whole Council.
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error((label || "request") + " timed out")), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function callClaude(env, system, prompt, model) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: model || env.CLAUDE_MODEL || DEFAULTS.claudeModel,
      max_tokens: maxTokens(env),
      system: system || undefined,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data.error && data.error.message) || "Claude error " + r.status);
  return (data.content || []).map((b) => b.text || "").join("").trim();
}

async function callGemini(env, system, prompt, model) {
  const m = model || env.GEMINI_MODEL || DEFAULTS.geminiModel;
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    m +
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

// Groq, Mistral, and OpenRouter all speak the OpenAI chat-completions dialect.
async function callOpenAICompatible(opts) {
  const messages = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.prompt });
  const headers = { "content-type": "application/json", authorization: "Bearer " + opts.key };
  if (opts.extraHeaders) Object.assign(headers, opts.extraHeaders);
  const r = await fetch(opts.url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: opts.model, max_tokens: opts.maxTokens, messages }),
  });
  const data = await r.json();
  if (!r.ok) {
    const msg = (data.error && (data.error.message || data.error)) || opts.name + " error " + r.status;
    throw new Error(typeof msg === "string" ? msg : opts.name + " error " + r.status);
  }
  const choice = (data.choices || [])[0];
  return (((choice && choice.message && choice.message.content) || "") + "").trim();
}

async function callCloudflare(env, system, prompt, model) {
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  const out = await env.AI.run(model || env.CF_MODEL || DEFAULTS.cfModel, {
    messages,
    max_tokens: maxTokens(env),
  });
  return ((out && (out.response || out.result || "")) + "").trim();
}

// The Council roster — only seats whose credential is present are returned.
function councilSeats(env) {
  const seats = [];
  if (env.GEMINI_API_KEY)
    seats.push({
      id: "gemini", label: "Gemini", lane: "Grounded · multimodal", provider: "google",
      model: env.GEMINI_MODEL || DEFAULTS.geminiModel,
      run: (system, prompt) => callGemini(env, system, prompt),
    });
  if (env.AI)
    seats.push({
      id: "cloudflare", label: "Llama · Cloudflare", lane: "Edge open-model", provider: "cloudflare",
      model: env.CF_MODEL || DEFAULTS.cfModel,
      run: (system, prompt) => callCloudflare(env, system, prompt),
    });
  if (env.GROQ_API_KEY)
    seats.push({
      id: "groq", label: "Groq", lane: "Fast tactical", provider: "groq",
      model: env.GROQ_MODEL || DEFAULTS.groqModel,
      run: (system, prompt) =>
        callOpenAICompatible({
          name: "Groq", url: "https://api.groq.com/openai/v1/chat/completions",
          key: env.GROQ_API_KEY, model: env.GROQ_MODEL || DEFAULTS.groqModel,
          system, prompt, maxTokens: maxTokens(env),
        }),
    });
  if (env.MISTRAL_API_KEY)
    seats.push({
      id: "mistral", label: "Mistral", lane: "European · research", provider: "mistral",
      model: env.MISTRAL_MODEL || DEFAULTS.mistralModel,
      run: (system, prompt) =>
        callOpenAICompatible({
          name: "Mistral", url: "https://api.mistral.ai/v1/chat/completions",
          key: env.MISTRAL_API_KEY, model: env.MISTRAL_MODEL || DEFAULTS.mistralModel,
          system, prompt, maxTokens: maxTokens(env),
        }),
    });
  if (env.OPENROUTER_API_KEY)
    seats.push({
      id: "openrouter", label: "OpenRouter", lane: "Wildcard", provider: "openrouter",
      model: env.OPENROUTER_MODEL || DEFAULTS.openrouterModel,
      run: (system, prompt) =>
        callOpenAICompatible({
          name: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions",
          key: env.OPENROUTER_API_KEY, model: env.OPENROUTER_MODEL || DEFAULTS.openrouterModel,
          system, prompt, maxTokens: maxTokens(env),
          extraHeaders: {
            "HTTP-Referer": env.ALLOW_ORIGIN || "https://kevinbigham.github.io",
            "X-Title": "KevinOS Council",
          },
        }),
    });
  return seats;
}

// The strongest available model chairs the synthesis pass.
function chair(env) {
  if (env.GEMINI_API_KEY) return { provider: "google", run: (s, p) => callGemini(env, s, p) };
  if (env.ANTHROPIC_API_KEY) return { provider: "anthropic", run: (s, p) => callClaude(env, s, p) };
  return null;
}

async function synthesize(env, prompt, answered) {
  const ch = chair(env);
  if (!ch || answered.length < 2) return null;
  const system =
    "You are the Chair of Kevin's Council of AIs. Several models answered the same question independently. " +
    "Synthesize their answers into one decision-ready brief. Be concise, specific, plain text, no preamble.";
  const body =
    "QUESTION:\n" + prompt + "\n\nThe Council's answers:\n\n" +
    answered.map((a) => "[" + a.label + "]\n" + a.text).join("\n\n") +
    "\n\nReturn exactly these four short sections:\n" +
    "1) Consensus — where they agree\n" +
    "2) Split — where they diverge and why it matters\n" +
    "3) Recommendation — the single strongest path forward\n" +
    "4) Watch-fors — what would change the answer";
  try {
    const text = await withTimeout(ch.run(system, body), DEFAULTS.seatTimeoutMs, "synthesis");
    return { ok: true, provider: ch.provider, text };
  } catch (e) {
    return { ok: false, provider: ch.provider, error: (e && e.message) || "synthesis failed" };
  }
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || "*";
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });

    const url = new URL(request.url);
    const provider = (env.PROVIDER || "claude").toLowerCase();

    if (request.method === "GET" && url.pathname === "/") {
      const seats = councilSeats(env).map((s) => s.id);
      return json({ ok: true, service: "kevinos-relay", provider, seats }, 200, origin);
    }

    // Council — fan one prompt out to every configured seat, then synthesize.
    if (request.method === "POST" && url.pathname === "/council") {
      let payload;
      try {
        payload = await request.json();
      } catch (e) {
        return json({ error: "Invalid JSON body" }, 400, origin);
      }
      const prompt = ((payload && payload.prompt) || "").toString().trim();
      const system = ((payload && payload.system) || COUNCIL_SYSTEM).toString();
      const wantSynth = !payload || payload.synthesize !== false;
      if (!prompt) return json({ error: "Missing prompt" }, 400, origin);

      const seats = councilSeats(env);
      if (!seats.length) return json({ error: "No Council seats configured on the relay" }, 500, origin);

      const results = await Promise.all(
        seats.map(async (seat) => {
          const t0 = Date.now();
          try {
            const text = await withTimeout(seat.run(system, prompt), DEFAULTS.seatTimeoutMs, seat.label);
            return {
              id: seat.id, label: seat.label, lane: seat.lane, provider: seat.provider, model: seat.model,
              ok: !!text, text: text || "", ms: Date.now() - t0, error: text ? "" : "Empty response",
            };
          } catch (err) {
            return {
              id: seat.id, label: seat.label, lane: seat.lane, provider: seat.provider, model: seat.model,
              ok: false, text: "", ms: Date.now() - t0, error: (err && err.message) || "failed",
            };
          }
        })
      );

      const answered = results.filter((r) => r.ok);
      const synthesis = wantSynth ? await synthesize(env, prompt, answered) : null;
      return json({ seats: results, synthesis, asked: results.length, answered: answered.length }, 200, origin);
    }

    // Single-model endpoint (kept for back-compat) — uses PROVIDER.
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
