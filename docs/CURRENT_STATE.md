# KevinOS current state and Convergence ledger

This is the canonical live mission ledger. Code and passing tests remain the behavior source of truth.

## Baseline

- Repository: Git-backed `KevinBigham/kevinos`, branch `main`. The v0.50 work was reconciled from a verified extracted archive into a fresh authenticated checkout without rewriting history.
- Runtime: dependency-free static PWA plus plain Node test scripts; no package install required.
- Baseline version: app v0.49, service-worker cache `kevinos-v0_49`, schema v39.
- Current release: app v0.50, service-worker cache `kevinos-v0_50`, schema v39.
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

## Gates and deliberate constraints

- Keep `index.html` single-file, dependency-free, and ES5-style.
- Schema stayed v39. AI proposals and Studio extend existing open record shapes compatibly; old records normalize at use sites and remain readable.
- GATE-76 client-side sync encryption remains deferred until the live version is confirmed, the real-device re-key drill passes, and Kevin explicitly approves it.
- The v0.50 landing mission authorizes one normal non-force push to the established upstream. It does not authorize secret mutation, manual relay deployment, GATE-76, or historical-file deletion.
- The 30-day daily-driver observation period starts when Kevin adopts v0.50; its ready-to-use local scorecard is `docs/ADOPTION_SOAK.md`.

## Historical material

Keep for evidence, but do not treat as current instructions: `MISSION.md`, `HANDOFF.md`, `ROADMAP.md`, `KEVINOS_AUDIT*.md`, `KEVINOS_EXECUTION_ORDER.md`, `CLAUDE_CODE_*`, and `CODEX_FINAL_ASCENT_PROMPT.md`. Proposed future move: place these under `docs/history/` after explicit approval, preserving filenames.

## Verification receipt

- Focused: app logic, UI contracts, 12-surface external-content XSS corpus, portability, merge, convergence, relay auth/sync, and security-boundary suites all green.
- Release: `sh test/run.sh` — ALL GREEN on 2026-08-09.
- Browser: Chromium at 320x568, 390x844, 430x932, 768x1024, and 1440x900; Today, Tasks, Capture, Calendar, onboarding, proposal inbox, AI sharing modal, Studio, navigation, footer recovery disclosure, and offline reload checked; zero same-page horizontal overflow and zero final-session console warnings/errors. Capture and AI dialogs trap focus, close with Escape, and return focus.
- Accessibility: selected normal-text contrast ratios are 4.78–15.31 light and 6.51–15.08 dark; reduced-motion CSS suppresses recurring animation and coarse-pointer CSS enforces 44px controls.
- Performance: with 1,000 tasks + 500 notes (250 KB local state), Chromium DOMContentLoaded was 51 ms, load 53 ms, and a 27-result Library search rendered in 3.3 ms on this machine.
- Data/security: schema v39 round trip, connection exclusion, tombstones, calendar/AI pending isolation, OAuth nonce replay, byte-limit boundaries, private-network URL rejection, hostile-content render corpus, and safe provider-error envelope covered.

## Meaningful files

- Product/runtime: `index.html`, `sw.js`, `relay/worker.js`.
- Verification: `test/app-logic.test.js`, `test/ui-contract.test.js`, `test/xss-corpus.test.js`, `relay/test/security-boundaries.test.js`, `test/run.sh`, `tools/doctor.js`.
- Operating layer: `AGENTS.md`, `relay/AGENTS.md`, `docs/*`, `.agents/skills/*`, `CLAUDE.md`, `.github/copilot-instructions.md`, `GETTING_STARTED.md`, `README.md`.
- Install/release: `manifest.json` now has stable `id: "./"`; `docs/ADOPTION_SOAK.md` is the local 30-day scorecard.

## Residual risks

- Live Pages propagation, Lighthouse-on-live, real provider calls, real OAuth consent, real-device push, 30 elapsed days of adoption evidence, and multi-device re-key remain deployment/device checks rather than local implementation receipts.
- GATE-76 remains intentionally deferred by its explicit product gate. Historical Home/Launch internals remain as compatibility/reuse code; their user-facing routes alias Today.

## Cold resume

Read `AGENTS.md`, this file, and one relevant domain doc. Run `node tools/doctor.js` and `sh test/run.sh`. Treat all Convergence waves as complete; the next work is deployment/real-device validation or an explicitly approved future track, never an inferred schema or encryption gate.
