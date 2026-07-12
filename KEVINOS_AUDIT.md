# KevinOS — The GOAT-Level Audit
*Prepared 2026-07-10 · Audits repo snapshot at app v0.39 / SCHEMA_VERSION 39 / relay worker current*
*Audience: every future AI collaborator (Claude, Codex, Gemini, ChatGPT, whoever's next). Read this before touching anything.*

---

## 0. Why this document exists

You are about to work on Kevin's **personal life operating system**. It is live, it is installed on his phone, it holds his real tasks, calendar, notes, people, spending, goals, and habits, and it runs a six-seat AI Council at $0/month. It has survived 39 versions, a 10-phase overnight marathon by Codex, a director review by ChatGPT, and multiple Claude audit passes. It is **good**. Your job is to make it **legendary** without breaking the things that make it good.

This audit gives you: what KevinOS is, how it got here, exactly how it works, what's genuinely great, what's fragile, where the docs lie to you, and a 100-item roadmap to a true GOAT-level 1.0 release.

**The three rules that override everything else:**
1. The app (`index.html`) is **ES5-style, single-file, zero-dependency — forever.** No `const`/`let`, no arrows, no template literals, no `async/await`, no build step, no CDN. The relay (`relay/worker.js`) is the one exception — modern ES modules are correct there.
2. **AI proposes, Kevin approves.** Nothing auto-sends, nothing auto-creates. Every AI action lands in a review queue.
3. **Secrets never touch the browser or the repo.** All API keys and OAuth tokens live on the Cloudflare Worker as encrypted secrets. Backups and snapshots strip credentials. Connections never travel.

Violate any of these and you have failed the mission regardless of what else you shipped.

---

## 1. What KevinOS is

A **calm daily cockpit** — one self-contained HTML file that installs as a PWA, works fully offline, and unifies Kevin's entire life: tasks, calendar, notes, projects, email, habits, people, spending, goals, reference material, and a multi-model AI Council. One live dataset synced across every device via passphrase. The whole stack (GitHub Pages + Cloudflare Worker + KV + D1 + six free-tier AI providers) runs at **$0/month**.

**The product metric is adoption, not features:**
> Open every day → trust what I see → capture instantly → close without anxiety.

**The stack in one diagram:**

```
┌──────────────────────────────┐         ┌───────────────────────────────────┐
│ KevinOS PWA (index.html)     │  HTTPS  │ Cloudflare Worker "relay"         │
│ ES5 vanilla · localStorage   │ ──────► │ kevinos-relay.kevinbigham         │
│ + IndexedDB snapshot ring    │ 41      │   .workers.dev                    │
│ GitHub Pages (public repo)   │ routes  │ ALL secrets live here             │
│ sw.js network-first PWA      │ ◄────── │ X-KevinOS-Token auth (opt-in)     │
└──────────────────────────────┘         └───────────┬───────────────────────┘
                                                     │
        ┌──────────┬──────────┬──────────┬───────────┼──────────┬───────────┐
        ▼          ▼          ▼          ▼           ▼          ▼           ▼
     Gemini    Cloudflare   Groq      Mistral   OpenRouter    Z.ai     KV + D1 + Cron
     (chair)   Workers AI  (Llama)   (small)   (dev's adv.) (GLM-4.7)  (push, OAuth
                                                                        tokens, sync)
```

- **Live app:** https://kevinbigham.github.io/kevinos/
- **Live relay:** https://kevinos-relay.kevinbigham.workers.dev
- **Repo:** github.com/KevinBigham/kevinos (public — which is why the secrets policy is absolute)

---

## 2. The history (how it got here)

Understanding the arc matters because it explains the code's shape: this is an **accreted, evolved organism**, not a designed-once system. Every layer was shipped live, verified, and built on.

| Era | Versions | What happened |
|---|---|---|
| **Origin** | v0.5 | Nine-room personal dashboard: Tasks, Calendar, Notes, Projects, Studio, Briefs, Prompts, Launchpad + Home. `.ics` import/export, Life Sweep wizard, "Council of Friends" as a manual multi-AI copy/paste pattern. |
| **Foundation** | v0.6–v0.9 | Bug fixes, JSON backup, PWA-ification, GitHub streak room, permanent GitHub Pages deploy (with a full personal-data scrub before going public), the Next room ("what do I do next?"), recurring tasks, share-target capture, wind-down ritual. |
| **The Relay** | v0.10–v0.13 | The unlock. Cloudflare Worker holds AI keys; the in-app Council goes from stub → single model → **5-seat parallel fan-out with per-seat lanes** (grounded / tactical / research / devil's advocate / open-model) → **live NDJSON streaming** with a Gemini synthesis chair. Kevin's Council of Friends workflow, fully automated, $0/mo. |
| **Connected life** | v0.14–v0.18 | Web Push (VAPID + RFC-8291 encryption hand-rolled in WebCrypto, verified against the RFC test vector), GitHub OAuth (token off-device), **cross-device sync on Cloudflare D1** (passphrase → SHA-256 key, content-only replication), Calendar/File AI (Gemini multimodal → reviewed events), multi-account Gmail Command Center. |
| **Email power-ups** | v0.19–v0.26 | Council→tasks, smart morning brief (server-generated at push time), sync hardening (server-authoritative `rev`, lossless merge — fixed a real phone↔Mac data-propagation bug), overnight auto-drafts, smart inbox, unified inbox, triage, weekly review. |
| **Mission wave** | v0.27–v0.36 | Ten features spec'd in a build brief authored by a 25-agent adversarial workflow, then shipped one by one: ⌘K palette, voice capture, Calendar room, One-Tap Send, Habits, Link Stash, People Radar, Spend Pulse, Goals, Morning Launch. |
| **Whole-life AI** | v0.37–v0.38 | Sync tombstones + per-item newer-wins merge; life intake interview → `state.profile[]` facts that feed **every** AI prompt; multi-calendar agenda, weather, swim desk (Commit Swimming email digest), Sheets digest. |
| **Evolution Marathon** | v0.39 | Codex executed the P1–P10 marathon in one run (spec in `MISSION.md`): **P1 Trust Guardrails, P2 Blob Diet, P3 Snapshot Ring, P4/P5 Today cockpit, P6 Global Capture + bottom nav, P7 Relay Health Chip, P8 Federated Library, P9 Attic Collapse, P10 Evening Close + Universal AI actions** — plus opt-in relay auth (`X-KevinOS-Token`). ChatGPT (as director) reviewed the transcript and demanded a post-marathon audit; the audit fixed three proven failures. Mission ledger: all 10 phases DONE, release readiness **READY** after user-reported manual gates. |

**The meta-pattern to internalize:** Kevin runs a multi-agent ceremony — one AI specs, another implements, another directs, another audits — with written contracts (`MISSION.md` phases with acceptance tests) as the handoff medium. Your work will likely be reviewed by another model. Write like your diff will be adversarially fact-checked, because it will be.

---

## 3. The GOAT-level aspirations

Straight from the source docs, so you know what "done" is supposed to feel like:

- ROADMAP calls it *"the soon-to-be-legendary life OS."*
- The mission optimizes for, in order: **(1) data trust, (2) one-glance daily use, (3) capture speed, (4) calm system health, (5) measured pruning, (6) AI leverage where it reduces friction.** Explicitly NOT feature count.
- The Council isn't a chatbot — it's a **decision instrument**: six models with distinct assigned lanes, deliberately divergent, synthesized into one decision-ready brief Kevin can save and convert into approved tasks.
- The end state: Kevin's whole life context (profile facts, agenda, inbox, habits, goals, spend) flows into every AI surface, everything AI produces flows through a review queue, and the daily loop closes itself — morning Launch → capture all day → evening Close → smart push tomorrow.
- Cost ceiling is a design constraint, not an accident: free tiers first, hard ceiling ~$25/mo, AI <$5/mo. Currently **$0/mo** and proud of it.

"Releasing it" means: a 1.0 that Kevin trusts with his entire life without anxiety, that a stranger could clone and stand up from the docs alone, and that demonstrates the AI-directed solo-studio pattern at its best.

---

## 4. File map (what's actually in the repo)

```
kevinos/
├── index.html                    ← THE APP. 4,813 lines / 401 KB.
│                                    Lines 14–522: CSS (~509 lines)
│                                    Lines 524–871: static HTML (20 room sections, nav, footer)
│                                    Lines 872–4811: one IIFE, "use strict", 527 functions
├── sw.js                         ← Service worker. CACHE = "kevinos-v0_38" ⚠️ (see finding F3)
├── manifest.json                 ← PWA manifest + share_target
├── icon-192.png, icon-512.png    ← PWA icons
├── README.md                     ← Entry point + repo map
├── GETTING_STARTED.md            ← 938-line end-to-end setup tutorial (10 parts + troubleshooting)
├── HANDOFF.md                    ← Deep project state… through v0.38 only ⚠️ (see F2)
├── ROADMAP.md                    ← Phased plan, all phases ✅ through mission wave
├── MISSION.md                    ← The P1–P10 marathon spec + completed ledger + audit log.
│                                    THE most current record of what v0.39 actually is.
├── CLAUDE_CODE_HANDOFF.md        ← Audit-pass brief; "Current Live Facts" frozen at v0.37 ⚠️
├── CODEX_MARATHON_GOAL_PROMPT.md ← The original marathon /goal prompt (historical artifact)
├── Chat GPT 5.5 Pro Director Response.txt ← Director's film review + post-marathon audit prompt
└── relay/
    ├── worker.js                 ← Cloudflare Worker. 2,351 lines, 41 routes, modern ES.
    ├── wrangler.toml             ← Bindings (AI, PUSH KV, SYNC D1), cron */2, public vars
    ├── RELAY_SETUP.md            ← Relay provisioning appendix
    └── test/route-auth.test.js   ← The one automated test (route auth — and it's a real test)
```

**Doc trust order when sources disagree:** source code → `MISSION.md` ledger/logs → `GETTING_STARTED.md` → `HANDOFF.md` → `ROADMAP.md` → `CLAUDE_CODE_HANDOFF.md`. (See §8 for the exact drift table.)

---

## 5. How it actually works (the systems you must not break)

### 5.1 State & persistence
- One `state` object, persisted as JSON at `localStorage["kevinos:v1"]` through a three-tier store: `window.storage` (Claude host) → `localStorage` → in-memory. `makeStore()` returns shaped results: load → `{ok,data}|{ok:false,err,raw}`, save → `{ok,bytes}|{ok:false,err,bytes}`.
- `SCHEMA_VERSION = 39` is the **single source of truth**. Boot captures `prevV` before migrations, runs gated migrations (`prevV<4` seeds, `<5` prompts, `<37` intake/sheets, `<38` relay shape, `<39` blob diet deletes), then stamps `state.v = SCHEMA_VERSION`. Imports **never** apply `saved.v`.
- **17 content arrays** (items, events, projects, builds, briefs, links, prompts, notes, stash, people, spend, goals, habits, council, pending, profile, sheets) + meta (deleted tombstones, roomStats, lastBackupAt, lastShutdown) + device-local connection state (relay, push, github, email, calendar, sync) + device-local AI caches (brief, launch, weekly, intake, peopleCfg, spendMeta, weatherLoc).
- **Memory-only caches (P2 Blob Diet):** `ghMem`, `sheetsMem`, `swimMem` — regenerable data never persists. Don't reintroduce it.

### 5.2 The trust layer (P1 — the crown jewel)
- **Corrupt load:** `loadFailed=true`, emergency UI renders, raw string preserved byte-identical, defaults NOT applied, migrations NOT run, `save()`/`persist()` blocked. Recovery via raw download or backup import → `completeRecovery()`.
- **Save failure:** one toast per failure episode + persistent red banner with inline Export button; clears on next successful save. Storage stats show KB of ~5 MB with 3.5/4.5 MB warn/critical thresholds.
- **Portable docs:** `portableDoc()` is allowlist-based — includes the 17 arrays + meta + AI continuity, **excludes** sync/push/github/email/calendar/sheetsCache/swim, preserves `relay.url`, blanks `relay.token`. `applyPortableDoc()` never applies connections or `doc.v`, always stamps current schema, marks sync dirty. **Backups and snapshots can never carry or restore live credentials. "Connections never travel."**
- **Snapshot ring (P3):** IndexedDB `kevinos-snapshots/snaps`, 5-deep, reasons boot/autosave/pre-import/pre-restore. Autosave after 25 successful writes AND a 10-minute floor; boot snapshot if newest >20h. All IDB failures are best-effort and never block saves.

### 5.3 Sync (the distributed-systems core)
- Passphrase → `sha256("kevinos-sync\u0000" + passphrase)` client-side; only the hex fingerprint travels. One doc per key in D1 `docs(id, doc, updated_at, rev, device_id)`.
- **Server-authoritative optimistic concurrency:** push carries `baseRev`; mismatch returns `{stale:true, doc, rev}` → app runs `mergeRemoteDoc()` (lossless `mergeById` union — newer `u` stamp wins per id, remote wins ties, nothing either side added is dropped, tombstoned ids filtered) → re-push. `updated_at` stamped server-side (one clock; a 1970-clock device syncs fine — this was verified).
- Deletion tombstones in `state.deleted` with 30-day GC. Pull on focus/visibility/online + 60s poll, **skipped mid-edit**. Push debounced 2s into `save()`; `_lastPushedDoc` string-compare skips no-op pushes.
- Every content edit must call `touch(it)` to stamp `it.u` — 44 call sites currently do. **If you add an edit path and forget `touch()`, conflict merges will silently prefer the other device's copy.**

### 5.4 The relay (41 routes, all guarded)
- **Auth:** `KEVINOS_TOKEN` env (also reads `RELAY_TOKEN`/`X_KEVINOS_TOKEN`) — when set, every route except health + OAuth login/callback/status requires the `X-KevinOS-Token` header. When unset, everything is open (back-compat). The app sends the header from `state.relay.token` via `relayHeaders()`; 401s route through `handleRelayUnauthorized()` → one actionable toast ("Relay token rejected — re-paste it in Settings"), never blank cards.
- **Council:** `/council` fans to every seat whose credential exists — gemini (chair), cloudflare (no key, `[ai]` binding), groq, mistral, openrouter (3-slug free-model fallback chain), zai — in parallel with 45s per-seat timeouts; `stream:true` returns NDJSON (`start → seat×N in completion order → synthesis → done`). Anthropic key exists as idle chair fallback.
- **OAuth:** GitHub + Google tokens live only in KV (`gh:<session>`, `gml:<session>`); the browser holds a random session id. Google covers gmail.readonly/send + calendar + spreadsheets.readonly; app stays in Testing mode to dodge the CASA audit.
- **Push:** VAPID ES256 + RFC-8291 aes128gcm in raw WebCrypto (no library, verified against the RFC test vector). Cron `*/2` (every-minute blew KV's 1,000 lists/day free cap — documented landmine). Server-generated briefs/weeklies at fire time from the synced D1 doc + live Gmail peek.
- Every route guards its bindings (`env.SYNC`, `env.PUSH`, key regexes) and degrades to structured JSON errors. CORS is a browser guard only — `curl` works from anywhere, which is the intended testing path.

### 5.5 UI architecture
- 20 room `<section id="room-*">` panels; primary nav is 5 tabs (Today · Calendar · Tasks · Library · More) + mobile bottom nav with a `+` capture button; 14 cold rooms live in the **Attic** (More) with a room-heat card fed by `state.roomStats` (visits/last, sync-merged by max). `go(r)` routes; `normalizeRoom()` aliases home/launch → today.
- Rendering = full `innerHTML` string rebuild per room (123 assignment sites), **event delegation on stable containers** so re-renders never drop listeners. `isEditing()` guards prevent re-render/sync-pull from yanking focus mid-edit.
- `escapeHtml()` (escapes `&<>"`) is called 187 times across render paths; all HTML attributes are double-quoted (which is why not escaping `'` is currently safe — see F8).
- Today cockpit composes greeting + relay health chip + AI review queue + plan/agenda/focus/habits cards + quick capture (deterministic parser: `#Area @date !pin`, `note:`/`event:` prefixes) + Council + nudges. `c` hotkey and ⌘K palette work globally.

---

## 6. Strengths — what is already GOAT

1. **The ES5 discipline actually held.** 3,939 script lines, 527 functions, 39 versions, at least four different AI systems editing it — and the violation count is **zero**. `node --check` passes on the extracted script, sw.js, and worker.js right out of the archive. This is the project's superpower: any agent can hold the whole app in one file, one read.
2. **The trust layer is genuinely excellent.** Corrupt-load that cannot overwrite, save-failure that cannot stay silent, allowlisted credential-stripping backups, a snapshot ring that recovers from a bad import without Kevin remembering to export. Most production SaaS apps do not treat user data this carefully.
3. **The sync engine is real distributed-systems work** — server-authoritative revisions, lossless union merges, tombstones with GC, clock-skew immunity, mid-edit protection — written in ES5 promise chains, verified with an 11-case merge test and a reproduced phone↔Mac bug. The v0.21 postmortem (wall-clock LWW silently blocking propagation) → rev-based fix is textbook.
4. **The relay is a small masterpiece of $0 engineering.** Hand-rolled RFC-8291 push encryption verified byte-for-byte against the spec's test vector. Six-provider Council with per-seat lanes and NDJSON streaming. OAuth token custody done right. Free-tier landmines (KV list caps, OpenRouter slug rot) hit once, fixed, and **documented so nobody hits them twice**.
5. **AI-proposes-Kevin-approves is enforced in architecture, not vibes.** Pending queues, confirm-before-send, review cards, Undo on capture. The one primitive generalizes across Council → calendar → email → universal AI actions.
6. **The documentation corpus is an elite AI-collaboration substrate.** MISSION.md phase contracts with acceptance tests, gotcha logs ("don't relearn these"), verification recipes, a director's review, an honest ledger with MANUAL-UNVERIFIED states. This is the best part of the studio pattern — protect it.
7. **Operational honesty.** The mission log distinguishes machine-verified from USER-REPORTED PASS. The route-auth test is a real test (public routes stay public, wrong token 401s, no-token deployments keep working), not a false-green.
8. **Calm is a design system, not a slogan.** Reconnect nudges instead of red errors, deterministic fallbacks for every AI feature, offline degradation everywhere, one accent palette, an evening ritual. The product has a personality.

---

## 7. Findings — weaknesses, ranked (fix before or during the roadmap)

Severity: 🔴 fix before anything else · 🟠 fix soon · 🟡 worth fixing · ⚪ note

**F1 🔴 The relay auth token is documented nowhere a rebuilder would look.**
`KEVINOS_TOKEN` / `X-KevinOS-Token` (added in the v0.39 marathon) has **zero mentions** in GETTING_STARTED.md, relay/RELAY_SETUP.md, HANDOFF.md, or README.md — it exists only inside MISSION.md's phase spec. A fresh rebuild following the (excellent, 938-line) setup guide ships an **open relay**: anyone with the URL — which is public in this repo — can burn the AI quotas, probe `/sync/pull`, and hit Gmail-adjacent routes. Fix: add a "Part 3.5: Set the relay token" section + troubleshooting entry ("Relay token rejected") + Security Notes update, and mention it in README/HANDOFF.

**F2 🔴 HANDOFF.md — the "read this first" doc — ends at v0.38.**
The entire v0.39 marathon (Today cockpit, snapshot ring, Library, Attic, bottom nav, relay auth, trust layer) is invisible to anyone who starts where the README points them. MISSION.md is currently the only truthful record of the present. Fix: a v0.39 addendum section in HANDOFF.md (or an explicit banner: "v0.39+ lives in MISSION.md").

**F3 🟠 sw.js cache is `kevinos-v0_38` on a v0.39 app.**
Violates the project's own deploy rule ("bump the SW cache every release"). Practical risk is low (network-first + runtime `cache.put` keeps content fresh), but it's exactly the kind of drift that misleads the next agent and leaves a stale precached shell entry. Fix: bump to `kevinos-v0_39` and re-verify the rule is in the release checklist.

**F4 🟠 Stored-XSS vector via unsanitized entity ids.**
Entity ids are interpolated **raw** into 40+ `data-*` attributes (`data-id="'+m.id+'"` etc.). `uid()` output is safe, but ids arriving through **backup import** or a **hostile synced doc** are never validated — an id like `x" onmouseover="…` breaks out of the attribute. XSS here = full `localStorage` read = **relay token + sync key theft**. Fix (small): validate ids to `/^[a-z0-9]+$/`-ish in `applyPortableDoc`/`applySyncDoc`/`mergeById` (drop or re-mint offenders), or wrap every id interpolation in `escapeHtml()`. Do both for defense in depth.

**F5 🟠 Sync key derivation is a single fixed-salt SHA-256.**
`sha256("kevinos-sync\u0000"+passphrase)` — no per-user salt, no work factor. With the token now guarding `/sync/pull` this is mitigated, but a weak passphrase remains one fast hash from the entire life dataset if the token is ever unset/leaked. Fix: PBKDF2 (WebCrypto `deriveBits`, promise-chain friendly) with ~100k+ iterations and a versioned key prefix so old keys keep working during migration.

**F6 🟠 The 17-entity list is quadruplicated.**
The same array list lives in `portableDoc()`, `applyPortableDoc()`, `SYNC_ARRAYS`, and the boot loader (and echoes in Library shelves + `syncRerender`'s room chain). Adding entity #18 requires 4–6 coordinated edits; missing one silently breaks backup or sync for that entity. This is the **#1 future-agent trap**. Fix: one `var CONTENT_ARRAYS=[…]` (and `PORTABLE_OBJS`) consumed everywhere, plus a startup assertion comparing lists.

**F7 🟡 No automated tests for the app itself.**
The relay has one real test; the 4,813-line app has zero. The pure logic — `parseCaptureText`, `mergeById`, `portableDoc`/`applyPortableDoc`, `parseICS`, recurrence roll-forward, streak math — is all testable in Node with a tiny DOM-free harness (the marathon's `awk` extraction already isolates the script). Every future refactor is currently gambling on manual smoke tests.

**F8 🟡 `escapeHtml` doesn't escape `'`, and nothing documents why that's OK.**
It's safe **only** because every HTML attribute in the app is double-quoted. That invariant is real but unwritten; the first agent who writes `data-x='…'` ships an injection. Fix: add `'`→`&#39;` (one replace) and a comment stating the invariant.

**F9 🟡 Seven blocking `window.confirm()` dialogs** (import, snapshot restore, etc.) — jarring against the calm design language, unstylable, and they freeze the JS thread. Replace with the existing card/inline-confirm pattern (One-Tap Send already has one).

**F10 🟡 No dark mode.** `prefers-color-scheme` appears zero times — in an app with a literal evening wind-down ritual and an 8pm habits push. The CSS is already variable-driven (`--ink`, `--paper`, `--accent`…), so a `@media (prefers-color-scheme: dark)` variable override block is cheap and high-love.

**F11 🟡 Unbounded growth of `state.council` and AI caches inside a ~5 MB ceiling.**
P2 dieted the regenerable caches, but every Council session (question + 6 seat answers + synthesis) persists forever in the synced doc. Heavy use will walk the blob toward the 3.5 MB warning. Fix: cap council history (e.g., keep last 50, "Save to Notes" for keepers), and surface per-entity byte breakdown in storage stats.

**F12 🟡 Snapshot autosave counter resets even when the snapshot failed.**
`snapAfterSave` resets `_writeOk/_lastSnapAt` in `.then()` regardless of `snapPut`'s boolean (spec said reset only after a successful put). On an IDB-broken browser you silently wait another 25 writes each cycle. One-line fix: check the resolved value.

**F13 🟡 Date/timezone edges.** `dateKey()` is device-local (correct for a personal app) but due-date keys, `buildReminders` fire-times, and the relay's UTC cron interact: travel across timezones shifts "today," and reminders computed on the old device clock fire on relay time. Not currently biting Kevin; will bite a released product. Document the model; consider storing tz alongside dueTime.

**F14 ⚪ Accessibility is partial.** 66 `aria-` attributes and 11 roles across 20 rooms is a decent start, but focus management after full-room `innerHTML` swaps, the overlay flows (sweep/wind/palette), and the streaming Council cards need a pass (focus trap, `aria-live`, Esc handling audit).

**F15 ⚪ Small code lint.** Dead empty `while` loop in `parseCaptureText` (the `replace` does the work); `renderCurrentRoom`/`syncRerender` duplicate the same 20-branch chain (collapse to a `RENDERERS` map); non-constant-time token compare in the worker (fine for this threat model — note it, don't "fix" it into complexity); manifest uses combined `"any maskable"` purpose (Lighthouse prefers separate icons) and has no `shortcuts`/`screenshots`.

---

## 8. Documentation drift table (what to trust)

| Doc | Claims | Reality (code) | Verdict |
|---|---|---|---|
| `MISSION.md` | v39 schema, P1–P10 DONE, audit log, READY | Matches code | ✅ **Most current — start here for v0.39 truth** |
| `GETTING_STARTED.md` | v0.38, `state.v = 37`, cache `v0_38`; no token section | Footer v0.39, SCHEMA 39; token exists | 🟠 Setup steps still gold; version facts + auth section need updating (F1) |
| `HANDOFF.md` | "covers through v0.38"; `state.v` narrative ends at 37 | v0.39 shipped since | 🟠 History/architecture gold; present-state stale (F2) |
| `ROADMAP.md` | All phases + mission wave ✅ | Matches; no P1–P10 entry | 🟡 Add the marathon as its own shipped phase |
| `CLAUDE_CODE_HANDOFF.md` | "Live Facts": v0.37, cache `v0_37`, `state.v=36` | Two releases stale | 🟠 Process/constraints sections excellent; freeze-frame facts wrong |
| `README.md` | Points to HANDOFF as "read first" | HANDOFF is stale | 🟡 Redirect first-read to MISSION.md until F2 lands |
| `sw.js` | `CACHE="kevinos-v0_38"` | App is v0.39 | 🟠 F3 |

---

## 9. How to work on KevinOS (the operating manual for you, future friend)

**Before editing anything:**
```sh
git status --short
awk '/<script>/{flag=1;next}/<\/script>/{flag=0}flag' index.html > /tmp/kevinos-script.js
node --check /tmp/kevinos-script.js && node --check sw.js && node --check relay/worker.js
node relay/test/route-auth.test.js        # expect: route auth ok
curl -s https://kevinos-relay.kevinbigham.workers.dev/    # health flags
```

**After every change to `index.html`:** re-run the extraction check, then grep your own diff for contraband:
```sh
git diff -- index.html | grep -nE "=>|\`|\bconst\b|\blet\b|async |await "   # must be empty
```

**Release checklist (all three or none):** bump footer `KevinOS v0.NN` in `index.html` · bump `sw.js` `CACHE="kevinos-v0_NN"` · bump `SCHEMA_VERSION` **only** if the persisted shape changed (add a `prevV<NN` gate; never bump casually).

**Hard-won gotchas (do not relearn these):**
- App closures are unreachable from preview `eval` — test through the DOM and `localStorage["kevinos:v1"]`. `save()` is async — re-read localStorage in a *separate* eval.
- CORS blocks browsers on other origins but **not** `curl` — server-side curl against the live relay is the fast end-to-end test.
- Free seats blip (Gemini "high demand", OpenRouter slug rot) — that's expected; `Promise.all` with per-seat try/catch isolates it. Refresh OpenRouter slugs from their models API, ≤3 in the chain.
- Every-minute cron previously blew KV's 1,000 lists/day. It's `*/2` now. Don't "optimize" it back.
- Event delegation on stable containers only. `touch(it)` on every content edit. `save()` schedules sync/reminders; `persist()` is the quiet write.
- Secrets: interactive `npx wrangler secret put NAME` only — never CLI args, never in files, never in docs.
- Kevin's style: direct, concise, momentum without chaos. Edit existing files rather than spawning new ones. Confirm before anything destructive or outward-facing. Match his energy — and when he says LFG, ship like it.

---

## 10. TRUE GOAT-LEVEL ROADMAP — 100 improvements before release

Ordered by theme; within each theme, roughly by leverage. Items marked **[F#]** close an audit finding. Everything respects the sacred constraints: ES5 single-file app, $0/mo default, local-first, AI proposes / Kevin approves.

### A. Data Trust & Recovery (1–10) — trust is the product
1. **[F6]** Collapse the quadruplicated entity list into one `CONTENT_ARRAYS` + `PORTABLE_OBJS` constant consumed by `portableDoc`, `applyPortableDoc`, `SYNC_ARRAYS`, and the boot loader — with a boot-time assertion that they agree.
2. **[F12]** Fix `snapAfterSave` to reset the write counter only when `snapPut` resolves `true`.
3. Add a manual "Snapshot now" button next to the ring so Kevin can checkpoint before risky experiments.
4. Add snapshot **diff preview** on restore: "This snapshot has 212 tasks (you have 219), 41 notes (you have 41)…" so restores are informed, not blind.
5. **[F11]** Cap `state.council` history (keep last 50 sessions; older sessions require "Save to Notes") and add a one-tap "Trim history" action in storage stats.
6. Extend storage stats with a per-entity byte breakdown (top 5 heaviest arrays) so blob growth is diagnosable at a glance.
7. Auto-download a backup when the save-failure banner has been up for >5 minutes (belt for the suspenders — still user-visible, never silent).
8. Add a `verifyBackup(file)` dry-run mode to import: parse, validate, report counts + schema, and confirm **before** the destructive confirm.
9. Record `lastGoodBoot` timestamp + version in state; show it in the emergency UI so a corrupt-load screen tells Kevin exactly how much is at stake.
10. Write the **Data Trust Contract** as a short section in README (what can never be lost, what backups contain, what they never contain) — the promise, in writing, for release.

### B. Security Hardening (11–20) — a public repo demands it
11. **[F1]** Document `KEVINOS_TOKEN` end-to-end: GETTING_STARTED Part 3.5 (generate → `wrangler secret put` → paste in Settings), RELAY_SETUP appendix, troubleshooting entry for the 401 toast, Security Notes update.
12. **[F4]** Sanitize entity ids on every ingress (`applyPortableDoc`, `applySyncDoc`, `mergeRemoteDoc`): enforce `/^[a-z0-9-]{1,40}$/i`, re-mint violators via `uid()`.
13. **[F4]** Belt-and-suspenders: route all id interpolation in render paths through `escapeHtml` (mechanical pass, zero behavior change).
14. **[F8]** Add `'` → `&#39;` to `escapeHtml` and document the double-quoted-attribute invariant beside it.
15. **[F5]** Upgrade sync key derivation to PBKDF2 (WebCrypto `deriveBits`, ≥100k iterations, versioned `v2:` key prefix; relay accepts both during migration, app re-keys on next connect).
16. Add a passphrase strength meter + minimum length on the sync connect card (the key protects everything; say so in the UI).
17. Add relay **rate limiting** on AI routes (KV counter per token per hour) so a leaked URL+token can't drain free tiers silently.
18. Add a `SECURITY.md`: threat model (public repo, public relay URL, personal data custody), reporting contact, secrets policy — release-grade hygiene.
19. Emit a relay health flag `auth:true|false` so the in-app health chip can warn "relay is unlocked" when no token is configured.
20. Run a full secret-pattern scan as a pre-release gate and record the command + clean result in MISSION.md (the CLAUDE_CODE_HANDOFF grep is already written — promote it to ritual).

### C. Testing & Verification (21–30) — stop gambling on smoke tests
21. **[F7]** Create `test/app-logic.test.js`: extract the app script (the awk trick), stub `window/document/localStorage`, and unit-test the pure core.
22. Test `parseCaptureText` against a table of 25 cases (`#Area @fri !`, `note:`, `event:`, `12/25`, unknown tags, emoji, empty).
23. Test `mergeById` + `mergeRemoteDoc` with the 11 documented convergence cases plus tombstone resurrection attempts.
24. Test `portableDoc`/`applyPortableDoc` round-trips: credentials stripped, connections never applied, newer-version stamp behavior, legacy-missing-key preservation.
25. Test `parseICS` with RRULE/EXDATE/DTEND/UTC fixtures (the v0.17 bug class must never return).
26. Test recurrence roll-forward (`rollRecurring`) across month boundaries, weekday rules, and DST weeks.
27. Test habit streak math (current-survives-unchecked-today, longest scan) with crafted `done` maps.
28. Add a worker test file for `/sync/push` semantics: baseRev accept, stale return, force, legacy `rev` back-compat, key regex rejection.
29. Wire all tests into one `npm test`-free runner script (`sh test/run.sh` → node files in sequence) and add it to the static-check ritual in MISSION.md.
30. Add a tiny CI (GitHub Actions, free tier): syntax checks + tests on every push — the repo is already on GitHub; a red X beats a broken Pages deploy.

### D. Performance & Efficiency (31–40) — calm means fast
31. Add an in-app render-time probe (dev flag): log ms per room render so regressions are measurable, not vibes.
32. **[F15]** Collapse `renderCurrentRoom` + `syncRerender` into one `RENDERERS` map — 40 branch-lines become 4.
33. Memoize `launchAgendaCardHTML`/`launchPlanCardHTML` inputs per dateKey so Today re-renders (habit toggle, capture) don't recompute the world.
34. Skip `renderTasks()`/`renderCalendar()`/`renderNotes()` calls in `addTodayCapture` when those rooms aren't visible (render-on-entry already exists — trust it).
35. Debounce `renderStorageStats` (it stringifies state on fallback path) to once per save-burst.
36. Cache `buildReminders()` output hash and skip `/push/sync` when the reminder set is byte-identical (mirror of the `_lastPushedDoc` trick).
37. Batch DOM writes in the Council stream renderer (one card update per NDJSON line is fine; verify no layout thrash with 6 seats + long answers).
38. Add `content-visibility:auto` to room sections and heavy card lists — free scroll perf on the phone.
39. Profile and cap Library federated search work (pre-lowercase index per shelf, rebuild on save) so search stays instant at 5,000 records.
40. Measure boot-to-Today time on the actual iPhone and record a budget (<800ms warm) in MISSION.md — a number, not a feeling.

### E. Daily-Driver UX (41–50) — the adoption metric, sharpened
41. **[F9]** Replace all seven `window.confirm` dialogs with the in-card confirm pattern (One-Tap Send already models it).
42. **[F10]** Ship dark mode via `@media (prefers-color-scheme: dark)` CSS-variable overrides + a manual toggle persisted device-local; sync `theme-color` meta.
43. Add an **undo toast for task complete/delete** (the 6-second voice-capture Undo pattern, generalized) — anxiety-free tapping.
44. Quick-capture upgrades: `@3pm` time token, `+person` to link People, `//project` to file into a project — all deterministic, documented in a capture cheat-hint under the input.
45. Add drag-free task reordering (tap-hold → move up/down buttons) within Today focus — mobile-first, no drag libraries.
46. Make the evening Close ritual **schedulable** (default 5pm, configurable) and surface tomorrow's chosen top-3 in the morning Launch narration explicitly.
47. Add a weekly **"Life Sweep" streak** stat so the ritual loop itself has a habit chain.
48. Search everything from ⌘K: fold the Library federated search into the palette so one keystroke reaches any record.
49. Add per-room empty states with one-line "what this room is for" + a seed action (empty rooms currently read as broken to a newcomer — release blocker for strangers).
50. Add a gentle **onboarding tour** (first boot only, 5 cards: capture → Today → Council → sync → backup) written for a non-Kevin human.

### F. Mobile & PWA polish (51–60) — it lives on a phone
51. **[F3]** Bump `sw.js` CACHE to `kevinos-v0_39` now, and make the three-bump rule a pre-commit checklist item in README.
52. Add `shortcuts` to manifest.json (New task, Today, Ask Council) — long-press app icon = instant capture.
53. Add `screenshots` + proper `maskable`-purpose separate icons to the manifest for install-sheet polish.
54. Handle `visibilitychange` re-render staleness: returning to a backgrounded PWA after midnight should re-render Today for the new day (currently date-cached cards can show yesterday until interaction).
55. Add pull-to-refresh affordance on Today (manual `syncPull` + gcal reload) — the native gesture people already try.
56. Respect `env(safe-area-inset-top)` on the header like the bottom nav already does — notch-proof.
57. Add haptic-adjacent micro-feedback (CSS active states ≤100ms) on bottom-nav and capture buttons; verify tap targets ≥44px everywhere.
58. Offline indicator chip in the header (navigator.onLine + fetch-failure heuristic) so "why is Council quiet" is self-answering.
59. Test and document the iOS PWA push re-permission path (iOS drops subscriptions more than Android; a "reconnect notifications" nudge when `/push/sync` 410s).
60. Add a `?room=` deep-link param (push notifications already carry URLs) so any room is directly linkable from outside.

### G. AI Leverage (61–70) — the Council becomes an instrument
61. Add **seat health memory**: track per-seat failure rates in-app (device-local) and show a tiny reliability dot per seat in the roster.
62. Let Kevin **pin lanes to seats** in Settings (e.g., make Groq the devil's advocate) via relay vars surfaced in the app — no redeploy for lane swaps.
63. Add "Council presets": one-tap prompt templates (Decision, Plan review, Devil's advocate only, Coach-speak) that wrap the question with the right system framing.
64. Feed **tomorrow-focus tasks** and open goals into `/launch` context explicitly (P10 set the plumbing; make the narration name them).
65. Add a **weekly Council retro**: Sunday weekly review offers "Ask the Council what to change next week" with the week digest as context.
66. Universal AI actions: extend "Draft with AI / Send to Council" from tasks to events and stash items (the aiContext switch already has the shape).
67. Add response-length control per ask (Brief / Standard / Deep) mapped to MAX_TOKENS override in the request — free-tier tokens are the budget.
68. Cache identical Council questions for 24h (hash prompt → KV) so accidental double-asks don't double-spend seats.
69. Add a **"why" trace** to synthesis: chair prompt already knows lanes; ask it to name which seat drove each recommendation — teaches Kevin which lanes earn trust.
70. Profile-fact hygiene tools: dedupe + stale-fact review card in People ("still true?") so the intake corpus feeding every prompt stays clean.

### H. Sync & Multi-Device (71–80) — one dataset, bulletproof
71. Add a **sync activity log** (last 20 pull/push events, device, rev, bytes — device-local) surfaced under the link code for debuggability.
72. Show per-device presence: store `deviceId → lastSeen,label` in the sync doc meta so Kevin can see "Mac · 2m ago / iPhone · just now".
73. Add device labels at connect time ("Name this device") — link-code UX gets human.
74. Conflict visibility: when `mergeRemoteDoc` runs, toast "Merged changes from another device (N items)" — silent correctness is good, visible correctness builds trust.
75. Add a `sync doctor` panel: key fingerprint match, relay auth OK, D1 flag, last rev both sides, one-tap force-push/force-pull with pre-snapshot.
76. Encrypt the sync doc client-side (AES-GCM key derived from the passphrase alongside the id) — the relay becomes zero-knowledge; D1 leak = ciphertext. Biggest single privacy upgrade available. (WebCrypto, promise-chains, ES5-compatible.)
77. Handle sync-doc size growth: warn when the pushed doc crosses 1 MB; wire the council-cap (item 5) into the same stats.
78. Add periodic **cloud snapshot** (weekly, into a second D1 row `id+":snap"`) so cross-device recovery exists even if every local device dies.
79. Test and document the three-device convergence case (phone + Mac + iPad) with the merge test harness — the math says it works; prove it.
80. Add `state.deleted` size to storage stats and verify the 30-day GC with a unit test (tombstone leaks are invisible until they aren't).

### I. Code Health & Docs (81–90) — the substrate future agents inherit
81. **[F2]** Write the HANDOFF v0.39 addendum (marathon summary, new rooms, trust layer, relay auth) or banner-redirect to MISSION.md.
82. **[F-drift]** Sweep every stale version string: GETTING_STARTED (v0.38/37), CLAUDE_CODE_HANDOFF live-facts (v0.37/36), README first-read pointer.
83. Add the P1–P10 marathon as a shipped phase row in ROADMAP.md's status board — the historical record deserves it.
84. **[F15]** Delete the dead empty `while` loop in `parseCaptureText`; grep for other no-op loops.
85. Add a **function index comment block** at the top of the script (section markers already exist informally): store / trust / sync / rooms / relay / push / boot — 4,800 lines deserve a table of contents.
86. Extract magic numbers to named vars where they encode policy (`SNAP_KEEP=5`, `SNAP_FLOOR_MS=600000`, `SYNC_POLL_MS=60000`, tombstone GC window) — self-documenting contracts.
87. Standardize the fetch/error/toast idiom: one `relayCall(path, body, opts)` used by the ~10 near-identical direct-fetch sites (Council legacy, GitHub, push side-effects) — fewer places for the next 401-handling bug.
88. Add `CONTRIBUTING-AI.md`: the ES5 rules, the three-bump release rule, the touch()/save()/persist() contract, verification ritual, and the multi-agent ceremony — one page that replaces tribal knowledge.
89. Mark the historical docs (`CODEX_MARATHON_GOAL_PROMPT.md`, `Chat GPT 5.5…txt`) with a one-line "historical artifact — do not follow as current spec" header, and move them under `docs/history/`.
90. Add a `VERSION` single source (or a build-less version constant block) referenced by footer, and greppable by the release checklist — one number, three consumers, zero drift.

### J. Release & GOAT Finishers (91–100) — from Kevin's OS to legend
91. **Generalize the seeds**: first-boot experience for a stranger (name prompt → greeting, generic areas editable in Settings) so "KevinOS" can be *AnyoneOS* without a fork.
92. Make life **areas configurable** (Work/Coaching/Teaching/Ana are hardcoded AREAS) — the single biggest Kevin-specific assumption in the file.
93. Ship a **demo mode** (`?demo=1`: seeded sample data, relay mocked, banner) so the live URL can be shown publicly without exposing anything real.
94. Record a 90-second **release walkthrough** (capture → Council streaming → sync across two devices → evening close) — the README hero moment.
95. Add MIT (or chosen) **LICENSE** + a short "philosophy" section in README: local-first, AI-proposes, $0/mo, one file — the manifesto is the marketing.
96. Run a full **Lighthouse pass** (PWA, a11y, perf) on the live URL; fix to ≥90s; screenshot the scores into the README.
97. **[F14]** Accessibility release pass: focus management after room swaps, `aria-live="polite"` on Council stream + toasts, focus-trap + Esc on sweep/wind/palette overlays, contrast check on the purple/gold palette.
98. Write the **1.0 release gate** in MISSION.md: all 🔴/🟠 findings closed, test suite green, Lighthouse ≥90, five manual gates re-run on-device, docs drift table all ✅ — and hold the line.
99. Tag **v1.0.0**, write honest release notes (what it is, what it deliberately isn't), and archive a signed backup of the moment.
100. **Ship it, then live in it for 30 days before adding a single feature.** The GOAT metric was never the roadmap — it's *open every day → trust what I see → capture instantly → close without anxiety*. Thirty consecutive days of that is the trophy. 🐐

---

## 11. Closing word to the next AI friend

You're inheriting something rare: a real, live, loved system with its history written down, its scars documented, and its owner all-in. The code will tell you the truth; MISSION.md will tell you the present; HANDOFF.md will tell you the past; Kevin will tell you the priority. Keep it ES5. Keep it one file. Keep it $0. Keep it calm. Propose — let Kevin approve.

Make it sturdy. Make it legendary. **LFG.** 🚀
