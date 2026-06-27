# KevinOS — MISSION.md

This document is the authoritative build brief for an external coding agent (e.g. OpenAI Codex) to implement **10 new features** in KevinOS. It is the first thing you read and the only context you should need. Use it like this: read **The Operating Manual** in full (it encodes the architecture, the non-negotiable rules, and the exact build/verify/deploy loop that every change must follow), then jump to the one feature section you are implementing and **follow it literally**. Each feature section that follows this front-matter is self-contained — it names the exact files and lines to touch, the relay route to add, the state and sync wiring, and its own **Definition of Done**. Do not improvise architecture; the patterns here are load-bearing and battle-tested. When a feature section and this manual ever appear to disagree, the manual's RULES win.

---

## The Operating Manual

### What KevinOS is

KevinOS is Kevin's personal life-OS: a single-file, installable **Progressive Web App** that runs his day — tasks, a Next view, a calendar, smart email triage, projects/builds, AI briefs, prompts, and notes — in one calm, dependency-free interface. It is offline-capable, syncs across his devices, and uses AI (Gemini) for the "smart" surfaces (morning brief, weekly review, email drafts, event/action extraction). It holds zero secrets in the browser; all credentials live server-side on a Cloudflare Worker relay. It is live at **https://kevinbigham.github.io/kevinos/**.

### Architecture at a glance

KevinOS is two independently deployed halves that play by **different rules**:

- **The app** — one self-contained `index.html` (HTML + CSS + ES5 JavaScript in a single inline IIFE, ~2820 lines, zero dependencies, no build step) plus a `sw.js` service worker. Served as a static site by **GitHub Pages** from the **`app/` directory** on `main` of `github.com/KevinBigham/kevinos` (the local working copy `/Users/kevin/KevinOS/app/` **is** the repo root; `.nojekyll` is present). The browser never calls a provider directly — it only POSTs to the relay.
- **The relay** — a single-file **Cloudflare Worker** named `kevinos-relay`, live at **https://kevinos-relay.kevinbigham.workers.dev**, authored as a **modern ES module** (`export default { fetch, scheduled }`). It holds **all secrets** and is the only thing that talks to Google and Gemini. No router library: every route is an inline full-path `if (method && pathname)` guard.
- **Storage** — device-local state lives in `localStorage` under the key **`kevinos:v1`**. Synced content lives in a Cloudflare **D1** document (table `docs(id, doc, updated_at, rev, device_id)`, keyed by `sha256(passphrase)`), with optimistic `rev` concurrency. The relay also uses a **KV** namespace (`PUSH`) for push subscriptions, OAuth tokens, and overnight drafts.
- **AI** — **Google Gemini** (`gemini-2.5-flash` by default), called only from the relay via `callGemini`.
- **Identity** — **Google OAuth** for Gmail (and, where a feature adds it, Calendar). Client **ID is public**; Client **Secret is a Worker secret**.
- **Push** — Web Push (VAPID) fired by a **cron** (`crons = ["* * * * *"]`, every minute) via the Worker's `scheduled` handler → `firePush(env)`.

```
            (no keys ever leave here)
  ┌────────────────────┐        HTTPS POST         ┌───────────────────────────┐        ┌──────────────────┐
  │   BROWSER (PWA)     │  ───────────────────────▶ │   RELAY  (Cloudflare      │ ─────▶ │  Google (Gmail/   │
  │  index.html (ES5)   │   relay routes only,      │   Worker, modern ES)      │        │  Calendar/OAuth)  │
  │  localStorage       │   session ids as handles  │   holds ALL secrets       │ ─────▶ │  Gemini API       │
  │  kevinos:v1         │ ◀───────────────────────  │   D1 (sync) · KV (push)   │ ◀───── │                   │
  └────────────────────┘        JSON back           └───────────────────────────┘        └──────────────────┘
            ▲                                                    │
            │  Web Push (VAPID)  ◀──── cron every minute ──── firePush(env)
            └────────────────────────────────────────────────────┘
```

### THE RULES (non-negotiable)

**1. The ES5 constraint (app JS only).** `index.html` and `sw.js` are deliberately ES5-style: no build, no npm, no framework, no imports, no CDNs. Match the surrounding code exactly. **`relay/worker.js` is EXEMPT** — it is a modern ES module (`const`, arrow functions, `async/await` are expected there). Never confuse the two files. Before saving any app-JS diff, grep it for `=>`, `` ` ``, `const `, `let `, `async`, `await`, `...`, `class ` — any hit in `index.html`/`sw.js` is a bug.

| Concern | DO (ES5 — `index.html`, `sw.js`) | DON'T (ES6+) |
|---|---|---|
| Variables | `var x = 1;` | `const x` / `let x` |
| Functions | `function foo(a){ return a; }` | `(a) => a` |
| Strings | `"hi " + name + "!"` | `` `hi ${name}!` `` |
| Async | `p.then(function(r){…})` | `await p;` / `async function` |
| Loops | `for (var i=0;i<n;i++){…}` | `for (const x of arr)` |
| Objects | `var a = o.a, b = o.b;` | `const {a, b} = o;` |
| Spread/args | `fn.apply(null, arr)` / `a.concat(b)` | `fn(...arr)` / `[...a, ...b]` |
| Types | object literals + prototype | `class Foo {}` |
| Deps | vanilla DOM, `fetch`/`XHR` | any library, CDN, `import` |

*(All ES6+ is fine and expected in `relay/worker.js`.)*

**2. Secrets policy.** API keys and OAuth Client Secrets live **only** on the Worker as encrypted Cloudflare secrets — never in the browser, never in the repo, never on Kevin's phone, never as a CLI argument (args leak into shell history). Set/rotate via the interactive prompt only: `npx wrangler secret put NAME` from `app/relay`. **The Google Client Secret is set by Kevin himself** from his downloaded `client_secret_*.json` — agents never see it and must never ask for it in chat (same for `GITHUB_CLIENT_SECRET`). **Public values** (`GITHUB_CLIENT_ID`, `VAPID_PUBLIC_KEY`, `GOOGLE_CLIENT_ID`) live in `wrangler.toml` and are fine to commit. A Client **ID is public; a Client Secret is not.** To test the relay live, use a plain `curl` against a public route — no key needed, the relay holds them.

**3. Commit trailer.** Every commit carries this trailer, no exceptions:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

**4. Keep real personal data off public surfaces.** The public app ships **generic seed data only**. Kevin's real data and the historical archives one level up (`/Users/kevin/KevinOS/*.html`) are intentionally never committed.

**5. Tokens live off-browser.** OAuth/access/refresh tokens live on the relay (KV `gml:<session>`, `gh:<session>`). The browser holds only a random per-feature session id (`state.email.session`) as the handle. Never persist a provider token in `state` or `localStorage`.

### The Standard Build Loop

Follow this exact per-feature workflow:

**(a) Read the feature section** end-to-end before writing anything — it names the precise files, lines, state fields, sync decision, relay route, and Definition of Done.

**(b) Relay changes first.** Edit `app/relay/worker.js` (modern ES). Add the route as a new inline guard `if (request.method === "POST" && url.pathname === "/x")` placed **before the 404 fall-through (line 1343)**; the clean spot is right after the `/weekly` block. Use the standard body parse (`try { payload = await request.json(); } catch (e) { return json({error:"Invalid JSON body"}, 400, origin); }`) and respond via `json({ok:true, ...}, 200, origin)`. Then run `node --check app/relay/worker.js`.

**(c) App changes in ES5.** Edit `app/index.html` following the conventions below — render fn, click delegation, state wiring, sync opt-in. Match surrounding style exactly.

**(d) Bump the version trio together** — and know **why**: bumping these three in lock-step keeps the visible version, the cached bundle, and the persisted schema from ever disagreeing.
  - **`state.v`** — schema version stamped at bootstrap (`state.v=26;`, `index.html` ~line 2808). Bump **only if the state shape changed**, and add the migration in the `load()` path so old items still render.
  - **The footer string** `KevinOS vX.YY` (`index.html` ~line 631; currently `KevinOS v0.26`) — what the user sees.
  - **The service-worker cache** `var CACHE = "kevinos-vX_YY";` (`sw.js` line 2; currently `kevinos-v0_26`) — **cache-busting**: `sw.js`'s `activate` handler deletes every cache key that isn't the current `CACHE`, which is what forces every installed client to pull the new code. Skip this and users get stale JS even after Pages rebuilds.

**(e) Verify.** Run `node --check` on the relay (and a syntax sanity pass on the app). `curl` the new relay route (a public-shaped request should return well-formed JSON or a clean error). Run a **local preview** of the app and click through the feature end-to-end.

**(f) Deploy.** Relay: `npx wrangler deploy` from `app/relay` (Kevin's cached Wrangler OAuth; check the printed bindings — a secret set without the matching `wrangler.toml` var is a known footgun). App: commit and push `app/` to `main`; GitHub Pages auto-deploys in **~12–24s**. Hard-refresh to confirm.

**(g) Update docs.** Update **`HANDOFF.md`** (its TL;DR / §10 "shipped" list and file map) and **`ROADMAP.md`** (mark the feature done). If a setup step or secret name changed, update **`relay/RELAY_SETUP.md`**.

**(h) Commit** from the repo root (`/Users/kevin/KevinOS/app`): `git add -A && git commit -m "…"` with the trailer, then `git push origin main`.

### The sync model

KevinOS splits state into **device-local** and **synced**.

- **`SYNC_SKIP`** (`index.html` line 1201): `{github:1, relay:1, push:1, sync:1, email:1, brief:1, weekly:1, v:1}`. Every key here is **never uploaded** by `buildSyncDoc` (line 1213). Rationale: device connections/credentials (`relay`, `push`, `github`, `email`), the sync engine's own config (`sync`), transient AI text caches (`brief`, `weekly`), and the schema version (`v`) all stay per-device — each device authorizes its own sessions and regenerates its own AI text.
- **Synced content** is everything else, with the id-keyed collections listed in **`SYNC_ARRAYS`** (line 1214): `["items","events","projects","builds","briefs","links","prompts","notes","council","pending"]`. These merge losslessly by `.id` (`mergeById`, line 1225) on a stale push, and full-replace on a clean pull (`applySyncDoc`, line 1215). Scalars `lastBackupAt` (max-wins) and `lastShutdown` (lexicographic-max) have explicit merge branches.
- **Deciding where a new field goes:**
  - **Device-local** (sessions, credentials, generated-text caches, snooze/overlay state) → add the key to **`SYNC_SKIP`**. Done.
  - **Synced id-keyed collection** (objects with unique `.id`) → add the key name to **`SYNC_ARRAYS`**; it auto-merges.
  - **Synced scalar** → leave it out of `SYNC_SKIP` **and** add an explicit branch in both `applySyncDoc` and `mergeRemoteDoc` (mirror `lastBackupAt`/`lastShutdown`). Without those branches the scalar uploads but never restores correctly.
- **The save/persist rule:** **`save()`** (line 705) is the standard mutation-commit — it writes local storage **and** schedules a debounced cross-device push (`scheduleSyncPush`, 2000 ms idle) **and** a reminder re-sync. **`persist()`** (line 706) is local-only with **no sync side effects** — used inside the sync engine and after AI/background mutations that must not trigger a push (e.g. brief/weekly text fills). **End any user-data mutation path with `save()`, not `persist()`,** so it syncs.

### Styling & conventions

- **Theme via CSS variables** only (`:root`, `index.html` lines 14–22) — never hardcode hex inline. Surfaces: `--bg #F6F2EA`, `--surface #FFFFFF`, `--surface-2 #F3EEF6`. Ink: `--ink`, `--ink-soft`, `--ink-faint`, `--line`. Accent (royal purple): `--accent #4A2E78`, `--accent-soft`. Gold/clay: `--gold`, `--gold-soft`, `--clay`. Shape: `--radius 14px`, `--shadow`. Fonts: `--font-display` (headings), `--font-ui` (body), `--font-serif` (quiet/reflective text).
- **Reuse the existing patterns, don't invent.** Card surface = `background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow);`. Signature gradients: warm header `linear-gradient(180deg,#FCF8F0 0%,var(--bg-deep) 100%)`; purple→gold CTA `linear-gradient(135deg,#EFE7F6,#F4EACF)` (`.sweep-card`); gold divider (`.surface-line`). Buttons: `.add-btn` (primary), `.btn-soft` (secondary), `.btn-ghost` (tertiary), `.chip` (pill filters). Section headers `.section-label`/`.bucket-head` (11px, uppercase, letter-spaced, `--ink-faint`). Empty states `.empty` (serif italic, `--ink-faint`). Keep transition timings in the 0.12–0.25s range.
- **HTML building:** string-concatenation into `innerHTML` for bulk/static markup (always `escapeHtml(...)` user text), and `document.createElement`+`appendChild` for repeated rows. Render functions don't return HTML — they clear a mount (`var box=$("mount");box.innerHTML="";`) and inject.
- **Event handling is per-room click delegation** via `data-*` attributes: one `addEventListener("click", handleXxxClick)` per room mount; the handler walks `e.target.closest("[data-action]")` (or a feature-specific `data-<feature>`) and reads `dataset.id`. There is no global click delegate. Mirror `handleEmailClick` / `handleTaskListClick`. The `#nav` delegate (line 2400) already routes any new `data-room` tab to `go()`.
- **Toasts** are the transient-notification primitive: `toast(msg)` (line 2752). Use it for confirmations ("Sent ✓", "Archived ✓"). `window.alert` only for hard confirmations.

### Global Definition of Done

Every feature must satisfy all of these before it is considered shipped:

- [ ] App JS is **ES5-clean** (no `=>`, backticks, `const`/`let`, `async`/`await`, spread, or `class` in `index.html`/`sw.js`); matches surrounding style.
- [ ] **`node --check app/relay/worker.js` passes** (and the app loads without console errors).
- [ ] The new relay route returns well-formed JSON to a **`curl` PASS** (clean success or clean error, with CORS headers).
- [ ] **Local preview verified** — feature clicked through end-to-end.
- [ ] **Version trio bumped** appropriately: `sw.js` `CACHE` (always), footer string (always), `state.v` + migration (only if state shape changed).
- [ ] **Secrets discipline** honored — no key in browser/repo/CLI; new credentials gated server-side on `env.<KEY>`.
- [ ] **Sync decision** explicit — new fields correctly placed in `SYNC_SKIP` or `SYNC_ARRAYS` (with scalar branches if needed); mutation paths end in `save()`.
- [ ] **Docs updated** — `HANDOFF.md` + `ROADMAP.md` (and `RELAY_SETUP.md` if setup changed).
- [ ] **Committed with the trailer** and pushed to `main`.
- [ ] **Verified live** at https://kevinbigham.github.io/kevinos/ after the Pages rebuild (hard-refresh).

---

## Recommended build order

Build in this sequence. Quick wins first to bank leverage and de-risk the toolchain, then the relay-heavy infrastructure that later features depend on, then the features that compose them.

1. **#1 Command Palette** — *pure-app quick win.* Build first: it gives instant navigation/action leverage across every room and forces you through the full build loop on a low-risk, app-only change. No dependencies.
2. **#2 Quick Capture / Inbox** — *pure-app quick win.* Frictionless task/note capture into existing `SYNC_ARRAYS` collections; pairs naturally with the palette. No relay work.
3. **#3 Calendar Room (Google Calendar)** — *relay+app, relay-heavy.* Foundational: adds the Calendar OAuth scope and a `calendarApi` helper on the relay (re-consent required). Many later surfaces read real calendar data, so land this early. Depends on the existing Google OAuth flow.
4. **#5 Habits** — *relay+app (light relay).* A new synced id-keyed collection plus optional streak push. Build after the version-trio/migration muscle from #1–#2 and before Morning Launch, which surfaces habit state.
5. **#4 One-Tap Send** — *relay+app.* Builds directly on the existing draft engine (`/google/draft` → `/google/send`); a thin one-action approve-and-send flow over drafts. Sequence after the email/draft path is exercised by Calendar work.
6. **#6 Smart Triage / Auto-labels** — *relay+app, relay-heavy.* Extends `/google/threads` + Gemini categorization; depends on the email room and benefits from the draft/send polish in #4.
7. **#7 Focus / Pomodoro** — *pure-app quick win.* Self-contained timer room with device-local state; no dependencies, slot it wherever convenient.
8. **#8 Weekly Planning** — *relay+app.* Composes tasks + real calendar (#3) + the existing weekly-review builder; build after Calendar lands.
9. **#9 Insights / Trends** — *relay+app.* Aggregates habits (#5), tasks, and email triage (#6) into a Gemini-summarized digest; depends on those collections existing.
10. **#10 Morning Launch** — *relay+app, composite.* Build **last**: it stitches together the brief, calendar (#3), and habits (#5) into a single morning surface and cron push. Depends on #3 and #5 at minimum.

Dependency summary: **#3 and #5 before #10**; **#3 before #8**; **#4 builds on the draft engine**; **#6 after the email room**; **#9 after #5 and #6**; **#1 early** for compounding leverage.

## Feature index

| # | Feature | Type | Depends on | T-shirt size |
|---|---|---|---|---|
| 1 | Command Palette | pure-app | — | S |
| 2 | Quick Capture / Inbox | pure-app | — | S |
| 3 | Calendar Room (Google Calendar) | relay+app | Google OAuth flow | L |
| 4 | One-Tap Send | relay+app | draft engine (`/google/draft`, `/google/send`) | S |
| 5 | Habits | relay+app | — | M |
| 6 | Smart Triage / Auto-labels | relay+app | Email room (`/google/threads`) | M |
| 7 | Focus / Pomodoro | pure-app | — | S |
| 8 | Weekly Planning | relay+app | #3 Calendar, weekly-review builder | M |
| 9 | Insights / Trends | relay+app | #5 Habits, #6 Triage | M |
| 10 | Morning Launch | relay+app | #3 Calendar, #5 Habits, brief | L |

---

## 1. ⌘K Command Palette

### Mission
A global, instant command palette invoked by Cmd/Ctrl+K (and a visible header trigger for mobile/PWA) that fuzzy-searches across all 12 rooms plus a declarative registry of quick-actions (Email, Next, New task, Snooze all noise, Generate brief, Refresh inbox, etc.). Done looks like: from any room, the user hits ⌘K, sees a centered overlay with a search field and ranked results, navigates with arrow keys, presses Enter to execute (navigate to a room or run an action), and Esc to dismiss — all keyboard-first on desktop, tap-first on mobile, and visually instant (no relay round-trip to open or filter).

### Why it matters
One keystroke to reach any room or fire any action turns KevinOS from a tab-clicking app into a keyboard-driven cockpit.

### User flow
1. User is anywhere in the app (any room active). On desktop they press **⌘K** (Mac) or **Ctrl+K** (Windows/Linux); on mobile/PWA they tap the **⌘K pill button** in the header nav.
2. A centered modal overlay fades in above the current room (with a dimmed backdrop). A text input is auto-focused. Below it, a result list shows the default set: all rooms first, then all registered quick-actions, each row with an icon, a label, and a small kind hint ("Room" / "Action").
3. User types, e.g. `bri`. The list filters and re-ranks in real time via a fuzzy/substring match against each entry's label and keywords; "Generate brief" rises to the top. The first result is highlighted.
4. User presses **↓/↑** to move the highlight (wrapping at the ends), or hovers/taps a row on mobile. The highlighted row scrolls into view.
5. User presses **Enter** (or taps the row). The palette closes, then the entry's `run` executes: a room entry calls `go("<room>")`; an action entry runs its handler (e.g. navigate to Email and `loadThreads(true)`).
6. User presses **Esc** at any time (or clicks the backdrop) to close with no action. Focus returns to the page; the previously active room is untouched.
7. Re-opening the palette starts fresh: input cleared, full default list, highlight reset to row 0.

### Data model
The palette is **pure ephemeral UI** — there is **no persisted `state` field** and **no new `state.*` key at all**. It needs only module-level scratch globals (siblings of `room`, `filter`, etc. declared in the ~690 block; the `state` literal itself is line **689** and the UI-scratch vars run from ~690), which reset on reload and are never serialized:

- `var paletteOpen=false;` — whether the overlay is showing.
- `var paletteSel=0;` — index of the highlighted result row within the current filtered list.
- `var paletteResults=[];` — the current filtered+ranked array of registry entries (rebuilt on every keystroke).

Because nothing enters `state`:
- **localStorage / versioning:** no change. Do **not** bump `state.v` (literal `v:5` at line 689; load/migrate path stamps `state.v=26;` at line **2808**, and the loaded value is read at `if(saved.v)state.v=saved.v;` line 2730) for this feature — the persisted schema is untouched. No bootstrap restore branch needed.
- **Sync:** no change. Do **not** add anything to `SYNC_SKIP` (line **1201**: `{github:1,relay:1,push:1,sync:1,email:1,brief:1,weekly:1,v:1}`) or `SYNC_ARRAYS` (line **1214**: `["items","events","projects","builds","briefs","links","prompts","notes","council","pending"]`) — there is no persisted field to classify. No `syncRerender` (line **1241**) branch needed; the palette is not a room, so incoming sync updates never need to repaint it.
- **D1 synced doc:** untouched.

**Why no SYNC_SKIP entry is needed (justification):** `SYNC_SKIP` and `SYNC_ARRAYS` classify keys that live **inside the `state` object**, because `buildSyncDoc` (line 1213) iterates own-enumerable `state` keys. The palette's three globals are **not** properties of `state` — they are standalone `var`s in the IIFE scope, exactly like `room`/`filter`/`taskArea`. Standalone module vars are never serialized by `store.save(state)` and never seen by `buildSyncDoc`, so they require no sync classification at all. Adding them to `SYNC_SKIP` would be both wrong (they aren't `state` keys) and a no-op. This is the correct and only decision.

The command **registry** is a static, declarative array literal defined once at module scope (a constant, like `AREAS` at line **661** / `PROJECT_STATUS` at line **664** / `SWEEP_STEPS` at line **677**), NOT in `state`. See App changes for its shape.

### Relay changes
**N/A — pure app feature.** The palette only opens an overlay, filters an in-memory registry, and calls existing app functions (`go`, `loadThreads`, `generateBrief`, etc.). It performs no network I/O of its own, holds no session, and reads no synced doc. The actions it invokes may themselves hit the relay (e.g. "Generate brief" calls the existing `generateBrief` which POSTs `/brief`), but the palette adds **no new or changed routes**. `node --check relay/worker.js` is still part of verification only to confirm nothing was accidentally touched.

### App changes (index.html, ES5)

**New module-level scratch vars** (add in the UI-scratch block just after the `state` literal at line 689, beside `room, filter, selectedArea`):
```
var paletteOpen=false, paletteSel=0, paletteResults=[];
```

**New registry constant** (add near the other constants, ~lines 661–686, after `SWEEP_STEPS`). It is a plain array of entry objects. Each entry:
```
{ id:"room-next", label:"Next", kind:"room", icon:"▸",
  keywords:"next today agenda brief", run:function(){ go("next"); } }
```
Define `var COMMANDS=[ ... ];` with two groups:

1. **One room entry per room** — mirror the canonical room list from `go()`'s activation array (line **2359**: `["home","next","tasks","calendar","projects","studio","briefs","prompts","launchpad","notes","github","email"]`). Each `run` is `function(){ go("<room>"); }`. Use human labels matching the nav buttons (e.g. `studio`→"Studio", `launchpad`→"Launchpad", `github`→"GitHub", `home`→"Home"). Add `keywords` for synonyms (e.g. studio: `"studio builds projects making"`, launchpad: `"launchpad links bookmarks"`). Note the three naming gotchas — these are **room keys** for `go()`, not render-function suffixes, so `go("studio")`/`go("launchpad")`/`go("github")` are correct (`go` internally maps them to `renderBuilds`/`renderLinks`/`ghSync`).
2. **Quick-action entries** (`kind:"action"`), each `run` calling an existing function. Required minimum set, each mirroring a real existing call path:
   - **"New task"** — `function(){ go("tasks"); var i=$("taskInput"); if(i)i.focus(); }` — `#taskInput` is the real task capture input (index.html line **455**), wired to `addTask(...)` on Enter at line 2406; focusing it after navigating is the correct mirror.
   - **"Email"** — `function(){ go("email"); }` — the router already calls `emailEnter()` for `email` (line 2371; `emailEnter` defined at line **2525**).
   - **"Refresh inbox"** — `function(){ go("email"); loadThreads(true); }` — mirror `handleEmailClick`'s `refresh` case at index.html line **2691** (`else if(act==="refresh")loadThreads(true);`). `loadThreads` is defined at line **2566**. (Note: there is also an unrelated `act==="refresh"` at line 2245 that calls `ghSync(true)` inside a different handler — do not copy that one; the email one is 2691.)
   - **"Snooze all noise"** — `function(){ go("email"); /* iterate emailThreads where category==="noise" and call snoozeMsg(id,"tom") */ }` — mirror the loop style of `pruneSnoozed` (index.html line **2509**) reading the module-level `emailThreads` array, calling the existing `snoozeMsg(id,"tom")` (index.html line **2500**) for each noise message; then `renderEmail()`. Use an indexed `for` loop. If no noise messages are present, `toast("No noise to snooze")`.
   - **"Generate brief"** — `function(){ go("next"); generateBrief(true); }` — mirror the `data-brief-refresh` path; `generateBrief(force)` is at index.html line **969**.
   - **"Generate weekly review"** — `function(){ go("next"); generateWeekly(true); }` — mirror the `data-weekly-refresh` path; `generateWeekly(force)` is at index.html line **1020**.
   - **"Refresh GitHub"** — `function(){ go("github"); ghSync(true); }` — mirror the router's `github→ghSync` call; `ghSync(force)` is at index.html line **2189** and takes a boolean `force` arg, so `ghSync(true)` is correct.

   For any action whose target function may not be loaded yet (defensive against future refactors), guard with `if(typeof fn==="function")fn();` inside the `run`. All seven targets above (`go`, `loadThreads`, `snoozeMsg`, `generateBrief`, `generateWeekly`, `ghSync`, plus `renderEmail`/`emailThreads`) **already exist** in the current file at the lines cited — the `typeof` guard is belt-and-suspenders, not a present-day necessity.

**New helper functions** (place them together near the other UI helpers, e.g. just before the wire-up block — the wire-up region starts at line **2391**; mirror `toast` at line **2752** for the create-and-inject + `setTimeout` style):

- `function paletteMatch(q,entry){ ... }` — returns a numeric score (higher = better; or `-1` for no match) for query string `q` against `entry.label`+`entry.keywords`. Behavior: lowercase both; if `q` is empty return a base score of `0` (everything matches equally); exact-prefix of the lowercased label scores highest, then substring-in-label, then substring-in-keywords, then a simple in-order character subsequence match (fuzzy) scores lowest. Use plain `String.prototype.indexOf` and a manual subsequence loop — **no regex needed**.
- `function paletteFilter(q){ ... }` — builds the module-level `paletteResults` by mapping `COMMANDS` to `{entry:e, score:paletteMatch(q,e), idx:i}` keeping only `score>=0`, sorting by `score` **descending** with the original array index as a stable tiebreak (`if(b.score!==a.score)return b.score-a.score; return a.idx-b.idx;`), then stripping to the bare entry array (`paletteResults = sorted.map(...)` via an indexed loop pushing `x.entry`). Because `COMMANDS` lists rooms before actions, the index tiebreak guarantees **rooms appear before actions on score ties**. Do not rely on `Array.prototype.sort` being stable; the explicit `idx` tiebreak makes ordering deterministic across all engines. One sentence: produces the ranked visible list for query `q`.
- `function renderPalette(){ ... }` — clears and injects the result rows into the list mount `#cmdkList` from `paletteResults`, marking the row at index `paletteSel` with the `active` class; each row element gets `row.dataset.cmdkIdx=String(i)`. Mirror `makeTaskRow` (line **776**) for the `document.createElement`+`dataset` row-building style, and clear the mount first with `box.innerHTML="";` (the standard render pattern). Show an empty state (`box.innerHTML='<p class="empty">No matches</p>';` — mirror the `.empty` usage at line 814) when `paletteResults.length===0`.
- `function openPalette(){ ... }` — sets `paletteOpen=true`, clears the input value (`var inp=$("cmdkInput"); if(inp)inp.value="";`), calls `paletteFilter("")`, sets `paletteSel=0`, calls `renderPalette()`, adds the `.open` class to `#cmdkOverlay`, then focuses `#cmdkInput` (wrap focus in `setTimeout(function(){var i=$("cmdkInput");if(i)i.focus();},20)` like the toast `.show` timing at line 2753 so the element is visible/displayed before focus).
- `function closePalette(){ ... }` — sets `paletteOpen=false`, removes `.open` from `#cmdkOverlay`. No focus-restore logic beyond letting the browser default.
- `function paletteMove(d){ ... }` — if `paletteResults.length===0` return; moves `paletteSel` by `d` (+1/-1) with wraparound (`paletteSel=(paletteSel+d+paletteResults.length)%paletteResults.length;`), re-renders via `renderPalette()`, and scrolls the active row into view via `el.scrollIntoView({block:"nearest"})` (a plain object-literal argument is ES5-legal; query the active row with `$("cmdkList").querySelector(".cmdk-row.active")` and null-guard it).
- `function paletteExec(){ ... }` — reads `var entry=paletteResults[paletteSel];` (guard `if(!entry||typeof entry.run!=="function")return;`), then `closePalette()` **before** calling `entry.run()` (close first so a room render paints over a removed overlay).

**New static DOM (two additions):**

1. **Header trigger button** — add a `<button>` inside the `#nav` bar (line **389** `<nav class="nav fade-up d1" id="nav">`, buttons at ~392–409). Markup: `<button class="cmdk-btn" type="button" id="cmdkBtn">⌘K</button>`. Place it alongside the `.tab` buttons. **Do not give it `class="tab"` and do not give it a `data-room` attribute** — the `#nav` click delegate at line **2400** (`var t=e.target.closest(".tab");if(t)go(t.dataset.room);`) routes any `.tab` click into `go(undefined)`, which would break navigation. Using the distinct class `cmdk-btn` keeps it outside that delegate; its own click listener (below) opens the palette. This is the mobile/PWA-visible trigger. (The `<header class="header">` element is at line 415 and lives *inside* `#room-home`, so it is NOT a global header — put the trigger in the always-visible `#nav` bar, not in `.header`.)
2. **Overlay container** — add once, just before `</main>` (line **633**), after the last room div (`#room-notes` at line 612), so it overlays everything:
```
<div class="cmdk-overlay" id="cmdkOverlay">
  <div class="cmdk-box">
    <input class="cmdk-input" id="cmdkInput" type="text" placeholder="Search rooms and actions…" autocomplete="off">
    <div class="cmdk-list" id="cmdkList"></div>
  </div>
</div>
```
Visibility is toggled by an `.open` class on `#cmdkOverlay` (default hidden via CSS), mirroring how rooms use `.active`.

**The HTML each result row produces** (built in `renderPalette` via `createElement`): a `<div class="cmdk-row">` (with class `"cmdk-row active"` for the selected index) containing `<span class="cmdk-ic">`+icon, `<span class="cmdk-label">`+`escapeHtml(entry.label)`, and `<span class="cmdk-kind">`+(`entry.kind==="room"?"Room":"Action"`). Always run user-facing text through `escapeHtml` (defined at line **729**, used at 1333) even though labels are static — match the convention. The icon is a static literal glyph from the registry and may be set with `+entry.icon` directly.

**Exact hook points / wiring** (all in the wire-up block, **2391**–~2740; mirror the `#nav` delegate at line **2400** and the document-level listener patterns there):

- **Global key listener** — `document.addEventListener("keydown", function(e){ ... });`:
  - Open/toggle (must run regardless of `paletteOpen`): `if((e.metaKey||e.ctrlKey) && (e.key==="k"||e.key==="K")){ e.preventDefault(); if(paletteOpen){closePalette();}else{openPalette();} return; }`
  - When `paletteOpen` is true: handle `e.key==="Escape"` → `e.preventDefault();closePalette();`; `"ArrowDown"` → `e.preventDefault();paletteMove(1);`; `"ArrowUp"` → `e.preventDefault();paletteMove(-1);`; `"Enter"` → `e.preventDefault();paletteExec();`. Use `e.key` (a DOM string property, supported in all target browsers — the file already uses `e.key==="Enter"` at lines 2393/2406, confirming the convention); do not rely on `e.keyCode`.
- **Trigger button** — `$("cmdkBtn").addEventListener("click",function(){openPalette();});`
- **Input filtering** — `$("cmdkInput").addEventListener("input",function(){ paletteFilter(this.value); paletteSel=0; renderPalette(); });`
- **Backdrop click to close** — `$("cmdkOverlay").addEventListener("click",function(e){ if(e.target===this) closePalette(); });` (closes only when the click target is the overlay backdrop itself, not the inner `.cmdk-box`).
- **Row click/tap (delegation)** — `$("cmdkList").addEventListener("click",function(e){ var r=e.target.closest("[data-cmdk-idx]"); if(!r)return; paletteSel=parseInt(r.dataset.cmdkIdx,10)||0; paletteExec(); });` — mirror `handleTaskListClick` (line **865**) / `handleEmailClick` (line **2684**) closest-walking delegation.

**No `go()` change, no new room.** The palette is not a room — do **not** add it to the `go()` activation array (line **2359**) or the dispatch chain (2360–2371). It floats above rooms. The `#nav` delegate (2400) is unaffected (and the trigger button deliberately carries no `.tab` class / `data-room`, so it stays outside that delegate).

Mirror-this summary: registry → `AREAS`/`SWEEP_STEPS` constant-literal style (661/677); row building → `makeTaskRow` (776); overlay create/inject + `setTimeout` timing → `toast` (2752); click delegation → `handleEmailClick` (2684) / `handleTaskListClick` (865); open/close class toggling → the room `.active` pattern in `go()` (2359).

### ES5 compliance
- **No arrow functions** anywhere — every `run` in `COMMANDS`, every listener, and every helper uses `function(){...}`. The registry literal is the easiest place to slip an arrow; don't.
- **No template literals** — build every row string with `"..."+x+"..."` concatenation. The `placeholder` ellipsis `…` is a literal character in the HTML attribute, which is fine.
- **No `const`/`let`** — `var` only, including loop counters (`for(var i=0;i<paletteResults.length;i++)`).
- **No `for...of`** — iterate `COMMANDS`/`paletteResults`/`emailThreads` with indexed `for` loops (mirror `pruneSnoozed`'s `for(k in sn)` / indexed style at line 2509).
- **No destructuring / spread** — read `paletteResults[paletteSel]` into a `var entry=...`; build arrays with `.push`/`.concat`.
- **No `async`/`await`** — none needed; actions that hit the relay (`generateBrief`, `loadThreads`, `ghSync`) already manage their own `.then()` chains internally.
- **`e.key` is fine in ES5** — it's a DOM property, not a syntax feature (already used at lines 2393/2406). `el.scrollIntoView({block:"nearest"})` passes a plain object literal, which is ES5-legal.
- **No Web Speech / no feature-detection needed** — this feature uses only `keydown`, `closest`, `querySelector`, `scrollIntoView`, `createElement`, and `dataset`, all universally available; guard only the optional `run` targets with `typeof fn==="function"`.
- Self-check the diff for `=>`, `` ` ``, `const `, `let `, `async`, `await`, `...` before saving (per Rules §1).

### Styling
Match the "calm cockpit" palette and card patterns (Rules §7); add a new rule block inside the existing single `<style>` (lines **13–~640**, `:root` vars at 15–17), next to related overlay/card rules. Use CSS variables only — no hardcoded hex. Confirmed available vars: `--surface #FFFFFF`, `--surface-2 #F3EEF6`, `--line #DED7E2`, `--ink #1E1A24`, `--ink-soft #5A5266`, `--ink-faint #8E869C`, `--accent #4A2E78`, `--accent-soft #E9E1F4`, `--radius`, `--shadow`, `--font-ui` (all present at lines 15–22).

- **`.cmdk-overlay`** — fixed full-viewport backdrop, hidden by default: `position:fixed; inset:0; background:rgba(30,26,36,.38); display:none; z-index:1000; align-items:flex-start; justify-content:center;` and `.cmdk-overlay.open{display:flex;}`. (The `rgba(30,26,36,.38)` is the `--ink` color at 38% — an acceptable scrim; if strict "no hardcoded hex/rgb" is preferred, use `background:color-mix(in srgb, var(--ink) 38%, transparent);` — but `color-mix` support is narrower, so the literal `rgba` scrim is the safe choice and is consistent with how scrims are done elsewhere.) A short fade is optional via `transition:opacity .14s ease` (in the .12–.25s range already used, e.g. the `.tab` transition at line 33 / `.capture-input` focus at 55).
- **`.cmdk-box`** — the card: `background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); width:min(560px,92vw); margin-top:12vh; overflow:hidden;` (reuse the standard card recipe from Rules §7).
- **`.cmdk-input`** — full-width, borderless top field: `width:100%; border:none; border-bottom:1px solid var(--line); padding:14px 16px; font-family:var(--font-ui); font-size:16px; color:var(--ink); background:transparent;` and a muted placeholder via `.cmdk-input::placeholder{color:var(--ink-faint);}`. `font-size:16px` avoids iOS zoom-on-focus.
- **`.cmdk-list`** — `max-height:50vh; overflow-y:auto;`.
- **`.cmdk-row`** — `display:flex; align-items:center; gap:10px; padding:10px 16px; cursor:pointer;`; `.cmdk-row.active{background:var(--accent-soft);}` (the royal-purple soft accent) and `.cmdk-row:hover{background:var(--surface-2);}`.
- **`.cmdk-ic`** — fixed-width icon slot, e.g. `width:18px; text-align:center; color:var(--accent);`.
- **`.cmdk-label`** — `flex:1; color:var(--ink); font-family:var(--font-ui);`.
- **`.cmdk-kind`** — the right-side hint; mirror the uppercase-label treatment used by `.nav-grouplabel` (line 38) / `.eyebrow` (45) / `.section-label` (65): `font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-faint); font-weight:600;` (`.14em` matches `.nav-grouplabel`; `.section-label` itself is `.16em` — either is within the established range).
- **`.cmdk-btn`** — header trigger pill; mirror `.btn-soft`/`.chip` (the `.chip` rules are near line 61): `border:1px solid var(--line); background:var(--surface); border-radius:999px; padding:4px 10px; font-family:var(--font-ui); font-size:12px; color:var(--ink-soft); cursor:pointer;`. On desktop it's a nice affordance; on mobile it's the primary trigger. Optionally hide it ≥1024px with a media query if it crowds the `#nav` bar, but keep it visible on touch/PWA widths.

### Verification
1. **Relay untouched:** `cd /Users/kevin/KevinOS/app/relay && node --check worker.js` → PASS (exit 0). (No relay change expected; this only confirms nothing was edited by mistake.)
2. **ES5 self-grep on the diff** (run from the repo root `/Users/kevin/KevinOS/app`, which is the git root):
   `cd /Users/kevin/KevinOS/app && git diff index.html | LC_ALL=C grep -nE '^\+' | LC_ALL=C grep -nE '=>|\`|const |let |async |await |\.\.\.'` → expect **no matches** in **added** lines (the leading `^\+` filter restricts to added lines so pre-existing context never produces false positives; inspect any hit).
3. **Preview server:**
   `cd /Users/kevin/KevinOS/app && python3 -m http.server 8013` then open `http://localhost:8013/`.
   - Press **⌘K** (or Ctrl+K): overlay appears centered, input focused. PASS.
   - Type `bri`: "Generate brief" ranks at/near the top; list filters live. PASS.
   - Press **↓ ↓ ↑**: highlight moves and wraps; active row scrolls into view. PASS.
   - Press **⌘K again while open**: palette toggles closed. PASS.
   - Press **Enter** on "Email": overlay closes and the Email room becomes active (and `emailEnter()` fires via the router). PASS.
   - Re-open, press **Esc**: closes with no navigation. PASS.
   - Click the backdrop (outside the box): closes. PASS.
   - Click a row directly: executes that entry. PASS.
   - Shrink the window to mobile width / open DevTools device mode: the **⌘K** header pill (`#cmdkBtn`) is visible in the nav bar and tapping it opens the palette. PASS.
   - Confirm normal tab navigation still works (the `#cmdkBtn` does not break the `#nav` delegate): click a real tab, room switches. PASS.
4. **No new route to curl.** For completeness, the unchanged health probe should still respond (relay base is `https://kevinos-relay.kevinbigham.workers.dev`):
   `curl -s https://kevinos-relay.kevinbigham.workers.dev/ | head -c 200` → returns the existing health JSON, which begins `{"ok":true,"service":"kevinos-relay","provider":...` (full shape: `{ok, service, provider, seats, push, github, sync, extract, email}`). There is **no `/cmdk` or palette route** — confirming its absence is the correct result.
5. **PASS overall:** open/close/toggle via keyboard and button, live fuzzy filtering, arrow navigation with wrap, Enter executes the right `go()`/action, Esc and backdrop dismiss, row click works, normal nav unaffected, no console errors, and no relay or persisted-state changes.

### Acceptance criteria
- [ ] ⌘K (Mac) and Ctrl+K (Win/Linux) toggle the palette open/closed from any room, with `e.preventDefault()` stopping the browser default, and the toggle branch runs regardless of current `paletteOpen` state.
- [ ] A visible `#cmdkBtn` header trigger (in the `#nav` bar, NOT carrying `class="tab"`/`data-room`) opens the palette on tap (mobile/PWA-friendly) without disturbing the `#nav` click delegate at line 2400.
- [ ] On open, the input is auto-focused, cleared, and the full default list (12 rooms + all actions) shows with row 0 highlighted.
- [ ] Typing filters and re-ranks results live (fuzzy/substring), rooms-before-actions on ties (via the explicit index tiebreak); empty query shows the full list.
- [ ] ↑/↓ move the highlight with wraparound; the active row scrolls into view.
- [ ] Enter (and row click/tap) closes the palette **then** executes the entry's `run` — room entries call `go(<room>)`; action entries call the correct existing function.
- [ ] Esc and a backdrop click both close the palette with no side effects.
- [ ] No new `state` field, no `state.v` bump, no `SYNC_SKIP`/`SYNC_ARRAYS`/D1 changes, no relay route changes.
- [ ] All added JS is ES5 (no `=>`, template literals, `const`/`let`, `async`/`await`, spread, destructuring, `for...of`, `class`).
- [ ] New CSS uses only existing CSS variables (plus the `rgba` scrim) and mirrors existing card/button patterns; overlay sits above all rooms (`z-index:1000`).
- [ ] No console errors on open, filter, navigate, execute, or close.

### Edge cases & gotchas
- **`#nav` delegate collision (critical):** the trigger button must **not** have `class="tab"` and must **not** have a `data-room` attribute. The delegate at line 2400 does `var t=e.target.closest(".tab");if(t)go(t.dataset.room);` — a `.tab` with no `data-room` would call `go(undefined)` and corrupt navigation. Use `class="cmdk-btn"` + its own click listener. Verify normal tab nav still works after adding it.
- **Async save timing:** none — the palette persists nothing and calls no `save()`/`persist()`. The actions it invokes (`snoozeMsg`, `generateBrief`, `generateWeekly`, etc.) already call `save()`/`persist()` themselves; do **not** double-save in any `run`.
- **Per-message account routing:** "Snooze all noise" must iterate the module-level `emailThreads` and call the existing `snoozeMsg(id,"tom")` (line 2500) — which itself snapshots `row.account||acctForId(id)`. Do **not** reimplement account routing in the palette; defer to `snoozeMsg`. If `emailThreads` is empty (Email never opened), the loop is a no-op; `toast("No noise to snooze")` or do nothing.
- **Actions targeting an un-entered room:** "Refresh inbox"/"Snooze all noise" call `go("email")` first so the router fires `emailEnter()` (line 2371→2525), which lazily calls `loadThreads(false)`. But threads load **async**, so a `snoozeMsg` loop run immediately after `go("email")` may see an empty `emailThreads`. Prefer: snooze whatever is currently loaded; for an empty list, no-op gracefully. Do **not** block on the fetch or chain off its promise.
- **Relay-dependent actions when offline / relay not connected:** "Generate brief"/"Generate weekly review"/"Refresh inbox"/"Refresh GitHub" depend on the relay; the underlying functions already early-return when `relayBase()`/`relayOn()` is falsy (`relayBase` line 1107, `relayOn` line 1108; e.g. `generateBrief` checks `var base=relayBase();if(!base)return;` at line 970). The palette should close cleanly and let those guards handle the no-op — do **not** add API keys or relay logic here (Rules §2).
- **Offline/PWA:** the palette is fully client-side, so it works offline; only the relay-backed actions degrade (handled above). On ship, the SW cache **must** be bumped so installed clients get the new overlay markup/CSS — bump `sw.js` line 2 from `var CACHE = "kevinos-v0_26";` to `"kevinos-v0_27";` **and** the footer string at index.html line 631 from `KevinOS v0.26` to `KevinOS v0.27`, in lock-step (Rules §3/§4). **No `state.v` bump** (it stays `26` at line 2808) since the persisted schema is unchanged.
- **Sync conflicts:** none possible — nothing the palette owns is synced; no `syncRerender` (line 1241) branch is added.
- **Empty states:** zero filter matches → `#cmdkList` shows `<p class="empty">No matches</p>`; Enter with an empty result list is a no-op (`paletteExec` and `paletteMove` both guard on `paletteResults[paletteSel]` / `paletteResults.length`).
- **Focus / typing collisions:** the global `keydown` listener fires while typing in the input; that's fine because only ⌘K/Ctrl+K (always) and Esc/Enter/Arrows (only when `paletteOpen`) are intercepted, leaving normal text entry intact. Crucially, plain keystrokes in other rooms' inputs (e.g. `#taskInput`, `#captureInput`) are never swallowed because the non-⌘K branches gate on `paletteOpen`.
- **Privacy:** the registry holds only static labels and function references — no email content, tokens, or synced data is rendered in the palette, so there is no sensitive-data exposure. Do **not** pull live email subjects or brief text into result rows.
- **Double-open / re-open state:** always reset `paletteSel=0`, clear the input value, and rebuild `paletteResults` via `paletteFilter("")` in `openPalette()` so a stale highlight/query never persists between opens.

### Effort & dependencies
- **Size:** **S** (small) — one overlay, one registry, ~7 small helpers, one keydown listener, four other listeners, one CSS block; no relay, no state, no sync, no migration.
- **Must exist first:** nothing structural. Every function the palette dispatches to already exists in the current `index.html` at the cited lines: `go` (2354), `emailEnter` (2525) / `loadThreads` (2566), `generateBrief` (969), `generateWeekly` (1020), `ghSync` (2189), `snoozeMsg` (2500), `pruneSnoozed` (2509, as the loop model), plus `escapeHtml` (729), `makeTaskRow` (776, as the row-build model), `toast` (2752, as the create-inject model), and `$` (the element getter). Action entries should `typeof`-guard any target that a future refactor might rename. No dependency on other feature numbers.
- **Out of scope / future:** recent/frequently-used ordering or usage analytics; arbitrary natural-language "ask the AI" commands (would need a relay route — explicitly excluded here); per-room contextual commands (e.g. row-level actions inside the palette); multi-step command arguments (e.g. "snooze <which>"); registering commands dynamically from `state` data (e.g. one entry per project). Keep `COMMANDS` a static literal for v1.

---

## 2. 🎙️ Voice Quick-Capture

### Mission
A floating mic button lets Kevin speak one short thought; the app transcribes it (Web Speech API where available, a text box everywhere else), sends the transcript to the relay where Gemini classifies it into a task, calendar event, or note, then files it into the right `state` collection and confirms with a toast plus a one-tap Undo. Done looks like: tap mic → say "remind me to call the plumber tomorrow" → a task appears with an "Undo" toast.

### Why it matters
Capture is the whole game for a life-OS — if logging a thought takes more than one tap and one sentence, it never gets logged.

### User flow
1. Kevin taps the 🎙️ mic button (fixed bottom-right, above the existing `#nav`). The launcher is global (visible in every room) for reachability; the panel renders centered above the mic.
2. **If `SpeechRecognition` exists** (Chrome/Android/desktop): a small capture panel opens showing "Listening…", the browser asks for mic permission the first time, and live interim transcript text appears as he speaks. He taps "Stop" (or recognition auto-ends on silence) and the final transcript is shown with **Send** / **Cancel**.
3. **If `SpeechRecognition` is missing** (iOS Safari): the same panel opens but with a `<textarea>` prompting "Type a quick thought…" plus **Send** / **Cancel**. No mic permission is requested.
4. On **Send**, the panel shows "Filing…" and POSTs the transcript to the relay `/capture` route.
5. The relay returns structured JSON, e.g. `{ok:true,type:"task",task:{text:"Call the plumber",area:"Inbox",due:"2026-06-28"}}`.
6. The app routes it: a `task` is `unshift`ed into `state.items`, an `event` is `push`ed into `state.events` (calendar order is date-sorted at render, so `push` matches `addEvent`), a `note` is `unshift`ed into `state.notes`; the panel closes; the affected rooms re-render.
7. A toast appears: "Task added ✓  Undo" — tapping **Undo** removes the just-added item and re-renders. After 6s the undo handle expires.
8. If the relay is unreachable, not connected (`!relayOn()`), or Gemini fails, the transcript is filed as a plain **note** locally (never lost) and the toast says "Saved as note ✓  Undo".

### Data model

**No new persisted `state` fields are required.** Captures land in the **existing** synced collections (`state.items`, `state.events`, `state.notes` — all already in `SYNC_ARRAYS` at index.html:1214). Items MUST be created with the **exact object shapes** the existing renderers/editors expect, verified against the real code below. The draft's earlier shapes were wrong — use these:

- **Task** → `state.items.unshift(...)`, mirroring `addTask` (index.html:851):
  ```js
  { id:uid(), text:"<clean imperative>", area:"<AREA key or 'Inbox'>", today:false, done:false,
    due:"<YYYY-MM-DD>"||null, dueTime:"", projectId:null, repeat:"", createdAt:Date.now() }
  ```
  Note: real `addTask` sets `due` to a date string **or `null`** (not `""`). When the relay returns `due:""`, store `null` (write `due: (j.task.due||null)`). Include `dueTime:""`, `projectId:null`, `repeat:""` — the task editor (`AREA_OPTS` select, due/repeat fields) reads these.
- **Event** → `state.events.push(...)`, mirroring `addEvent` (index.html:1686):
  ```js
  { id:uid(), title:"<short>", date:"<YYYY-MM-DD>", time:"HH:MM"||null, allDay:<!time>, area:evArea||"Inbox", source:"app" }
  ```
  Note: real events use `time` = string **or `null`**, plus `allDay`, `area`, and `source:"app"`. There is **no `notes` field** on app-created events. When the relay returns `time:""`, store `null` and set `allDay:true`.
- **Note** → `state.notes.unshift(...)`, mirroring `addNote` (index.html:2118):
  ```js
  { id:uid(), title:"<the thought>", para:"Resource", area:"Inbox", tags:"", body:"", createdAt:Date.now() }
  ```
  Note: the notes renderer keys off **`title`** (not `text`), plus `para` (default `"Resource"`, the value of `noteAddPara`), `area`, `tags`, `body`. There is **no `text` field** on notes.

**Life-area labels (`AREAS`) — corrected.** The real `AREAS` (index.html:661) is an array of `{key,color}` objects with keys **`Work, Coaching, Teaching, Personal, Ana, Inbox`** — NOT `Work,Home,Health,Money,Growth,Relationships`. To send the area keys to the relay, map them: `AREAS.map(function(a){return a.key;})`. The relay already defaults to this exact list (`extractActions`, worker.js:355) when `areas` is omitted; pass them explicitly anyway so the two stay in lock-step. The default fallback area is `"Inbox"`.

Module-level ephemerals (declare alongside the other scratch vars at index.html:692, **not** persisted, reset on reload):
- `var vcOpen=false;` — capture panel open/closed.
- `var vcState="idle";` — one of `"idle"|"listening"|"review"|"sending"`.
- `var vcTranscript="";` — accumulated final transcript text.
- `var vcInterim="";` — live interim text during recognition.
- `var vcRec=null;` — the live `SpeechRecognition` instance (or `null`).
- `var vcSupported=false;` — result of feature-detection, set once at init.
- `var vcUndo=null;` — `{coll:"items"|"events"|"notes", id:"<uid>", label:"Task"}` describing the last capture for Undo; cleared on timeout.
- `var vcUndoT=0;` — `setTimeout` handle for clearing `vcUndo`.

**SYNC_SKIP / SYNC_ARRAYS:** no changes. Captures flow into already-synced arrays, so a capture on one device propagates via the normal `save()`→`scheduleSyncPush()` path (2000 ms debounce). The ephemerals above are device-local by virtue of not being in `state` at all — they need no `SYNC_SKIP` entry.

**localStorage/versioning:** no new persisted keys. Do **not** bump `state.v` (schema shape unchanged — the literal at index.html:689 stays as-is, bootstrap still stamps `state.v=26`). Per the ship ritual (Rules §3/§4), bump only: the footer string (index.html:631, `KevinOS v0.26` → `v0.27`) and the `sw.js` cache version (sw.js line 2, `kevinos-v0_26` → `kevinos-v0_27`).

**D1 synced doc:** not touched by this feature. The `/capture` relay route is **stateless** — it does not read or write the D1 sync doc; the transcript arrives entirely in the request body. No `syncKey` is sent.

### Relay changes (worker.js — ES modules, exempt from ES5)

**New route: `POST /capture`** — add one guard block inside `fetch`, placed immediately after the `/actions` block (which ends at worker.js:930), before the 404 fall-through at worker.js:1343.

Request JSON:
```json
{ "text": "remind me to call the plumber tomorrow", "today": "2026-06-27", "tz": "America/New_York",
  "areas": ["Work","Coaching","Teaching","Personal","Ana","Inbox"] }
```
- `text` (required string) — the transcript.
- `today` (string `YYYY-MM-DD`, optional) — client's local date, used to resolve "tomorrow"/"Friday".
- `tz` (string, optional) — IANA tz for relative-time resolution (informational; passed into the prompt).
- `areas` (array, optional) — the app's life-area keys for task tagging; **default server-side to `["Work","Coaching","Teaching","Personal","Ana","Inbox"]`** (the same list `extractActions` uses at worker.js:355) if omitted.

Response JSON — **always HTTP 200 with `ok:true`** when `text` was provided; classification never hard-fails (falls back to `note`). Shape by `type`:
- `type:"task"` → `{ ok:true, type:"task", task:{ text, area, due } }` — `due` is `""` or `YYYY-MM-DD`; `area` is one of `areas` or `"Inbox"`.
- `type:"event"` → `{ ok:true, type:"event", event:{ title, date, time } }` — `date` is `YYYY-MM-DD`; `time` is `"HH:MM"` 24-hour or `""` for all-day.
- `type:"note"` → `{ ok:true, type:"note", note:{ text } }`.

If `!payload || !payload.text` → return `json({error:"Provide text to classify"}, 400, origin)` (mirror the `/actions` guard at worker.js:923). Wrap the JSON parse of the request body in `try { payload = await request.json(); } catch (e) { return json({error:"Invalid JSON body"}, 400, origin); }` (worker.js:922).

What it does: validates `text`; if `!env.GEMINI_API_KEY`, returns `json({ok:true,type:"note",note:{text:String(payload.text).slice(0,300)}}, 200, origin)` (graceful degrade — never lose the thought; do NOT 500 here, unlike `/actions` which throws — this route must always succeed). Otherwise build the Gemini call with **forced JSON output**, copying the inline fetch pattern from `extractActions` (worker.js:362–369) — do **not** use `callGemini` (it returns prose):
- `const model = env.GEMINI_MODEL || DEFAULTS.geminiModel;`
- `const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + env.GEMINI_API_KEY;`
- POST body: `{ contents:[{role:"user",parts:[{text:<user prompt>}]}], systemInstruction:{parts:[{text:<system prompt>}]}, generationConfig:{ responseMimeType:"application/json", temperature:0.1 } }`.
- Parse: `const cand=(data.candidates||[])[0]; const txt=(((cand&&cand.content&&cand.content.parts)||[]).map(p=>p.text||"").join("")).trim();` then `JSON.parse(txt)`, falling back to slicing between the first `{` and last `}`: `const a=txt.indexOf("{"),b=txt.lastIndexOf("}"); if(a>=0&&b>a){ try{obj=JSON.parse(txt.slice(a,b+1));}catch(e2){obj=null;} }` (mirrors `extractActions` line 369, but with `{`/`}` because this route returns an object, not an array).
- On `!r.ok`, any throw, empty `txt`, parse failure, or `obj===null` → return `json({ok:true,type:"note",note:{text:String(payload.text).slice(0,300)}}, 200, origin)`. Wrap the whole Gemini block in `try/catch` so a thrown fetch error also returns the note fallback.
- **Validate and normalize** the parsed `obj`: if `obj.type` is not exactly `"task"|"event"|"note"`, coerce to `note`. Clamp `text`/`title` to 300 chars, `area` to one of the provided `areas` (else `"Inbox"`), `due`/`date` to a `YYYY-MM-DD` string or `""`, `time` to `"HH:MM"` or `""`. Build the response object explicitly (do not echo arbitrary Gemini keys).

**System prompt** (pass as `systemInstruction.parts[0].text`):
```
You are a fast capture classifier for a personal productivity app. The user spoke or typed one short thought. Classify it into exactly one of: "task", "event", or "note", and extract structured fields. Return ONLY valid JSON, no markdown, no commentary.

Rules:
- "task": an action the user must do ("call the plumber", "buy milk", "email Sarah"). Fields: {"type":"task","text":<clean imperative>,"area":<one of the provided areas or "">,"due":<YYYY-MM-DD or "">}.
- "event": something happening at a specific date/time ("dentist Friday at 3", "lunch with Mike tomorrow noon"). Fields: {"type":"event","title":<short>,"date":<YYYY-MM-DD>,"time":<HH:MM 24-hour or "">}.
- "note": an idea, reflection, or fact with no action and no time ("idea for the app: dark mode", "the wifi password is hunter2"). Fields: {"type":"note","text":<the thought, lightly cleaned>}.
- Resolve relative dates ("tomorrow","Friday","next week") against the provided today date and timezone. If no date is mentioned for a task, leave "due" as "".
- Pick "area" only if clearly implied; otherwise "".
- When unsure between task and note, prefer "note".
```

**User prompt** (`contents[0].parts[0].text`), plain text combining context and transcript:
```
Today: 2026-06-27 (America/New_York)
Available areas: Work, Coaching, Teaching, Personal, Ana, Inbox
Thought: "remind me to call the plumber tomorrow"
```
Build it from `payload.today`, `payload.tz`, `areas.join(", ")`, and `String(payload.text).slice(0,2000)`.

Env/secret/scope: reuses **`GEMINI_API_KEY`** (already a Worker secret) and the **`GEMINI_MODEL`** var. No new secrets, no OAuth scopes, no KV/D1. **Optional:** advertise capability in the `GET /` health object (worker.js:849) by adding `capture: !!env.GEMINI_API_KEY` to the returned object.

### App changes (index.html, ES5)

**New ephemeral state vars** — declare alongside the other module scratch vars at index.html:692 (next to `briefBusy`, `weeklyBusy`): `vcOpen, vcState, vcTranscript, vcInterim, vcRec, vcSupported, vcUndo, vcUndoT` (defaults in Data model).

**New helper functions** (place as a contiguous block near `renderNext`, after the brief/weekly helpers, ~index.html:1031):
- `function vcDetect(){ vcSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition); }` — call once from init.
- `function vcOpenPanel(){ vcOpen=true; vcState="idle"; vcTranscript=""; vcInterim=""; renderVoiceCapture(); if(vcSupported){vcStart();} }` — when supported, immediately start recognition; otherwise leave the `idle`+textarea path.
- `function vcClose(){ vcStop(); vcOpen=false; vcState="idle"; renderVoiceCapture(); }`.
- `function vcStart(){ var Rec=window.SpeechRecognition||window.webkitSpeechRecognition; if(!Rec){vcSupported=false;vcState="idle";renderVoiceCapture();return;} try{vcRec=new Rec();}catch(e){vcSupported=false;vcState="idle";renderVoiceCapture();return;} vcRec.interimResults=true; vcRec.lang="en-US"; vcRec.continuous=false; vcRec.onresult=function(e){var fin="",intm="",i;for(i=e.resultIndex;i<e.results.length;i++){var t=e.results[i][0].transcript;if(e.results[i].isFinal)fin+=t;else intm+=t;} if(fin)vcTranscript=(vcTranscript+" "+fin).trim(); vcInterim=intm; renderVoiceCapture();}; vcRec.onerror=function(e){ if(e&&e.error==="not-allowed"){vcSupported=false;} vcState=vcTranscript?"review":"idle"; vcRec=null; renderVoiceCapture(); }; vcRec.onend=function(){ vcRec=null; if(vcState==="listening"){vcState=vcTranscript?"review":"idle";} renderVoiceCapture(); }; vcState="listening"; renderVoiceCapture(); try{vcRec.start();}catch(e){vcState=vcTranscript?"review":"idle";renderVoiceCapture();} }` — every callback is an ES5 `function`, no arrows; results read via index loops (`e.results[i][0].transcript`), no destructuring.
- `function vcStop(){ if(vcRec){try{vcRec.stop();}catch(e){} vcRec=null;} }`.
- `function vcSend(){ var t = (!vcSupported && $("vcText")) ? ($("vcText").value||"") : vcTranscript; t=t.trim(); if(!t)return; vcStop(); vcState="sending"; renderVoiceCapture(); var base=relayBase(); var tz="";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"";}catch(e){} if(!base){vcApply({ok:true,type:"note",note:{text:t}});return;} fetch(base+"/capture",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:t,today:todayKey(),tz:tz,areas:AREAS.map(function(a){return a.key;})})}).then(function(r){return r.json();}).then(function(j){vcApply(j&&j.ok?j:{ok:true,type:"note",note:{text:t}});}).catch(function(){vcApply({ok:true,type:"note",note:{text:t}});}); }` — mirrors `generateBrief` (index.html:969) fetch lifecycle; offline/relay-down/error all fall back to a local note so nothing is lost.
- `function vcApply(j){ var id=uid(), coll, label; if(j.type==="task"){var k=j.task||{}; state.items.unshift({id:id,text:(k.text||"").toString(),area:k.area||"Inbox",today:false,done:false,due:(k.due||null),dueTime:"",projectId:null,repeat:"",createdAt:Date.now()}); coll="items"; label="Task";} else if(j.type==="event"){var ev=j.event||{}; var tm=ev.time||""; state.events.push({id:id,title:(ev.title||"(untitled)").toString(),date:ev.date||todayKey(),time:tm||null,allDay:!tm,area:"Inbox",source:"app"}); coll="events"; label="Event";} else {var n=j.note||{}; state.notes.unshift({id:id,title:(n.text||"").toString(),para:"Resource",area:"Inbox",tags:"",body:"",createdAt:Date.now()}); coll="notes"; label="Note";} vcUndo={coll:coll,id:id,label:label}; save(); vcOpen=false; vcState="idle"; renderVoiceCapture(); renderNext(); renderHome(); if(coll==="items")renderTasks(); else if(coll==="events")renderCalendar(); else renderNotes(); vcToast(j._fallback?("Saved as note"):(label+" added"), label); }` — builds the exact verified shapes; `save()` (not `persist()`) so it syncs. (Set `j._fallback=true` in the relay-down/error branches of `vcSend` if you want the "Saved as note" wording; otherwise drop the `_fallback` check and always say `label+" added"`.)
- `function vcToast(msg,label){ var el=document.createElement("div"); el.className="toast"; el.innerHTML=escapeHtml(msg)+' ✓ <button class="toast-undo linklike" type="button" data-vc="undo">Undo</button>'; document.body.appendChild(el); setTimeout(function(){el.classList.add("show");},20); setTimeout(function(){el.classList.remove("show");setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},320);},6000); clearTimeout(vcUndoT); vcUndoT=setTimeout(function(){vcUndo=null;},6000); }` — mirrors `toast` (index.html:2752) but uses `innerHTML` (so the Undo button renders) and a 6000 ms lifetime to match the undo window. Toast text is `escapeHtml`'d.
- `function vcUndoLast(){ if(!vcUndo)return; var c=vcUndo.coll, id=vcUndo.id; state[c]=state[c].filter(function(x){return x.id!==id;}); save(); renderNext(); renderHome(); if(c==="items")renderTasks(); else if(c==="events")renderCalendar(); else renderNotes(); clearTimeout(vcUndoT); vcUndo=null; toast("Removed"); }`.
- `function renderVoiceCapture(){ var box=$("vcPanel"); if(!box)return; if(!vcOpen){box.innerHTML="";return;} var h='<div class="vc-panel">'; if(vcState==="listening"){ h+='<div class="vc-row"><span class="vc-dot"></span> 🎙️ Listening…</div><div class="vc-live">'+escapeHtml(vcInterim||vcTranscript)+'</div><button class="btn-soft" type="button" data-vc="stop">Stop</button>'; } else if(vcState==="sending"){ h+='<div class="vc-row">Filing…</div>'; } else if(vcState==="review"){ h+='<div class="vc-live">'+escapeHtml(vcTranscript)+'</div><div class="vc-actions"><button class="add-btn" type="button" data-vc="send">Send</button><button class="btn-soft" type="button" data-vc="cancel">Cancel</button></div>'; } else { /* idle + unsupported → textarea */ h+='<textarea id="vcText" class="vc-text" placeholder="Type a quick thought…"></textarea><div class="vc-actions"><button class="add-btn" type="button" data-vc="send">Send</button><button class="btn-soft" type="button" data-vc="cancel">Cancel</button></div>'; } h+='</div>'; box.innerHTML=h; }` — mirrors the inject-then-clear pattern of `renderEmail` (index.html:2656): fetch the mount, bail if missing, set `innerHTML`. All transcript text is `escapeHtml`'d (mirror index.html:1333).

**Render output by `vcState`:** `listening` → pulsing dot + "Listening…" + live `escapeHtml(vcInterim||vcTranscript)` + Stop. `review` → editable transcript + Send/Cancel. `idle` (+ unsupported) → `<textarea id="vcText">` + Send/Cancel. `sending` → "Filing…".

**Mic button + panel mount (static DOM):** add to the static HTML just before `</main>` (after `#room-notes`, ~index.html:612):
```html
<button id="vcMic" class="vc-mic" type="button" aria-label="Voice capture">🎙️</button>
<div id="vcPanel"></div>
```
These live outside the rooms so the mic is reachable everywhere.

**Exact hook points:**
- **Nav/room:** none — Voice Quick-Capture is **not** a room, so no `data-room` button, no `#room-*` div, no `go()` case, no `SYNC_ARRAYS`/`SYNC_SKIP`/`syncRerender` edit. It is a global overlay.
- **Init (feature-detect):** in the bootstrap block (index.html:2769–2817), inside the `store.load().then(...)` callback after the room is first rendered, call `vcDetect();`.
- **Wire-up (the `addEventListener` block, index.html:2391+):**
  - `$("vcMic").addEventListener("click", vcOpenPanel);`
  - `$("vcPanel").addEventListener("click", handleVoiceClick);` (event-delegated; mirrors `$("emailView").addEventListener("click",handleEmailClick)` at index.html:2420).
  - The Undo button lives in the toast, which is appended to `document.body` (outside `#vcPanel`), so wire it with a single delegated `document` listener: `document.addEventListener("click",function(e){var u=e.target.closest('[data-vc="undo"]');if(u){vcUndoLast();}});`. (Register this in the wire-up block once.)
- **Click handler — `function handleVoiceClick(ev){ var a=ev.target.closest("[data-vc]"); if(!a)return; var act=a.getAttribute("data-vc"); if(act==="stop"){vcStop();vcState=vcTranscript?"review":"idle";renderVoiceCapture();} else if(act==="send"){vcSend();} else if(act==="cancel"){vcClose();} else if(act==="undo"){vcUndoLast();} }`** — mirrors `handleEmailClick` (index.html:2684). (The `"undo"` branch here is belt-and-suspenders; the document-level guard already covers the toast, which is not inside `#vcPanel`.)

**Mirror-this summary (all verified to exist):** fetch lifecycle → `generateBrief` (index.html:969); inject-render → `renderEmail` (index.html:2656); event delegation → `handleEmailClick` (index.html:2684) and the wiring at index.html:2420; toast → `toast` (index.html:2752); task shape → `addTask` (index.html:851); event shape → `addEvent` (index.html:1686); note shape → `addNote` (index.html:2118); `AREAS` → index.html:661 (array of `{key,color}`); `uid` → index.html:704; `save`/`persist` → index.html:705/706; `relayBase`/`relayOn` → index.html:1107/1108; `todayKey` → index.html:710; `escapeHtml` → index.html:729; `$` → index.html:702.

### ES5 compliance
- **No template literals** — build all panel/toast HTML with `'...'+escapeHtml(x)+'...'` string concatenation (as `renderNext`/`briefCardHTML` do). Self-check the diff for backticks.
- **No arrow functions** — every `onresult`/`onerror`/`onend`/`setTimeout`/`.then`/`.catch`/`filter`/`map` callback is `function(...){...}`. The relay exemplars use arrows; do **not** copy that style into index.html. (The one allowed arrow-looking thing is in worker.js only, which is exempt.)
- **No `const`/`let`** — `var` only. No destructuring of the SpeechRecognition event; read `e.results[i][0].transcript` with an index loop (`for(var i=e.resultIndex;i<e.results.length;i++){...}`).
- **Feature-detection in ES5:** `var Rec = window.SpeechRecognition || window.webkitSpeechRecognition; if(!Rec){ /* textarea fallback */ }`. Never reference `SpeechRecognition` bare (ReferenceError on iOS) — always go through `window.`.
- **No `async/await`** — use `.then(function(r){return r.json();}).then(function(j){...}).catch(function(){...})`, exactly like `generateBrief`.
- **Permission failure** is handled in `onerror` (`e.error==="not-allowed"`): set `vcSupported=false`, move `vcState` to `"review"` (if a partial transcript exists) or `"idle"` (so the textarea path appears), and never leave the panel stuck on "Listening…".
- Always finish a data mutation with **`save()`** (not `persist()`) so the capture syncs cross-device.
- Self-check before saving: grep your `index.html` diff for `=>`, `` ` ``, `const `, `let `, `async`, `await`, `...`, `class `, and bare `SpeechRecognition` (without `window.`).

### Styling
Add CSS into the single `<style>` block (index.html:13–385), next to the `.brief-card`/`.toast`/`.linklike` rules, using existing CSS variables only (never hardcode hex):
- `.vc-mic` — fixed launcher: `position:fixed;right:18px;bottom:76px;width:52px;height:52px;border-radius:999px;background:var(--accent);color:#fff;border:none;box-shadow:var(--shadow);font-size:22px;z-index:81;cursor:pointer;transition:transform .14s ease, box-shadow .16s ease;` plus `.vc-mic:hover{transform:translateY(-1px)}`. (`z-index:81` keeps it above the toast at `z-index:80`, index.html:331, and above `#nav`.)
- `.vc-panel` — card surface centered above the mic, reusing the standard card pattern: `position:fixed;left:16px;right:16px;bottom:140px;max-width:420px;margin:0 auto;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:16px;z-index:82;`.
- `.vc-text` — textarea: copy the notes add-row input styling (the `#noteInput` rule in the `<style>` block) so it matches; `width:100%;min-height:64px;margin-bottom:10px;`.
- `.vc-actions` — `display:flex;gap:10px;margin-top:10px;`. Panel buttons reuse existing classes: primary **Send** = `.add-btn`, secondary **Cancel/Stop** = `.btn-soft`.
- `.vc-live` — transcript display: `color:var(--ink);font-size:15px;margin:6px 0 4px;min-height:22px;`.
- `.vc-dot` — pulsing listening indicator: `display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);margin-right:6px;animation:vcPulse 1s ease-in-out infinite;` with `@keyframes vcPulse{0%,100%{opacity:1}50%{opacity:.3}}`. Keep timing in the .12–.25s family for transitions (the pulse keyframe loop is fine at 1s).
- **Undo in toast:** `.toast-undo` reuses `.linklike` (already at index.html:270). Because the toast background is dark (`--ink`), override the link color for legibility: `.toast .toast-undo{color:var(--accent-soft);margin-left:10px;text-decoration:underline;}`.

### Verification

All commands are runnable as written (relay base `https://kevinos-relay.kevinbigham.workers.dev`).

1. **Relay syntax:** `cd /Users/kevin/KevinOS/app/relay && node --check worker.js` → no output = PASS.
2. **Deploy relay:** `cd /Users/kevin/KevinOS/app/relay && npx wrangler deploy` (Kevin's cached Wrangler OAuth; no login needed). Confirm the printed bindings show the active `PROVIDER`/`GEMINI_*`.
3. **Curl the new route (task):**
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/capture \
     -H "Content-Type: application/json" \
     -d '{"text":"remind me to call the plumber tomorrow","today":"2026-06-27","tz":"America/New_York","areas":["Work","Coaching","Teaching","Personal","Ana","Inbox"]}'
   ```
   PASS = `{"ok":true,"type":"task","task":{"text":"Call the plumber",...,"due":"2026-06-28"}}` (wording may vary; assert `type==="task"` and `due` is tomorrow's date `2026-06-28`).
4. **Curl (event):**
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/capture \
     -H "Content-Type: application/json" \
     -d '{"text":"dentist friday at 3pm","today":"2026-06-27","tz":"America/New_York"}'
   ```
   PASS = `type:"event"`, `date` = the coming Friday (`2026-07-03` relative to a Sat 2026-06-27 "today"; the exact Friday depends on the model's resolution — assert it is a valid future `YYYY-MM-DD`), `time:"15:00"`. (`areas` omitted here verifies the server-side default.)
5. **Curl (note):**
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/capture \
     -H "Content-Type: application/json" \
     -d '{"text":"idea for the app dark mode"}'
   ```
   PASS = `type:"note"`, `note.text` ≈ "idea for the app: dark mode".
6. **Curl (degrade — empty/invalid):**
   ```sh
   curl -s -o /dev/null -w "%{http_code}\n" -X POST https://kevinos-relay.kevinbigham.workers.dev/capture \
     -H "Content-Type: application/json" -d '{}'
   ```
   PASS = `400` (missing `text` guard). With a valid `text` but `GEMINI_API_KEY` unset, the route returns `200` with `type:"note"` (cannot be exercised in prod where the key is set — covered by the acceptance check via code review).
7. **Health probe (only if the optional advertise was added):**
   ```sh
   curl -s https://kevinos-relay.kevinbigham.workers.dev/ | grep -o '"capture":[a-z]*'
   ```
   PASS = `"capture":true`.
8. **App preview:** serve `app/` with a static server (e.g. `cd /Users/kevin/KevinOS/app && python3 -m http.server 8000`) and open `http://localhost:8000/` in Chrome. Tap 🎙️ → grant mic → say "buy milk" → Stop → Send → a task "Buy milk" appears at the top of Next/Tasks and a toast "Task added ✓ Undo" shows. Click **Undo** within 6s → the task disappears, toast "Removed". PASS = both.
9. **iOS/Safari fallback:** open in Safari, or in Chrome run `vcSupported=false` then tap 🎙️ (set it before opening the panel) → the panel shows the **textarea**, no permission prompt → type "team standup tomorrow 9am" → Send → an event lands on the Calendar (`time:"09:00"`). PASS = textarea path works with **no `SpeechRecognition` ReferenceError** in the console.

### Acceptance criteria
- [ ] `cd /Users/kevin/KevinOS/app/relay && node --check worker.js` passes.
- [ ] `POST /capture` returns `{ok:true,type,...}` (HTTP 200) for task/event/note inputs, `400` for missing `text`, and `type:"note"` when `GEMINI_API_KEY` is unset or Gemini errors/parses-empty.
- [ ] Mic button is visible and tappable in every room; opens the capture panel.
- [ ] Where `SpeechRecognition` exists, live transcript appears and Send files the result.
- [ ] Where it is missing (iOS Safari), the textarea fallback appears with **no** ReferenceError and Send still works.
- [ ] A captured task lands in `state.items` with `{id,text,area,today,done,due,dueTime,projectId,repeat,createdAt}`; an event lands in `state.events` with `{id,title,date,time,allDay,area,source}`; a note lands in `state.notes` with `{id,title,para,area,tags,body,createdAt}` — each renders correctly in its room (Tasks/Calendar/Notes) and edits without errors.
- [ ] Area values map from the real `AREAS` keys (`Work/Coaching/Teaching/Personal/Ana/Inbox`); unknown/empty areas fall back to `"Inbox"`.
- [ ] Toast confirms with the right label; **Undo** removes the just-added item within the 6s window and re-renders.
- [ ] The capture is persisted via `save()` and propagates through the existing sync path (`state.items/events/notes` already in `SYNC_ARRAYS`).
- [ ] No ES5 violations in the `index.html` diff (no `=>`, backticks, `const`/`let`, `async`/`await`, spread, destructuring, `class`, bare `SpeechRecognition`).
- [ ] Footer string (index.html:631) and `sw.js` cache version (sw.js line 2) bumped together; `state.v` unchanged.

### Edge cases & gotchas
- **Feature-detection must use `window.`** — bare `SpeechRecognition` throws ReferenceError on iOS, defeating the whole fallback. Always `window.SpeechRecognition || window.webkitSpeechRecognition`.
- **Mic permission denial** fires `onerror` with `e.error==="not-allowed"` — catch it, set `vcSupported=false`, drop to `review`/`idle`, never leave the panel stuck on "Listening…".
- **`due`/`time` are `null`, not `""`, in app shapes.** The relay returns `""` for "no date/time"; the app must convert `""`→`null` when writing tasks/events (matches `addTask`/`addEvent`). The notes field is **`title`**, not `text`.
- **Async save timing:** `save()` returns a Promise but is fire-and-forget here; render synchronously after mutating `state`, exactly as `handleTaskAction` (index.html:855) does — don't await.
- **Undo race:** if a second capture happens before the 6s expiry, `vcUndo` is overwritten — fine (Undo only ever targets the most recent). `vcToast` clears `vcUndoT` before re-arming.
- **Sync conflict:** captures are id-keyed `unshift`/`push` into `SYNC_ARRAYS` collections, so `mergeById` (index.html:1225) handles concurrent captures on two devices losslessly — no special handling.
- **Offline/PWA:** if `relayBase()` is empty (`!relayOn()`) or the fetch rejects, file the raw transcript as a **note** locally so nothing is lost; toast "Saved as note ✓".
- **Empty transcript:** `vcSend` no-ops on empty/whitespace; recognition that yields nothing returns to `idle`.
- **Privacy:** the transcript is sent to the relay → Gemini for classification — the same trust boundary as the brief/email-draft features (key on the Worker only, never the browser). The `/capture` route stores **nothing** in KV/D1 and must not log transcripts server-side beyond what Gemini receives.
- **`continuous=false`** keeps recognition to a single utterance; auto-`onend` after a pause moves to `review` without needing the Stop tap. `onend` must guard against firing while already past `listening`.
- **Toast lifetime vs undo window:** the toast must live the full 6s (override the default 2800 ms in `vcToast`) so the Undo button is tappable for as long as `vcUndo` is armed.

### Effort & dependencies
**Size: M.** Self-contained — one relay route (mirrors `extractActions`, worker.js:352) plus one app overlay (mirrors `generateBrief` + `renderEmail` + `toast`). Depends only on the **existing** relay being connected (`relayOn()`/`relayBase()`, the same gate the brief uses), the existing `state.items/events/notes` collections, and the `AREAS` constant (index.html:661) — no other feature numbers required. **Out of scope / future:** continuous/dictation mode, multi-sentence batch capture, editing the classified result before filing (beyond the plain textarea edit), non-English `lang`, on-device transcription, and writing events through to Google Calendar (no Calendar OAuth scope is provisioned per the relay playbook).

---

## 3. 🗓️ Calendar Room

### Mission
Upgrade the existing Calendar room into a first-class Google-Calendar-connected room: an agenda/list view of upcoming real Google Calendar events alongside the app's local events, a "find me a free slot" action that scans busy times and proposes openings, and AI-drafted event creation from plain English ("lunch with Sam next Tue 1pm") that Gemini converts to a structured event and writes to Google Calendar via the API. Done means Kevin can connect his Google Calendar (re-consenting once for the new scope), see his real upcoming events merged with app events, ask for a free slot, and create a real Calendar event by typing one sentence.

### Why it matters
The calendar is the spine of a life-OS; today it only holds events that live in the synced doc, so it can't reflect or write to the real Google Calendar Kevin actually runs his life on.

### User flow
1. Kevin opens the **Calendar** tab. The existing month grid + agenda render immediately from `state.events` (no regression).
2. At the top of the room a new **"Connect Google Calendar"** card appears (mirrors the Email room's connect card). It reuses the **same Gmail OAuth session** (`state.email.session`) but tells Kevin a re-consent is required to grant calendar access.
3. Kevin taps **Connect** → a Google consent tab opens (relay `/google/login` now requesting the calendar scope) → he approves → the app polls `/google/status` and, once an account is present, flips the card to a connected state showing his account(s).
4. The agenda now shows a **"From Google Calendar"** section: the next ~20–30 upcoming events fetched live via the relay, merged with app events, sorted by date/time. A manual **↻ Refresh** button re-pulls.
5. Kevin types into a new **"Add by typing"** box: `lunch with Sam next Tue 1pm`. He taps **Draft**. The app POSTs to `/calendar/parse`; Gemini returns a structured event `{title:"Lunch with Sam", date:"2026-06-30", start:"13:00", end:"14:00", allDay:false}` shown in an editable confirmation card.
6. Kevin reviews/edits and taps **Create**. The app POSTs `/calendar/create`; the relay writes the event to Google Calendar and returns the created event id. A toast confirms "Added to Google Calendar ✓"; the agenda refreshes.
7. Kevin taps **Find a free slot**, picks a duration (30/60/90 min) and a window (e.g. "this week, 9am–6pm"). The app POSTs `/calendar/freebusy`; the relay scans busy intervals and the app proposes the first few openings as tappable chips. Tapping a chip pre-fills the "Add by typing" confirmation card with that slot.
8. (Stretch) Each Google-sourced agenda row offers **Edit** / **Delete** buttons that call `/calendar/update` / `/calendar/delete`.

### Data model
All new persisted state goes under a single device-local object, because Calendar auth (like Email auth) is per-device and must never be synced.

- `state.calendar` — NEW object, default created lazily by `calCfg()`:
  ```
  state.calendar = {
    connected:false,   // mirrors whether the calendar scope was granted on this device's session
    calId:"primary",   // which Google calendar to read/write (default "primary")
    lastSyncAt:0       // ms timestamp of last successful /calendar/list
  }
  ```
- **Reuses `state.email.session`** as the Google OAuth session handle (the relay's KV key `gml:<session>`). Calendar does NOT mint its own session — it piggybacks on the Gmail OAuth account record so the same refresh token (re-consented for the calendar scope) is used. If `state.email.session` is empty, calendar connect generates one exactly as Email does (`uid()+uid()+uid()`). Note: `state.email` is lazily created by `emailCfg()` (index.html:2466), so `calConnectStart` must call `emailCfg()` (or guard `if(!state.email)`) before reading/writing `state.email.session`.
- **SYNC_SKIP:** add `calendar:1` to `SYNC_SKIP` (current value at index.html:1201 is `{github:1,relay:1,push:1,sync:1,email:1,brief:1,weekly:1,v:1}`) so `state.calendar` is never uploaded by `buildSyncDoc` (index.html:1213). (The existing `email:1` already covers the shared session.)
- **SYNC_ARRAYS:** unchanged. `state.events` is **already** in `SYNC_ARRAYS` (index.html:1214, current value `["items","events","projects","builds","briefs","links","prompts","notes","council","pending"]`) and the app's event objects already carry a `source` field (`"app"` vs an import source name). Google Calendar events fetched for the agenda are **ephemeral display-only** — do NOT persist them into `state.events` (that would sync someone else's Google data and create duplicates). Hold them in a module-level ephemeral array `gcalEvents` (reset on reload), exactly like `emailThreads`.
- **Created events:** when Kevin creates an event via `/calendar/create`, the canonical copy lives in Google Calendar. Recommended: ALSO push a local mirror into `state.events` with `source:"gcal"` and the returned Google event id stored as `gcalId` so it shows immediately and survives offline; on next live refresh, dedupe by `gcalId`. (DO add the local mirror — it keeps the agenda populated offline and reuses the existing synced `events` rendering.)
- **localStorage/versioning:** bump `state.v` to **27** at bootstrap (current `state.v=26;` at index.html:2808), bump the footer string to `KevinOS v0.27` (current `KevinOS v0.26` at index.html:631), and bump `sw.js` `CACHE` to `"kevinos-v0_27"` (current `var CACHE = "kevinos-v0_26";` at sw.js:2). Add a restore branch in the bootstrap `store.load` block (inside the `if(saved&&typeof saved==="object"){...}` block, index.html:2785–2804), matching the existing object-restore style: `if(saved.calendar&&typeof saved.calendar==="object")state.calendar=saved.calendar;`. No migration of existing data is needed (purely additive); old `state.events` render unchanged. The migration chain (`if(prevV<4)seedDefaults(); if(prevV<5)seedPrompts();` at index.html:2806–2807) needs no new branch — nothing in pre-27 data requires reshaping.
- **Synced D1 doc:** the only D1 touch is via the existing sync engine if you add the optional `source:"gcal"` mirrors to `state.events` — they ride the existing `events` merge. No new D1 schema, no new digest fields required.

### Relay changes
All new routes live in `/Users/kevin/KevinOS/app/relay/worker.js` and are added as inline `if (request.method === ... && url.pathname === ...)` guard blocks placed right after the `/google/logout` block (begins at line **1328**) and before the 404 fall-through `return json({ error: "Not found" }, 404, origin);` at line **1343**. (Do NOT place them after line 1343 — that line is the fall-through return; anything after it is dead code.) All reuse the existing Gmail OAuth account record (`gml:<session>`), `gmailGetRec` (worker.js:570) / `gmailPutRec` (worker.js:575) / `gmailFindAccount` (worker.js:576) / `gmailAccessToken` (worker.js:582), and a NEW `calendarApi` helper.

**Scope / re-consent change (required first):**
- Edit `GOOGLE_SCOPE` (worker.js:558, current value `"openid email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send"`) to append the Calendar events scope:
  ```
  const GOOGLE_SCOPE = "openid email https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";
  ```
  `calendar.events` grants read+write of events; `calendar.readonly` is added so freebusy/list across calendars works cleanly. (You may drop `calendar.readonly` and rely on `calendar.events` alone if you only ever touch the primary calendar's events — but freebusy needs read access to busy times, so keep `calendar.readonly`.) `GOOGLE_SCOPE` is interpolated into the consent URL at worker.js:1167 (`scope: GOOGLE_SCOPE`), so the scope string change is the only edit the login route needs.
- **Re-consent:** existing refresh tokens were minted WITHOUT calendar scope and grant no calendar access. `/google/login` (worker.js:1159) already sets `prompt=consent select_account` and `access_type=offline`, so simply re-running the OAuth flow re-prompts and Google mints a NEW refresh token carrying the calendar scope. The callback (worker.js:1177) already preserves/updates the refresh token per account. No code change to the login/callback flow is needed beyond the scope string — but document in `RELAY_SETUP.md` that every connected account must reconnect once.
- **Env/secrets:** no NEW secrets. Reuses `GOOGLE_CLIENT_ID` (public, in `wrangler.toml`) and `GOOGLE_CLIENT_SECRET` (already a Worker secret). `GEMINI_API_KEY` (already set) powers `/calendar/parse`.

**NEW helper — `calendarApi(token, path, init)`** (model it EXACTLY on `gmailApi`, worker.js:618). `gmailApi`'s real shape is a small async fetch wrapper that prefixes a base URL and sets the bearer header; mirror it as:
```js
async function calendarApi(token, path, init) {
  init = init || {};
  init.headers = Object.assign({ Authorization: "Bearer " + token, "Content-Type": "application/json" }, init.headers || {});
  const r = await fetch("https://www.googleapis.com/calendar/v3" + path, init);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data.error && data.error.message) || ("Calendar error " + r.status));
  return data;
}
```
(Worker is ES module — `async`/arrow/`const` are correct here.) Get the token via `gmailAccessToken(env, acct)` (worker.js:582) and call `gmailPutRec(env, payload.session, rec)` afterward to persist any refreshed token (same persist-after-call pattern used in the `/google/*` routes, e.g. worker.js:1231 in `/google/threads`).

**Standard request boilerplate for every new route** (copy from `/google/threads`, worker.js:1214–1217):
```js
if (!env.PUSH) return json({ error: "Email not configured" }, 500, origin);
let payload; try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
const rec = await gmailGetRec(env, payload && payload.session);
if (!rec || !rec.accounts || !rec.accounts.length) return json({ error: "not connected" }, 401, origin);
const acct = gmailFindAccount(rec, payload && payload.account);
if (!acct) return json({ error: "not connected" }, 401, origin);
const token = await gmailAccessToken(env, acct);
```
(`/calendar/parse` is the exception — it is pure Gemini and needs no account; see below.)

| METHOD | Path | Request JSON | Response JSON | What it does |
|---|---|---|---|---|
| POST | `/calendar/list` | `{session, account?, calId?, days?}` | `{ok, events:[{id,title,date,start,end,allDay,location,notes,htmlLink}], account}` | Fetches upcoming events. |
| POST | `/calendar/freebusy` | `{session, account?, calId?, from, to, dayStart?, dayEnd?, durationMin}` | `{ok, busy:[{start,end}], slots:[{date,start,end}]}` | Scans busy times, proposes openings. |
| POST | `/calendar/parse` | `{text, today, tz}` | `{ok, event:{title,date,start,end,allDay,location,notes}}` or `{ok:false, error}` | Gemini → one structured event from plain English. No account required. |
| POST | `/calendar/create` | `{session, account?, calId?, title, date, start, end, allDay, location?, notes?, tz}` | `{ok, id, htmlLink}` | Creates a real Google Calendar event. |
| POST | `/calendar/update` (stretch) | `{session, account?, calId?, id, title?, date?, start?, end?, allDay?, location?, notes?, tz}` | `{ok, id}` | Patches an existing event. |
| POST | `/calendar/delete` (stretch) | `{session, account?, calId?, id}` | `{ok}` | Deletes an event. |

**Route details:**

- **`/calendar/list`** — use the standard boilerplate (gets `rec`/`acct`/`token`). Then:
  ```js
  const calId = (payload.calId || "primary").toString();
  const max = Math.min(50, Math.max(1, (+payload.days || 30)) * 2);
  const data = await calendarApi(token, "/calendars/" + encodeURIComponent(calId) +
    "/events?singleEvents=true&orderBy=startTime&timeMin=" + encodeURIComponent(new Date().toISOString()) +
    "&maxResults=" + max);
  ```
  Map each item in `data.items || []` to `{id:item.id, title:item.summary||"(untitled)", date:(item.start.dateTime? item.start.dateTime.slice(0,10): item.start.date), start:(item.start.dateTime? item.start.dateTime.slice(11,16): null), end:(item.end&&item.end.dateTime? item.end.dateTime.slice(11,16): null), allDay:!item.start.dateTime, location:item.location||"", notes:item.description||"", htmlLink:item.htmlLink||""}`. Persist token via `await gmailPutRec(env, payload.session, rec);`. Return `json({ok:true, events, account:acct.email}, 200, origin)`. Wrap the API call in try/catch returning `json({error:(e&&e.message)||"Couldn't read your calendar."}, 502, origin)`. **No Gemini.**

- **`/calendar/freebusy`** — standard boilerplate. Then POST to Google freeBusy:
  ```js
  const calId = (payload.calId || "primary").toString();
  const data = await calendarApi(token, "/freeBusy", { method:"POST",
    body: JSON.stringify({ timeMin: payload.from, timeMax: payload.to, items: [{ id: calId }] }) });
  const busy = (data.calendars && data.calendars[calId] && data.calendars[calId].busy) || [];
  ```
  Then compute `slots` in JS: iterate each day in `[from, to]`, within the working window `dayStart` (default `"09:00"`) to `dayEnd` (default `"18:00"`), subtract busy intervals (sorted by start), and emit the first openings ≥ `durationMin` minutes; cap to ~6 slots, each `{date:"YYYY-MM-DD", start:"HH:MM", end:"HH:MM"}`. Persist token via `gmailPutRec`. Return `json({ok:true, busy, slots}, 200, origin)`. On any throw return `json({error:"Couldn't read your calendar."}, 502, origin)`. **No Gemini** — pure interval math.

- **`/calendar/parse`** — Gemini, forced-JSON, **NO account required** (skip the `rec`/`acct` boilerplate). Body + key guard:
  ```js
  let payload; try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
  if (!env.GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY not set on the relay" }, 500, origin);
  ```
  Do NOT use `callGemini`. Copy the inline forced-JSON pattern from `extractEvents` (worker.js:299): build the fetch yourself with `headers:{"content-type":"application/json"}` (note lowercase, matching the existing code) and a top-level `generationConfig:{responseMimeType:"application/json", temperature:0.1}` in the body (it is a sibling of `contents`, not nested). URL: `"https://generativelanguage.googleapis.com/v1beta/models/" + (env.GEMINI_MODEL || DEFAULTS.geminiModel) + ":generateContent?key=" + env.GEMINI_API_KEY`. Parse exactly like `extractEvents` does — read `data.candidates[0].content.parts[].text` joined+trimmed, `JSON.parse`, falling back to slicing between the first `{` and last `}` (object form, since this returns one object not an array).
  - **System/instruction text** (put it as the first `parts` entry, like `extractEvents` puts `instr`):
    > You are a precise calendar parser for Kevin. Convert ONE natural-language phrase into a single calendar event as STRICT JSON. Output ONLY a JSON object, no prose, no markdown. Schema: {"title":string,"date":"YYYY-MM-DD","start":"HH:MM" 24-hour or null,"end":"HH:MM" 24-hour or null,"allDay":boolean,"location":string,"notes":string}. Resolve relative dates ("today","tomorrow","next Tue","this weekend") against the provided current date and timezone. If a start time is given but no end, set end to one hour after start. If no time is given, set allDay=true and start/end=null. Title should be concise and human ("Lunch with Sam", not "lunch with sam next tue"). Use empty string for unknown location/notes. Never invent attendees.
  - **User text** (second `parts` entry): `"Current date: " + (payload.today||"") + "\nTimezone: " + (payload.tz||"UTC") + "\nPhrase: " + (payload.text||"")`
  - **Validate** the parsed object minimally: require a non-empty `title` and a `date` matching `/^\d{4}-\d{2}-\d{2}$/` (mirror the validation loop in `extractEvents`, worker.js ~333). Coerce missing `start`/`end` to `null`, `allDay` to boolean, `location`/`notes` to strings.
  - **Fallback:** if Gemini throws, returns unparseable JSON, or fails validation, return `json({ok:false, error:"Couldn't understand that. Try 'lunch with Sam Tue 1pm'."}, 200, origin)` (200, not 5xx) so the app shows a friendly inline message rather than treating it as a hard failure.

- **`/calendar/create`** — standard boilerplate. Build the Google event body in JS: if `payload.allDay`, `{summary:title, location, description:notes, start:{date:date}, end:{date:date}}`; else `{summary:title, location, description:notes, start:{dateTime: date+"T"+start+":00", timeZone:tz}, end:{dateTime: date+"T"+(end||start)+":00", timeZone:tz}}`. POST via `calendarApi(token, "/calendars/" + encodeURIComponent(calId||"primary") + "/events", {method:"POST", body:JSON.stringify(body)})`. Persist token via `gmailPutRec`. Return `json({ok:true, id:data.id, htmlLink:data.htmlLink||""}, 200, origin)`. On throw → `json({error:"Couldn't create the event."}, 502, origin)`. **No Gemini.**

- **`/calendar/update`** (stretch) — `PATCH /calendars/<calId>/events/<id>` with only the changed fields; same body shaping as create.
- **`/calendar/delete`** (stretch) — `DELETE /calendars/<calId>/events/<id>`; return `{ok:true}` (Google returns an empty 204 body — do not assume JSON; treat a non-error response as success).

- **`GET /` health probe (worker.js:847–849):** the current response object ends `..., extract: !!env.GEMINI_API_KEY, email: !!env.GOOGLE_CLIENT_ID`. Add a sibling boolean mirroring the `email` capability flag: `calendar: !!env.GOOGLE_CLIENT_ID`. (Use `GOOGLE_CLIENT_ID` — the public ID is what gates Google connectivity in this object, consistent with the existing `email` flag; do NOT key off `GOOGLE_CLIENT_SECRET`, which is not referenced in the health probe.)

- **Cron:** N/A for this feature — no push/cron branch needed (Calendar is interactive, not a scheduled-generation feature like brief/weekly).

### App changes (index.html, ES5)

**New module-level ephemerals** (declare near the email ephemerals, ~index.html:2464, alongside `var emailThreads=[]...`; reset on reload, never persisted):
```
var gcalEvents=[], gcalLoading=false, gcalError="", calDraft=null, calDrafting=false,
    calSlots=[], calSlotBusy=false, calParseErr="", calDur=60, calConnecting=false;
```

**New helpers (signatures + one-line behavior), placed near `renderCalendar` (index.html:1682) or near the email helpers (~index.html:2466):**
- `function calCfg(){...}` — lazily creates and returns `state.calendar` with the default shape `{connected:false,calId:"primary",lastSyncAt:0}`; mirror `emailCfg()` (index.html:2466).
- `function calOn(){...}` — returns `!!(state.calendar&&state.calendar.connected)`; mirror `emailOn()` (index.html:2467).
- `function calSession(){...}` — returns `(state.email&&state.email.session)||""` (the shared Google session).
- `function calAccount(){...}` — returns the active Google account email. Reuse `emailActive()` (index.html:2468) if it returns a real address, but **never return the unified sentinel**: if `emailActive()===UNIFIED` (`"__all__"`, defined index.html:2465) return `(state.email&&state.email.accounts&&state.email.accounts[0])||""` instead. Mirror the unified-guard logic in `acctForId` (index.html:2473).
- `function calConnectStart(){...}` — mirror `emailOAuthStart()` (index.html:2547): require `relayBase()` (else set `gcalError="Connect the relay first (Next → Connect AI)."` and re-render); call `emailCfg()`, then `if(!state.email.session)state.email.session=uid()+uid()+uid();`; set `calConnecting=true; gcalError=""; save();`; `window.open(relayBase()+"/google/login?session="+encodeURIComponent(state.email.session),"_blank")` wrapped in try/catch; then `renderCalendar(); calConnectPoll(0);`.
- `function calConnectPoll(n){...}` — mirror `emailOAuthPoll(n)` (index.html:2555): bail if `!calConnecting`; poll `relayBase()+"/google/status?session="+encodeURIComponent(calSession())` every 2.5s up to 60×; on a response where `j&&j.accounts&&j.accounts.length`, set `calCfg().connected=true; calConnecting=false;` and — because the same OAuth grant feeds Email — also adopt accounts into `state.email` if Email isn't already populated (`if(!emailOn()){state.email.accounts=j.accounts.map(function(a){return a.email;}); if(!state.email.active)state.email.active=(state.email.accounts.length>1?UNIFIED:state.email.accounts[0]||"");}`); then `save(); loadGcal(true);`. On timeout set `calConnecting=false; gcalError="Timed out waiting for Google. Try again."; save(); renderCalendar();`. Use the ES5 `.then(function(r){return r.json();}).then(function(j){...}).catch(function(){...})` shape — NOT arrow functions (the Email template shows arrows only because it predates this rule; new code must be ES5).
- `function loadGcal(force){...}` — mirror `loadThreads(force)` (index.html:2566): guard `if(!calOn())return;`, `if(!relayBase())return;`, `if(gcalLoading&&!force)return;`; set `gcalLoading=true; gcalError=""; renderCalendar();`; POST `relayBase()+"/calendar/list"` with body `JSON.stringify({session:calSession(), account:calAccount(), calId:calCfg().calId, days:30})`; on resolve: if `!j||!j.ok` set `gcalError=(j&&j.error)||"Couldn't load your calendar.";` else `gcalEvents=j.events||[]; calCfg().lastSyncAt=Date.now();`; always `gcalLoading=false; persist(); renderCalendar();`; `.catch` sets `gcalLoading=false; gcalError="Couldn't reach the relay."; renderCalendar();`. Use **`persist()`** (index.html:706, local-only, no sync push) — this is a background read.
- `function calParse(){...}` — read the "add by typing" input (`$("calNL").value`); trim; if empty, return; set `calDrafting=true; calParseErr=""; renderCalendar();`; build `tz` via `var tz="";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"";}catch(e){}` (exact pattern from `generateBrief`, index.html:973); POST `relayBase()+"/calendar/parse"` with `JSON.stringify({text:val, today:todayKey(), tz:tz})`; on resolve: if `j&&j.ok&&j.event` set `calDraft=j.event;` else `calParseErr=(j&&j.error)||"Couldn't understand that.";`; always `calDrafting=false; renderCalendar();`; `.catch` sets `calDrafting=false; calParseErr="Couldn't reach the relay."; renderCalendar();`.
- `function readCalDraftCard(){...}` — read the (possibly edited) draft-card fields from the DOM by their stable ids and return a plain object `{title,date,start,end,allDay}`; mirror `readDraftCard(id)` (index.html:2584). Use `pf()` (index.html:703) for scoped lookups inside the `.edit-panel` card if you nest the inputs in one.
- `function calCreate(){...}` — `var d=readCalDraftCard()||calDraft; if(!d)return;` validate a title + date present (else `toast("Need a title and a date.");return;`); build `tz` as above; POST `relayBase()+"/calendar/create"` with the draft fields + `calId:calCfg().calId` + `tz`; on success: push a local mirror into `state.events` — `state.events.unshift({id:uid(), title:d.title, date:d.date, time:(d.allDay?null:(d.start||null)), allDay:!!d.allDay, area:evArea, source:"gcal", gcalId:j.id});` (uses `uid()` index.html:704; `evArea` is the existing event-area scratch var, index.html:689) — then `calDraft=null; save(); loadGcal(true); renderCalendar(); toast("Added to Google Calendar ✓");`. Use **`save()`** (index.html:705) here (real user mutation that should sync the local mirror).
- `function calDraftCancel(){...}` — `calDraft=null; calParseErr=""; renderCalendar();`.
- `function calFindSlots(){...}` — read `calDur` (set by the duration chips) and the chosen window; default window = next 7 days, `dayStart:"09:00"`, `dayEnd:"18:00"`; compute `from`/`to` as ISO strings in **ES5** (`new Date(...).toISOString()` + string concat — no template literals); set `calSlotBusy=true; calSlots=[]; renderCalendar();`; POST `relayBase()+"/calendar/freebusy"` with `JSON.stringify({session:calSession(), account:calAccount(), calId:calCfg().calId, from:from, to:to, dayStart:"09:00", dayEnd:"18:00", durationMin:calDur})`; on resolve `calSlots=(j&&j.slots)||[];`; always `calSlotBusy=false; renderCalendar();`; `.catch` sets `calSlotBusy=false; gcalError="Couldn't reach the relay."; renderCalendar();`.
- `function calPickSlot(idx){...}` — `var s=calSlots[idx]; if(!s)return; calDraft={title:"", date:s.date, start:s.start, end:s.end, allDay:false}; renderCalendar();` (Kevin names it then taps Create).
- `function calDisconnect(){...}` — confirm via `window.confirm`; if confirmed: if Email is NOT also connected (`!emailOn()`) POST the existing `relayBase()+"/google/logout"` with `JSON.stringify({session:calSession()})` (worker.js:1328); always set `calCfg().connected=false; gcalEvents=[]; save(); renderCalendar();`. (Do not log the account out from under the Email room if it's in use — only flip the local flag in that case.)

**Render functions:**
- **Reuse the existing `renderCalendar()`** (index.html:1682), currently `function renderCalendar(){renderImported();renderMonth();renderAgenda();renderPending();renderSmartCap();}`. Add two NEW sub-renders into that composition — `renderCalConnect();` first and `renderCalCompose();` second — e.g. `function renderCalendar(){renderCalConnect();renderCalCompose();renderImported();renderMonth();renderAgenda();renderPending();renderSmartCap();}`. Have `renderAgenda()` (index.html:1647) additionally append a **"From Google Calendar"** section built from `gcalEvents`, deduped against any `state.events` rows that carry the same `gcalId`. Match the existing agenda's date sorting/filtering (study `renderAgenda` at 1647 and the agenda date logic used in the brief digest helpers).
- `function renderCalConnect(){...}` — injects into a NEW mount `<div id="calConnect">` at the top of `#room-calendar`. States, mirroring `emailConnectHTML` (index.html:2609) / `renderEmail` (index.html:2656): not-connected (`!calOn()&&!calConnecting`) → connect card with a `data-cal="connect"` button and copy explaining the one-time re-consent ("Google Calendar needs a quick reconnect to grant calendar access"); pending (`calConnecting`) → "Waiting for Google…" with a `data-cal="checkoauth"` button; connected → a one-line strip "GOOGLE CALENDAR · <account> ↻ Refresh · Disconnect" with `data-cal="refresh"` / `data-cal="disconnect"`. If `gcalError`, show it as `<p class="gh-err">`+escapeHtml(gcalError)+`</p>` (the `.gh-err` class is the existing relay-error style used by the Email room).
- `function renderCalCompose(){...}` — injects into a NEW mount `<div id="calCompose">`. Only render its interactive contents when `calOn()` (otherwise leave it empty / show nothing). Contains: a text input `<input id="calNL" ...>` + **Draft** button (`data-cal="parse"`); when `calDrafting`, show a "drafting…" inline note; when `calDraft` is set, an editable confirmation card with stable-id fields (`calD_title`, `calD_date`, `calD_start`, `calD_end`, `calD_allday`) wrapped in an `.edit-panel` block + **Create** (`data-cal="create"`) / **Cancel** (`data-cal="cancel"`) buttons — mirror the Email draft card markup (`emailDraftHTML`, near index.html:2620); when `calParseErr`, show it as `<p class="gh-err">`; a **Find a free slot** sub-panel: duration chips (`data-cal="dur" data-min="30"`, `"60"`, `"90"`), a **Find** button (`data-cal="slots"`), and proposed-slot chips (`data-cal="slot" data-idx="N"`) plus an empty-state when `calSlots` is empty after a search.

**Exact hook points:**
1. **Nav button:** the `data-room="calendar"` tab already exists in `#nav` (index.html ~392–409) — no change.
2. **Room container:** add the two new mounts inside the existing `<div class="room" id="room-calendar">` (index.html:486), ABOVE the existing month/agenda markup: `<div id="calConnect"></div>` and `<div id="calCompose"></div>`.
3. **`go()` dispatch:** `calendar` is already wired (index.html:2363, `else if(r==="calendar")renderCalendar();`). To also auto-load Google events on entering the room, change that branch to `else if(r==="calendar"){renderCalendar(); if(calOn())loadGcal(false);}` (mirrors how `email→emailEnter()` lazy-loads, index.html:2371/2525). No change to the room-div activation array is needed — `"calendar"` is already in it.
4. **Sync re-render:** `calendar` is already in `syncRerender()` (index.html:1245, `else if(room==="calendar")renderCalendar();`). No change needed; incoming synced `events` (including `source:"gcal"` mirrors from other devices) repaint via the existing branch.
5. **Click delegation:** add ONE delegated listener in the wire-up block (index.html:2391+), e.g. `$("room-calendar").addEventListener("click",handleCalendarClick);`. Write `function handleCalendarClick(e){var a=e.target.closest("[data-cal]");if(!a)return;var act=a.getAttribute("data-cal");if(act==="connect")calConnectStart();else if(act==="checkoauth")calConnectPoll(0);else if(act==="refresh")loadGcal(true);else if(act==="disconnect")calDisconnect();else if(act==="parse")calParse();else if(act==="create")calCreate();else if(act==="cancel")calDraftCancel();else if(act==="dur"){calDur=+a.getAttribute("data-min")||60;renderCalCompose();}else if(act==="slots")calFindSlots();else if(act==="slot")calPickSlot(+a.getAttribute("data-idx"));}` — mirroring `handleEmailClick` (index.html:2684). The existing month-cell / add-event-panel listeners (the calendar wire-up at index.html ~2413–2424, keyed on `data-key`/`addEv*` attributes) stay as-is — `data-cal` is a distinct attribute namespace, so there is no collision even though the new listener is attached to the same `#room-calendar` subtree.
6. **Bootstrap restore:** add `if(saved.calendar&&typeof saved.calendar==="object")state.calendar=saved.calendar;` inside the `if(saved&&typeof saved==="object"){...}` block (index.html:2785–2804), next to the existing `if(saved.email&&typeof saved.email==="object")state.email=saved.email;` line.
7. **State literal:** add `calendar:{connected:false,calId:"primary",lastSyncAt:0}` to the `state` object literal (index.html:689), e.g. immediately after the `email:{...}` member.
8. **SYNC_SKIP:** add `calendar:1` to the object at index.html:1201.

**Mirror-this summary** (every referenced function is confirmed to exist at the cited line): OAuth connect/poll → `emailOAuthStart` (2547) / `emailOAuthPoll` (2555); live fetch → `loadThreads` (2566); draft confirm card + read-edited-fields → `draftReply` (2576) / `readDraftCard` (2584) / `sendReply` (2589); per-account unified guard → `acctForId` (2473) / `UNIFIED` (2465); click delegation → `handleEmailClick` (2684); connect/connected/pending render states → `renderEmail` (2656) / `emailConnectHTML` (2609); lazy room-enter load → `emailEnter` (2525). **Caveat:** the Email-room source uses ES6 arrow functions and template literals in places (it predates the strict ES5 rule); when you mirror it, **rewrite to ES5** per the §ES5 compliance rules below — copy the structure, not the arrow/backtick syntax.

### ES5 compliance
- The entire app is ES5 inside the IIFE (`"use strict"` at index.html:645). In ALL new functions and render strings: use `var` only (no `const`/`let`), `function(){}` (no arrow functions), string concatenation with `+` (NO template literals/backticks), `.then(function(r){return r.json();}).catch(function(e){...})` for every `fetch` (NO `async`/`await`), explicit `o.a`/`o.b` (no destructuring), `for(var i=0;i<n;i++)` (no `for...of`).
- **Important:** the Email room you are mirroring contains arrow functions (`r=>r.json()`, `a=>a.email`) and template literals in its existing source. Those are pre-existing and out of scope to fix, but **your new calendar code must NOT copy that syntax** — translate every arrow to `function(){}` and every backtick string to `+` concatenation.
- The relay (`worker.js`) is EXEMPT and stays modern ES (`const`, arrow fns, `async/await`) — the `calendarApi` helper and route blocks above are written in modern ES on purpose.
- **Build the freebusy `from`/`to` ISO strings carefully in ES5:** use `new Date(y,m,d).toISOString()` and string concat — do not use template literals to assemble any ISO datetime.
- **No object shorthand / spread** in `fetch` bodies — build the JSON object with explicit `key:value` pairs and `JSON.stringify`.
- **No optional chaining (`?.`) or nullish coalescing (`??`)** — use `j&&j.events?j.events:[]` style, as the existing code does (e.g. `(j&&j.accounts)?...:[]` at index.html:2558).
- This feature does NOT use the Web Speech API; ignore any speech feature-detection.
- Self-check the new calendar diff for `=>`, `` ` ``, `const `, `let `, `async`, `await`, `...`, `?.`, `??` before saving (per Rules §1).

### Styling
Reuse the existing "calm cockpit" palette/cards (Rules §7); add new rules into the single `<style>` block (index.html:13–~640), next to the existing calendar rules.
- **Connect card** (`#calConnect`): reuse the Email connect-card look — card surface (`background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow)`), an `.add-btn` (filled `--accent`, white text) for **Connect**, and `.btn-soft` for secondary. Connected strip: small `.section-label`-style 11px uppercase `--ink-faint` label "GOOGLE CALENDAR" + account + ghost `↻`/Disconnect buttons.
- **Compose panel** (`#calCompose`): the NL input as a standard text input matching the existing `#evTitle` event-title input styling; **Draft**/**Create** as `.add-btn`, **Cancel** as `.btn-ghost`. The draft confirmation card uses the same `.edit-panel`-style block already used for event editing so `pf()` (index.html:703) scoping works.
- **Free-slot chips & duration chips:** reuse the pill `.chip` class (`border-radius:999px`); proposed-slot chips can take the gold accent (`--gold-soft` background, `--clay` text) to visually distinguish "openings" from filter chips; mark the active duration chip with an existing selected/active chip modifier.
- **Google-sourced agenda rows:** style identically to existing agenda event rows but add a tiny source pill (reuse the `.cq-pill` class used for email account badges) reading "GCal" so Kevin can tell real-Calendar events from app events. Use the area dot pattern (`<span class="dot" style="background:COLOR">`) consistent with existing rows.
- Keep transitions in the existing .12–.25s range; do not hardcode hex — reference the CSS variables.

### Verification
1. **Syntax-check the relay:**
   ```sh
   node --check /Users/kevin/KevinOS/app/relay/worker.js
   ```
   PASS = no output, exit 0.
2. **Deploy & confirm capability:**
   ```sh
   cd /Users/kevin/KevinOS/app/relay && npx wrangler deploy
   curl -s https://kevinos-relay.kevinbigham.workers.dev/ | grep -o '"calendar":[a-z]*'
   ```
   PASS = `"calendar":true`.
3. **Parse route (no auth needed — pure Gemini):**
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/calendar/parse \
     -H "Content-Type: application/json" \
     -d '{"text":"lunch with Sam next Tue 1pm","today":"2026-06-27","tz":"America/Chicago"}'
   ```
   PASS = `{"ok":true,"event":{"title":"Lunch with Sam","date":"2026-06-30","start":"13:00","end":"14:00","allDay":false,...}}` (2026-06-27 is a Saturday, so "next Tue" resolves to 2026-06-30).
4. **List/freebusy/create require a connected account** (they 401 without a real `gml:<session>`). Verify the 401 path with a bogus session:
   ```sh
   curl -s -o /dev/null -w '%{http_code}\n' -X POST https://kevinos-relay.kevinbigham.workers.dev/calendar/list \
     -H "Content-Type: application/json" -d '{"session":"nope"}'
   ```
   PASS = `401` (clean JSON error `{"error":"not connected"}`, not a 500/stack trace). Repeat for `/calendar/freebusy` and `/calendar/create`.
5. **App preview:**
   ```sh
   cd /Users/kevin/KevinOS/app && python3 -m http.server 8000
   ```
   Open `http://localhost:8000`, click the **Calendar** tab. PASS = month grid + agenda render with no console errors; a "Connect Google Calendar" card shows at the top. On a real device (OAuth requires a real Google account + the deployed relay): connect → connected state shows the account; typing in the NL box + **Draft** yields an editable confirmation card; **Create** produces a "Added to Google Calendar ✓" toast and the event appears in Google Calendar; **Find a free slot** returns tappable openings.
6. **ES5 lint (new calendar code only):**
   ```sh
   cd /Users/kevin/KevinOS/app && LC_ALL=C grep -nE '=>|`|\bconst |\blet |\basync |\bawait |\.\.\.|\?\.|\?\?' index.html | LC_ALL=C grep -iE 'gcal|calCfg|calConnect|calParse|calCreate|calDraft|calSlot|calFind|handleCalendar|loadGcal'
   ```
   PASS = no output (worker.js is exempt and not scanned). Note: the pre-existing Email room code WILL match this pattern in `index.html`; restrict the scan to calendar identifiers as above.

### Acceptance criteria
- [ ] `GOOGLE_SCOPE` in `worker.js` (line 558) includes `calendar.events` and `calendar.readonly`; one-time re-consent documented in `RELAY_SETUP.md`.
- [ ] `node --check relay/worker.js` passes; `GET /` returns `"calendar":true`.
- [ ] `POST /calendar/parse` converts "lunch with Sam next Tue 1pm" (today 2026-06-27) to correct structured JSON with date 2026-06-30; bad input returns `{ok:false,error}` at HTTP 200, never a 5xx/stack trace.
- [ ] `POST /calendar/list`, `/calendar/freebusy`, `/calendar/create` return `401 {"error":"not connected"}` for a bogus session and work against a re-consented account; create writes a real event visible in Google Calendar.
- [ ] App: `state.calendar` exists with the documented defaults; `calendar:1` is in `SYNC_SKIP`; `state.calendar` is NOT present in the uploaded sync doc (confirm by inspecting `buildSyncDoc()` output).
- [ ] Calendar room shows connect → pending → connected states; live Google events appear in a "From Google Calendar" agenda section, deduped against app events by `gcalId`.
- [ ] NL → Draft → editable card → Create flow works end-to-end and shows a confirmation toast; the created event also appears immediately via a `source:"gcal"` local mirror.
- [ ] "Find a free slot" returns proposed openings; tapping one pre-fills the create card.
- [ ] All new app code is ES5 (no arrow fns / template literals / `const` / `let` / `async` / `await` / spread / `?.` / `??`); the ES5 lint command returns nothing for calendar identifiers.
- [ ] `state.v=27` (index.html:2808), footer `KevinOS v0.27` (index.html:631), and `sw.js CACHE="kevinos-v0_27"` (sw.js:2) bumped in lock-step.
- [ ] No secret appears in the browser, repo, or any commit; Gemini/Google secrets stay Worker-side.
- [ ] (Stretch) edit/delete on Google-sourced rows call `/calendar/update` / `/calendar/delete`.

### Edge cases & gotchas
- **`persist()` vs `save()` discipline:** `loadGcal` and `calConnectPoll`'s background reads use `persist()` (index.html:706, local-only, no sync push); `calCreate` (a real user mutation that should sync the local mirror) and the connect/disconnect flag flips use `save()` (index.html:705). Mixing these wrong causes either sync push loops or unsynced created events — follow the Email room's `persist`-on-background / `save`-on-user-action discipline.
- **`state.email` lazy creation:** `state.email` is created by `emailCfg()` (index.html:2466), not guaranteed present at load. Any calendar code touching `state.email.session` must call `emailCfg()` first (or guard) or it will throw on a fresh install.
- **Re-consent token gap:** an account connected for Gmail BEFORE this ship has a refresh token with no calendar scope. Calendar calls will return 403/insufficient-scope from Google (surfaced by `calendarApi` as a thrown error → the route's 502) until the user reconnects. The connect card MUST explain this and the disconnect/reconnect path must work; surface the relay's error text inline (`gcalError`) rather than silently failing.
- **Per-account routing:** if Kevin has multiple Google accounts (unified email), calendar actions must target a specific account. Default to `emailActive()` (index.html:2468); if that returns the unified sentinel `UNIFIED` (`"__all__"`, index.html:2465), fall back to the first real account (mirror `acctForId`, index.html:2473). **Never send `account:"__all__"` to a calendar route** — `gmailFindAccount` (worker.js:576) won't match it and the route will 401.
- **Ephemeral vs persisted events:** never write live-fetched `gcalEvents` into `state.events` wholesale — only the explicitly-created event's mirror (with `gcalId`). Otherwise you'll sync another person's Google data and create duplicates across devices. Dedupe app/local mirrors against live results by `gcalId` in `renderAgenda`.
- **Sync conflicts:** the local `source:"gcal"` mirrors ride the existing `events` id-merge (`mergeById`, used at index.html:1236), so two devices creating events won't clobber each other; but the SAME Google event seen on two devices could render twice if `gcalId` dedupe is skipped — implement the dedupe.
- **Offline/PWA:** when `relayBase()` is empty or the relay is unreachable, the room must still render `state.events` from cache (the month grid + app events). Live Google sections simply show the connect card or "Couldn't reach the relay" (mirror `emailError` handling). The SW is network-first; a stale bundle is avoided by the `CACHE` bump.
- **Empty states:** no upcoming Google events → serif-italic `.empty` "Nothing on your Google Calendar." No free slots found → "No openings in that window — try a wider range."
- **Parse failures:** Gemini returning unparseable text or failing validation must degrade to the friendly `calParseErr` message (route returns `{ok:false,error}` at HTTP 200), never a thrown exception or a blank card.
- **Timezone correctness:** always send the browser `tz` to `/calendar/parse` and `/calendar/create`; the relay must set `start.timeZone`/`end.timeZone` so events land at the right wall-clock time. All-day events use `{date:...}` (no time/timezone). Build all ISO strings in ES5 via `new Date(...).toISOString()` + concat.
- **Privacy:** event titles/locations are sensitive — they live only on the device and in the user's own Google Calendar; never log them on the relay, never put them in the synced D1 doc beyond the user's own created mirrors, and never echo them into a commit.

### Effort & dependencies
- **Size: L** (one scope change + 4–6 relay routes + a full app sub-room mirroring the Email room).
- **Must exist first:** the existing **Email room / Google OAuth** (`state.email.session`, `/google/login`, `/google/status`, `/google/logout`, `gml:<session>`, `gmailGetRec`/`gmailPutRec`/`gmailFindAccount`/`gmailAccessToken`/`gmailApi`) — all confirmed present and reused by this feature. The relay's `GEMINI_API_KEY` and `GOOGLE_CLIENT_SECRET` must already be set (they are). No dependency on the Brief/Weekly features.
- **OUT OF SCOPE / future:** multi-calendar selection UI (we hardcode `primary` with a `calId` field reserved for later); recurring-event creation/editing (`RRULE`); attendee invites/RSVP; calendar event reminders via the push/cron system; two-way background sync of Google events into the synced doc; rendering Google events on the month-grid heat-map (start with the agenda list only). Edit/delete are explicitly **stretch**, not required for the first ship.

---

## 4. 📤 One-Tap Send

### Mission
Upgrade the Email-room draft card so Kevin can approve and send the AI reply with one confirmed tap, threading correctly into the original Gmail conversation, then auto-archiving the thread. Add three tone presets (Warm, Terse, Decline) that regenerate the draft via Gemini before sending. Done = a real reply leaves Kevin's correct account, the thread vanishes from the inbox, and a "Sent ✓" toast appears.

### Why it matters
Closes the reply loop: KevinOS already drafts replies (today the draft card button literally reads **"Approve & send"** and sends immediately on one tap), but there is no tone control and no explicit confirm gate. This feature adds tone presets and turns the single-tap send into a two-tap confirmed send — making an outward-facing action deliberate while keeping it one screen away.

### User flow
1. Kevin opens the **Email** room (router case `else if(r==="email")emailEnter();` at index.html:2371) and taps **✨ Draft reply** on a message row (existing `draftReply`, index.html:2576). A draft card renders inline (existing `emailDraftHTML`, index.html:2624), called from `emailRowHTML` (index.html:2634) when `emailDrafts[m.id]` exists.
2. The card now shows three tone-preset chips — **Warm · Terse · Decline** — above the editable To/Body fields, plus the send button, **Discard**, and (existing) overnight badge when applicable.
3. Kevin taps **Terse**. The card body area shows a small "rewriting…" state and re-POSTs to `/google/draft` with `tone:"terse"`; the body field is replaced with the regenerated text. (To/subject/threadId/messageId/account/overnight are preserved.)
4. Kevin edits the body inline if he wants, then taps the send button (today labeled **"Approve & send"**).
5. A **confirm step** appears in-card: the send button is replaced by "Send to `<recipient>`?" with **Yes, send** and **Cancel**. This is an outward-facing action, so the second tap is required.
6. On **Yes, send**, the card shows a sending spinner; the app POSTs `/google/send` with `threadId`/`messageId` for threading.
7. On success: a **"Sent ✓"** toast appears, the draft card closes, and the thread is **archived** (existing `archiveMsg`, index.html:2481, which calls `/google/modify` with `archive:true`) so it leaves the inbox on every device.
8. On failure: a toast with the error; the card returns to its editable state (no archive, draft preserved, confirm cleared).

### Data model
No new persisted `state` fields. All new state is **module-level ephemeral** (reset on reload, never persisted, never synced), declared beside the existing email ephemerals at index.html:2464 (which today is the single line: `var emailThreads=[], emailDrafts={}, emailLoading=false, emailError="", emailSending={}, emailOvernight=[], emailDrafting=false, emailGroupsOpen={fyi:false,noise:false,snoozed:false}, emailSnoozeOpen="";`):

- `emailTone` — `var emailTone = {};` — map `{ [msgId]: "warm"|"terse"|"decline" }` tracking the last-applied tone per draft, for chip highlighting. Reset on reload.
- `emailConfirm` — `var emailConfirm = {};` — map `{ [msgId]: true }` marking which draft cards are in the confirm-before-send state. Reset on reload.
- `emailRewriting` — `var emailRewriting = {};` — map `{ [msgId]: true }` marking which drafts are mid tone-regeneration (spinner in the body area). Reset on reload.

The existing `emailDrafts[id]` object — `{to, subject, body, threadId, messageId, account}` as set at index.html:2581, plus an `overnight` flag on overnight drafts — gains an optional `tone` field when a preset is applied. The existing `emailSending` map (index.html:2464, 2593) is reused for the send-in-flight spinner.

- **Sync:** none of these are in `state`, so they are inherently device-local — no `SYNC_SKIP` change needed. (For reference, `state.email` is already in `SYNC_SKIP` at index.html:1201: `var SYNC_SKIP={github:1,relay:1,push:1,sync:1,email:1,brief:1,weekly:1,v:1};`.) `buildSyncDoc` (index.html:1213) copies only own-enumerable `state` keys not in `SYNC_SKIP`; these maps live outside `state` entirely, so they can never enter the sync doc by any path.
- **SYNC_ARRAYS:** no change (`var SYNC_ARRAYS=["items","events","projects","builds","briefs","links","prompts","notes","council","pending"];`, index.html:1214). None of the new state is an id-keyed collection.
- **localStorage / versioning:** no `state`-shape change, so **do not** bump `state.v` (currently `state.v=26;` at index.html:2808). Still bump the SW cache (`sw.js` line 2: `var CACHE="kevinos-v0_26";` → next number) and the footer string (`index.html` line 631: `KevinOS v0.26 …`) per the normal ship ritual.
- **Synced D1 doc:** untouched. Archive happens via Gmail labels (authoritative across devices) exactly as today; no doc write.

### Relay changes
Two routes touched. One is a small additive change; one already exists and is reused as-is. All edits are in `/Users/kevin/KevinOS/app/relay/worker.js`, which is a Cloudflare Worker (modern ES module — `const`/`let`/arrow/`async`/`await` are fine here; ES5 rules do NOT apply to this file).

#### 1. `POST /google/draft` — add `tone` support (CHANGED)
Existing route at worker.js:1260. Today it accepts `{session, account?, id, instructions?}`. Add an optional `tone` field.

- **Request JSON:** `{ session, account?, id, tone? }` where `tone` ∈ `"warm" | "terse" | "decline"` (omit/empty = neutral default, current behavior). `instructions?` remains supported and orthogonal.
- **Response JSON:** unchanged — `{ ok, to, subject, body, threadId, messageId }` (see worker.js:1279, which returns `to:from`, `subject` as `Re: …` unless already `re:`, `body:draft`, `threadId:mj.threadId`, `messageId` from the `Message-ID` header).
- **What it does:** unchanged flow (fetch full message via `gmailApi(token,"/messages/"+payload.id+"?format=full")`, run `callGemini`, return reply body — **never sends**), except the system prompt gains a tone clause when `tone` is provided.
- **System prompt design.** The EXISTING base system string at worker.js:1276 is **verbatim**:
  ```
  "You are " + acct.email + ", writing a reply as this person. Draft a clear, warm, concise reply. Return ONLY the reply body text — no subject line, no email headers, a simple sign-off is fine."
  ```
  Do not paraphrase it — append to it. Build a tone clause and concatenate:
  ```js
  let toneClause = "";
  const t = (payload.tone || "").toString();
  if (t === "warm") toneClause = " Lean into a warm, friendly, appreciative tone — personable and encouraging, but still concise.";
  else if (t === "terse") toneClause = " Make it terse and efficient — as few words as possible while staying polite; no pleasantries, no filler.";
  else if (t === "decline") toneClause = " The answer is no: politely decline. Be gracious and brief, give a soft reason, do not over-apologize, and do not leave the door open.";
  const sys = "You are " + acct.email + ", writing a reply as this person. Draft a clear, warm, concise reply. Return ONLY the reply body text — no subject line, no email headers, a simple sign-off is fine." + toneClause;
  ```
  (The `warm` clause intentionally reinforces the base prompt's existing "warm" wording rather than contradicting it.) Replace the existing `const sys = …` assignment at worker.js:1276 with the block above.
- **User prompt:** unchanged. The EXISTING construction at worker.js:1277 is:
  ```js
  const prompt = "Reply to this email" + (payload.instructions ? " (extra guidance: " + payload.instructions + ")" : "") + ".\n\nFrom: " + from + "\nSubject: " + subject + "\n\n" + body;
  ```
  Do not touch it — tone rides entirely on the system prompt.
- **Error/fallback:** unchanged. The route already returns 500 if `!env.GEMINI_API_KEY` (worker.js:1261), 401 `not connected` if no account (worker.js:1265), 400 `Missing message id` (worker.js:1266), 502 on `callGemini`/Gmail throw (worker.js:1280 catch). Tone is purely additive to the prompt; no new failure path.
- **Env/secret/scope:** none new. Uses existing `GEMINI_API_KEY` and the existing `gmail.readonly`+`gmail.send` scopes (`GOOGLE_SCOPE`, worker.js:558). No re-consent needed.

#### 2. `POST /google/send` — reuse AS-IS (NO CHANGE)
Existing route at worker.js:1307: `{session, account?, to, subject, body, messageId?, threadId?}` → `{ok, id}`. It already builds a MIME message with `In-Reply-To`/`References` from `payload.messageId` (worker.js:1318) and threads via `threadId` in the `gmail.send` body (worker.js:1320), then calls `gmailApi(token,"/messages/send",…)`. Per-message account routing is honored by the app passing `account: (d.account||acctForId(id))` (existing `sendReply`, index.html:2594). It returns 401 `not connected`, 400 `Missing recipient or body`, 502 on send failure. **Do not modify** — the app already calls it correctly. Threading and account routing are server-side and confirmed working.

> All other behavior (archive via `/google/modify`, account-token refresh via `gmailAccessToken`) reuses existing routes. No other relay changes.

### App changes (index.html, ES5)

#### New module-level vars
Add immediately after the existing email ephemerals line at index.html:2464:
```
var emailTone={}, emailConfirm={}, emailRewriting={};
```

#### New / changed helper functions
- `function rewriteDraft(id, tone)` — **mirror `draftReply` (index.html:2576)** for the fetch/error shape, but merge instead of replace. Guard re-entry first: `if(emailRewriting[id])return;`. Then `var base=relayBase();if(!base)return;var ac=acctForId(id);` set `emailRewriting[id]=true; emailTone[id]=tone;` and `renderEmail();`. POST `/google/draft` with `JSON.stringify({session:state.email.session,account:ac,id:id,tone:tone})`. On success **merge only the new body**: `var d=emailDrafts[id]; if(d&&j&&j.ok&&j.body){d.body=j.body;d.tone=tone;} delete emailRewriting[id]; renderEmail();` (preserve `to/subject/threadId/messageId/account/overnight`; if `j.body` is empty/falsy, keep the previous body and `toast("Couldn't rewrite — try again.")`). On `!j||!j.ok`: `delete emailRewriting[id]; toast((j&&j.error)?("Rewrite failed: "+j.error):"Couldn't rewrite — try again."); renderEmail();`. `.catch(function(){delete emailRewriting[id];toast("Couldn't reach the relay.");renderEmail();});`. Use `function(r){return r.json();}` and `function(j){…}` — no arrows. Note: if the draft was discarded mid-flight (`!emailDrafts[id]`), the success handler's `if(d&&…)` guard makes the merge a no-op safely.
- `function confirmSend(id)` — `function confirmSend(id){if(!emailDrafts[id]||emailDrafts[id].loading)return;emailConfirm[id]=true;renderEmail();}`. Flips the card into confirm state (refuses while the draft is still loading).
- `function cancelSend(id)` — `function cancelSend(id){delete emailConfirm[id];renderEmail();}`. Backs out of confirm state.
- `function sendReply(id)` — **modify the EXISTING `sendReply` (index.html:2589).** The current body is:
  ```js
  function sendReply(id){
    var d=emailDrafts[id];if(!d||d.loading)return;
    var ed=readDraftCard(id)||{};var to=(ed.to||d.to||"").trim(),body=(ed.body||d.body||"").trim();
    if(!to||!body){toast("Need a recipient and a message.");return;}
    if(emailSending[id])return;emailSending[id]=true;renderEmail();
    fetch(relayBase()+"/google/send",{…}).then(function(r){return r.json();}).then(function(j){
      emailSending[id]=false;
      if(!j||!j.ok){toast((j&&j.error)?("Send failed: "+j.error):"Couldn’t send.");renderEmail();return;}
      if(d.overnight)clearOvernight(id);delete emailDrafts[id];toast("Sent ✓");renderEmail();
    }).catch(function(){emailSending[id]=false;toast("Couldn’t reach the relay.");renderEmail();});
  }
  ```
  Two surgical edits, nothing else:
  1. **Success branch** — change the final success line. Today it is:
     `if(d.overnight)clearOvernight(id);delete emailDrafts[id];toast("Sent ✓");renderEmail();`
     Replace with:
     `if(d.overnight)clearOvernight(id);delete emailDrafts[id];delete emailConfirm[id];delete emailTone[id];delete emailRewriting[id];toast("Sent ✓");archiveMsg(id);`
     Note: `archiveMsg(id)` (index.html:2481) already does optimistic local removal **and** calls `renderEmail()` itself, so it replaces the trailing `renderEmail()` here — do **not** keep both (the original `renderEmail()` is dropped because `archiveMsg` re-renders last). `clearOvernight(id)` must still run **before** the archive so the overnight record is removed from KV.
  2. **Error branch** — in the `if(!j||!j.ok){…}` block, add `delete emailConfirm[id];` before its `renderEmail();` so a failed send returns the card to editable (not stuck in confirm): `if(!j||!j.ok){toast((j&&j.error)?("Send failed: "+j.error):"Couldn’t send.");delete emailConfirm[id];renderEmail();return;}`. Also add `delete emailConfirm[id];` inside the `.catch` before its `renderEmail()`.
  Keep everything else exactly as-is: the `if(!d||d.loading)return;` guard, the `readDraftCard(id)` merge of edited To/Body, the empty-field toast, the `if(emailSending[id])return;emailSending[id]=true;` in-flight guard, and the `body:JSON.stringify({session:state.email.session,account:(d.account||acctForId(id)),to:to,subject:d.subject||"",body:body,threadId:d.threadId,messageId:d.messageId})` payload.
- `function emailDraftHTML(id)` — **modify the EXISTING helper (index.html:2624).** It currently has: a `if(!d)return"";` guard, a `if(d.loading)` spinner branch (the `cq-seat pending` thinking dots, index.html:2626), then `var sending=!!emailSending[id];` and the editable card. Restructure into three render branches by precedence:
  1. `d.loading` → existing spinner card (index.html:2626), unchanged.
  2. `emailConfirm[id]` → confirm card. Wrap in the same outer `<div data-dcard="'+id+'" …>` shell (keep the `data-dcard` attribute so `readDraftCard` and any later edit reads still resolve). Show the overnight badge if present, then a quiet confirm line `'<div class="hint" style="color:var(--ink-soft);margin-bottom:8px">Send to <strong>'+escapeHtml(d.to||"")+'</strong>?</div>'`. If `emailSending[id]` is true, show the sending spinner text in place of the buttons (reuse the existing `Sending…`/disabled treatment); otherwise show two buttons: `'<button class="add-btn" type="button" data-em="sendyes" data-id="'+id+'">Yes, send</button>'` and `'<button class="btn-soft" type="button" data-em="sendno" data-id="'+id+'">Cancel</button>'`.
  3. default editable card → the EXISTING To/Body card (index.html:2628–2632) with two additions: (a) a **tone-chip row at the top** (just inside the `data-dcard` div, before the To field) and (b) the send button now carries `data-em="send"` exactly as today (the handler change below makes that first tap open the confirm step). Tone chips: three buttons
     ```
     '<div class="draft-tones"><button class="chip'+(emailTone[id]==="warm"?" active":"")+'" type="button" data-em="tone" data-id="'+id+'" data-tone="warm">Warm</button><button class="chip'+(emailTone[id]==="terse"?" active":"")+'" type="button" data-em="tone" data-id="'+id+'" data-tone="terse">Terse</button><button class="chip'+(emailTone[id]==="decline"?" active":"")+'" type="button" data-em="tone" data-id="'+id+'" data-tone="decline">Decline</button></div>'
     ```
     If `emailRewriting[id]` is true, render the body area as a small inline "rewriting…" placeholder (e.g. `'<div class="cq-prov" style="padding:8px 0">rewriting…</div>'`) **instead of** the `<textarea data-df="body">`, but keep the To `<input data-df="to">` present so the field is preserved. Leave the existing send/discard button row intact (the send button keeps `data-em="send" data-id="'+id+'"` and the disabled/`Sending…` treatment driven by `var sending=!!emailSending[id];`).

  **Critical compatibility:** `readDraftCard(id)` (index.html:2584) reads `document.querySelector('[data-dcard="'+id+'"]')` and inside it `[data-df="to"]` and `[data-df="body"]`. The editable-card branch MUST keep those exact attributes (`data-dcard` on the outer div, `data-df="to"` on the To input, `data-df="body"` on the body textarea) so `sendReply`'s merge of edited values keeps working. In the `emailRewriting` placeholder case there is no body textarea — that is fine because send is not reachable from that transient state.

- `function discardDraft(id)` — **modify the EXISTING one-liner (index.html:2600).** It is currently:
  `function discardDraft(id){if(emailDrafts[id]&&emailDrafts[id].overnight)clearOvernight(id);delete emailDrafts[id];renderEmail();}`
  Add the new-map cleanup before `renderEmail()`:
  `function discardDraft(id){if(emailDrafts[id]&&emailDrafts[id].overnight)clearOvernight(id);delete emailDrafts[id];delete emailConfirm[id];delete emailTone[id];delete emailRewriting[id];renderEmail();}`

#### Render flow hook points
- **No nav/`go()` change.** The Email room already exists (`data-room="email"` tab; router case `else if(r==="email")emailEnter();` at index.html:2371; `emailEnter` at index.html:2525). All new UI lives inside `emailDraftHTML`, which is already called from `emailRowHTML` (index.html:2638: `if(emailDrafts[m.id])actions=emailDraftHTML(m.id);`) inside `renderEmail` (index.html:2656). No new mount, no new render fn, no new wire-up listener — every new button is a `data-em` element under the existing `emailView` delegate.

#### Click-delegation handler cases
The EXISTING `handleEmailClick` (index.html:2684) dispatches on `a.getAttribute("data-em")` with `id=a.getAttribute("data-id")`. Make these edits:
- **Change** the existing line `else if(act==="send")sendReply(id);` (index.html:2695) to:
  `else if(act==="send")confirmSend(id);`
  so the first Send tap opens the confirm step.
- **Add** three new cases (place them adjacent to the `send`/`discard` cases):
  ```
  else if(act==="tone")rewriteDraft(id,a.getAttribute("data-tone"));
  else if(act==="sendyes")sendReply(id);
  else if(act==="sendno")cancelSend(id);
  ```
The existing `discard` case (`else if(act==="discard")discardDraft(id);`, index.html:2696) is unchanged at the call site — the cleanup is inside `discardDraft` itself (above). The `change` listener for the account `<select>` (index.html:2421) and all other `data-em` cases stay untouched.

#### Mirror-this summary
- `rewriteDraft` → mirror `draftReply` (index.html:2576) for the fetch/spinner/error shape; merge body instead of replacing the whole `emailDrafts[id]` object.
- `sendReply` change → keep the structure of the existing `sendReply` (index.html:2589); only append the archive call + the three-map cleanup and the confirm-clear on the error/catch paths.
- New buttons/handler cases → mirror the existing `data-em`/`data-id` pattern in `emailRowHTML` (index.html:2634/2639/2640) and `handleEmailClick` (index.html:2684).
- Tone chips → reuse the existing `.chip` class (defined index.html:60) and its `active` modifier (index.html:62).

### ES5 compliance
This feature is pure DOM/string work — no Web Speech, no new APIs. The whole `index.html` script is one IIFE with `"use strict"` (line 645). Specific gotchas:
- **No template literals** in `emailDraftHTML`/`rewriteDraft` — build every string with `"…"+escapeHtml(x)+"…"` concatenation, matching the existing `emailRowHTML`/`emailDraftHTML` style. The confirm line is `'Send to <strong>'+escapeHtml(d.to||"")+'</strong>?'`.
- **No arrow functions** in the `rewriteDraft`/`sendReply` fetch chains — use `function(r){return r.json();}` / `function(j){…}` / `function(){…}`, exactly like `draftReply` (index.html:2579–2582) and the current `sendReply` (index.html:2594–2598).
- **No `const`/`let`** — declare with `var` (including `var emailTone={}, emailConfirm={}, emailRewriting={};`).
- **No destructuring / spread** — read `emailDrafts[id]` fields by dot access; merge the rewritten body via `d.body=j.body;` (do not rebuild the object via spread).
- **Always `escapeHtml(...)`** (defined index.html:729) on any message-derived text (`d.to`, body preview) interpolated into `innerHTML`, per the rendering convention.
- The relay edits (`/google/draft` tone clause in worker.js) are **exempt** from ES5 — modern ES (`const`/`let`/arrow) is fine and expected there.
- Self-check before saving: grep your `index.html` diff for `=>`, backtick, `const `, `let `, `async`, `await`, `...`, `class ` — any hit in app JS is a bug.

### Styling
The existing draft card does **not** use the CSS-variable system — it is built with **inline styles and hardcoded purple** (`border:1px solid rgba(91,59,140,.18)`, badge `color:#5B3B8C`, etc., at index.html:2628–2632). Match the surrounding code: the new elements should sit cleanly inside that existing card without restyling it.
- **Tone-chip row:** reuse the existing `.chip` pill class (index.html:60: `border-radius:999px`, `--line` border, transparent bg, `--ink-soft` text) and its `.active` modifier (index.html:62: `color:#fff;border-color:transparent`). **Caveat:** `.chip.active` as defined sets white text and a transparent border but **no background** — on its own the active chip would render white-on-transparent and be unreadable. So add ONE new rule block in the `<style>` block (near the `.chip` rules around index.html:60–62) to give the active draft-tone chip a filled accent background, plus the row layout:
  ```css
  .draft-tones{display:flex;gap:6px;margin:0 0 8px 0}
  .draft-tones .chip.active{background:var(--accent);border-color:var(--accent);color:#fff}
  ```
  This scopes the background fix to draft-tone chips only (so it can't change the appearance of `.chip.active` used elsewhere). Reference `--accent` (defined `:root`, index.html ~14–22) — do not hardcode a new hex.
- **Confirm step:** style the confirm prompt as quiet inline text with `color:var(--ink-soft)` (matching the `.hint` treatment already used in the card). The **Yes, send** button reuses the primary `.add-btn` (filled, white text — the same class the existing send button uses); **Cancel** reuses `.btn-soft` (surface + `--line` border). No new class strictly required; an optional wrapper `.draft-confirm{display:flex;align-items:center;gap:8px;flex-wrap:wrap}` keeps the buttons tidy on narrow phones.
- **Rewriting / sending spinner:** reuse the existing `.cq-prov` treatment (index.html:304: small uppercase faint label) for the inline "rewriting…" text, mirroring how `briefCardHTML`/`weeklyCardHTML` surface their busy state. The existing send-in-flight `Sending…`/`disabled` treatment in `emailDraftHTML` is reused unchanged. Keep any transition timings in the existing .12–.25s range.
- Do not introduce hardcoded hex **for the new rule**; reference `--accent`, `--line`, `--ink-soft`. (The pre-existing inline purple in the card is left as-is — do not refactor it as part of this feature.)

### Verification
1. **Relay syntax:** `node --check /Users/kevin/KevinOS/app/relay/worker.js` → PASS = no output, exit 0.
2. **App syntax sanity (ES5 self-check):** from a shell, scan the diff region of `index.html` for ES6 tokens (run after editing): `LC_ALL=C grep -nE '=>|\bconst |\blet |\basync |\bawait |\.\.\.|\bclass ' /Users/kevin/KevinOS/app/index.html | sed -n '1,40p'` — confirm none of the hits fall inside your new/changed functions (`rewriteDraft`, `confirmSend`, `cancelSend`, `sendReply`, `emailDraftHTML`, `discardDraft`, `handleEmailClick`). (The file may contain such tokens inside strings/comments elsewhere — only your edited code must be clean.)
3. **Draft with tone (live relay).** Requires a connected Gmail session and a real message `id`; substitute real values (get a real `id` from a `/google/threads` call for that session):
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/google/draft \
     -H "Content-Type: application/json" \
     -d '{"session":"<SESSION>","account":"<EMAIL>","id":"<MSG_ID>","tone":"terse"}'
   ```
   PASS = `{"ok":true,"to":"…","subject":"Re: …","body":"…","threadId":"…","messageId":"…"}` and the body reads noticeably terser than the neutral draft. Repeat with `"tone":"warm"` and `"tone":"decline"` and confirm the tone shifts. Then run once with no `tone` field and confirm it reproduces today's neutral draft. (Without a real session you'll get `{"error":"not connected"}` 401, which still confirms the route parses the body and reaches the account check — not a tone failure.)
4. **Health probe (sanity):**
   ```sh
   curl -s https://kevinos-relay.kevinbigham.workers.dev/ | head -c 400
   ```
   PASS = JSON with `"email":true` (Gmail capability advertised). If `"email":false`, the relay's Gmail env is unset and steps 3/5 cannot pass — fix the relay config first.
5. **Send is NOT exercised by curl** — calling `/google/send` sends real mail. Verify send only through the UI in step 6.
6. **Preview-server (app).** Serve `app/` (e.g. `python3 -m http.server 8000` run from `/Users/kevin/KevinOS/app`), open `http://localhost:8000`, go to the Email room with a connected account:
   - Tap **✨ Draft reply** → draft card appears with the **Warm · Terse · Decline** chip row above the To/Body fields.
   - Tap **Terse** → body area shows "rewriting…" then a shorter body; the Terse chip is highlighted (`active`).
   - Tap the send button → card switches to **"Send to <recipient>? · Yes, send · Cancel"** (no mail sent yet).
   - Tap **Cancel** → returns to the editable card (To/Body restored, tone chip still highlighted).
   - Tap send → **Yes, send** → spinner, then **"Sent ✓"** toast, the card closes, and the thread disappears from the inbox (archived). Reload and confirm it stays gone.
   - PASS = the reply actually arrives in the recipient's inbox **threaded** under the original (check Gmail), sent from the **correct account** when in the unified ("All inboxes") view.

### Acceptance criteria
- [ ] `node --check relay/worker.js` passes.
- [ ] `/google/draft` accepts an optional `tone` and returns a body whose tone matches `warm`/`terse`/`decline`; omitting `tone` reproduces the current neutral draft; the existing base system prompt (worker.js:1276) and user prompt (worker.js:1277) are otherwise unchanged.
- [ ] The draft card shows three tone chips; tapping one regenerates the body in place, preserves `to`/`subject`/`threadId`/`messageId`/`account`/`overnight`, and highlights the active chip.
- [ ] Tapping the send button requires a second confirm tap ("Yes, send") before any mail is sent; **Cancel** backs out cleanly to the editable card.
- [ ] On confirmed send, the app POSTs `/google/send` with `threadId` + `messageId`; the reply arrives **threaded** under the original message.
- [ ] In unified-inbox view, the reply is sent from the message's OWN account (via `acctForId(id)` / `d.account`, index.html:2473/2594), not the selector's first account.
- [ ] After a successful send: **"Sent ✓"** toast, draft card closes, thread auto-archives (via `archiveMsg`) and stays gone after reload.
- [ ] On send failure (`!ok` or network): error toast, draft preserved, card returns to editable (not stuck in confirm).
- [ ] `readDraftCard` still resolves the edited To/Body (the `data-dcard`/`data-df="to"`/`data-df="body"` attributes are intact in the editable branch).
- [ ] No new persisted `state` field; `state.v` unchanged at 26; SW cache + footer bumped on ship.
- [ ] All new app code is ES5 (no `=>`, backticks, `const`/`let`, `async`/`await`, spread, destructuring, `class`); relay code may be modern ES.

### Edge cases & gotchas
- **Per-message account routing:** always derive the account via `acctForId(id)` (index.html:2473) for `rewriteDraft`, and rely on the existing `account:(d.account||acctForId(id))` in `sendReply` (index.html:2594) — never `emailActive()`. In unified view the selector is `UNIFIED` (`"__all__"`, index.html:2465) and only the message carries its real `account`. Prefer `d.account` when present (set at draft creation, index.html:2581).
- **Re-entrancy:** keep the existing `if(emailSending[id])return;` guard in `sendReply` (index.html:2593). Add a matching `if(emailRewriting[id])return;` at the top of `rewriteDraft` so rapid tone taps don't fire overlapping `/google/draft` requests (otherwise last-write-wins on `body`).
- **Draft-loading vs confirm/send:** `confirmSend` and `sendReply` both early-out when `d.loading` is set, so a tone-rewrite or initial draft in flight can't be confirmed/sent mid-load. `emailRewriting[id]` removes the body textarea from the DOM, so a confirm can't be opened over a half-rewritten card without the body field — open confirm only from the fully editable card (the `data-em="send"` button only renders there).
- **Overnight drafts:** a draft may be an overnight one (`emailDrafts[id].overnight`, index.html:2629). Tone-rewrite must preserve `overnight` (merge body only — do not rebuild the object). On send, the existing `if(d.overnight)clearOvernight(id)` (index.html:2597) must still run **before** `archiveMsg(id)`.
- **Snooze interplay:** if a message is snoozed mid-draft it's filtered out of `renderEmail`; the draft/confirm/tone maps may linger harmlessly — `discardDraft` and a successful `sendReply` both clean them up. No extra handling needed.
- **Offline / PWA:** if the relay is unreachable, the existing `.catch` in `sendReply`/`rewriteDraft` fires → error toast, draft preserved, `emailConfirm[id]`/`emailRewriting[id]` cleared. **Never** optimistically archive before the send `ok` — `archiveMsg(id)` is called only inside the success branch.
- **Empty rewrite result:** if a tone rewrite returns an empty/falsy `body`, keep the previous body (only assign `d.body=j.body` when `j.body` is truthy) and toast a soft error — do not blank the textarea.
- **Privacy:** message bodies stay between the browser and the relay (which holds the keys). Never log body text. No body content enters the synced D1 doc or any persisted `state` (the new maps live outside `state` and outside `SYNC_SKIP`'d-but-restored `state.email`).
- **Confirm-state cleanup:** every exit path — `discardDraft`, successful `sendReply`, send error, send catch, and `cancelSend` — must `delete emailConfirm[id]` so a card can never get stuck showing the confirm prompt. (`emailTone`/`emailRewriting` are cleared on discard and on successful send.)
- **`.chip.active` background:** the global `.chip.active` rule (index.html:62) sets only `color:#fff;border-color:transparent` with no background — without the scoped `.draft-tones .chip.active{background:var(--accent)…}` rule the active tone chip would be invisible white-on-transparent. The new rule is required, not cosmetic.

### Effort & dependencies
- **Size:** **S–M.** One additive relay field (tone clause on the existing system prompt), three tiny ephemeral maps, one new `rewriteDraft` fn, two one-line confirm fns, a restructured `emailDraftHTML` (three branches), a two-edit `sendReply`, a one-line `discardDraft` cleanup, one handler-line change + three new handler cases, and one CSS rule block.
- **Must exist first (all already shipped):** the Email room and its draft pipeline — `draftReply`/`emailDrafts`/`emailDraftHTML`/`readDraftCard`/`handleEmailClick`/`archiveMsg`/`acctForId` (index.html:2576/2464/2624/2584/2684/2481/2473); the `/google/draft`, `/google/send`, and `/google/modify` relay routes (worker.js:1260/1307/1239); and a connected Gmail account with the `gmail.send` scope (already in `GOOGLE_SCOPE`, worker.js:558).
- **Out of scope / future:** free-text custom tone or any tone beyond the three presets; editing the subject line; CC/BCC; attachments; rich-text/HTML bodies (send stays plain text, `Content-Type: text/plain`); undo-send / send-delay; persisting a tone preference across reloads; multi-message bulk send. These are explicitly deferred.

---

## 5. 🔥 Habit & Streak Tracker

### Mission
Add a **Habits** room where Kevin defines daily habits, checks each one off per day, and sees a live streak (current + longest) with a flame count and a 7-day completion grid. Habits and their check-off history sync across devices as content, and an evening push nudges Kevin if any habit is still unchecked before the day ends. Done = a working `room-habits` tab that lets you add/check/delete habits with correct streak math, surviving reload and propagating across synced devices, plus a `gen:"habits"` cron push that fires only when habits are still open.

### Why it matters
Daily consistency is the whole game for a life-OS; a visible streak + an end-of-day nudge is the cheapest, highest-leverage behavior loop KevinOS can ship.

### User flow
1. Kevin taps the **Habits** tab in `#nav`. `go("habits")` activates `#room-habits` and calls `renderHabits()`.
2. The room shows an add-row (text input `#habitInput` + "Add" button `#habitAddBtn`). Kevin types "Meditate" and taps Add → a new habit card appears with an empty 7-day grid and "0 day streak".
3. Each habit card shows: the name, a large check-off button for **today**, a 🔥 flame with the current streak number, "best: N", and a 7-day grid (oldest→today, left→right) where each cell is filled if that day was completed.
4. Kevin taps today's check-off button → the rightmost cell (today) fills, the flame increments, and the button flips to its "done" state. Tapping again un-checks today (toggle).
5. Kevin can edit a habit's name or delete it via an edit affordance (mirroring task rows: an edit button opens an `edit-panel` with Save / Cancel / Delete).
6. State is saved (`save()`), which schedules a cross-device sync push; on his other device the same habits/checks appear after pull.
7. At **20:00 local** each day, if any habit is unchecked, a push fires: "🔥 Don't break the chain" / "N habit(s) still open today." Tapping it opens the app to the Habits room.

### Data model
Add one new synced array to the `state` literal (index.html:689):

```js
habits:[]
```

Each habit object shape (created by `addHabit`, id via `uid()` at index.html:704):
```js
{ id:"<uid>", name:"Meditate", createdAt:<ms>, done:{} }
```
- `done` is a **date-keyed map** of completed days: `{ "2026-06-27":1, "2026-06-26":1 }`. Keys are `todayKey()`-format `"YYYY-MM-DD"` strings (built from `dateKey(new Date())`, index.html:708/710); presence (truthy value) = completed that day. This map-of-days design keeps merges trivial and avoids array churn.

Sync / persistence:
- **Synced as an id-keyed array.** Add `"habits"` to the `SYNC_ARRAYS` literal (index.html:1214: currently `["items","events","projects","builds","briefs","links","prompts","notes","council","pending"]`). Each object has a unique `.id`, so `mergeById` (index.html:1225, applied by `mergeRemoteDoc` at 1236) merges cleanly on stale-push, and `applySyncDoc` (the `SYNC_ARRAYS.forEach` at index.html:1217) replaces it on a clean pull. Do **not** add `habits` to `SYNC_SKIP` (index.html:1201).
  - **Verified merge semantics**: `mergeById` is whole-object union-by-id — for a shared id, the remote/cloud copy's whole object wins; neither side's *additional* habits are dropped. So a check-off made on device A and a *different* check-off on device B *to the same habit* can clobber (one device's `done` map overwrites the other's). Acceptable for v1 (last-writer-wins per habit). Distinct habits never conflict.
- **Bootstrap restore branch**: in the `store.load` restore block (index.html:2785–2805, which mirrors `if(isArr(saved.items))state.items=saved.items;` at 2786 using `isArr` from index.html:2782), add a line alongside the other `isArr` array restores:
  ```js
  if(isArr(saved.habits))state.habits=saved.habits;
  ```
  Place it next to the `prompts`/`notes` restores (lines 2792–2793). Without this line, `habits` is dropped on every reload (the block does not blindly copy `saved`).
- **Versioning**: the load/migrate path stamps the schema version at index.html:**2808** (currently `state.v=26;`; the literal at 689 still seeds `v:5` and is overwritten). Bump that line to `state.v=27;` since the state shape changed. No destructive migration needed — absent `habits` defaults to `[]` from the literal, and old docs render fine; do **not** add a `prevV<27` migration. On ship, also bump the footer string `KevinOS v0.26` → `KevinOS v0.27` (index.html:631) and the SW cache `kevinos-v0_26` → `kevinos-v0_27` (sw.js:2), keeping all three in lock-step per the version-bump ritual.
- **Synced D1 doc**: `habits` rides along automatically inside `buildSyncDoc` (index.html:1213, which copies every own key not in `SYNC_SKIP`) because it is not skipped. The relay stores the doc opaquely and does not need to understand `habits` for *sync*; only the cron nudge reads it — see Relay changes.

### Relay changes
The evening nudge does **not** generate AI text (it is a deterministic count), so no Gemini route and no new `fetch` route are needed — but the cron must count unchecked habits from the synced doc at fire time. Two touch points in `/Users/kevin/KevinOS/app/relay/worker.js`:

**1. New `gen:"habits"` branch in `firePush`** — added to the `if (r.gen === ...)` chain inside the `for (const r of due)` loop (worker.js:492–514). The verified house pattern: each branch sets `body`/`title`/`skip`, then the **shared** `if (skip) continue;` at worker.js:510 (after the chain) does the actual skip and `sendPush` at 511 runs for non-skipped reminders. The `gen:"draft"` branch (worker.js:502–508) is the precedent for "skip when there is nothing to send" — it sets `skip = true`, it does **not** `continue` inside the branch. Mirror that exactly:

```js
} else if (r.gen === "habits") {
  // Evening nudge: count habits still open in the synced doc RIGHT NOW.
  // Deterministic — no Gemini. Skip the push entirely when nothing is open.
  try {
    const n = await countOpenHabits(env, r.syncKey, r.dateKey);
    if (!n) { skip = true; }
    else { body = n + " habit" + (n === 1 ? "" : "s") + " still open today."; }
  } catch (e) { body = r.body; }
}
```
Insert this as a new `else if` **before** the closing `}` of the chain at worker.js:509 (i.e. after the `gen:"draft"` block, immediately preceding `if (skip) continue;` at 510). Do **not** put a bare `continue` inside the branch — let the shared `if (skip) continue;` handle it, matching the draft branch.

**2. New helper `countOpenHabits(env, syncKey, dateKey)`** — place it beside `buildServerBrief` (worker.js:704) / `briefDigest` (worker.js:658), in the digest/builder cluster. It reads the synced D1 doc with the exact established pattern (`env.SYNC.prepare("SELECT doc FROM docs WHERE id = ?").bind(...).first()`, the same call used at worker.js:711) and counts habits whose `done[dateKey]` is falsy. **This file is the relay (ES modules) — ES6+ is expected and correct here; do NOT apply the ES5 rule to worker.js.**

```js
async function countOpenHabits(env, syncKey, dateKey) {
  if (!syncKey || !/^[a-f0-9]{16,128}$/.test(syncKey) || !env.SYNC) return 0;
  const row = await env.SYNC.prepare("SELECT doc FROM docs WHERE id = ?").bind(syncKey).first();
  if (!row || !row.doc) return 0;
  let doc;
  try { doc = JSON.parse(row.doc); } catch (e) { return 0; }
  const habits = Array.isArray(doc.habits) ? doc.habits : [];
  if (!habits.length) return 0;
  let open = 0;
  for (const h of habits) { if (!(h && h.done && h.done[dateKey])) open++; }
  return open;
}
```
The `/^[a-f0-9]{16,128}$/` guard is the same syncKey validator used by `buildServerBrief` (worker.js:709) and `/sync/pull` (worker.js:1074); reuse it verbatim.

- **Route changes**: none. No new `fetch` guard, no change to the dispatch chain. The reminder itself is delivered via the existing `POST /push/sync` flow (worker.js:938) — the app syncs the `gen:"habits"` reminder object as part of `buildReminders()`, and the relay stores it in KV `sub:<sha256(endpoint)>` like every other reminder.
- **(Optional) advertise capability**: add `habits: !!env.SYNC` to the `GET /` health object at worker.js:**849** (the object currently ends `…email: !!env.GOOGLE_CLIENT_ID`). Purely cosmetic; not required.
- **Request/response JSON**: N/A — this is cron-only. There is no client-facing request/response for the nudge.
- **Gemini prompt / system prompt**: **N/A — deterministic count, no LLM.** Rationale: the nudge is a number, not prose; calling Gemini would add latency, cost, and a failure mode for zero user benefit. `countOpenHabits` needs **no** `GEMINI_API_KEY`.
- **Error/fallback**: on read/parse error, `body` stays the static `r.body` synced by the app ("Some habits are still open today.") and the push still fires (we don't skip on error — a count error shouldn't silence the nudge). If `n===0`, `skip = true` → the shared `if (skip) continue;` drops the push.
- **Env/secret/scope needs**: none new. Reuses `env.SYNC` (D1) and the existing VAPID push secrets (`VAPID_PRIVATE_KEY` etc.). The cron itself already runs every minute (`crons=["* * * * *"]` in `wrangler.toml`, dispatched by `scheduled() → ctx.waitUntil(firePush(env))` at worker.js:1346) — no cron change.

### App changes (index.html, ES5)
Mirror the **Tasks room** vertical slice (`makeTaskRow`/`handleTaskAction`/`handleTaskListClick`/`editActions`) and follow the §7 "add a brand-new room" recipe.

**Static DOM:**
- **Tab button** in `#nav` (392–409): `<button class="tab" type="button" data-room="habits">Habits</button>`.
- **Room container**, added alongside the other rooms before `</main>`: 
  ```html
  <div class="room" id="room-habits">
    <div class="row" id="habitAddRow">
      <input id="habitInput" type="text" placeholder="New habit…">
      <button class="add-btn" type="button" id="habitAddBtn">Add</button>
    </div>
    <div id="habitList"></div>
  </div>
  ```
  Mirror the `#room-prompts` add-row + list layout (602–610) for exact class names/markup.

**New module-level scratch var** (with the other `editing*` vars near index.html:691, NOT persisted): `var editingHabitId="";` (mirrors `editingId`). Note: `go()` clears all the other `editing*` ids at index.html:2356 — add `editingHabitId="";` to that clear line so navigating away cancels an open habit edit (mirror how `editingNoteId` etc. are cleared there).

**Reuse existing helpers — do NOT redefine** (these all already exist):
- `todayKey()` (index.html:710), `dateKey(d)` (708), `addDaysKey(k,n)` (711), `keyToParts(k)` (709) — date math.
- `uid()` (704), `escapeHtml(s)` (729), `$(id)` (the DOM getter), `pf(b,id)` (703, scopes `#id` to the nearest `.edit-panel`), `editActions(prefix,id)` (735), `save()` (705).

**New helper functions** (place near the other room helpers ~720–2100):
- `function findHabit(id){for(var i=0;i<state.habits.length;i++){if(state.habits[i].id===id)return state.habits[i];}return null;}` — mirror `findItem` (768).
- `function habitDoneToday(h){return !!(h&&h.done&&h.done[todayKey()]);}` — today completion test.
- `function habitCurrentStreak(h){` — returns the count of consecutive completed days ending **today or yesterday**. Algorithm: if `h` or `h.done` is missing, return 0. Start `k=todayKey()`; if `!h.done[k]`, set `k=addDaysKey(k,-1)` (so an unchecked-today does not zero a live streak before day's end); then `while(h.done[k]){count++;k=addDaysKey(k,-1);}`. Return `count` (0 if neither today nor yesterday is done). `}`
- `function habitLongestStreak(h){` — collect all keys from `h.done` via `for(var key in h.done){if(h.done.hasOwnProperty(key))keys.push(key);}`, `keys.sort()` (ISO `YYYY-MM-DD` sorts lexicographically = chronologically), then scan: for each key after the first, if it equals `addDaysKey(prev,1)` increment the run else reset run to 1; track and return the max (0 when no keys). `}`
- `function habitGrid7(h){` — return an array of 7 `{key:k,done:!!(h.done&&h.done[k])}` from `addDaysKey(todayKey(),-6)` through `todayKey()` (oldest→today). `}`
- `function toggleHabitToday(h){var k=todayKey();h.done=h.done||{};if(h.done[k])delete h.done[k];else h.done[k]=1;}` — pure mutation only; the click handler does the render+save (mirrors how `handleTaskAction`'s `done` branch mutates then the shared tail renders+saves). Takes the habit object (already resolved by the handler), not an id.
- `function addHabit(){var inp=$("habitInput");var name=(inp.value||"").trim();if(!name)return;state.habits.unshift({id:uid(),name:name,createdAt:Date.now(),done:{}});inp.value="";renderHabits();save();}` — mirror the §7 step-10 `addX` pattern. (`addHabit` keeps its own `save()` because it is wired to the Add button directly, not routed through `handleHabitsClick`.)

**Render function** `function renderHabits(){var box=$("habitList");if(!box)return;box.innerHTML="";...}` (place near other room renderers ~720–2100):
- If `!state.habits.length`: `box.innerHTML='<p class="empty">No habits yet. Add one above to start a streak.</p>';return;` (mirror the empty-state at 814/890; class `.empty` already styled).
- Otherwise build one card per habit with `document.createElement`/`appendChild` (mirror `makeTaskRow` 776–810). For each `h`:
  - `var card=document.createElement("div");card.className="habit-card";`
  - Name + edit button + check-off button + flame line built via `innerHTML` string concatenation using `escapeHtml(h.name)`. Buttons carry `data-action`/`data-id`:
    - edit: `data-action="edit" data-id="<h.id>"`.
    - check-off: `data-action="toggle" data-id="<h.id>"`; class `add-btn` (filled) when `habitDoneToday(h)`, else `btn-soft`; label e.g. `'✓ Done today'` vs `'Check off'`.
  - flame line: `'🔥 '+habitCurrentStreak(h)+' day streak <span class="bc">best: '+habitLongestStreak(h)+'</span>'` inside a `<div class="flame">` (numbers are integers, safe to concat without `escapeHtml`).
  - 7-day grid: `var g=habitGrid7(h);` build `<div class="habit-grid">` with 7 `'<span class="cell'+(g[i].done?' on':'')+'"></span>'` (oldest→today, so today is the rightmost cell).
  - When `editingHabitId===h.id`: append an `.edit-panel` containing a text input pre-filled with `escapeHtml(h.name)` (give it an id like `habitEditName` so `pf()` can find it) plus `card.appendChild(editActions("habitedit", h.id))`. `editActions("habitedit", h.id)` (index.html:735) emits buttons with attributes `data-habitedit-save="<id>"`, `data-habitedit-cancel="1"`, `data-habitedit-delete="<id>"`.

**Exact hook points:**
- **`go(r)`** (2354–2373): (a) add `"habits"` to the room-div activation array at index.html:**2359**; (b) add `else if(r==="habits")renderHabits();` to the dispatch chain (between 2360 and 2371); (c) add `editingHabitId="";` to the `editing*` clear line at 2356.
- **`syncRerender()`** (1241–1254): insert `else if(room==="habits")renderHabits();` **into the `else if` chain** (e.g. after the `notes` branch at 1251), i.e. **before** the unconditional `renderSync();` at 1253 — that tail must remain the last statement. This repaints the Habits room when an incoming sync pull lands while it's open.
- **Wire-up block** (2391+): add `$("habitAddBtn").addEventListener("click",addHabit);` and `$("habitList").addEventListener("click",handleHabitsClick);`. The `#nav` delegate at index.html:2400 already routes the new tab to `go("habits")` — no change there. (No listener is needed on `#habitInput` for Enter unless you want it; the Tasks add-row pattern is button-only.)
- **Click handler** — mirror `handleTaskListClick` (865): check the edit-panel attributes **first** (they carry the id in the attribute *value*, read via `dataset`), then fall through to a single action branch with **one** trailing commit (mirror `handleTaskAction`'s single `renderTasks();renderHome();save();` tail at 863). Do **not** double-save:
  ```js
  function handleHabitsClick(e){
    var sv=e.target.closest("[data-habitedit-save]");
    if(sv){var h=findHabit(sv.dataset.habiteditSave);if(h){var t=(pf(sv,"habitEditName").value||"").trim();if(t)h.name=t;}editingHabitId="";renderHabits();save();return;}
    var cn=e.target.closest("[data-habitedit-cancel]");if(cn){editingHabitId="";renderHabits();return;}
    var dl=e.target.closest("[data-habitedit-delete]");if(dl){state.habits=state.habits.filter(function(x){return x.id!==dl.dataset.habiteditDelete;});editingHabitId="";renderHabits();renderHome();save();return;}
    var btn=e.target.closest("[data-action]");if(!btn)return;
    var id=btn.dataset.id,act=btn.dataset.action,h=findHabit(id);if(!h)return;
    if(act==="edit"){editingHabitId=(editingHabitId===id)?"":id;renderHabits();return;}
    if(act==="toggle"){toggleHabitToday(h);}
    renderHabits();renderHome();save();
  }
  ```
  Notes on the correction: `editActions(prefix,id)` puts the id in `data-<prefix>-save="<id>"` etc. (the *value*), so you read `sv.dataset.habiteditSave`, NOT a separate `data-id`. The `edit` action `return`s early (no save — just opening the panel), exactly like `handleTaskAction`'s `edit` branch at 862. `toggle` mutates then falls to the single shared `renderHabits();renderHome();save();` tail — there is **no** double-render/double-save. `renderHome()` is called so the optional Home "Habits N/M" line (below) stays fresh.

**Optional Home surfacing** (mirror `renderHomeNudges` at index.html:1583, part of the `renderHome` composite at 904): add a small "Habits: N/M done today" line where `M=state.habits.length` and `N=` count of `habitDoneToday(h)`. Skip the line entirely when `!state.habits.length`. Keep optional for v1.

**Cron reminder** in `buildReminders()` (index.html:1119–1138). The brief loop uses `morningBriefTimes(hour,7)` (index.html:1116), which returns 7 future daily timestamps at the given hour and **auto-skips today if that hour has already passed** (`if(first<=now)first+=86400000`). Reuse it for the 20:00 habit nudges — do **not** use `nextDowTime` (that is weekly). Add this loop alongside the existing `gen:"brief"`/`gen:"weekly"` pushes, using the already-declared `sk`/`tz` locals (lines 1122/1124):
```js
var htimes=morningBriefTimes(20,7);
for(i=0;i<htimes.length;i++){var dkH=dateKey(new Date(htimes[i]));out.push({id:"habits-"+i,fireAt:htimes[i],title:"🔥 Don’t break the chain",body:"Some habits are still open today.",url:url,tag:"kevinos-habits",gen:"habits",syncKey:sk,dateKey:dkH,tz:tz});}
```
Each `fireAt` is 20:00 local for its day and `dateKey` matches that day, so `countOpenHabits` checks the right day at fire time. No `emailSession` is needed for this `gen`. `url` is the page URL already declared at line 1120. These reminders are uploaded by the existing `syncReminders()`/`/push/sync` path (index.html:1144/1162) whenever push is enabled.

### ES5 compliance (index.html only — the relay is exempt)
- All new render strings use **string concatenation** (`'<span class="cell'+(g[i].done?' on':'')+'"></span>'`), never template literals/backticks.
- Use `var` only; **no** `const`/`let`. Use `function(){}` callbacks in `.filter`/`.forEach`/`.then` — **no** arrow functions (see `deleteHabit`'s `.filter(function(x){return x.id!==id;})` inside `handleHabitsClick`).
- No destructuring, spread, or `for...of` — iterate arrays with `for(var i=0;i<arr.length;i++)`. For the `done` map and `habitLongestStreak`, iterate keys with `for(var k in h.done){if(h.done.hasOwnProperty(k)){...}}`.
- `escapeHtml(h.name)` on every user-entered name in an `innerHTML` string (mirror index.html:1333). Streak/best counts are integers — safe to concat raw.
- No Web Speech / no new browser APIs — feature-detection N/A.
- Self-check the index.html diff for `=>`, `` ` ``, `const `, `let `, `async`, `await`, `...` before saving. (This check does **not** apply to `worker.js`, where `const`/arrow/`async`/`await` are required and correct.)

### Styling
Add to the single `<style>` block (index.html 13–~640), next to the card rules; reference CSS variables only (no hardcoded hex — variables are defined on `:root` at lines 14–22):
- `.habit-card` — reuse the card surface: `background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:14px;margin-bottom:10px;transition:transform .14s ease, box-shadow .16s ease;` with `.habit-card:hover{transform:translateY(-1px);box-shadow:var(--shadow);}`.
- `.habit-card .flame` — small meta line: `font-size:11px;color:var(--ink-faint);letter-spacing:.04em;margin-top:6px;`. The "best: N" span reuses the existing `.bc` count style (used by `bucket-head`).
- `.habit-grid` — `display:flex;gap:6px;margin-top:10px;`.
- `.habit-grid .cell` — `width:18px;height:18px;border-radius:5px;border:1px solid var(--line);background:var(--surface-2);`.
- `.habit-grid .cell.on` — completed day: `background:var(--accent);border-color:var(--accent);`.
- Check-off button: reuse `.add-btn` (filled `--accent`, white text) when done, `.btn-soft` (surface + `--line` border) when not — do not invent a new button class.
- Section header (if you add one above the list): reuse `.section-label`. Empty state reuses `.empty` (serif italic, `--ink-faint`). Edit-panel reuses `.edit-panel` (already styled; `pf()` depends on the `.edit-panel` class being present).

### Verification
1. **Syntax-check the worker**: `node --check /Users/kevin/KevinOS/app/relay/worker.js` → PASS = no output, exit 0.
2. **Deploy (only needed to exercise the cron nudge)**: from `/Users/kevin/KevinOS/app/relay` run `npx wrangler deploy`. You cannot directly curl `firePush` (it is cron-only), but you can confirm the synced doc carries habits after you add/check one in the app and let the 2 s sync push fire:
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/sync/pull \
     -H "Content-Type: application/json" \
     -d '{"key":"REPLACE_WITH_16_TO_128_HEX_SYNC_KEY"}' | head -c 800
   ```
   PASS = the response JSON's `doc` field contains a `"habits":[...]` array whose objects include your `"done":{"YYYY-MM-DD":1}` map. (The sync key is Kevin's passphrase-derived hex shown in the app's Sync panel; a wrong/short key returns `{ok:false}` or an empty/absent `doc`.)
   - **Capability probe** (if you added the optional health flag): `curl -s https://kevinos-relay.kevinbigham.workers.dev/ | head -c 400` → JSON includes `"habits":true` when `SYNC` is bound.
3. **App preview**: serve the app and open it — `python3 -m http.server 8000` from `/Users/kevin/KevinOS/app`, then open `http://localhost:8000/index.html`.
   - Click the **Habits** tab → empty state reads "No habits yet. Add one above to start a streak." PASS.
   - Add "Meditate" → a card appears: "🔥 0 day streak", "best: 0", 7 empty grid cells. PASS.
   - Tap the check-off → today's (rightmost) cell turns accent-filled, line reads "🔥 1 day streak best: 1", button flips to its done state. PASS.
   - Reload the page → the checked habit and streak persist (localStorage restore branch). PASS.
   - Tap check-off again → today un-checks, streak returns to 0, rightmost cell empties. PASS.
   - Tap edit → rename → Save → name updates; tap edit → Delete → card removed. PASS.
4. **Sync** (two-device sim): open two browser profiles both connected to the same sync key; add/check a habit in one, wait ~2–3 s (the `save()` → `scheduleSyncPush` 2 s debounce, index.html:1288), switch to the other and re-enter the Habits room → the change appears (and `syncRerender` repaints it if the room was already open). PASS.

### Acceptance criteria
- [ ] `Habits` tab appears in `#nav`; `go("habits")` activates `#room-habits` and calls `renderHabits()`; navigating away clears `editingHabitId`.
- [ ] Adding a habit via `#habitInput` + `#habitAddBtn` creates a card and persists across reload (restore branch present at ~2792).
- [ ] Tapping the check-off toggles today's completion; the rightmost grid cell and the flame count update immediately, with a single `save()` per tap (no double-save).
- [ ] `habitCurrentStreak` returns consecutive days ending today **or yesterday**; `habitLongestStreak` returns the all-time max run; `habitGrid7` shows the last 7 days oldest→today.
- [ ] Edit (rename) and delete work via the `.edit-panel`, reading the id from the `data-habitedit-*` attribute values, mirroring task rows.
- [ ] `"habits"` is in `SYNC_ARRAYS` and **not** in `SYNC_SKIP`; habits + `done` maps sync across devices and survive a stale-push `mergeById` union.
- [ ] Bootstrap restores `state.habits`; `state.v` bumped to `27` at index.html:2808; footer (631) and SW cache (sw.js:2) bumped to `0.27`/`v0_27` on ship.
- [ ] `node --check relay/worker.js` passes; `countOpenHabits` and the `gen:"habits"` branch exist; the nudge skips (via the shared `if(skip)continue;`) when `countOpenHabits` returns 0.
- [ ] `buildReminders` emits `gen:"habits"` reminders at 20:00 local for the next 7 days via `morningBriefTimes(20,7)`, each carrying `syncKey`/`dateKey`/`tz` (no `emailSession`).
- [ ] No ES5 violations in the index.html diff (no `=>`, backticks, `const`/`let`, `async`/`await`, spread, destructuring); worker.js stays ES module style.

### Edge cases & gotchas
- **Single-commit click path**: `handleHabitsClick` must finish each action exactly once. The `edit` branch `return`s without saving (it only opens the panel); `toggle` mutates then falls to the single trailing `renderHabits();renderHome();save();`. `addHabit` (wired directly to the Add button, not routed through the handler) keeps its own `save()`. Do not add a trailing unconditional `save()` after the action chain returns.
- **Today-not-yet-done streak**: `habitCurrentStreak` must NOT zero a multi-day streak just because today is unchecked before day's end — anchor the walk to today-or-yesterday. Otherwise a live streak reads 0 all day until checked.
- **`done` map vs array merge**: keeping completions as a date-keyed map (not an array) means a synced habit's whole object is replaced on conflict, but no per-day array reconciliation is needed; `mergeById` handles the union-by-id cleanly.
- **Sync conflict (documented, not solved in v1)**: `mergeById` is per-habit whole-object union — simultaneous edits to the *same* habit on two devices are last-writer-wins (one device's `done` map overwrites the other's). Distinct habits never conflict. Do not attempt per-day merge in v1.
- **Timezone**: streaks/grids key off the device's local `todayKey()`; the cron nudge keys off the `dateKey` the app computed and synced (and carries `tz`). A device far ahead/behind could see an off-by-one nudge day — acceptable for v1.
- **Async save timing**: `save()` (705) writes localStorage and *schedules* a debounced sync push (2 s, index.html:1288) + reminder sync (1.5 s, 1147); rapid check-offs coalesce into one push — correct. Do not call `syncPush`/`syncReminders` directly.
- **Empty/zero states**: no habits → friendly `.empty` copy; a habit with no completions → "🔥 0 day streak best: 0" and an all-empty grid (`habitLongestStreak` returns 0, never `NaN`/`undefined`).
- **Offline/PWA**: the room works fully offline (pure local state). Only sync + the push nudge need the relay — do **not** gate `renderHabits` on `relayOn()`.
- **Nudge privacy**: the push body is just a count ("3 habits still open today") — no habit names leak into the payload. `countOpenHabits` returns only a number. Keep it that way.

### Effort & dependencies
- **Size**: **M** (Medium). New room + render + streak math + sync opt-in is ~150–200 lines of app JS; the relay change (`countOpenHabits` + one `firePush` branch) is ~25 lines.
- **Must exist first**: nothing hard-blocks it — the sync engine (`SYNC_ARRAYS`/`buildSyncDoc`/`mergeById`) and the push/cron infra (`buildReminders`/`firePush`/`/push/sync`, cron `["* * * * *"]`) already exist. The nudge's usefulness depends on Web Push already being provisioned (VAPID secrets + a real subscription) — existing infra, not new work here.
- **Out of scope / future**: weekly/monthly cadences (this is daily-only), per-habit reminder times, habit categories/areas, charts/analytics beyond the 7-day grid, AI habit-coaching text, per-day merge resolution for concurrent same-habit edits, and surfacing habits inside the morning Brief. Explicitly deferred.

---

## 6. 📥 Link Stash + AI TL;DR

### Mission
A new **Link Stash** room where Kevin pastes a URL, the relay fetches the page and Gemini returns a 3-line TL;DR plus a title and 2–5 suggested tags. The saved item (title, url, summary, tags, ts) syncs across devices, is searchable/filterable by tag or text, and each row links out to the original. Fetch failures (paywall/blocked/offline) degrade to a manual-summary fallback so a link is never lost.

### Why it matters
Turns a graveyard of "read later" tabs into a searchable, AI-summarized library that follows Kevin across every device.

### User flow
1. Kevin taps the **Stash** tab in `#nav` → the Link Stash room opens (`go("stash")` → `renderStash()`).
2. He pastes a URL into the add-row input and taps **Stash it** (or presses Enter).
3. A pending row appears immediately showing the raw URL and a "summarizing…" spinner; the app POSTs the URL to the relay `/summarize` route.
4. The relay fetches the page, strips it to text, and Gemini returns `{ok, title, summary, tags}`. On resolve the row is replaced with the finished card: title (linked to the original), a 3-line summary, tag chips, and the saved timestamp.
5. If the fetch fails (paywall/blocked/4xx/5xx/timeout), the relay returns `{ok:false, error, title}` (title derived from the URL). The app keeps the item, shows a "Couldn't read this page" note plus an editable **manual summary** textarea and a **Save note** button so Kevin can summarize it himself.
6. Kevin types in the **search box** at the top of the room (or taps a **tag chip**) to filter the list by free text (title/url/summary/tags) or by an exact tag. Clearing the box restores the full list.
7. Tapping a card's title or **Open** opens the original URL in a new tab; tapping **Delete** removes it (with the standard delete affordance). All changes sync.

### Data model
- New synced collection on the global `state` literal (index.html:689): add `stash:[]`. Insert it alongside the existing array fields (e.g. after `notes:[]`) inside the literal that begins `var state={items:[],events:[],...}`.
  - Each item shape: `{id, url, title, summary, tags:[], ts, status, manual}` where `status` is one of `"pending" | "done" | "failed"` and `manual` is a boolean (true once Kevin saves his own summary). `tags` is an array of lowercased strings.
  - `id` from `uid()` (index.html:704); `ts` is `Date.now()`.
- **Sync:** add `"stash"` to `SYNC_ARRAYS` (index.html:1214 — current value is `["items","events","projects","builds","briefs","links","prompts","notes","council","pending"]`) so it merges losslessly by `id` (mirror `links`/`notes`). Do **NOT** add it to `SYNC_SKIP` (index.html:1201 — `{github:1,relay:1,push:1,sync:1,email:1,brief:1,weekly:1,v:1}`) — the stash library is meant to follow Kevin across devices. Adding `"stash"` to `SYNC_ARRAYS` is sufficient: `buildSyncDoc` (1213) auto-includes every non-`SYNC_SKIP` `state` key, `applySyncDoc` (1217) full-replaces it on a clean pull, and `mergeRemoteDoc` (1236) union-merges it by `id` via `mergeById` (1225) on a stale push. No per-field scalar branch is needed (that is only for scalars like `lastBackupAt`/`lastShutdown` — `stash` is an id-keyed array).
- **Bootstrap restore — TWO loops, update BOTH.** There are two distinct restore paths in `index.html` and `stash` must be added to each or it will silently fail to restore on one of them:
  1. **Live-load bootstrap** (`store.load().then(...)`, the per-field block at index.html:2786–2796, each line `if(isArr(saved.X))state.X=saved.X;`). Add, mirroring the `links`/`notes` lines:
     ```
     if(isArr(saved.stash))state.stash=saved.stash;
     ```
  2. **JSON-backup import** (the hardcoded array at index.html:2724): `["items","events","projects","builds","briefs","links","prompts","notes","council","pending"].forEach(function(k){if(Array.isArray(saved[k]))state[k]=saved[k];});`. Add `"stash"` to that array literal so a restored backup also brings the stash back:
     ```
     ["items","events","projects","builds","briefs","links","prompts","notes","council","pending","stash"].forEach(function(k){if(Array.isArray(saved[k]))state[k]=saved[k];});
     ```
  (`isArr` is the house helper at index.html:2782 — `function isArr(x){return Object.prototype.toString.call(x)==="[object Array]";}`. Use `isArr` in the per-field block to match the surrounding lines; the backup-import loop already uses `Array.isArray`, so leave that one as `Array.isArray`.)
- **Versioning:** the stash is additive (a missing `state.stash` simply restores to `[]`), so no destructive migration is required. Still bump `state.v` (index.html:2808 — currently `state.v=26;`, NOT the literal `v:5` at line 689, which the load/migrate path overwrites), the footer string `KevinOS v0.XX` (index.html:631 — currently `KevinOS v0.26`), and the SW cache `kevinos-vX_YY` (sw.js:2 — currently `kevinos-v0_26`) per the release ritual — these three move in lock-step on every ship.
- **UI-scratch globals** (NOT persisted, reset on reload — declare near the other scratch vars at index.html:690–700, e.g. next to `taskFilter`/`taskView`): `var stashFilter="";` (current search/free-text filter) and `var stashTag="";` (active tag chip, "" = none). These must NOT be added to the `state` literal and must NOT be synced.
- **D1 synced doc:** the relay `/summarize` route does **not** read or write the synced D1 doc — summarization context is the fetched page text only. The finished item enters the synced doc through the normal app `save()`→`scheduleSyncPush`→`syncPush` path like any other `SYNC_ARRAYS` collection. No relay-side D1/doc change, no `env.SYNC` use, no syncKey passed.

### Relay changes
One new route. Add it inside `fetch` in `worker.js`, placed **right after the `/actions` block (which ends at line 930) and before the `/push/key` block at line 933** — i.e. between lines 930 and 932. It must come before the 404 fall-through (`return json({error:"Not found"}, 404, origin)`, line 1343). This is **not** a pure app feature — fetching arbitrary pages and calling Gemini must happen server-side (no browser CORS to third-party pages, and the API key stays on the worker). The relay is a Cloudflare ES-module Worker and is **exempt** from the ES5 rule — write this route in modern ES (`const`/arrow/`async`-`await`), matching the surrounding worker code.

**`POST /summarize`**
- Request JSON: `{ url }` (a string; the page to summarize).
- Response JSON (success): `{ ok:true, title, summary, tags:[...] }` — `summary` is a 3-line string (newline-separated), `tags` an array of 2–5 lowercased strings.
- Response JSON (failure): `{ ok:false, error, title }` — `error` is a short human string ("Page blocked or paywalled", "Couldn't reach that page", etc.); `title` is a best-effort title derived from the URL host/path so the app can still show something useful.
- Skeleton (modern ES, mirroring the `/actions` block at worker.js:920–930):
  ```js
  if (request.method === "POST" && url.pathname === "/summarize") {
    let payload;
    try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
    const target = (payload && payload.url || "").toString().trim();
    if (!/^https?:\/\//i.test(target)) return json({ ok: false, error: "Not a valid URL", title: "" }, 200, origin);
    if (!env.GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY not set on the relay" }, 500, origin);
    try {
      const out = await summarizePage(env, target);   // returns {ok:true,title,summary,tags} or {ok:false,error,title}
      return json(out, 200, origin);
    } catch (e) {
      return json({ ok: false, error: "Couldn't summarize", title: titleFromUrl(target) }, 200, origin);
    }
  }
  ```
  Note: every non-success outcome below returns **HTTP 200** with `{ok:false,...}`; the only non-200 is the `GEMINI_API_KEY` 500. The 400 "Invalid JSON body" only fires on a malformed request body (matching every other route), never on a bad-but-parseable URL — a bad URL returns 200 `{ok:false}` so the app's manual-fallback path engages cleanly.
- What `summarizePage(env, url)` (a new helper, place it near `extractActions` at worker.js:352) does:
  1. **Fetch the page** with a timeout and a desktop User-Agent:
     ```js
     const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (KevinOS Link Stash)" }, redirect: "follow", signal: AbortSignal.timeout(10000) });
     ```
     On a thrown error/timeout (wrap in try/catch), return `{ok:false, error:"Couldn't reach that page", title:titleFromUrl(url)}`.
  2. On `!res.ok` (4xx/5xx) → `{ok:false, error:"Page blocked or paywalled", title:titleFromUrl(url)}`.
  3. On a non-HTML `content-type` (i.e. `res.headers.get("content-type")` does not include `text/html`) → `{ok:false, error:"Not a readable web page", title:titleFromUrl(url)}` (covers PDFs, images, JSON, etc.).
  4. Read `const html = await res.text();`. Pull a fallback title from the HTML (`<title>...</title>` match, decoded + trimmed) for use if Gemini omits one. Strip to readable text: remove `<script>`/`<style>...</style>` blocks, strip all remaining tags via regex, decode a few common HTML entities (`&amp; &lt; &gt; &quot; &#39; &nbsp;`), collapse whitespace, and `slice(0, 12000)` (token budget — same cap `extractActions` uses at worker.js:361).
  5. **Call Gemini for forced JSON** using the **inline forced-JSON fetch pattern from `extractActions` (worker.js:362–369)** — NOT `callGemini` (which returns plain text). Build the URL `"https://generativelanguage.googleapis.com/v1beta/models/" + (env.GEMINI_MODEL || DEFAULTS.geminiModel) + ":generateContent?key=" + env.GEMINI_API_KEY`, POST `{ contents:[{role:"user", parts:[{text: userPrompt}]}], systemInstruction:{parts:[{text: systemPrompt}]}, generationConfig:{ responseMimeType:"application/json", temperature:0.2 } }`. Parse exactly like worker.js:368–369: `JSON.parse(txt)`, and on throw slice between the first `{` and last `}` and retry `JSON.parse`. (Note: `extractActions` slices on `[`/`]` because it expects an array; this route expects an **object**, so slice on `{`/`}`.) On total parse failure → `{ok:false, error:"Couldn't summarize", title:(htmlTitle || titleFromUrl(url))}`.
  6. **Normalize the parsed object**: `tags` → coerce to array, `map` lowercase+trim, drop empties and any leading `#`, `slice(0,5)`; `summary` → coerce to string, keep at most the first 3 newline-separated lines, cap to ~400 chars; `title` → use parsed `title` if non-empty, else the HTML `<title>`, else `titleFromUrl(url)`, cap ~90 chars. Return `{ok:true, title, summary, tags}`.
- **`titleFromUrl(u)` helper** (new, alongside `summarizePage`): parse with `new URL(u)`, take the host plus the last non-empty path segment, replace `-`/`_` with spaces, strip a trailing file extension, title-case-ish, and trim to ~90 chars; on any throw return the raw `u`. This guarantees a usable title on every failure path.
- **System prompt** (pass as `systemInstruction.parts[].text`):
  > You are a precise reading assistant. You are given the extracted text of a web page. Produce a strict JSON object describing it. Be factual and concise; never invent facts that are not in the text. Output ONLY the JSON object, no markdown, no preamble.
- **User prompt** (the `contents[0].parts[0].text`):
  > Summarize this web page. Return ONLY a JSON object with exactly these keys:
  > "title": a short plain-text title for the page (max 90 chars),
  > "summary": a 3-line TL;DR — exactly three short lines separated by newline characters, each line a single clear sentence, no bullets or numbering,
  > "tags": an array of 2 to 5 lowercase one-or-two-word topic tags (no "#").
  >
  > URL: \<url\>
  >
  > PAGE TEXT:
  > \<extracted text, sliced\>
- **Error/fallback behavior (summary):** any fetch error, non-HTML content-type, non-OK status, Gemini throw, empty text, or JSON-parse failure returns `{ok:false}` with a URL-derived `title` and an `error` string, always HTTP 200 so the app shows the manual-summary fallback rather than a hard error. Missing `GEMINI_API_KEY` is the only 500; malformed request JSON is the only 400.
- **Capability advertise (optional):** add `summarize: !!env.GEMINI_API_KEY` to the `GET /` health object (worker.js:849 — the object currently ends `..., extract: !!env.GEMINI_API_KEY, email: !!env.GOOGLE_CLIENT_ID }`).
- **Env/secret/scope:** reuses the existing `GEMINI_API_KEY` secret and `env.GEMINI_MODEL` var (default `DEFAULTS.geminiModel` = `"gemini-2.5-flash"`). No new secret, no new binding (no `SYNC`/`PUSH` use), no new OAuth scope.

### App changes (index.html, ES5)
Follow the **Recipe: add a brand-new room** (playbook §7) with room key `stash`. Every JS edit below is **ES5** (see ES5 compliance section).

**1. Static DOM — tab button** (in `#nav`, lines 393–409, mirror an existing `<button class="tab" type="button" data-room="...">`). The `#nav` click delegate at index.html:2400 already routes any `data-room` to `go(...)`, so no wiring change is needed for the tab itself:
```
<button class="tab" type="button" data-room="stash">Stash</button>
```

**2. Static DOM — room container** (a sibling of the other `<div class="room" id="room-...">` blocks; add it after `#room-notes` at 612 / before `</main>`; model the layout on `#room-prompts`, 602–610, which uses `.add-row`, `.search-inp`, `.filter-row`, and an `.elist` mount). Reuse those existing classes so it inherits styling:
```
<div class="room" id="room-stash">
  <div class="sec-head"><p class="section-label">Stash a link</p></div>
  <div class="add-row"><input id="stashUrl" class="capture-input" type="url" placeholder="Paste a link to stash…" autocomplete="off" aria-label="Paste a link" /><button id="stashAddBtn" class="add-btn" type="button">Stash it</button></div>
  <hr class="surface-line" />
  <input id="stashSearch" class="search-inp" type="text" placeholder="Search your stash…" autocomplete="off" aria-label="Search stash" />
  <div class="filter-row" id="stashTags"></div>
  <div class="elist" id="stashList"></div>
</div>
```

**3. State + scratch vars:** add `stash:[]` to the `state` literal (689); declare `var stashFilter="";` and `var stashTag="";` near 690–700; add the bootstrap restore line to BOTH restore paths (see Data model — line 2724 backup-import array AND line 2786–2796 per-field block).

**4. Sync opt-in:** add `"stash"` to `SYNC_ARRAYS` (1214).

**5. New helper functions** (place near the other room renderers, ~720–2100; mirror the `links`/`prompts` add/list patterns and `generateBrief` at 969 for the relay-call shape). All callbacks are `function(...){}`, never arrows:
- `function addStash(){ ... }` — read `$("stashUrl").value`, trim into `var u`; if empty, `return;`. Build `var id=uid();` then `state.stash.unshift({id:id, url:u, title:u, summary:"", tags:[], ts:Date.now(), status:"pending", manual:false});`. Clear the input (`$("stashUrl").value="";`), then `renderStash(); save();` (the `save()` ensures a refresh mid-summarize keeps the link and schedules a push), then call `summarizeStash(id);`.
- `function summarizeStash(id){ ... }` — `var base=relayBase(); ` then find the item via a `for` loop or filter (`var it=null,i; for(i=0;i<state.stash.length;i++){if(state.stash[i].id===id){it=state.stash[i];break;}} if(!it)return;`). If `!base`, set `it.status="failed"; persist(); renderStash(); return;`. Otherwise `fetch(base+"/summarize",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:it.url})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ it.title=j.title||it.url; it.summary=j.summary||""; it.tags=isArr(j.tags)?j.tags:[]; it.status="done"; } else { it.title=(j&&j.title)||it.url; it.status="failed"; } persist(); renderStash(); }).catch(function(){ it.status="failed"; persist(); renderStash(); });`. **Use `persist()` here, not `save()`** (mirror `generateBrief` at 969, which uses `persist()` for the AI fill) — the AI write shouldn't trigger a redundant cross-device push; the initial `addStash` already did a `save()` that scheduled the push, and the user's manual edits below go through `save()`.
- `function saveStashManual(id){ ... }` — find the item; read the manual textarea value. The textarea lives inside the stash row (not an `.edit-panel`), so look it up by id off the clicked row rather than via `pf(...)`: give the textarea a stable id like `id="stashNote-"+id` in the render, then read `var ta=$("stashNote-"+id); if(!ta)return; var val=(ta.value||"").trim();`. Set `it.summary=val; it.manual=true; it.status="done";` then `renderStash(); save();` (manual edit DOES sync).
- `function deleteStash(id){ ... }` — `state.stash=state.stash.filter(function(x){return x.id!==id;}); renderStash(); save();`.
- `function stashTagsAll(){ ... }` — return a sorted unique array of every tag across `state.stash` (for the filter-chip row): build with a plain object as a set, `for` loops, then `Object.keys(map).sort()`.
- `function stashMatches(it){ ... }` — return `true` if the item passes BOTH the current `stashTag` (exact membership: `!stashTag || (isArr(it.tags) && it.tags.indexOf(stashTag)!==-1)`) AND `stashFilter` (case-insensitive substring across `it.title+" "+it.url+" "+it.summary+" "+(isArr(it.tags)?it.tags.join(" "):"")`, lowercased, `indexOf(stashFilter.toLowerCase())!==-1`; empty `stashFilter` matches everything).
- `function setStashFilter(v){ stashFilter=v; renderStash(); }`. Tag-chip toggling is handled inline in the wire-up listener (see step 9), not in a separate fn.

**6. Render function** `function renderStash(){ ... }` (mirror `renderLinks`/`renderPrompts` and the `makeTaskRow` createElement row-build at ~780):
- **Tag-chip row** into `$("stashTags")`: clear it, then for each tag from `stashTagsAll()` append a `<button class="chip" type="button" data-stashtag="TAG">TAG</button>`; the chip whose tag equals `stashTag` also gets the `active` class (mirror the active-chip treatment used by `buildFilterChips`/`optChips` at ~1934). If `stashTagsAll()` is empty, leave the row empty.
- Clear `$("stashList")` (`var box=$("stashList"); box.innerHTML="";`). Compute `var rows=state.stash.filter(function(x){return stashMatches(x);});`.
- **Empty states (two distinct):**
  - If `state.stash.length===0`: `box.innerHTML='<p class="empty">Nothing stashed yet. Paste a link above.</p>';` (mirror index.html:814).
  - Else if `rows.length===0` (a filter/tag is active but matches nothing): `box.innerHTML='<p class="empty">No matches. Clear the search or tag.</p>';`
  - Else build a row per item in `rows`.
- **Per-item row** (build via `document.createElement` like `makeTaskRow`, class `.stash-card`):
  - `status==="pending"` → title shows the raw `url` (escaped) + `<span class="cq-prov">summarizing…</span>` (reuse the existing `.cq-prov` class as `briefCardHTML` does at index.html:963), plus an **Open**/**Delete** affordance.
  - `status==="done"` → linked title `<a href="URL" target="_blank" rel="noopener">TITLE</a>`, a 3-line summary block (escape `summary`, convert `\n`→`<br>` AFTER escaping), tag chips, an **Open** link, and a **Delete** button (`data-stashact="del" data-id="ID"`).
  - `status==="failed"` → URL-derived/escaped title, a serif-italic note "Couldn't read this page — summarize it yourself:", a `<textarea id="stashNote-ID">` prefilled with any existing `summary` (escaped), a **Save note** button (`data-stashact="savemanual" data-id="ID"`), plus **Open**/**Delete**.
- **Open** is a plain `<a href="URL" target="_blank" rel="noopener">Open</a>` — no `data-stashact`, no handler. **Delete** and **Save note** carry `data-stashact` + `data-id`.
- **Always `escapeHtml(...)`** (index.html:729) on `title`, `url`, `summary`, and each tag before injecting into `innerHTML` — the title/summary/tags originate from arbitrary web pages and are attacker-controlled. When building the summary's `<br>`s, escape first then replace `\n`, never the reverse.

**7. Dispatch in `go(r)`** (2354–2373): (a) add `"stash"` to the room-div activation array at 2359 (the `["home","next","tasks",...,"email"]` list); (b) add `else if(r==="stash")renderStash();` into the render dispatch chain (2360–2371).

**8. Sync re-render:** add `else if(room==="stash")renderStash();` into `syncRerender()` (index.html:1241–1254, the chain that maps the current `room` to its render fn) so an incoming sync repaints the open Stash room. Place it before the trailing `renderSync();` at 1253.

**9. Wire-up** (in the `/* ---------- wire up ---------- */` block, 2391+; the `#nav` delegate at 2400 already routes the `stash` tab to `go("stash")` — no change there). Add:
- `$("stashAddBtn").addEventListener("click",addStash);`
- `$("stashUrl").addEventListener("keydown",function(e){ if(e.key==="Enter")addStash(); });` (mirror existing Enter-to-add inputs).
- `$("stashSearch").addEventListener("input",function(e){ setStashFilter(e.target.value); });`
- `$("stashTags").addEventListener("click",function(e){ var t=e.target.closest("[data-stashtag]"); if(!t)return; var tag=t.getAttribute("data-stashtag"); stashTag=(stashTag===tag?"":tag); renderStash(); });`
- `$("stashList").addEventListener("click",handleStashClick);`

**10. Click handler** `function handleStashClick(e){ ... }` (mirror `handleEmailClick` index.html:2684 / `handleTaskListClick` 865 — one delegated listener walking `closest`):
```
function handleStashClick(e){
  var b=e.target.closest("[data-stashact]"); if(!b)return;
  var act=b.getAttribute("data-stashact"), id=b.getAttribute("data-id");
  if(act==="del") deleteStash(id);
  else if(act==="savemanual") saveStashManual(id);
}
```
(The **Open** affordance is a plain `<a target="_blank" rel="noopener">`, so it has no `data-stashact` and is intentionally not handled here — the browser navigates natively.)

### ES5 compliance
- **No template literals** — build every HTML string with `"..."+var+"..."` concatenation (mirror `briefCardHTML` at index.html:961–967).
- **No arrow functions** — every `fetch().then(...)`/`filter`/`forEach`/`map` callback is `function(x){ ... }`. The relay's `extractActions` exemplar uses arrows because the Worker is exempt; the app must NOT.
- **No `const`/`let`** — only `var`. No destructuring, no spread, no `async`/`await` — use `.then()/.catch()` Promise chains exactly like `generateBrief` (969) / `loadThreads`.
- Use the house array guard **`isArr(...)`** (index.html:2782) in the per-field bootstrap-restore block (matching the `links`/`notes` lines at 2786–2796). The separate JSON-backup-import loop at 2724 already uses `Array.isArray` — leave that loop as-is and just add `"stash"` to its key array.
- Self-check the app diff for `=>`, `` ` ``, `const `, `let `, `async`, `await`, `...` before saving. (These are EXPECTED in the `worker.js` diff — the Worker is exempt — so scope the self-check to `index.html` only.)
- **Feature-detect optional APIs:** `AbortSignal.timeout` is used only in `worker.js` (exempt, runs on the Cloudflare runtime which supports it) — NOT in the app. The app introduces no new browser API here (only `fetch`, already used everywhere), so no app-side feature-detection is needed. No Web Speech / clipboard APIs are used by this feature.

### Styling
Reuse the existing palette and card patterns (CLAUDE §7) — do **not** invent new colors; reference the `:root` CSS variables, never hardcode hex. Add new rules into the single `<style>` block (index.html:13–~385), next to the related room/card rules.
- The room reuses `.add-row` + `.add-btn` + `.capture-input` (already styled) for the URL input and button, and `.search-inp` + `.filter-row` + `.elist` (already styled, from the Prompts room) for the search box, tag-chip row, and list. Reusing these means most layout is already covered.
- `#stashTags` is a `.filter-row` of `.chip` pills (existing pill-filter style, `border-radius:999px`); the active chip gets the existing `.chip.active` treatment (filled `--accent-soft` / `--accent` text). No new chip CSS needed if you reuse `.chip`/`.chip.active`.
- Each stash card — new class `.stash-card`: the standard card surface — `background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); padding:14px; margin-bottom:10px;` plus the hover lift (`transition:transform .14s ease, box-shadow .16s ease;` and `.stash-card:hover{transform:translateY(-1px);box-shadow:var(--shadow);}`).
- Title link: `font-family:var(--font-display); color:var(--accent); font-weight:600; text-decoration:none;`.
- Summary block: `color:var(--ink-soft); font-size:14px; line-height:1.5;`.
- Tag chips inside a card: small `--accent-soft` pills, `font-size:11px; letter-spacing:.04em;`.
- Failed-state note: serif italic `--ink-faint` (reuse `.empty` styling); the manual `<textarea>` should inherit the `.search-inp` / text-input look — `background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:8px 12px; width:100%; font-family:var(--font-ui); color:var(--ink);` with `margin:6px 0`.
- Pending spinner text: reuse the existing `.cq-prov` class (index.html:304) as `briefCardHTML` does — no new rule.

### Verification
1. **Relay syntax:** `node --check /Users/kevin/KevinOS/app/relay/worker.js` → PASS = no output, exit 0.
2. **App syntax sanity (ES5 self-check):** from the app dir, grep your `index.html` diff/region for ES6 tokens — `LC_ALL=C grep -nE '=>|\`|const |let |async |await |\.\.\.' /Users/kevin/KevinOS/app/index.html` should not surface anything inside your new `stash` functions (pre-existing matches elsewhere in the file are fine; the file already contains some in strings/comments — only your new code must be clean).
3. **Deploy relay** (only when shipping): `cd /Users/kevin/KevinOS/app/relay && npx wrangler deploy`.
4. **Curl the new route (success path):**
   ```sh
   curl -sS -X POST https://kevinos-relay.kevinbigham.workers.dev/summarize \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com"}'
   ```
   PASS = JSON `{"ok":true,"title":"...","summary":"...\n...\n...","tags":["..."]}` with a 3-line summary (two `\n`s) and 2–5 tags. (`https://example.com` is a real, fetchable HTML page, so this exercises the full fetch→Gemini→JSON path.)
5. **Curl the failure path (blocked URL):**
   ```sh
   curl -sS -i -X POST https://kevinos-relay.kevinbigham.workers.dev/summarize \
     -H "Content-Type: application/json" \
     -d '{"url":"https://httpstat.us/403"}'
   ```
   PASS = `HTTP/2 200` with body `{"ok":false,"error":"...","title":"..."}` (a URL-derived title, never a hard 500). (`-i` prints the status line so you can confirm the 200.)
6. **Curl invalid URL (parseable body, bad URL):**
   ```sh
   curl -sS -i -X POST https://kevinos-relay.kevinbigham.workers.dev/summarize \
     -H "Content-Type: application/json" -d '{"url":""}'
   ```
   PASS = `HTTP/2 200` with `{"ok":false,"error":"Not a valid URL","title":""}`.
7. **Curl malformed body (the only 400):**
   ```sh
   curl -sS -i -X POST https://kevinos-relay.kevinbigham.workers.dev/summarize \
     -H "Content-Type: application/json" -d 'not json'
   ```
   PASS = `HTTP/2 400` with `{"error":"Invalid JSON body"}`.
8. **Health probe:** `curl -sS https://kevinos-relay.kevinbigham.workers.dev/` → PASS = the JSON now includes `"summarize":true` (alongside the existing `extract`, `email`, etc. booleans).
9. **App preview** (serve `app/` locally and open in a browser):
   ```sh
   cd /Users/kevin/KevinOS/app && python3 -m http.server 8000
   ```
   then open `http://localhost:8000/`. (Connect the relay first via Next → Connect AI, pasting `https://kevinos-relay.kevinbigham.workers.dev`, so `relayOn()` is true.)
   - Click the **Stash** tab → empty state "Nothing stashed yet." shows; no console errors.
   - Paste `https://example.com`, tap **Stash it** (or press Enter) → a pending row with "summarizing…" appears, then resolves to a titled card with a 3-line summary and tag chips.
   - Type in the search box → list filters live; clear → full list returns; a no-match query shows the distinct "No matches" empty.
   - Tap a tag chip → list filters to that tag and the chip shows `active`; tap again → clears.
   - Tap **Open** → original opens in a new tab. Tap **Delete** → row disappears.
   - Temporarily blank/break the relay URL (or stash a known-blocked URL) → failed state shows the manual textarea; type + **Save note** → card flips to a normal summary card.
   - Reload the page → stashed items persist (localStorage). PASS = all the above behave as described with no console errors.

### Acceptance criteria
- [ ] `node --check relay/worker.js` passes.
- [ ] `POST /summarize` returns `{ok:true,title,summary,tags}` with a 3-line summary and 2–5 lowercase tags for a fetchable HTML page.
- [ ] `POST /summarize` returns **HTTP 200** `{ok:false,error,title}` (never 500) for blocked/paywalled/unreachable/non-HTML URLs and for an empty/invalid `url`; the only 400 is a malformed request body; the only 500 is a missing `GEMINI_API_KEY`.
- [ ] `GET /` advertises `summarize:true` when `GEMINI_API_KEY` is set.
- [ ] A **Stash** tab appears in `#nav` and opens `#room-stash` via `go("stash")`.
- [ ] Pasting a URL creates a pending row, then resolves to a card with linked title, 3-line summary, and tag chips.
- [ ] Failed summaries show a manual-summary textarea + **Save note** that converts the row to a finished card.
- [ ] Search box filters by free text; tag chips filter by exact tag; both clear correctly; a no-match filter shows a distinct "No matches" empty (separate from the empty-library empty).
- [ ] `state.stash` persists across reload (both the live-load block AND the JSON-backup-import loop restore it) and is included in `SYNC_ARRAYS` (merges by `id`, NOT in `SYNC_SKIP`).
- [ ] `summarizeStash` uses `persist()` (no extra push) for the AI fill; `addStash`, `saveStashManual`, and `deleteStash` use `save()` (sync).
- [ ] No ES5 violations in the app diff (no `=>`, `` ` ``, `const`, `let`, `async`, `await`, `...` in the new `index.html` code); the `worker.js` diff may use modern ES (exempt).
- [ ] `state.v` (index.html:2808), footer string (index.html:631), and SW cache version (sw.js:2) all bumped in lock-step.

### Edge cases & gotchas
- **Async save timing:** `addStash` does `save()` immediately (committing the pending item) so a refresh mid-summarize keeps the link; `summarizeStash` finishes with `persist()` (local write, no extra push) to avoid a redundant cross-device push for the AI fill — but the user's manual **Save note** and **Delete** use `save()` so they DO sync.
- **Two restore loops:** `state.stash` must be added to BOTH the per-field live-load block (2786–2796, `isArr`) AND the hardcoded JSON-backup-import key array (2724, `Array.isArray`). Updating only one means restore silently fails on the other path.
- **Pending items in the sync doc:** a `status:"pending"` item can sync to another device before summarization completes. That device shows it as "summarizing…" indefinitely (it won't auto-retry — only the originating device runs `summarizeStash`). Acceptable for v1; an optional "Retry" affordance on stale pending items is OUT OF SCOPE for v1.
- **Offline / PWA:** with no network, `summarizeStash`'s `relayBase()` may still be set but `fetch` rejects → `.catch` sets `status:"failed"` → manual fallback path. The item is never lost. The room renders entirely from local `state`, so it works offline.
- **Sync conflicts:** `stash` merges by `id` via `mergeById`; two devices stashing different links both survive. If the same `id` is edited on two devices (rare — `id`s are random `uid()`), the remote/cloud copy wins per the existing `mergeById` rule. No special handling needed.
- **Empty states:** show "Nothing stashed yet" when `state.stash` is empty; show a distinct "No matches" when a filter/tag yields zero rows (so the user knows it's a filter, not an empty library).
- **Privacy / attacker-controlled content:** the page title/summary/tags come from arbitrary web pages — **always `escapeHtml`** before injecting into `innerHTML`, and escape BEFORE converting `\n`→`<br>` in the summary. The relay caps page text at ~12000 chars to bound token cost. Don't log fetched page bodies.
- **Duplicate URLs:** v1 allows duplicates (each stash is its own item). Dedup is OUT OF SCOPE.
- **Non-HTML URLs (PDF/image/JSON):** the relay detects a non-`text/html` content-type and returns `{ok:false}` with a URL-derived title → manual fallback. (Multimodal PDF summarization could later reuse `/extract`'s pattern — OUT OF SCOPE.)
- **Worker is exempt from ES5:** write `/summarize` and its helpers in modern ES to match the surrounding `worker.js`; do NOT downgrade them to ES5. Conversely, do NOT let any modern syntax leak into the `index.html` code.

### Effort & dependencies
- **Size:** **M** (one new relay route with page-fetch + forced-JSON Gemini + a `titleFromUrl` helper; one new app room with add/list/search/filter/manual-fallback wiring, plus the two-loop restore).
- **Must exist first:** the relay must be deployed with `GEMINI_API_KEY` set (already true — same secret used by `/brief`, `/actions`, `/extract`). Cross-device sync (D1), `relayBase()` (index.html:1107), `relayOn()`, `uid()` (704), `isArr()` (2782), `escapeHtml()` (729), `save()`/`persist()` (705/706) all already exist; no dependency on other numbered features.
- **Out of scope / future:** auto-retry of stale pending items; URL dedup; multimodal PDF/image summarization; per-tag color coding; bulk import of a bookmarks file; "read it now" reader-mode view; pushing a daily "unread stash" digest via cron (could later reuse the `gen:`/`firePush` pattern).

---

## 7. 🧭 People Radar (mini-CRM)

### Mission
A lightweight CRM room where Kevin tracks the people he wants to stay in touch with, each with a contact cadence (e.g. every 2 weeks). The room surfaces who is overdue to contact, offers a one-tap "Mark contacted" action, and — when the relay/Gmail is connected — can auto-fill each person's last-contact date from their most recent Gmail thread. Done looks like: a "People" tab listing contacts grouped into Overdue / Due soon / OK, with overdue people nudged on Home and pushed via cron on a weekly cadence.

### Why it matters
Relationships decay silently; a cadence-driven nudge turns "I should call them sometime" into a concrete, dated action that surfaces itself.

### User flow
1. Kevin taps the new **People** tab in the nav.
2. The room shows an add-row ("Name", optional "Email", a cadence picker: Weekly / Every 2 weeks / Monthly / Quarterly) and his list of people grouped **Overdue · Due soon · OK**. First run shows a serif-italic empty state.
3. He types "Mom", picks "Every 2 weeks", taps **Add**. She appears under "Due soon" (no last-contact yet → `personDue` returns today → status "due").
4. He taps a person to expand an edit panel: change name, email, cadence, manually set/clear last-contact date, add a birthday, add a note, delete.
5. He just called Mom → taps **✓ Contacted**. Her `lastContact` becomes today; she drops to the bottom of "OK"; the next nudge is scheduled cadence-days out.
6. If the relay + Gmail are connected, an **Enrich from Gmail** button on the room calls the relay, which finds the most recent Gmail thread for each person's email (across all connected accounts) and back-fills `lastContact` (only when it is strictly newer than the stored value). Birthdays are manual-only in v1 (Calendar enrichment is documented as future).
7. Overdue people surface on **Home** as a nudge card ("3 people overdue to reach out"); a weekly Sunday push lists who is overdue.

### Data model
Add one new synced collection plus a small device-local config object to the `state` literal at **index.html:689**.

- `people: []` — synced id-keyed array. Each person object:
  ```
  { id: uid(), name:"", email:"", cadence:14, lastContact:"", birthday:"", note:"", createdAt: Date.now() }
  ```
  - `cadence` is an integer **number of days** (7 / 14 / 30 / 90). `lastContact` and `birthday` are `"YYYY-MM-DD"` date-key strings (the format produced by `dateKey()`/`todayKey()`, and exactly the value an `<input type="date">` `.value` yields), or `""`. `email` is lowercased, may be `""` (manual-only person).
  - **Synced:** add `"people"` to `SYNC_ARRAYS` (**index.html:1214**), so the literal becomes:
    ```js
    var SYNC_ARRAYS=["items","events","projects","builds","briefs","links","prompts","notes","council","pending","people"];
    ```
    It auto-merges by `.id` via `mergeById` (full-replace on a clean pull through `applySyncDoc`'s `SYNC_ARRAYS.forEach` loop at index.html:1217; union-by-id on a stale push through `mergeRemoteDoc`'s loop at index.html:1236). Do **NOT** add it to `SYNC_SKIP`. The objects already carry a unique `.id` from `uid()`, which is the merge key — satisfied.
- `peopleCfg: { lastEnrichAt: 0 }` — device-local enrichment timestamp. Add `peopleCfg:1` to `SYNC_SKIP` (**index.html:1201**), so the literal becomes:
  ```js
  var SYNC_SKIP={github:1,relay:1,push:1,sync:1,email:1,brief:1,weekly:1,v:1,peopleCfg:1};
  ```
  This keeps it out of `buildSyncDoc` (index.html:1213, which copies every own-enumerable `state` key except those in `SYNC_SKIP`). Rationale: `lastEnrichAt` is a per-device, ephemeral "when did THIS device last hit Gmail" marker, not shared data — same class as the other connection/credential keys already in `SYNC_SKIP`.
- **State literal edit (index.html:689):** add both keys. Insert `people:[]` next to the other arrays and `peopleCfg:{lastEnrichAt:0}` next to the other config objects, e.g. `...notes:[],pending:[],people:[],...email:{session:"",accounts:[],active:""},peopleCfg:{lastEnrichAt:0},brief:...`.
- **Bootstrap restore** (index.html `store.load().then(...)` block, restore guards run **2786–2804**, before `state.v=26` at 2808): add two guarded restores mirroring the existing `items`/`notes` branches:
  ```js
  if(isArr(saved.people))state.people=saved.people;
  if(saved.peopleCfg&&typeof saved.peopleCfg==="object")state.peopleCfg=saved.peopleCfg;
  ```
  `isArr` is defined at index.html:2782. Place these inside the `if(saved&&typeof saved==="object"){...}` block (which closes at 2805). The trailing `save()` at 2811 (NOT `persist()`) already runs after restore — no change there.
- **Versioning** (Rules §4 — move in lock-step): bump `state.v` from `26` to `27` at **index.html:2808** (`state.v=27;`), the footer string `KevinOS v0.26` → `KevinOS v0.27` at **index.html:631**, and the SW cache `var CACHE = "kevinos-v0_26";` → `"kevinos-v0_27";` at **sw.js:2**. No destructive migration is needed: `people`/`peopleCfg` simply default from the `state` literal for existing users, and the bootstrap restore guards handle their absence in older saved blobs. Do NOT add a `prevV<` migration call — there is nothing to seed (`seedDefaults`/`seedPrompts` at 2806–2807 are unrelated).
- **Synced D1 doc:** because `people` is in `SYNC_ARRAYS` and NOT in `SYNC_SKIP`, `buildSyncDoc` (index.html:1213) includes it automatically and it is written to the D1 `docs.doc` JSON by `syncPush`. The relay's weekly-overdue push reads it server-side via the existing `env.SYNC.prepare("SELECT doc FROM docs WHERE id = ?")` pattern (worker.js:711). **No D1 schema change.**

### Relay changes
Two changes, both in `/Users/kevin/KevinOS/app/relay/worker.js` (modern ES module — exempt from the ES5 rule; use `const`/arrow/`async`-`await` to match the file).

**1. New route: `POST /people/enrich`** — Gmail last-contact lookup. Add the guard block immediately after the `/google/send` block (which ends at **worker.js:1325**) and before the `/google/logout` block (1328) / the 404 fall-through `return json({ error: "Not found" }, 404, origin);` at **1343**.

- **Request JSON:**
  ```json
  { "session": "<gml session>", "people": [ { "id":"p1", "email":"mom@x.com" } ] }
  ```
- **Response JSON:**
  ```json
  { "ok": true, "results": [ { "id":"p1", "email":"mom@x.com", "lastContact":"2026-06-20", "found": true } ] }
  ```
  `lastContact` is `""` and `found:false` when no thread matches, the address is empty, or that person's lookup throws.
- **What it does (exact, mirroring existing helpers):**
  1. `if (!env.PUSH) return json({ error: "Email not configured" }, 500, origin);` (mirror `/google/send` line 1308).
  2. Parse body: `let payload; try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }`
  3. `const rec = await gmailGetRec(env, payload && payload.session);` — **`gmailGetRec` (worker.js:570) returns `null`, it does not throw or return a 401.** So you must check it yourself: `if (!rec || !rec.accounts || !rec.accounts.length) return json({ error: "not connected" }, 401, origin);` Use the **lowercase** `"not connected"` string to match the existing `/google/send` 401 at worker.js:1312 (the codebase uses lowercase here; do not capitalize).
  4. `const people = Array.isArray(payload.people) ? payload.people : [];`
  5. For each connected account, get a token once and reuse it across all people: loop `for (const acct of rec.accounts) { let token; try { token = await gmailAccessToken(env, acct); } catch (e) { continue; } ... }`. `gmailAccessToken` (worker.js:582) returns the cached `acct.access` if still valid, else refreshes via `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`acct.refresh` and mutates `acct.access`/`acct.exp` in place.
  6. For each person with a non-empty `email` (lowercased; skip empty), query that account: build the path as a search (note: do NOT add `labelIds=INBOX` — `gmailInbox` uses `labelIds=INBOX` for the inbox view, but here we want any thread, sent or received):
     ```js
     const q = "from:" + email + " OR to:" + email;
     const lr = await gmailApi(token, "/messages?q=" + encodeURIComponent(q) + "&maxResults=1");
     ```
     `gmailApi(token, path, init)` (worker.js:618) is the bearer-auth fetch wrapper over `https://gmail.googleapis.com/gmail/v1/users/me<path>`.
  7. `const lj = await lr.json(); if (!lr.ok) continue;` then take `lj.messages && lj.messages[0] && lj.messages[0].id`. If none, this person stays `found:false` for this account.
  8. Fetch that message's date (reuse the metadata pattern from `gmailInbox`, worker.js:643): `gmailApi(token, "/messages/" + id + "?format=metadata&metadataHeaders=Date")`, read `mj.payload.headers` via `gmailHeader(headers,"Date")` (worker.js:604), compute `const ts = Date.parse(dateStr) || (Number(mj.internalDate) || 0);` (same fallback as gmailInbox line 648).
  9. Convert `ts` → a `"YYYY-MM-DD"` key in **UTC** so it lines up with how the app stores keys and how `addDaysKey` parses them on the server (worker.js:738 parses with `Date.UTC`):
     ```js
     const d = new Date(ts);
     const key = d.getUTCFullYear() + "-" + String(d.getUTCMonth()+1).padStart(2,"0") + "-" + String(d.getUTCDate()).padStart(2,"0");
     ```
  10. **Keep the newest key across all accounts** for each person (a contact may email both Kevin's work and personal addresses): track the max date-key per `person.id` (string compare works because keys are zero-padded ISO).
  11. Wrap each per-person lookup in its own `try { ... } catch (e) { /* leave found:false */ }` so one bad address never fails the batch (mirror the per-account `try{}catch(e){}` used in `/google/threads`).
  12. After the loops, persist any refreshed tokens once: `await gmailPutRec(env, payload.session, rec);` (mirror `/google/send` line 1316 and `/google/threads`).
  13. Build `results` as one entry per input person (preserve order and `id`): `{ id, email, lastContact: bestKey || "", found: !!bestKey }`. Return `json({ ok: true, results }, 200, origin);`.
- **Gemini / system prompt:** **None.** This route is pure Gmail metadata querying — no LLM call, no `callGemini`, no system prompt. (Cheaper, faster, and keeps content private.)
- **Error/fallback summary:** invalid JSON → `400 {error:"Invalid JSON body"}`; no/empty session record → `401 {error:"not connected"}`; `!env.PUSH` → `500 {error:"Email not configured"}`; any per-person/per-account failure degrades to `found:false` for that person. As long as the session record is valid, **always** return `{ok:true,results}` even if every lookup failed. All responses go through `json(...)` so CORS headers are attached (worker.js:44).
- **Env/secret/scope:** reuses existing `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` secrets and the existing `gmail.readonly` scope (already in `GOOGLE_SCOPE`, worker.js:558 — `messages.list`/`messages.get` are covered by readonly). **No new scope, no re-consent, no new secret.**
- **Capability advert (optional):** the `GET /` health object is a single `json({ ok:true, service:..., ..., email: !!env.GOOGLE_CLIENT_ID }, 200, origin)` at **worker.js:849**. Add `peopleEnrich: !!env.GOOGLE_CLIENT_ID` as a new key inside that object literal (gate on the same env that the `email` capability uses, since enrichment requires Gmail OAuth).

**2. Cron overdue nudge: `gen:"people"`.** Add a deterministic builder `buildPeopleNudge` near `buildServerBrief` (worker.js:704) and a branch in the `firePush` `gen` chain (the `if (r.gen === ...)` chain at **worker.js:495–509**).

- `async function buildPeopleNudge(env, opts)` — signature/shape mirrors `buildServerBrief`:
  ```js
  async function buildPeopleNudge(env, opts) {
    const fallback = (opts.fallback || "").toString();
    const D = (opts.dateKey || "").toString();
    if (!opts.syncKey || !/^[a-f0-9]{16,128}$/.test(opts.syncKey) || !env.SYNC || !D) return fallback;
    try {
      const row = await env.SYNC.prepare("SELECT doc FROM docs WHERE id = ?").bind(opts.syncKey).first();
      if (!row || !row.doc) return fallback;
      const doc = JSON.parse(row.doc);
      const people = Array.isArray(doc.people) ? doc.people : [];
      const overdue = people.filter((p) => {
        if (!p) return false;
        const due = p.lastContact ? addDaysKey(p.lastContact, Number(p.cadence) || 14) : D; // no contact yet → due today
        return due < D;                                                                      // strictly past due
      });
      if (!overdue.length) return fallback;
      const names = overdue.map((p) => (p.name || "someone").toString());
      const shown = names.slice(0, 4).join(", ");
      const more = names.length > 4 ? ", and " + (names.length - 4) + " more" : "";
      return overdue.length + (overdue.length === 1 ? " person" : " people") + " overdue to reach out: " + shown + more + ".";
    } catch (e) { return fallback; }
  }
  ```
  Reuses `addDaysKey` (worker.js:738) and the same syncKey regex `/^[a-f0-9]{16,128}$/` as `buildServerBrief` (worker.js:709). **No Gemini call** — deterministic string keeps the push cheap and keeps contact names off the LLM.
- In `firePush`, add a branch after the `gen:"weekly"` branch (which ends at worker.js:501), mirroring the `gen:"brief"` shape exactly:
  ```js
  } else if (r.gen === "people") {
    try { body = await buildPeopleNudge(env, { syncKey: r.syncKey, dateKey: r.dateKey, fallback: r.body }); } catch (e) { body = r.body; }
  }
  ```
  (`firePush` already destructures `title`/`body` and calls `sendPush(rec.subscription, { title, body, url: r.url, tag: r.tag }, env, 86400)` at worker.js:511 — no other change needed.)

### App changes (index.html, ES5)
Follow the **"add a brand-new room"** recipe (Playbook §7) plus the brief/email patterns. Room key: **`people`**. List mount id: **`peopleList`**. Add-button id: **`peopleAddBtn`**.

**New module-level UI-scratch vars** (declare alongside the other scratch vars at index.html:690–700, NOT persisted, reset on reload):
- `var peopleEnriching=false;` — busy flag for the Enrich button.
- `var editingPersonId="";` — id of the person whose edit panel is open (mirror `editingId`). Clear it in `go()` alongside the other `editing*` resets at **index.html:2356**.

(Omit any `peopleFilter` var — there is no group filter in v1.)

**Constant table** (declare near the other constant tables, index.html:661–686). Note `selEl(id,opts,sel)` (index.html:734) expects option objects shaped `{key, label}`, so define the cadence table with a `key` for the select and keep the integer day count as the value:
```js
var CADENCES=[{key:"7",label:"Weekly"},{key:"14",label:"Every 2 weeks"},{key:"30",label:"Monthly"},{key:"90",label:"Quarterly"}];
```
Read back as `parseInt(value,10)` when writing `cadence`. (Defining `key` as the string day-count means the `<select>` value IS the cadence — no separate lookup needed on save.)

**New helper functions** (place near the other date/render helpers, ~720–1050):
- `function personDue(p){ return p.lastContact ? addDaysKey(p.lastContact,p.cadence||14) : todayKey(); }` — due date key; **no contact yet → due today** (so a fresh person is "due", never invisible). `addDaysKey` is index.html:711, `todayKey` is index.html:710.
- `function personStatus(p){ var due=personDue(p), today=todayKey(); if(due<today)return "overdue"; if(due<=addDaysKey(today,3))return "due"; return "ok"; }` — string compare on ISO keys. Overdue takes precedence; the `due===today` boundary lands in "due" (not "overdue"), matching the user flow.
- `function cadenceLabel(d){ var i; for(i=0;i<CADENCES.length;i++){ if(parseInt(CADENCES[i].key,10)===d)return CADENCES[i].label; } return d+" days"; }` — ES5 `for`, no arrow.
- `function peopleOverdue(){ var out=[],i; for(i=0;i<state.people.length;i++){ if(personStatus(state.people[i])==="overdue")out.push(state.people[i]); } return out; }` — used by both the room and the Home nudge.
- `function findPerson(id){ var i; for(i=0;i<state.people.length;i++){ if(state.people[i].id===id)return state.people[i]; } return null; }` — mirror `findItem` (index.html:768).
- `function addPerson(){ var nm=($("peopleName").value||"").trim(); if(!nm)return; var em=($("peopleEmail").value||"").trim().toLowerCase(); var cad=parseInt(($("peopleCadence").value||"14"),10)||14; state.people.unshift({id:uid(),name:nm,email:em,cadence:cad,lastContact:"",birthday:"",note:"",createdAt:Date.now()}); $("peopleName").value="";$("peopleEmail").value=""; renderPeople(); save(); }` — mirror the prompt/note add path; `uid()` index.html:704, `save()` index.html:705. (Use whatever ids you give the add-row inputs; `peopleName`/`peopleEmail`/`peopleCadence` shown here.)
- `function markContacted(id){ var p=findPerson(id); if(!p)return; p.lastContact=todayKey(); renderPeople(); renderHome(); save(); toast("Marked contacted ✓"); }` — mirror `handleTaskAction`'s done branch (re-renders Home so the nudge count updates).
- `function enrichPeople(){...}` — guard first: `if(!relayOn()){toast("Connect AI first");return;} if(!emailOn()){toast("Connect Gmail first");return;} if(peopleEnriching)return;`. Build the payload list (skip empty emails): loop `state.people`, push `{id:p.id,email:p.email}` only where `p.email`. If the list is empty, `toast("No emails to look up");return;`. Then `peopleEnriching=true; renderPeople();` and POST `relayBase()+"/people/enrich"` with `{session:state.email.session, people:list}`. Mirror `loadThreads`' fetch/`.then`/`.catch` shape (index.html:2566) **but in ES5** — `function(r){return r.json();}`, not arrows. On resolve: `peopleEnriching=false;` then for each `result` with `found`, find the person via `findPerson(result.id)` and set `p.lastContact=result.lastContact` **only when `result.lastContact>(p.lastContact||"")`** (string compare — never moves a date backward). Track a count of updates. `state.peopleCfg.lastEnrichAt=Date.now(); renderPeople(); save(); toast("Updated last-contact for "+n+" "+(n===1?"person":"people"));`. On `.catch`: `peopleEnriching=false; renderPeople(); toast("Couldn’t reach the relay.");`. (`relayBase` index.html:1107, `relayOn` index.html:1108, `emailOn` index.html:2467.)

**Render function** `function renderPeople(){...}` — string-concat into `innerHTML` (this room is string-heavy; mirror `renderNext`). Steps:
1. `var box=$("peopleList"); if(!box)return; box.innerHTML="";`
2. Build a header HTML fragment. Show an **Enrich from Gmail** button only when `relayOn() && emailOn()`: `'<div class="add-row" style="justify-content:flex-end"><button class="btn-soft" type="button" data-people="enrich">'+(peopleEnriching?"Enriching…":"↻ Enrich from Gmail")+'</button></div>'`.
3. If `!state.people.length` → set `box.innerHTML=header+'<p class="empty">No one on your radar yet.</p>';` and return. (`.empty` is the serif-italic state, CSS already in the `<style>` block.)
4. Partition into three arrays via `personStatus`: `overdue`, `due`, `ok` (ES5 `for` loop). Within each bucket, optionally sort by `personDue` ascending (most-overdue first).
5. Emit each non-empty bucket. Build the markup by string-concat (do NOT call `bucketSection` here — `bucketSection(box,name,arr)` at index.html:920 is a DOM-append helper that builds task-style rows from area objects, not people; it won't fit). Use the established bucket header markup: `'<div class="bucket"><p class="bucket-head">OVERDUE <span class="bc">'+overdue.length+'</span></p>'+rowsHtml+'</div>'`. Bucket labels: `OVERDUE` / `DUE SOON` / `OK`.
6. Each person row (a clickable card, `data-people="open" data-id="<id>"`) shows: name (`escapeHtml`), a `.person-meta` line with `cadenceLabel(p.cadence)+" · "+(p.lastContact?"Last: "+prettyDate(p.lastContact):"Never")`, an optional status dot for overdue (`<span class="dot" style="display:inline-block;background:var(--gold)"></span>`), and a **✓ Contacted** button (`<button class="btn-soft" type="button" data-people="contact" data-id="'+p.id+'">✓ Contacted</button>`). `prettyDate` is index.html:725; `escapeHtml` index.html:729. **Escape all user text** (`name`, `email`, `note`).
7. When `editingPersonId===p.id`, append an `edit-panel` block (class `edit-panel` so `pf()` at index.html:703 scopes `#id` lookups to it). Build it as a string with: a name `<input>` (id e.g. `pe-name`), an email `<input>` (`pe-email`), a cadence `<select>` — build via `selEl("pe-cad",CADENCES,String(p.cadence))` then `.outerHTML` (selEl returns a DOM node; either append it or read `.outerHTML` into the string), a last-contact `<input type="date" id="pe-last" value="'+(p.lastContact||"")+'">`, a birthday `<input type="date" id="pe-bday" value="'+(p.birthday||"")+'">`, a note `<input id="pe-note" value="'+escapeHtml(p.note||"")+'">`, and Save/Cancel/Delete buttons matching `editActions` (index.html:735): `data-edit-save="<id>"`, `data-edit-cancel="1"`, `data-edit-delete="<id>"`. (You may call `editActions("edit",p.id)` and append its `.outerHTML`, or hand-write the three buttons — the existing `handleTaskListClick` reads `data-edit-save`/`-cancel`/`-delete` at index.html:866–869, so reuse those exact attribute names.)
8. `box.innerHTML=header+bucketsHtml;`

**Home nudge** — add `function renderPeopleNudge(){...}` returning a card HTML string (or `""`). Show only when `peopleOverdue().length`:
```js
function renderPeopleNudge(){
  var n=peopleOverdue().length; if(!n)return "";
  return '<div class="brief-card" data-goto="people" style="cursor:pointer">⏰ '+n+' '+(n===1?"person":"people")+' overdue to reach out</div>';
}
```
Call it inside `renderHomeNudges` (index.html:1583) where `renderGithubNudge` (index.html:1564) is composed, appending its string. The `data-goto="people"` deep-link is auto-wired at index.html:2401 (`go(this.dataset.goto)`) — no extra listener needed. Reuse the `.brief-card` class (already styled) so no new CSS is required for the nudge.

**Exact hook points:**
1. **Nav button** (inside `#nav`, index.html:392–409): `<button class="tab" type="button" data-room="people">People</button>`. The `#nav` delegate at index.html:2400 routes it to `go("people")` automatically — no wiring change there.
2. **Room container** (add after `#room-notes` closes / before `</main>`, near index.html:612). Mirror `#room-prompts` (602–610):
   ```html
   <div class="room" id="room-people">
     <div class="add-row">
       <input id="peopleName" class="capture-input" type="text" placeholder="Name — e.g. Mom" autocomplete="off" aria-label="Person name" />
       <input id="peopleEmail" class="capture-input" type="email" placeholder="Email (optional)" autocomplete="off" aria-label="Person email" />
       <select id="peopleCadence" class="inp" aria-label="Contact cadence">
         <option value="7">Weekly</option>
         <option value="14" selected>Every 2 weeks</option>
         <option value="30">Monthly</option>
         <option value="90">Quarterly</option>
       </select>
       <button id="peopleAddBtn" class="add-btn" type="button">Add</button>
     </div>
     <div id="peopleList"></div>
   </div>
   ```
3. **`go(r)`** (index.html:2354–2373): (a) add `"people"` to the room-div activation array at **index.html:2359** (e.g. `[..."notes","github","email","people"]`); (b) add `else if(r==="people")renderPeople();` to the dispatch chain (place it among 2360–2371, e.g. after the `email` branch at 2371); (c) add `editingPersonId="";` to the `editing*` reset line at **index.html:2356**.
4. **`syncRerender()`** (index.html:1241–1254): add `else if(room==="people")renderPeople();` before the trailing `renderSync();` (1253), so an incoming sync pull repaints the room while it's open.
5. **Wire-up** (the `/* ---------- wire up ---------- */` block, index.html:2391+): add, alongside the other room listeners (mirror index.html:2407):
   ```js
   $("peopleList").addEventListener("click",handlePeopleClick);
   $("peopleAddBtn").addEventListener("click",addPerson);
   ```
6. **Reminder scheduling** — in `buildReminders()` (index.html:1119–1138), right after the `weekly-`+i loop at **index.html:1134**, add a parallel 4-Sunday loop at 18:00 (one hour after the weekly review so they don't collide):
   ```js
   for(i=0;i<4;i++){var pst=nextDowTime(0,18)+i*7*86400000,pkk=dateKey(new Date(pst));out.push({id:"people-"+i,fireAt:pst,title:"⏰ People to reach out to",body:peopleNudgeBody(pkk),url:url,tag:"kevinos-people",gen:"people",syncKey:sk,dateKey:pkk,tz:tz});}
   ```
   `nextDowTime(dow,hour)` is index.html:1117; `dateKey` is the existing key formatter; `sk` is the sync-key local already computed at index.html:1122 (the people nudge needs `syncKey` for the cron read, but NOT `emailSession` — enrichment is app-only, the cron count is computed purely from the synced `people` array). Add a tiny deterministic body helper near `weeklyBodyShort` (index.html:1004): `function peopleNudgeBody(dk){ var i,n=0; for(i=0;i<state.people.length;i++){var p=state.people[i];var due=p.lastContact?addDaysKey(p.lastContact,p.cadence||14):dk;if(due<dk)n++;} return n?(n+" "+(n===1?"person":"people")+" overdue to reach out."):"You're all caught up on your people."; }` — this is the fallback the relay uses if its server-side regenerate fails.

**Click handler** `function handlePeopleClick(e){...}` — mirror `handleTaskListClick` (index.html:865). Handle the edit-panel attributes FIRST (they share names with the task editor), then the `data-people` actions:
```js
function handlePeopleClick(e){
  var sv=e.target.closest("[data-edit-save]");
  if(sv){var id=sv.getAttribute("data-edit-save");var p=findPerson(id);
    if(p){p.name=(pf(sv,"pe-name").value||"").trim();p.email=(pf(sv,"pe-email").value||"").trim().toLowerCase();
      p.cadence=parseInt(pf(sv,"pe-cad").value||"14",10)||14;p.lastContact=pf(sv,"pe-last").value||"";
      p.birthday=pf(sv,"pe-bday").value||"";p.note=(pf(sv,"pe-note").value||"").trim();}
    editingPersonId="";renderPeople();renderHome();save();return;}
  var cn=e.target.closest("[data-edit-cancel]");
  if(cn){editingPersonId="";renderPeople();return;}
  var dl=e.target.closest("[data-edit-delete]");
  if(dl){var did=dl.getAttribute("data-edit-delete");state.people=state.people.filter(function(p){return p.id!==did;});
    editingPersonId="";renderPeople();renderHome();save();return;}
  var b=e.target.closest("[data-people]");if(!b)return;
  var act=b.getAttribute("data-people"),pid=b.getAttribute("data-id");
  if(act==="open"){editingPersonId=(editingPersonId===pid?"":pid);renderPeople();}
  else if(act==="contact"){markContacted(pid);}
  else if(act==="enrich"){enrichPeople();}
}
```
`pf()` (index.html:703) scopes `#id` lookups to the nearest `.edit-panel`, so the `pe-*` ids work even with multiple panels' worth of markup in the DOM. Every data-mutation branch ends in **`save()`** (not `persist()`) so it syncs (Playbook §5). `markContacted`/`enrichPeople`/`addPerson` call `save()` internally.

### ES5 compliance
- **No template literals** anywhere in the new render/handler strings — use `"a "+x+" b"` concatenation. Self-check the diff for backticks.
- **No arrow functions** in `.then()`/`.filter()`/`.forEach()`/`.map()` — use `function(x){...}`. The brief/email exemplars in the architecture context use arrows because they are *abridged playbook excerpts*; the real `index.html` is ES5 (e.g. `SYNC_ARRAYS.forEach(function(k){...})` at index.html:1217, `.then(function(r){return r.json();})` at index.html:1144). Your new app code must match.
- **No `const`/`let`** — `var` only. **No destructuring** of result objects — `var r=results[i]; r.id; r.lastContact;`.
- **No `for...of`** — index loops `for(var i=0;i<arr.length;i++)`.
- **No spread** — build the person object with `.unshift({...object literal...})` and remove with `.filter(function(p){return p.id!==id;})`.
- **`<input type="date">`** is plain HTML — read `.value` directly as a `"YYYY-MM-DD"` string; no `Date` parsing for storage.
- **selEl returns a DOM node** — when building the edit panel as a string, append the node or read its `.outerHTML`; don't try to interpolate a DOM object into a string.
- No Web Speech / mic / camera in this feature — the only feature-detection needed is the `relayOn()`/`emailOn()` guards before enrichment.
- **Relay code is ES module (exempt)** — the `/people/enrich` route and `buildPeopleNudge` use `const`/arrow/`async`-`await` to match `worker.js`.

### Styling
Reuse existing primitives — do **not** invent new visual components (Rules §7).
- Person rows: reuse the bucket/card surface — `background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow);` with the standard hover lift (`transition:transform .14s ease, box-shadow .16s ease; :hover{transform:translateY(-1px)}`).
- Group headers (OVERDUE / DUE SOON / OK): reuse the existing `.bucket` + `.bucket-head` markup (11px, `letter-spacing:.14em`, uppercase, `color:var(--ink-faint)`) and `.bc` count pill, exactly as `bucketSection`/`sectionWith` emit them (index.html:920/1938).
- Status accent: overdue rows get a `<span class="dot" style="display:inline-block;background:var(--gold)"></span>` (or `--clay`) to read as "needs attention". **Reference CSS variables, never hardcode hex** (Rules §7).
- **✓ Contacted** and **Enrich from Gmail**: `.btn-soft` (surface + `--line` border, already styled at index.html:182). **Add** button: `.add-btn` (filled `--accent`). Cadence select: class `inp` (matches `selEl` output, index.html:734).
- Empty state: `.empty` (serif italic, `--ink-faint`).
- **New CSS (only if needed)** goes inside the single `<style>` block (index.html:13–~385), next to the `.bucket`/`.add-row` rules. Likely just: `.person-meta{font-size:12px;color:var(--ink-faint);margin-top:2px}` and a flex row `.person-row{display:flex;justify-content:space-between;align-items:center;gap:10px}`. Keep transitions in the .12–.25s range already in use. Prefer extending an existing class over adding one.
- Toasts via `toast(...)` (index.html:2752): `"Marked contacted ✓"`, `"Updated last-contact for N people"`, `"Connect AI first"`, `"Connect Gmail first"`, `"Couldn’t reach the relay."`.

### Verification
1. **Relay syntax:**
   ```sh
   cd /Users/kevin/KevinOS/app/relay && node --check worker.js && echo PASS
   ```
   PASS = prints `PASS`, no syntax error.
2. **Health probe shows capability** (after `npx wrangler deploy` from `app/relay`):
   ```sh
   curl -s https://kevinos-relay.kevinbigham.workers.dev/ | grep -o '"peopleEnrich":[a-z]*'
   ```
   PASS = prints `"peopleEnrich":true`.
3. **Enrich route, not connected → 401 with lowercase message** (note the body uses lowercase `not connected` to match the existing `/google/send` 401):
   ```sh
   curl -s -o /dev/null -w "%{http_code}\n" -X POST https://kevinos-relay.kevinbigham.workers.dev/people/enrich \
     -H "Content-Type: application/json" \
     -d '{"session":"nope","people":[{"id":"p1","email":"test@example.com"}]}'
   ```
   PASS = prints `401`. Confirm the body:
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/people/enrich \
     -H "Content-Type: application/json" \
     -d '{"session":"nope","people":[{"id":"p1","email":"test@example.com"}]}'
   ```
   PASS = `{"error":"not connected"}` (lowercase), no crash, CORS headers present.
4. **Enrich route, bad JSON → 400:**
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/people/enrich \
     -H "Content-Type: application/json" -d 'not json'
   ```
   PASS = `{"error":"Invalid JSON body"}`.
5. **App preview:** serve `app/` locally (e.g. `cd /Users/kevin/KevinOS/app && python3 -m http.server 8099` then open `http://localhost:8099/index.html`), hard-refresh (the SW cache bump to `kevinos-v0_27` forces fresh code), and check:
   - Click the **People** tab → empty state ("No one on your radar yet.") renders.
   - Add "Mom" / "Every 2 weeks" → appears under **DUE SOON** (no last-contact → `personDue`=today → status "due").
   - Tap **✓ Contacted** → toast "Marked contacted ✓", row moves to **OK**, `Last: <today's prettyDate>` shows.
   - Open the row → edit panel; set last-contact to 10 days ago, change cadence to **Weekly**, Save → row moves to **OVERDUE** (due = lastContact+7 < today).
   - Reload → person persists (localStorage restore branch).
   - With sync on (`state.sync.on` + key + relay), open the room on a second profile → person appears after `syncPull` (confirms `SYNC_ARRAYS` membership). Confirm `peopleCfg` does **not** appear in the synced doc.
   - Home shows the "⏰ N people overdue to reach out" card; clicking it navigates to People (`data-goto`).
   - PASS = all of the above with **no console errors**.

### Acceptance criteria
- [ ] New **People** tab appears in `#nav` and `go("people")` activates `#room-people` and calls `renderPeople`.
- [ ] Can add a person with name, optional email, and a cadence (7/14/30/90 days); persists across reload via the bootstrap restore guard.
- [ ] People are grouped OVERDUE / DUE SOON / OK by `personStatus`, computed from `lastContact + cadence` (no-contact → due today).
- [ ] **✓ Contacted** sets `lastContact` to `todayKey()`, re-buckets, re-renders Home, and persists via `save()`.
- [ ] Edit panel changes name/email/cadence/last-contact/birthday/note and can delete; reuses `data-edit-save`/`-cancel`/`-delete` + `pf()`.
- [ ] `people` syncs cross-device (in `SYNC_ARRAYS`, merges by `.id`); `peopleCfg` does NOT (in `SYNC_SKIP`).
- [ ] `POST /people/enrich` returns `{ok:true,results:[...]}` for a valid session, `{error:"not connected"}` with HTTP 401 otherwise, and never crashes on a bad/empty address (degrades to `found:false`).
- [ ] When relay + Gmail are connected, **Enrich from Gmail** back-fills `lastContact` only when the Gmail date is strictly newer than the stored value, across all connected accounts (newest wins).
- [ ] Home shows an overdue nudge card linking to the room; a weekly `gen:"people"` cron push fires (Sunday 18:00) with a deterministic overdue list regenerated server-side by `buildPeopleNudge`.
- [ ] `state.v` (→27), footer string (→v0.27), and SW cache (→kevinos-v0_27) bumped in lock-step.
- [ ] App diff has no ES5 violations (no `=>`, backticks, `const`/`let`, `async`/`await`, spread, destructuring).

### Edge cases & gotchas
- **No `lastContact` = due now**, not "never overdue" — `personDue` returns `todayKey()` for empty `lastContact`, so a freshly added person lands in "Due soon" and is never invisible.
- **Async save timing:** `save()` (index.html:705) is fire-and-forget (debounced sync push ~2000 ms, reminder sync ~1500 ms). Never read back from storage after `save()`; mutate `state` in memory and re-render immediately (the established pattern — same as every other room).
- **Enrich only moves dates forward:** compare ISO date-key strings (`result.lastContact > (p.lastContact||"")`) before assigning, so a manually-set newer date is never clobbered by an older Gmail hit.
- **Cross-account routing:** unlike the Email room (which routes per-message via `acctForId`), enrichment queries **every** account in `gmailGetRec` and keeps the **newest** date per person — a contact may email Kevin's work and personal inboxes.
- **Empty-email people:** `enrichPeople` skips them client-side (never sent); the relay also returns `found:false` for any empty/unmatched address.
- **Offline / PWA:** the room is fully usable offline — add/contact/edit/delete are local `state` mutations. Only **Enrich** needs the network; it's gated on `relayOn()`+`emailOn()` and toasts "Connect AI first" / "Connect Gmail first" when unavailable.
- **Sync conflicts:** two devices marking the same person contacted on the same day both write `lastContact=todayKey()` → identical, no conflict. Different days → `mergeById` (index.html, used by `mergeRemoteDoc` at 1236) keeps the remote/cloud copy for shared ids on a stale push (Playbook §4); last-pull-wins is acceptable here, not a data-loss bug.
- **Date keys are UTC on the relay:** the enrich route derives `"YYYY-MM-DD"` via `getUTC*` so it matches `addDaysKey` (worker.js:738, which parses with `Date.UTC`). A contact's last-contact date could be off by one vs Kevin's local day near midnight; acceptable for a cadence nudge (tolerance is days, not hours).
- **Privacy:** `/people/enrich` reads Gmail **metadata only** (`format=metadata`, `Date` header) and message **ids** — never bodies, never `format=full`. No LLM sees contact names (the cron string is built deterministically). `peopleCfg` is device-local. Email addresses in `people` DO sync (intended — they're Kevin's own contacts); note this in `HANDOFF.md` on ship.
- **Birthday/Calendar enrichment is OUT OF SCOPE for v1** — `birthday` is a manual field only. Deriving birthdays from Calendar would require adding `calendar.readonly` to `GOOGLE_SCOPE` (worker.js:558) and re-consenting every account (Relay Playbook §4); documented as future, not implemented.

### Effort & dependencies
- **Size:** **M** — one new room + one new relay route + one cron branch; no new scope, no new secret, no LLM call.
- **Must exist first:** the relay + sync (`state.sync.key`) for the weekly cron overdue push; the Gmail OAuth flow / Email room (Feature pattern A — `state.email.session`, `gmailGetRec`, `gmailAccessToken`, `gmailApi`) for enrichment. The room itself (add/contact/edit/group + Home nudge) has **zero** dependencies and can ship first; enrichment + the cron push layer on once Gmail/sync are connected.
- **Out of scope / future:** Calendar-derived birthdays (needs `calendar.readonly` + re-consent); birthday push reminders; per-person interaction history/timeline; AI-suggested cadences or AI-drafted "reach out" messages (could later reuse `callGemini` like `/google/draft`); contact import from the Google Contacts (People) API (new scope).

---

## 8. 💸 Spend Pulse

### Mission
Add a weekly spending card that scans connected Gmail inboxes for receipt and order-confirmation emails, uses Gemini to extract merchant/amount/currency/date/category from each, deduplicates by Gmail message id, aggregates into a weekly total plus a category breakdown, and surfaces it as a privacy-safe card in the **Next** room that also folds into the Weekly Review. The user can manually add/edit cash spends. Done means: tapping "Scan inbox" populates the `state.spend` ledger, the card shows this week's total and category bars, manual entries persist and sync, and amounts never leave the (private, passphrase-encrypted) synced doc or appear on any public/pushed surface.

### Why it matters
A passive, low-effort pulse on weekly spending — no budgeting app, no manual logging — turns inbox noise Kevin already receives into a single honest number.

### User flow
1. Kevin opens the **Next** room. Below the Brief and Weekly Review cards he sees a **💸 Spend Pulse** card. If no relay is connected it shows a deterministic local total of any manually-entered cash spends plus a "Connect AI (Next → Connect AI) to scan receipts" hint. If the relay is connected but Gmail is not, it shows "Connect Gmail (Email tab) to auto-scan receipts."
2. With relay + Gmail connected, the card shows this week's total (e.g. "$214.50 this week") and a small category breakdown (Groceries, Dining, Shopping, …) as labeled bars, plus a **Scan inbox** link button (`data-spend-scan="1"`) and a **+ Add cash** button (`data-spend-add="1"`).
3. Kevin taps **Scan inbox**. The card shows "scanning your inbox…". The app POSTs to relay `/spend/scan`; the relay reads the connected Gmail accounts, pulls recent messages, pre-filters receipt-like ones cheaply, and runs Gemini over those, returning extracted spend records keyed by Gmail message id.
4. The app merges the returned records into `state.spend`, skipping any whose `msgId` already exists (dedupe by non-empty `msgId`), then `save()`s and re-renders. The card now reflects the new total. A toast confirms "Found N new charges ✓" (or "Found 0 new charges").
5. Kevin taps **+ Add cash**, an inline edit panel appears (merchant text input, amount number input, category `<select>`, date defaulting to today). He saves; the record is added with `source:"cash"` and `msgId:""`. He can tap any manual (cash) row to edit or delete it.
6. On Sunday, the Weekly Review card's generated text includes a spend line ("You spent about $214 this week, mostly on Dining."), because `generateWeekly` now passes a spend digest inside its `context` string and the relay's `buildWeeklyReview` folds it into the prompt.
7. All amounts live only in the synced doc and the in-app card; they never appear on the Home screen, in any push-notification body, or any shared/public surface.

### Data model

**Two new persisted fields on `state`** (add to the `state` literal at **index.html:689**, which currently ends `…weekly:{weekKey:"",date:"",text:""},lastBackupAt:0,lastShutdown:"",v:5};`):
```js
spend:[],                  // SYNCED: array of record objects, each with a unique .id
spendMeta:{lastScanAt:0}   // DEVICE-LOCAL: never synced (in SYNC_SKIP)
```
`state.spend` is an **array** (not a wrapper object) so it can reuse the existing lossless id-merge in `SYNC_ARRAYS`. Each record:
```js
{ id:<uid()>, msgId:"", merchant:"", amount:0, currency:"USD",
  date:"YYYY-MM-DD", category:"Other", source:"email"|"cash", createdAt:<Date.now()> }
```
- `msgId` — the Gmail message id for email-sourced records (the dedupe key); empty string `""` for cash entries.
- `amount` — a positive Number (no currency symbol).
- `currency` — ISO code; defaults `"USD"`.
- `date` — `"YYYY-MM-DD"`.
- `category` — exactly one of the fixed `SPEND_CATS` list (see App changes); anything else is clamped to `"Other"`.
- `source` — `"email"` (from a scan) or `"cash"` (manual).
- `createdAt` — `Date.now()` epoch ms.

`state.spendMeta.lastScanAt` — epoch ms of the last successful scan (for a "scanned 2h ago" label and light throttling display). Device-local. (There is no `scanSession` field — the scan busy-guard is a module var `spendBusy`, see App changes. Do not add `scanSession` to state.)

**Sync decision — the privacy-critical part (verified against the live sync engine):**

The sync engine has exactly two opt-in mechanisms (index.html lines 1201/1214):
- `SYNC_ARRAYS` (1214) = `["items","events","projects","builds","briefs","links","prompts","notes","council","pending"]`. Each named key must be a **top-level array of objects with a unique `.id`**. On a clean pull `applySyncDoc` (1215) does `state[k]=doc[k]`; on a conflicting push `mergeRemoteDoc` (1234) does `state[k]=mergeById(state[k],doc[k])` — a lossless union by id (1225–1233).
- `SYNC_SKIP` (1201) = `{github:1,relay:1,push:1,sync:1,email:1,brief:1,weekly:1,v:1}`. Any key listed here is **excluded** from the uploaded doc by `buildSyncDoc` (1213: `for(k in state){…if(SYNC_SKIP[k])continue;d[k]=state[k];}`).

Therefore:
- **`state.spend` must be a top-level array** and added to `SYNC_ARRAYS` (1214). Add the string `"spend"`:
  ```js
  var SYNC_ARRAYS=["items","events","projects","builds","briefs","links","prompts","notes","council","pending","spend"];
  ```
  This makes records auto-merge by `.id` across devices, exactly like `items`/`notes`. Because the sole copy of the spend ledger lives inside the passphrase-keyed D1 doc (id = `sha256(passphrase)`), the amounts are stored only in that private document — never on a public surface.
  **Do NOT** try to add the object form `state.spend={records:[…]}` to `SYNC_ARRAYS`: `mergeById` requires an array and would treat the object as empty (`isArr(local)?local:[]` at 1226), silently dropping every record on the first conflicting push. The flat-array shape is mandatory.
- **`state.spendMeta` is device-local.** Add `spendMeta:1` to `SYNC_SKIP` (1201) so the scan timestamp never enters the doc (mirrors the `email`/`brief`/`weekly` exclusions). Do NOT add an `applySyncDoc`/`mergeRemoteDoc` scalar branch for it — skipping it entirely is correct and sufficient.
  ```js
  var SYNC_SKIP={github:1,relay:1,push:1,sync:1,email:1,brief:1,weekly:1,v:1,spendMeta:1};
  ```

**localStorage / versioning (three-way lock-step, per Rules of the Road §4):**
- Bump `state.v` to `27` at bootstrap: **index.html:2808** `state.v=26;` → `state.v=27;`.
- Bump the footer string at **index.html:631**: `KevinOS v0.26` → `KevinOS v0.27` (and append a short clause to the feature list, e.g. ` · Spend Pulse (weekly receipt scan + cash log, amounts kept private)`).
- Bump the SW cache at **sw.js:2**: `var CACHE = "kevinos-v0_26";` → `var CACHE = "kevinos-v0_27";`.
- Add two restore branches in the bootstrap `store.load` block. Insert them **immediately before line 2805's closing `}`** (after the `if(saved.weekly…)` line at 2804), so they sit inside the `if(saved){…}` guard:
  ```js
  if(isArr(saved.spend))state.spend=saved.spend;
  if(saved.spendMeta&&typeof saved.spendMeta==="object")state.spendMeta=saved.spendMeta;
  ```
  No destructive migration is needed — a previously-saved doc that lacks these keys leaves the `state` literal defaults (`spend:[]`, `spendMeta:{lastScanAt:0}`) in place. The existing `state.v` migration gates (`if(prevV<4)seedDefaults();` 2806, `if(prevV<5)seedPrompts();` 2807) are unaffected; add **no** new migration gate for spend.

**Synced D1 doc:** because `"spend"` is in `SYNC_ARRAYS`, `buildSyncDoc` (1213) automatically includes `state.spend` in the doc written to D1 via `/sync/push`. The relay's `buildWeeklyReview` already reads the synced doc by `syncKey` (worker.js:775–778); extend its digest to read `doc.spend` (see Relay changes) so the Sunday review can mention spending even when generated server-side by cron with no app running.

### Relay changes (`worker.js` — modern ES module, ES5 rule does NOT apply here)

**New helper: `gmailInboxFull(env, acct, max)`** — place it directly after `gmailInbox` (worker.js ends at line 651). `gmailInbox` (636) fetches each message with `format=metadata`, so the body is unavailable; the scan needs the body. Mirror `gmailInbox` but fetch `format=full` and decode the body with the existing `gmailBodyText(payload)` helper (worker.js:608, recursive MIME walker returning `text/plain`). Example:
```js
async function gmailInboxFull(env, acct, max) {
  const token = await gmailAccessToken(env, acct);
  const lr = await gmailApi(token, "/messages?labelIds=INBOX&maxResults=" + (max || 20));
  const lj = await lr.json();
  if (!lr.ok) throw new Error((lj.error && lj.error.message) || "gmail error");
  const out = [];
  for (const m of (lj.messages || [])) {
    const mr = await gmailApi(token, "/messages/" + m.id + "?format=full");
    const mj = await mr.json();
    if (!mr.ok) continue;
    const hs = mj.payload && mj.payload.headers;
    const body = (gmailBodyText(mj.payload) || "").slice(0, 1500); // truncate per-message
    out.push({
      id: mj.id, account: acct.email,
      from: gmailHeader(hs, "From"), subject: gmailHeader(hs, "Subject"),
      date: gmailHeader(hs, "Date"), snippet: mj.snippet || "", body,
    });
  }
  return out;
}
```
All four symbols reused (`gmailAccessToken` 582, `gmailApi` 618, `gmailHeader` 604, `gmailBodyText` 608) are confirmed present. `format=full` is covered by the existing `gmail.readonly` scope (worker.js:558) — **no re-consent and no scope change required.**

**New route: `POST /spend/scan`** — add the guard block **right after the `/weekly` block (which ends at line 1154) and before the 404 fall-through (`return json({ error: "Not found" }, 404, origin);` at line 1343)**. Use the standard body-parse pattern already used everywhere.

Request JSON:
```json
{ "session": "<gmail session id>", "account": "<email|optional>", "all": true, "tz": "America/New_York", "weekStart": "YYYY-MM-DD" }
```
- `session` = `state.email.session` (KV key `gml:<session>`). `all:true` scans every connected account; otherwise `account` (or the first account). `weekStart` is the client's current-week Sunday key — accepted but **not used to filter** (the relay returns all extracted records; the app does the weekly bucketing). `tz` is accepted and currently unused server-side (reserved; you may ignore it).

Response JSON (success):
```json
{ "ok": true, "records": [ { "msgId":"<gmail id>", "merchant":"Whole Foods", "amount":54.20, "currency":"USD", "date":"2026-06-25", "category":"Groceries" } ], "scanned": 18 }
```
Error shapes:
- Gmail not connected → status **401**, `{ "error": "not connected" }`. **Use the exact string `"not connected"`** to match `/google/threads` (worker.js:1218). Do not invent `"Gmail not connected"`.
- Gemini key missing → status **500**, `{ "error": "GEMINI_API_KEY not set on the relay" }` (the exact string used at worker.js:893/1261).
- All Gemini batches threw → status **200**, `{ "ok": true, "records": [], "scanned": N }` (so the app shows "0 new charges", not an error).

What the route does:
1. Parse body: `let payload; try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }`.
2. `if (!env.PUSH) return json({ error: "Email not configured" }, 500, origin);` then `if (!env.GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY not set on the relay" }, 500, origin);` (mirror worker.js:1215 + 893).
3. `const rec = await gmailGetRec(env, payload && payload.session); if (!rec || !rec.accounts || !rec.accounts.length) return json({ error: "not connected" }, 401, origin);` (mirror worker.js:1217–1218).
4. Resolve messages, capped at **40 total**:
   - If `payload.all`: `const per = Math.max(8, Math.floor(40 / rec.accounts.length));` then `for (const a of rec.accounts) { try { messages = messages.concat(await gmailInboxFull(env, a, per)); } catch (e) {} }` (mirror the per-account budget loop at worker.js:1222–1223).
   - Else: `const acct = gmailFindAccount(rec, payload && payload.account); if (!acct) return json({ error: "not connected" }, 401, origin); messages = await gmailInboxFull(env, acct, 40);` (`gmailFindAccount` at worker.js:576).
   - Then `messages = messages.slice(0, 40);`.
5. `await gmailPutRec(env, payload.session, rec);` to persist any access tokens refreshed by `gmailAccessToken` (mirror worker.js:1231).
6. Cheap pre-filter before spending any Gemini call — keep only receipt-like messages by testing subject + snippet + body against:
   ```js
   const RECEIPT_RE = /receipt|order\s*(confirmation|confirmed|#|number)|your order|invoice|payment\s*(received|confirmation)|thanks for your (order|purchase)|total[:\s$]/i;
   const candidates = messages.filter((m) => RECEIPT_RE.test((m.subject||"") + " " + (m.snippet||"") + " " + (m.body||"")));
   ```
7. Run Gemini in **batched, forced-JSON** mode (one call per up-to-10 messages, to bound latency/cost). Copy the inline forced-JSON pattern from `extractActions` (worker.js:362–369) — do **not** use `callGemini` (it does not force JSON). For each batch build the fetch directly:
   ```js
   const model = env.GEMINI_MODEL || "gemini-2.5-flash";
   const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + env.GEMINI_API_KEY;
   ```
   Body: `{ contents:[{role:"user",parts:[{text:userPrompt}]}], systemInstruction:{parts:[{text:system}]}, generationConfig:{responseMimeType:"application/json", temperature:0.1} }`. Parse with `JSON.parse(txt)`, falling back to slicing between the first `[` and last `]` exactly as worker.js:369.

   **Gemini system prompt** (`system`):
   ```
   You are a precise receipt parser for a personal finance tracker. You are given several emails, each with an ID, sender, subject, date, and body text. Some are purchase receipts or order confirmations; some are not. For each email that is clearly a completed purchase with a charged amount, output one record. Ignore shipping notices with no price, marketing, statements, balance alerts, and anything that is not a single concrete charge. Never invent an amount. Categorize each charge into exactly one of: Groceries, Dining, Shopping, Transport, Travel, Bills, Subscriptions, Entertainment, Health, Other.
   ```
   **Gemini user prompt** (`userPrompt`, built with string concatenation):
   ```
   Extract purchase charges from these emails. Return ONLY a JSON array, no prose. Each element: {"id": the email id you were given, "merchant": store or service name, "amount": number (no currency symbol), "currency": ISO code like "USD", "date": "YYYY-MM-DD" derived from the email date, "category": one of [Groceries, Dining, Shopping, Transport, Travel, Bills, Subscriptions, Entertainment, Health, Other]}. Skip any email that is not a concrete completed charge. If there are no charges, return [].

   EMAILS:
   ```
   followed, for each message in the batch, by a block built as:
   ```
   "--- id: " + m.id + " | from: " + m.from + " | date: " + m.date + " | subject: " + m.subject + " ---\n" + m.body + "\n\n"
   ```
   (`m.body` is already truncated to ~1500 chars by `gmailInboxFull`.)
8. **Per-batch error isolation:** wrap each batch's fetch + parse in `try/catch`; on throw, skip that batch and continue (mirror the skip-on-throw in `generateOvernightDrafts`). Accumulate parsed records across batches.
9. Normalize and validate each returned `{id,…}`:
   - Map `id` back to the Gmail message id → `msgId` (drop any record whose `id` is not a real `candidates` id).
   - Coerce `amount = Number(rec.amount)`; **drop** if `!isFinite(amount) || amount <= 0`.
   - **Drop** if no usable `date` (require a `YYYY-MM-DD`-shaped string; if Gemini returned a different format, drop rather than guess).
   - Clamp `category` to the allowed list (default `"Other"`).
   - `currency = (rec.currency || "USD").toString().toUpperCase().slice(0,3)`.
   - `merchant = (rec.merchant || "").toString().slice(0,80)`.
10. Return `json({ ok:true, records, scanned: candidates.length }, 200, origin)` where `records` is the normalized list and `scanned` is the count of receipt-like messages passed to Gemini.

**Changed: `weeklyDigest` + `weeklyDigestText` + `buildWeeklyReview`** (worker.js:744 / 758 / 770).
- In `weeklyDigest(doc, D)` (744) add a spend summary computed from `doc.spend` (the synced array). Use the same week window the app uses — records whose `date >= D` (where `D` is the week-start Sunday key passed in; the app passes `dateKey` = today, and the digest is keyed to the current week). To be safe and match the app's `spendThisWeek` definition, sum records with `date >= weekStartKey-equivalent`. Since the relay receives `D = dateKey` (today, not necessarily Sunday), compute the week start server-side the same way the app does: there is no `weekStartKey` helper in the relay, so add one mirroring `addDaysKey` (worker.js:738) — or simply sum records with `date >= addDaysKey(D, -((new Date(D+"T00:00:00Z")).getUTCDay()))`. Concretely:
  ```js
  const spend = Array.isArray(doc && doc.spend) ? doc.spend : [];
  let wkStart = D;
  if (D) { const dd = new Date(D + "T00:00:00Z"); wkStart = addDaysKey(D, -dd.getUTCDay()); }
  const weekSpend = spend.filter((s) => s && typeof s.amount === "number" && s.amount > 0 && s.date && s.date >= wkStart);
  let spendTotal = 0; const byCat = {};
  weekSpend.forEach((s) => { spendTotal += s.amount; byCat[s.category || "Other"] = (byCat[s.category || "Other"] || 0) + s.amount; });
  let spendTop = ""; let topV = 0;
  Object.keys(byCat).forEach((c) => { if (byCat[c] > topV) { topV = byCat[c]; spendTop = c; } });
  ```
  Return `spendTotal` and `spendTop` on the digest object (add `spendTotal, spendTop` to the returned object at line 756).
- In `weeklyDigestText(wd, D)` (758) append, just before `return L.join("\n");`:
  ```js
  if (wd.spendTotal > 0) L.push("", "Spending this week: ~$" + Math.round(wd.spendTotal) + (wd.spendTop ? " (mostly " + wd.spendTop + ")" : "") + ".");
  ```
- In `buildWeeklyReview` (770), add one clause to the existing `system` string (line 791) so Gemini surfaces it: append `" If there is spending data, mention the rough weekly spend total and the top category in one short clause."`. No new env/secret — the Gemini key is already required for the weekly path.

**Capability advertisement:** in the `GET /` health response (worker.js:849) add `spend: !!env.GEMINI_API_KEY`. The current object is:
```js
return json({ ok: true, service: "kevinos-relay", provider, seats, push: !!env.VAPID_PUBLIC_KEY, github: !!env.GITHUB_CLIENT_ID, sync: !!env.SYNC, extract: !!env.GEMINI_API_KEY, email: !!env.GOOGLE_CLIENT_ID }, 200, origin);
```
Add `spend: !!env.GEMINI_API_KEY,` alongside the other booleans.

**Env / secret / scope needs:** none new. Reuses `GEMINI_API_KEY` and the existing `gmail.readonly` scope (worker.js:558). No `wrangler.toml` change, no cron change (Spend Pulse is **not** pushed — see privacy gotchas).

### App changes (`index.html`, ES5 — the ES5 rule DOES apply here)

**New constant** (place near `AREAS`/`PROJECT_STATUS`, index.html:661–686):
```js
var SPEND_CATS=["Groceries","Dining","Shopping","Transport","Travel","Bills","Subscriptions","Entertainment","Health","Other"];
```

**State literal** (index.html:689) — add `spend:[]` and `spendMeta:{lastScanAt:0}` (see Data model). **`SYNC_ARRAYS`** (1214) — add `"spend"`. **`SYNC_SKIP`** (1201) — add `spendMeta:1`.

**New module-level ephemerals** (place next to `briefBusy, weeklyBusy` at index.html:692):
```js
var spendBusy=false;   // a scan is in flight
var spendEditId="";    // id of the cash record being edited, or "new", or "" (closed)
```

**New helper functions** (place near the Brief/Weekly helpers, index.html:942–1030). All ES5: `var` only, `function` callbacks (no arrows), `for` loops (no `.map`/`.filter` arrows in the hot helpers — match the surrounding loop-based code), string concatenation (no template literals).

- `function spendWeekStart(){ return weekStartKey(todayKey()); }` — Sunday key of the current week (`weekStartKey` confirmed at index.html:983; `todayKey` at 710).
- `function spendThisWeek(){ var ws=spendWeekStart(),out=[],i,r; for(i=0;i<state.spend.length;i++){ r=state.spend[i]; if(r&&r.date&&r.date>=ws&&typeof r.amount==="number"&&r.amount>0) out.push(r);} return out; }`
- `function spendWeekTotal(){ var a=spendThisWeek(),t=0,i; for(i=0;i<a.length;i++)t+=a[i].amount; return t; }`
- `function spendByCategory(){ var a=spendThisWeek(),map={},i,c; for(i=0;i<a.length;i++){ c=a[i].category||"Other"; map[c]=(map[c]||0)+a[i].amount; } return map; }`
- `function fmtMoney(n,cur){ n=Number(n)||0; cur=cur||"USD"; return cur==="USD" ? "$"+n.toFixed(2) : cur+" "+n.toFixed(2); }` — `toFixed` is ES5-safe; do not reach for `Intl`.
- `function spendContextText(){ var t=spendWeekTotal(); if(t<=0) return ""; var map=spendByCategory(),top="",tv=0,k; for(k in map){ if(map.hasOwnProperty(k)&&map[k]>tv){tv=map[k];top=k;} } return "Spending this week: "+fmtMoney(t,"USD")+(top?". Top category: "+top+" ("+fmtMoney(tv,"USD")+")":"")+"."; }` — plain-text digest for the Weekly Review context.
- `function spendCardHTML(){ … }` — returns the card HTML string; mirror `weeklyCardHTML` (index.html:1011) structure (busy → data → fallback → connect-prompt). See "Render & HTML" below.
- `function scanSpend(force){ … }` — POSTs `/spend/scan`; mirror `generateWeekly` (index.html:1020) exactly, including the `try{tz=Intl.DateTimeFormat()…}catch(e){}` guard and `.then(function(r){return r.json();}).then(function(j){…}).catch(function(){…})` chain (no arrows, no async/await). Body: `{session:<email session>, all:true, tz:tz, weekStart:spendWeekStart()}`. Guard up front: if no email session (`!(state.email&&state.email.session&&emailOn())`) → `toast("Connect Gmail first (Email tab)"); return;`. Then `if(spendBusy)return; spendBusy=true; renderNext();`. On resolve: if `j&&j.ok` → `var added=mergeSpendRecords(j.records||[]); if(!state.spendMeta)state.spendMeta={lastScanAt:0}; state.spendMeta.lastScanAt=Date.now(); spendBusy=false; save(); renderNext(); toast("Found "+added+" new charge"+(added===1?"":"s")+" ✓");` else `spendBusy=false; renderNext(); toast((j&&j.error)||"Couldn’t scan inbox.");`. On `.catch`: `spendBusy=false; renderNext(); toast("Couldn’t reach the relay.");`. (Note `save()` not `persist()`, so the new records sync.)
- `function mergeSpendRecords(arr){ … }` — returns count added. For each incoming record: skip if it has a non-empty `msgId` that already exists in `state.spend`; otherwise validate/normalize and `unshift`. ES5:
  ```js
  function mergeSpendRecords(arr){
    if(!isArr(arr))return 0;
    var have={},i,r,n=0,amt,cat;
    for(i=0;i<state.spend.length;i++){r=state.spend[i];if(r&&r.msgId)have[r.msgId]=1;}
    for(i=0;i<arr.length;i++){
      r=arr[i]; if(!r)continue;
      var mid=(r.msgId||"").toString();
      if(mid&&have[mid])continue;
      amt=Number(r.amount); if(!isFinite(amt)||amt<=0)continue;
      if(!r.date||!/^\d{4}-\d{2}-\d{2}$/.test(r.date))continue;
      cat=(r.category||"Other").toString(); if(SPEND_CATS.indexOf(cat)<0)cat="Other";
      state.spend.unshift({id:uid(),msgId:mid,merchant:(r.merchant||"").toString().slice(0,80),amount:amt,currency:(r.currency||"USD").toString().toUpperCase().slice(0,3),date:r.date,category:cat,source:"email",createdAt:Date.now()});
      if(mid)have[mid]=1; n++;
    }
    return n;
  }
  ```
  (`uid` at 704, `isArr` is the existing array-check used throughout the bootstrap.)
- `function addCashSpend(){ spendEditId="new"; renderNext(); }` — opens the inline editor.
- `function saveSpendEdit(){ … }` — read inputs via `pf()` (index.html:703, scopes `#id` lookups to the nearest `.edit-panel`); validate `amount>0`; insert or mutate; then `spendEditId=""; save(); renderNext();`. ES5:
  ```js
  function saveSpendEdit(){
    var b=$("nextView");
    var m=(pf(b,"spMerchant").value||"").trim();
    var amt=parseFloat(pf(b,"spAmount").value||"0");
    var cat=pf(b,"spCat").value||"Other";
    var dt=(pf(b,"spDate").value||todayKey());
    if(!(amt>0)){toast("Enter an amount.");return;}
    if(SPEND_CATS.indexOf(cat)<0)cat="Other";
    if(spendEditId==="new"){
      state.spend.unshift({id:uid(),msgId:"",merchant:m,amount:amt,currency:"USD",date:dt,category:cat,source:"cash",createdAt:Date.now()});
    } else {
      var i; for(i=0;i<state.spend.length;i++){ if(state.spend[i].id===spendEditId){ state.spend[i].merchant=m; state.spend[i].amount=amt; state.spend[i].category=cat; state.spend[i].date=dt; break; } }
    }
    spendEditId=""; save(); renderNext();
  }
  ```
  (`pf` returns the panel-scoped element or falls back to global `$`; the `<input type="date">` value is already `YYYY-MM-DD`.)
- `function deleteSpend(id){ var i; for(i=0;i<state.spend.length;i++){ if(state.spend[i].id===id){ state.spend.splice(i,1); break; } } if(spendEditId===id)spendEditId=""; save(); renderNext(); }`

**Render & HTML — `spendCardHTML()`.** Built with string concatenation, `escapeHtml(...)` on all user/merchant text (index.html:729), NO template literals. Structure mirrors `weeklyCardHTML`:
- Wrapper reusing `.brief-card` plus a `.spend-card` modifier: `'<div class="brief-card spend-card" style="…">'` (you may reuse the weekly card's inline gradient or rely on the new `.spend-card` CSS; keep the existing `border-radius:14px;padding:14px;margin:2px 0 14px` inline like the other two cards for consistency).
- Header row: `💸 Spend Pulse` + (when `relayOn()` **and** `emailOn()`) a `<button class="linklike" type="button" data-spend-scan="1">Scan inbox</button>`. Optionally a faint "scanned <rel> ago" label derived from `state.spendMeta.lastScanAt` (hide when `0`); a simple relative-time string is fine, or omit.
- If `spendBusy`: body = `'<span class="cq-prov">scanning your inbox…</span>'`.
- Connect-prompt branches (check first, like `briefCardHTML` index.html:961):
  - `!relayOn()` → show the cash-only total (`fmtMoney(spendWeekTotal(),"USD")+" this week"`, which is `$0.00` if empty) plus a hint `'…Connect AI (Next → Connect AI) to scan receipts…'` and the **+ Add cash** button (cash logging works fully offline).
  - `relayOn() && !emailOn()` → show the cash-only total plus `'…Connect Gmail (Email tab) to auto-scan receipts…'` and **+ Add cash**.
- Otherwise (connected, not busy):
  - Total line: `'<div class="spend-total">'+escapeHtml(fmtMoney(spendWeekTotal(),"USD"))+' this week</div>'`.
  - Category breakdown: for each category in `SPEND_CATS` order whose total is `>0`, emit a bar row where the width is the category's share of the week total (guard divide-by-zero):
    ```js
    '<div class="spend-bar"><span class="spend-cat">'+escapeHtml(cat)+'</span><span class="spend-amt">'+escapeHtml(fmtMoney(v,"USD"))+'</span><i style="width:'+pct+'%"></i></div>'
    ```
    where `pct = total>0 ? Math.round(v/total*100) : 0`.
  - Cash rows: for each `source==="cash"` record in `spendThisWeek()`, a row `<div class="spend-row">…merchant + amount…<button data-spend-edit="<id>">edit</button> <button data-spend-del="<id>">delete</button></div>` (escape merchant).
  - Empty state: if `spendThisWeek().length===0` and not busy → `'<p class="empty">No spending logged yet this week.</p>'` plus the scan/add buttons.
- Edit panel (when `spendEditId` is set): a `<div class="edit-panel">` built by **string** with these element ids — `#spMerchant` (text input), `#spAmount` (`type="number" step="0.01" min="0"`), the category `<select id="spCat">`, and `#spDate` (`type="date"` defaulting to `value="'+todayKey()+'"` for `new`, else the record's date). For the category select, the simplest ES5-correct path inside a string-built card is to write the `<select id="spCat">` markup directly with a `for` loop over `SPEND_CATS` emitting `<option>` tags (mirroring how `selEl` at index.html:734 builds options, but as a string since the rest of the card is string-built). Do NOT use `optChips` (index.html:1934) here — that builds chip **buttons** with click callbacks, not a `<select>`. The action buttons must use the `editActions` convention (index.html:735): buttons carry `data-spend-save="<id>"`, `data-spend-cancel="1"`, `data-spend-delete="<id>"` (note: **`-delete`**, not `-del`, to match the helper's naming and the `data-edit-*` pattern at index.html:866–869). The cash **rows** use `data-spend-del` for the inline per-row delete; the **edit-panel** delete uses `data-spend-delete`. Keep these two attributes distinct so the handler can tell a row-delete from a panel-delete (both call `deleteSpend`).
- Footer **+ Add cash** button (when not editing): `'<button class="btn-soft" type="button" data-spend-add="1">+ Add cash</button>'`.

**Exact hook points (all verified against the live file):**
1. **No new nav tab / room.** Spend Pulse is a card inside the existing **Next** room. Do NOT add a `data-room` button, a `#room-x` div, or a `go()` case. It rides `renderNext` exactly like the Brief/Weekly cards.
2. **Render flow:** in `renderNext` (index.html:1031) the `box.innerHTML=''+…` template already contains `briefCardHTML()+ weeklyCardHTML()+` at **lines 1050–1051**. Insert `spendCardHTML()+` immediately after `weeklyCardHTML()+` (so the order is brief → weekly → spend), before the `'<div class="capture-row">…'` line at 1052.
3. **Click delegation:** the Next room is served by `handleNextClick` (index.html:1538). It already handles `data-brief-refresh` (1542) and `data-weekly-refresh` (1543) using the pattern `if(e.target.closest("[data-…]")){ fn(); return; }`. Add these branches in the same style, placed right after line 1543. Match the existing pattern exactly (each is its own `closest` check; read ids with `.getAttribute(...)`):
   ```js
   if(e.target.closest("[data-spend-scan]")){scanSpend(true);return;}
   if(e.target.closest("[data-spend-add]")){addCashSpend();return;}
   var spe=e.target.closest("[data-spend-edit]");if(spe){spendEditId=spe.getAttribute("data-spend-edit");renderNext();return;}
   var sps=e.target.closest("[data-spend-save]");if(sps){saveSpendEdit();return;}
   if(e.target.closest("[data-spend-cancel]")){spendEditId="";renderNext();return;}
   var spd=e.target.closest("[data-spend-del]");if(spd){deleteSpend(spd.getAttribute("data-spend-del"));return;}
   var spx=e.target.closest("[data-spend-delete]");if(spx){deleteSpend(spx.getAttribute("data-spend-delete"));return;}
   ```
   (Two delete attributes by design — `-del` for inline cash rows, `-delete` for the edit-panel `editActions`-style button.)
4. **Sync re-render:** `syncRerender()` (index.html:1241–1254) **already** has `else if(room==="next")renderNext();` at line 1243. Because the Spend Pulse card is part of `renderNext`, an incoming sync update repaints it automatically. **No change to `syncRerender` is required** — verified.
5. **Weekly Review integration:** in `weeklyContextText(dk)` (index.html:993), the function ends `return L.join("\n");` at line 1002. Append the spend digest to the returned string so `generateWeekly`'s `context` carries it. Change the final line to:
   ```js
   var sp=spendContextText(); if(sp)L.push("",sp);
   return L.join("\n");
   ```
   No change to `generateWeekly` itself (it already sends `context:weeklyContextText(dk)` at index.html:1026).
6. **Bootstrap restore:** add the two restore branches in the `store.load` block before line 2805 (see Data model).

**Mirror-this summary (all targets verified present):** card structure → `weeklyCardHTML` (1011); async scan fn → `generateWeekly` (1020); context builder → `weeklyContextText` (993); inline edit-panel + save/cancel/delete attribute convention → `editActions` (735) + the `data-edit-*` handling in `handleTaskListClick` (866–869); panel-scoped input reads → `pf` (703); money escaping → `escapeHtml` (729); dedupe-by-id concept → `mergeById` (1225, conceptually — the app's own `mergeSpendRecords` dedupes on `msgId`, the sync engine dedupes on `.id`).

### ES5 compliance (app JS only — the relay is exempt)
- **No template literals** anywhere in the new render strings — build all HTML with `"..."+var+"..."` concatenation (the card interpolates total, percentages, category rows, edit-panel fields — every one must be `+`-joined).
- **No arrow functions** in `scanSpend`/`mergeSpendRecords`/`saveSpendEdit`/any `.then()`/`.catch()` — use `function(j){…}` callbacks exactly like `generateWeekly` (index.html:1020).
- **No `const`/`let`** — `var` only, including loop counters (`for(var i=0;…)`).
- **No array spread / destructuring** — build the category map and totals with explicit `for` loops and index access; concatenate arrays with `.concat`, never `[...a,...b]`.
- **No `.filter`/`.map` with arrows** in the hot helpers (`spendThisWeek`/`spendWeekTotal`/`spendByCategory`) — use `for` loops, matching the loop-based style of `mergeById` (1225). (The surrounding file uses both styles, but these new helpers stay loop-based for clarity and to avoid arrow callbacks.)
- **Money formatting:** `n.toFixed(2)` only; do NOT use `Intl.NumberFormat` (locale surprises, and the file avoids it).
- **No `async`/`await`** — Promise `.then().catch()` chains only.
- Before saving, grep your diff for `=>`, backtick, `const `, `let `, `async`, `await`, `...`, `class ` (Rules of the Road §1). The **relay** edits (`gmailInboxFull`, the `/spend/scan` block, the `weeklyDigest`/`buildWeeklyReview` changes) are in `worker.js` and SHOULD use modern ES (`const`/arrow/`async`/`await`) to match the surrounding file — do not ES5-ify the worker.

### Styling
Add to the single `<style>` block (index.html:13–~640), next to the `.brief-card` rules. Reuse the existing card surface and palette variables — no new hex.
```css
.spend-card .spend-total{ font-family:var(--font-display); font-size:22px; color:var(--ink); margin:6px 0 10px; }
.spend-card .spend-bar{ display:flex; align-items:center; gap:8px; margin:4px 0; font-size:13px; color:var(--ink-soft); position:relative; }
.spend-card .spend-bar .spend-cat{ width:96px; flex:0 0 auto; }
.spend-card .spend-bar .spend-amt{ width:72px; flex:0 0 auto; text-align:right; color:var(--ink); }
.spend-card .spend-bar i{ height:6px; border-radius:999px; background:var(--accent-soft); display:block; flex:1 1 auto; min-width:0; }
.spend-card .spend-row{ display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-top:1px solid var(--line); font-size:13px; }
.spend-card .spend-foot{ margin-top:10px; }
```
- The breakdown bars use `--accent-soft` for the fill, matching the purple call-to-action tone; the total uses `--font-display` for the "calm cockpit" headline feel. Because the card carries the `.brief-card` class it inherits that card's surface/spacing, so no border/shadow re-declaration is needed. Keep any added hover transition in the existing .12–.25s range.

### Verification
1. **Relay static check:** `node --check /Users/kevin/KevinOS/app/relay/worker.js` — PASS = no syntax error printed (exit 0).
2. **Health probe shows capability** (relay base is `https://kevinos-relay.kevinbigham.workers.dev`):
   ```sh
   curl -s https://kevinos-relay.kevinbigham.workers.dev/ | grep -o '"spend":[a-z]*'
   ```
   PASS = prints `"spend":true` (once `GEMINI_API_KEY` is set on the relay and the new code is deployed).
3. **Scan route is registered and guards correctly (unknown session → 401, not 404/500):**
   ```sh
   curl -s -o /dev/null -w '%{http_code}\n' -X POST https://kevinos-relay.kevinbigham.workers.dev/spend/scan \
     -H 'Content-Type: application/json' \
     -d '{"session":"nonexistent-session","all":true,"tz":"America/New_York","weekStart":"2026-06-21"}'
   ```
   PASS = prints `401`. Then inspect the body:
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/spend/scan \
     -H 'Content-Type: application/json' \
     -d '{"session":"nonexistent-session","all":true}'
   ```
   PASS = `{"error":"not connected"}` (NOT `{"error":"Not found"}` and NOT a 500 stack).
4. **Scan route with a real connected session** (after connecting Gmail in the app: open the app, Email tab → connect, then in devtools console run `JSON.parse(localStorage["kevinos:v1"]).email.session` to copy the session id):
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/spend/scan \
     -H 'Content-Type: application/json' \
     -d '{"session":"<REAL_SESSION>","all":true,"tz":"America/New_York","weekStart":"2026-06-21"}'
   ```
   PASS = `{"ok":true,"records":[...],"scanned":N}` where each record has a `msgId`, a positive numeric `amount`, an ISO `currency`, a `YYYY-MM-DD` `date`, and a `category` from `SPEND_CATS`.
5. **App preview** — serve `app/` over a static server and open it:
   ```sh
   cd /Users/kevin/KevinOS/app && python3 -m http.server 8000
   ```
   then open `http://localhost:8000/index.html`.
   - Go to **Next**. The **💸 Spend Pulse** card renders below the Weekly Review card.
   - With no relay: card shows cash-only total (`$0.00 this week` initially) + "Connect AI … to scan receipts" hint. PASS = no console error; no amount appears anywhere outside the card.
   - Tap **+ Add cash**, enter "Coffee" / `4.50` / Dining / today, Save. PASS = "$4.50 this week" total appears with a Dining bar at 100%; the cash row is editable/deletable; reloading the page keeps it (localStorage).
   - With relay + Gmail connected: tap **Scan inbox** → "scanning…" → toast "Found N new charges ✓"; total updates; tapping **Scan inbox** again does NOT duplicate. PASS = the second scan toasts "Found 0 new charges" (or only the count of newly-arrived receipts).
   - Open the **Weekly Review** card refresh (`↻`): the generated text mentions the weekly spend total / top category. PASS = a spend clause is present.
6. **ES5 self-check on the app diff:**
   ```sh
   LC_ALL=C grep -nE '=>|`|\bconst |\blet |\basync |\bawait |\.\.\.' /Users/kevin/KevinOS/app/index.html
   ```
   PASS = none of the matches fall inside the new Spend Pulse code (pre-existing matches elsewhere are fine; the new code must add zero).
7. **Privacy check:** confirm no amount string appears on the **Home** room, in any `buildReminders` push `body`, or in any element outside the Next card / Weekly Review text. PASS = amounts only in the Spend Pulse card and the (private, in-app/synced-doc) Weekly Review text.

### Acceptance criteria
- [ ] `node --check app/relay/worker.js` passes; `GET /` returns `"spend":true` when the Gemini key is set.
- [ ] `POST /spend/scan` returns `{ok:true,records,scanned}` for a connected session and a **401 `{"error":"not connected"}`** for an unknown session (never a 404; never a 500 for the not-connected case).
- [ ] Each returned record has a `msgId`, a positive numeric `amount`, an ISO `currency`, a `YYYY-MM-DD` `date`, and a `category` within `SPEND_CATS`.
- [ ] `"spend"` is in `SYNC_ARRAYS` (as a top-level array); `spendMeta` is in `SYNC_SKIP`; `state.v` bumped to **27** with footer (`v0.27`) + SW cache (`kevinos-v0_27`) bumped in lock-step.
- [ ] The Spend Pulse card renders in the **Next** room below Weekly Review, with this-week total + category bars.
- [ ] **Scan inbox** populates records, dedupes by `msgId` (re-scan adds 0 duplicates), updates the total, and toasts the count.
- [ ] **+ Add cash** / edit / delete works, persists to localStorage, and syncs cross-device by `.id`.
- [ ] Weekly Review generated text includes a spend clause when there is spend this week.
- [ ] No amount appears on Home, in any push body, or any public/shared surface.
- [ ] New app JS is ES5 (no `=>`, backticks, `const`/`let`, `async`/`await`, spread, destructuring); relay edits remain modern ES.

### Edge cases & gotchas
- **Dedupe correctness:** dedupe ONLY on non-empty `msgId`; never dedupe cash entries (they carry `msgId:""`), or two legitimate cash charges would collapse into one. Two emails can describe the same order — accept that low-frequency noise; do not over-engineer cross-merchant dedupe.
- **Error string must match:** the not-connected response is `{"error":"not connected"}` with status 401 (copied verbatim from `/google/threads` at worker.js:1218). The app's `scanSpend` reads `j.ok` and shows `j.error` in a toast, so any non-`ok` shape degrades gracefully regardless — but keep the string consistent.
- **`format=full` vs `format=metadata`:** the existing `gmailInbox` (worker.js:636) fetches metadata only — it has no body. The scan needs `gmailInboxFull` with `format=full` + `gmailBodyText`. Truncate each body to ~1500 chars and cap total messages at 40 to bound latency/cost. `format=full` is covered by `gmail.readonly` — no re-consent.
- **Edit-panel vs row delete attributes:** the inline cash-row delete uses `data-spend-del`; the edit-panel delete (built `editActions`-style) uses `data-spend-delete`. Both are handled in `handleNextClick` and both call `deleteSpend`. Keeping them distinct avoids a `closest` ambiguity and matches the `data-edit-*` naming convention (index.html:866–869).
- **Use `selEl`-as-string, not `optChips`:** the category picker is a `<select id="spCat">`. `optChips` (index.html:1934) builds chip buttons with their own click listeners and would not survive the next `innerHTML` re-render of the string-built card; build the `<select>` as markup in the card string instead.
- **`save()` vs `persist()`:** after `scanSpend` resolves and after every cash add/edit/delete, call **`save()`** (index.html:705) — it writes localStorage AND schedules the debounced sync push (2000 ms). `persist()` (706) is local-only and would NOT sync; do not use it here.
- **Sync conflicts:** because `spend` is an id-keyed `SYNC_ARRAYS` member, concurrent edits on two devices union by `.id` (mirrors `items`) — a record added on one device while another edits a different record is never lost. Editing the SAME record on two devices is last-writer-by-merge (the converged cloud copy wins for a shared id; acceptable).
- **Offline / PWA:** `scanSpend` requires the relay; if `relayBase()` is empty, the card short-circuits to the connect-prompt (mirror `briefCardHTML` index.html:961). Cash add/edit/delete must work fully offline (pure local state, no relay).
- **Empty states:** zero records this week → "No spending logged yet this week." No relay → cash-only total + "Connect AI" hint. Relay on, no Gmail → cash-only total + "Connect Gmail" hint. Gemini returns `[]` → toast "Found 0 new charges" (not an error).
- **Gemini hallucination guard:** drop any record with `amount<=0`, a non-`YYYY-MM-DD` `date`, or an `id` not in the candidate set; clamp unknown `category` to `"Other"`. The system prompt forbids inventing amounts — still validate client-side in `mergeSpendRecords` AND server-side in the route normalization step.
- **Privacy — keep amounts off pushed/public surfaces:** do NOT add any dollar figure to `buildReminders` (the push reminder set), the Home card, or any toast except the new-charge count. The Weekly Review text MAY mention the rough total because that text is only shown in-app and stored in the private synced doc; the push **body** for the weekly is regenerated fresh server-side by `buildWeeklyReview` and is acceptable, but do NOT add a dollar amount to the static `weeklyBodyShort` fallback (index.html:1004) that seeds the push `body`.
- **Mixed currency:** the week total sums `amount` naively regardless of `currency` (single-currency assumption for v1). A mixed-currency total would be wrong; this is a known, documented limitation (see Out of scope).

### Effort & dependencies
- **Size:** L — a new relay route with full-body Gmail fetch + receipt pre-filter + batched forced-JSON Gemini, plus a full app card with inline CRUD editor, sync wiring, and Weekly Review integration.
- **Must exist first (all already shipped):** the Gmail OAuth slice (Email room, `state.email.session`, `gmailGetRec`/`gmailFindAccount`/`gmailAccessToken`/`gmailApi`/`gmailHeader`/`gmailBodyText`); the Weekly Review (this feature extends `weeklyDigest`/`weeklyDigestText`/`buildWeeklyReview` and `weeklyContextText`); cross-device sync (reuses `SYNC_ARRAYS`/`buildSyncDoc`/`mergeById`).
- **Out of scope / future:** monthly/annual rollups and trends; budget limits/alerts; CSV export; bank/card integrations (Plaid); currency conversion / FX normalization (records keep their native `currency`; the v1 total sums naively — mixed-currency totals are a known gap); a dedicated Spend room/tab; receipt image/PDF parsing (text-email only for v1, though `/extract`'s multimodal pattern could later extend it); push notifications for spend (intentionally excluded for privacy — no `gen:"spend"` cron branch, no spend amount in any reminder body).

---

## 9. 🎯 Goals & Weekly Check-In

### Mission
Add a small, focused Goals feature: Kevin sets a handful of quarterly goals (title, target metric, numeric progress) in a dedicated **Goals** room, and the Sunday Weekly Review prompts a per-goal check-in ("did you move the needle?") that records a weekly progress snapshot plus a short note. Gemini then weaves current goal progress into the weekly-review narrative. Done = a synced `state.goals` collection, a working Goals room, an inline check-in flow surfaced in the Next room directly below the weekly card, and the relay `/weekly` builder enriched with goals context (both the live open-app path and the closed-app cron path).

### Why it matters
Goals turn the cockpit from reactive (tasks/inbox) to intentional — the weekly review becomes a real accountability ritual instead of just a look-ahead.

### User flow
1. Kevin taps the **Goals** tab → lands in the Goals room. Empty state invites "Add your first goal."
2. He types a goal title in the add-row, taps Add. A goal card appears with title, target, and a 0% progress bar.
3. He taps a goal card's Edit button to expand its edit panel: edits **title**, **target/metric** (free text, e.g. "Ship v1.0" or "Read 12 books"), and **progress** (0–100). Saves. Card repaints with the new progress bar; data syncs across devices.
4. Sunday evening: Kevin opens **Next**. The weekly review card renders as usual. Directly below it, a **Weekly Check-In** card lists each active goal with a one-line prompt "Did you move the needle?" and, per goal: a small numeric input to update `progress` and a "this week" note field.
5. He bumps two goals' progress, jots a note on one, taps **Save check-in**. Each goal records a `checkins[]` entry `{weekKey, date, progress, note}`; the check-in is marked done for the current week (won't re-nag until next Sunday).
6. He taps the weekly review **↻** (or it auto-generates once per week). The relay reads his synced goals + check-ins and Gemini's review now mentions goal momentum ("You nudged 'Ship v1.0' to 60% — protect Tuesday for the final push").
7. Everything persists locally and syncs; closing the app and reopening on his phone shows the same goals and progress.

### Data model
Add one synced collection and extend the existing weekly state. The `state` literal is at **index.html:689**; add:

- **`goals:[]`** — array of goal objects. Each goal:
  ```
  { id, title, target, progress, status, checkins, createdAt }
  ```
  - `id` — `uid()` (index.html:704).
  - `title` — string (required).
  - `target` — string, free-text metric/definition-of-done. Default `""`.
  - `progress` — number 0–100. Default `0`.
  - `status` — `"active"` | `"done"` | `"dropped"`. Default `"active"`.
  - `checkins` — array of `{ weekKey, date, progress, note }` (most recent first). `weekKey` = `weekStartKey(todayKey())` (Sunday of the week — `weekStartKey` is at index.html:983, NOT 983 in the draft's "983" which is correct); `date` = `todayKey()` (index.html:710); `progress` = snapshot at check-in time; `note` = string. Default `[]`.
  - `createdAt` — `Date.now()`.

Extend `state.weekly` (currently the literal `weekly:{weekKey:"",date:"",text:""}` at index.html:689) by adding a **`checkinWeek`** field (string, default `""`) that records the `weekKey` of the most recent completed check-in. This gates the "Weekly Check-In" prompt so it fires once per week. `state.weekly` is in `SYNC_SKIP`, so `checkinWeek` is device-local — acceptable, because the authoritative per-goal record lives in `goals[].checkins` which IS synced; `checkinWeek` is just a per-device "already nagged this week" flag.

> **Note on `state.weekly` shape:** the existing code constructs `state.weekly` fresh in `generateWeekly` (index.html:1027) as `{weekKey,date,text}` — it does NOT spread/preserve other fields. Therefore `checkinWeek` must be set on `state.weekly` **independently** in `saveCheckin` (it survives because `generateWeekly` only overwrites on a weekly-text regeneration, and `saveCheckin` re-asserts it). When the bootstrap restores `state.weekly` from a JSON backup (index.html:2804: `if(saved.weekly&&typeof saved.weekly==="object")state.weekly=saved.weekly;`), a saved doc lacking `checkinWeek` simply leaves it `undefined`; treat `undefined` as "not yet done this week" in the gating check (`state.weekly.checkinWeek===weekStartKey(...)` is `false` when `undefined`, which is correct). No literal change strictly required for `weekly`, but for clarity you MAY change the literal at 689 to `weekly:{weekKey:"",date:"",text:"",checkinWeek:""}`.

**Sync membership:**
- `goals` is **synced as an id-keyed array**: add `"goals"` to `SYNC_ARRAYS` (index.html:1214 — currently `["items","events","projects","builds","briefs","links","prompts","notes","council","pending"]`). It auto-merges by `.id` via `mergeById` (index.html:1225) in `mergeRemoteDoc`, and full-replaces on a clean pull in `applySyncDoc` (index.html:1217, `SYNC_ARRAYS.forEach(...)`). Do **not** add it to `SYNC_SKIP`. Because each goal carries `checkins` inside it, check-in data rides along automatically — no separate scalar handling needed.
- `state.weekly` stays in `SYNC_SKIP` (index.html:1201 — currently `{github:1,relay:1,push:1,sync:1,email:1,brief:1,weekly:1,v:1}`) unchanged; the new `checkinWeek` sub-field inherits that exclusion.

**localStorage / versioning:** Bump the state schema. In the bootstrap restore block (the `isArr(saved.X)` list at index.html:2786–2796), add a line mirroring the others — place it right after `if(isArr(saved.pending))state.pending=saved.pending;` (index.html:2796):
```js
if(isArr(saved.goals))state.goals=saved.goals;
```
Bump `state.v=26` → `state.v=27` (index.html:2808), the footer string `KevinOS v0.26` → `KevinOS v0.27` (index.html:631), and `sw.js` line 2 `CACHE="kevinos-v0_26"` → `"kevinos-v0_27"`. No destructive migration needed (purely additive: old saved docs simply lack `goals`, the `isArr` guard leaves the default `[]`). Note the migration chain at index.html:2806–2807 (`if(prevV<4)seedDefaults(); if(prevV<5)seedPrompts();`) does NOT need a new branch — goals have no seed data; new users and migrating users both start with `[]`.

**Synced D1 doc:** Because `goals` is in `SYNC_ARRAYS`, `buildSyncDoc` (index.html:1213, copies every own-enumerable `state` key not in `SYNC_SKIP`) automatically includes it in the uploaded doc. The relay reads the same D1 doc (`SELECT doc FROM docs WHERE id = ?`, worker.js:777) and the new `weeklyDigest` extension (below) reads `doc.goals` directly — no schema registration anywhere, it's just another top-level key in the JSON.

### Relay changes
**No new route.** Extend the existing `POST /weekly` path (worker.js:1143) by enriching its digest. All changes are inside `weeklyDigest` / `weeklyDigestText` / `buildWeeklyReview` (worker.js:744–795). The app continues to POST the same body to `/weekly`; the app-supplied `context` already carries goals (see app changes), and the server-side D1 digest is extended so the cron path (closed app) also gets goals.

> **Verified reality of the two paths:** the live open-app call (`generateWeekly`, index.html:1026) sends `{emailSession, dateKey, tz, context, fallback}` and **does NOT send `syncKey`** — so the open-app weekly relies entirely on the app-supplied `context` string (hence the mandatory `weeklyContextText` edit below). The cron path (`buildReminders`, index.html:1134) sends `syncKey:sk` on each `gen:"weekly"` reminder, so `firePush` (worker.js:501) calls `buildWeeklyReview({syncKey, emailSession, dateKey, fallback})` with NO `context` — that path reads the synced D1 doc and runs `weeklyDigestText(weeklyDigest(...))` (worker.js:778). Both paths must surface goals; that's why goals are added in **both** the app's `weeklyContextText` AND the relay's `weeklyDigest`/`weeklyDigestText`.

Changed functions in worker.js (modern ES — exempt from ES5):

1. **`weeklyDigest(doc, D)`** (worker.js:744) — add goals extraction after the `builds` line (worker.js:755), and add a `goals` field to the returned object (worker.js:756). The current return is:
   ```js
   return { nOpen: open.length, overdue: overdue.slice(0, 12), nOverdue: overdue.length, nEvents: evs.length, events: evs.slice(0, 12), dueWeek: dueWeek.slice(0, 12), builds: active.slice(0, 8) };
   ```
   Insert before the `return`:
   ```js
   const goals = Array.isArray(doc && doc.goals) ? doc.goals : [];
   const activeGoals = goals.filter((g) => g && g.status !== "done" && g.status !== "dropped");
   ```
   and add `goals: activeGoals.slice(0, 8)` to the returned object:
   ```js
   return { nOpen: open.length, overdue: overdue.slice(0, 12), nOverdue: overdue.length, nEvents: evs.length, events: evs.slice(0, 12), dueWeek: dueWeek.slice(0, 12), builds: active.slice(0, 8), goals: activeGoals.slice(0, 8) };
   ```

2. **`weeklyDigestText(wd, D)`** (worker.js:758) — before `return L.join("\n")` (worker.js:768), append a goals section mirroring the existing `In the studio:` block (worker.js:767):
   ```js
   if (wd.goals && wd.goals.length) {
     L.push("", "Quarterly goals:");
     wd.goals.forEach((g) => {
       const ck = Array.isArray(g.checkins) && g.checkins.length ? g.checkins[0] : null;
       const moved = ck && ck.weekKey === D && ck.progress !== g.progress ? " (moved this week)" : "";
       L.push("- " + (g.title || "(untitled)") + ": " + (typeof g.progress === "number" ? g.progress + "%" : "0%") +
         (g.target ? " toward " + g.target : "") + moved +
         (ck && ck.note ? " — note: " + ck.note : ""));
     });
   }
   ```
   **Caveat about the "moved this week" comparison (read carefully):** `D` here is the `dateKey` passed to `/weekly` (the app passes `dateKey:todayKey()`, the cron passes the Sunday `weekKey` of the reminder). A check-in's `ck.weekKey` is always a **Sunday** key (`weekStartKey(...)`). On the cron path `D` is also a Sunday key (`dateKey(new Date(wst))` where `wst=nextDowTime(0,17)`, i.e. a Sunday), so `ck.weekKey === D` can match. On the live open-app path `D` is `todayKey()` (the actual day, which is only a Sunday when run on Sunday), so `ck.weekKey === D` matches only when the user opens the app on the same Sunday they checked in. This is best-effort cosmetic flavor only — if it doesn't match, the goal/progress/note still surface; just without the "(moved this week)" suffix. Do not try to "fix" this by recomputing week starts server-side; the note text is the load-bearing signal.

3. **`buildWeeklyReview` system prompt** (worker.js:791) — extend the existing system string to instruct Gemini to weave goals in. Replace the current value:
   ```
   "You are Kevin's calm assistant inside KevinOS. It's Sunday evening. Write a SHORT weekly review — 3 to 5 sentences, warm and grounding — that orients him to the week ahead: the big rocks on the calendar, which priorities to protect time for, anything overdue to clear first, and one thing worth teeing up tonight. Plain text. No lists, no preamble, no greeting line, no sign-off."
   ```
   with exactly:
   ```
   "You are Kevin's calm assistant inside KevinOS. It's Sunday evening. Write a SHORT weekly review — 3 to 5 sentences, warm and grounding — that orients him to the week ahead: the big rocks on the calendar, which priorities to protect time for, anything overdue to clear first, and one thing worth teeing up tonight. If quarterly goals are listed, weave in one honest, specific line about goal momentum — name a goal he moved and encourage protecting time for one he hasn't. Plain text. No lists, no preamble, no greeting line, no sign-off."
   ```
   Keep the user-prompt line unchanged (worker.js:793: `"Here is my week ahead. Write my Sunday weekly review.\n\n" + lines.join("\n")`) and the `.slice(0, 520)` cap (worker.js:794) unchanged.

**Error/fallback:** unchanged — `buildWeeklyReview` already returns `opts.fallback` when `!env.GEMINI_API_KEY` (worker.js:772) or on any throw/empty text (worker.js:794–795). Goals digest is additive plain text; if `doc.goals` is missing, `weeklyDigest` yields `goals:[]` and `weeklyDigestText` omits the section.

**Env/secret/scope:** none new. Uses existing `GEMINI_API_KEY` and `SYNC` (D1) bindings. No new scopes. Optionally add `goals: true` to the `GET /` capability object (worker.js:849) — not required.

### App changes (index.html, ES5)
**New state vars (module-level ephemerals, declared near the other UI-scratch vars at index.html:690–700, reset on reload, NOT persisted):**
- `var editingGoalId="";` — id of the goal whose edit panel is open (mirrors `editingId`, index.html:691).
- (No separate `checkinDraft` object is needed — the check-in form reads its current values straight from the live inputs at save time via `$(...)` lookups keyed by goal id, exactly like `readDraftCard` in the email flow. Declaring an unused scratch var would violate the "no dead code" rule.)

**New constant** (in the constants block near index.html:664–665, next to `PROJECT_STATUS`/`BUILD_STAGES`):
- `var GOAL_STATUS=[{key:"active",label:"Active"},{key:"done",label:"Done"},{key:"dropped",label:"Dropped"}];` (mirrors `PROJECT_STATUS` index.html:664 / `BUILD_STAGES` index.html:665, which use `{key,...}` objects consumed by `selEl` index.html:734).

**New helper functions (signatures + behavior; place near the other room renderers, grouped with the build functions ~index.html:1995–2024):**
- `function findGoal(id){for(var i=0;i<state.goals.length;i++){if(state.goals[i].id===id)return state.goals[i];}return null;}` — mirror `findBuild` (index.html:1941) / `findItem` (index.html:768).
- `function addGoal(){var t=($("goalInput").value||"").trim();if(!t)return;state.goals.unshift({id:uid(),title:t,target:"",progress:0,status:"active",checkins:[],createdAt:Date.now()});$("goalInput").value="";renderGoals();save();}` — mirror `addBuild` (index.html:1995) exactly.
- `function goalProgressBar(p){var n=Math.max(0,Math.min(100,parseInt(p,10)||0));return '<div class="goal-bar"><span style="width:'+n+'%"></span></div>';}` — small clamp+markup helper used by both the goal card and the check-in card.
- `function goalCard(g){...}` — returns a DOM element for one goal (mirror `buildCard` index.html:2006, which returns a created element and is fed into `sectionWith`/appended). Build: a `.goal-card` container with `.goal-head` (title + `.goal-pct`), `.goal-target` line, the progress bar via `goalProgressBar(g.progress)`, an Edit button (`data-goal-edit="<id>"`), and — when `editingGoalId===g.id` — an `edit-panel` built with `field(...)` (index.html:731) + inputs + an optional status `selEl("gStatus",GOAL_STATUS,g.status)` (index.html:734) + `editActions("goal",g.id)` (index.html:735). All user text wrapped in `escapeHtml(...)` (index.html:729). Use `.innerHTML` for the static parts and `createElement`/`appendChild` for the panel, matching `buildCard`'s style.
- `function renderGoals(){var box=$("goalList");box.innerHTML="";if(!state.goals.length){box.innerHTML='<p class="empty">No goals yet. Add your first goal above.</p>';return;}var i;for(i=0;i<state.goals.length;i++)box.appendChild(goalCard(state.goals[i]));}` — mirror `renderBuilds` (index.html:2022) but a **flat list** (no stage/status buckets in v1). The empty-state markup mirrors `renderBuilds`'s `'<p class="empty">No builds yet. Add one above.</p>'`. (Optionally group by status with `sectionWith` index.html:1938 + `colorFor(GOAL_STATUS,...)` — but `GOAL_STATUS` objects have no `.color`, so a flat list is correct for v1; do not introduce a color field.)
- `function handleGoalsClick(e){...}` — event-delegated handler for the Goals room mount. Mirror `handleBuildsClick` (index.html:2023) and the edit-panel attribute pattern from `editActions` (`data-goal-save`/`data-goal-cancel`/`data-goal-delete`). Each branch uses `e.target.closest("[data-...]")`, reads the id from the attribute value, mutates, then re-renders. Cases:
  - `var ge=e.target.closest("[data-goal-edit]");if(ge){editingGoalId=ge.getAttribute("data-goal-edit");renderGoals();return;}`
  - `var gs=e.target.closest("[data-goal-save]");if(gs){var g=findGoal(gs.getAttribute("data-goal-save"));if(g){g.title=(pf(gs,"gTitle").value||"").trim()||g.title;g.target=(pf(gs,"gTarget").value||"").trim();g.progress=Math.max(0,Math.min(100,parseInt(pf(gs,"gProgress").value,10)||0));var st=pf(gs,"gStatus");if(st)g.status=st.value;}editingGoalId="";renderGoals();save();return;}` — uses `pf(button,id)` (index.html:703) to scope `#id` lookups to the nearest `.edit-panel`, exactly as `handleTaskListClick` does.
  - `if(e.target.closest("[data-goal-cancel]")){editingGoalId="";renderGoals();return;}`
  - `var gd=e.target.closest("[data-goal-delete]");if(gd){var id=gd.getAttribute("data-goal-delete");state.goals=state.goals.filter(function(x){return x.id!==id;});editingGoalId="";renderGoals();save();return;}`
- `function checkinCardHTML(){...}` — returns the Weekly Check-In card HTML for the **Next** room. Returns `""` if `!state.goals.length`, OR if there are no active goals, OR if `state.weekly&&state.weekly.checkinWeek===weekStartKey(todayKey())` (already done this week). Otherwise builds a `.brief-card` (reusing the weekly card's class so it visually pairs) titled `🎯 Weekly Check-In` with subtitle "Did you move the needle?", one row per active goal showing `escapeHtml(g.title)`, current `g.progress+"%"`, a `<input class="inp" type="number" min="0" max="100" data-ci-prog="<id>" value="<progress>">`, and a `<input class="inp" type="text" placeholder="this week…" data-ci-note="<id>">`, plus a footer `<button class="add-btn" type="button" data-checkin-save="1">Save check-in</button>`. Build the active-goal list with a `for(var i=0;...)` loop filtering `g.status!=="done"&&g.status!=="dropped"`. Mirror `weeklyCardHTML` (index.html:1011–1018) for the card shell.
- `function saveCheckin(){...}` — for each active goal, read its inputs via `var pe=$("ciProg-"+g.id)` style lookups — **but** since attributes are `data-ci-prog="<id>"`, query them with `document.querySelector('[data-ci-prog="'+g.id+'"]')` (or, simpler, give each input a unique `id` like `id="ci-prog-"+g.id` in `checkinCardHTML` and use `$(...)`; pick one and be consistent). For each goal: `var n=Math.max(0,Math.min(100,parseInt(progEl.value,10)||0)); var note=(noteEl.value||"").trim(); g.checkins.unshift({weekKey:weekStartKey(todayKey()),date:todayKey(),progress:n,note:note}); g.progress=n;`. Then set `if(!state.weekly)state.weekly={weekKey:"",date:"",text:"",checkinWeek:""}; state.weekly.checkinWeek=weekStartKey(todayKey());`, then `renderNext(); save(); toast("Check-in saved ✓");`. **Use `save()` (index.html:705), NOT `persist()`** — `save()` schedules the cross-device push so the `goals` mutation syncs. (The `state.weekly.checkinWeek` change is in `SYNC_SKIP` and won't push, which is intended; the `goals` change in the same `save()` will.) Optionally call `generateWeekly(true)` (index.html:1020) after `save()` so the weekly narrative immediately reflects the new progress — only if `relayOn()`.

> **Decision: where the check-in inputs get their ids.** To keep `saveCheckin` simple and ES5-safe, give each input an `id` in `checkinCardHTML` (e.g. `'<input class="inp" type="number" id="ciProg-'+g.id+'" ...>'` and `'<input class="inp" type="text" id="ciNote-'+g.id+'" ...>'`) and read them with `$("ciProg-"+g.id)` / `$("ciNote-"+g.id)` (the `$` helper is the global `getElementById`). The `data-checkin-save` attribute on the button is still used for delegation. Do NOT rely on `pf()` here — the check-in card is in the Next room and is not wrapped in a single `.edit-panel`.

**`maybeAutoWeekly()`** (index.html:1030) — **no change needed**; it already regenerates the weekly text once per week keyed on `weekStartKey(todayKey())`. The check-in card's once-per-week gating is independent (`state.weekly.checkinWeek`).

**Render function HTML produced:**
- Goals room: a flat card list. Each goal card: `<div class="goal-card"><div class="goal-head"><strong>TITLE</strong> <span class="goal-pct">N%</span></div><div class="goal-target">TARGET</div>` + `goalProgressBar(progress)` + an Edit button + (when editing) an `edit-panel` with a title `<input class="inp">`, target `<input class="inp">`, progress `<input class="inp" type="number" min="0" max="100">`, optional status `selEl`, and `editActions("goal", g.id)`. All user text wrapped in `escapeHtml(...)`.
- Check-in card (in Next): a `.brief-card` titled `🎯 Weekly Check-In` with subtitle "Did you move the needle?", one row per active goal showing `escapeHtml(title)`, current `progress%`, a `<input type="number" id="ciProg-<id>">` and `<input type="text" placeholder="this week…" id="ciNote-<id>">`, and a footer `<button class="add-btn" type="button" data-checkin-save="1">Save check-in</button>`.

**Exact hook points:**
1. **Nav tab** (index.html `#nav`, 392–409): add `<button class="tab" type="button" data-room="goals">Goals</button>`. The existing `#nav` delegate (index.html:2400) routes `data-room="goals"` to `go("goals")` automatically — no wire-up change there.
2. **Room container** (after index.html:612, before `</main>`): add
   ```html
   <div class="room" id="room-goals">
     <div class="add-row"><input id="goalInput" class="inp" type="text" placeholder="New quarterly goal…"><button id="goalAddBtn" class="add-btn" type="button">Add</button></div>
     <div id="goalList"></div>
   </div>
   ```
   Mirror the `#room-prompts` add-row + list layout (index.html:602–610).
3. **`go(r)`** (index.html:2354–2373): (a) add `"goals"` to the room-div activation array at index.html:2359 (currently `["home","next","tasks","calendar","projects","studio","briefs","prompts","launchpad","notes","github","email"]`); (b) add `else if(r==="goals")renderGoals();` to the dispatch chain — insert it among the `else if` branches at index.html:2360–2371 (e.g. right after the `notes` branch at 2369).
4. **`syncRerender()`** (index.html:1241–1254): add `else if(room==="goals")renderGoals();` to the chain so incoming sync updates repaint the open Goals room. The `next` branch (index.html:1243: `else if(room==="next")renderNext();`) already re-renders the Next room on sync — and since `renderNext` now emits `checkinCardHTML()`, an incoming goals change mid-week will repaint the check-in card automatically. No extra Next handling needed.
5. **Render flow for the check-in card** — in `renderNext`, the cards are emitted at index.html:1050–1051 as `briefCardHTML()+ weeklyCardHTML()+`. Insert `checkinCardHTML()+` on the line **immediately after** `weeklyCardHTML()+` (so order is `briefCardHTML()+ weeklyCardHTML()+ checkinCardHTML()+ ...`) — this places the check-in card directly below the weekly review.
6. **Wire-up** (the `addEventListener` block, index.html ~2391+): add
   - `$("goalAddBtn").addEventListener("click",addGoal);`
   - `$("goalList").addEventListener("click",handleGoalsClick);`
   - The check-in card's Save button lives **inside the Next room mount (`#nextView`)**, whose click delegate is `handleNextClick` (index.html:1538). Add a branch there — place it alongside the existing `data-weekly-refresh` branch (index.html:1543): `if(e.target.closest("[data-checkin-save]")){saveCheckin();return;}`. Do NOT attach a one-off listener to the check-in button — `renderNext`'s `innerHTML` rewrite would drop it; delegation on `#nextView` survives re-renders.
7. **`weeklyContextText(dk)`** (index.html:993–1003): append a goals block so the **live (open-app)** `/weekly` call includes goals — this is **mandatory**, not optional, because `generateWeekly` does not send `syncKey` (so the relay cannot read the synced doc on the open-app path). Insert before `return L.join("\n")` (index.html:1002), after the builds block (index.html:1001):
   ```js
   var g=state.goals||[],ag=[],gi;for(gi=0;gi<g.length;gi++){if(g[gi]&&g[gi].status!=="done"&&g[gi].status!=="dropped")ag.push(g[gi]);}
   if(ag.length){L.push("","Quarterly goals:");for(gi=0;gi<ag.length;gi++){var gg=ag[gi];L.push("- "+(gg.title||"(untitled)")+": "+(gg.progress||0)+"%"+(gg.target?" toward "+gg.target:""));}}
   ```
   (ES5 — `var`, `for`, string concat; mirrors the existing `L.push` list-building in `weeklyContextText`.)

**Mirror-this summary (all verified to exist):** Goals room CRUD → mirror **`addBuild`** (index.html:1995), **`buildCard`** (index.html:2006), **`renderBuilds`** (index.html:2022), **`handleBuildsClick`** (index.html:2023), **`findBuild`** (index.html:1941). Edit panel → mirror **`editActions`** (index.html:735), **`pf()`** (index.html:703), **`field()`** (index.html:731), **`selEl()`** (index.html:734), and the edit-attr dispatch in **`handleTaskListClick`** (index.html:865). Check-in card → mirror **`weeklyCardHTML`** (index.html:1011) for the `.brief-card` shell. Relay digest → mirror the **`builds` / "In the studio:"** block in **`weeklyDigest`** (worker.js:755) / **`weeklyDigestText`** (worker.js:767).

### ES5 compliance
- **No template literals** in any new render string — use `'...'+escapeHtml(x)+'...'` string concatenation (the codebase does this everywhere, e.g. `editActions` index.html:735, `weeklyCardHTML` index.html:1018).
- **No arrow functions** — all callbacks are `function(){...}`. New app loops over goals use `for(var i=0;...)` or `arr.forEach(function(g){...})`, never `arr.map(g=>...)`.
- **No `const`/`let`** — declare every new app var with `var` (`editingGoalId`, `GOAL_STATUS`, all loop counters).
- **No destructuring / spread / async-await** in app code. The relay digest edits (worker.js) MAY use `const`/arrow/`.filter`/`.forEach` — `worker.js` is an ES-module Worker and is **exempt** from the ES5 rule (Rules of the Road §1).
- **Number clamping** in ES5: `Math.max(0,Math.min(100,parseInt(v,10)||0))` — the `||0` guards `NaN` from empty/blank number inputs. Use this in `goalProgressBar`, the `data-goal-save` branch, and `saveCheckin`.
- **No `Number.isInteger` / `Array.prototype.find`** — use `parseInt` and a `for` loop for lookups (mirror `findItem` index.html:768 / `findBuild` index.html:1941).
- **Reading edit-panel inputs** in the Goals room: use `pf(button,id)` (index.html:703), which scopes `#id` to the nearest `.edit-panel`, exactly as `handleTaskListClick` does. The check-in card inputs (in Next, not in an `.edit-panel`) use plain `$("ciProg-"+id)` / `$("ciNote-"+id)`.
- **`sw.js` is also ES5** — but the only `sw.js` change here is the `CACHE` version string bump (line 2), which is ES5-safe.
- Self-check the `index.html` and `sw.js` diff for `=>`, backticks, `const `, `let `, `async`, `await`, `...`, `class ` before saving (per Rules of the Road §1). The `worker.js` diff is exempt.

### Styling
Reuse the existing card/palette system (Rules §7); all new CSS goes into the single `<style>` block (index.html:13–~385), next to the build/brief card rules. No hardcoded hex except inside `linear-gradient(...)` where the codebase already does so (e.g. `weeklyCardHTML` index.html:1018 uses `rgba(...)` literals in an inline gradient) — prefer CSS variables in the stylesheet block.

- **Goal card** (`.goal-card`): copy the standard card surface — `background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); padding:14px; margin-bottom:10px;` plus the hover lift (`transition:transform .14s ease, box-shadow .16s ease;` + `.goal-card:hover{transform:translateY(-1px);box-shadow:var(--shadow)}`).
- **Goal head** (`.goal-head`): flex row, `justify-content:space-between; align-items:baseline;`. `.goal-pct` right-aligned, `color:var(--accent)`, 11px uppercase letter-spaced like `.section-label`.
- **Target line** (`.goal-target`): `font-family:var(--font-serif); font-style:italic; color:var(--ink-soft); font-size:13px;`.
- **Progress bar** (`.goal-bar`): `height:8px; border-radius:999px; background:var(--accent-soft); overflow:hidden; margin-top:8px;`; the fill `.goal-bar>span{display:block;height:100%;background:linear-gradient(135deg,var(--accent),var(--gold));border-radius:999px;}` — uses the signature purple→gold gradient.
- **Check-in card**: reuse the `.brief-card` class (the same warm card the weekly review uses, index.html:1018) so it visually pairs with the weekly review directly above it. Title row gets the `🎯` glyph. Each goal row: small flex layout; the number input `.inp` width-capped (e.g. add a modifier rule `.ci-prog{width:64px}` and put `class="inp ci-prog"` on it), note input `.inp` flexes to fill. Empty/clear states use `.empty` (serif italic, `--ink-faint`).
- Keep transition timings in the .12–.25s range already used.

### Verification
1. **Relay syntax:** `cd /Users/kevin/KevinOS/app/relay && node --check worker.js` → PASS = no output, exit 0.
2. **Live weekly route (text/context path — no sync key, mirrors the open-app call):**
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/weekly \
     -H "Content-Type: application/json" \
     -d '{"dateKey":"2026-06-28","context":"Week starting: 2026-06-28\nOpen tasks: 4 (1 overdue)\n\nQuarterly goals:\n- Ship KevinOS v1.0: 60% toward public launch\n- Read 12 books: 25% toward 12 books","fallback":"Quiet week ahead."}'
   ```
   PASS = JSON `{"ok":true,"text":"..."}` where `text` mentions a goal by name (e.g. references shipping v1.0 momentum). NOTE: if `GEMINI_API_KEY` is unset on the relay, `buildWeeklyReview` returns the `fallback` string verbatim — still `{"ok":true,"text":"Quiet week ahead."}`. Since the relay holds the key in production, expect a real Gemini sentence. (This curl exercises the app's open-app path because the app sends `context`, not `syncKey`.)
3. **Sync-doc path (cron parity — proves `weeklyDigest`/`weeklyDigestText` read `doc.goals`):** requires a real test sync passphrase already populated in D1 whose stored doc contains a `goals` array. The `key`/`syncKey` must match the regex `/^[a-f0-9]{16,128}$/` (lowercase hex, 16–128 chars). POST with NO `context`:
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/weekly \
     -H "Content-Type: application/json" \
     -d '{"syncKey":"<your-real-hex-sync-id>","dateKey":"2026-06-28","fallback":"x"}'
   ```
   PASS = the returned `text` references a goal that exists only in the synced doc (not in any `context`), proving the server-side digest read `doc.goals`. If you don't have a populated test key, skip this and rely on #2 + the two-device app test (#5).
4. **App preview:** serve `app/` (`python3 -m http.server` from `/Users/kevin/KevinOS/app`), open it:
   - Click the **Goals** tab → empty state "No goals yet. Add your first goal above." shows. Add a goal → card appears with a 0% bar.
   - Tap the card's Edit button → edit panel opens; set target + progress=50, Save → bar fills to ~50%, the `%` shows 50.
   - Reload the page → goal persists (localStorage). PASS.
   - Go to **Next** → the **Weekly Check-In** card appears below the weekly review (only when active goals exist and `state.weekly.checkinWeek` ≠ this week's `weekStartKey`). Bump a goal's progress, add a note, **Save check-in** → toast "Check-in saved ✓", card disappears (won't re-nag), goal `progress` updated. Verify in DevTools console: `JSON.parse(localStorage["kevinos:v1"]).goals[0].checkins[0]` is populated with `{weekKey,date,progress,note}`.
5. **Sync:** with two browser profiles connected to the same sync passphrase (and the relay reachable), add/edit a goal in one → after the ~2s debounced push (`scheduleSyncPush`, index.html:1288) it appears in the other (confirms `SYNC_ARRAYS` membership and `mergeById`).
6. **Version lockstep:** confirm the footer reads `v0.27` (index.html:631), `sw.js` line 2 `CACHE` is `kevinos-v0_27`, and `state.v` stamps `27` (index.html:2808). Verify the live `state.v`: DevTools console `JSON.parse(localStorage["kevinos:v1"]).v` → `27`.

### Acceptance criteria
- [ ] `Goals` tab exists in `#nav` and routes to `#room-goals` via `go("goals")` (room key added to the activation array at index.html:2359 and an `else if(r==="goals")renderGoals();` branch in `go`).
- [ ] Goals room renders an add-row + list; adding a goal creates `{id,title,target:"",progress:0,status:"active",checkins:[],createdAt}` and calls `save()`.
- [ ] Tapping a goal's Edit button opens an edit panel; saving updates title/target/progress (progress clamped 0–100) and repaints.
- [ ] Deleting a goal removes it and persists via `save()`.
- [ ] `goals` is in `SYNC_ARRAYS` (index.html:1214), NOT in `SYNC_SKIP`; edits propagate cross-device within ~2s.
- [ ] Bootstrap restores `goals` via `if(isArr(saved.goals))state.goals=saved.goals;` (index.html:2796 area).
- [ ] `state.v=27` (index.html:2808), footer `KevinOS v0.27` (index.html:631), `sw.js` line 2 `CACHE="kevinos-v0_27"`.
- [ ] A Weekly Check-In card appears in the Next room directly below the weekly review (emitted in `renderNext` right after `weeklyCardHTML()` at index.html:1050–1051), once per week, only when active goals exist.
- [ ] Saving a check-in records `{weekKey,date,progress,note}` into each active goal's `checkins[]` (front of array), updates `g.progress`, sets `state.weekly.checkinWeek`, calls `save()`, toasts "Check-in saved ✓", and the card stops rendering for that week.
- [ ] The check-in Save button is handled via the existing `handleNextClick` delegate (a `data-checkin-save` branch added at index.html:1543 area) — no one-off listener.
- [ ] `node --check worker.js` passes.
- [ ] `weeklyDigest` returns a `goals` field and `weeklyDigestText` emits a "Quarterly goals:" section read from `doc.goals`; the `/weekly` system prompt (worker.js:791) instructs Gemini to weave in goal momentum.
- [ ] `weeklyContextText(dk)` (index.html:993) appends a "Quarterly goals:" block so the open-app `/weekly` call (which sends no `syncKey`) includes goals.
- [ ] A `curl` to `/weekly` with goals in `context` returns a review that references a goal by name (verification #2).
- [ ] No ES5 violations in `index.html`/`sw.js` (no `=>`, backticks, `const`/`let`, `async`/`await`, spread, `class`). `worker.js` is exempt.

### Edge cases & gotchas
- **`save()` vs `persist()`:** goal mutations and check-in saves MUST use `save()` (index.html:705 — writes localStorage + `scheduleReminderSync()` + `scheduleSyncPush()`) so they sync. Using `persist()` (index.html:706 — local-only, no push) would silently break cross-device sync for goals. `state.weekly.checkinWeek` itself is in `SYNC_SKIP` so it won't push, but the `goals` change in the same `save()` will — correct.
- **Empty/NaN inputs:** `type="number"` inputs return `""` when blank; always `parseInt(v,10)||0` then clamp `Math.max(0,Math.min(100,...))`. Never let `progress` go negative or above 100 (breaks the bar width).
- **`generateWeekly` sends no `syncKey`:** this is the single most important relay-side reality. The open-app weekly enrichment depends entirely on the `weeklyContextText` edit (hook point 7) — if you skip that edit, goals will appear in the closed-app push (cron reads D1) but NOT in the live in-app weekly card. Do not omit the app-side context edit.
- **Check-in re-nag gating is device-local:** `checkinWeek` lives in `state.weekly` (SYNC_SKIP), so if Kevin does the check-in on his laptop, his phone may still show the prompt that week. Acceptable v1 behavior — completing it again just appends another `checkins[]` entry. If duplicate weekly check-ins are undesirable, optionally dedupe in `saveCheckin` by checking `g.checkins[0]&&g.checkins[0].weekKey===weekStartKey(todayKey())` before unshifting.
- **Sync conflict on `checkins`:** `mergeById` (index.html:1225) merges goals by `.id` with the remote/cloud copy winning shared ids (`mergeRemoteDoc`, index.html:1234) — a concurrent edit on two devices could drop one device's just-added `checkins` entry. Acceptable; goals are low-churn. Do NOT attempt sub-array merge of `checkins`.
- **`state.weekly` is rebuilt, not merged:** `generateWeekly` (index.html:1027) assigns `state.weekly={weekKey,date,text}` wholesale — it does not preserve `checkinWeek`. Because `saveCheckin` runs at a different time and re-asserts `state.weekly.checkinWeek`, and a weekly regeneration in the same week doesn't clear the check-in record (which lives on the goals), this is fine. But never assume `state.weekly` retains arbitrary sub-fields across a `generateWeekly` call.
- **Offline/PWA:** all goal CRUD works offline (localStorage); the weekly narrative enrichment requires the relay + Gemini and degrades to the deterministic `weeklyBodyShort` fallback (index.html:1004) when offline or `GEMINI_API_KEY` unset.
- **Empty state:** if no goals (or no active goals), `checkinCardHTML` returns `""` (never renders) and `weeklyDigest` yields `goals:[]` so the digest omits the section — Gemini won't fabricate goal lines because the prompt says "If quarterly goals are listed."
- **Privacy:** goal text is personal — it syncs through D1 (exactly how all `state` arrays already sync) and is sent to Gemini via the relay only as part of the weekly context, consistent with tasks/events already sent. No new exposure surface, no new secret, no new scope.
- **Re-render listeners:** the check-in Save button is inside the `#nextView` mount, so it relies on `handleNextClick` delegation — do NOT attach a one-off `addEventListener` that `renderNext`'s `innerHTML` rewrite would drop.

### Effort & dependencies
**Size: M.** Mostly additive app data-model + one room + one inline card, plus a small relay digest/prompt extension (no new route, no new env/scope/secret).

**Must exist first:** the Weekly Review feature (`state.weekly`, `generateWeekly` index.html:1020, `maybeAutoWeekly` index.html:1030, `weeklyContextText` index.html:993, relay `/weekly` worker.js:1143 + `buildWeeklyReview` worker.js:770) — all already shipped and present in the codebase, so no blocking dependencies. The sync engine (`SYNC_ARRAYS` index.html:1214 / `mergeById` index.html:1225) is already in place. The build-room CRUD pattern being mirrored (`addBuild`/`buildCard`/`renderBuilds`/`handleBuildsClick`) is present and verified.

**Out of scope / future:** goal sub-tasks or linking tasks to goals; goal history charts / progress-over-time visualization; numeric (non-percentage) metric types with units; quarter rollover / archiving completed quarters; a dedicated `gen:"checkin"` push reminder (the Sunday weekly push already covers the moment — a separate check-in nudge can be added later by mirroring the `gen:"weekly"` reminder pattern in `buildReminders` index.html:1134 + `firePush` worker.js:501); status-bucketed goal grouping (Active/Done/Dropped sections via `sectionWith`); reordering/prioritizing goals via drag.

---

## 10. 🌅 Morning Launch Sequence

### Mission
A single cinematic "Start My Day" room that fuses today's calendar agenda, an inbox triage summary, top tasks for today, the daily Brief narrative, and a habit check-in into one scrollable flow, topped by an AI-narrated game plan from Gemini ("Here's your day: 3 meetings, 2 emails need you, top focus is X"). Done looks like: Kevin taps **Launch** in the nav, sees a warm full-screen briefing assembled from every connected source, reads the narration, checks off habits inline, and one-taps into any underlying room — with every missing dependency degrading to a quiet, non-broken placeholder.

### Why it matters
It is the boss feature: one ritual screen that turns five scattered surfaces into a single motivating morning launch, the reason Kevin opens KevinOS first thing every day.

### User flow
1. Kevin opens KevinOS and taps the **🌅 Launch** tab in `#nav` (or a Home "Start My Day" deep-link button).
2. The `#nav` click delegate at index.html:2400 calls `go("launch")`, which activates `#room-launch` and calls `renderLaunch()`.
3. The room paints immediately from local state in source order: a greeting header ("Good morning, Kevin · Saturday, Jun 27"), then five stacked **section cards**: **Game plan** (narration), **Today** (calendar agenda), **Inbox** (triage counts + top "needs you"), **Top focus** (today's tasks from Next), and **Habits** (today's check-in row).
4. The Game-plan card shows the deterministic one-liner instantly, then — if the relay is connected and it hasn't already run today — auto-fires `generateLaunch(false)`, swapping in the Gemini narration when it resolves ("writing your game plan…" while busy).
5. If Gmail is connected, the Inbox card reads already-loaded `emailThreads` for triage counts and lists the top 1–3 `primary`/needs-you subjects; tapping one deep-links to the Email room. (Thread loading is primed via the existing `loadThreads`/`emailThreads` pipeline — see "App changes" and "Edge cases".)
6. Kevin taps habit pills in the Habits card to mark today done — each tap mutates `state.items` (Habits #5) and re-renders inline without leaving the room.
7. Each section card has a "›" deep-link chip routing to its source room (`calendar`, `email`, `next`, habits room). A ↻ button on the Game-plan card forces a fresh narration.
8. Any dependency not built or not connected renders a graceful placeholder ("Calendar not set up yet", "Connect AI for a narrated game plan") instead of erroring; the room never blanks.

### Data model
New `state` field. Add it to the `state` literal at **index.html:689** (mirror the existing `brief:{date:"",text:""}` member, which sits between `email:{...}` and `weekly:{...}` on that line):

```js
launch:{date:"",text:""}    // date = todayKey() the narration was generated for; text = Gemini game-plan
```

- **Device-local, NOT synced.** Add `launch:1` to **`SYNC_SKIP`** (index.html:1201, currently `var SYNC_SKIP={github:1,relay:1,push:1,sync:1,email:1,brief:1,weekly:1,v:1};`) right alongside `brief:1`/`weekly:1` — it is AI-generated transient text, exactly like the brief. **Justification:** `buildSyncDoc` (index.html:1213) copies every own-enumerable `state` key *except* those in `SYNC_SKIP`, so adding `launch:1` is sufficient to keep it off the wire; `applySyncDoc` (1217) and `mergeRemoteDoc` (1236) only ever touch keys in `SYNC_ARRAYS`, so a skipped scalar object like `launch` is never read back from a pulled doc either. Do **not** add `launch` to **`SYNC_ARRAYS`** (index.html:1214) — it is not an id-keyed collection.
- **localStorage / versioning:** bump `state.v` to `27` at bootstrap (index.html:**2808**, currently `state.v=26;`), the footer string to `KevinOS v0.27` (index.html:**631**, currently `KevinOS v0.26`), and the SW cache to `kevinos-v0_27` (sw.js:**2**, currently `var CACHE = "kevinos-v0_26";`). Add a restore branch in the bootstrap `store.load` block **next to line 2803** (`if(saved.brief&&typeof saved.brief==="object")state.brief=saved.brief;`), matching that exact form:
  ```js
  if(saved.launch&&typeof saved.launch==="object")state.launch=saved.launch;
  ```
  (Use the `typeof ... ==="object"` guard like `brief`/`weekly`/`email` do — not a bare `if(saved.launch)`.) No migration logic needed: an absent `launch` is fine because `renderLaunch` tolerates the literal `{date:"",text:""}` default. Note the bootstrap restore block (the one ending at line 2804) is the *normal load* path; there is a *separate* backup-import restore block ending around line 2730 that does **not** restore `brief`/`weekly`/`email` (it only restores `github`/`relay`/`push`/`v` and the synced arrays) — do **not** add `launch` there, to stay consistent with how `brief`/`weekly` are handled (not restored from a manual backup import).
- **Module-level ephemeral** (NOT in `state`, declared near `briefBusy` — see below — reset on reload): `var launchBusy=false;`. Grep for the real declaration site first: `LC_ALL=C grep -an "var briefBusy\|var weeklyBusy" index.html` and place `var launchBusy=false;` immediately beside it (the playbook's "line 692" is approximate; trust the grep).
- **Synced D1 doc:** the relay's `/launch` route reads the **existing** synced doc via `syncKey` (the same `SELECT doc FROM docs WHERE id = ?` path the brief uses at worker.js:711) — **no new fields are added to the synced doc**; it reuses `items`/`events` already present and digested by `briefDigest`/`briefDigestText` (worker.js:658/667).

### Relay changes
One new route, modeled exactly on `POST /brief` (worker.js:**1127–1138**) + `buildServerBrief` (worker.js:**704–730**). The "assemble" half is the digest of the synced doc + inbox peek; the "narrate" half is `callGemini`.

**`POST /launch`** — register the guard block **immediately after the `/weekly` block, which ends at worker.js:1154**, and before the 404 fall-through `return json({ error: "Not found" }, 404, origin);` at **worker.js:1343**. (worker.js is an ES module Cloudflare Worker and is **exempt** from the ES5 rule — use `const`/`async`/arrow/template literals freely, matching the surrounding code.)

Request JSON (mirror `/brief` — note the relay reads `syncKey`, `emailSession`, `dateKey`, `context`, `fallback`; it does **not** read `tz`, even though the app may include it harmlessly):
```json
{ "syncKey":"<hex 16-128, or ''>", "emailSession":"<gml session, or ''>",
  "dateKey":"YYYY-MM-DD", "context":"<app-built day digest text>",
  "fallback":"<deterministic one-liner>" }
```

Response JSON:
```json
{ "ok": true, "text": "<2-4 sentence game plan>" }
```

Implementation — add `async function buildLaunchPlan(env, opts)` placed next to `buildServerBrief` (after worker.js:730 is a clean spot). Mirror `buildServerBrief` (worker.js:704–730) line-for-line, including:
- `const fallback = (opts.fallback || "").toString();`
- `if (!env.GEMINI_API_KEY) return fallback;`
- the `context` resolution that, when `opts.context` is empty, reads the synced D1 doc guarded by `/^[a-f0-9]{16,128}$/.test(opts.syncKey) && env.SYNC` and digests it with `briefDigestText(briefDigest(JSON.parse(row.doc), opts.dateKey), opts.dateKey)` (worker.js:709–713 — reuse the brief digest verbatim; do not write a new digest);
- the optional `briefInbox(env, opts.emailSession)` unread+subjects peek (worker.js:716–717, 721–724);
- the early `if (!context && !inbox) return fallback;` (worker.js:718).

Differences vs the brief:

- **System prompt** (use verbatim):
  > You are Kevin's calm, motivating morning launch coach. You are given his calendar, tasks, and inbox for today. Write a SHORT spoken-style game plan — 2 to 4 sentences — that opens by naming the shape of the day ("Here's your day: 3 meetings, 2 emails need you"), then names the single most important focus, then ends with one steadying line. Be concrete and use the real numbers and titles given. Warm and direct, never corporate. Plain text only. No lists, no preamble, no greeting line, no sign-off.

- **User prompt** (use verbatim): `"Here is my day. Write my launch game plan.\n\n" + lines.join("\n")` where `lines` is built exactly as in `buildServerBrief` (context first, then `lines.push("", "Inbox: " + inbox.unread + " unread");` and one `lines.push("- from " + (s.from || "?") + ": " + (s.subject || "(no subject)"));` per subject — copy the exact null-guards from worker.js:721–724).
- **Output cap:** `.slice(0, 400)` (between the brief's 350 and weekly's 520). Final line mirrors worker.js:728: `return text && text.trim() ? text.trim().slice(0, 400) : fallback;` inside the same `try { ... } catch (e) { return fallback; }` wrapper.

- **Route handler body** (after the `/weekly` block):
  ```js
  if (request.method === "POST" && url.pathname === "/launch") {
    let payload;
    try { payload = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400, origin); }
    const text = await buildLaunchPlan(env, {
      syncKey: (payload && payload.syncKey) || "",
      emailSession: (payload && payload.emailSession) || "",
      dateKey: (payload && payload.dateKey) || "",
      context: (payload && payload.context) || "",
      fallback: (payload && payload.fallback) || "",
    });
    return json({ ok: true, text }, 200, origin);
  }
  ```
  `origin` is already in scope inside `fetch` (computed at the top of the handler from `env.ALLOW_ORIGIN || "*"`); `json` is the wrapper at worker.js:44. Do not recompute either.

**Error/fallback:** identical to `buildServerBrief` — `buildLaunchPlan` returns `opts.fallback` on missing `GEMINI_API_KEY`, on empty context *and* empty inbox, or on any `callGemini` throw (the `try/catch`). The route therefore **never 500s on a provider error** — it returns `{ok:true,text:fallback}`. The route returns 400 **only** on a malformed JSON body.

**Env/secret/scope:** reuses `GEMINI_API_KEY` and the existing `SYNC` (D1) + `PUSH` (KV, used by `briefInbox` → `gml:<session>`) bindings. **No new secret, no new scope, no new env var, no `wrangler.toml` change.**

**(Optional) Health probe:** add `launch: !!env.GEMINI_API_KEY` to the `GET /` capability object at **worker.js:849** (the object literal that currently ends `...extract: !!env.GEMINI_API_KEY, email: !!env.GOOGLE_CLIENT_ID }`).

**(Cron — OUT OF SCOPE for v1):** no `gen:"launch"` reminder is added; the Launch narration is on-demand only (the existing `gen:"brief"` push already covers the morning notification). Noted as future work below.

### App changes (index.html, ES5)

> **ES5 only** for everything in `index.html`. The brief/weekly stack you are mirroring (`generateBrief`, `briefCardHTML`, etc.) is already pure ES5 — `var`, `function(){}` callbacks, string concatenation. Copy that form. Some email helpers in the file use arrow functions; **do not** copy those — mirror the brief stack, which is the ES5-correct exemplar.

**New module-level var:** `var launchBusy=false;` next to `var briefBusy`/`var weeklyBusy` (grep to find the exact line, see Data model).

**New helper functions** (place near the brief helpers at index.html:942–981; mirror the named brief fn for each):

- `function launchGreeting()` → returns a salutation chosen by local hour plus `" · "` + `briefDateLine(todayKey())`. Build it in ES5:
  ```js
  function launchGreeting(){
    var h=new Date().getHours();
    var sal=h<12?"Good morning, Kevin":(h<18?"Good afternoon, Kevin":"Good evening, Kevin");
    return sal+" · "+briefDateLine(todayKey());
  }
  ```
  (`briefDateLine` at index.html:960 returns e.g. `"Saturday · Jun 27"`; reuse it rather than re-deriving a date string.)
- `function launchContextText(dk)` → the plain-text day digest fed to Gemini as `context`. **Reuse `briefContextText(dk)` directly** (index.html:951) — do not duplicate; the launch context is the same tasks+events digest. (You may simply pass `briefContextText(dk)` at the call site and skip defining `launchContextText` at all.)
- `function launchBodyShort(dk)` → deterministic one-liner fallback. **Reuse `briefBodyShort(dk)`** (index.html:942). If a launch-flavored line is wanted, define a thin wrapper: `function launchBodyShort(dk){var s=briefBodyShort(dk);return s.indexOf("Clear day")===0?s:"Here's your day: "+s;}` (optional; plain `briefBodyShort` is acceptable for v1).
- `function generateLaunch(force)` → mirror `generateBrief` (index.html:969–980) exactly, swapping `brief`→`launch`, `briefBusy`→`launchBusy`, `renderNext`→`renderLaunch`, and the route to `/launch`:
  ```js
  function generateLaunch(force){
    var base=relayBase();if(!base)return;
    var dk=todayKey(),d=dayDigest(dk);
    var es=(state.email&&state.email.session&&state.email.accounts&&state.email.accounts.length)?state.email.session:"";
    if(!force&&!d.nTasks&&!d.nEvents&&!es){state.launch={date:dk,text:""};persist();renderLaunch();return;}
    if(launchBusy)return;launchBusy=true;renderLaunch();
    var tz="";try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"";}catch(e){}
    fetch(base+"/launch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({syncKey:(syncOn()?state.sync.key:""),emailSession:es,dateKey:dk,tz:tz,context:briefContextText(dk),fallback:briefBodyShort(dk)})}).then(function(r){return r.json();}).then(function(j){
      launchBusy=false;state.launch={date:dk,text:(j&&j.text)?j.text:""};persist();renderLaunch();
    }).catch(function(){launchBusy=false;state.launch={date:dk,text:""};persist();renderLaunch();});
  }
  ```
  Notes: (a) `generateBrief` does **not** send `syncKey` (the app always supplies `context`, so the relay's syncKey path is a no-op fallback). Sending `syncKey` here is harmless and slightly more robust if `context` is ever empty — keep it or drop it; either matches relay behavior. (b) `tz` is sent for parity with `generateBrief` but the relay ignores it; harmless. (c) **Use `persist()` not `save()`** — AI transient text must not schedule a cross-device push, exactly like `generateBrief` (line 978).
- `function maybeAutoLaunch()` → mirror `maybeAutoBrief` (index.html:981): `function maybeAutoLaunch(){if(room!=="launch"||!relayOn()||launchBusy)return;if(state.launch&&state.launch.date===todayKey())return;generateLaunch(false);}`

**Section-card HTML builders** (each returns an HTML string; mirror `briefCardHTML` index.html:961–968 for the busy→AI→fallback→connect pattern). Each is a `.launch-card` with a `.lc-head` row carrying a `.section-label` and a deep-link chip:

- `function launchPlanCardHTML()` → the narration card (a `.launch-card.plan`). If `launchBusy` → `'<span class="cq-prov">writing your game plan…</span>'`; else if `!relayOn()` → `'<div>'+escapeHtml(launchBodyShort(todayKey()))+'</div><p class="hint" style="margin-top:4px">Connect AI for a narrated game plan.</p>'` (mirror `briefCardHTML`'s `!relayOn()` branch at line 964, which uses class `hint`); else if `state.launch && state.launch.date===todayKey() && state.launch.text` → `'<div>'+escapeHtml(state.launch.text)+'</div>'`; else → `'<div>'+escapeHtml(launchBodyShort(todayKey()))+'</div>'`. The header includes a `data-launch-refresh="1"` ↻ button **only when `relayOn()`** — use `class="linklike"` (index.html:270), the exact class `briefCardHTML`'s ↻ button uses, not `.btn-ghost`.
- `function launchAgendaCardHTML()` → calendar agenda. **Depends on Calendar #3.** Guard with ES5 `typeof`: `if(typeof renderCalendar!=="function"||!state.events){return launchSectionPlaceholder("Today","Calendar not set up yet.","calendar");}`. Otherwise reuse `dayDigest(todayKey()).events` (index.html:940 returns a sorted `events` array for the day — do **not** re-filter `state.events` by hand; the digest already filters `e.date===dk` and sorts by time), and render each as `'<div class="lc-row">'+escapeHtml(e.time?fmtTime(e.time):"all day")+' · '+escapeHtml(e.title||"(untitled)")+'</div>'`; empty → `'<p class="empty">No events today.</p>'`. Header chip `data-goto="calendar"`.
- `function launchInboxCardHTML()` → triage summary. Guard on `emailOn()` (index.html:2467); if not connected → `launchSectionPlaceholder("Inbox","Connect Gmail in the Email room.","email")`. If `emailLoading` (the existing module ephemeral) → body `'<p class="empty">Loading inbox…</p>'`. If connected and loaded: bucket `emailThreads` by `category` (`primary`/`fyi`/`noise`, the same field `gmailInbox` sets and `renderEmail` groups on at index.html:2656) into counts, render `'<div class="lc-row">'+escapeHtml(c1)+' need you · '+escapeHtml(c2)+' FYI · '+escapeHtml(c3)+' noise</div>'`, then up to 3 `primary` rows `'<div class="lc-row">'+escapeHtml(emailFromName(m.from))+' — '+escapeHtml(m.subject||"(no subject)")+'</div>'` (use `emailFromName` at index.html:2608). Header chip `data-goto="email"`. This card only **reads** `emailThreads` — see "Edge cases" for priming.
- `function launchFocusCardHTML()` → today's top tasks. Reuse `dayDigest(todayKey()).tasks` (index.html:940 — the same task list the brief uses); render up to 3 with the area-dot pattern `'<div class="lc-row"><span class="dot" style="background:'+areaColor(t.area)+'"></span>'+escapeHtml(t.text)+'</div>'` (use `areaColor` at index.html:663). Empty → `'<p class="empty">No focus tasks set for today.</p>'`. Header chip `data-goto="next"`.
- `function launchHabitsCardHTML()` → habit check-in. **Depends on Habits #5.** Guard: `if(typeof renderHabits!=="function"){return launchSectionPlaceholder("Habits","Habits not built yet.","next");}` (use `"next"` as a safe fallback goto until Habits #5 registers its real room key; **update this chip to Habits #5's actual room key when #5 ships**). Otherwise build a row of habit pills from whatever shape Habits #5 exposes (e.g. `state.items` filtered to `it.habit===true`, or a `state.habits` array if #5 adds one — **guard with `typeof`/existence checks; Habits #5 owns that shape, do not hard-reference `state.habits`**); each pill carries `data-launch-habit="<id>"` and a done/undone visual class. Empty → `'<p class="empty">No habits yet.</p>'`.
- `function launchSectionPlaceholder(label, msg, goto)` → shared helper returning a `.launch-card` with a `.lc-head` (a `.section-label` of `label` plus a `data-goto="<goto>"` chip) and a `.empty` body of `escapeHtml(msg)`. Use for every degraded dependency so the chip still routes somewhere sensible.

**Main render function** `function renderLaunch()` (mirror `renderHome` index.html:904, which composes sub-renders into one mount):

```js
function renderLaunch(){
  var box=$("launchView");if(!box)return;
  box.innerHTML=
    '<div class="launch-greet">'+escapeHtml(launchGreeting())+'</div>'+
    launchPlanCardHTML()+launchAgendaCardHTML()+launchInboxCardHTML()+
    launchFocusCardHTML()+launchHabitsCardHTML();
  if(emailOn()&&!emailThreads.length&&!emailLoading)loadThreads(false);
  maybeAutoLaunch();
}
```
Call `maybeAutoLaunch()` **after** the paint (so the deterministic one-liner shows first, then the narration swaps in when `generateLaunch`'s callback re-renders), exactly as the Next room shows `briefCardHTML` then runs `maybeAutoBrief` at index.html:2361. Priming `loadThreads(false)` is harmless when already loaded (it early-returns on `emailLoading&&!force`); see "Edge cases" for the staleness note.

**Exact hook points:**

1. **Nav tab** (index.html `#nav` 392–409): add `<button class="tab" type="button" data-room="launch">🌅 Launch</button>`. The `#nav` delegate at **index.html:2400** routes it to `go("launch")` automatically — no wiring needed there.
2. **Room container** (add after the last room div, before `</main>`; mirror `#room-email`'s single-mount shape): `<div class="room" id="room-launch"><div id="launchView"></div></div>`.
3. **`go(r)` activation array** (index.html:**2359**, currently `["home","next","tasks","calendar","projects","studio","briefs","prompts","launchpad","notes","github","email"]`): add `"launch"` to the array.
4. **`go(r)` dispatch chain** (index.html:2360–2371): add `else if(r==="launch")renderLaunch();` (e.g. after the `email` branch at line 2371).
5. **`syncRerender()`** (index.html:**1241–1253**, currently ends with `renderSync();`): add `else if(room==="launch")renderLaunch();` into the chain (before the trailing `renderSync();`) so incoming sync updates (new events/tasks) repaint the open Launch room.
6. **Click delegation:** add one room-level listener in the wire-up block (search the wire-up region for the existing `$("emailView").addEventListener("click",handleEmailClick);` and add beside it): `$("launchView").addEventListener("click",handleLaunchClick);`
7. **Handler** `function handleLaunchClick(ev)` (mirror `handleEmailClick` index.html:2684 — but in ES5, `var` + `function`):
   ```js
   function handleLaunchClick(ev){
     var rf=ev.target.closest("[data-launch-refresh]");
     if(rf){generateLaunch(true);return;}
     var hp=ev.target.closest("[data-launch-habit]");
     if(hp){
       /* Habits #5 owns the toggle fn; call it, e.g. toggleHabit(hp.getAttribute("data-launch-habit")); */
       renderLaunch();save();return;
     }
   }
   ```
   `data-goto` chips need **no** branch here — they are wired globally by the `[data-goto]` handler at **index.html:2401**, which fires `go(this.dataset.goto)`. (Confirm that handler uses event delegation or is re-bound on render; if it binds per-element at init only, the chips inside the freshly-rendered `launchView` will still work because `go` is reached via the chip's own `data-goto` only if delegated — verify by grepping `data-goto` wiring at ~2401 and, if it is per-element, route the chips through `handleLaunchClick` instead with a `var g=ev.target.closest("[data-goto]"); if(g){go(g.getAttribute("data-goto"));return;}` branch. **Check this before relying on global goto wiring.**)
8. **(Optional Home deep-link):** add a "Start My Day" button to `renderHome`/`renderHomeToday` with `data-goto="launch"`.

**Mirror-this cheat sheet:** `state.launch`→`state.brief`; `launchBusy`→`briefBusy`; `generateLaunch`→`generateBrief`; `maybeAutoLaunch`→`maybeAutoBrief`; `launchPlanCardHTML`→`briefCardHTML`; `renderLaunch` composition→`renderHome`; `handleLaunchClick`→`handleEmailClick` (but ES5-style); room wiring→Playbook §7 "add a brand-new room" recipe.

### ES5 compliance
- **No template literals** in any new render string — concatenate with `+` and `var`. Every example above is already `'...'+escapeHtml(x)+'...'`.
- **No arrow functions** — `generateLaunch`'s fetch chain uses `.then(function(r){return r.json();}).then(function(j){...}).catch(function(){...})`, NOT `=>`. Match `generateBrief` (index.html:977–979) exactly. (Ignore the arrow-style email helpers in the file — they are not the pattern to copy.)
- **No `const`/`let`** — `var` only, including loop counters (`for(var i=0;i<n;i++)`).
- **No destructuring / spread** — read `j.text`, `m.from` etc. field-by-field.
- **Dependency guards must be ES5 `typeof` checks**: `if(typeof renderHabits!=="function"){...}` / `if(typeof renderCalendar!=="function"){...}` — no optional chaining (`?.`).
- **Web Speech (TTS) is future scope — do not ship in v1.** If later added, feature-detect in ES5 and wrap in try/catch: `if(window.speechSynthesis&&window.SpeechSynthesisUtterance){try{var u=new SpeechSynthesisUtterance(state.launch.text);window.speechSynthesis.speak(u);}catch(e){}}`.
- Always finish a data mutation (habit toggle) with **`save()`** (so it syncs); finish AI transient writes (`state.launch`) with **`persist()`** (no sync push).
- Self-check the `index.html` diff for `=>`, `` ` ``, `const `, `let `, `async`, `await`, `...`, `class ` (the JS keyword, not `class=` HTML attributes) before saving.

### Styling
Reuse the existing "calm cockpit" card system — do **not** invent new primitives. **Correction to the draft's assumption:** there is **no `.brief-card` CSS rule** in the stylesheet — the brief card is styled with **inline styles** on a `class="brief-card"` element (index.html:967). So you have two consistent options; pick one and be consistent:

- **Option A (match the brief exactly):** style the Launch cards with inline styles too, copying the brief card's inline gradient/padding. The brief card's actual inline style is:
  `background:linear-gradient(135deg,rgba(91,59,140,.10),rgba(184,144,31,.12));border-radius:14px;padding:14px;margin:2px 0 14px`.
- **Option B (add real CSS classes — recommended for five cards):** add a small CSS block to the `<style>` section (index.html 13–~640), placed near the other card rules (e.g. next to `.sweep-card` at line 97 or `.chip` at 60). Define:
  - `.launch-greet` — `font-family:var(--font-display);font-size:22px;color:var(--ink);margin:6px 0 14px;`
  - `.launch-card` — the card surface pattern: `background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:14px 16px;margin-bottom:12px;`
  - `.launch-card.plan` — the signature gradient so the narration card stands out. **Use the brief's actual gradient** (the soft translucent purple→gold, *not* the heavier `.sweep-card` hex): `background:linear-gradient(135deg,rgba(91,59,140,.10),rgba(184,144,31,.12));`
  - `.lc-head` — `display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;` (holds the `.section-label` and the right-aligned chip/↻).
  - `.lc-row` — one agenda/inbox/focus line: `padding:4px 0;color:var(--ink-soft);font-size:14px;display:flex;gap:8px;align-items:center;`
  - The narration text inside `.launch-card.plan` may use `font-family:var(--font-serif);font-style:italic;` for the quiet/reflective voice that briefs read in.

Reuse existing classes everywhere else (do not redefine them):
- `.section-label` (index.html:65) for each card title.
- `.empty` (index.html:68, serif italic `--ink-faint`) for empty/placeholder text.
- `.linklike` (index.html:270) for the ↻ refresh button (this is what `briefCardHTML` uses) and for the "›" deep-link chips, or `.btn-ghost` (index.html:124) for a slightly heavier text chip — either is consistent; `.linklike` matches the brief card.
- `.chip` (index.html:60, `border-radius:999px`) for habit pills; done state = `.chip.active` (white text, transparent border — line 62) or a custom `--accent-soft` background; undone = the base `.chip` (surface + `--line` border).
- `.dot` (index.html:76) for the area dots in the Focus card.
- `.cq-prov` for the busy "writing your game plan…" text (the class `briefCardHTML` uses at line 963 — grep to confirm its CSS exists before relying on it: `LC_ALL=C grep -an "\.cq-prov" index.html`).

### Verification
1. **Worker syntax:** `node --check /Users/kevin/KevinOS/app/relay/worker.js` → PASS = no output, exit 0.
2. **Live route smoke test (no client key needed; the relay holds `GEMINI_API_KEY`). Base URL is `https://kevinos-relay.kevinbigham.workers.dev`:**
   ```sh
   curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/launch \
     -H "Content-Type: application/json" \
     -d '{"dateKey":"2026-06-27","context":"Date: Saturday, June 27\n\nTasks for the day (2):\n- Ship Launch room\n- Call dentist\n\nEvents (1):\n- 9:00 AM — Swim meet","fallback":"Here'\''s your day: 2 to-dos, 1 event."}'
   ```
   PASS = JSON `{"ok":true,"text":"..."}` where `text` is a 2–4 sentence game plan referencing the swim meet / tasks (or, if `GEMINI_API_KEY` is unset on the relay, exactly the `fallback` string). **Run this only after `npx wrangler deploy` from `/Users/kevin/KevinOS/app/relay`** — the live Worker won't have the route until deployed.
3. **Fallback path:**
   - Empty body: `curl -s -X POST https://kevinos-relay.kevinbigham.workers.dev/launch -H "Content-Type: application/json" -d '{}'` → PASS = `{"ok":true,"text":""}` (no context, no inbox → `buildLaunchPlan` returns the empty `fallback`).
   - Malformed JSON: `curl -s -o /dev/null -w "%{http_code}\n" -X POST https://kevinos-relay.kevinbigham.workers.dev/launch -H "Content-Type: application/json" -d 'notjson'` → PASS = `400`.
4. **Health probe (only if the optional capability flag was added):** `curl -s https://kevinos-relay.kevinbigham.workers.dev/ | grep -o '"launch":[a-z]*'` → shows `"launch":true`.
5. **App preview:** from `/Users/kevin/KevinOS/app` run `python3 -m http.server 8080`, open `http://localhost:8080/index.html`, hard-refresh (Cmd-Shift-R).
   - Click the **🌅 Launch** tab → room appears with greeting + 5 cards, no console errors.
   - With relay connected (set the relay URL in the app first): Game-plan card shows "writing your game plan…" then a narration; ↻ regenerates it.
   - Without relay: Game-plan card shows the deterministic one-liner + the "Connect AI" hint; no error, no stuck spinner.
   - With Calendar #3 / Habits #5 absent: those two cards show "Calendar not set up yet." / "Habits not built yet." placeholders; the other three still render.
   - Tap a section "›" chip → routes to `calendar`/`email`/`next`.
6. **ES5 lint on the diff** (zero hits = PASS): inspect only the new `index.html` lines for `=>`, backtick, `const `, `let `, `async `, `await `, `...`, and `class ` used as a JS keyword. (Do not match `class=` HTML attributes.)

### Acceptance criteria
- [ ] `🌅 Launch` tab in `#nav` opens `#room-launch` via `go("launch")` → `renderLaunch()`.
- [ ] `state.launch={date:"",text:""}` added to the state literal (index.html:689), restored in the normal-load bootstrap block with the `typeof ... ==="object"` guard (beside line 2803), listed in `SYNC_SKIP` (index.html:1201), and **never** in `SYNC_ARRAYS`.
- [ ] `POST /launch` exists on the relay (after the `/weekly` block, before the 404 at worker.js:1343), via `buildLaunchPlan` cloned from `buildServerBrief`, returns `{ok,text}`, and falls back to `fallback` on missing key / empty context+inbox / any Gemini throw (no 500 on provider failure; 400 only on bad JSON).
- [ ] `/launch` uses the exact system + user prompt text specified above and caps output at `.slice(0,400)`.
- [ ] Game-plan card auto-narrates once per day (`state.launch.date===todayKey()` gate via `maybeAutoLaunch`) and re-narrates on ↻ (`data-launch-refresh` → `generateLaunch(true)`).
- [ ] All five section cards render; Calendar and Habits cards show graceful `typeof`-guarded placeholders when #3/#5 are not built.
- [ ] Inbox card reuses `emailThreads`/`emailOn()`/`emailFromName`/`category` grouping; Agenda card reuses `dayDigest().events`; Focus card reuses `dayDigest().tasks` — no duplicated email/task/event fetch or filter logic.
- [ ] Section deep-link chips (`data-goto`) route to `calendar`/`email`/`next`/(habits room) — verified to fire whether goto wiring is global (index.html:2401) or routed through `handleLaunchClick`.
- [ ] Habit pills (`data-launch-habit`) toggle today's habit via the Habits #5 mutation fn and finish with `save()`.
- [ ] AI text writes use `persist()`; habit mutations use `save()`.
- [ ] `state.v` bumped to 27 (index.html:2808), footer `KevinOS v0.27` (index.html:631), SW cache `kevinos-v0_27` (sw.js:2) — all three in lock-step.
- [ ] `node --check relay/worker.js` passes; ES5 grep on the `index.html` diff is clean.

### Edge cases & gotchas
- **Async save timing:** `generateLaunch` uses `persist()` (no sync push) like `generateBrief` (index.html:978); never use `save()` for the narration or it will schedule needless cross-device pushes (`scheduleSyncPush`) for device-local text.
- **Once-per-day gate:** `maybeAutoLaunch` keys on `state.launch.date===todayKey()`. Because `state.launch` is in `SYNC_SKIP`, each device narrates its own launch once per day — correct, do not "fix" by syncing it.
- **Inbox staleness:** `loadThreads` (index.html:2566) re-renders the **Email** room via its own success callback, not Launch. So after `renderLaunch` primes `loadThreads(false)`, the Launch inbox card stays on its "Loading inbox…" / empty state until the next `renderLaunch`. **Recommended fix:** in `loadThreads`'s success branch (where it currently calls `renderEmail()`), add `if(room==="launch")renderLaunch();` so the inbox card fills in place. If you skip that, the card fills on the next Launch entry — acceptable for v1 but visibly stale on first paint. Do **not** block the whole `renderLaunch` on the email fetch.
- **Per-message account routing:** the inbox card only *reads* `emailThreads` (which already carry per-message `.account` from `gmailInbox`), so `acctForId` is **not** needed here. If you later add inline archive/draft from Launch, you MUST route via `acctForId(id)` (index.html:2473) like the Email room.
- **Dependency build order:** the room is shippable **before** Calendar #3 and Habits #5 exist — its `typeof renderCalendar`/`typeof renderHabits` guards degrade those two cards. Do **not** hard-reference `state.habits` without a guard; Habits #5 owns that shape and may key habits inside `state.items` instead.
- **`data-goto` wiring assumption:** the Playbook says `[data-goto]` is wired at index.html:2401. Verify whether that wiring is a delegated listener (works for dynamically-rendered chips) or per-element binding at init (would miss chips rendered into `launchView` later). If per-element, add a `[data-goto]` branch inside `handleLaunchClick` (see hook point 7). This is the single most likely cold-implementer trip-up — confirm it.
- **Offline / PWA:** with no relay reachable, `generateLaunch` early-outs on `!relayBase()` and the card shows the deterministic `launchBodyShort` — never a stuck spinner. The room must fully render from local `state` alone.
- **Empty day:** zero tasks + zero events + no email session → `generateLaunch(false)` sets `state.launch={date,text:""}` and skips the relay (the brief's same early-out at index.html:973); the Game-plan card then shows the short fallback, and each section card shows its `.empty` line. No card may render blank.
- **Privacy:** the relay `/launch` route reuses the synced D1 doc + Gmail KV session already authorized for the brief — no new data leaves the device beyond what the brief already sends. Do not log narration text server-side.
- **Sync conflicts:** none possible — `launch` is in `SYNC_SKIP`, so `buildSyncDoc` (index.html:1213) excludes it and `applySyncDoc`/`mergeRemoteDoc` (which only iterate `SYNC_ARRAYS`) never touch it.
- **`.brief-card` is not a CSS class:** it is styled inline (index.html:967). Do not assume a `.brief-card` rule exists to "place new rules next to" — follow the Styling section's Option A/B instead.

### Effort & dependencies
- **Size:** **M** (one relay route cloned from `/brief`, one new room cloned from the Email/Home patterns + Playbook §7, five small card builders — almost entirely mirror-and-adapt, no new infra).
- **Must exist first (all already shipped):** the relay brief stack — `buildServerBrief` (worker.js:704), `briefDigest`/`briefDigestText` (worker.js:658/667), `briefInbox` (worker.js:680), `callGemini` (worker.js:87); and the app brief stack — `dayDigest` (index.html:934), `briefContextText` (951), `briefBodyShort` (942), `briefDateLine` (960), `generateBrief`/`maybeAutoBrief`/`briefCardHTML`. Reuses **Email** (`emailThreads`, `emailOn` index.html:2467, `emailFromName` 2608, `category` grouping) and the sync gate `syncOn` (1204) / `relayOn` (1108) / `relayBase` (1107).
- **Soft dependencies (degrade gracefully if absent):** **Calendar #3** (agenda card) and **Habits #5** (check-in card) — both guarded by `typeof` checks; build order is flexible, but the Launch room is *fully* realized only once #3 and #5 land. Recommended order: ship Launch with the three ready cards (Plan/Inbox/Focus) live and the other two showing placeholders, then unlock the Agenda card when #3 ships and the Habits card when #5 ships (and at that point set the Habits chip's real `data-goto` room key).
- **Out of scope / future:** the `gen:"launch"` cron push (the morning brief push already covers the notification); Web Speech TTS narration ("read my day aloud"); writing events to Google Calendar; a Home-screen full takeover mode; per-section reorder/customization; streak visualization in the Habits card.

---

## Appendix — Glossary & closing

**Glossary**
- Relay — the Cloudflare Worker 'kevinos-relay' that holds all secrets and brokers Google plus Gemini. Modern ES; NOT subject to the app ES5 rule.
- App — the single ES5 'index.html' PWA served by GitHub Pages from the 'app/' directory.
- Synced doc — the per-user document the relay reads to generate the Brief and Weekly Review; the app pushes content arrays to it.
- SYNC_SKIP — device-local state keys that are never synced across devices.
- SYNC_ARRAYS — content collections synced as one document across devices.
- save() — persists state to localStorage AND schedules a sync push plus reminder sync (does not re-render).
- persist() — persists state to localStorage WITHOUT scheduling a push.
- gen — the cron push job type fired by the relay ('brief' | 'draft' | 'weekly'; new features add their own, e.g. 'habit').

**One golden rule for the implementer:** when in doubt, find the closest existing feature in 'index.html' (Email, Brief, Weekly Review) and mirror it exactly — same state shape, same render/handler wiring, same relay-call shape. KevinOS is intentionally consistent; consistency is the feature.

**For Kevin:** hand this file to the Codex friend and point it at one feature section at a time. Each section is self-contained and ends with its own Definition of Done. Ship order is in Recommended build order above. LFG.