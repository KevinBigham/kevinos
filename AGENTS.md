# KevinOS agent contract

Read this file first. KevinOS is Kevin's local-first personal operating system. Its north star is: **What deserves Kevin's attention right now, and what is the next physical action?** Prefer clarity, trust, speed, recovery, and visible control over more capability.

## Architecture

- `index.html`: the entire offline-capable app. It intentionally stays one dependency-free, ES5-style file.
- `sw.js` and `manifest.json`: PWA shell.
- `relay/worker.js`: optional Cloudflare Worker for AI, OAuth, sync, push, Gmail, Calendar, Sheets, and swim integrations. Modern module JavaScript is correct here.
- `test/` and `relay/test/`: dependency-free Node characterization and contract tests.
- `docs/CURRENT_STATE.md`: live mission/status ledger.
- Read the domain map you need: `docs/ARCHITECTURE.md`, `docs/STATE_CONTRACT.md`, `docs/ROOM_MAP.md`, or `docs/RELAY_ROUTE_MATRIX.md`.

## App law

Inside `index.html` JavaScript use `var`, function declarations, classic loops, string concatenation, and Promise chains. Do not add `const`, `let`, arrows, template literals, `async`/`await`, dependencies, frameworks, CDNs, build steps, or split the file. Match nearby patterns.

## Data law

- User-visible content edits call `touch(record)` and `save()`.
- `persist()` is only for quiet/device-local metadata.
- Call `bury(id)` before removing any synced record so tombstones prevent resurrection.
- `CONTENT_ARRAYS` and `PORTABLE_OBJS` are allowlists. Backups never carry sync, push, GitHub, email, or calendar connections; `relay.token` is blanked.
- A new top-level persisted field must be restored by the boot whitelist and covered by a round-trip test in the same change.
- Preserve corruption blocking, snapshot recovery, optimistic sync revisions, lossless merges, and connection exclusion.
- AI proposes; Kevin approves. Never silently send, schedule, delete, or modify important state.

See `docs/STATE_CONTRACT.md` before touching persistence, import/export, snapshots, sync, or migrations.

## Version law

- App releases bump `APP_VERSION` in `index.html` and `CACHE` in `sw.js` together.
- The static footer fallback must match `APP_VERSION`.
- `SCHEMA_VERSION` changes only for a deliberate persisted-shape migration with an explicit previous-version gate and same-change migration tests.
- Docs and test-tooling changes do not bump versions.

## Verification

From the repository root:

```sh
node tools/doctor.js
sh test/run.sh
```

For a focused app edit, also syntax-check the extracted app script immediately. For UI changes, use a real browser at 320, 390, 430, 768, and desktop widths when available. Record console results and distinguish `MACHINE-VERIFIED`, `MANUAL-PASS`, `MANUAL-UNVERIFIED`, `BLOCKED`, and `NOT ATTEMPTED`.

Before release or after relay/docs edits, scan for secret values. Secret names are expected; values are not:

```sh
node tools/doctor.js
```

## Authority and safety

- Do not push, deploy, change Cloudflare secrets, cross the GATE-76 encryption gate, delete historical evidence, or perform destructive remote operations without Kevin's explicit approval.
- Never overwrite unexplained work. Confirm the real Git checkout, branch, remote, and status before editing; do not initialize an extracted archive or invent commit history.
- Use a focused branch and pull request for normal AI-authored changes. Direct pushes to `main` require explicit mission-specific approval.
- Keep one writer for `index.html`. Read-only verification can run independently.
- Prefer small reversible slices and focused tests before expanding scope.
- Do not weaken a legitimate invariant to make a test pass.

## Current mission workflow

1. Read `docs/CURRENT_STATE.md` and the relevant domain doc.
2. Run the doctor and full baseline.
3. Use `docs/ai/WORK_PACKET_TEMPLATE.md` for a bounded change.
4. Implement and test one coherent slice.
5. Update `docs/CURRENT_STATE.md` with files, behavior, tests, manual evidence, and risks.
6. Hand off with `docs/ai/HANDOFF_TEMPLATE.md` if incomplete.

Historical audits, roadmaps, marathon prompts, and handoffs are evidence only. They are not the current implementation plan unless `docs/CURRENT_STATE.md` explicitly points to a surviving decision.
