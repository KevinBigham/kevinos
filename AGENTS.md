# KevinOS agent contract

Read this file first. KevinOS is Kevin's local-first personal operating system. Its north star is: **What deserves Kevin's attention right now, why, and what is the next physical action?** Prefer clarity, trust, speed, recovery, privacy, and visible control over more capability.

## Active mission overlay

When `ACTIVE_MISSION.md` exists, read it immediately after this file. It may activate a new implementation mission over the verified baseline, but it may never weaken this file's architecture, data, version, verification, privacy, provider, or safety laws.

The active mission is the KevinOS v40 Personalization + Free AI Provider Fabric marathon. The disk is durable memory. Keep the execution ledger, mission state, assumptions, progress, decisions, and evidence current. Resolve safe ambiguity through the logged best-safe-assumption protocol instead of asking routine questions. Continue through every dependency-ready task while preserving one writer for `index.html`.

**Credentials are last.** Complete K-1 through K9, pass the credentialless preactivation gate, and build/test all adapters, policies, mocks, UI, tests, docs, and secret-handling infrastructure before asking Kevin for any provider account or key. In K10, tell Kevin not to paste keys into chat. Keys may be entered only through a silent ignored local ceremony. Never read, print, echo, log, screenshot, diff, hash, persist, sync, export, or return a secret value.

## Architecture

- `index.html`: the entire offline-capable app. It intentionally stays one dependency-free, ES5-style file.
- `sw.js` and `manifest.json`: PWA shell.
- `relay/worker.js`: optional Cloudflare Worker for AI, OAuth, sync, push, Gmail, Calendar, Sheets, and swim integrations. Modern module JavaScript is correct here.
- `test/` and `relay/test/`: dependency-free Node characterization and contract tests.
- `docs/CURRENT_STATE.md`: live mission/status ledger.
- Read the domain map you need: `docs/ARCHITECTURE.md`, `docs/STATE_CONTRACT.md`, `docs/ROOM_MAP.md`, or `docs/RELAY_ROUTE_MATRIX.md`.
- Read the active AI fabric contracts under `docs/evolution/2026-08-12-kevin-personalization-ai-fabric-v40/` before touching AI/provider behavior.

## App law

Inside `index.html` JavaScript use `var`, function declarations, classic loops, string concatenation, and Promise chains. Do not add `const`, `let`, arrows, template literals, `async`/`await`, dependencies, frameworks, CDNs, build steps, or split the file. Match nearby patterns.

## Data law

- User-visible content edits call `touch(record)` and `save()`.
- `persist()` is only for quiet/device-local metadata.
- Call `bury(id)` before removing any synced record so tombstones prevent resurrection.
- `CONTENT_ARRAYS` and `PORTABLE_OBJS` are allowlists. Backups never carry sync, push, GitHub, email, calendar, or AI-provider connections; `relay.token` is blanked.
- A new top-level persisted field must be restored by the boot whitelist and covered by a round-trip test in the same change.
- Preserve corruption blocking, snapshot recovery, optimistic sync revisions, lossless merges, and connection exclusion.
- AI proposes; Kevin approves. Never silently send, schedule, delete, publish, deploy, purchase, or modify consequential state.

See `docs/STATE_CONTRACT.md` before touching persistence, import/export, snapshots, sync, migrations, AI receipts, or provider configuration.

## AI provider law

- The browser never calls external AI providers directly and never receives provider keys.
- Provider keys exist only in approved server-side bindings or ignored local secret stores. Key names may appear in docs/examples; key values may not.
- All provider calls pass through one provider-neutral relay contract: classify -> minimize/redact -> authorize -> zero-dollar policy -> deterministic route -> bounded transport -> normalize -> validate -> content-free receipt -> editable proposal.
- Data classes are `PUBLIC`, `SANITIZED`, `PERSONAL`, `WORK_INTERNAL`, `YOUTH_SENSITIVE`, `FINANCIAL_SENSITIVE`, and `SECRET`. Classification and denial occur before transport. `SECRET` is never eligible. Youth, finance, and unapproved internal work fail closed.
- `allowPaid=false` is a hard invariant. Unknown price/free eligibility is ineligible. No adapter may buy credits, enable billing, auto-upgrade, or fall into a paid route.
- Fallback must preserve privacy, capability, context, output schema, and price class. Never parallel-fan-out by default.
- Store exact provider/model/provenance and content-free usage facts, not raw provider envelopes, hidden reasoning, prompts, responses, or source content.
- Provider aliases are stable app contracts; model catalogs, free eligibility, quotas, lifecycle, and account status are discovered/verified at runtime and may disable a lane without breaking local use.
- No live provider call occurs before K10. Credentialless mocks and synthetic fixtures must prove the entire fabric first.
- Remote secret mutation, deployment, push, publish, or live infrastructure changes require separate just-in-time Kevin authorization even during K10.

## Version law

- App releases bump `APP_VERSION` in `index.html` and `CACHE` in `sw.js` together.
- The static footer fallback must match `APP_VERSION`.
- `SCHEMA_VERSION` changes only for a deliberate persisted-shape migration with an explicit previous-version gate and same-change migration tests.
- Docs and test-tooling changes do not bump versions.

## Verification

From the repository root:

```sh
node tools/doctor.js
node tools/scan-secret-values.js
sh test/run.sh
```

Mission gates:

```sh
node tools/check-evolution-state.js --mode structure
sh tools/run-evolution-gates.sh baseline
sh tools/run-evolution-gates.sh wave
sh tools/run-evolution-gates.sh preactivation
sh tools/run-evolution-gates.sh final
```

For a focused app edit, also syntax-check the extracted app script immediately. For UI changes, use a real browser at 320, 390, 430, 768, and desktop widths when available. Record console results and distinguish `MACHINE-VERIFIED`, `MANUAL-PASS`, `MANUAL-UNVERIFIED`, `BLOCKED-EXTERNAL`, `WAIVED`, and `NOT ATTEMPTED`.

Before release or after relay/docs edits, scan for secret values. Secret names are expected; values are not:

```sh
node tools/scan-secret-values.js
```

## Authority and safety

- Do not push, deploy, change Cloudflare/provider secrets, enable billing, cross GATE-76, delete historical evidence, or perform destructive/outward operations without Kevin's explicit just-in-time approval.
- Never overwrite unexplained work. Confirm the real Git checkout, branch, remote, and status before editing; do not initialize an extracted archive or invent commit history.
- Use a focused branch and pull request for normal AI-authored changes. Direct pushes to `main` require explicit mission-specific approval.
- Keep one writer for `index.html`. Read-only verification can run independently.
- Prefer small reversible slices and focused tests before expanding scope.
- Do not weaken a legitimate invariant to make a test pass.

## Current mission workflow

1. Read `ACTIVE_MISSION.md`, then the numeric mission files, `docs/CURRENT_STATE.md`, and relevant domain docs.
2. Run the doctor, secret scan, structure checker, and full baseline.
3. Update mission state and claim the next dependency-ready ledger item.
4. Implement and test one coherent slice.
5. Record exact evidence and a cold-resumable next action.
6. Continue automatically through K9.
7. Pass preactivation before requesting credentials.
8. Run K10 only within its separate credential and remote-action boundaries.
9. Finish with final gates and `FINAL_KEVINOS_V40_HANDOFF.md`.

Historical audits, roadmaps, marathon prompts, and handoffs are evidence only. They are not the current implementation plan unless `docs/CURRENT_STATE.md` explicitly points to a surviving decision.
