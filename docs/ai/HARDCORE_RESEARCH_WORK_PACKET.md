# KevinOS hardcore research implementation packet

## Outcome

Implement every recommendation in `KevinOS_Hardcore_Open_Source_Research_Report.md` that is currently authorized and whose evidence gate is open, while preserving KevinOS's calm local-first trust model.

## Current evidence

- Starting release: app v0.50, cache `kevinos-v0_50`, schema v39.
- Starting gates on 2026-08-11: `node tools/doctor.js` and `sh test/run.sh` both green.
- Confirmed gaps: focus order mutates `state.items`; AI proposals lack proof-bearing receipt v2; Studio accepts non-empty free-text evidence as proof.

## Scope

- Allowed files: `index.html`, `sw.js`, dependency-free tests, current contract/decision/adoption docs, and current AI work/handoff templates.
- Forbidden: relay/provider expansion, deploy/push/secrets, framework or dependency changes, GATE-76, destructive history cleanup, autonomous execution, surveillance, or an unapproved schema migration.
- Data/schema: prefer optional nested record fields and bounded device-local sidecars; schema stays v39 unless a formal migration becomes unavoidable.
- Security/privacy: receipts store bounded metadata, IDs, fingerprints, counts, and explicit evidence; never secrets, hidden reasoning, whole contexts, passive activity, or raw provider payloads.

## Implementation contract

Ship separate reversible slices in report order. Run focused tests immediately after each slice. Do not implement Track B/C items whose own evidence or approval thresholds remain closed; document those gates precisely.

## Acceptance

- Focused checks: app logic, UI contracts, portability, merge, convergence, capture, XSS, plus new bounded-operation/reference-harness checks where applicable.
- Full gate: `sh test/run.sh` after every release slice.
- Manual surfaces: 320, 390, 430, 768, and desktop widths; keyboard, focus, cancel/Undo, hard reload, offline reload, and zero console errors.
- Evidence: exact versions, commands, results, changed files, rollback, and remaining closed gates in `docs/CURRENT_STATE.md`.

## Authority gates

No push, deploy, remote mutation, secret change, GATE-76 work, schema migration, external adapter, production CRDT, or conflict editor is authorized. Track B/C experiment gates remain binding.

## Completion receipt — 2026-08-11

- Delivered seven compatible releases: v0.51 Focus Rail, v0.52 AI Job Receipt v2, v0.53 Mission Proof Bundle, v0.54 high-stakes interruption, v0.55 read-only recovery drill, v0.56 Local Flight Recorder pilot, and v0.57 Calm Friction pilot. Schema remains v39.
- Completed the safe test-only phases for material conflict diagnostics and the operation-based sync reference harness. Production merge behavior is unchanged.
- `sh test/run.sh`: ALL GREEN. Chromium manual pass at 320, 390, 430, 768, and 1440 widths; zero horizontal overflow and zero final console warnings/errors. Offline reload passed.
- Closed gates are documented in `docs/CURRENT_STATE.md`; no gated feature was inferred into scope.
