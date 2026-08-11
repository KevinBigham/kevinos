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

## v0.51 candidate — Attention Proof Loop

- Status: `VERIFIED` on branch `agent/attention-proof-loop`; app v0.51 candidate, service-worker cache `kevinos-v0_51`, schema v39. Publication/merge/deployment are separate authority steps.
- Added: opt-in content-minimized attention receipts across capture, focus, completion/reopen, deferral, and close paths; deterministic 30-day/500 bounds; current/prior seven-day evidence; one fixed-precedence signal; a subordinate “Why this is NOW”; and Plan & Review privacy controls with inline confirmation and focus restoration.
- AI/Studio: Proposal Inbox groups resolved local outcomes by mode, seat, provider/model, and prompt version with a three-sample minimum. Studio persists the optional source/context/privacy/classification/artifact/rollback fields and copies stable, fingerprinted JSON Mission Capsules alongside all existing Markdown packets.
- State: compatible device-local top-level `attention`; schema remains v39. Local boot preserves valid receipts. Portable backup/import, sync, relay/AI context, and capsule generation exclude raw receipts and connection data.
- Tests: `node test/attention-proof.test.js` — `attention proof loop contracts ok`; `node tools/doctor.js` — doctor ok; `sh test/run.sh` — `ALL GREEN`, with the focused attention suite now inside the full runner.
- Browser: Chromium `MACHINE-VERIFIED` at 320x568, 390x844, 430x932, 768x1024, and 1440x900 across Today, Tasks, Plan & Review, and Studio; onboarding, Capture, Attention Enable/Disable/Clear, task focus/complete/reopen, Proposal Inbox workflow evidence, Mission Capsule copy, focus trap/return, and service-worker offline reload checked. The 20-surface viewport matrix has zero horizontal overflow after the mobile Council-row fix; final console has zero warnings/errors.
- Remaining boundary: physical iOS/Android hardware, authenticated provider/OAuth flows, and elapsed 30-day adoption evidence remain outside this browser/machine receipt. No known P0/P1 regression remains.

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
- The v0.50 production-activation mission narrowly authorizes deployment of the unchanged committed `relay/worker.js` to the existing `kevinos-relay` Worker after the prior version and rollback path are captured. It does not authorize secret/binding/resource mutation, schema changes, GATE-76, force-pushes, or historical-file deletion.
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

## Production activation

- Static v0.50 at commit `9813dbb87d174125b08cc6f1cca1a556a6673996` is live on GitHub Pages with green CI and Pages runs.
- Production browser checks at 390x844 and 1440x900 are green, including offline reload and zero significant console messages.
- Lighthouse 13.4.1: mobile 99/100/100 and desktop 100/100/100 for Performance/Accessibility/Best Practices; SEO 90 is informational for the personal PWA.
- Canonical setup/navigation drift and direct-to-`main` examples are repaired on `agent/v050-production-activation`; `tools/doctor.js` protects the contract.
- `docs/RELEASE_v0.50.md` is the activation/rollback ledger and `docs/REAL_DEVICE_VALIDATION_v0.50.md` is the honest physical-device handoff.
- Relay version `583e5905-f97a-4c6a-9391-54db89f53ada` was promoted from the clean static release commit on 2026-08-10 at 22:53 CDT and now receives 100% traffic. Health, missing-token boundaries, and OAuth replay are green. Exact rollback target: `4fb64ad8-a5c7-4b75-8f59-66a45cbff242`.
- Activation status is YELLOW only because the available production browser has no device-local relay token and physical-device/OAuth/provider checks remain honestly unverified; no P0/P1 defect is known.

## Residual risks

- Authenticated app-to-relay provider proof, real OAuth consent, real-device push, 30 elapsed days of adoption evidence, and multi-device re-key remain device/manual checks rather than claimed machine receipts.
- GATE-76 remains intentionally deferred by its explicit product gate. Historical Home/Launch internals remain as compatibility/reuse code; their user-facing routes alias Today.

## Cold resume

Read `AGENTS.md`, this file, `docs/RELEASE_v0.50.md`, and `docs/REAL_DEVICE_VALIDATION_v0.50.md`. Run `node tools/doctor.js` and `sh test/run.sh`. Treat all Convergence waves as complete and the core static/relay stack as activated. Remaining work is the explicit physical-device/authenticated checklist and 30-day adoption soak; never infer a schema or encryption gate.
