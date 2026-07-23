# KevinOS — Implementation Roadmap
*The build plan for the soon-to-be-legendary life OS. Set 2026-06-22. Check boxes as we ship.*

---

## North Star
KevinOS is a **calm daily cockpit** that unifies tasks, calendar, notes, projects, email, and reference across every device Kevin owns. One live dataset, installable as an app, works offline, and gets smart when connected. AI **proposes**, Kevin **approves** — nothing acts on its own.

## Operating principles (the rules we don't break)
1. **Local-first.** The app is fully usable with no network. Cloud is an enhancement, never a dependency.
2. **Review-queue is the core primitive.** Every AI action lands in `pending` → Kevin approves → `done`. Email never auto-sends. Calendar events never auto-create.
3. **Calm, not noisy.** Token expiry is a gentle "Reconnect," not an error. No alarm-red UI.
4. **Cheap by design.** Free tiers first. Hard ceiling ~$25/mo + AI <$5/mo.
5. **Evolve, don't rewrite.** One self-contained file as long as it holds; add a build step only when it genuinely hurts.
6. **Secrets off the browser.** Once the relay lands, OAuth tokens live server-side. PAT-on-device is a temporary, eyes-open tradeoff.

---

## Status board
| | Phase | State |
|---|---|---|
| ✅ | **0 — Foundation** (bug fixes, JSON backup, PWA-ify) | **Shipped** v0.6 |
| ✅ | **GitHub Room** (streak keeper) | **Shipped** v0.7 |
| ✅ | **0.5 — Permanent Deploy** | **Shipped** → kevinbigham.github.io/kevinos |
| ✅ | **1 — Ultimate To-Do Hub + offline Council bridge** | **Shipped** v0.8 |
| ✅ | **1.5 — Daily polish** (recurring, share-capture, backup nudge, wind-down) | **Shipped** v0.9 |
| ✅ | **2 — The Relay** (online AI + review queue) — *first slice LIVE* | **Shipped** v0.10 → relay on Gemini, $0/mo |
| ✅ | **2 — Multi-model Council** (5-seat fan-out + synthesis chair) | **Shipped** v0.11 → Gemini · Cloudflare · Groq · Mistral · OpenRouter, $0/mo |
| ✅ | **2 — Council depth** (per-seat lanes + save-to-Notes + auto-run on connect) | **Shipped** v0.12 → grounded · tactical · research · open-model · devil's-advocate, $0/mo |
| ✅ | **2 — Council live streaming** (per-seat cards fill in as each model returns) | **Shipped** v0.13 → NDJSON stream, ES5 reader, $0/mo |
| ✅ | **2b — Phone reminders** (Web Push: morning brief + per-task due-time) | **Shipped** v0.14 → VAPID + KV + cron, $0/mo |
| ✅ | **2b — GitHub OAuth** (token off-device via the relay) | **LIVE** v0.15 → OAuth App registered, relay holds the token, $0/mo |
| ✅ | **3 — Sync** (one live dataset across devices) | **LIVE** v0.16 → passphrase-linked, Cloudflare D1, $0/mo |
| ✅ | **4 — Calendar / File AI** (photo/PDF/text → reviewed events) | **LIVE** v0.17 → Gemini multimodal + .ics hardening, $0/mo |
| ✅ | **5 — Email Command Center** (multi-account Gmail) | **LIVE** v0.18 → Google OAuth client registered, relay holds the token, $0/mo |
| ✅ | **5+ — Email power-ups** (proactive brief · overnight drafts · smart inbox · **unified inbox · triage · weekly review**) | **LIVE** v0.20→v0.26 → $0/mo |
| 🧪 | **Inbox Intelligence** (whole-inbox prompt · response-needed scan · relationship history · three reply choices) | **Code-complete** v0.48 → tested locally; awaiting Kevin GO to push/deploy |
| ✅ | **Mission wave #1 — ⌘K Command Palette** | **Shipped** v0.27 → pure app, keyboard-first navigation/actions |
| ✅ | **Mission wave #2 — Voice Quick-Capture** | **Shipped** v0.28 → mic/textarea capture, relay `/capture`, Undo |
| ✅ | **Mission wave #3 — Google Calendar Room** | **Shipped** v0.29 → live Google agenda, free slots, typed event creation |
| ✅ | **Mission wave #5 — Habits & Streaks** | **Shipped** v0.30 → synced habits, streaks, 8pm open-habit nudges |
| ✅ | **Mission wave #4 — One-Tap Send** | **Shipped** v0.31 → tone presets, confirmed send, archive-on-success |
| ✅ | **Mission wave #6 — Link Stash + AI TL;DR** | **Shipped** v0.32 → synced read-later stash, relay `/summarize`, search/tag/manual fallback |
| ✅ | **Mission wave #7 — People Radar** | **Shipped** v0.33 → synced mini-CRM, Gmail metadata enrich, cadence groups, Sunday people nudges |
| ✅ | **Mission wave #8 — Spend Pulse** | **Shipped** v0.34 → private weekly spend card, cash ledger, Gmail receipt scan, category bars |
| ✅ | **Mission wave #9 — Goals & Weekly Check-In** | **Shipped** v0.35 → synced goals, Sunday check-in, `/weekly` goal momentum |
| ✅ | **Mission wave #10 — Morning Launch Sequence** | **Shipped** v0.36 → Launch ritual, `/launch` game plan, agenda/inbox/focus/habits |
| ✅ | **Sync hardening + whole-life AI** (tombstones · newer-wins merge · life intake → profile facts in every prompt · multi-calendar · weather · swim desk · Sheets digest) | **Shipped** v0.37–v0.38 |
| ✅ | **Evolution Marathon P1–P10** (trust guardrails · blob diet · snapshot ring · Today cockpit · global capture + bottom nav · relay health chip · federated Library · Attic collapse · evening Close + universal AI · opt-in relay auth) | **Shipped** v0.39 → spec + ledger in `MISSION.md`, executed by Codex in one run |
| 🚧 | **GOAT audit + wave roadmap** (100-item roadmap to v1.0) | **In flight** → `KEVINOS_AUDIT.md` + `KEVINOS_EXECUTION_ORDER.md`, W0 ships v0.40 |

---

## ✅ Phase 0 — Foundation *(shipped, v0.6)*
- [x] `.ics` re-import dedupe in `handleFile`
- [x] JSON Export / Import backup buttons (cache-clear no longer wipes data)
- [x] Panel-scoped edit reads via `pf(sv,id)` (fixes wrong-record save with two editors open)
- [x] Installable PWA — `manifest.json` + network-first `sw.js`, registration guarded to http(s)
- [x] State bumped v5 → v6, verified in-browser (boots clean, no console errors)

## ✅ GitHub Room — Streak Keeper *(shipped, v0.7)*
- [x] Connect via Personal Access Token, called directly against `api.github.com/graphql` (CORS-enabled → zero backend)
- [x] One `viewer` query → profile + last 6 repos + contribution calendar
- [x] `computeStreaks()` — current + longest (current survives a still-zero "today")
- [x] Profile, "shipped today" banner, 3 stat tiles, purple→gold heatmap, recent repos w/ language dots + stars + private lock + relative push time
- [x] Caches last fetch for instant/offline load; Refresh / Disconnect

---

## ✅ Phase 0.5 — Permanent Deploy *(shipped, v0.8)*
**Goal:** A forever-URL that installs on the iPhone for keeps, so Kevin can actually live in it every day.

**Shipped:**
- [x] Host: **GitHub Pages** (public repo `KevinBigham/kevinos`, branch `main` /root, `.nojekyll`)
- [x] One-time `gh auth login` done (token in keyring, scopes repo+workflow) — future deploys need nothing from Kevin
- [x] **Scrubbed all personal/proprietary data** from the code before going public (generic seeds; real data stays on-device + in backups)
- [x] Pushed `app/` → **live at https://kevinbigham.github.io/kevinos/** (HTTP 200, all PWA assets serving)
- [ ] *(Kevin)* Add to Home Screen on iPhone; *(Kevin)* carry data over via footer Export → Import if needed

**Deploy flow now:** edit in `/Users/kevin/KevinOS/app` → `git push` → Pages auto-rebuilds in ~10s. The old trycloudflare tunnel is retired.
**Done when:** ~~the app opens from the home-screen icon, offline, on the real permanent URL.~~ ✅
**Cost:** $0.

---

## ✅ Phase 1 — Ultimate To-Do Hub + offline Council bridge *(shipped, v0.8)*
**Goal:** One screen that answers "what do I do next?" — and a way to capture AI-worthy thoughts even with no signal.

**Shipped:**
- [x] **Next room** — unified command center aggregating open tasks **+ project next-actions + build next-steps** into one prioritized view (surfaces the next-actions otherwise buried inside Projects/Studio)
- [x] Buckets: **Overdue / Today / This week**, with a "+N more without a near-term date →" link out to Tasks; filterable by life area (Work, Coaching, Teaching, Personal, Ana, Inbox)
- [x] Calm focus hero ("N things need you today" / "You're clear for today"); fast quick-capture (pins to today so it surfaces instantly); check tasks off in place
- [x] **Offline Council queue** — capture a question offline; persists with a `queued` pill + "runs when AI connects (Phase 2)" note. Stub now, wired to the relay later.
- [x] GitHub polish: **commit-today nudge** on Home — appears only when today's contributions are still 0, shows the live streak count, taps through to the GitHub room; auto-hides once you've shipped

**Tech:** all client-side, no backend. Reads existing `state` entities + new `state.council[]`; fully delegated event handling so the room re-renders cleanly. Verified in-browser end-to-end (capture, buckets, area filter, check-off, council add/delete, nudge render + nav), zero console errors.
**Done when:** ~~every open task across rooms shows in one ranked list, and offline captures persist for later AI.~~ ✅
**Cost:** $0.

---

## ✅ Phase 1.5 — Daily polish *(shipped, v0.9)*
**Goal:** Make it sticky enough to live in every day, before the backend lands.

**Shipped:**
- [x] **Recurring tasks** — daily / weekdays / weekly / monthly; completing one rolls the next occurrence forward automatically (↻ indicator, repeat picker in capture + editor)
- [x] **Share / URL quick capture** — `?add=…&area=…` (and Web Share Target `title/text/url`) drops straight into the Inbox pinned to today, then cleans the URL + toasts. iOS path = a one-tap Shortcut that opens that URL.
- [x] **Backup-hygiene nudge** — Home reminds you to export when data exists and the last backup is >7 days old (tracks `lastBackupAt`)
- [x] **Evening wind-down ritual** — calm overlay to close the day: finish / push-to-tomorrow / let-go each open item, or roll all forward; gentle evening Home nudge after 5pm; records `lastShutdown`
- [x] Fix: sweep-card title/subtitle now stack properly

**Tech:** all client-side, no backend. Verified in-browser end-to-end (recurrence roll-forward, share ingest, backup nudge + persist, wind-down actions), zero console errors.
**Cost:** $0.

---

## ✅ Phase 2 — The Relay  *(the unlock — backend is LIVE)*
**Goal:** A tiny server that holds secrets and does the things a browser shouldn't: hold OAuth tokens, call AI, send push.

**Shipped & LIVE (v0.10):**
- [x] **Cloudflare Worker** written + **deployed** — live at `https://kevinos-relay.kevinbigham.workers.dev` (`/relay/worker.js` + `wrangler.toml` + `RELAY_SETUP.md`); **switchable provider** (Claude *or* Gemini via `PROVIDER` env); API key held as a Worker secret, never in the browser
- [x] **Provisioned** *(Kevin)* — free Cloudflare account + AI key; running **Gemini 2.5 Flash** on the free tier (**$0/mo**); both `GEMINI_API_KEY` (active) and `ANTHROPIC_API_KEY` (idle) secrets set; relay URL connected in-app
- [x] **Online AI in-app** — Council queue wired to `<relay>/ai`: `queued → running → answered/error`, inline answers + Copy + Retry, auto-runs on Ask when connected, fully degrades offline; CORS locked to the Pages origin
- [x] **Review-queue engine** — first incarnation (the Council `queued → answered` flow); generalizes to calendar/email later

**Shipped & LIVE (v0.11) — Multi-model Council:**
- [x] **`/council` endpoint** — fans one prompt to every configured seat in parallel (`Promise.all`, 45s per-seat timeout); one slow/failed seat never blocks the rest
- [x] **5 free seats**, each self-enabling when its credential exists: **Gemini** (chair), **Cloudflare Workers AI** (no key — `[ai]` binding), **Groq**, **Mistral**, **OpenRouter** (wildcard `:free`). All free tiers, **$0/mo**
- [x] **Synthesis chair** (Gemini) — distills the answers into one brief: Consensus / Split / Recommendation / Watch-fors (runs when ≥2 seats answer)
- [x] **App UI** — synthesis card + collapsible "N of M answered" roster of per-seat cards (lane, provider, timing, Copy); legacy single-answer items still render; `state.v` → 11
- [x] **Verified live** end-to-end via server-side `curl /council` (the relay doesn't reject by Origin) — real multi-model answers + synthesis
- [x] Realizes the **"Council of Friends"** workflow — automated, in-app, $0/mo

**Shipped & LIVE (v0.12) — Council depth:**
- [x] **Per-seat lanes** — each seat answers from a distinct assigned role (grounded / fast tactical / research / open-model / devil's advocate) instead of the same prompt ×5; the synthesis chair is lane-aware. Realizes Kevin's "distinct assignment per friend" rule end-to-end — verified live (5/5 seats genuinely diverged on the same question)
- [x] **Save Council → Notes** — one tap turns a session (question + synthesis + every seat) into a durable note (`Resource` bucket, `council` tag)
- [x] **Auto-run on connect** — offline-queued questions fire automatically the moment the relay connects (fulfils the UI's existing promise); `state.v` → 12
- [x] **Verified** — live `curl /council` (divergent lane answers + lane-aware synthesis) **and** browser preview against a mocked relay (Save-to-Notes + auto-run, no console errors)

**Shipped & LIVE (v0.13) — Council live streaming:**
- [x] **Streaming `/council`** — opt-in `stream:true` returns an **NDJSON** stream (`start` → `seat`×N in completion order → `synthesis` → `done`) so seats arrive the instant each model returns; the default non-streaming JSON shape is kept for `curl`/back-compat. Refactored seat-running into a shared `runSeat()` used by both paths
- [x] **Live per-seat fill-in** — the app reads the stream with a small ES5 reader (`response.body.getReader()` + `TextDecoder`, line-buffered); each pending seat shows a "thinking" pulse, then swaps to its answer under a live **"N of M answered · live"** counter, settling into the synthesis card when `done`. Falls back to a one-shot parse if the browser lacks a streaming body, and to the legacy `/ai` shape on an old relay
- [x] **No persisted shape change** (`state.v` → 13) — streaming uses transient `streaming`/`pending` flags cleared before `save()`
- [x] **Verified** — live `curl -N` proved staggered delivery (start 0.05s → Groq 0.36s → rest 0.99s → done 1.10s); browser preview drove a manual-emit NDJSON mock through every state (5 thinking cards → progressive fill → synthesis → Save-to-Notes captured the streamed data), zero console errors

**Shipped & LIVE (v0.14) — Phone reminders (Web Push):**
- [x] **Web Push to the installed PWA** — VAPID + RFC 8291 `aes128gcm` payload encryption, all in WebCrypto on the relay (no library). The app subscribes via `pushManager`; the relay signs (ES256 VAPID JWT) + encrypts + sends. Encryption verified **byte-for-byte against the RFC 8291 test vector**; the cron fires every 2 minutes (originally every minute — throttled 2026-07-02 because each fire costs a KV list and every-minute blew the free tier's 1,000 lists/day, 429-ing pushes from mid-afternoon on)
- [x] **Two reminder types** — a **morning brief** at a chosen hour ("N things need you today") + **per-task due reminders** (any task with a due *time*). The app computes its reminder set and syncs it to the relay (`/push/sync`); a Cloudflare **KV** store + **cron trigger** fire due ones and drop them (the app owns recurrence by re-syncing). Tasks gained an optional **due time**; `state.v` → 14
- [x] **$0/mo** — Cloudflare KV + Cron free tier. Verified end-to-end in preview (subscribe → sync → per-task + brief payloads, hour selector, send-test), zero console errors. The one device-only step is Kevin tapping **Send test** once on his iPhone to confirm a notification lands

**Shipped (code) v0.15 — GitHub OAuth (token off-device):**
- [x] **Relay OAuth flow** — `/github/login` (→ GitHub consent), `/github/callback` (code→token exchange, stores the token in KV under the app's session), `/github/status` (poll), `/github/graphql` (proxies the GitHub GraphQL query with the server-side token), `/github/logout` (revokes the token on GitHub + forgets it). **The browser never sees the token.**
- [x] **App** — a one-tap "Connect with GitHub" (OAuth) in the GitHub room: opens the consent tab, polls `/github/status` until the token lands, then proxies all GitHub data through the relay. The personal-token path is kept as an "Advanced" fallback. `state.v` → 15. Verified in preview (connect → poll → proxied render → disconnect; token never in the browser; zero console errors)
- [x] **Activated** — GitHub OAuth App registered (callback `https://kevinos-relay.kevinbigham.workers.dev/github/callback`) → `GITHUB_CLIENT_ID` var + `GITHUB_CLIENT_SECRET` secret set, deployed, live
- [ ] *(optional)* email-to-self backstop

**Tech:** Cloudflare Worker; Google kept in **Testing mode** (sole user) to dodge the ~$900–1,500/yr CASA audit; treat 7-day token expiry as a calm "Reconnect."
**Done when:** an AI suggestion appears in the review queue, Kevin approves it, and a push notification fires — all without any token in the browser.
**Cost:** ~$0 (free tiers), AI <$5/mo.

---

## ✅ Phase 3 — Sync  *(one dataset, every device — shipped, v0.16)*
**Goal:** Edit on the Mac, see it on the phone. No more per-URL islands.

**Shipped & LIVE (v0.16):**
- [x] **Relay-mediated sync on Cloudflare D1** (not Supabase — see note). New `/sync/pull` + `/sync/push`; one `docs(id, doc, updated_at, rev, device_id)` table; **one last-write-wins document per passphrase**.
- [x] **Secrets off the browser:** the app derives `id = sha256(passphrase)` client-side and sends only that fingerprint — the D1 credential lives on the relay, never in the browser. A strictly-newer stored doc is never clobbered (server-side LWW guard returns `stale` so the app reconciles).
- [x] **Content-only replication:** items/events/projects/builds/briefs/links/prompts/notes/council (+ lastBackupAt/lastShutdown) sync; device-connection state (`relay`/`push`/`github`/`sync`) stays local.
- [x] **Pull on focus / visibility / online + a 60s poll** (skipped mid-edit so it never yanks the UI); **push debounced 2s** into `save()`. Monotonic timestamps so a future-dated remote clock can't lock out local edits.
- [x] **Backup/restore still the escape hatch;** `state.sync` is never restored from a backup, so importing data can't silently link a device. `state.v` → 16.
- [x] **Verified:** relay round-trip via curl (pull / push / stale-guard / bad-key); app in preview against a mocked relay — connect seeds the cloud with content-only keys, a simulated second-device write pulls in on focus, a local edit pushes up, disconnect keeps local data. Zero console errors.

**Why D1, not Supabase:** the roadmap named Supabase, but Cloudflare **D1** needs **zero new account** (it's on the Cloudflare account the relay already uses), keeps the **DB secret on the relay** (matches "secrets off the browser"), is **strongly consistent**, and stays **$0**. Supabase remains the upgrade path if realtime or per-field merge is ever needed.
**Tech:** the existing storage abstraction (`window.storage` → localStorage → memory) gains a cloud tier through the relay; no app dependency added (still ES5, single file).
**Done when:** ~~a change on one device appears on another within seconds, offline edits reconcile on reconnect.~~ ✅
**Cost:** $0 (Cloudflare D1 free tier — 5 GB, far beyond a solo dataset).

---

## ✅ Phase 4 — Calendar / File AI *(shipped, v0.17)*
**Goal:** Throw messy input at it — notes, PDFs, screenshots — and get clean calendar events out.

**Shipped & LIVE (v0.17):**
- [x] **Relay `/extract`** — Gemini 2.5 Flash **multimodal**: typed text, a photo/screenshot, or a PDF → strict-JSON events `{title,date,start,end,allDay,location,notes}`, resolving relative dates ("next Saturday") against today + the device timezone. Sanitized server-side. The key stays on the relay; the browser sends base64 + asks.
- [x] **Smart-add capture** in the Calendar room — paste text and/or upload a photo/PDF → "Extract events" → proposed events land in a **review queue**.
- [x] **Review queue (the core primitive):** each proposed event is an editable card (title/date/time/area) with **Add to calendar** / **Dismiss** (+ Approve-all / Dismiss-all). AI proposes → Kevin approves → it becomes a real event. Queue is `state.pending` (syncs as content).
- [x] **Calendar hardening (clears the last v0.5 bugs):** `parseICS` now honors **DTEND, RRULE** (DAILY/WEEKLY/MONTHLY/YEARLY + INTERVAL/COUNT/UNTIL, weekly **BYDAY**), **EXDATE**, **LOCATION/DESCRIPTION**, and **Z (UTC→local)**; recurring events expand into individual occurrences (bounded, RFC-correct COUNT-before-EXDATE). Export now writes **timed events as UTC (Z)** so they no longer float/drift across DST in Apple/Google, plus LOCATION/DESCRIPTION.
- [x] **Verified:** `/extract` curl (text → 3 correct events incl. relative dates); **Node test suite** for the ICS engine — RRULE/BYDAY/UNTIL/EXDATE + DST round-trip — **all pass across 4 timezones** (system / Eastern / Central / Honolulu); app in preview (mocked `/extract` → 2 review cards → approve → event on the calendar), zero console errors.

**Tech:** relay AI (Phase 2) multimodal + the review-queue primitive; reuses the existing `.ics` engine, now fixed. `state.v` → 17.
**Done when:** ~~a screenshot of a flyer becomes a correctly-timed, reviewed event on the calendar.~~ ✅
**Cost:** $0 (Gemini free tier).

---

## ✅ Phase 5 — Email Command Center  *(LIVE — v0.18, Google OAuth client registered 2026-06-23)*
**Goal:** Read your inbox in the cockpit; AI drafts a reply; you approve and it sends.

**Built & verified (v0.18) — activated 2026-06-23:**
- [x] **Multi-account Gmail** via relay OAuth (Kevin's choice; Outlook deferred). `/google/login` → consent → `/google/callback` stores **refreshable** tokens in KV keyed by session+email; `/google/status` (poll); the browser holds only a random session + the account emails, **never a token**. Add more accounts by connecting again.
- [x] **Inbox in the cockpit** — `/google/threads` lists recent INBOX messages (from/subject/snippet/unread) per account, with an account switcher.
- [x] **AI-drafted replies → review queue** — `/google/draft` reads a message and Gemini writes a reply; it appears as an **editable** card (To + body). **Send on approval** — `/google/send` sends via `gmail.send` (Kevin's choice: full one-tap send) with `In-Reply-To`/`References`/`threadId` so it threads correctly. **Never auto-sends** — every send is a human tap.
- [x] **Disconnect** revokes the token on Google and forgets it. Reuses the `PUSH` KV (`gml:` prefix). `GET /` health gained `email:bool`.
- [x] **Verified:** relay deployed + curl-confirmed it **degrades gracefully** until configured (`email:false`, "not configured" page, 401s); app in preview against a mocked Gmail — connect → inbox list → AI draft → edit → approve→send (correct payload incl. threadId/messageId) → disconnect; zero console errors. `state.v` → 18.

**Activated 2026-06-23** — Google Cloud OAuth client registered (Web app; redirect `…/google/callback`; Testing mode + test users; Calendar scopes added in v0.29) → `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` set and deployed. For a fresh rebuild see `relay/RELAY_SETUP.md`.
**Tech:** relay + the review-queue primitive + Gemini; all earlier phases compounding.
**Done when:** ~~morning shows ready drafts; approving one sends it.~~ ✅
**Cost:** $0 (Gemini free tier + Gmail API free).

---

## Infra & cost summary
- **Stack (as shipped):** GitHub Pages (static app) + Cloudflare Worker + KV + D1, all free-tier. Vanilla JS, no framework. *(The original plan named Cloudflare Pages + Supabase; both decisions went the other way — see Phase 3's "Why D1, not Supabase".)*
- **AI:** Gemini Flash/Flash-Lite for volume; a stronger model reserved for quality drafts.
- **Trajectory:** $0/mo live today → AI <$5/mo if usage ever outgrows free tiers.

## Security & privacy model
- Review-queue everywhere; **email never auto-sends**, **events never auto-create**.
- Tokens off-browser once the relay exists; until then GitHub PAT is on-device only, wiped on Disconnect.
- Google **Testing mode** (sole user) avoids the CASA audit cost; 7-day token expiry is a calm reconnect, not a failure.

## Hardening backlog (carry-over)
- [x] `parseICS` ignores DTEND / TZID / RRULE / EXDATE *(fixed in v0.17 — see Phase 4)*
- [x] Exported timed events are local-floating → DST drift *(fixed in v0.17 — see Phase 4)*

## Open decisions *(both since decided)*
- **Host for Phase 0.5:** ~~GitHub Pages vs Cloudflare Pages~~ → GitHub Pages, live.
- **Sync trigger:** ~~ship Phase 3 only once two devices are actively in daily use~~ → shipped v0.16.

---

## 🔥 Next move
**Phases 0 → 1.5 are all shipped and live** at https://kevinbigham.github.io/kevinos/ — installed-on-your-phone, daily-driver ready, now with recurring tasks, share-capture, backup nudge, and the wind-down ritual.

**Phase 2 first slice is LIVE 🎉** The Council queue talks to real AI through the Cloudflare Worker relay (`https://kevinos-relay.kevinbigham.workers.dev`), running Gemini 2.5 Flash on the free tier — the whole stack (Pages app + Worker + AI) is operational at **$0/mo**, with the API key held only as a server secret and CORS locked to the live site.

**Multi-model Council shipped 🎉🎉 (v0.11)** The Council is now a true **council**: one prompt fans out to **5 free seats** (Gemini · Cloudflare · Groq · Mistral · OpenRouter) in parallel, then a Gemini **synthesis chair** distills one decision-ready brief. Each seat self-enables when its key lands on the relay — adding a model is one `wrangler secret put` + redeploy, no app change. Still **$0/mo**. Built from two free-API research reports; realizes Kevin's "Council of Friends" workflow, automated.

**Council depth shipped 🎉🎉🎉 (v0.12)** The council now genuinely *diverges*: each seat answers from a **distinct lane** — Gemini grounded, Groq fast-tactical, Mistral research, Cloudflare open-model wildcard, OpenRouter **devil's advocate** — and the chair synthesizes lane-aware. Any session **saves to Notes** in one tap, and offline-queued questions **auto-run the moment the relay connects**. Verified live (5/5 seats split on the same question) + in-browser. This is Kevin's "distinct assignment per friend" rule, fully automated.

**Council live streaming shipped 🎉🎉🎉🎉 (v0.13)** The Council now answers *in front of you*: ask, and the five seats appear as "thinking" cards that **fill in one by one the instant each model returns** — fastest-first — under a live "N of M answered" counter, then settle into the synthesis. Built on a `stream:true` **NDJSON** endpoint and a tiny ES5 stream reader; the non-streaming JSON path stays for `curl`/back-compat. Curl-verified the stagger (Groq back in 0.36s, the rest by ~1s); preview-verified every UI state with zero console errors. Still **$0/mo**. **This completes the three-idea Council polish arc** (lanes → save-to-Notes → streaming) — the Council-of-Friends workflow is now fully realized in-app.

**Phone reminders shipped 🎉 (v0.14)** Web Push is live: KevinOS can notify the installed PWA with a **morning brief** (at a chosen hour) and **per-task due reminders** (any task with a due time), all through the relay — VAPID + RFC-8291 encryption in WebCrypto, a Cloudflare KV store, and a per-minute cron. **$0/mo.** The headline half of Phase 2b is done; the only thing left is for Kevin to tap **Send test** once on his phone to confirm delivery.

**GitHub OAuth built 🎉 (v0.15)** The GitHub token moves off-device: a one-tap "Connect with GitHub" runs the OAuth flow through the relay, which holds the token server-side and proxies all GitHub data. Code shipped + verified in preview; **LIVE** since Kevin registered the OAuth App (`GITHUB_CLIENT_ID = Ov23lixf4auBApdAVsRA`). This finished **Phase 2b**.

**Cross-device sync shipped 🎉🎉 (v0.16)** KevinOS is now **one live dataset on every device**. Set a sync passphrase on the Mac and the phone and tasks / notes / everything stay in lock-step — through the relay, backed by a **Cloudflare D1** database, with no database key ever in the browser (the app sends only `sha256(passphrase)`). Last-write-wins, content-only (device connections stay local), pull-on-focus + 60s poll, debounced push. Verified end-to-end (curl + a mocked two-device preview run), **$0/mo**. **Phases 0 → 3 are all shipped.**

**Calendar / File AI shipped 🎉🎉🎉 (v0.17)** Throw *anything* at the calendar: paste a flyer/email, snap a photo, or drop a PDF → **Gemini reads it** (multimodal, on the relay) → proposed events land in a **review queue** → approve each (editable) → it's on your calendar. Relative dates resolve against today. And the old `.ics` bugs are dead: imports now honor **RRULE / BYDAY / DTEND / EXDATE / UTC**, and exports are **DST-safe (UTC Z)** — Node-verified across 4 timezones. Still **$0/mo**.

**Email Command Center built 🎉🎉🎉🎉 (v0.18)** The last phase. Connect **multiple Gmail accounts**, read your inbox right in KevinOS, and tap **✨ Draft reply** — Gemini writes a reply you can edit, then **Approve & send** fires it through `gmail.send` (threaded correctly), never without your tap. Tokens live on the relay, never on the device. Code shipped + verified end-to-end (relay graceful-degrade curl + a full mocked-Gmail preview run). It **activates the moment Kevin registers a Google Cloud OAuth client** (see `relay/RELAY_SETUP.md`) — the one manual step, exactly like GitHub.

**Phases 0 → 5 are now all built.** Once the Google OAuth client is registered, KevinOS is the full vision: a calm cockpit for tasks, calendar, notes, projects, GitHub, **and email** — local-first, synced across devices, AI that proposes and waits for your approval, every secret on the relay and none on your phone.

**Council → action shipped 🎉 (v0.19)** Post-roadmap polish: an answered Council card now has **✨ Make tasks** — one tap sends the verdict to the relay's new `/actions` endpoint (Gemini), which decomposes it into a checklist of concrete, area-tagged next-action tasks; approve them (editable) straight onto your task list, pinned to today. Thinking → doing, closed. Still **$0/mo**.

**Smart morning brief shipped 🎉 (v0.20)** The **Next** room now opens with an **AI-written daily cockpit** — the date, a warm 2–4 sentence brief of your day, and where to start (written once a day, cached, with a clean deterministic fallback when AI's off). And the **8am push** got smart: instead of "3 things need you today," it now reads like *"3 to-dos · 2 events. 9:00 AM Team practice. Top: Finish the Q3 lesson plan"* — the specific day, summarized. Still **$0/mo**.

**Sync hardened 🛠️ (v0.21)** Fixed a real cross-device bug: an event added on the phone didn't appear on the Mac. Root cause — sync ordering compared **wall-clock `updatedAt` across devices**, so any clock skew silently blocked propagation (and the loser's edit could be wiped on reconcile). Now ordering is **server-authoritative**: the relay accepts a push only when its `baseRev` matches the stored `rev` (a server-incremented counter — no client clock anywhere), stamps `updated_at` itself for display, and supports `force` for the "upload this device" path. On conflict the app **merges losslessly** (union by id — never overwrite) and re-pushes so both devices converge to the same superset. Added a **link code** (first 6 chars of the passphrase hash) to the sync footer so a passphrase mismatch is visible at a glance. Verified: relay curl suite (clock-skew immunity, stale→merge→retry, force, back-compat), an 11-case Node merge/convergence test, and a preview run reproducing the exact phone↔Mac case (Owen + the Mac's task both survive, converge at rev 2, zero console errors). `state.v` → 21.

**Sync pairing fixed 🤝 (v0.22)** Real-world follow-up: Kevin's two devices showed **different link codes** (`7c85fe` vs `eb8513`) — i.e. different passphrases, two separate vaults — because (a) the iOS passphrase field wasn't blocking **auto-capitalize/autocorrect**, so the typed phrase was silently altered, and (b) the "link code" readout was mistaken for an input. Fixes: the passphrase input now sets `autocapitalize="none" autocorrect="off"`; **linking two devices now MERGES both** (union by id, via the v0.21 `mergeRemoteDoc`) instead of the old replace/overwrite `confirm()` — so pairing can never delete half your data, regardless of which device you start from; clearer copy that the code is a *check*, not a thing you type. Verified in preview (phone-with-event links to cloud-holding-Mac-data → both survive, converge at rev 2, zero errors). `state.v` → 22, SW cache `kevinos-v0_22`.

**Email Command Center LIVE 🎉🏁 (2026-06-23)** Kevin registered the Google Cloud OAuth client (Web app, Testing mode, redirect `…/google/callback`); `GOOGLE_CLIENT_ID` set in `wrangler.toml` + `GOOGLE_CLIENT_SECRET` set as a Worker secret (piped straight from the downloaded `client_secret_*.json` — never shown) + redeployed → relay health now reads **`email:true`**. **This completes the entire roadmap (Phases 0 → 5) — every relay flag green: push · github · sync · extract · email, all at $0/mo.** KevinOS is now the full vision: a calm cockpit for tasks, calendar, notes, projects, GitHub, and email — local-first, synced across devices, AI that proposes and waits for approval, every secret on the relay and none on the phone.

**Proactive Brief 2.0 shipped 🌅🤖 (v0.23)** The morning brief is now **server-generated, fresh, at send time** — not pre-computed on the device. New relay `buildServerBrief` + `POST /brief`: pulls the day's tasks/events from the **synced D1 doc** (or app-supplied context) **and takes a live inbox peek** (unread count + a few real subjects via the Gmail tokens already on the relay), then Gemini writes a warm 2–4 sentence brief that calls out emails truly needing a reply and ignores marketing. The **8am push** (`firePush`) regenerates the body fresh for any `gen:"brief"` reminder — so it's smart **even when the app's been closed for days** (the app now schedules 7 mornings ahead, each generated at fire time). The in-app brief card uses the same `/brief` engine, so it now mentions your inbox too. Deterministic fallback on any miss (Gemini free-tier blip, sync off). Verified: curl (D1 path wrote a real swim-coach brief — "practice → Owen's lesson → reply to RuthAnne's mom"; context path; graceful fallback) + preview (card calls `/brief` with emailSession/context/fallback, renders, zero errors). `state.v` → 23, SW cache `kevinos-v0_23`.

**Overnight Auto-Drafts shipped 📝🌙 (v0.24)** Wake up to ready-to-send replies. New relay `generateOvernightDrafts` + `POST /google/overnight` (generate/list/remove): for each **real** unread message (Gmail's `category:primary`, not from me), Gemini pre-writes a reply — or returns `SKIP` for marketing/automated/no-reply-needed — and stashes them in KV (`gdraft:<session>`). The **cron** (`firePush`, `gen:"draft"`, ~1h before the brief) runs it nightly and pushes "📝 N replies are ready" (only when there are any). In the app's **Email** room, a **✨ Draft all** button triggers it on demand, and stored drafts auto-load on entering — both render as the **same review cards** (keyed by `emailDrafts[id]`, with a "📝 Drafted overnight" badge); Approve & send / Discard clear them from relay storage so they never reappear. Never sends without a tap. Verified: relay curl (graceful with no/bogus session; missing-session 400) + preview (Draft-all → two pre-written replies to "Lindsay" and "RuthAnne" as review cards, discard fired the remove, zero console errors). `state.v` → 24, SW cache `kevinos-v0_24`.

**Smart Inbox shipped 📌🔕 (v0.25)** The Email room now triages itself — real mail floats up, marketing collapses — at **zero extra AI cost** (it uses Gmail's own category labels, which the relay already had in `labelIds`). Relay `/google/threads` now tags each message `category` via `gmailCategory(labelIds)`: `noise` (PROMOTIONS/SOCIAL), `fyi` (UPDATES/FORUMS), or `primary` (everything else). The app groups the inbox into **📌 Needs you** (primary, always open, unread-first), **📰 FYI**, and **🔕 Noise** (both collapsed, one-tap Show/Hide, with per-group counts). Overnight drafts + "Draft all" target exactly the `primary` bucket, so it all composes. Verified in preview: 2 swim-coach emails (Lindsay, RuthAnne) under "Needs you," a Stripe receipt under FYI, Grammarly + Jotform under Noise; expand toggle works; zero console errors. `state.v` → 25, SW cache `kevinos-v0_25`.

**Triple drop shipped 📥🗓️⏰ (v0.26)** Three at once, all composing with the smart inbox. **(1) Unified inbox** — a new **📥 All inboxes** option merges every connected Gmail account into one date-sorted stream; relay `/google/threads` gained an `all` mode (parallel per-account fetch + merge, each message tagged with its `account` + a parsed `ts`), and the app routes **draft / send / archive per-message** to that message's own account (not the selector), with a small account badge on each row in unified view. Connecting a 2nd account now defaults to All inboxes. **(2) Triage actions** — every row gets **✓ Archive** (relay `/google/modify` removes `INBOX` → lands in Gmail, so it's instantly consistent on every device) and **💤 Snooze** (3 hours / Tomorrow / Weekend) which hides it locally and floats it into a collapsible **💤 Snoozed** group with a "Wake now" control; snoozes are device-local (`state.email.snoozed`, in `SYNC_SKIP`) and auto-wake when their time passes. **(3) Weekly Review** — a Sunday-evening "here's your week" brief: new relay `buildWeeklyReview` + `POST /weekly` reads the **synced D1 doc** (next 7 days of events + overdue-first priorities + builds in flight) and a live inbox peek, then Gemini writes a 3–5 sentence forward-looking review; the **Next** room shows a **🗓️ Your week** card (auto-written once per week, keyed by the week's Sunday) and the **cron** (`firePush`, `gen:"weekly"`, next 4 Sundays @ 5pm) regenerates it fresh — smart even when the app's closed. Verified: relay curl (`/weekly` wrote a real Sunday review; unified + modify degrade gracefully to 401 without a session) + full preview run (two accounts merged with per-account badges, snooze→Snoozed group→wake round-trip, archive routed to the right account, single-account switch drops `all`/badges, weekly card auto-generates and persists with the right `weekKey`, zero console errors). `state.v` → 26, SW cache `kevinos-v0_26`.

**⌘K Command Palette shipped ⌨️ (v0.27)** Mission wave #1 is live: a global Cmd/Ctrl+K overlay plus visible nav pill searches every current room and action, supports live fuzzy filtering, arrow-key wraparound, Enter execution, Esc/backdrop close, and mobile tap. It is pure app UI: no relay route, no persisted state, no sync or `state.v` change; footer and SW cache moved to `v0.27` / `kevinos-v0_27`. Verified: worker/SW/app parse, ES5 diff grep, live preview click-through, mobile-width tap, and relay health probe.

**Voice Quick-Capture shipped 🎙️ (v0.28)** Mission wave #2 is live: a global floating mic opens SpeechRecognition when the browser has it and a textarea fallback when it does not. Relay `POST /capture` uses Gemini strict JSON to classify a thought into an existing task, event, or note shape; fetch/offline/model failures fall back to a local note, and weekday phrases are normalized against the supplied `today`. The app writes only existing synced arrays (`state.items`, `state.events`, `state.notes`) and shows a 6-second Undo, so there is no persisted shape change and `state.v` stays 26; footer/SW cache moved to `v0.28` / `kevinos-v0_28`. Verified: live relay curl for task/event/note plus 400 bad body, local fallback UI + Undo, relay-backed UI capture + Undo, inline-script parse, ES5 diff grep, and zero console errors.

**Google Calendar Room shipped 📅 (v0.29)** Mission wave #3 is live: the Calendar room can connect to Google Calendar through the existing Google OAuth session, show live Google agenda items alongside local events, search free slots with `/calendar/freebusy`, parse a typed phrase with Gemini via `/calendar/parse`, and create real Google Calendar events through `/calendar/create` after Kevin reviews the editable draft. The relay holds the refreshed Google tokens; the app stores only device-local `state.calendar`, keeps fetched Google events ephemeral, and mirrors created events into `state.events` with `source:"gcal"` + `gcalId`. Existing Gmail-connected accounts need one reconnect to approve the added Calendar scopes. Verified: live relay health `calendar:true`, deployed Calendar routes, parse good/bad curls, auth-required graceful 401s, inline-script parse, ES5 Calendar grep, local Calendar UI smoke, and footer/SW cache `v0.29` / `kevinos-v0_29`.

**Habits & Streaks shipped 🔥 (v0.30)** Mission wave #5 is live: a new Habits room adds synced `state.habits[]` with add/edit/delete/check-off, current streak math that survives an unchecked today when yesterday was complete, longest streak scanning, and a 7-day oldest→today grid. Home shows a done-count nudge, and phone reminders now include 8pm `gen:"habits"` pushes for the next 7 days; the relay counts unchecked habits from the synced D1 doc at fire time and skips if everything is complete. Verified: relay deployed with `habits:true`, worker/SW/app parse, ES5 diff greps, local UI smoke (add → check → reload → rename → delete), and footer/SW cache `v0.30` / `kevinos-v0_30`.

**One-Tap Send shipped 📤 (v0.31)** Mission wave #4 is live: Email draft cards now show Warm/Terse/Decline tone chips that regenerate the body through `/google/draft` without changing draft metadata, then require an in-card confirm tap before sending. Confirmed sends reuse `/google/send` with `threadId` + `messageId`, clear transient draft maps, toast `Sent ✓`, and archive the thread via `/google/modify`; failures preserve the draft and exit confirm. Verified: relay deployed, live health `email:true`, safe unauthenticated tone probe, worker/SW/app parse, ES5 diff greps, local mocked UI happy path and send-failure path, and footer/SW cache `v0.31` / `kevinos-v0_31`.

**Link Stash + AI TL;DR shipped 📥 (v0.32)** Mission wave #6 is live: a new Stash tab saves URLs into synced `state.stash[]`, immediately shows a pending card, then fills in a linked title, 3-line TL;DR, and lowercased tag chips from relay `/summarize`. Blocked/unreachable/non-HTML/model failures return HTTP 200 `{ok:false}` and become editable manual-summary cards so the link is never lost. The room supports free-text search, exact tag filters, reload persistence, and delete. Verified: relay deployed with `summarize:true`; live curls for success, fallback, invalid URL, and malformed JSON; worker/SW/app parse; ES5 added-line grep; local mocked UI smoke covering add → summarize → search/tag → reload → manual fallback → delete; footer/SW cache `v0.32` / `kevinos-v0_32`.

**People Radar shipped 🧭 (v0.33)** Mission wave #7 is live: a synced People room tracks cadence, last contact, birthdays, and notes; Home surfaces due contacts; Gmail metadata enrichment via `/people/enrich` reads only message dates; and Sunday people nudges count overdue contacts from the synced D1 doc. Verified: relay deployed with `peopleEnrich:true`; unauthenticated/error probes; worker/SW/app parse; ES5 grep; local CRUD/enrich smoke; footer/SW cache `v0.33` / `kevinos-v0_33`.

**Spend Pulse shipped 💸 (v0.34)** Mission wave #8 is live: the Next room has a private weekly spend card backed by synced `state.spend[]`, with manual cash entries, edit/delete, Gmail receipt scan through `/spend/scan`, category bars, and Weekly Review spend context. Amounts stay out of Home and static push bodies. Verified: relay deployed with `spend:true`; bad-body/session probes; worker/SW/app parse; ES5 grep; local manual/edit/delete/mock-scan smoke; footer/SW cache `v0.34` / `kevinos-v0_34`.

**Goals & Weekly Check-In shipped 🎯 (v0.35)** Mission wave #9 is live: a new Goals tab stores synced `state.goals[]` with title, target, progress, status, and check-in history. Next shows a Sunday check-in card for active goals, saves progress/note entries, hides after completion for the week, and feeds active goal context into `/weekly`; the relay weekly prompt now calls out goal momentum. Verified: relay deployed; live `/weekly` goal-context response; worker/SW/app parse; ES5 grep; local add/edit/delete/reload/check-in/mock-weekly smoke; footer/SW cache `v0.35` / `kevinos-v0_35`.

**Morning Launch Sequence shipped 🌅 (v0.36)** Mission wave #10 is live: a new Launch tab and Home deep-link assemble a morning ritual from a game-plan narration, today's agenda, inbox triage counts, top focus tasks, and inline habit check-offs. Relay `POST /launch` mirrors the server brief engine with a launch-specific prompt, D1 context fallback, Gmail inbox peek, and safe fallback behavior. Verified: relay deployed with `launch:true`; live `/launch` success/empty/malformed probes; worker/SW/app parse; ES5 grep; local mock UI smoke covering task/event/habit/email/narration/refresh/deep-link; footer/SW cache `v0.36` / `kevinos-v0_36`.

**Next wave scoped 🗺️📋 (historical)** A full build brief for the **10 mission-wave features** (shipped as v0.27–v0.36) was written to be handed to an external coding agent (e.g. Codex) and followed literally. *(`MISSION.md` on disk has since been repurposed for the — completed — Getting Started docs mission; the feature brief it once held is described here for the record.)* Each feature has its own self-contained section (mission · user flow · exact `state`/sync model · relay routes with request/response shapes and the actual Gemini prompt text · ES5 app changes with real function names + line numbers to mirror · runnable curl/preview verification · acceptance checklist · gotchas · Definition of Done), preceded by an **Operating Manual** (architecture, the non-negotiable rules, the standard build/verify/deploy loop, the sync model) and a **recommended build order**. The ten: **#1 ⌘K Command Palette · #2 Voice/Quick Capture · #3 Calendar Room · #4 One-Tap Send · #5 Habits & Streaks · #6 Link Stash + AI TL;DR · #7 People Radar · #8 Spend Pulse · #9 Goals & Weekly Check-In · #10 Morning Launch Sequence.** Authored by a 25-agent workflow that read the live codebase and adversarially fact-checked every spec against the real `index.html` / `worker.js`.

**Mission wave complete ✅:** all 10 features from that brief are shipped. Older backlog still open: **batch triage** (archive/snooze a whole group at once), **send-later / scheduled replies**, and **Outlook**.

**Hardening pass shipped 🛡️ (v0.37)** A reliability release, no new rooms: cross-device sync now merges instead of clobbers — pulls do a dirty-flag merge with per-item newer-wins resolution, deletions leave tombstones so they propagate instead of resurrecting, and pushes use an atomic server-side `rev` check. Backups no longer contain session secrets, and restoring a backup merges into the current dataset instead of rolling back synced devices. Relay errors are now readable (top-level catch, reconnect signals, honest health flags), and the service worker no longer serves cached HTML to failed API calls. Assorted efficiency fixes skip unchanged sync/reminder pushes, add a calendar cache TTL, and cut down full re-renders. Footer/SW cache moved to `v0.37` / `kevinos-v0_37`; `state.v` bumped to `36`.

**Life intake & whole-life Launch shipped 🧠 (v0.38)** KevinOS now learns who Kevin is and feeds it into everything: a **profile intake interview** ("Get to know me" on Home, same overlay flow as the Life Sweep) plus a **daily drip question** in Launch build synced `state.profile[]` facts — relay `POST /intake` (Gemini) picks the single best next question and distills each answer into 1–3 categorized facts, prunable in People. That profile now **feeds every AI prompt**: Council seats client-side, and `/brief`, `/launch`, `/weekly` server-side via the synced doc (the app now sends `syncKey`). Launch itself went whole-life: a **multi-calendar agenda** (pick up to 6 Google calendars via new `/calendar/calendars`; `/calendar/list` takes `calIds` and merges them with per-calendar chips), a **weather line** (Open-Meteo current temp/conditions, device-local location), a **swim desk** card (relay `/swim/scan` digests the last two weeks of Commit Swimming mail through the existing Gmail scope), and a **Google Sheets digest** (up to 3 pasted sheets, read-only `A1:H50` via `/sheets/digest`) behind a new `spreadsheets.readonly` scope — each connected Google account needs **one reconnect**. Health gained `intake`/`swim`/`sheets`. Footer/SW cache moved to `v0.38` / `kevinos-v0_38`; `state.v` bumped to `37`.
