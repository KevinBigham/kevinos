# KevinOS Claude Code Handoff Bible

Use this as the first message to Claude Code / Fable5 when asking it to audit KevinOS, find inefficiencies, and safely improve the project.

---

## Mission

You are taking over KevinOS for a careful quality pass.

Goal: read the current repo, understand the app and relay architecture, identify inefficient, fragile, duplicated, stale, or unnecessarily complex areas, then fix the highest-value issues without changing the product's spirit.

This is not a rewrite mission. KevinOS is already live and useful. Your job is to make it sturdier, calmer, easier to maintain, and less wasteful.

Start by auditing. Then propose a ranked plan. Then implement the agreed safe fixes.

---

## First Files To Read

Read these before changing anything:

1. `GETTING_STARTED.md` - current end-to-end setup guide and live-stack truth.
2. `README.md` - short entrypoint and repo map.
3. `HANDOFF.md` - deep project history, architecture, constraints, endpoint map, state model.
4. `ROADMAP.md` - shipped feature history and remaining backlog.
5. `relay/RELAY_SETUP.md` - relay-specific setup appendix.
6. `index.html` - the whole app.
7. `sw.js` - service worker and push notification click behavior.
8. `manifest.json` - PWA manifest and share target.
9. `relay/wrangler.toml` - Worker bindings, public vars, cron, model config.
10. `relay/worker.js` - Cloudflare Worker relay.

Trust source code over older prose if there is drift. If docs and code disagree, note it and decide whether to fix docs or code.

---

## Current Live Facts

- Repo root on Kevin's Mac: `/Users/kevin/KevinOS/app`
- Live app: `https://kevinbigham.github.io/kevinos/`
- Live relay: `https://kevinos-relay.kevinbigham.workers.dev`
- App version in footer: `KevinOS v0.40` *(freeze-frame — always trust `index.html`'s footer and `MISSION.md` over this line)*
- Service worker cache: `kevinos-v0_40`
- Persisted schema stamp: `state.v = 39`
- Relay Worker name: `kevinos-relay`
- Relay entrypoint: `relay/worker.js`
- Relay config: `relay/wrangler.toml`
- Worker compatibility date: `2024-11-01`
- CORS origin: `https://kevinbigham.github.io`
- Current relay health should show Gemini provider, six Council seats (gemini, cloudflare, groq, mistral, openrouter, zai), and all capability flags true.

Quick health check:

```sh
cd /Users/kevin/KevinOS/app
curl -s https://kevinos-relay.kevinbigham.workers.dev/
```

---

## Non-Negotiable Constraints

### App constraints

`index.html` is intentionally one self-contained ES5-style vanilla JS app.

Do not introduce:

- npm dependencies
- a build step
- frameworks
- external scripts/CDNs
- TypeScript
- bundlers
- modules/imports in the browser app

Match existing app style:

- use `var`
- use function declarations
- use `.then()` promise chains
- use string concatenation
- use classic loops when nearby code does
- avoid arrow functions, `const`, `let`, template literals, `async/await` in `index.html`

The Cloudflare Worker is different. `relay/worker.js` can use modern ES module syntax.

### Product constraints

- KevinOS must remain local-first.
- Offline use must remain useful.
- AI proposes; Kevin approves.
- Email never sends without explicit approval.
- Calendar events never create without explicit approval.
- Secrets never go into browser code or repo docs.
- Keep free-tier/low-cost defaults unless Kevin explicitly chooses otherwise.
- Preserve current live URLs and OAuth callback assumptions unless the task is specifically to migrate them.

---

## Secrets Policy

This repo is public. Do not add secret values anywhere.

Allowed in docs/code:

- public URLs
- public OAuth client IDs already in `wrangler.toml`
- public VAPID key already in `wrangler.toml`
- secret names such as `GEMINI_API_KEY` and `GOOGLE_CLIENT_SECRET`

Never commit:

- AI provider API keys
- VAPID private key
- GitHub client secret
- Google client secret
- OAuth access tokens
- OAuth refresh tokens
- personal data exports
- downloaded `client_secret_*.json` files

Use only interactive secret commands:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler secret put NAME
```

Do not pass secret values as CLI arguments.

---

## Suggested Audit Areas

Prioritize issues that reduce bugs, duplicated logic, or operational fragility. Avoid churn.

### 1. App maintainability

Look for:

- large repeated HTML string patterns that can be simplified safely
- duplicated room rendering idioms
- inconsistent save/persist usage
- inconsistent local-vs-synced state boundaries
- stale comments or feature labels
- dead helper functions or unreachable branches
- expensive render work that runs too often
- brittle event delegation or selector naming
- user-facing copy that misleads setup or troubleshooting

Be careful: one-file architecture is intentional. Do not split the app unless Kevin explicitly asks.

### 2. State and sync safety

Review:

- `SYNC_SKIP`
- `SYNC_ARRAYS`
- `buildSyncDoc`
- `applySyncDoc`
- `mergeRemoteDoc`
- backup import behavior
- per-device connection state
- conflict handling and retry limits
- sync behavior while editing

Look for cases where:

- local-only state accidentally syncs
- synced data accidentally stays local
- backup restore could resurrect stale device connection state
- conflict merge might drop data
- UI could show the wrong link code or stale sync state

### 3. Relay reliability

Review:

- health endpoint flags
- `/council` streaming and non-streaming behavior
- AI provider fallback and timeout handling
- JSON parsing/error surfaces
- OAuth session storage in KV
- Gmail/Calendar token refresh
- push sending and cron behavior
- D1 sync routes
- CORS handling

Look for:

- missing guardrails when bindings are absent
- overly generic error messages
- duplicated Google/GitHub session handling that can be tightened
- avoidable AI calls
- routes that should degrade gracefully but do not

### 4. Performance and network efficiency

Look for:

- unnecessary full re-renders
- repeated Gmail/Calendar fetches
- reminders syncing too often
- sync pushes while nothing changed
- heavy DOM strings rebuilt on every small action
- expensive filters/sorts repeated in the same render
- missed caching opportunities that do not compromise freshness

Do not optimize prematurely. Fix obvious waste that is easy to prove.

### 5. PWA and offline behavior

Review:

- `sw.js` cache strategy
- version/cache bump rule
- notification click behavior
- install/share-target assumptions
- stale-cache recovery docs
- local HTTP vs `file://` behavior

### 6. Documentation drift

Compare setup docs to code:

- `GETTING_STARTED.md`
- `relay/RELAY_SETUP.md`
- `HANDOFF.md`
- `README.md`

Fix drift when it can confuse future setup. Do not delete hard-won technical detail.

---

## Safe Fix Criteria

A fix is high value if it:

- removes real duplication without changing behavior
- prevents data loss
- improves setup correctness
- makes errors easier to recover from
- reduces unnecessary remote calls
- improves sync/push/OAuth reliability
- makes code easier to audit without adding architecture
- fixes stale docs that could break a fresh setup

A fix is suspicious if it:

- changes user flows unnecessarily
- adds dependencies
- splits the one-file app
- changes OAuth scopes or callback URLs without reason
- changes sync semantics casually
- changes service worker cache/version for docs-only work
- touches secrets or personal data
- does broad formatting churn

---

## Expected Workflow

1. Run `git status --short` and identify pre-existing changes.
2. Read the source/docs listed above.
3. Produce a ranked audit with severity, evidence, and concrete file references.
4. Ask Kevin before broad refactors, deployments, destructive commands, or schema-changing work.
5. Implement a small batch of high-confidence fixes.
6. Run verification.
7. Summarize changed files, what improved, what was not touched, and remaining risks.

Do not revert user changes. If the worktree is dirty, work around unrelated changes.

---

## Useful Commands

From repo root:

```sh
cd /Users/kevin/KevinOS/app
git status --short
rg --files
```

Docs and whitespace:

```sh
git diff --check
```

Relay syntax:

```sh
node --check relay/worker.js
```

Live relay health:

```sh
curl -s https://kevinos-relay.kevinbigham.workers.dev/
```

Local preview:

```sh
cd /Users/kevin/KevinOS/app
python3 -m http.server 8128
```

Then open:

```text
http://localhost:8128/
```

Secret-pattern scan. This may find secret names, which is OK. It must not find real private values:

```sh
rg -n "sk-|AIza|client_secret|GITHUB_CLIENT_SECRET|GOOGLE_CLIENT_SECRET|VAPID_PRIVATE_KEY|GEMINI_API_KEY|GROQ_API_KEY|MISTRAL_API_KEY|OPENROUTER_API_KEY" GETTING_STARTED.md README.md relay/RELAY_SETUP.md HANDOFF.md relay/wrangler.toml relay/worker.js index.html
```

ES5-style spot check for app changes:

```sh
git diff -- index.html | rg -n "=>|`|\\bconst\\b|\\blet\\b|async |await "
```

If this returns matches in changed app code, inspect carefully. Existing worker code is exempt.

---

## Verification Checklist Before Handing Back

At minimum:

- `git diff --check`
- `node --check relay/worker.js`
- `curl -s https://kevinos-relay.kevinbigham.workers.dev/`
- secret-pattern scan reviewed
- manual `git diff` inspected

If touching `index.html`:

- confirm footer version/cache/schema rules
- no accidental ES6 in app code
- local preview opens
- affected room can be smoke-tested
- no obvious console errors in browser preview

If touching sync:

- test pull/push conflict path if feasible
- confirm local-only state remains local
- confirm content arrays still sync
- confirm backup import does not silently link sync

If touching relay:

- `node --check relay/worker.js`
- route-level curl tests for affected routes
- live health still reports expected flags after deploy, if deployed
- no secrets in diffs

If touching docs only:

- no app version bump
- no service worker cache bump
- no schema bump
- links resolve locally

---

## Current Docs Work Just Completed

Recent docs pass added:

- `GETTING_STARTED.md` - full end-to-end setup guide.
- README Start here link.
- relay appendix pointer to the new guide.
- HANDOFF repo map mention of the new guide.

Known caveat: if this handoff is read before commit/push, `GETTING_STARTED.md` and this file may be untracked local changes.

---

## Good First Improvements To Consider

Start with a read-only audit, but likely useful places to inspect:

1. Whether `GETTING_STARTED.md` should be linked from a visible in-app footer/help affordance or only repo docs.
2. Whether health flag names in docs and Worker can be kept in one source of truth.
3. Whether repeated fetch/error/toast patterns in `index.html` can be reduced without changing the one-file architecture.
4. Whether sync push can skip when the serialized sync doc is unchanged.
5. Whether Gmail/Calendar session and account selection logic can be made less fragile.
6. Whether local preview docs should include CORS-safe mock guidance for relay features.
7. Whether stale historical notes in `HANDOFF.md` should be marked "historical" where they contradict the current code.
8. Whether reminder scheduling over-syncs on frequent `save()` calls.
9. Whether Markdown docs should avoid personal examples or account names that are no longer needed.
10. Whether any route returns `500` where a friendlier structured setup error would help the app.

Do not do all of this at once. Rank, pick the safest highest-value fixes, and keep the blast radius small.

---

## Tone For Kevin

Kevin likes direct, warm, high-energy collaboration. He appreciates momentum, but not chaos.

Be concise in status updates. Lead with what you found and what you changed. If something is risky, say so plainly. Avoid over-explaining unless he asks.

Namaste. Make it sturdy.
