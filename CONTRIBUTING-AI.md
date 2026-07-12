# CONTRIBUTING-AI.md — the one page every AI collaborator reads first

You are editing Kevin's live personal life OS. It holds his real data. Data safety outranks your task. This page replaces tribal knowledge — everything here is enforced, not aspirational.

## The ES5 law (app only)

`index.html` is ES5-style, single-file, zero-dependency — **forever, on purpose**:

- ✅ `var` · function declarations · `.then()` chains · string concatenation · classic loops
- ❌ NO `const`/`let` · NO arrow functions · NO template literals · NO `async/await` · NO dependencies, build steps, frameworks, CDNs · NO splitting the file

Match the surrounding code exactly. The one exception: `relay/worker.js` is a Cloudflare Worker — modern ES modules are correct *there*.

Contraband scan after every app edit (must return nothing):

```sh
git diff -- index.html | grep -nE '=>|`|\bconst\b|\blet\b|async |await '
```

## The three-bump release rule

Every release bumps together, or not at all:

1. Footer version in `index.html` (`KevinOS v0.NN`)
2. `sw.js` → `CACHE = "kevinos-v0_NN"`
3. `SCHEMA_VERSION` — **only** when the persisted shape changes, always with a `prevV<NN` migration gate. Never casually.

Docs-only changes bump nothing.

## The data contract: touch() / save() / persist() / bury()

- **Every content edit calls `touch(it)`** to stamp `it.u`. Miss it and conflict merges silently prefer the other device's copy. (44 call sites exist; keep the streak.)
- **`save()`** = the loud write: schedules reminder sync + cloud push, then persists. Use after user-visible edits.
- **`persist()`** = the quiet write: local persistence only, no sync/reminder scheduling. Use for device-local cache/meta updates.
- **`bury(id)`** before removing any synced item — the tombstone in `state.deleted` is what stops it resurrecting via merge.
- **`portableDoc()`/`applyPortableDoc()`** are allowlist-based. Backups/snapshots never carry `sync`, `push`, `github`, `email`, `calendar`; `relay.token` is blanked. **Connections never travel.** Don't add a key to state without deciding its portability + sync class (`SYNC_SKIP`).
- **New persisted field ⇒ same-commit round-trip coverage.** The boot loader restores state through a whitelist; an unlisted field silently resets every reload (this bit six fields once). The auto-discovery walker in `test/app-logic.test.js` plants a sentinel in every persisted key and fails by name on any field boot drops — if you add a state field, that test must pass (restore the field in the boot whitelist, and teach the walker a sentinel rule if the field's type needs one) in the same commit.
- Never reintroduce regenerable caches into persisted state — `ghMem`, `sheetsMem`, `swimMem` are memory-only by design (P2 Blob Diet).

## Verification ritual (before and after every change set)

```sh
awk '/<script>/{flag=1;next}/<\/script>/{flag=0}flag' index.html > /tmp/kevinos-index-script.js
node --check /tmp/kevinos-index-script.js
node --check sw.js
node --check relay/worker.js
node relay/test/route-auth.test.js          # expect: route auth ok
sh test/run.sh                              # once the W1 suite exists — all green
```

Plus the contraband scan above, and the secret-pattern scan (see `MISSION.md`) before any commit that touched docs or the relay.

Never claim a test passed that you did not run. Browser/on-device checks you can't execute are reported `MANUAL-UNVERIFIED` with exact reproduction steps.

## Hard-won gotchas (do not relearn)

- App closures are unreachable from preview `eval` — test through the DOM and `localStorage["kevinos:v1"]`. `save()` is async; re-read localStorage in a separate eval.
- CORS blocks browsers, **not** `curl` — server-side curl against the live relay is the fast end-to-end test.
- Free AI seats blip (Gemini "high demand", OpenRouter slug rot) — expected; per-seat try/catch isolates it.
- The push cron is `*/2` on purpose — every-minute blew KV's 1,000-lists/day free cap. Don't "optimize" it back.
- Event delegation on stable containers only; full-room `innerHTML` re-renders must never drop listeners.
- Secrets: interactive `npx wrangler secret put NAME` only — never CLI args, never in files, docs, or logs. Names OK, values never.

## The multi-agent ceremony

Kevin runs a studio: one AI specs, another implements, another directs, another audits — with written contracts as the handoff medium. Your diff **will** be adversarially fact-checked by another model. Therefore:

- Small, reviewable commits; one item per commit, prefixed with its id (e.g. `W2.1: …`).
- Update the ledger (`MISSION.md` / the execution order's Wave Log) before you run out of context — a cold agent must be able to resume from one read.
- Honest status only: machine-verified vs `USER-REPORTED PASS` vs `MANUAL-UNVERIFIED` are different things.
- AI proposes, Kevin approves: pushes, deploys, schema bumps, and anything destructive or outward-facing wait for his explicit yes.

**Doc trust order when sources disagree:** code → `MISSION.md` → `GETTING_STARTED.md` → `HANDOFF.md` → `ROADMAP.md` → `CLAUDE_CODE_HANDOFF.md`. Log any drift you find.
