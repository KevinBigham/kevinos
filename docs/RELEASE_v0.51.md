# KevinOS v0.51 release receipt

Status: **YELLOW — STATIC GITHUB RELEASE GREEN; AUTHENTICATED APP/DEVICE CHECKS REMAIN MANUAL**

## Release identity

| Field | Receipt |
|---|---|
| Repository | `KevinBigham/kevinos` |
| Release pull request | `https://github.com/KevinBigham/kevinos/pull/4` |
| Release receipt pull request | `https://github.com/KevinBigham/kevinos/pull/5` |
| Static release commit | `0e725ba97d2cf3d3aeafddeec373288edca7a272` |
| App / cache / schema | `0.51` / `kevinos-v0_51` / `39` |
| Static production | `https://kevinbigham.github.io/kevinos/` |
| Post-merge CI | `https://github.com/KevinBigham/kevinos/actions/runs/31497149732` — `MACHINE-PASS` |
| Pages deployment | `https://github.com/KevinBigham/kevinos/actions/runs/31497148430` — `MACHINE-PASS` |
| Annotated tag | `https://github.com/KevinBigham/kevinos/releases/tag/v0.51.0` |
| GitHub Release | `KevinOS v0.51 — Attention Proof Loop`, published 2026-08-11 |

## Product result

- Attention recording is opt-in, device-local, structurally allowlisted, retained for 30 days, capped at 500 receipts, and removable.
- Today explains why the deterministic first commitment is NOW and shows at most one qualifying friction signal. Attention never changes `nowModel()`.
- Plan & Review owns privacy controls and current/prior seven-day evidence. Clear uses accessible inline confirmation and restores focus.
- Proposal workflow evidence groups explicit local outcomes by mode, AI seat, provider/model, and prompt version; groups below three resolved samples remain insufficient.
- Studio copies existing Markdown packets plus stable, versioned, fingerprinted JSON Mission Capsules with explicit context/privacy/data/rollback fields.

## Data and authority boundaries

- Raw attention receipts are excluded from portable backup/import, sync, relay requests, AI context, and Mission Capsules.
- Schema remains v39. No incompatible migration or GATE-76 change shipped.
- AI remains proposal-only behind Edit, Apply, Reject, Council, and Undo approval boundaries.
- `relay/worker.js`, Cloudflare resources, bindings, tokens, provider keys, and OAuth configuration were unchanged by v0.51. The v0.50 relay version remains the active relay receipt.

## Verification

- `node test/attention-proof.test.js` — `MACHINE-PASS`; the suite is part of `test/run.sh`.
- `node tools/doctor.js` — `MACHINE-PASS`; app v0.51, schema v39, 20 rooms, 42 relay routes.
- `sh test/run.sh` — `MACHINE-PASS`; `ALL GREEN` before merge and in post-merge GitHub CI.
- Local Chromium matrix — 20/20 combinations across 320x568, 390x844, 430x932, 768x1024, and 1440x900 with zero horizontal overflow.
- Live GitHub Pages — v0.51 at 390x844 and 1440x900, zero horizontal overflow, service-worker offline reload green, zero console warnings/errors.
- Live source and `sw.js` expose app v0.51 and cache `kevinos-v0_51`; Pages reports built from the exact static release commit.

## Rollback

Use a normal auditable revert or forward-fix pull request against merge commit `0e725ba97d2cf3d3aeafddeec373288edca7a272`; never force-push. Do not alter schema or user state. After rollback, wait for GitHub CI and Pages and repeat the live browser checks.

## Remaining manual boundary

Physical iOS/Android use, authenticated provider calls, real OAuth consent, installed-device push, and the elapsed 30-day adoption soak remain honestly unverified. No known P0/P1 regression remains.
