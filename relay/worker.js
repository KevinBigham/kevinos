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
  openrouterModel: "qwen/qwen3-next-80b-a3b-instruct:free,meta-llama/llama-3.3-70b-instruct:free,google/gemma-4-31b-it:free",
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
  const body = { max_tokens: opts.maxTokens, messages };
  if (opts.models && opts.models.length > 1) body.models = opts.models; // OpenRouter fallback routing
  else body.model = opts.model || (opts.models && opts.models[0]);
  const r = await fetch(opts.url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) {
    let msg = (data.error && (data.error.message || data.error)) || opts.name + " error " + r.status;
    if (typeof msg !== "string") msg = opts.name + " error " + r.status;
    const meta = data.error && data.error.metadata;
    if (meta && (meta.raw || meta.provider_name)) {
      const raw = typeof meta.raw === "string" ? meta.raw : JSON.stringify(meta.raw);
      msg += " — " + (meta.provider_name ? meta.provider_name + ": " : "") + raw;
    }
    throw new Error(msg);
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
      id: "gemini", label: "Gemini", lane: "Grounded", provider: "google",
      role: "Be the grounded, fact-first voice. Anchor your answer in what is verifiably true and concrete; flag what is uncertain. Specifics over generalities.",
      model: env.GEMINI_MODEL || DEFAULTS.geminiModel,
      run: (system, prompt) => callGemini(env, system, prompt),
    });
  if (env.AI)
    seats.push({
      id: "cloudflare", label: "Llama · Cloudflare", lane: "Open-model", provider: "cloudflare",
      role: "Be the open-model wildcard. Offer the angle the mainstream models miss — an unconventional but genuinely workable approach.",
      model: env.CF_MODEL || DEFAULTS.cfModel,
      run: (system, prompt) => callCloudflare(env, system, prompt),
    });
  if (env.GROQ_API_KEY)
    seats.push({
      id: "groq", label: "Groq", lane: "Fast tactical", provider: "groq",
      role: "Be the fast tactical voice. Give the punchiest, most actionable take — what to do next, in order. Bias hard to action.",
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
      id: "mistral", label: "Mistral", lane: "Research", provider: "mistral",
      role: "Be the research voice. Bring rigor: weigh the main options, name the trade-offs, and surface edge cases and what the evidence favors.",
      model: env.MISTRAL_MODEL || DEFAULTS.mistralModel,
      run: (system, prompt) =>
        callOpenAICompatible({
          name: "Mistral", url: "https://api.mistral.ai/v1/chat/completions",
          key: env.MISTRAL_API_KEY, model: env.MISTRAL_MODEL || DEFAULTS.mistralModel,
          system, prompt, maxTokens: maxTokens(env),
        }),
    });
  if (env.OPENROUTER_API_KEY) {
    const orModels = (env.OPENROUTER_MODEL || DEFAULTS.openrouterModel)
      .split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3); // OpenRouter caps the fallback array at 3
    seats.push({
      id: "openrouter", label: "OpenRouter", lane: "Devil's advocate", provider: "openrouter",
      role: "Be the contrarian. Challenge the obvious answer; make the strongest case against the likely consensus and name the risk others will miss.",
      model: orModels[0],
      run: (system, prompt) =>
        callOpenAICompatible({
          name: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions",
          key: env.OPENROUTER_API_KEY, models: orModels, model: orModels[0],
          system, prompt, maxTokens: maxTokens(env),
          extraHeaders: {
            "HTTP-Referer": env.ALLOW_ORIGIN || "https://kevinbigham.github.io",
            "X-Title": "KevinOS Council",
          },
        }),
    });
  }
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
    "You are the Chair of Kevin's Council of AIs. Several models answered the same question independently, " +
    "each from an assigned lane (grounded, fast tactical, research, open-model, devil's advocate). " +
    "Synthesize their answers into one decision-ready brief. Be concise, specific, plain text, no preamble.";
  const body =
    "QUESTION:\n" + prompt + "\n\nThe Council's answers (each tagged with its lane):\n\n" +
    answered.map((a) => "[" + a.label + (a.lane ? " · " + a.lane : "") + "]\n" + a.text).join("\n\n") +
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

// Run a single seat with its lane role prepended, timed, never throwing.
async function runSeat(seat, system, prompt) {
  const t0 = Date.now();
  const seatSystem = seat.role ? system + "\n\n" + seat.role : system;
  const base = { id: seat.id, label: seat.label, lane: seat.lane, provider: seat.provider, model: seat.model };
  try {
    const text = await withTimeout(seat.run(seatSystem, prompt), DEFAULTS.seatTimeoutMs, seat.label);
    return { ...base, ok: !!text, text: text || "", ms: Date.now() - t0, error: text ? "" : "Empty response" };
  } catch (err) {
    return { ...base, ok: false, text: "", ms: Date.now() - t0, error: (err && err.message) || "failed" };
  }
}

// Streaming Council — emit one NDJSON line per event so the UI fills seats in
// as each model returns, instead of waiting for the whole panel.
//   {type:"start", asked, seats:[{id,label,lane,provider,model}]}
//   {type:"seat",  seat:{...}}        (one per seat, in completion order)
//   {type:"synthesis", synthesis}     (once all seats are in, if requested)
//   {type:"done",  asked, answered}
function streamCouncil(env, seats, system, prompt, wantSynth, origin) {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
      try {
        send({
          type: "start", asked: seats.length,
          seats: seats.map((s) => ({ id: s.id, label: s.label, lane: s.lane, provider: s.provider, model: s.model })),
        });
        const results = [];
        await Promise.all(
          seats.map(async (seat) => {
            const r = await runSeat(seat, system, prompt);
            results.push(r);
            send({ type: "seat", seat: r });
          })
        );
        const answered = results.filter((r) => r.ok);
        if (wantSynth) send({ type: "synthesis", synthesis: await synthesize(env, prompt, answered) });
        send({ type: "done", asked: results.length, answered: answered.length });
      } catch (e) {
        send({ type: "error", error: (e && e.message) || "stream failed" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      ...cors(origin),
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Push (Phase 2b) — VAPID + RFC 8291 aes128gcm encryption, all in WebCrypto.
// The app computes its reminder set (morning brief + per-task due) and syncs it
// here; a cron fires due reminders. The browser holds no keys; the relay signs.
// ─────────────────────────────────────────────────────────────────────────────

function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64url(b) {
  const u = new Uint8Array(b);
  let bin = "";
  for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function strToB64url(s) { return bytesToB64url(new TextEncoder().encode(s)); }
function concatBytes(arrs) {
  let n = 0; for (const a of arrs) n += a.length;
  const o = new Uint8Array(n);
  let p = 0; for (const a of arrs) { o.set(a, p); p += a.length; }
  return o;
}
function jwkFromRaw(pubB64, dB64) {
  const p = b64urlToBytes(pubB64);
  return { kty: "EC", crv: "P-256", x: bytesToB64url(p.slice(1, 33)), y: bytesToB64url(p.slice(33, 65)), d: dB64, ext: true };
}
async function sha256Hex(s) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// RFC 8291 / RFC 8188 aes128gcm body for a Web Push payload. This function was
// verified byte-for-byte against the RFC 8291 test vector before shipping.
async function encryptPayload(uaPublicB64, authSecretB64, plaintext) {
  const uaPublic = b64urlToBytes(uaPublicB64);
  const authSecret = b64urlToBytes(authSecretB64);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, kp.privateKey, 256));
  const enc = new TextEncoder();
  const keyInfo = concatBytes([enc.encode("WebPush: info\0"), uaPublic, asPublic]);
  const ecdhKey = await crypto.subtle.importKey("raw", ecdh, "HKDF", false, ["deriveBits"]);
  const ikm = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: authSecret, info: keyInfo }, ecdhKey, 256));
  const ikmKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const cek = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: enc.encode("Content-Encoding: aes128gcm\0") }, ikmKey, 128));
  const nonce = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: enc.encode("Content-Encoding: nonce\0") }, ikmKey, 96));
  const record = concatBytes([enc.encode(plaintext), new Uint8Array([2])]);
  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, tagLength: 128 }, aesKey, record));
  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false);
  header[20] = asPublic.length;
  header.set(asPublic, 21);
  return concatBytes([header, ct]);
}

// VAPID (RFC 8292) Authorization header for a given push endpoint.
async function vapidAuthHeader(endpoint, env) {
  const aud = new URL(endpoint).origin;
  const sub = env.VAPID_SUBJECT || "https://kevinbigham.github.io/kevinos/";
  const header = strToB64url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = strToB64url(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 43200, sub }));
  const signingInput = header + "." + payload;
  const key = await crypto.subtle.importKey("jwk", jwkFromRaw(env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(signingInput));
  return "vapid t=" + signingInput + "." + bytesToB64url(sig) + ", k=" + env.VAPID_PUBLIC_KEY;
}

// Encrypt + sign + POST one push. Returns the push service's HTTP status.
async function sendPush(subscription, payloadObj, env, ttl) {
  const body = await encryptPayload(subscription.keys.p256dh, subscription.keys.auth, JSON.stringify(payloadObj));
  const res = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "TTL": String(ttl || 86400),
      "Authorization": await vapidAuthHeader(subscription.endpoint, env),
    },
    body,
  });
  return { status: res.status };
}

// Cron: fire every reminder whose time has arrived, then drop it (the app owns
// recurrence by re-syncing the next occurrence). Stale ones (>1h late) are pruned
// unsent; a 404/410 means the subscription is gone, so we delete the record.
async function firePush(env) {
  if (!env.PUSH || !env.VAPID_PRIVATE_KEY) return;
  const now = Date.now();
  const grace = 3600 * 1000;
  const list = await env.PUSH.list({ prefix: "sub:" });
  for (const k of list.keys) {
    const raw = await env.PUSH.get(k.name);
    if (!raw) continue;
    let rec;
    try { rec = JSON.parse(raw); } catch (e) { continue; }
    const all = Array.isArray(rec.reminders) ? rec.reminders : [];
    const due = all.filter((r) => r.fireAt <= now && r.fireAt > now - grace);
    const future = all.filter((r) => r.fireAt > now);
    if (future.length !== all.length) { rec.reminders = future; await env.PUSH.put(k.name, JSON.stringify(rec)); }
    for (const r of due) {
      try {
        const res = await sendPush(rec.subscription, { title: r.title, body: r.body, url: r.url, tag: r.tag }, env, 86400);
        if (res.status === 404 || res.status === 410) { await env.PUSH.delete(k.name); break; }
      } catch (e) { /* drop on failure — a missed reminder beats a stuck queue */ }
    }
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
      return json({ ok: true, service: "kevinos-relay", provider, seats, push: !!env.VAPID_PUBLIC_KEY }, 200, origin);
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
      const wantStream = !!(payload && payload.stream);
      if (!prompt) return json({ error: "Missing prompt" }, 400, origin);

      const seats = councilSeats(env);
      if (!seats.length) return json({ error: "No Council seats configured on the relay" }, 500, origin);

      if (wantStream) return streamCouncil(env, seats, system, prompt, wantSynth, origin);

      const results = await Promise.all(seats.map((seat) => runSeat(seat, system, prompt)));

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

    // Web Push — the VAPID public key, so the app never has to hardcode it.
    if (request.method === "GET" && url.pathname === "/push/key") {
      return json({ publicKey: env.VAPID_PUBLIC_KEY || "" }, 200, origin);
    }

    // Web Push — store the subscription + the app's computed reminder set.
    if (request.method === "POST" && url.pathname === "/push/sync") {
      if (!env.PUSH) return json({ error: "Push storage not configured on the relay" }, 500, origin);
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const sub = payload && payload.subscription;
      if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth)
        return json({ error: "Missing or invalid subscription" }, 400, origin);
      const reminders = Array.isArray(payload.reminders)
        ? payload.reminders.filter((r) => r && typeof r.fireAt === "number" && r.title).slice(0, 200)
        : [];
      await env.PUSH.put("sub:" + (await sha256Hex(sub.endpoint)), JSON.stringify({ subscription: sub, reminders, updatedAt: Date.now() }));
      return json({ ok: true, count: reminders.length }, 200, origin);
    }

    // Web Push — forget a subscription.
    if (request.method === "POST" && url.pathname === "/push/unsubscribe") {
      if (!env.PUSH) return json({ error: "Push storage not configured on the relay" }, 500, origin);
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const endpoint = payload && payload.endpoint;
      if (!endpoint) return json({ error: "Missing endpoint" }, 400, origin);
      await env.PUSH.delete("sub:" + (await sha256Hex(endpoint)));
      return json({ ok: true }, 200, origin);
    }

    // Web Push — send a test notification right now (confirms real device delivery).
    if (request.method === "POST" && url.pathname === "/push/test") {
      if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY) return json({ error: "VAPID keys not configured on the relay" }, 500, origin);
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const sub = payload && payload.subscription;
      if (!sub || !sub.endpoint || !sub.keys) return json({ error: "Missing subscription" }, 400, origin);
      try {
        const res = await sendPush(sub, {
          title: payload.title || "KevinOS reminders are on ✓",
          body: payload.body || "You'll get your morning brief and task nudges right here.",
          url: payload.url || "https://kevinbigham.github.io/kevinos/",
          tag: "kevinos-test",
        }, env, 60);
        return json({ ok: res.status >= 200 && res.status < 300, status: res.status }, 200, origin);
      } catch (e) {
        return json({ error: (e && e.message) || "push failed" }, 502, origin);
      }
    }

    return json({ error: "Not found" }, 404, origin);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(firePush(env));
  },
};
