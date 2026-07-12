# KevinOS GOAT Wave Marathon — Claude Code Mission Prompt
*(Paste everything below this line as your first message to Claude Code. Prerequisite: `KEVINOS_EXECUTION_ORDER.md` and `KEVINOS_AUDIT.md` must be in the repo root.)*

---

You are Claude Code acting as the implementation owner for KevinOS.

This is a MARATHON mission. Do not stop after one item or one wave. Your goal is to execute the 11-wave plan in `KEVINOS_EXECUTION_ORDER.md`, strictly in wave order, as far as the verification gates allow — with every completed wave tested, bootable, ledgered, and honestly reported. A verified Wave 3 beats an unverified Wave 6. Depth of trust over breadth of claims.

## Repo context

- KevinOS is a local-first, single-file HTML personal life OS, live and daily-driven by Kevin. It holds his real data. Data safety outranks everything, including this mission.
- Locate the repo root with `git rev-parse --show-toplevel`. This checkout is root-layout: `index.html`, `sw.js`, `relay/worker.js`, `relay/test/route-auth.test.js` at/under the root. Search by symbol, never by line number.
- Live app: https://kevinbigham.github.io/kevinos/ · Live relay: https://kevinos-relay.kevinbigham.workers.dev

## First actions (in this exact order, before any edit)

1. Run `git status --short`. Identify pre-existing changes; never revert them — work around them.
2. Confirm `KEVINOS_EXECUTION_ORDER.md` AND `KEVINOS_AUDIT.md` exist at the repo root. **If either is missing, STOP and ask Kevin for it.** The execution order is your mission; the audit's §10 holds each item's full spec, §7 the findings they close, §9 the operating manual. You cannot execute items you can't spec.
3. Read, in order: `KEVINOS_EXECUTION_ORDER.md` (all of it — especially §1 sequencing laws, §2 conflict map, §4 GATE-76, §6 dependencies) → `KEVINOS_AUDIT.md` §5–§9 + §10 → `MISSION.md` (the current-truth record of v0.39) → skim `HANDOFF.md` / `GETTING_STARTED.md` / `CLAUDE_CODE_HANDOFF.md` for architecture and constraints, knowing their version facts are stale (your W0 fixes that).
4. Read the source: `index.html` (the whole app), `sw.js`, `relay/worker.js`, `relay/wrangler.toml`, `relay/test/route-auth.test.js`. Trust code over prose wherever they disagree; log the drift.
5. Run the verification ritual below. Record the baseline result in the Wave Log.
6. Begin Wave 0, item 51.

## Non-negotiable constraints (violating any of these = mission failure)

**App code (`index.html`):** ES5-style on purpose, forever. `var` only, function declarations only, `.then()` chains only, string concatenation only, classic loops. NO arrow functions, NO `const`/`let`, NO template literals, NO `async/await`, NO dependencies, NO build step, NO frameworks, NO external scripts/CDNs, NO splitting the file. Match surrounding code exactly. The relay (`relay/worker.js`) is the one exception — modern ES modules are correct there.

**Product:** local-first always; offline stays useful; AI proposes, Kevin approves (nothing auto-sends, nothing auto-creates); calm, not noisy; free-tier/$0 defaults; connections never travel (backups/snapshots restore data, never live credentials); never silently drop user data; never trade data safety for progress.

**Secrets:** this repo is public. No secret values in code, docs, commits, or logs — ever. Secret *names* are fine. Secrets are set only via interactive `npx wrangler secret put NAME`, typed by Kevin.

**Release ritual:** footer version, `sw.js` CACHE, and `SCHEMA_VERSION` follow the three-bump rule. Bump schema ONLY when the persisted shape changes, with a `prevV<NN` migration gate. Once W0 item 90 lands, its checklist becomes the ritual — use it for every wave release thereafter.

## Authority boundaries

**Do freely, no confirmation:** read anything; edit repo files; run local servers, node checks, the test suite, and `curl` against the live relay; create test files; commit locally.

**STOP and ask Kevin first:**
- `git push` (batch the ask at wave boundaries — commits accumulate locally until he says push)
- `npx wrangler deploy` (deploy windows are W4, W5, W8 — each needs his go, and some need him to type secrets)
- **GATE-76** (Wave 5): present options A/B/C from the execution order §4 with the trade-offs. NEVER implement any option without his explicit pick. Record the decision in the Wave Log like the D1-not-Supabase precedent.
- Any `SCHEMA_VERSION` bump: state the shape change + migration gate, get a yes, then write it.
- Anything destructive or outward-facing: deletions, force ops, new repos, OAuth scope/callback changes, renaming live URLs.

**Commits:** small and reviewable — one item (or one tight cluster) per commit, message prefixed with the item id (`W0.51: bump sw cache`, `W2.1: consolidate CONTENT_ARRAYS`). Every commit carries the trailer:
```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

## Execution rules

1. Waves strictly in order: W0 → W1 → W2 → … No skipping. Within a wave, follow the stated item order — it encodes real dependencies (§6 of the execution order).
2. Do not start wave N+1 until wave N's verification passes and its Wave Log entry is written.
3. Keep every wave bootable. If an item breaks boot, fix or revert that item before anything else.
4. **W1 tests are characterization tests:** they pin CURRENT behavior before W2 rewrites it. If a W1 test exposes a real pre-existing bug, log it; fix immediately only if it's a data-safety issue, otherwise pin actual behavior and file the bug in the Wave Log for Kevin.
5. Run the verification ritual after every wave and before every commit batch. Once the W1 suite exists, it joins the ritual permanently.
6. Never claim a test passed that you did not run. Browser/on-device checks you cannot execute are `MANUAL-UNVERIFIED` with exact reproduction steps — never `PASSED`.
7. If an item's audit spec conflicts with code reality, prefer the safer reading, implement that, and log the deviation with reasoning.
8. If an item proves far riskier than planned: finish the current safe state, log the blocker with an exact resume point, and continue only with wave-mates that don't depend on it; otherwise halt the wave and report.
9. Do not add features, refactors, or "improvements" outside the numbered items. The roadmap is the scope. Zero freelancing.
10. No docstring/comment churn on unchanged code. No formatting sweeps.

## Verification ritual

```sh
awk '/<script>/{flag=1;next}/<\/script>/{flag=0}flag' index.html > /tmp/kevinos-index-script.js
node --check /tmp/kevinos-index-script.js
node --check sw.js
node --check relay/worker.js
node relay/test/route-auth.test.js          # expect: route auth ok
# once W1 lands, also:
sh test/run.sh                              # all green, no exceptions
# ES5 contraband scan on your own app diff — MUST return nothing:
git diff -- index.html | grep -nE '=>|`|\bconst\b|\blet\b|async |await '
# secret-pattern scan before any commit batch that touched docs or relay:
grep -rnE "sk-|AIza|client_secret|BEGIN (EC|RSA) PRIVATE" index.html relay/worker.js *.md relay/*.md || true   # names OK, values = ABORT
```

## Ledger protocol (context-death insurance)

`KEVINOS_EXECUTION_ORDER.md` §7 is the live tracker — check its boxes as waves complete. Additionally, append a `## Wave Log` section to that same file and write an entry **at the end of every wave and BEFORE you run low on context**, containing: wave + items completed, files changed, commits made, tests run with results, `MANUAL-UNVERIFIED` list with steps, deviations/blockers, decisions awaiting Kevin (exact commands ready to paste), and the **exact next task** — precise enough that a cold agent resumes from one read. If you must stop mid-wave, stop only after this entry exists.

## Realistic expectations

A strong single session should land W0–W3 fully verified, with W4 possibly code-complete and its deploy queued for Kevin. That outcome is a win. Blowing past gates to inflate the wave count is a loss. If you finish W3 with context to spare, keep going — the gates, not ambition, decide where you stop.

## Final response format

1. Waves completed / wave in progress (with % of items)
2. Items done by number; items remaining in the current wave
3. Files changed; commits made (and that nothing was pushed/deployed without approval)
4. Tests run + results; full `MANUAL-UNVERIFIED` list with exact steps
5. Actions awaiting Kevin: pushes, deploys, secrets, GATE-76 (paste-ready commands)
6. Pre-existing bugs discovered (from characterization) + deviations from spec, with reasoning
7. Known risks
8. Exact next task

Begin now: First Actions step 1.
