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

**⚖️ DECIDED 2026-07-11 (session 2, under Kevin's delegation): Option A — split-doc. Implementation DEFERRED** until Kevin confirms v0.44 is live and the re-key drill passed on his real devices. Encrypt the 17 content arrays client-side; maintain the small opt-in plaintext digest (today's task titles/counts, open-habit count, overdue-people count, opted-in profile facts) so all six server-side smart features keep working. Full decision note: `MISSION.md` → Decision log. Deliberately NOT implemented this session.

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
- [x] W1 Test Harness locally green *(2026-07-11; CI green pending first push)*
- [x] W2 Safety Refactors → v0.41 *(2026-07-11, suite green throughout)*
- [x] W3 Data Trust → v0.42 *(2026-07-11; schema NOT bumped — item 9 landed as a sidecar key)*
- [x] W4 Relay Hardening + Key v2 → v0.43 code-complete *(2026-07-11; deploy #1 AWAITING KEVIN)*
- [x] W5 Sync Observability → v0.44 code-complete *(2026-07-11; deploy #2 AWAITING KEVIN)* · **GATE-76 decided: A (split-doc) — implementation deferred until v0.44 is live + re-key drill passes on real devices**
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

### W1 — Test Harness (2026-07-11) ✅ (CI pending push)
- **Items completed (10/10):** 21 (harness + app-logic), 22 (capture, 26 cases), 23 (merge convergence), 24 (portable round-trips), 25 (parseICS fixtures), 26 (rollRecurring), 27 (habit streaks), 28 (worker /sync/push vs fake D1), 29 (`sh test/run.sh` runner + MISSION.md ritual), 30 (GitHub Actions CI).
- **Files added:** `test/harness.js` (loads the app IIFE in Node via `new Function` + stub DOM/localStorage, harvests internals), `test/{app-logic,capture,merge,portable,ics,recurrence,streaks}.test.js`, `relay/test/sync-push.test.js`, `test/run.sh`, `.github/workflows/ci.yml`. `MISSION.md` ritual now points at the runner. Zero `index.html` edits.
- **Commits:** 4bbea9c, 796ef6e, 78319c1, 3a52f04, 09bcddb, 9f0d5ab, e5d32e9, 74ca2b0, 8595872+b4e5b9c, 053ff01.
- **Tests run:** `sh test/run.sh` ALL GREEN (static checks, ES5 scan, 7 app suites, 2 relay suites). Scanner negative-tested (planted `const` caught). No app code changed; no version bump (per plan).
- **MANUAL-UNVERIFIED:** CI workflow itself — needs the first `git push` to a GitHub remote; expect a green Actions run of `sh test/run.sh` on node 20.
- **Pre-existing quirks found by characterization (bugs for Kevin to triage, none data-safety):**
  1. *Capture:* a leading `@token` (e.g. `"@tomorrow only"`) is neither parsed as a date nor stripped — the date regex requires a preceding space. Pinned as-is in `test/capture.test.js`.
  2. *Recurrence:* monthly repeat from Jan 31 rolls to Mar 3 (JS Date overflow), not "last day of Feb". Pinned as-is.
  3. *ICS:* an EXDATE-excluded occurrence still consumes RRULE COUNT (6-count MWF rule with 1 EXDATE yields 5 events). Matches most calendar apps' interpretation; pinned as-is.
  4. *ICS:* date-only DTEND yields `end:null` (multi-day all-day events lose their end date on import). Pinned as-is.
- **Deviations:** run.sh's whole-script ES5 scan uses statement-position matching for `const`/`let` because UI copy ("…or let it go") false-positives the naive pattern; the stricter diff-scan is unchanged.
- **Next task:** W2 item 31 — render-time probe (measure before touching).

### W2 — Safety Refactors → v0.41 (2026-07-11) ✅
- **Items completed (9/9, in order):** 31 (?perf=1 probe; baseline on empty data: today 0.5ms / calendar 2ms / attic 1.5ms), 1 (CONTENT_ARRAYS + PORTABLE_OBJS + boot assertContentContract; boot loader loop replaces 17 lines; SYNC_ARRAYS aliased), 86 (policy constants SNAP_*/SYNC_*/TOMBSTONE_TTL/STORAGE_*), 32 (RENDERERS map in renderCurrentRoom/syncRerender/go; email skip on sync preserved), 87 (relayCall consolidation — 12 sites converted; relayPost aliased; grep proves relayCall is the only relay fetch), 14 (escapeHtml + apostrophe + invariant comment; test pin updated), 13 (53 render id interpolations wrapped in escapeHtml), 12 (sanitizeIds at applyPortableDoc/applySyncDoc/mergeRemoteDoc/boot; /^[a-z0-9-]{1,40}$/i, re-mint via uid; tests added), 85 (function TOC). Release bump → v0.41.
- **C6 design ruling (implement in W9 item 92):** AREAS stays a var with the exact read shape `[{key,color},…]`; W9 hydrates it from state at boot. Readers keep reading the var, never state. Recorded as a comment at the AREAS declaration.
- **Commits:** c2b919a, 180335b, 82f09ee, 79b8423, 246a784, cd0e7c7, e6811f5, 8e3fcb1, b723d8b, 3e52c63. Nothing pushed/deployed.
- **Tests run:** `sh test/run.sh` ALL GREEN after every item. Browser (real Chromium, localhost:8128): boots with pre-existing data intact; footer stamps v0.41; all 18 rooms activate through nav+Attic; capture `note: w2 smoke #Work` lands as a Work note; wind-down roll-to-tomorrow works; zero console errors; zero contract-violation logs; ?perf=1 logs per-room ms.
- **MANUAL-UNVERIFIED:** (1) live 401 path through relayCall against the real relay — wrong token in Settings → expect one "Relay token rejected" toast, red health chip, Council row error (W4.19 re-tests this anyway); (2) push enable/disable + reminder sync through relayCall on the installed PWA — turn reminders off/on, send test push; (3) Gmail/GCal/GitHub OAuth flows through relayCall (connect once each, confirm no regression).
- **Deviations:** (a) refreshRelayHealth now stores caps only on a healthy response (was: also on HTTP-error responses); caps has no reader today, noted for the record. (b) sanitizeIds also runs at boot (audit named three ingress sites; pre-existing storage is a fourth — safer reading). (c) run.sh's ES5 scan already documented in W1.
- **Next task:** W3 item 41 — in-card confirm pattern replacing all seven window.confirm dialogs.

### W3 — Data Trust Completion → v0.42 (2026-07-11) ✅
- **Items completed (11/11):** 41 (all 7 window.confirms → in-card via confirmCardHTML; emergency-import bypasses the card since the overlay covers the footer), 8 (verifyBackup two-stage import: dry-run report → destructive confirm), 4 (snapshot restore diff preview via shared docCountsText), 3 (Snapshot-now button, reason "manual"), 5 (COUNCIL_KEEP=50 auto-cap + buried tombstones + footer Trim action), 6 (top-5 per-entity byte breakdown in stats), 77 (sync-doc bytes captured at push; >1 MB one-time toast + amber stats line), 80 (tombstone count/size stat; GC + trim unit tests), 7 (auto-download backup after 5-min failing-save episode), 9 (lastGoodBoot **sidecar key** + stakes line in emergency UI), 10 (Data Trust Contract in README). Release → v0.42.
- **Commits:** e7df898, e2d5792, 68f2ea6, fdb9c50, a1791fd, b15c745, 1df2358, 9cc8ddd. Nothing pushed/deployed.
- **Tests run:** `sh test/run.sh` ALL GREEN after every item (merge suite extended: state.deleted GC pin, trimCouncil tombstones; harness exports extended). Browser-verified (real Chromium): snapshot arm→diff→cancel and manual snapshot; import via real File through the change handler — stage-1 report (schema v99 warning, counts), stage-2 confirm, cancel leaves data byte-identical, accept replaces + stamps v39 + clears card; corrupt-load drill — emergency UI + "Last good boot … 1 tasks … at stake" + raw bytes preserved byte-identical; footer v0.42; zero console errors throughout.
- **MANUAL-UNVERIFIED:** (1) 5-minute auto-backup — on a quota-limited profile, force failing saves, wait 5 min, expect one automatic download + toast; (2) in-card disconnect confirms for GitHub/Gmail/GCal against live connections (arm → cancel → arm → confirm; verify revocation happens only on confirm); (3) >1 MB sync-doc warning with real data volume.
- **Deviations:** (a) item 9 landed as sidecar localStorage key `kevinos:lastGoodBoot` instead of a state field — a state field is unreadable exactly when the emergency screen needs it; consequently **no SCHEMA_VERSION bump was needed** (the anticipated →40 didn't happen; next candidate bump is W5/GATE-76). (b) item 4 folded into 41/8's shared counting helper (same region, strict dependency chain). (c) Emergency-mode import skips the in-card confirm (footer card would sit behind the overlay; the original window.confirm was reachable, the card isn't — user already explicitly chose Import from the recovery screen).
- **Next task:** W4 item 19 — relay health `auth:` flag + app "relay unlocked" warning (deploy window #1; code-complete then queue deploy for Kevin).

### W4 — Relay Hardening + Key v2 → v0.43 CODE-COMPLETE (2026-07-11) ⏸ deploy #1 awaiting Kevin
- **Items completed (6/6):** 19 (health `auth:` flag + amber "Relay online — unlocked" chip + Part 3.5 pointer in the chip explanation; route-auth test extended both ways), 17 (KV rate limit: 13 AI routes, hour-bucketed counter per token-hash, AI_RATE_LIMIT_PER_HOUR=120 var, fails open; 5 tests), 68 (24h /council identical-question cache: full-sha256 key in PUSH KV; streams cache their NDJSON transcript, JSON path caches the body; success-only, best-effort), 36 (**verified already implemented** — `_lastRemindersJson` byte-compare skip in syncReminders; no change), 15 (PBKDF2 v2 sync keys: `v2:`+PBKDF2-SHA256@210k, reference-vector tested; worker `validSyncKey` accepts v1+v2 at all 8 key sites; migration = pull v1 → union-merge → push v2 → force-push v1 doc back with `__movedToV2` marker so v1 devices stop pushing and show a re-key nudge — **forkproof, and the v1 row keeps its data as the one-version read fallback**; forced reminder re-sync on connect per C2), 16 (strength meter + 8-char minimum). Release bump → v0.43.
- **Commits:** be3ebde, 78a3ff4, ab244ea, ac82ff7, a86fa68, 114f2bd. Nothing pushed/deployed.
- **Tests run:** `sh test/run.sh` ALL GREEN throughout (route-auth: auth-flag both states; sync-push: v2 accept, v3/non-hex reject, rate-limit trip/disable/fail-open; app-logic: PBKDF2 reference vector vs Node crypto). Browser: strength meter all four tiers, short-phrase block, boot clean at v0.43.
- **Incident, resolved:** first W4.68 edit embedded two raw NUL bytes (a ` ` separator got JSON-decoded to a real NUL) — made worker.js grep-binary. Caught by the grep ritual going silent; replaced with escaped ` `; `node --check` had passed throughout (NUL is legal in a JS string), so greppability checks matter.
- **MANUAL-UNVERIFIED (live, after deploy):** (1) `curl -s https://kevinos-relay.kevinbigham.workers.dev/` shows `"auth":true` and the app chip stays green (not "unlocked"); (2) same council question twice within a minute → second response carries `X-KevinOS-Cache: hit` header and costs no seats; (3) rate limit: 121st AI call in an hour → 429 (or set AI_RATE_LIMIT_PER_HOUR="2" on a test deploy and trip it with 3 curls); (4) re-key drill: on the phone, Disconnect sync → Connect with the passphrase → expect "Sync upgraded ✓"; then on the Mac (still v1) expect the "moved to a stronger key" nudge and NO pushes until re-keyed; then re-key the Mac; verify both devices converge and the 8am brief still generates (fire-time reminders carry the v2 key); (5) link code display: after re-key the footer link code shows the first 6 chars of "v2:..." — cosmetic, confirm it matches on both devices.
- **⏸ AWAITING KEVIN — deploy window #1 (paste-ready, IN THIS ORDER):**
  1. `cd relay && npx wrangler deploy`   *(relay first — it accepts v1+v2; the app's new connect flow needs it)*
  2. `curl -s https://kevinos-relay.kevinbigham.workers.dev/` → confirm `"auth":true` (or set the token now: `npx wrangler secret put KEVINOS_TOKEN` then redeploy)
  3. `git push` (after wiring the remote — see Setup note) → GitHub Pages ships v0.43
  4. Run the re-key drill above when convenient (it's opt-in; v1 devices keep working untouched until you re-enter the passphrase).
- **Next task:** W5 item 71 — sync activity log (then 73→72→74→75→78→79 → **GATE-76 decision for Kevin**).

### W5 — Sync Observability → v0.44 CODE-COMPLETE (2026-07-11) ⏸ GATE-76 + deploy #2 awaiting Kevin
- **Items completed (7/8):** 71 (20-event device-local sync activity log + Activity toggle), 73 (device label at connect, before 72 per plan), 72 (state.devices presence in the sync doc; newest-lastSeen wins; own stamp only at push time so presence can't cause push storms; "Mac · 2m ago" line), 74 (mergeRemoteDoc returns merged-in count; "Merged changes from another device (N items)" toast on pull-merge and stale-push), 75 (Sync doctor: key fingerprint + v1/v2 label, revs, relay auth, D1 flag, doc bytes, presence, force push/pull with pre-snapshot + in-card confirm, blocked in the re-key upgrade state), 78 (relay weekly `<key>:snap` row refreshed on push when >7d old; `/sync/pull {snap:true}` recovery read; 4 tests), 79 (three-device convergence proof: 3 real app instances through the real worker — concurrent edits, late joiner, tombstoned delete, stability round-trip; runs under a v2 key; in run.sh). **Item 76 NOT implemented — it is a decision gate; options below.**
- **Schema:** state.devices is additive/optional — no migration, **no SCHEMA_VERSION bump** (bump only happens if GATE-76 option A/C proceeds with a shape change, per Law 6).
- **Commits:** ce5b36b, 223473d, 6e1cde7, 05ca04a. Nothing pushed/deployed.
- **Tests:** `sh test/run.sh` ALL GREEN (now 10 suites incl. convergence). Browser: boots v0.44, zero console errors, devices key present.
- **MANUAL-UNVERIFIED (needs two real devices post-deploy):** presence line shows both devices with sane ages; merge toast on a genuine cross-device conflict; doctor force push/pull round-trip; activity log fills during a normal day; cloud snapshot appears in D1 (`npx wrangler d1 execute kevinos-sync --remote --command "SELECT id, updated_at FROM docs"` shows the `:snap` row).
- **⏸ GATE-76 — Kevin must pick A, B, or C (see §4 above) before any encryption work. Recommendation on file: A (split-doc digest). Whatever the pick, record it in MISSION.md and re-run test/convergence.test.js after implementation.**
- **⏸ Deploy #2 (after GATE-76 decision, or without 76 if C/deferred):** same runbook as deploy #1 — relay first, curl health, then push the app.
- **Next task:** if GATE-76 = A or B → implement 76 here in W5; if C or deferred → W6 item 54 (midnight/visibility day-change re-render), the invalidation model item 33 keys off.

### Session 2 — GATE-76 decision recorded + v0.44 frozen for merge (2026-07-11)
- **Re-ground:** tip `7de2c31` matched this log; working tree clean; `sh test/run.sh` ALL GREEN (10 suites) before any edit — session baseline.
- **Freeze & package:** tagged `v0.44-marathon`; exported **58 patches** (`91d6105..v0.44-marathon`) to `../kevinos-merge-batches/batch-1/` plus baseline copies of the three marathon-only docs to `../kevinos-merge-batches/preflight/`. **Landmine documented:** batch-1 patches modify `KEVINOS_EXECUTION_ORDER.md`, which Kevin's real clone does not have — the preflight docs must be seeded (at baseline content) and committed before `git am`, or those patches fail. Full merge + deploy runbook: `../kevinos-merge-batches/README.md`. Commits made after the tag (this session) ship later as batch-2; batch-1 is unaffected by them.
- **GATE-76 DECIDED: Option A (split-doc), implementation DEFERRED** pending live v0.44 + real-device re-key drill. Recorded in §4, the §7 tracker, and `MISSION.md` → Decision log (D1-not-Supabase house style). Deliberately NOT implemented this session.
- **Director promotion:** the four W1 characterization quirks are promoted to a **W6.0 bug-fix cluster** (a: leading `@token` capture, b: monthly Jan-31 date-overflow clamp, c: ICS EXDATE consuming RRULE COUNT, d: date-only DTEND dropped). Each is an intentional contract change: old pin stated, new pin stated, one bug per commit, fixed before W6 features build on the parser/calendar.
- **Next task:** W6.0a (leading `@token`), then b→c→d, then W6 proper 54→33→34→35→44→43→45→48→46→47→49 → v0.45.
