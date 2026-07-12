# KevinOS — GOAT Roadmap Execution Order
*Companion to `KEVINOS_AUDIT.md`. Sequences all 100 roadmap items into 11 conflict-minimized waves.*
*Method: dependency analysis + collision mapping on the actual code, not vibes. Every item appears exactly once.*

---

## 0. TL;DR — the wave order

| Wave | Name | Items (in execution order) | Ships as |
|---|---|---|---|
| **W0** | Truth & Hotfixes | 51 · 2 · 84 · 11 · 18 · 20 · 81 · 82 · 83 · 89 · 88 · 90 | v0.40 |
| **W1** | Test Harness | 21 · 22 · 23 · 24 · 25 · 26 · 27 · 28 · 29 · 30 | (no app bump) |
| **W2** | Safety Refactors | 31 · 1 · 86 · 32 · 87 · 14 · 13 · 12 · 85 | v0.41 |
| **W3** | Data Trust Completion | 41 · 8 · 4 · 3 · 5 · 6 · 77 · 80 · 7 · 9 · 10 | v0.42 |
| **W4** | Relay Hardening + Key v2 | 19 · 17 · 68 · 36 · 15 · 16 | v0.43 + deploy |
| **W5** | Sync Observability + **GATE-76** | 71 · 73 · 72 · 74 · 75 · 78 · 79 · **76 (decision)** | v0.44 + deploy |
| **W6** | Daily-Driver UX | 54 · 33 · 34 · 35 · 44 · 43 · 45 · 48 · 46 · 47 · 49 | v0.45 |
| **W7** | Theme, Mobile & PWA | 42 · 56 · 57 · 38 · 52 · 53 · 55 · 58 · 59 · 60 · 97 | v0.46 |
| **W8** | AI Leverage | 62 · 61 · 63 · 67 · 37 · 64 · 66 · 69 · 65 · 70 | v0.47 + deploy |
| **W9** | Generalization & Release Assets | 92 · 91 · 50 · 93 · 95 · 94 · 39 · 40 · 96 | v0.48–v0.9x |
| **W10** | Release Gate | 98 · 99 · 100 | **v1.0.0** |


**Critical path (cannot reorder):** W0 → W1 → W2. Everything after has some flex, but the wave order above minimizes rework. W1 before W2 is the single most important sequencing decision in this plan.

---

## 1. The seven sequencing laws (why this order)

These are the long-term planning principles the order falls out of. When in doubt mid-campaign, re-derive from these:

**Law 1 — Docs before code.** Doc fixes (W0) collide with nothing, close both 🔴 findings, and every subsequent agent inherits accurate ground truth. Cheapest risk reduction available.

**Law 2 — Characterization tests before refactors.** W1 pins *current* behavior of the exact functions W2 rewrites (`portableDoc`, `mergeById`, `parseCaptureText`, `parseICS`…). Refactoring first means the tests would pin the *new* behavior and catch nothing. This is textbook strangler-pattern order and it is non-negotiable.

**Law 3 — Refactor a region before building features in it.** W2's consolidations (entity list, RENDERERS map, relayCall, escapeHtml) reshape the code that W3–W8 build on. Done in reverse, every feature wave edits code that later gets rewritten — double work and merge pain on a single 4,813-line file.

**Law 4 — Batch by file region.** One file means region = conflict surface. Storage-stats items travel together (W3), sync-footer items together (W5), Today/capture items together (W6), Council items together (W8). Two agents or two sessions editing the same region out of order is how single-file apps rot.

**Law 5 — Batch relay deploys.** Exactly three deploy windows: W4, W5, W8. Each keeps back-compat with the live app during rollout (the app and relay never require simultaneous updates). Fewer deploys = fewer compatibility windows = fewer "works on my relay" bugs.

**Law 6 — Batch schema bumps.** At most one `SCHEMA_VERSION` bump per wave (expected: W3 → 40, W5 → 41 *only if GATE-76 passes*, W9 → 42). Each bump gets one migration gate and one round of backup/import testing — never casual, never scattered.

**Law 7 — Decide early, implement late.** Two items have blast radii that touch earlier waves: **76** (E2E encryption) and **92** (configurable areas). Their *design decisions* happen early (W2/W5) so earlier work doesn't need redoing; their *implementations* happen where risk is cheapest (W5-gate/W9).

---

## 2. The conflict map (evidence, not opinion)

Collisions found by reading the actual code. This is the "least conflicting" homework:

**C1 — 🚨 Item 76 (E2E-encrypt the sync doc) breaks five shipped features.** Verified: the worker runs `SELECT doc FROM docs` in **six places**, powering `buildServerBrief` (smart 8am push), `buildLaunchPlan`, `buildWeeklyReview` (Sunday push), `countOpenHabits` (8pm skip-if-done), people nudges, and `profileDigest` (personalization on all three). Encrypt the doc and the relay goes blind → every "smart even when the app is closed" feature dies. **The audit undersold this.** 76 is therefore a formal decision gate (see §4), not a task.

**C2 — Item 15 (PBKDF2 v2 sync keys) strands scheduled reminders.** Verified: `syncKey` appears 36× in the worker; every KV-stored reminder carries `r.syncKey` and `firePush` uses it *at fire time*. Re-keying without a forced `/push/sync` + D1 row migration means the next morning's brief regenerates from an empty doc. 15's definition of done must include: migrate the D1 row old-key→new-key, force reminder re-sync, keep old-key read fallback for one version. Item 36 (skip-identical reminder sync) lands *before* 15 so the re-key path is exercised against the final sync logic.

**C3 — Items 1/86/32/87 rewrite what 20+ later items touch.** The entity-list consolidation (1) rewrites `portableDoc`/`applyPortableDoc`/boot — which items 5, 8, 4, 12, 24, 77, 78, 92 all touch. `relayCall` (87) rewrites the fetch sites that 17, 19, 61, 68 extend. `RENDERERS` (32) rewrites what 33/34/54 optimize. Feature-first order = every one of those items done twice.

**C4 — Item 41 (in-card confirm pattern) is a dependency, not a peer.** Items 8 (import dry-run) and 4 (restore diff preview) *consume* the confirm pattern. 41 → 8 → 4, in that order, same wave.

**C5 — Item 42 (dark mode) must precede all other CSS work.** Items 38, 56, 57, and especially 97 (a11y/contrast pass) style or audit the theme. Dark mode after them = re-auditing contrast and re-touching every styled region twice. 42 opens W7; 97 closes it.

**C6 — Item 92 (configurable areas) has the widest app blast radius.** `AREAS` is read by the capture parser (44), filters, editors, seeds (91), and tests (22). Mitigation is a *design decision made in W2, implemented in W9*: AREAS becomes a var hydrated from `state` (same shape, same reads) — then 44/22/91 never need rework. One line of foresight saves three items of rework.

**C7 — Items 33 + 54 are one change.** Memoizing Launch cards per `dateKey` (33) and re-rendering at midnight/visibility (54) share an invalidation model. Built separately they fight (stale memo vs. forced re-render). Pair them, 54's day-change detection first.

**C8 — Storage-stats region pile-up.** Items 5, 6, 77, 80, 7 all edit the same stats/banner code. One wave (W3), one pass, in order: cap (5) → breakdown (6) → sync-doc warn (77) → tombstone stat (80) → auto-backup (7).

**C9 — Item 30 (CI) multiplies everything after it.** Every wave from W2 on gets automatic syntax + test verification on push. Delaying CI to "polish" forfeits its compounding value across ~80 items.

**C10 — Item 90 (VERSION single source) changes the release ritual itself.** It goes in W0 so all ten subsequent releases use the new three-bump checklist instead of drifting like sw.js did (finding F3).

---

## 3. Wave-by-wave plan

Every wave ends with: full static-check ritual → version bump per item 90's checklist → bootable, shippable state. No wave starts until the previous wave's checks are green (marathon rule, inherited).

---

### W0 — Truth & Hotfixes *(docs + two one-liners · zero conflict surface · ~1 session)*
**Order:** 51 (SW cache → v0_39… ships as part of v0.40 bump) → 2 (snapshot counter one-liner) → 84 (dead loop) → 11 (KEVINOS_TOKEN docs: GETTING_STARTED Part 3.5 + troubleshooting + Security Notes) → 18 (SECURITY.md) → 20 (secret-scan ritual) → 81 (HANDOFF v0.39 addendum) → 82 (version-string sweep) → 83 (ROADMAP marathon row) → 89 (historical-doc headers → docs/history/) → 88 (CONTRIBUTING-AI.md) → 90 (VERSION source + release checklist).
**Why first:** closes both 🔴 findings; restores doc truth for every later agent; installs the release ritual (90) that all ten later releases use. 2 and 84 ride along because they're one-line and touch regions nothing else in W0 touches.
**Conflicts avoided:** none exist here — that's the point.

### W1 — Test Harness *(new files only · runs parallel-safe with nothing else needed)*
**Order:** 21 (harness + script extraction) → 22 (capture table) → 23 (merge/convergence 11-case) → 24 (portable-doc round-trips) → 25 (parseICS fixtures) → 26 (recurrence) → 27 (streaks) → 28 (worker /sync/push semantics) → 29 (one runner) → 30 (GitHub Actions CI).
**Why now:** Law 2. These tests pin the behavior W2 is about to rewrite. Zero `index.html` edits — this wave *cannot* conflict with anything.
**Definition of done:** runner green locally AND in CI on push.

### W2 — Safety Refactors *(the consolidation wave · highest rework-prevention value in the plan)*
**Order:** 31 (render-time probe FIRST — measure before touching) → 1 (CONTENT_ARRAYS/PORTABLE_OBJS + boot assertion) → 86 (magic numbers → named policy constants) → 32 (RENDERERS map) → 87 (relayCall consolidation of ~10 fetch sites) → 14 (escapeHtml `'` + invariant comment) → 13 (escape ids at render) → 12 (sanitize ids at ingress) → 85 (function TOC).
**Why this internal order:** 31 baselines perf before 32 changes render dispatch. 1 before 12 (ingress sanitization lives in the functions 1 rewrites). 14 before 13 (13 uses the upgraded escaper). 85 last (documents the post-refactor layout).
**Also decide here (implement W9):** the C6 design ruling — AREAS becomes state-hydrated, same read shape.
**Gate:** W1 suite green before, during, after. Any red = stop.

### W3 — Data Trust Completion *(storage-stats + import/restore regions · one schema bump if needed)*
**Order:** 41 (in-card confirm pattern replaces all 7 `window.confirm`s) → 8 (import dry-run report, uses 41) → 4 (restore diff preview, uses 41+8's counting helper) → 3 (Snapshot-now button) → 5 (council history cap + trim action) → 6 (per-entity byte breakdown) → 77 (sync-doc >1 MB warn) → 80 (tombstone size stat + GC unit test into W1 suite) → 7 (auto-download backup after 5-min failing banner) → 9 (lastGoodBoot in emergency UI) → 10 (Data Trust Contract in README).
**Why:** 41→8→4 is a strict dependency chain (C4). 5/6/77/80/7 is the C8 region batch. 10 last — write the promise after the behavior is final.
**Schema:** if 9's `lastGoodBoot` field warrants it, this wave's single bump → `SCHEMA_VERSION 40` with a `prevV<40` gate.

### W4 — Relay Hardening + Key v2 *(deploy window #1 · app+relay coordinated, back-compat)*
**Order:** 19 (health `auth:` flag + app chip "relay unlocked" warning) → 17 (KV rate limit on AI routes) → 68 (24h council-question cache) → 36 (reminder-sync hash-skip) → 15 (PBKDF2 v2 keys: versioned `v2:` prefix, relay accepts both, **D1 row migration old→new, forced reminder re-sync** per C2) → 16 (passphrase strength meter, rides 15's connect-card edit).
**Deploy sequence:** relay first (accepts old + new), verify health flags via curl, then ship the app. Old app keeps working against new relay throughout.
**Gate:** 28's worker tests extended for token/rate-limit/v2-key paths before deploy.

### W5 — Sync Observability + GATE-76 *(sync footer/settings region · deploy window #2)*
**Order:** 71 (activity log) → 73 (device labels — before 72 so presence shows names) → 72 (device presence) → 74 (merge-visibility toast) → 75 (sync doctor panel) → 78 (weekly cloud snapshot row, small relay addition) → 79 (three-device convergence proof via W1 harness) → **76 DECISION GATE** (see §4).
**Why 79 before 76:** prove convergence in the *current* architecture first, so if 76 proceeds you have a known-good baseline to re-verify against.
**Schema:** only if GATE-76 option A/C proceeds → bump 41 here.

### W6 — Daily-Driver UX *(Today/capture/wind regions · perf riders included)*
**Order:** 54 (midnight/visibility day-change re-render — the invalidation model) → 33 (memoize Launch cards per dateKey, keyed to 54's model, C7) → 34 (skip hidden-room renders in capture) → 35 (debounce storage stats) → 44 (capture tokens `@3pm` `+person` `//project` + extend 22's test table) → 43 (generalized undo toast) → 45 (task reorder) → 48 (Library search into ⌘K) → 46 (schedulable evening Close) → 47 (Life-Sweep streak) → 49 (per-room empty states).
**Why:** 54→33 strict pair; perf riders (34/35) live in the same functions being edited anyway; 44 immediately extends the tests that guard it.

### W7 — Theme, Mobile & PWA *(CSS + manifest + SW regions)*
**Order:** 42 (dark mode FIRST — C5) → 56 (safe-area top) → 57 (tap targets + active states) → 38 (content-visibility) → 52 (manifest shortcuts) → 53 (screenshots + separate maskable icons) → 55 (pull-to-refresh) → 58 (offline chip) → 59 (iOS push re-permission nudge) → 60 (?room= deep links) → 97 (full a11y pass LAST — audits both themes, all new surfaces).
**Note:** 52/53 + any SW touch = SW cache bump rides this wave's release.

### W8 — AI Leverage *(Council region + deploy window #3)*
**Order:** 62 (lane-pinning vars surfaced — relay vars + app Settings; deploy opens the window) → 61 (seat reliability dots) → 63 (Council presets) → 67 (Brief/Standard/Deep length control) → 37 (stream-render DOM batching — same cards being edited) → 64 (tomorrow-focus + goals into /launch context) → 66 (universal AI on events + stash) → 69 (synthesis "why" trace) → 65 (weekly Council retro) → 70 (profile-fact hygiene tools).
**Why 37 here not W6:** it's Council-region code (Law 4); bundling it with the wave that's already rewriting those cards avoids a second pass.

### W9 — Generalization & Release Assets *(the "AnyoneOS" wave · schema bump expected)*
**Order:** 92 (configurable areas — implementing the W2 design ruling; **schema bump → 42**) → 91 (generic seeds + first-boot name prompt) → 50 (onboarding tour — describes the generalized experience) → 93 (demo mode `?demo=1`) → 95 (LICENSE + manifesto section) → 94 (90-second walkthrough video — record against the polished, generalized UI) → 39 (Library search perf @5k records) → 40 (boot-time budget measured on-device) → 96 (Lighthouse pass to ≥90s, screenshots into README).
**Why 92 first here:** everything else in the wave (seeds, tour, demo, video) shows areas; generalize before you demo.

### W10 — Release Gate
**Order:** 98 (write + hold the 1.0 gate: all 🔴/🟠 closed, suite green, Lighthouse ≥90, five manual on-device gates re-run, drift table all ✅) → 99 (tag v1.0.0, honest notes, signed backup of the moment) → 100 (**30-day soak, zero new features**).

---

## 4. GATE-76 — the one real architectural decision

**The conflict (verified in code):** encrypting the sync doc client-side makes the relay zero-knowledge — and blind. Six server-side doc reads power the smart 8am brief, Launch plan, Sunday weekly, habit-aware 8pm skip, people nudges, and profile personalization. Item 76 as written kills all of them.

**Options for Kevin to pick at W5:**
- **A. Split-doc:** encrypt the 17 content arrays; keep a small *plaintext digest* (today's task titles/counts, open habit count, overdue people count, profile facts Kevin opts in) that the app maintains alongside. Relay features keep working on the digest. ~90% privacy win, all features live. **Recommended.**
- **B. Client-computed pushes:** full encryption; the app pre-computes 7 days of push bodies at sync time (the pre-v0.23 model). Total privacy; briefs go dumb-when-closed (no live inbox peek, no fire-time freshness). Honest trade.
- **C. Decline:** keep plaintext doc, rely on token + D1 access controls, document the trust model in SECURITY.md. Zero feature cost.

Whatever the pick, 79's three-device proof re-runs after, and the choice gets a MISSION.md decision note (the D1-not-Supabase precedent).

---

## 5. Parallelization guide (for the multi-agent ceremony)

Safe to run concurrently (disjoint files/regions):
- **W0 docs** ∥ **W1 tests** — different files entirely. One agent on each is the fastest opening.
- **Worker-only items** (17, 19, 28, 68, 78) ∥ **app-only items** in the same wave — different files.
- **W9 assets** (94 video, 95 license/manifesto) ∥ W9 code (92/91/93).

Never run concurrently:
- Two agents inside `index.html` in the same wave. One writer at a time in the monolith — sequence within waves is strict for a reason.
- A refactor wave (W2) with *anything* app-side.

---

## 6. Dependency quick-reference

| Item | Must follow | Because |
|---|---|---|
| 12, 13 | 1, 14 | ingress lives in consolidated functions; render-escape uses upgraded escaper |
| 8, 4 | 41 | consume the in-card confirm pattern |
| 15 | 36, 28 | re-key exercises final reminder-sync; worker tests guard migration |
| 33 | 54 | memo invalidation = day-change model |
| 97 | 42 | contrast audit must cover both themes |
| 76 | 79 | prove convergence baseline before changing the doc format |
| 91, 50, 93, 94 | 92 | generalize areas before seeding/touring/demoing them |
| 96 | 38, 42, 52, 53, 57, 97 | Lighthouse scores the finished PWA/a11y/perf state |
| All of W2 | All of W1 | characterization before refactor (Law 2) |
| Everything | W0's 90 | every release uses the new bump ritual |

---

## 7. Progress tracker

- [x] W0 Truth & Hotfixes → v0.40 *(2026-07-11, all 12 items)*
- [ ] W1 Test Harness + CI green
- [ ] W2 Safety Refactors → v0.41 *(suite green throughout)*
- [ ] W3 Data Trust → v0.42 *(schema 40 if bumped)*
- [ ] W4 Relay Hardening + Key v2 → v0.43 + deploy #1
- [ ] W5 Sync Observability → v0.44 + deploy #2 · **GATE-76 decided: ___**
- [ ] W6 Daily-Driver UX → v0.45
- [ ] W7 Theme/Mobile/PWA → v0.46
- [ ] W8 AI Leverage → v0.47 + deploy #3
- [ ] W9 Generalization & Assets → v0.48+ *(schema 42)*
- [ ] W10 Gate → **v1.0.0** → 30-day soak 🐐

*Keep every wave bootable. Propose — let Kevin approve. LFG.*

---

## Wave Log

### Setup (2026-07-11, Claude Fable 5 session 1)
- This checkout was a zip extraction, not a git repo. Initialized git locally (`main`), committed the pristine baseline as `91d6105`. **No remote is configured** — before any push, Kevin must wire `git remote add origin git@github.com:KevinBigham/kevinos.git` (or https) and decide how to reconcile with the live repo's history (this local history starts fresh from the zip).
- Baseline verification ritual: app-script/sw/worker `node --check` PASS, `route auth ok` PASS, secret scan clean (benign matches only: `kevinos-task-` push tags contain "sk-", docs reference secret names).

### W0 — Truth & Hotfixes → v0.40 (2026-07-11) ✅
- **Items completed (12/12, in order):** 51, 2, 84, 11, 18, 20, 81, 82, 83, 89, 88, 90 + release bump.
- **Files changed:** `sw.js` (CACHE v0_38→v0_40), `index.html` (snapAfterSave fix, dead-loop removal, APP_VERSION + footer stamp, v0.40), `README.md` (three-bump checklist, nav/read-first fixes, token pointer), `GETTING_STARTED.md` (Part 3.5 token, troubleshooting entry, Security Notes, version sweep, cron fact), `relay/RELAY_SETUP.md` (Step 3.5 + Step 4 token step), `SECURITY.md` (new), `CONTRIBUTING-AI.md` (new), `HANDOFF.md` (§0.5 v0.39 addendum + banner), `CLAUDE_CODE_HANDOFF.md` (live-facts), `ROADMAP.md` (marathon rows), `MISSION.md` (secret-scan ritual + record), `docs/history/` (2 historical docs moved + headers).
- **Commits:** 97f42fa (51), 2fd6eb2 (2), 22f10cf (84), c2e0e11 (11), 6f5dcf1 (18), 63f61bf (20), bd09aad (81), 80790e1 (82), b1ac4b3 (83), 0abde6e (89), 8dc95d7 (88), 43045a4 (90), 709f375 (release). Nothing pushed, nothing deployed.
- **Tests run:** full ritual PASS (node --check ×3, route-auth ok, ES5 contraband scan empty, secret scan clean). Browser boot test on localhost:8128 (real Chromium): no console errors, footer stamps "KevinOS v0.40" from APP_VERSION, Today renders, fresh-boot seeds persist with v:39, capture `email parent #Teaching @tomorrow !` → pinned Teaching task due tomorrow (proves W0.84 parser edit is behavior-neutral).
- **MANUAL-UNVERIFIED:** (1) installed-PWA SW cache rollover v0_38→v0_40 on Kevin's phone — open the installed app twice after deploy, confirm footer v0.40; (2) snapshot-autosave counter fix on an IDB-broken browser (Safari private mode: make 25+ edits, confirm console shows one "snapshots unavailable" warn and no snapshot, then in a normal browser confirm autosave snapshot appears after 25 writes + 10 min).
- **Deviations:** (a) git init + baseline commit performed because the checkout wasn't a repo (data-safety insurance; approved by Kevin's BEGIN on the flagged plan). (b) Item 82 scope: also fixed GETTING_STARTED's stale cron fact (`* * * * *` → `*/2`) and README's pre-P9 nav list — factually wrong statements adjacent to the version sweep; safer reading. (c) Item 90: APP_VERSION stamps the footer at boot; static footer text kept as no-JS fallback (two strings, one grep checks both).
- **Awaiting Kevin:** `git push` (batch at wave boundaries — needs remote wired first, see Setup note).
- **Next task:** W1 item 21 — `test/app-logic.test.js` harness (awk extraction + window/document/localStorage stubs).
