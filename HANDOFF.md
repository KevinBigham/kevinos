# KevinOS — Handoff to the next Claude Code

*Written 2026-06-22. Read this first. It's the complete state of the project so you can pick up cold. Everything (app + backend + docs) lives in one repo: `github.com/KevinBigham/kevinos`.*

---

## 0. TL;DR (read this, then skim the rest)

KevinOS is Kevin's **personal life operating system** — a calm daily cockpit (tasks, calendar, notes, projects, GitHub, reference) as an installable PWA. It is **live, installed on his phone, and fully working**.

- **App:** `v0.28`, live at **https://kevinbigham.github.io/kevinos/** (GitHub Pages, public repo `KevinBigham/kevinos`).
- **Backend ("the relay"):** a Cloudflare Worker, **live** at **https://kevinos-relay.kevinbigham.workers.dev**. It holds every AI key as a server secret and powers the in-app **Council**. As of v0.12 the Council is **multi-model with per-seat lanes**: one prompt fans out to **5 free seats** (Gemini, Cloudflare Workers AI, Groq, Mistral, OpenRouter) in parallel — each answering from a distinct assigned role (grounded · fast tactical · research · open-model · devil's advocate). As of **v0.13** the answers **stream back live** — per-seat cards fill in the instant each model returns (NDJSON stream), instead of the whole panel appearing at once — then a **synthesis chair** (Gemini) combines them into one decision-ready brief, which Kevin can save to Notes. Source is in `relay/` in this same repo.
- **Whole stack is operational at $0/mo.** Phases 0 → 2 shipped, including the v0.13 Council (multi-model, per-seat lanes, live streaming, save-to-Notes) and **v0.14 phone reminders** — Web Push to the installed PWA (a morning brief + per-task due-time nudges), powered by VAPID + RFC-8291 encryption + a KV store + a per-minute cron, all on the relay. **v0.15** adds the second half of Phase 2b — **GitHub OAuth**: the GitHub token now lives on the relay (one-tap "Connect with GitHub"), never on the device, with the relay proxying GitHub's GraphQL — now **live** (OAuth App registered, `GITHUB_CLIENT_ID` set). **v0.16** ships **Phase 3 — cross-device sync**: one passphrase links Kevin's devices to a single live dataset, stored in **Cloudflare D1** and proxied through the relay (no database key ever in the browser). **v0.17** ships **Phase 4 — Calendar / File AI**: paste text, snap a photo, or drop a PDF, and Gemini (multimodal, on the relay) extracts events into a review queue you approve onto the calendar; the old `.ics` bugs (RRULE/DTEND/EXDATE/DST) are fixed too. **v0.18** ships **Phase 5 — Email Command Center**: connect multiple Gmail accounts, read the inbox in-app, and AI-draft replies you approve & send (`gmail.send`, threaded) — tokens on the relay, never on the device. Code shipped + verified; it **activates the moment Kevin registers a Google OAuth client** (see §10/RELAY_SETUP). **Phases 0 → 5 are all built.** (v0.19 **Council → action**: turn a Council verdict into reviewed tasks. v0.20 **smart morning brief**: an AI-written daily cockpit card in the Next room + a date-specific smart 8am push. v0.21–v0.22 hardened cross-device sync (server-authoritative `rev` + lossless merge). v0.23 **Proactive Brief 2.0** (server-generated at send time + live inbox peek). v0.24 **Overnight Auto-Drafts**. v0.25 **Smart Inbox** (Needs you / FYI / Noise). **v0.26 — three at once: Unified Inbox** (all Gmail accounts merged into one stream), **Triage**, and **Weekly Review**. **v0.27 — ⌘K Command Palette** adds keyboard-first navigation/actions across the app. **v0.28 — Voice Quick-Capture** adds a global mic/textarea capture flow backed by relay `/capture`, classifying thoughts into existing tasks/events/notes with Undo.)
- **Next 10 features are fully spec'd in [`MISSION.md`](MISSION.md)** — a build brief written to hand to an external coding agent (e.g. Codex) and follow literally. Each feature is self-contained: mission, user flow, exact `state`/sync model, relay routes (request/response + the actual Gemini prompt text), ES5 app changes with real function names + line numbers to mirror, runnable curl/preview verification, and a Definition of Done. **#1 ⌘K Command Palette is shipped in v0.27 and #2 Voice Quick-Capture is shipped in v0.28**; remaining sections continue with Calendar Room · Habits · One-Tap Send · Link Stash + AI TL;DR · People Radar · Spend Pulse · Goals & Weekly Check-In · Morning Launch Sequence. It opens with an **Operating Manual** that re-states the rules below. (Authored by a 25-agent workflow that read the live codebase and adversarially fact-checked every spec against the real `index.html`/`worker.js`.)
- **The single most important rule:** the app's JavaScript is **ES5-style on purpose** (see §2). Do not introduce arrow functions, template literals, `async/await`, `const`/`let`, or any dependency into the app. The Worker (`relay/`) is exempt — it's modern ES modules.

If you only remember two things: **(1) keep the app ES5-style and dependency-free; (2) the AI key lives ONLY on the Worker as a secret — never in the browser, the repo, or his phone.**

---

## 1. What KevinOS is (the vision)

A **calm daily cockpit** unifying tasks, calendar, notes, projects, email, and reference across every device Kevin owns. One live dataset, installable, works offline, gets smart when connected.

**The core principle that governs everything: AI proposes, Kevin approves.** Nothing acts on its own. Every AI action lands in a review queue (`pending → approved → done`). Email never auto-sends; calendar events never auto-create. The Council queue (`queued → running → answered`) is the first incarnation of this review-queue primitive — it generalizes to calendar/email later.

Operating principles (don't break these):
1. **Local-first.** Fully usable with no network. Cloud is an enhancement, never a dependency.
2. **Review-queue is the core primitive.** AI proposes, Kevin approves.
3. **Calm, not noisy.** Token expiry is a gentle "Reconnect," not an error. No alarm-red UI.
4. **Cheap by design.** Free tiers first. Hard ceiling ~$25/mo + AI <$5/mo.
5. **Evolve, don't rewrite.** One self-contained file as long as it holds.
6. **Secrets off the browser.** OAuth/API tokens live server-side on the relay.

Full plan lives in `ROADMAP.md` (same folder). Read it.

---

## 2. The hard constraints (violating these breaks the project)

### The app is ES5-style vanilla JS, single self-contained file, ZERO dependencies
`index.html` is one file: HTML + CSS + JS, wrapped in an IIFE with `"use strict"`. The JS style is deliberately old-school so it's bulletproof and dependency-free:

- ✅ `var` (never `const`/`let`)
- ✅ `function foo(){}` declarations (never arrow functions `=>`)
- ✅ `.then()` promise chains (never `async`/`await`)
- ✅ string concatenation with `+` (never template literals `` `...` ``)
- ✅ classic `for` loops
- ❌ No build step, no npm, no framework, no imports, no external scripts/CDNs.

When you edit the app, **match the surrounding code exactly.** If you write ``const x = `${a}` `` you've done it wrong.

### The relay is the exception
`relay/worker.js` is a Cloudflare Worker — modern **ES module syntax is fine and expected** there (`export default`, arrow functions, etc.). It is NOT subject to the app's ES5 rule. Don't confuse the two.

---

## 3. Architecture

```
  ┌─────────────────────────┐           ┌──────────────────────────────┐
  │  KevinOS PWA (browser)   │   HTTPS   │  Cloudflare Worker "relay"   │
  │  index.html, ES5 vanilla │ ────────► │  kevinos-relay.*.workers.dev │
  │  state in localStorage   │ /council  │  holds ALL AI keys as SECRETS│
  │  GitHub Pages (public)   │ ◄──────── │  fans out + synthesizes      │
  └─────────────────────────┘  {seats,  └───────────────┬──────────────┘
                                synthesis}               │ parallel fan-out (Promise.all)
                       ┌──────────┬──────────┬───────────┼───────────┐
                       ▼          ▼          ▼           ▼           ▼
                    Gemini   Cloudflare    Groq       Mistral    OpenRouter
                    (+chair) Workers AI   (Llama)     (small)    (Qwen :free)
                              all free tiers · $0/mo · synthesis chair = Gemini
```

- The browser never sees a key. It POSTs `{prompt}` to `<relay>/council`; the Worker calls every configured seat in parallel and returns `{seats:[…], synthesis}`. (`/ai` still exists for single-model calls.)
- **CORS is locked** to `https://kevinbigham.github.io` — but that's a *browser* guard (a response header), **not** a server-side check. A **browser** on any other origin (preview, localhost) is blocked; a **`curl`/server-side POST to `/council` works fine** and is the fastest way to test seats with live models. (See §7.)

---

## 4. Repo & file map

Everything is in ONE public repo (`github.com/KevinBigham/kevinos`). A fresh `git clone` gives you the whole project. On Kevin's Mac the working copy happens to be nested at `/Users/kevin/KevinOS/app/` (that folder == the repo root).

```
/Users/kevin/KevinOS/                ← local parent folder (NOT in git)
├── app/                             ← THE GIT REPO → github.com/KevinBigham/kevinos (PUBLIC)
│   ├── index.html                   ← THE APP (v0.20, ~2620 lines, ES5)
│   ├── manifest.json                ← PWA manifest (+ share_target)
│   ├── sw.js                        ← service worker (CACHE = "kevinos-v0_20", + push / notificationclick)
│   ├── icon-192.png, icon-512.png, .nojekyll
│   ├── README.md
│   ├── ROADMAP.md                   ← the full phased build plan (current)
│   ├── HANDOFF.md                   ← this file
│   ├── .gitignore
│   └── relay/                       ← Cloudflare Worker (the backend)
│       ├── worker.js                ← the Worker (ES module — modern JS OK)
│       ├── wrangler.toml            ← config: PROVIDER, [ai] binding, per-seat models, CORS, PUSH KV, SYNC D1, cron, VAPID public, GitHub client id
│       ├── RELAY_SETUP.md           ← Kevin's foolproof provisioning guide
│       └── .wrangler/               ← local wrangler cache (gitignored; holds account id)
└── (historical archives — local only, NOT in git, may hold pre-scrub personal data:)
    ├── KevinOS_v1.0_code.html       ← original full app BEFORE the public scrub
    ├── OUTPUTS_AI Council KevinOS new.md
    └── Claude Convo to setup KevinOS.rtfd
```

Note: the three historical archives live one level **up** from the repo and are intentionally NOT committed (they may contain Kevin's real pre-scrub data). Leave them out of the public repo.

---

## 5. Deploy procedures

### Deploy the app (GitHub Pages)
1. Edit files in `/Users/kevin/KevinOS/app/` (repo root).
2. **Bump the service-worker cache** in `sw.js` every release: `var CACHE = "kevinos-v0_13";` (increment). This is what forces clients to pull the new version — skip it and users get stale cached code.
3. Bump the version footer string in `index.html` and `state.v` if the state shape changed.
4. Commit + push:
   ```
   cd /Users/kevin/KevinOS/app
   git add -A
   git commit -m "..."   # co-author trailer required, see §9
   git push origin main
   ```
5. Pages auto-rebuilds in ~10–30s. Hard-refresh to verify.

### Deploy the relay (Cloudflare Worker)
Kevin has already provisioned this; redeploys use his cached `wrangler` OAuth (no login needed):
```
cd /Users/kevin/KevinOS/app/relay
npx wrangler deploy
```

### Switch AI provider (Claude ↔ Gemini) — no app change needed
1. Edit `relay/wrangler.toml` → `[vars] PROVIDER = "gemini"` (or `"claude"`).
2. Ensure the matching secret exists (both are already set — see §6).
3. `npx wrangler deploy`. Done. The app doesn't change at all.

---

## 6. The relay in detail (current live state)

- **Worker name:** `kevinos-relay`
- **URL:** `https://kevinos-relay.kevinbigham.workers.dev` (workers.dev subdomain: `kevinbigham`)
- **Council seats (the `/council` roster — each turns on automatically when its credential exists):**
  - `gemini` — Gemini 2.5 Flash (free tier) — also the **synthesis chair**
  - `cloudflare` — Llama 3.3 70B on Workers AI (free, **no key** — just the `[ai]` binding)
  - `groq` — Llama 3.3 70B Versatile (free)
  - `mistral` — Mistral Small (free mode)
  - `openrouter` — **devil's-advocate** lane, **fallback chain** of free models (Qwen3-Next-80B → Llama-3.3-70B → Gemma-4; OpenRouter routes to the first available)
- **Per-seat lanes (v0.12):** the `/council` handler appends a distinct **role** to each seat's system prompt — `gemini`=grounded/fact-first, `groq`=fast tactical, `mistral`=research/trade-offs, `cloudflare`=open-model wildcard, `openrouter`=devil's advocate — so the council genuinely diverges instead of five near-identical answers. The synthesis chair is told each answer's lane.
- **Single-model endpoint (`/ai`)** still uses `PROVIDER` (currently `gemini`); **`/council` ignores `PROVIDER`** and always uses every seat.
- **Secrets set (encrypted, server-side only):** `GEMINI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, plus `ANTHROPIC_API_KEY` (idle — the fallback chair / a `/ai` option). The Cloudflare seat needs **no** secret. Set/rotate with `npx wrangler secret put <NAME>`.
- **CORS:** `ALLOW_ORIGIN = "https://kevinbigham.github.io"` (browser guard only — see §7).
- **Vars:** `PROVIDER`, `CLAUDE_MODEL`, `GEMINI_MODEL`, `CF_MODEL`, `GROQ_MODEL`, `MISTRAL_MODEL`, `OPENROUTER_MODEL`, `MAX_TOKENS`. Swap any seat's model by editing its var + redeploy; add a seat by setting its secret + redeploy (no code change).
- **Web Push (v0.14):** secret `VAPID_PRIVATE_KEY` (ES256 signing key — set via `wrangler secret put`, lives only on Cloudflare); vars `VAPID_PUBLIC_KEY` (public, advertised to the app as `applicationServerKey`) + `VAPID_SUBJECT`. Binding `PUSH` (KV namespace, id in `wrangler.toml`). Cron `crons = ["* * * * *"]`. The encryption (`encryptPayload`) is RFC 8291 `aes128gcm` done entirely in WebCrypto — **no `web-push` dependency** — and was verified byte-for-byte against the RFC 8291 test vector before shipping.
- **GitHub OAuth (v0.15):** var `GITHUB_CLIENT_ID` (public) + secret `GITHUB_CLIENT_SECRET`, both from the OAuth App Kevin registers (callback `…/github/callback`). Tokens are stored in the reused `PUSH` KV under a `gh:<session>` prefix. Until the client id/secret are set, every `/github/*` route degrades gracefully (`github:false` in health, "not configured" page). The app holds only a random `session` id, never the token.
- **Cross-device sync (v0.16):** binding `SYNC` — a **Cloudflare D1** database (`kevinos-sync`, id in `wrangler.toml`) with one table `docs(id, doc, updated_at, rev, device_id)`. One **last-write-wins document per passphrase**: the app derives `id = sha256(passphrase)` client-side and sends only that fingerprint — the **D1 credential lives on the relay, never in the browser**. `GET /` health gained `sync:bool`. Provision a fresh one with `npx wrangler d1 create kevinos-sync` then `wrangler d1 execute … --command "CREATE TABLE …"` (see `RELAY_SETUP.md`).
- **Calendar / File AI (v0.17):** `POST /extract` runs Gemini 2.5 Flash **multimodal** (text + image + PDF via `inlineData`) → strict-JSON events, resolving relative dates against the app's `today`/`tz`. Uses the existing `GEMINI_API_KEY` — **no new setup**. `GET /` health gained `extract:bool`.
- **Email Command Center (v0.18):** `/google/login` → consent → `/google/callback` (multi-account; stores **refreshable** Gmail tokens in the `PUSH` KV under `gml:<session>` → `{accounts:[{email,access,refresh,exp}]}`); `/google/status` (poll); `/google/threads` (list INBOX); `/google/draft` (Gemini drafts a reply); `/google/send` (sends via **gmail.send** with In-Reply-To/References/threadId); `/google/logout` (revoke). The browser holds only a session id + account emails — **never a token**. var `GOOGLE_CLIENT_ID` + secret `GOOGLE_CLIENT_SECRET` — **both set (Google OAuth client registered 2026-06-23; `email:true` live)**; `GOOGLE_CLIENT_ID = 434623225035-…apps.googleusercontent.com` (public, in `wrangler.toml`), the secret piped from Kevin's downloaded `client_secret_*.json` via `wrangler secret put`. `GET /` health gained `email:bool`.
- **Email power-ups (v0.23–v0.26):** `POST /brief` (`buildServerBrief` — synced D1 doc + live inbox peek → Gemini morning brief; reused by the 8am cron); `POST /google/overnight` (`generateOvernightDrafts` — pre-write replies to `category:primary` unread, stored in KV `gdraft:<session>`; nightly cron); `gmailCategory(labelIds)` tags each thread `primary`/`fyi`/`noise` (smart inbox, free). **v0.26 added:** `/google/threads` now takes **`all:true`** → `gmailInbox()` fetches every account in parallel and merges (each message carries its own `account` + parsed `ts`) for the **unified inbox**; `POST /google/modify {id, archive?, read?}` removes `INBOX`/`UNREAD` labels (**triage** — the change lands in Gmail, instantly consistent on every device); `POST /weekly` (`buildWeeklyReview` — next-7-days events + overdue-first priorities + builds from the synced doc + inbox peek → Gemini Sunday review; reused by `firePush` `gen:"weekly"`, scheduled the next 4 Sundays @ 5pm). All reuse `GEMINI_API_KEY` — **no new setup, no new health flag**.

**Endpoints:**
- `GET /` → health `{ ok, service, provider, seats:[…], push, github, sync, extract, email, capture }` (`push` = VAPID configured; `github`/`email` = OAuth configured; `sync` = D1 bound; `extract`/`capture` = Gemini key present; seats = currently-live roster)
- `POST /council` with `{ prompt, system?, synthesize?, stream? }`:
  - **Default** (no `stream`) → one JSON object `{ seats:[{id,label,lane,provider,model,ok,text,ms,error}], synthesis:{ok,provider,text}|null, asked, answered }`.
  - **`stream:true`** (v0.13) → an **NDJSON stream** (`Content-Type: application/x-ndjson`), one JSON object per line, emitted as events happen: `{type:"start",asked,seats:[{id,label,lane,provider,model}]}` immediately, then `{type:"seat",seat:{…}}` per seat **in completion order**, then `{type:"synthesis",synthesis}`, then `{type:"done",asked,answered}`. This is what powers the live per-seat fill-in. The app uses this mode; a plain `curl` without `stream` still gets the single-object form (and `curl -N … -d '{…,"stream":true}'` prints each line as it arrives — the fastest way to *see* the stagger).
  - Either way it fans out in parallel with a **45s per-seat timeout**; one slow/failed seat never blocks the rest; synthesis runs when ≥2 seats answer.
- `POST /ai` with `{ prompt, system? }` → `{ text, provider }` (single model, back-compat)
- `POST /extract` with `{ text?, file?:{mime,dataB64}, today, tz }` → `{ ok, events:[{title,date,start,end,allDay,location,notes}] }` (Phase 4 — Gemini multimodal event extraction from text/photo/PDF)
- `POST /actions` with `{ text, areas? }` → `{ ok, tasks:[{text,area}] }` (v0.19 Council → action — Gemini decomposes a decision/notes blob into ≤8 next-action tasks)
- `POST /capture` with `{ text, today?, tz?, areas? }` → `{ ok:true, type:"task", task:{text,area,due} }` or `{ ok:true, type:"event", event:{title,date,time} }` or `{ ok:true, type:"note", note:{text} }` (v0.28 Voice Quick-Capture — Gemini strict JSON with deterministic fallback to a note; weekday phrases are normalized against the supplied `today`)
- **Email (Phase 5):** `GET /google/login?session=` → 302 Google consent; `GET /google/callback` → stores token; `GET /google/status?session=` → `{accounts:[{email}]}`; `POST /google/threads {session,account}` → `{messages:[…]}`; `POST /google/draft {session,account,id}` → `{to,subject,body,threadId,messageId}`; `POST /google/send {session,account,to,subject,body,threadId,messageId}` → sends via gmail.send; `POST /google/logout {session,account?}` → revoke + forget
- **Web Push (v0.14):**
  - `GET /push/key` → `{ publicKey }` (the VAPID public key, so the app never hardcodes it)
  - `POST /push/sync` `{ subscription, reminders:[{id,fireAt,title,body,url,tag}] }` → stores it under `sub:<sha256(endpoint)>` in the `PUSH` KV (full-replace). The app calls this on enable, on load, and (debounced) after any `save()` while reminders are on.
  - `POST /push/unsubscribe` `{ endpoint }` → deletes that record
  - `POST /push/test` `{ subscription }` → sends one push immediately (this is how Kevin confirms delivery on his phone)
  - **cron** `* * * * *` → `scheduled()` → `firePush(env)`: fires every reminder whose `fireAt ≤ now` (1h stale-grace), then drops it; a 404/410 from the push service deletes the subscription. The app owns recurrence by re-syncing the next occurrence.
- **GitHub OAuth (v0.15):**
  - `GET /github/login?session=<id>` → 302 to GitHub's consent screen (relay supplies client_id + the `…/github/callback` redirect_uri + `read:user repo` scope + `state=<session>`)
  - `GET /github/callback?code=&state=` → exchanges code→token (client_id + client_secret), stores `gh:<session>` → `{token,login,createdAt}` in the **PUSH KV** (reused, `gh:` prefix), returns a "close this tab" HTML page
  - `GET /github/status?session=` → `{connected, login}` (the app polls this after opening the consent tab)
  - `POST /github/graphql` `{session, query, variables?}` → proxies to GitHub's GraphQL with the **server-side** token, returns GitHub's JSON verbatim; a 401 deletes the session. **The browser never sees the token.**
  - `POST /github/logout` `{session}` → **revokes** the token on GitHub (`DELETE /applications/{id}/token`) + deletes the KV record
- **Cross-device sync (v0.16):**
  - `POST /sync/pull` `{key}` → `{ok, doc, updatedAt, rev}` — the current document for that passphrase-hash, or `doc:null` if none
  - `POST /sync/push` `{key, doc, baseRev, deviceId, force?}` → upserts the document with **server-authoritative optimistic concurrency** (v0.21): accepts only when `baseRev === stored.rev` (or `force`, or no stored doc), else returns `{ok:false, stale:true, doc, rev, updatedAt}` so the app **merges losslessly and retries**; on accept `rev = stored.rev + 1` and `updated_at` is stamped **server-side** (one clock — never the client wall-clock, which can skew between devices and silently block propagation). Returns `{ok:true, rev, updatedAt}`. Back-compat: a legacy `rev` field is read as `baseRev`. `key` must be 16–128 hex chars (the `sha256(passphrase)` the app sends).

**Quick live test (works from anywhere — the relay doesn't reject by Origin):**
```
curl https://kevinos-relay.kevinbigham.workers.dev/
curl -X POST https://kevinos-relay.kevinbigham.workers.dev/council \
  -H "Content-Type: application/json" -d '{"prompt":"one-sentence test"}'
```

**In-app wiring:** Next room → Council queue → "Connect AI" → paste the relay URL → Save (`state.relay.url`). Ask a question → `queued → running → answered`. **While running (v0.13) the per-seat cards stream in live:** each seat shows a "thinking" pulse, then fills with its answer the instant that model returns, under a live **"N of M answered · live"** counter. When the stream finishes it settles into a **synthesis card** (the chair's brief) above a collapsible **"N of M answered"** roster of per-seat cards (each with its lane, provider, response time, and Copy). Falls back to a one-shot render if the browser lacks a streaming body, and to the single-answer `/ai` shape if the relay is an older build. Degrades gracefully offline.

---

## 7. How to verify changes (and the one big gotcha)

**App UI:** use the **Claude_Preview MCP** (this project's preview server is named `kevinos`, port 8128). `preview_start` if needed, then `preview_snapshot` / `preview_screenshot` / `preview_click` / `preview_eval`.

**Gotchas learned the hard way:**
- **The app's closure functions are NOT reachable from `preview_eval`.** Only the DOM + `localStorage` are. Test behavior through the DOM, or read/poke `localStorage["kevinos:v1"]`.
- **`save()` is async** (Promise microtask). If you write state then read `localStorage` in the *same* `preview_eval`, you'll get the OLD value. Re-read in a *separate* eval call.
- **CORS is a *browser* guard, not a server check.** The relay sets `Access-Control-Allow-Origin` to the live site, so a **browser** on any other origin (preview server, localhost) is blocked — for in-browser UI testing, mock `window.fetch` in a `preview_eval` (that's how the v0.11 Council UI was verified). But the Worker does **not** reject by Origin, so a **server-side `curl` POST to `/council` works for real end-to-end testing** with live models — the fastest way to confirm seats answer, no deploy-to-live needed.
- **Verifying the streaming UI (v0.13):** the mock must return `new Response(new ReadableStream({start(c){…}}), {headers:{"Content-Type":"application/x-ndjson"}})`. Preview tool-calls cost ~5–7s each, which overshoots any `setTimeout`-paced stream — so drive it with a **manual-emit** controller: stash the stream's `controller` on `window`, expose `window.__emit()` that enqueues the next NDJSON line on demand, and step through `start → seat… → synthesis → done` one `preview_eval` at a time, screenshotting between. Note enqueue is async (the app's reader resolves next tick) — emit in one call, assert/screenshot in the next.
- **Verifying Web Push UI (v0.14):** the app's closures aren't reachable, and a real push subscription can't be minted in the preview, so drive the enable flow by mocking three globals in a `preview_eval`: `window.fetch` (capture `/push/key`, `/push/sync`, `/push/test`), `Notification.requestPermission` (→ `"granted"`), and `navigator.serviceWorker` (via `Object.defineProperty`, with a fake `pushManager.subscribe`/`getSubscription`). Then click `[data-push-toggle]` and assert `window.__calls` + `localStorage["kevinos:v1"].push`. **Encryption/VAPID correctness is proven in Node, not the browser** (RFC 8291 vector + a sign/verify round-trip); the browser test only covers the app wiring. Real end-to-end delivery is Kevin tapping **Send test** on his iPhone.

---

## 8. Gotchas & lessons (don't relearn these)

- **Provider mismatch bites:** setting the `GEMINI_API_KEY` secret is not enough — `wrangler.toml`'s `PROVIDER` var must also say `"gemini"`, then redeploy. We lost time once because the secret was set but `PROVIDER` was still `"claude"` (so it called Claude and errored). The deployed bindings print the active `PROVIDER` — check them after deploy.
- **Claude billing:** Kevin's Anthropic account had $0 credit, so Claude auth *succeeded* but calls failed with "credit balance too low." That's why we run on Gemini's free tier. (The Claude key still works the moment there's credit — just flip `PROVIDER`.)
- **Finding the Council:** it lives in the **Next** room (top nav), scroll to the bottom — NOT on Home. Kevin looked for it on Home and couldn't find it.
- **Event handling:** the app uses **event delegation on stable containers** so `innerHTML` re-renders don't drop listeners. Follow that pattern; don't attach listeners to elements that get re-rendered.
- **State persistence:** `window.storage` (Claude host) → `localStorage` → in-memory fallback. `STORE_KEY = "kevinos:v1"`. Current `state.v = 26`. When you change the state shape, bump `state.v` and handle the migration in `load()`. (v11 added per-question `seats[]` + `synthesis` to `state.council[]`; old single-`answer` items still render via a legacy branch. v12 added no new shape — "Save to Notes" writes a Council session into `state.notes` as an ordinary note. v13 added no persisted shape — live streaming uses **transient** `streaming` (on the council item) + `pending` (on placeholder seats) flags that are cleared before any `save()`, so an interrupted stream never persists a stuck "running" item. v14 added `state.push` (`{enabled, endpoint, hour, syncedAt}`) and an optional `dueTime` (`"HH:MM"`) on task items; reminders are recomputed (`buildReminders`) and re-synced to the relay on every `save()` (debounced 1.5s) and on load, so the relay always mirrors the app's current task state without any sync layer. v15 added `state.github.session` (the OAuth session id) + a transient `pendingOAuth` flag — the GitHub OAuth **token is not stored in the app at all**; it lives on the relay keyed by that session, and the app proxies GitHub through `/github/graphql`. v16 added `state.sync` (`{on, key, deviceId, updatedAt, rev, lastSyncAt, err}`) — **device-local, never synced**. Sync replicates only **content** entities (items/events/projects/builds/briefs/links/prompts/notes/council + lastBackupAt/lastShutdown), excluding the device-connection objects `relay`/`push`/`github`/`sync`; the whole content half of `state` is pushed/pulled as one last-write-wins doc through the relay → Cloudflare D1, keyed by `sha256(passphrase)`. Pulls apply on focus/visibility/online + a 60s poll (skipped mid-edit); pushes are debounced 2s into `save()`. `state.sync` is intentionally NOT restored from a JSON backup, so importing data never silently links a device. v17 added `state.pending` — the Calendar/File-AI review queue of AI-proposed events (syncs as content); events gained optional `location`/`notes`; the `.ics` engine now parses RRULE/DTEND/EXDATE and Z (UTC→local), expands recurrences (bounded, RFC-correct COUNT-vs-EXDATE), and exports timed events as **UTC Z** so they don't drift across DST. v18 added `state.email` (`{session, accounts:[email], active}`) — **device-local, never synced** (in `SYNC_SKIP` alongside github/relay/push/sync); the Gmail **token lives on the relay** keyed by session+email, the app proxies through `/google/*`; inbox threads + AI drafts are transient module vars, never persisted. v19 (Council → action) added no persisted shape — proposed tasks live in a transient `councilTasks{}` module var until approved into `state.items`; the relay gained `POST /actions` (Gemini → `[{text,area}]`). v20 added `state.brief` (`{date,text}` — **device-local**, in `SYNC_SKIP`; a per-day cache of the AI morning brief) + `dayDigest`/`briefBodyShort` helpers; the push morning brief is now **date-specific** (`buildReminders` bodies come from `briefBodyShort(thatDate)`), and the Next room opens with an AI brief card (auto-generated once/day via `/ai` on entering Next, cached in `state.brief`, deterministic fallback when the relay is off). v27/v28 added no persisted shape: Command Palette is transient UI, and Voice Quick-Capture writes only existing synced arrays (`items`, `events`, `notes`) plus transient mic/panel/undo vars, so `state.v` intentionally remains 26 while footer/cache move to v0.28.)
- **OpenRouter free models rotate AND rate-limit.** Free slugs flip to paid (`deepseek/deepseek-chat-v3-0324:free` did) and free endpoints get "rate-limited upstream" under load. Fix is baked in: `OPENROUTER_MODEL` is a **comma-separated fallback chain** (≤3 entries — OpenRouter rejects 4+) sent as the `models` array, so OpenRouter routes to the first available. Currently `qwen3-next-80b → llama-3.3-70b → gemma-4`. `callOpenAICompatible` now also surfaces the upstream `metadata.raw`/`provider_name` so errors aren't masked as a generic "Provider returned error." Refresh slugs from `https://openrouter.ai/api/v1/models` (filter `pricing.prompt=="0"`) + redeploy.
- **Free-tier seats blip.** Gemini occasionally returns "experiencing high demand"; that seat fails for that one request and the others carry the Council (and Gemini can still chair the synthesis). Expected, not a bug — `Promise.all` with per-seat try/catch isolates each failure.

---

## 9. Working with Kevin

- His global prefs: `/Users/kevin/.claude/CLAUDE.md`. **Read it.** Summary: be **direct and concise, no hedging**; match his energy (he runs hot — "LFG!!!"); short summaries *after* work, not before; **edit existing files, don't create new ones**; no docstrings/comments on unchanged code; no over-engineering, no feature flags/abstractions unless asked.
- **Local file edits: just do them, no confirmation.** **Destructive/outward-facing ops (delete, force push, publishing, new public repos): confirm first.**
- He is privacy-conscious about his *personal data* (tasks, notes) — that's why the public app was scrubbed to generic seeds. Keep his real data off any public surface.
- **Commit trailer is required on every commit:**
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```
- **Persistent memory** about Kevin + this project lives at:
  `/Users/kevin/.claude/projects/-Users-kevin-KevinOS/memory/` (index is `MEMORY.md`; project detail in `kevinos-project.md`). Read it at the start; update it when you learn something durable.

---

## 10. What's shipped vs. what's next

**Shipped & live (see ROADMAP.md for detail):**
- Phase 0 — Foundation (bug fixes, JSON backup, PWA-ify) — v0.6
- GitHub Room — streak keeper (PAT → GitHub GraphQL, no backend) — v0.7
- Phase 0.5 — Permanent deploy to GitHub Pages — v0.8
- Phase 1 — Next room (unified "what do I do next") + offline Council queue — v0.8
- Phase 1.5 — recurring tasks, share/URL capture, backup nudge, wind-down ritual — v0.9
- **Phase 2 (first slice) — THE RELAY IS LIVE:** Council wired to real AI through the Worker; review-queue pattern (`queued → answered`) — v0.10
- **Phase 2 (Council upgrade) — MULTI-MODEL COUNCIL:** `/council` fans one prompt to 5 free seats (Gemini, Cloudflare, Groq, Mistral, OpenRouter) in parallel + a Gemini synthesis chair; app renders the synthesis brief + a collapsible per-seat roster — v0.11. Automates Kevin's "Council of Friends" workflow at $0/mo.
- **Phase 2 (Council depth) — PER-SEAT LANES + SAVE-TO-NOTES:** each seat answers from a distinct lane (grounded / fast tactical / research / open-model / devil's advocate); synthesis is lane-aware; any Council session saves into Notes; offline-queued questions auto-run the moment the relay connects — v0.12.
- **Phase 2 (Council polish) — LIVE STREAMING:** `/council` gained a `stream:true` **NDJSON** mode (`start` → `seat`×N in completion order → `synthesis` → `done`); the app reads it with a small ES5 stream reader (`response.body.getReader()` + `TextDecoder`, line-buffered) and fills each per-seat card the instant that model returns — a "thinking" pulse per pending seat under a live **"N of M answered · live"** counter, settling into the synthesis when done. Curl-verified staggered delivery; non-streaming path kept for back-compat — v0.13. The Council-of-Friends loop is now fully realized.
- **Phase 2b (first half) — PHONE REMINDERS (Web Push):** the relay gained VAPID + RFC-8291 `aes128gcm` encryption (WebCrypto, no library), a `PUSH` KV store, and a per-minute cron; the app subscribes via `pushManager` and syncs its reminder set (`/push/sync`). Two reminder types — a **morning brief** (chosen hour) + **per-task due-time** nudges. Tasks gained an optional due time; `state.v` → 14 — v0.14.
- **Phase 2b (second half) — GITHUB OAUTH (token off-device):** the relay gained `/github/login`, `/github/callback` (code→token, stored in KV), `/github/status`, `/github/graphql` (proxy with the server-side token), `/github/logout` (revoke). The GitHub room now offers a one-tap **Connect with GitHub** (OAuth) that polls until connected and proxies all GitHub data through the relay; the PAT path stays as an "Advanced" fallback. `state.v` → 15 — v0.15. **Live** (OAuth App registered, `GITHUB_CLIENT_ID = Ov23lixf4auBApdAVsRA`).
- **Phase 3 — CROSS-DEVICE SYNC:** one passphrase links every device to a single live dataset. The relay gained `/sync/pull` + `/sync/push` backed by a **Cloudflare D1** database (`docs` table, last-write-wins by `updatedAt`); the app derives `sha256(passphrase)` client-side (the DB key never touches the browser), pushes the **content** half of `state` debounced into `save()`, and pulls on focus / online / 60s-poll. Device-connection state (`relay`/`push`/`github`/`sync`) stays local; `state.v` → 16 — v0.16. **Decision note:** the roadmap named Supabase, but we shipped on **Cloudflare D1** — zero new account, the DB secret stays on the relay, strongly consistent, $0. Supabase remains a future upgrade only if realtime/field-merge is ever needed.

**Next, when Kevin says go (do NOT start unprompted):**
- **Phase 2b — DONE & LIVE:** Web Push (v0.14) + GitHub OAuth (v0.15), both activated.
- **Phase 3 — DONE & LIVE:** cross-device sync (v0.16) on Cloudflare D1 — one passphrase = one dataset across devices (see §10 shipped). One-time user step: type the **same sync passphrase** on each device.
- **Phase 4 — DONE & LIVE:** Calendar / File AI (v0.17) — relay `/extract` (Gemini multimodal: text/photo/PDF → events), an event review queue, and the `.ics` engine fixed (RRULE/DTEND/EXDATE/UTC import, DST-safe UTC export). No user step.
- **Phase 5 — LIVE (v0.18 + Google OAuth client registered 2026-06-23):** multi-account Gmail in the **Email** room — connect, read inbox, **✨ Draft reply** (Gemini), edit, **Approve & send** (`gmail.send`, threaded); tokens on the relay, never on device; never auto-sends. Code shipped + verified (relay graceful-degrade curl + a full mocked-Gmail preview run). **Activate:** register a Google Cloud OAuth client (Web app; redirect `https://kevinos-relay.kevinbigham.workers.dev/google/callback`; scopes `gmail.readonly gmail.send userinfo.email`; keep the app in **Testing** mode + add his Gmail accounts as test users to dodge the CASA audit) → set `GOOGLE_CLIENT_ID` in `wrangler.toml` + `npx wrangler secret put GOOGLE_CLIENT_SECRET` → redeploy. Full steps in `relay/RELAY_SETUP.md`. Outlook deferred (Kevin chose Gmail-first).
- **Council → action (v0.19, shipped):** an answered Council card has a **✨ Make tasks** button → relay `/actions` (Gemini) decomposes the verdict into a checklist of next-action tasks → approve onto your task list (pinned today). Closes thinking → doing.
- **Smart morning brief (v0.20, shipped):** the **Next** room opens with an **AI-written daily cockpit** card (date + a warm 2–4 sentence brief via `/ai`, auto-generated once/day, cached in `state.brief`, deterministic fallback offline); the **8am push** brief is now **date-specific** — `briefBodyShort(date)` summarizes that day's to-dos + events + first event + top task (was a flat "N things need you today").
- **Sync hardening (v0.21, shipped):** fixed a real cross-device bug (an event added on the phone never reached the Mac). Sync ordering was **wall-clock `updatedAt` compared across devices** → clock skew silently blocked propagation, and the stale-reconcile could **overwrite** the loser's data. Now it's **server-authoritative `rev`** (optimistic concurrency; the relay stamps `updated_at` itself), the conflict path **merges losslessly** (`mergeById` union — never overwrite — then re-pushes to converge), and the sync footer shows a **link code** (first 6 of `sha256(passphrase)`) so a passphrase mismatch between devices is obvious. `bumpSyncStamp` is gone; `syncPush(depth,force)` carries the bounded re-push + force-overwrite. Relay `/sync/push` takes `baseRev`+`force` (legacy `rev` still read). Verified: relay curl suite (incl. a 1970-clock device syncing fine), 11-case Node merge/convergence test, preview reproduction of the phone↔Mac case. `state.v` → 21, SW cache `kevinos-v0_21`.
- **Proactive Brief 2.0 (v0.23, shipped):** the morning brief is now **generated server-side at send time**, not pre-computed on the device. Relay `buildServerBrief` + `POST /brief` read the day's tasks/events from the **synced D1 doc** (or app-supplied `context`) + a **live inbox peek** (`briefInbox`: unread count + a few subjects via the on-relay Gmail tokens), then Gemini writes a 2–4 sentence brief (calls out emails needing a reply; ignores marketing). `firePush` regenerates the body fresh for any `gen:"brief"` reminder, so the **8am push is smart even when the app's been closed** (the app schedules 7 mornings ahead via `buildReminders`, each carrying `gen/syncKey/emailSession/dateKey/tz`). The in-app brief card calls the same `/brief`. Deterministic fallback (`briefBodyShort`) on any miss. `state.v` → 23, SW cache `kevinos-v0_23`.
- **Overnight Auto-Drafts (v0.24, shipped):** the relay pre-writes replies to real unread mail so mornings show ready-to-send drafts. `generateOvernightDrafts(env, session, max)` lists Gmail `category:primary` unread (not from me), Gemini drafts each (or returns `SKIP`), stores in KV `gdraft:<session>`. `POST /google/overnight {session, generate?|remove?}` = generate / list / remove. Cron `firePush` runs it for any `gen:"draft"` reminder (~1h before the brief) and pushes "📝 N replies ready" only when count>0. App: **✨ Draft all** button (`fetchOvernight(true)`) + auto-load on entering the Email room (`emailEnter` → `fetchOvernight(false)`); drafts render as the existing review cards via `emailDrafts[id]` (`overnight:true`, badge), and send/discard call `clearOvernight(id)` → relay `remove`. Never auto-sends. `state.v` → 24, SW cache `kevinos-v0_24`.
- **Smart Inbox (v0.25, shipped):** the Email room triages itself at **zero extra AI cost** using Gmail's own category labels. Relay `/google/threads` tags each message `category` via `gmailCategory(labelIds)` → `noise` (CATEGORY_PROMOTIONS/SOCIAL), `fyi` (CATEGORY_UPDATES/FORUMS), or `primary`. App groups the inbox into **📌 Needs you** (primary, always open, unread-first), **📰 FYI**, **🔕 Noise** (collapsed, `emailGroupsOpen` toggles via `data-em="grp"`; `emailRowHTML`/`emailGroupHTML` helpers). Overnight drafts/"Draft all" target the `primary` bucket. `state.v` → 25, SW cache `kevinos-v0_25`.
- **Triple drop (v0.26, shipped):** three composing email features. **Unified inbox** — a `📥 All inboxes` selector (`active = "__all__"`/`UNIFIED`); relay `/google/threads` `all:true` merges every account via `gmailInbox()` (each msg tagged `account`+`ts`); the app routes draft/send/**archive** per-message via `acctForId(id)` (the message's own account, not the selector) and badges each row with `acctShort(account)` in unified view. Connecting a 2nd account defaults to unified. **Triage** — per-row **✓ Archive** (relay `/google/modify` removes `INBOX` → lands in Gmail, cross-device-consistent) and **💤 Snooze** (3h / Tomorrow / Weekend) → `state.email.snoozed` map (**device-local**, in `SYNC_SKIP`; `{wakeAt,account,from,subject,…}`), hidden from groups via `isSnoozed(id)`, shown in a collapsible **💤 Snoozed** group with **Wake now**; `pruneSnoozed()` auto-wakes past-due ones on enter/load. **Weekly Review** — `state.weekly` (`{weekKey,date,text}` — device-local, in `SYNC_SKIP`); `weeklyContextText`/`weekDigestApp` build the context; `generateWeekly`→`POST /weekly`; a **🗓️ Your week** card under the daily brief on Next (auto once/week via `maybeAutoWeekly`, keyed by `weekStartKey` = the week's Sunday); `buildReminders` adds `gen:"weekly"` jobs for the next 4 Sundays @ 5pm (`nextDowTime`). Verified: relay curl + full preview run (two-account merge w/ badges, snooze→group→wake, archive routed to the right account, single-account switch drops `all`/badges, weekly card auto-gen+persist, zero console errors). `state.v` → 26, SW cache `kevinos-v0_26`.
- **Command Palette (v0.27, shipped):** global `⌘K` / Ctrl+K overlay plus visible nav pill. Static `COMMANDS` registry covers all 12 rooms and quick actions: New task, Email, Refresh inbox, Snooze all noise, Generate brief, Generate weekly review, Refresh GitHub. Pure app feature: no relay route, no `state` field, no sync change, no `state.v` bump; footer and SW cache bumped to `v0.27` / `kevinos-v0_27`. Verified with inline-script parse, ES5 added-line grep, local preview click-through (keyboard toggle/filter/arrows/Enter/Esc/backdrop/row click/mobile tap), and relay health probe.
- **Voice Quick-Capture (v0.28, shipped):** global floating mic button opens SpeechRecognition when available and a textarea fallback otherwise. Relay `/capture` classifies transcripts into exact task/event/note shapes via Gemini strict JSON, with local/fetch fallback to a note and deterministic weekday correction against `today`; app writes only existing synced arrays (`state.items`, `state.events`, `state.notes`) and shows a 6-second Undo. No new persisted shape, no `state.v` bump; footer/cache moved to `v0.28` / `kevinos-v0_28`. Verified: live relay curl for task/event/note + 400 bad body, local fallback capture + Undo, relay-backed UI capture + Undo, inline-script parse, ES5 diff grep, and console-error check.
- **Next mission feature:** #3 Calendar Room, then #5 Habits, #4 One-Tap Send, #6 Link Stash, #7 People Radar, #8 Spend Pulse, #9 Goals & Weekly Check-In, #10 Morning Launch Sequence.

**Carry-over hardening backlog:** `parseICS` ignores DTEND/TZID/RRULE/EXDATE; exported timed events float local → DST drift. (Both scheduled for Phase 4.)

---

## 11. How to resume from scratch (new machine / fresh clone)

1. **One clone gets you everything:**
   ```
   git clone https://github.com/KevinBigham/kevinos.git
   ```
   That gives you the app, `relay/`, `ROADMAP.md`, and this `HANDOFF.md` (in a fresh clone, `relay/` sits at the repo root, e.g. `kevinos/relay/`).
2. **Relay redeploy** if ever needed: `cd <clone>/relay && npx wrangler deploy`. Kevin re-runs `npx wrangler login` once if the OAuth cache is gone. **Secrets persist on Cloudflare's side** — they do NOT need re-entering unless rotating.
3. To edit + ship the app: §5. To touch the backend: §6.
4. Read `ROADMAP.md` for the plan, the memory dir (§9) for context, then ask Kevin what's next.

**The whole stack runs at $0/mo. Keep it that way unless Kevin opts into a cost.**
