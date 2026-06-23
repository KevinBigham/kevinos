# KevinOS — Handoff to the next Claude Code

*Written 2026-06-22. Read this first. It's the complete state of the project so you can pick up cold. Everything (app + backend + docs) lives in one repo: `github.com/KevinBigham/kevinos`.*

---

## 0. TL;DR (read this, then skim the rest)

KevinOS is Kevin's **personal life operating system** — a calm daily cockpit (tasks, calendar, notes, projects, GitHub, reference) as an installable PWA. It is **live, installed on his phone, and fully working**.

- **App:** `v0.12`, live at **https://kevinbigham.github.io/kevinos/** (GitHub Pages, public repo `KevinBigham/kevinos`).
- **Backend ("the relay"):** a Cloudflare Worker, **live** at **https://kevinos-relay.kevinbigham.workers.dev**. It holds every AI key as a server secret and powers the in-app **Council**. As of v0.12 the Council is **multi-model with per-seat lanes**: one prompt fans out to **5 free seats** (Gemini, Cloudflare Workers AI, Groq, Mistral, OpenRouter) in parallel — each answering from a distinct assigned role (grounded · fast tactical · research · open-model · devil's advocate) — then a **synthesis chair** (Gemini) combines them into one decision-ready brief, which Kevin can save to Notes. Source is in `relay/` in this same repo.
- **Whole stack is operational at $0/mo.** Phases 0 → 2 shipped, including the v0.12 Council (multi-model, per-seat lanes, save-to-Notes).
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
│   ├── index.html                   ← THE APP (v0.12, ~1850 lines, ES5)
│   ├── manifest.json                ← PWA manifest (+ share_target)
│   ├── sw.js                        ← service worker (CACHE = "kevinos-v0_11")
│   ├── icon-192.png, icon-512.png, .nojekyll
│   ├── README.md
│   ├── ROADMAP.md                   ← the full phased build plan (current)
│   ├── HANDOFF.md                   ← this file
│   ├── .gitignore
│   └── relay/                       ← Cloudflare Worker (the backend)
│       ├── worker.js                ← the Worker (ES module — modern JS OK)
│       ├── wrangler.toml            ← config: PROVIDER, [ai] binding, per-seat models, CORS origin
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
2. **Bump the service-worker cache** in `sw.js` every release: `var CACHE = "kevinos-v0_11";` (increment). This is what forces clients to pull the new version — skip it and users get stale cached code.
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

**Endpoints:**
- `GET /` → health `{ ok, service, provider, seats:[…] }` (seats = currently-live roster)
- `POST /council` with `{ prompt, system?, synthesize? }` → `{ seats:[{id,label,lane,provider,model,ok,text,ms,error}], synthesis:{ok,provider,text}|null, asked, answered }`. Fans out in parallel with a **45s per-seat timeout**; one slow/failed seat never blocks the rest; synthesis runs when ≥2 seats answer.
- `POST /ai` with `{ prompt, system? }` → `{ text, provider }` (single model, back-compat)

**Quick live test (works from anywhere — the relay doesn't reject by Origin):**
```
curl https://kevinos-relay.kevinbigham.workers.dev/
curl -X POST https://kevinos-relay.kevinbigham.workers.dev/council \
  -H "Content-Type: application/json" -d '{"prompt":"one-sentence test"}'
```

**In-app wiring:** Next room → Council queue → "Connect AI" → paste the relay URL → Save (`state.relay.url`). Ask a question → `queued → running → answered`. The answer renders as a **synthesis card** (the chair's brief) above a collapsible **"N of M answered"** roster of per-seat cards (each with its lane, provider, response time, and Copy). Falls back to the single-answer shape automatically if the relay is an older `/ai`-only build. Degrades gracefully offline.

---

## 7. How to verify changes (and the one big gotcha)

**App UI:** use the **Claude_Preview MCP** (this project's preview server is named `kevinos`, port 8128). `preview_start` if needed, then `preview_snapshot` / `preview_screenshot` / `preview_click` / `preview_eval`.

**Gotchas learned the hard way:**
- **The app's closure functions are NOT reachable from `preview_eval`.** Only the DOM + `localStorage` are. Test behavior through the DOM, or read/poke `localStorage["kevinos:v1"]`.
- **`save()` is async** (Promise microtask). If you write state then read `localStorage` in the *same* `preview_eval`, you'll get the OLD value. Re-read in a *separate* eval call.
- **CORS is a *browser* guard, not a server check.** The relay sets `Access-Control-Allow-Origin` to the live site, so a **browser** on any other origin (preview server, localhost) is blocked — for in-browser UI testing, mock `window.fetch` in a `preview_eval` (that's how the v0.11 Council UI was verified). But the Worker does **not** reject by Origin, so a **server-side `curl` POST to `/council` works for real end-to-end testing** with live models — the fastest way to confirm seats answer, no deploy-to-live needed.

---

## 8. Gotchas & lessons (don't relearn these)

- **Provider mismatch bites:** setting the `GEMINI_API_KEY` secret is not enough — `wrangler.toml`'s `PROVIDER` var must also say `"gemini"`, then redeploy. We lost time once because the secret was set but `PROVIDER` was still `"claude"` (so it called Claude and errored). The deployed bindings print the active `PROVIDER` — check them after deploy.
- **Claude billing:** Kevin's Anthropic account had $0 credit, so Claude auth *succeeded* but calls failed with "credit balance too low." That's why we run on Gemini's free tier. (The Claude key still works the moment there's credit — just flip `PROVIDER`.)
- **Finding the Council:** it lives in the **Next** room (top nav), scroll to the bottom — NOT on Home. Kevin looked for it on Home and couldn't find it.
- **Event handling:** the app uses **event delegation on stable containers** so `innerHTML` re-renders don't drop listeners. Follow that pattern; don't attach listeners to elements that get re-rendered.
- **State persistence:** `window.storage` (Claude host) → `localStorage` → in-memory fallback. `STORE_KEY = "kevinos:v1"`. Current `state.v = 12`. When you change the state shape, bump `state.v` and handle the migration in `load()`. (v11 added per-question `seats[]` + `synthesis` to `state.council[]`; old single-`answer` items still render via a legacy branch. v12 added no new shape — "Save to Notes" writes a Council session into `state.notes` as an ordinary note.)
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

**Next, when Kevin says go (do NOT start unprompted):**
- **Phase 2b:** Web Push reminders to the installed PWA + email-to-self backstop; move the GitHub PAT off-device to OAuth via the relay.
- **Phase 3 — Sync:** Supabase (free tier), last-write-wins + `updatedAt`, so one dataset spans Mac + phone.
- **Phase 4 — Calendar/File AI:** messy input (notes/PDFs/screenshots) → AI extracts events → review queue → `.ics`. Also fixes carried-over `.ics` bugs (parseICS DTEND/TZID/RRULE/EXDATE; DST drift on export).
- **Phase 5 — Email Command Center (built last):** Gmail/Outlook via relay OAuth, AI drafts overnight → review queue, never auto-sends.

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
