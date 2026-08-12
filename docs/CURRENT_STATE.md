# KevinOS current state and Convergence ledger

This is the canonical live mission ledger. Code and passing tests remain the behavior source of truth.

## Baseline

- Workspace: supplied archive at `/Users/tkevinbigham/Downloads/kevinos-main`; no `.git` directory, branch, remote, or commit history.
- Runtime: dependency-free static PWA plus plain Node test scripts; no package install required.
- Baseline version: app v0.49, service-worker cache `kevinos-v0_49`, schema v39.
- Current release: app v0.57, service-worker cache `kevinos-v0_57`, schema v39.
- Baseline gate on 2026-08-09: `sh test/run.sh` — ALL GREEN.
- Browser baseline: real Chromium at 390x844 reproduced crushed mobile task text, duplicate navigation, missing Tasks bottom-nav entry, and microphone overlap; console had zero warnings/errors.
- Governing mission: KevinOS Convergence. Historical marathon documents are evidence, not current plans.

## Status ledger

| Wave | Status | Current result |
|---|---|---|
| 0 — AI operating contract | VERIFIED | Canonical docs, thin adapters, local procedures, doctor, and historical banners landed; doctor + full suite green. |
| 1 — Mobile trust repair | VERIFIED | Task rows wrap, expose one overflow menu, preserve accessible completion, and show overdue state; Capture is a five-tab quick-first sheet; 390px browser receipt + UI contracts green. |
| 2 — Navigation and legacy convergence | VERIFIED | `ROOM_DEFS` drives routing/rendering/navigation/commands/aliases/More; Home/Launch deep links converge on Today; Weather/Swim/Sheets migrated into conditional Work Pulse. |
| 3 — Today/NOW | VERIFIED | NOW is deterministic and dominant with outcome, physical action, hard stop, risk, and at most three chosen commitments; AI/system material is collapsed Support. |
| 4 — First useful day | VERIFIED | Restore/clean/isolated-demo entry, outcome/action/hard-stop setup, capture+Undo proof, and recovery choice verified at 390px; fresh normal state no longer seeds examples. |
| 5 — State checkpoint | VERIFIED | Schema remains v39 by deliberate compatible extension; AI/build nested fields pass boot, portable round-trip, malformed fixture, merge, and three-device convergence suites. |
| 6 — AI Proposal Inbox | VERIFIED | Decide/Plan/Review/Draft/Challenge, explicit sharing, provenance, edit/apply/reject/Council/Undo, task/note/event/project mutations, and local outcome/reliability summaries implemented and browser-checked. Calendar and AI proposal views are type-separated. |
| 7 — Studio Mission Control | VERIFIED | Missions expose role, agent, repo/branch/worktree, allowed/forbidden scope, acceptance, commands, verification/evidence, commit reference, blockers, and handoff; agent/role/status filters and four packet types work; Shipped is proof-gated. |
| 8 — Hardening/release | VERIFIED | v0.50; route body ceilings, nonce OAuth, safe errors, SSRF/URL guards, security headers, XSS corpus, light/dark contrast, reduced motion, coarse-pointer targets, responsive/performance/offline checks, stable manifest ID, compact footer, adoption scorecard, doctor, and full release gate green. |
| 9 — Focus Rail | VERIFIED | v0.51; explicit daily ranks and reason receipts overlay NOW without changing canonical task storage order; portable, merge, three-device, and 390px browser receipts cover the optional fields and controls. |
| 10 — AI Job Receipt v2 | VERIFIED | v0.52; model-neutral context/request/response fingerprints, exact UTF-8 byte budget, bounded attempt status, deterministic local checks, review/application/Undo evidence, and legacy read-only receipts; browser showed the full 2/2 check receipt. |
| 11 — Mission Proof Bundle | VERIFIED | v0.53; stable acceptance IDs, versioned packet fingerprints, bounded attempt/verification receipts, reported-vs-local truth, stale proof detection, required waiver reasons, and visible reasoned overrides; browser showed stale/unverified proof honestly. |
| 12 — High-stakes interruption | VERIFIED | v0.54; backup replacement, snapshot restore, and mission override share an accessible consequence/confirm/cancel contract; browser Escape checks close safely and return focus through renderer replacement. |
| 13 — Read-only recovery drill | VERIFIED | v0.55; browser-tested backup parsing validates, fingerprints, compares counts, reports `none performed`, and records only device-local drill metadata without replacing or syncing canonical state. |
| 14 — Local Flight Recorder pilot | VERIFIED | v0.56; browser-tested bounded device-local receipts cover approved AI apply/Undo and import/restore, with stable semantic names, status, fingerprints, affected counts, safe Undo visibility, checkpoint links, retention, and corrupt-store tolerance. |
| 15 — Calm Friction pilot | VERIFIED | v0.57; browser-tested and off by default, explicit NOW/Capture marks use five fixed categories, 12-hour duplicate compaction, 30-day/200-row local retention, one fixed weekly suggestion, and immediate off/clear controls. No task text, sync, backup, relay, notification, or telemetry path. |
| 16 — Conflict/sync research | MACHINE-VERIFIED | Test-only material-ambiguity fixtures preserve the current merge rule and keep the production conflict gate closed; an operation-stream reference model converges across 50 fixed seeds and all six three-device orders. |

## Gates and deliberate constraints

- Keep `index.html` single-file, dependency-free, and ES5-style.
- Schema stayed v39. AI proposals and Studio extend existing open record shapes compatibly; old records normalize at use sites and remain readable.
- GATE-76 client-side sync encryption remains deferred until the live version is confirmed, the real-device re-key drill passes, and Kevin explicitly approves it.
- No push, deploy, secrets mutation, or historical-file deletion is authorized by this local implementation mission.
- The 30-day daily-driver observation period starts when Kevin adopts v0.50; its ready-to-use local scorecard is `docs/ADOPTION_SOAK.md`.
- Track B3 capture triage remains closed until the 30-day soak demonstrates repeated Inbox friction. Track B4 production conflict state/UI remains closed until a real named-field ambiguity is reproduced; only test fixtures exist. Track B5 remains closed because no derived view has demonstrated meaningful recomputation cost.
- Track C1 is complete as a research-only test harness. Track C2 remains closed absent repeated real lost-edit incidents that survive the current revision/tombstone model and bounded diagnostics. Track C3 remains closed absent a named source, repeated action-level benefit, explicit consent, and a source-specific privacy/security packet.
- The report's Do Not Build boundaries remain active: no CRDT/database/framework rewrite, passive surveillance, engagement pressure, autonomous outward action, external telemetry, or unapproved adapter/provider expansion.

## Historical material

Keep for evidence, but do not treat as current instructions: `MISSION.md`, `HANDOFF.md`, `ROADMAP.md`, `KEVINOS_AUDIT*.md`, `KEVINOS_EXECUTION_ORDER.md`, `CLAUDE_CODE_*`, and `CODEX_FINAL_ASCENT_PROMPT.md`. Proposed future move: place these under `docs/history/` after explicit approval, preserving filenames.

## Verification receipt

- Focused: app logic, UI contracts, 12-surface external-content XSS corpus, operations, friction, material-conflict fixtures, portability, merge, convergence, 50-seed operation-reference permutations, relay auth/sync, and security-boundary suites all green.
- Release: `sh test/run.sh` — ALL GREEN on 2026-08-11 at app v0.57/schema v39/cache `kevinos-v0_57`.
- Browser: Chromium at 320x568, 390x844, 430x932, 768x1024, and 1440x900; zero same-page horizontal overflow. Explicit focus reasons/order, AI receipt details, stale mission proof, mission and backup high-stakes Escape/focus return, read-only backup drill, AI apply/Undo operation receipts, friction enable/mark/aggregate/clear/off, hard reload, and service-worker offline reload passed. Final console: zero warnings/errors.
- Accessibility: selected normal-text contrast ratios are 4.78–15.31 light and 6.51–15.08 dark; reduced-motion CSS suppresses recurring animation and coarse-pointer CSS enforces 44px controls.
- Performance: with 1,000 tasks + 500 notes + the maximum 200 friction marks (176 KB canonical state plus the bounded sidecar), Chromium DOMContentLoaded was 69 ms and load 70 ms on this machine. NOW stayed capped at three and the weekly aggregate rendered. This does not open Track B5's checkpoint gate.
- Data/security: schema v39 round trip, connection exclusion, tombstones, calendar/AI pending isolation, OAuth nonce replay, byte-limit boundaries, private-network URL rejection, hostile-content render corpus, and safe provider-error envelope covered.

## Meaningful files

- Product/runtime: `index.html`, `sw.js`, `relay/worker.js`.
- Verification: `test/app-logic.test.js`, `test/ui-contract.test.js`, `test/xss-corpus.test.js`, `test/operations.test.js`, `test/friction.test.js`, `test/conflicts.test.js`, `test/sync-reference.test.js`, `relay/test/security-boundaries.test.js`, `test/run.sh`, `tools/doctor.js`.
- Operating layer: `AGENTS.md`, `relay/AGENTS.md`, `docs/*` including `docs/LOCAL_EVIDENCE_VOCABULARY.md`, `.agents/skills/*`, `CLAUDE.md`, `.github/copilot-instructions.md`, `GETTING_STARTED.md`, `README.md`.
- Install/release: `manifest.json` now has stable `id: "./"`; `docs/ADOPTION_SOAK.md` is the local 30-day scorecard.

## Residual risks

- No live deploy, Lighthouse-on-live, real provider call, real OAuth consent, real-device push, 30 elapsed days of adoption evidence, real-world material conflict, or multi-device re-key was performed; this archive has no Git metadata and the mission does not authorize remote mutation.
- GATE-76 remains intentionally deferred by its explicit product gate. Historical Home/Launch internals remain as compatibility/reuse code; their user-facing routes alias Today.

## Cold resume

Read `AGENTS.md`, this file, and one relevant domain doc. Run `node tools/doctor.js` and `sh test/run.sh`. Treat the report's open implementation tracks as locally complete. The next work is the 30-day daily-driver soak, a deliberate deployment/real-device validation, or a future track whose documented evidence gate has actually opened—never an inferred schema, adapter, CRDT, or encryption gate.
