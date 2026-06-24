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
// Calendar / File AI (Phase 4) — extract events from typed text, a photo/
// screenshot, or a PDF using Gemini's multimodal model, returned as strict JSON.
// ─────────────────────────────────────────────────────────────────────────────
async function extractEvents(env, payload) {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set on the relay");
  const model = env.GEMINI_MODEL || DEFAULTS.geminiModel;
  const today = (payload.today || "").toString();
  const tz = (payload.tz || "").toString();
  const instr =
    "You extract calendar events from the input, which may be typed text, an image/screenshot of a flyer or schedule, or a PDF. " +
    "Today is " + (today || "unknown") + (tz ? " (timezone " + tz + ")" : "") + ". " +
    "Resolve every relative date ('next Saturday', 'tomorrow', 'the 15th') against today. " +
    'Return ONLY a JSON array. Each event = {"title":string,"date":"YYYY-MM-DD","start":"HH:MM" 24-hour or "","end":"HH:MM" or "","allDay":boolean,"location":string,"notes":string}. ' +
    'Use "" for anything unknown. If the input contains no real events, return []. No prose, no markdown.';
  const parts = [{ text: instr }];
  if (payload.text) parts.push({ text: "INPUT TEXT:\n" + payload.text.toString().slice(0, 20000) });
  if (payload.file && payload.file.dataB64 && payload.file.mime)
    parts.push({ inlineData: { mimeType: payload.file.mime, data: payload.file.dataB64 } });

  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + env.GEMINI_API_KEY;
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error((data.error && data.error.message) || "Gemini error " + r.status);
  const cand = (data.candidates || [])[0];
  const txt = (((cand && cand.content && cand.content.parts) || []).map((p) => p.text || "").join("")).trim();
  let arr = null;
  try { arr = JSON.parse(txt); } catch (e) {
    const a = txt.indexOf("["), b = txt.lastIndexOf("]");
    if (a >= 0 && b > a) { try { arr = JSON.parse(txt.slice(a, b + 1)); } catch (e2) { arr = null; } }
  }
  if (!Array.isArray(arr)) throw new Error("Could not parse events from the model");
  const clean = [];
  for (const ev of arr.slice(0, 50)) {
    if (!ev || typeof ev !== "object") continue;
    const title = (ev.title || "").toString().trim().slice(0, 200);
    const date = (ev.date || "").toString().trim();
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const start = /^\d{1,2}:\d{2}$/.test((ev.start || "").toString()) ? normHM(ev.start) : "";
    const end = /^\d{1,2}:\d{2}$/.test((ev.end || "").toString()) ? normHM(ev.end) : "";
    clean.push({
      title, date, start, end,
      allDay: ev.allDay === true || !start,
      location: (ev.location || "").toString().trim().slice(0, 200),
      notes: (ev.notes || "").toString().trim().slice(0, 1000),
    });
  }
  return clean;
}
function normHM(s) { const p = s.toString().split(":"); return (p[0].length < 2 ? "0" + p[0] : p[0]) + ":" + p[1].slice(0, 2); }

// Council → action (Phase post-5): decompose a decision/notes blob into concrete
// next-action tasks, each tagged with a life area. Same Gemini-JSON shape as /extract.
async function extractActions(env, payload) {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set on the relay");
  const model = env.GEMINI_MODEL || DEFAULTS.geminiModel;
  const areas = (Array.isArray(payload.areas) && payload.areas.length) ? payload.areas.slice(0, 12) : ["Work", "Coaching", "Teaching", "Personal", "Ana", "Inbox"];
  const instr =
    "Turn the following decision, notes, or discussion into a short list of concrete next-step tasks for Kevin to act on. " +
    "Each task is ONE clear action that starts with a verb and is small enough to finish in a single sitting. At most 8 tasks; fewer if that's all that's warranted. " +
    "Assign each an area from this list: " + areas.join(", ") + ' (use "Inbox" if unsure). ' +
    'Return ONLY a JSON array: [{"text":string,"area":string}]. No commentary.';
  const text = (payload.text || "").toString().slice(0, 12000);
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + env.GEMINI_API_KEY;
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: instr + "\n\n---\n" + text }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }) });
  const data = await r.json();
  if (!r.ok) throw new Error((data.error && data.error.message) || "Gemini error " + r.status);
  const cand = (data.candidates || [])[0];
  const txt = (((cand && cand.content && cand.content.parts) || []).map((p) => p.text || "").join("")).trim();
  let arr = null;
  try { arr = JSON.parse(txt); } catch (e) { const a = txt.indexOf("["), b = txt.lastIndexOf("]"); if (a >= 0 && b > a) { try { arr = JSON.parse(txt.slice(a, b + 1)); } catch (e2) { arr = null; } } }
  if (!Array.isArray(arr)) throw new Error("Could not parse tasks");
  const okAreas = {}; areas.forEach((a) => { okAreas[a] = 1; });
  const out = [];
  for (const t of arr.slice(0, 8)) {
    const txt2 = ((t && t.text) || "").toString().trim().slice(0, 200);
    if (!txt2) continue;
    let area = ((t && t.area) || "Inbox").toString().trim();
    if (!okAreas[area]) area = "Inbox";
    out.push({ text: txt2, area });
  }
  return out;
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
        let body = r.body, title = r.title, skip = false;
        if (r.gen === "brief") {
          // Generate the brief FRESH right now (synced tasks/events + live inbox),
          // not the static body the app synced days ago. Falls back to r.body.
          try { body = await buildServerBrief(env, { syncKey: r.syncKey, emailSession: r.emailSession, dateKey: r.dateKey, fallback: r.body }); } catch (e) { body = r.body; }
        } else if (r.gen === "weekly") {
          // Sunday-evening weekly review, written fresh from the synced week.
          try { body = await buildWeeklyReview(env, { syncKey: r.syncKey, emailSession: r.emailSession, dateKey: r.dateKey, fallback: r.body }); } catch (e) { body = r.body; }
        } else if (r.gen === "draft") {
          // Pre-draft replies to real overnight mail; notify only if there are any.
          try {
            const dr = await generateOvernightDrafts(env, r.emailSession, 5);
            if (!dr.count) skip = true;
            else { title = "📝 Replies drafted"; body = dr.count + (dr.count === 1 ? " reply is" : " replies are") + " ready to review & send in KevinOS."; }
          } catch (e) { skip = true; }
        }
        if (skip) continue;
        const res = await sendPush(rec.subscription, { title: title, body: body, url: r.url, tag: r.tag }, env, 86400);
        if (res.status === 404 || res.status === 410) { await env.PUSH.delete(k.name); break; }
      } catch (e) { /* drop on failure — a missed reminder beats a stuck queue */ }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub OAuth (Phase 2b) — the token lives on the relay, never in the browser.
// The app opens /github/login (→ GitHub consent), the callback stores the token
// in KV under the app's session id, and the app proxies GraphQL through /github/
// graphql. Disconnect revokes the token on GitHub and forgets it.
// ─────────────────────────────────────────────────────────────────────────────

function ghEsc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

function ghHtmlPage(msg) {
  return new Response(
    "<!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'><title>KevinOS · GitHub</title>" +
    "<body style='font-family:-apple-system,system-ui,sans-serif;background:#f4efe6;color:#2b2433;display:flex;min-height:88vh;align-items:center;justify-content:center;text-align:center;padding:24px'>" +
    "<div style='max-width:340px'><div style='font-size:42px;margin-bottom:12px'>🔗</div>" +
    "<h2 style='margin:0 0 8px;font-weight:600'>" + ghEsc(msg) + "</h2>" +
    "<p style='color:#6b6477;line-height:1.5'>You can close this tab and return to KevinOS — it’ll pick up automatically.</p></div></body>",
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// Best-effort token revocation so "Disconnect" truly cuts GitHub access.
async function ghRevoke(env, token) {
  try {
    await fetch("https://api.github.com/applications/" + env.GITHUB_CLIENT_ID + "/token", {
      method: "DELETE",
      headers: {
        Authorization: "Basic " + btoa(env.GITHUB_CLIENT_ID + ":" + env.GITHUB_CLIENT_SECRET),
        "User-Agent": "kevinos-relay",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ access_token: token }),
    });
  } catch (e) { /* best-effort */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email Command Center (Phase 5) — multi-account Gmail via OAuth. Tokens live on
// the relay (refreshable), never in the browser. AI drafts replies; the user
// approves and the relay sends (gmail.send). Reuses the PUSH KV with a gml: key.
// ─────────────────────────────────────────────────────────────────────────────
const GOOGLE_SCOPE = "openid email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send";

function gPage(msg) {
  return new Response(
    "<!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'><title>KevinOS · Email</title>" +
    "<body style='font-family:-apple-system,system-ui,sans-serif;background:#f4efe6;color:#2b2433;display:flex;min-height:88vh;align-items:center;justify-content:center;text-align:center;padding:24px'>" +
    "<div style='max-width:340px'><div style='font-size:42px;margin-bottom:12px'>✉️</div>" +
    "<h2 style='margin:0 0 8px;font-weight:600'>" + ghEsc(msg) + "</h2>" +
    "<p style='color:#6b6477;line-height:1.5'>You can close this tab and return to KevinOS — it’ll pick up automatically.</p></div></body>",
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
async function gmailGetRec(env, session) {
  if (!env.PUSH || !session) return null;
  const raw = await env.PUSH.get("gml:" + session);
  return raw ? JSON.parse(raw) : null;
}
async function gmailPutRec(env, session, rec) { await env.PUSH.put("gml:" + session, JSON.stringify(rec)); }
function gmailFindAccount(rec, account) {
  if (!rec || !rec.accounts || !rec.accounts.length) return null;
  if (account) return rec.accounts.find((a) => a.email === account) || null;
  return rec.accounts[0];
}
// A valid access token for the account, refreshing via the refresh_token if expired.
async function gmailAccessToken(env, acct) {
  if (acct.access && acct.exp && Date.now() < acct.exp - 60000) return acct.access;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: acct.refresh, grant_type: "refresh_token" }),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error((j && j.error_description) || "token refresh failed");
  acct.access = j.access_token; acct.exp = Date.now() + (j.expires_in || 3600) * 1000;
  return acct.access;
}
function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecodeStr(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
  const bin = atob(s); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function gmailHeader(headers, name) {
  const h = (headers || []).find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : "";
}
function gmailBodyText(payload) {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body && payload.body.data) return b64urlDecodeStr(payload.body.data);
  if (payload.parts) {
    for (const p of payload.parts) { if (p.mimeType === "text/plain" && p.body && p.body.data) return b64urlDecodeStr(p.body.data); }
    for (const p of payload.parts) { const t = gmailBodyText(p); if (t) return t; }
  }
  if (payload.body && payload.body.data) return b64urlDecodeStr(payload.body.data);
  return "";
}
function gmailApi(token, path, init) {
  return fetch("https://gmail.googleapis.com/gmail/v1/users/me" + path, {
    ...(init || {}),
    headers: { Authorization: "Bearer " + token, ...(init && init.headers) },
  });
}
// Smart-inbox bucket from Gmail's own category labels (free — Gmail already
// classified): primary = real mail that may need you; fyi = updates/receipts;
// noise = promotions/social. The app groups the inbox by this.
function gmailCategory(labelIds) {
  const L = labelIds || [];
  if (L.indexOf("CATEGORY_PROMOTIONS") >= 0 || L.indexOf("CATEGORY_SOCIAL") >= 0) return "noise";
  if (L.indexOf("CATEGORY_UPDATES") >= 0 || L.indexOf("CATEGORY_FORUMS") >= 0) return "fyi";
  return "primary";
}
// Recent inbox messages for ONE account, each tagged with its account, a parsed
// timestamp (for merging across accounts), and its smart-inbox category. Shared
// by the single-account view and the unified (all-account) inbox.
async function gmailInbox(env, acct, max) {
  const token = await gmailAccessToken(env, acct);
  const lr = await gmailApi(token, "/messages?labelIds=INBOX&maxResults=" + (max || 12));
  const lj = await lr.json();
  if (!lr.ok) throw new Error((lj.error && lj.error.message) || "gmail error");
  const out = [];
  for (const m of (lj.messages || [])) {
    const mr = await gmailApi(token, "/messages/" + m.id + "?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date");
    const mj = await mr.json();
    if (!mr.ok) continue;
    const hs = mj.payload && mj.payload.headers;
    const dateStr = gmailHeader(hs, "Date");
    out.push({ id: mj.id, threadId: mj.threadId, account: acct.email, from: gmailHeader(hs, "From"), subject: gmailHeader(hs, "Subject"), date: dateStr, ts: Date.parse(dateStr) || (Number(mj.internalDate) || 0), snippet: mj.snippet || "", unread: (mj.labelIds || []).indexOf("UNREAD") >= 0, category: gmailCategory(mj.labelIds) });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Proactive Brief 2.0 — the relay writes the morning brief FRESH at send time
// (cron) from the user's synced data + a live inbox peek, so it's smart even when
// the app is closed. Used by POST /brief (app card + tests) and by firePush (8am).
// ─────────────────────────────────────────────────────────────────────────────
function briefDigest(doc, D) {
  const items = Array.isArray(doc && doc.items) ? doc.items : [];
  const events = Array.isArray(doc && doc.events) ? doc.events : [];
  const tasks = items.filter((i) => i && !i.done && (i.due === D || i.today === true || (i.due && i.due < D)));
  tasks.sort((a, b) => { const ad = a.due || "9999-99-99", bd = b.due || "9999-99-99"; return ad < bd ? -1 : ad > bd ? 1 : 0; });
  const overdue = items.filter((i) => i && !i.done && i.due && i.due < D).length;
  const evs = events.filter((e) => e && e.date === D).sort((a, b) => ((a.time || "99:99") < (b.time || "99:99") ? -1 : 1));
  return { nTasks: tasks.length, nEvents: evs.length, overdue, tasks: tasks.slice(0, 12), events: evs.slice(0, 12) };
}
function briefDigestText(dg, D) {
  const L = [];
  if (D) L.push("Date: " + D);
  if (dg.overdue) L.push("Overdue tasks: " + dg.overdue);
  L.push("Tasks today (" + dg.nTasks + "):");
  if (dg.tasks.length) dg.tasks.forEach((t) => L.push("- " + (t.text || "(untitled)") + (t.area && t.area !== "Inbox" ? " [" + t.area + "]" : "")));
  else L.push("- none");
  L.push("Events today (" + dg.nEvents + "):");
  if (dg.events.length) dg.events.forEach((e) => L.push("- " + (e.time ? e.time : "all day") + " " + (e.title || "(untitled)")));
  else L.push("- none");
  return L.join("\n");
}
// Lightweight inbox peek: unread count + a few real subjects/senders across accounts.
async function briefInbox(env, session) {
  const rec = await gmailGetRec(env, session);
  if (!rec || !rec.accounts || !rec.accounts.length) return null;
  let unread = 0; const subjects = [];
  for (const acct of rec.accounts) {
    try {
      const token = await gmailAccessToken(env, acct);
      const r = await gmailApi(token, "/messages?q=" + encodeURIComponent("is:unread in:inbox") + "&maxResults=5");
      const j = await r.json();
      const ids = j.messages || [];
      unread += typeof j.resultSizeEstimate === "number" ? j.resultSizeEstimate : ids.length;
      for (const m of ids.slice(0, 3)) {
        try {
          const mr = await gmailApi(token, "/messages/" + m.id + "?format=metadata&metadataHeaders=Subject&metadataHeaders=From");
          const mj = await mr.json();
          const hs = (mj.payload && mj.payload.headers) || [];
          subjects.push({ from: gmailHeader(hs, "From"), subject: gmailHeader(hs, "Subject") });
        } catch (e) { /* skip one message */ }
      }
    } catch (e) { /* skip one account */ }
  }
  try { await gmailPutRec(env, session, rec); } catch (e) { /* persist refreshed tokens, best-effort */ }
  return { unread, subjects };
}
async function buildServerBrief(env, opts) {
  const fallback = (opts.fallback || "").toString();
  if (!env.GEMINI_API_KEY) return fallback;
  // 1) Day context: prefer app-supplied context; else read the synced D1 doc.
  let context = (opts.context || "").toString();
  if (!context && opts.syncKey && /^[a-f0-9]{16,128}$/.test(opts.syncKey) && env.SYNC) {
    try {
      const row = await env.SYNC.prepare("SELECT doc FROM docs WHERE id = ?").bind(opts.syncKey).first();
      if (row && row.doc) context = briefDigestText(briefDigest(JSON.parse(row.doc), opts.dateKey), opts.dateKey);
    } catch (e) { /* fall through to whatever we have */ }
  }
  // 2) Live inbox peek (optional).
  let inbox = null;
  if (opts.emailSession) { try { inbox = await briefInbox(env, opts.emailSession); } catch (e) { inbox = null; } }
  if (!context && !inbox) return fallback;
  const lines = [];
  if (context) lines.push(context);
  if (inbox) {
    lines.push("", "Inbox: " + inbox.unread + " unread");
    inbox.subjects.forEach((s) => lines.push("- from " + (s.from || "?") + ": " + (s.subject || "(no subject)")));
  }
  const system = "You are Kevin's calm daily assistant inside KevinOS. Write a SHORT morning brief — 2 to 4 sentences, warm but efficient — orienting him to his day: what's on the calendar, what to tackle first, and whether any emails truly need a human reply (call out real personal or business emails by sender; ignore marketing/newsletters). Plain text. No lists, no preamble, no greeting line, no sign-off.";
  try {
    const text = await callGemini(env, system, "Here is my day. Write my morning brief.\n\n" + lines.join("\n"));
    return text && text.trim() ? text.trim().slice(0, 350) : fallback;
  } catch (e) { return fallback; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly review — a Sunday-evening "here's your week" brief, built from the same
// synced doc as the morning brief. Forward-looking: the next 7 days of events +
// open priorities (overdue first) + builds in flight, so Kevin starts the week
// oriented. Used by POST /weekly and by firePush (Sunday) via buildWeeklyReview.
// ─────────────────────────────────────────────────────────────────────────────
function addDaysKey(k, n) {
  const p = String(k).split("-");
  const d = new Date(Date.UTC(Number(p[0]) || 1970, (Number(p[1]) || 1) - 1, (Number(p[2]) || 1) + n));
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0"), dd = String(d.getUTCDate()).padStart(2, "0");
  return d.getUTCFullYear() + "-" + mm + "-" + dd;
}
function weeklyDigest(doc, D) {
  const items = Array.isArray(doc && doc.items) ? doc.items : [];
  const events = Array.isArray(doc && doc.events) ? doc.events : [];
  const builds = Array.isArray(doc && doc.builds) ? doc.builds : [];
  const end = D ? addDaysKey(D, 7) : "9999-99-99";
  const open = items.filter((i) => i && !i.done);
  const overdue = D ? open.filter((i) => i.due && i.due < D) : [];
  const dueWeek = open.filter((i) => i.due && (!D || i.due >= D) && i.due <= end);
  dueWeek.sort((a, b) => { const ad = a.due || "9999", bd = b.due || "9999"; return ad < bd ? -1 : ad > bd ? 1 : 0; });
  const evs = events.filter((e) => e && e.date && (!D || e.date >= D) && e.date <= end)
    .sort((a, b) => ((a.date + (a.time || "99:99")) < (b.date + (b.time || "99:99")) ? -1 : 1));
  const active = builds.filter((b) => b && (b.stage === "Idea" || b.stage === "Building" || b.stage === "Testing"));
  return { nOpen: open.length, overdue: overdue.slice(0, 12), nOverdue: overdue.length, nEvents: evs.length, events: evs.slice(0, 12), dueWeek: dueWeek.slice(0, 12), builds: active.slice(0, 8) };
}
function weeklyDigestText(wd, D) {
  const L = [];
  if (D) L.push("Week starting: " + D);
  L.push("Open tasks: " + wd.nOpen + (wd.nOverdue ? " (" + wd.nOverdue + " overdue)" : ""));
  if (wd.overdue.length) { L.push("", "Overdue (clear these first):"); wd.overdue.forEach((t) => L.push("- " + (t.due || "") + " " + (t.text || "(untitled)") + (t.area && t.area !== "Inbox" ? " [" + t.area + "]" : ""))); }
  L.push("", "Due this week (" + wd.dueWeek.length + "):");
  if (wd.dueWeek.length) wd.dueWeek.forEach((t) => L.push("- " + (t.due || "") + " " + (t.text || "(untitled)") + (t.area && t.area !== "Inbox" ? " [" + t.area + "]" : ""))); else L.push("- none");
  L.push("", "Events this week (" + wd.nEvents + "):");
  if (wd.events.length) wd.events.forEach((e) => L.push("- " + (e.date || "") + " " + (e.time ? e.time : "all day") + " " + (e.title || "(untitled)"))); else L.push("- none");
  if (wd.builds.length) { L.push("", "In the studio:"); wd.builds.forEach((b) => L.push("- " + (b.name || "(untitled)") + " [" + (b.stage || "") + "]" + (b.next ? " → " + b.next : ""))); }
  return L.join("\n");
}
async function buildWeeklyReview(env, opts) {
  const fallback = (opts.fallback || "").toString();
  if (!env.GEMINI_API_KEY) return fallback;
  // 1) Week context: prefer app-supplied context; else read the synced D1 doc.
  let context = (opts.context || "").toString();
  if (!context && opts.syncKey && /^[a-f0-9]{16,128}$/.test(opts.syncKey) && env.SYNC) {
    try {
      const row = await env.SYNC.prepare("SELECT doc FROM docs WHERE id = ?").bind(opts.syncKey).first();
      if (row && row.doc) context = weeklyDigestText(weeklyDigest(JSON.parse(row.doc), opts.dateKey), opts.dateKey);
    } catch (e) { /* fall through to whatever we have */ }
  }
  // 2) Live inbox peek (optional).
  let inbox = null;
  if (opts.emailSession) { try { inbox = await briefInbox(env, opts.emailSession); } catch (e) { inbox = null; } }
  if (!context && !inbox) return fallback;
  const lines = [];
  if (context) lines.push(context);
  if (inbox) {
    lines.push("", "Inbox: " + inbox.unread + " unread");
    inbox.subjects.forEach((s) => lines.push("- from " + (s.from || "?") + ": " + (s.subject || "(no subject)")));
  }
  const system = "You are Kevin's calm assistant inside KevinOS. It's Sunday evening. Write a SHORT weekly review — 3 to 5 sentences, warm and grounding — that orients him to the week ahead: the big rocks on the calendar, which priorities to protect time for, anything overdue to clear first, and one thing worth teeing up tonight. Plain text. No lists, no preamble, no greeting line, no sign-off.";
  try {
    const text = await callGemini(env, system, "Here is my week ahead. Write my Sunday weekly review.\n\n" + lines.join("\n"));
    return text && text.trim() ? text.trim().slice(0, 520) : fallback;
  } catch (e) { return fallback; }
}

// Overnight auto-drafts — for each REAL unread inbox message (Gmail's primary
// category, not from me), Gemini pre-writes a reply (or returns SKIP for things
// that need none). Stored in KV (gdraft:<session>) for the app to review & send
// in the morning. NEVER sends. Cap bounds cost/time.
async function generateOvernightDrafts(env, session, max) {
  if (!env.GEMINI_API_KEY || !env.PUSH || !session) return { count: 0, drafts: [] };
  const rec = await gmailGetRec(env, session);
  if (!rec || !rec.accounts || !rec.accounts.length) return { count: 0, drafts: [] };
  const cap = max || 5;
  const drafts = [];
  for (const acct of rec.accounts) {
    if (drafts.length >= cap) break;
    try {
      const token = await gmailAccessToken(env, acct);
      const q = "is:unread in:inbox category:primary -from:me";
      const lr = await gmailApi(token, "/messages?q=" + encodeURIComponent(q) + "&maxResults=" + cap);
      const lj = await lr.json();
      if (!lr.ok) continue;
      for (const m of (lj.messages || [])) {
        if (drafts.length >= cap) break;
        try {
          const mr = await gmailApi(token, "/messages/" + m.id + "?format=full");
          const mj = await mr.json();
          if (!mr.ok) continue;
          const hs = mj.payload && mj.payload.headers;
          const from = gmailHeader(hs, "From"), subject = gmailHeader(hs, "Subject");
          const msgId = gmailHeader(hs, "Message-ID") || gmailHeader(hs, "Message-Id");
          const bodyText = gmailBodyText(mj.payload).slice(0, 8000);
          const sys = "You are " + acct.email + ", writing a reply as this person. Draft a clear, warm, concise reply. Return ONLY the reply body text — no subject line, no email headers, a simple sign-off is fine. If the email is marketing, automated, a receipt, or clearly needs no reply, return exactly the single word SKIP.";
          const draft = (await callGemini(env, sys, "Reply to this email.\n\nFrom: " + from + "\nSubject: " + subject + "\n\n" + bodyText)).trim();
          if (!draft || /^skip\.?$/i.test(draft)) continue;
          drafts.push({ id: m.id, account: acct.email, from, to: from, subject: /^re:/i.test(subject) ? subject : ("Re: " + subject), body: draft, threadId: mj.threadId, messageId: msgId, snippet: mj.snippet || "" });
        } catch (e) { /* skip one message */ }
      }
      await gmailPutRec(env, session, rec);
    } catch (e) { /* skip one account */ }
  }
  await env.PUSH.put("gdraft:" + session, JSON.stringify({ drafts, generatedAt: Date.now() }));
  return { count: drafts.length, drafts };
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || "*";
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin) });

    const url = new URL(request.url);
    const provider = (env.PROVIDER || "claude").toLowerCase();

    if (request.method === "GET" && url.pathname === "/") {
      const seats = councilSeats(env).map((s) => s.id);
      return json({ ok: true, service: "kevinos-relay", provider, seats, push: !!env.VAPID_PUBLIC_KEY, github: !!env.GITHUB_CLIENT_ID, sync: !!env.SYNC, extract: !!env.GEMINI_API_KEY, email: !!env.GOOGLE_CLIENT_ID }, 200, origin);
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

    // Calendar / File AI — extract events from text / photo / PDF.
    if (request.method === "POST" && url.pathname === "/extract") {
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      if (!payload || (!payload.text && !(payload.file && payload.file.dataB64)))
        return json({ error: "Provide text or a file to extract from" }, 400, origin);
      try {
        const events = await extractEvents(env, payload);
        return json({ ok: true, events }, 200, origin);
      } catch (e) {
        return json({ error: (e && e.message) || "extract failed" }, 502, origin);
      }
    }

    // Council → action — turn a decision/notes blob into next-action tasks.
    if (request.method === "POST" && url.pathname === "/actions") {
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      if (!payload || !payload.text) return json({ error: "Provide text to turn into tasks" }, 400, origin);
      try {
        const tasks = await extractActions(env, payload);
        return json({ ok: true, tasks }, 200, origin);
      } catch (e) {
        return json({ error: (e && e.message) || "actions failed" }, 502, origin);
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

    // GitHub OAuth — start: bounce the browser to GitHub's consent screen.
    if (request.method === "GET" && url.pathname === "/github/login") {
      if (!env.GITHUB_CLIENT_ID) return ghHtmlPage("GitHub isn’t configured on the relay yet.");
      const session = url.searchParams.get("session") || "";
      if (!session) return ghHtmlPage("Missing session — start from KevinOS.");
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: url.origin + "/github/callback",
        scope: "read:user repo",
        state: session,
        allow_signup: "false",
      });
      return Response.redirect("https://github.com/login/oauth/authorize?" + params.toString(), 302);
    }

    // GitHub OAuth — callback: exchange the code for a token, store it under the session.
    if (request.method === "GET" && url.pathname === "/github/callback") {
      const code = url.searchParams.get("code"), session = url.searchParams.get("state");
      if (!code || !session) return ghHtmlPage("Authorization was cancelled or incomplete.");
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.PUSH) return ghHtmlPage("GitHub isn’t fully configured on the relay.");
      try {
        const tr = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "kevinos-relay" },
          body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: url.origin + "/github/callback" }),
        });
        const tok = await tr.json();
        if (!tok.access_token) return ghHtmlPage("GitHub didn’t return a token (" + ((tok.error_description || tok.error || "unknown") + "") + ").");
        let login = "";
        try {
          const ur = await fetch("https://api.github.com/user", { headers: { Authorization: "bearer " + tok.access_token, "User-Agent": "kevinos-relay", Accept: "application/vnd.github+json" } });
          const uj = await ur.json();
          login = (uj && uj.login) || "";
        } catch (e) { /* login is cosmetic */ }
        await env.PUSH.put("gh:" + session, JSON.stringify({ token: tok.access_token, login: login, createdAt: Date.now() }));
        return ghHtmlPage(login ? "Connected as @" + login + " ✓" : "GitHub connected ✓");
      } catch (e) {
        return ghHtmlPage("Couldn’t complete GitHub sign-in. Please try again.");
      }
    }

    // GitHub OAuth — status poll (the app waits on this after opening the consent tab).
    if (request.method === "GET" && url.pathname === "/github/status") {
      if (!env.PUSH) return json({ connected: false }, 200, origin);
      const session = url.searchParams.get("session") || "";
      const raw = session ? await env.PUSH.get("gh:" + session) : null;
      const rec = raw ? JSON.parse(raw) : null;
      return json({ connected: !!(rec && rec.token), login: (rec && rec.login) || "" }, 200, origin);
    }

    // GitHub — proxy a GraphQL query using the stored token (the browser never sees it).
    if (request.method === "POST" && url.pathname === "/github/graphql") {
      if (!env.PUSH) return json({ error: "GitHub not configured on the relay" }, 500, origin);
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const session = payload && payload.session, query = payload && payload.query;
      if (!session || !query) return json({ error: "Missing session or query" }, 400, origin);
      const raw = await env.PUSH.get("gh:" + session);
      const rec = raw ? JSON.parse(raw) : null;
      if (!rec || !rec.token) return json({ error: "not connected" }, 401, origin);
      const gr = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: { Authorization: "bearer " + rec.token, "Content-Type": "application/json", "User-Agent": "kevinos-relay" },
        body: JSON.stringify({ query: query, variables: (payload && payload.variables) || undefined }),
      });
      if (gr.status === 401) { await env.PUSH.delete("gh:" + session); return json({ error: "github auth" }, 401, origin); }
      const data = await gr.json();
      return json(data, gr.status, origin);
    }

    // GitHub — disconnect: revoke the token on GitHub, then forget it.
    if (request.method === "POST" && url.pathname === "/github/logout") {
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const session = payload && payload.session;
      if (session && env.PUSH) {
        const raw = await env.PUSH.get("gh:" + session);
        const rec = raw ? JSON.parse(raw) : null;
        if (rec && rec.token && env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) await ghRevoke(env, rec.token);
        await env.PUSH.delete("gh:" + session);
      }
      return json({ ok: true }, 200, origin);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cross-device sync (Phase 3) — one last-write-wins document per passphrase.
    // The app derives id = sha256(passphrase) client-side and never sends the
    // phrase itself; the D1 credential lives here, never in the browser.
    // ─────────────────────────────────────────────────────────────────────────

    // Sync — pull the current document for a key.
    if (request.method === "POST" && url.pathname === "/sync/pull") {
      if (!env.SYNC) return json({ error: "Sync storage not configured on the relay" }, 500, origin);
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const key = ((payload && payload.key) || "").toString();
      if (!/^[a-f0-9]{16,128}$/.test(key)) return json({ error: "Missing or invalid key" }, 400, origin);
      const row = await env.SYNC.prepare("SELECT doc, updated_at, rev FROM docs WHERE id = ?").bind(key).first();
      if (!row) return json({ ok: true, doc: null, updatedAt: 0, rev: 0 }, 200, origin);
      let doc = null;
      try { doc = JSON.parse(row.doc); } catch (e) { /* corrupt row → treat as empty */ }
      return json({ ok: true, doc, updatedAt: row.updated_at, rev: row.rev }, 200, origin);
    }

    // Sync — push a document. Server-authoritative ordering: optimistic
    // concurrency on `rev` (a server-incremented counter), NEVER the client
    // wall-clock — two devices' clocks can skew, which silently blocked
    // propagation (and could wipe the loser on reconcile). A push is accepted
    // only when its baseRev matches the stored rev (or force=true, or there's
    // no stored doc); otherwise the app gets the current doc back, merges, and
    // retries. updated_at is stamped server-side (one clock) for display only.
    if (request.method === "POST" && url.pathname === "/sync/push") {
      if (!env.SYNC) return json({ error: "Sync storage not configured on the relay" }, 500, origin);
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const key = ((payload && payload.key) || "").toString();
      if (!/^[a-f0-9]{16,128}$/.test(key)) return json({ error: "Missing or invalid key" }, 400, origin);
      const doc = payload && payload.doc;
      if (!doc || typeof doc !== "object") return json({ error: "Missing or invalid doc" }, 400, origin);
      const docStr = JSON.stringify(doc);
      if (docStr.length > 4 * 1024 * 1024) return json({ error: "Doc too large" }, 413, origin);
      const deviceId = ((payload && payload.deviceId) || "").toString().slice(0, 64);
      const force = !!(payload && payload.force);
      // baseRev = the rev this device last had in hand. Back-compat: older app
      // builds sent `rev` (their last-seen rev) instead of `baseRev`.
      const baseRev = Number(payload && (payload.baseRev != null ? payload.baseRev : payload.rev)) || 0;
      const existing = await env.SYNC.prepare("SELECT doc, updated_at, rev FROM docs WHERE id = ?").bind(key).first();
      if (existing && !force && existing.rev !== baseRev) {
        let cur = null;
        try { cur = JSON.parse(existing.doc); } catch (e) { /* corrupt → null */ }
        return json({ ok: false, stale: true, doc: cur, updatedAt: existing.updated_at, rev: existing.rev }, 200, origin);
      }
      const rev = ((existing && existing.rev) || 0) + 1;
      const updatedAt = Date.now();
      await env.SYNC.prepare(
        "INSERT INTO docs (id, doc, updated_at, rev, device_id) VALUES (?1, ?2, ?3, ?4, ?5) " +
        "ON CONFLICT(id) DO UPDATE SET doc = ?2, updated_at = ?3, rev = ?4, device_id = ?5"
      ).bind(key, docStr, updatedAt, rev, deviceId).run();
      return json({ ok: true, rev, updatedAt }, 200, origin);
    }

    // Proactive Brief 2.0 — write a fresh morning brief from synced day context
    // (or the D1 sync doc) + a live inbox peek. The app's brief card calls this;
    // the 8am push calls buildServerBrief directly inside firePush.
    if (request.method === "POST" && url.pathname === "/brief") {
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const text = await buildServerBrief(env, {
        syncKey: (payload && payload.syncKey) || "",
        emailSession: (payload && payload.emailSession) || "",
        dateKey: (payload && payload.dateKey) || "",
        context: (payload && payload.context) || "",
        fallback: (payload && payload.fallback) || "",
      });
      return json({ ok: true, text }, 200, origin);
    }

    // Weekly review — a Sunday-evening "here's your week" brief from the synced
    // doc + a live inbox peek. The app's weekly card calls this; the Sunday push
    // calls buildWeeklyReview directly inside firePush.
    if (request.method === "POST" && url.pathname === "/weekly") {
      let payload;
      try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const text = await buildWeeklyReview(env, {
        syncKey: (payload && payload.syncKey) || "",
        emailSession: (payload && payload.emailSession) || "",
        dateKey: (payload && payload.dateKey) || "",
        context: (payload && payload.context) || "",
        fallback: (payload && payload.fallback) || "",
      });
      return json({ ok: true, text }, 200, origin);
    }

    // ── Email Command Center (Phase 5) — Gmail OAuth + AI drafts + send ──────────

    // Email — start OAuth (one Google account per pass; call again to add another).
    if (request.method === "GET" && url.pathname === "/google/login") {
      if (!env.GOOGLE_CLIENT_ID) return gPage("Email isn’t configured on the relay yet.");
      const session = url.searchParams.get("session") || "";
      if (!session) return gPage("Missing session — start from KevinOS.");
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: url.origin + "/google/callback",
        response_type: "code",
        scope: GOOGLE_SCOPE,
        access_type: "offline",
        include_granted_scopes: "true",
        prompt: "consent select_account",
        state: session,
      });
      return Response.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + params.toString(), 302);
    }

    // Email — OAuth callback: exchange the code, fetch the email, upsert the account.
    if (request.method === "GET" && url.pathname === "/google/callback") {
      const code = url.searchParams.get("code"), session = url.searchParams.get("state");
      if (!code || !session) return gPage("Authorization was cancelled or incomplete.");
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.PUSH) return gPage("Email isn’t fully configured on the relay.");
      try {
        const tr = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: url.origin + "/google/callback", grant_type: "authorization_code" }),
        });
        const tok = await tr.json();
        if (!tok.access_token) return gPage("Google didn’t return a token (" + ((tok.error_description || tok.error || "unknown") + "") + ").");
        let email = "";
        try {
          const ur = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: "Bearer " + tok.access_token } });
          const uj = await ur.json(); email = (uj && uj.email) || "";
        } catch (e) { /* email is cosmetic-ish */ }
        const rec = (await gmailGetRec(env, session)) || { accounts: [] };
        const exp = Date.now() + (tok.expires_in || 3600) * 1000;
        const existing = rec.accounts.find((a) => a.email === email);
        if (existing) { existing.access = tok.access_token; existing.exp = exp; if (tok.refresh_token) existing.refresh = tok.refresh_token; }
        else rec.accounts.push({ email, access: tok.access_token, refresh: tok.refresh_token || "", exp, addedAt: Date.now() });
        await gmailPutRec(env, session, rec);
        return gPage(email ? "Connected " + email + " ✓" : "Gmail connected ✓");
      } catch (e) {
        return gPage("Couldn’t complete Google sign-in. Please try again.");
      }
    }

    // Email — which accounts are connected for this session (the app polls this).
    if (request.method === "GET" && url.pathname === "/google/status") {
      const rec = await gmailGetRec(env, url.searchParams.get("session") || "");
      return json({ accounts: rec && rec.accounts ? rec.accounts.map((a) => ({ email: a.email })) : [] }, 200, origin);
    }

    // Email — recent inbox messages for one account, or ALL accounts merged into
    // one stream (unified inbox) when payload.all is set. Every message carries
    // its own account so the app can badge it and draft/triage on the right one.
    if (request.method === "POST" && url.pathname === "/google/threads") {
      if (!env.PUSH) return json({ error: "Email not configured" }, 500, origin);
      let payload; try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const rec = await gmailGetRec(env, payload && payload.session);
      if (!rec || !rec.accounts || !rec.accounts.length) return json({ error: "not connected" }, 401, origin);
      try {
        let messages = [];
        if (payload && payload.all) {
          const per = Math.max(5, Math.floor(24 / rec.accounts.length));
          for (const a of rec.accounts) { try { messages = messages.concat(await gmailInbox(env, a, per)); } catch (e) { /* skip one account, keep the rest */ } }
          messages.sort((x, y) => (y.ts || 0) - (x.ts || 0));
          messages = messages.slice(0, 30);
        } else {
          const acct = gmailFindAccount(rec, payload && payload.account);
          if (!acct) return json({ error: "not connected" }, 401, origin);
          messages = await gmailInbox(env, acct, 12);
        }
        await gmailPutRec(env, payload.session, rec);
        return json({ ok: true, unified: !!(payload && payload.all), accounts: rec.accounts.map((a) => a.email), messages }, 200, origin);
      } catch (e) { return json({ error: (e && e.message) || "threads failed" }, 502, origin); }
    }

    // Email — triage one message: archive (remove INBOX) and/or mark read
    // (remove UNREAD). The change lands in Gmail itself, so it's instantly
    // consistent across every device — phone, web, and the unified inbox.
    if (request.method === "POST" && url.pathname === "/google/modify") {
      if (!env.PUSH) return json({ error: "Email not configured" }, 500, origin);
      let payload; try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const rec = await gmailGetRec(env, payload && payload.session);
      const acct = gmailFindAccount(rec, payload && payload.account);
      if (!acct) return json({ error: "not connected" }, 401, origin);
      if (!payload.id) return json({ error: "Missing message id" }, 400, origin);
      const remove = [];
      if (payload.archive) remove.push("INBOX");
      if (payload.archive || payload.read) remove.push("UNREAD");
      if (!remove.length) return json({ error: "Nothing to change" }, 400, origin);
      try {
        const token = await gmailAccessToken(env, acct); await gmailPutRec(env, payload.session, rec);
        const mr = await gmailApi(token, "/messages/" + payload.id + "/modify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ removeLabelIds: remove }) });
        const mj = await mr.json();
        if (!mr.ok) return json({ error: (mj.error && mj.error.message) || "modify failed" }, 502, origin);
        return json({ ok: true, id: payload.id, labelIds: mj.labelIds || [] }, 200, origin);
      } catch (e) { return json({ error: (e && e.message) || "modify failed" }, 502, origin); }
    }

    // Email — AI-draft a reply to a message (returned for review, NOT sent).
    if (request.method === "POST" && url.pathname === "/google/draft") {
      if (!env.GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY not set on the relay" }, 500, origin);
      let payload; try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const rec = await gmailGetRec(env, payload && payload.session);
      const acct = gmailFindAccount(rec, payload && payload.account);
      if (!acct) return json({ error: "not connected" }, 401, origin);
      if (!payload.id) return json({ error: "Missing message id" }, 400, origin);
      try {
        const token = await gmailAccessToken(env, acct); await gmailPutRec(env, payload.session, rec);
        const mr = await gmailApi(token, "/messages/" + payload.id + "?format=full");
        const mj = await mr.json();
        if (!mr.ok) return json({ error: (mj.error && mj.error.message) || "gmail error" }, 502, origin);
        const hs = mj.payload && mj.payload.headers;
        const from = gmailHeader(hs, "From"), subject = gmailHeader(hs, "Subject");
        const msgId = gmailHeader(hs, "Message-ID") || gmailHeader(hs, "Message-Id");
        const body = gmailBodyText(mj.payload).slice(0, 8000);
        const sys = "You are " + acct.email + ", writing a reply as this person. Draft a clear, warm, concise reply. Return ONLY the reply body text — no subject line, no email headers, a simple sign-off is fine.";
        const prompt = "Reply to this email" + (payload.instructions ? " (extra guidance: " + payload.instructions + ")" : "") + ".\n\nFrom: " + from + "\nSubject: " + subject + "\n\n" + body;
        const draft = await callGemini(env, sys, prompt);
        return json({ ok: true, to: from, subject: /^re:/i.test(subject) ? subject : ("Re: " + subject), body: draft, threadId: mj.threadId, messageId: msgId }, 200, origin);
      } catch (e) { return json({ error: (e && e.message) || "draft failed" }, 502, origin); }
    }

    // Email — overnight auto-drafts: generate (or list/remove) AI replies to real
    // unread mail. The app shows them as review cards; cron pre-runs this nightly.
    if (request.method === "POST" && url.pathname === "/google/overnight") {
      if (!env.PUSH) return json({ error: "Email not configured" }, 500, origin);
      let payload; try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const session = payload && payload.session;
      if (!session) return json({ error: "Missing session" }, 400, origin);
      if (payload.remove) {
        const raw = await env.PUSH.get("gdraft:" + session);
        const cur = raw ? JSON.parse(raw) : { drafts: [] };
        cur.drafts = (cur.drafts || []).filter((d) => d.id !== payload.remove && d.messageId !== payload.remove);
        await env.PUSH.put("gdraft:" + session, JSON.stringify(cur));
        return json({ ok: true, drafts: cur.drafts }, 200, origin);
      }
      if (payload.generate) {
        const r = await generateOvernightDrafts(env, session, 5);
        return json({ ok: true, count: r.count, drafts: r.drafts }, 200, origin);
      }
      const raw = await env.PUSH.get("gdraft:" + session);
      const cur = raw ? JSON.parse(raw) : { drafts: [], generatedAt: 0 };
      return json({ ok: true, drafts: cur.drafts || [], generatedAt: cur.generatedAt || 0 }, 200, origin);
    }

    // Email — send an approved reply (gmail.send). Never reached without a human approve.
    if (request.method === "POST" && url.pathname === "/google/send") {
      if (!env.PUSH) return json({ error: "Email not configured" }, 500, origin);
      let payload; try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const rec = await gmailGetRec(env, payload && payload.session);
      const acct = gmailFindAccount(rec, payload && payload.account);
      if (!acct) return json({ error: "not connected" }, 401, origin);
      const to = (payload.to || "").toString(), subject = (payload.subject || "").toString(), bodyText = (payload.body || "").toString();
      if (!to || !bodyText) return json({ error: "Missing recipient or body" }, 400, origin);
      try {
        const token = await gmailAccessToken(env, acct); await gmailPutRec(env, payload.session, rec);
        const headers = ["From: " + acct.email, "To: " + to, "Subject: " + subject, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8"];
        if (payload.messageId) { headers.push("In-Reply-To: " + payload.messageId); headers.push("References: " + payload.messageId); }
        const raw = b64urlEncode(headers.join("\r\n") + "\r\n\r\n" + bodyText);
        const sr = await gmailApi(token, "/messages/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ raw, threadId: payload.threadId || undefined }) });
        const sj = await sr.json();
        if (!sr.ok) return json({ error: (sj.error && sj.error.message) || "send failed" }, 502, origin);
        return json({ ok: true, id: sj.id }, 200, origin);
      } catch (e) { return json({ error: (e && e.message) || "send failed" }, 502, origin); }
    }

    // Email — disconnect one account (or all) for a session; revoke on Google.
    if (request.method === "POST" && url.pathname === "/google/logout") {
      let payload; try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
      const session = payload && payload.session;
      if (session && env.PUSH) {
        const rec = await gmailGetRec(env, session);
        if (rec && rec.accounts) {
          const toRevoke = payload.account ? rec.accounts.filter((a) => a.email === payload.account) : rec.accounts;
          for (const a of toRevoke) { try { await fetch("https://oauth2.googleapis.com/revoke?token=" + encodeURIComponent(a.refresh || a.access), { method: "POST" }); } catch (e) { /* best-effort */ } }
          if (payload.account) { rec.accounts = rec.accounts.filter((a) => a.email !== payload.account); await gmailPutRec(env, session, rec); }
          else await env.PUSH.delete("gml:" + session);
        }
      }
      return json({ ok: true }, 200, origin);
    }

    return json({ error: "Not found" }, 404, origin);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(firePush(env));
  },
};
