# KevinOS v0.50 production activation record

Status: **YELLOW — CORE STACK ACTIVATED; AUTHENTICATED APP/DEVICE CHECKS REMAIN MANUAL**

Evidence labels in this record mean:

- `MACHINE-PASS`: directly executed and observed.
- `MANUAL-PASS`: performed by a named person on the named physical device.
- `MANUAL-UNVERIFIED`: valid check not physically performed.
- `BLOCKED`: could not be executed; the reason is recorded.

## Release identity

| Field | Value |
|---|---|
| Repository | `KevinBigham/kevinos` |
| Static release commit | `9813dbb87d174125b08cc6f1cca1a556a6673996` |
| App / cache / schema | `0.50` / `kevinos-v0_50` / `39` |
| Static production | `https://kevinbigham.github.io/kevinos/` |
| Relay production | `https://kevinos-relay.kevinbigham.workers.dev` |
| CI | `https://github.com/KevinBigham/kevinos/actions/runs/31347125668` — `MACHINE-PASS` |
| Pages | `https://github.com/KevinBigham/kevinos/actions/runs/31347125134` — `MACHINE-PASS` |

## Release highlights

KevinOS v0.50 centers the daily experience on one question: **What deserves Kevin's attention right now, and what is the next physical action?**

- Today follows `NOW → CAPTURE → SUPPORT → CLOSE`; its deterministic NOW card keeps Kevin's chosen outcome, next action, hard stop, risks, and limited commitments authoritative.
- Mobile Tasks wraps long titles, preserves 44px completion/overflow controls, and moves secondary actions into one menu. Capture opens quick text first and restores focus when dismissed.
- First Useful Day onboarding offers Restore, Start clean, or an isolated removable demo before optional infrastructure setup.
- The AI Proposal Inbox makes model output reviewable and provenance-rich. Edit, Apply, Reject, Council escalation, and exact Undo preserve Kevin's approval boundary.
- Studio is AI Mission Control with bounded scope, acceptance criteria, verification commands, evidence, blockers, handoffs, and reusable work/audit/verification packets.
- One canonical room registry drives current navigation and legacy Home/Launch aliases. Valuable context remains available through Today support rather than obsolete routes.
- Route-specific request limits, single-use OAuth state, correlation-ID errors, SSRF rejection, hostile-content tests, safe URL handling, and relay authentication strengthen trust.
- App v0.50 remains schema v39. Existing backups, tombstones, merge semantics, and three-device convergence remain protected; GATE-76 stays explicitly deferred.

## Relay activation ledger

| Field | Receipt |
|---|---|
| Candidate source | `relay/worker.js` at static commit `9813dbb87d174125b08cc6f1cca1a556a6673996` |
| Wrangler | `4.120.1` |
| Previous Worker version | `4fb64ad8-a5c7-4b75-8f59-66a45cbff242` (version 62, 100% traffic before v0.50 promotion) |
| Compatibility date | `2024-11-01` from `relay/wrangler.toml` |
| Existing bindings | Workers AI `AI`; KV `PUSH`; D1 `SYNC`; cron `*/2 * * * *`; compatibility date `2024-11-01` confirmed against the active Worker |
| Secret handling | Names may be inspected; values must never be printed or changed |
| Deployment command | From a clean detached worktree at the release commit: `cd /tmp/kevinos-relay-v050-9813dbb/relay && npx wrangler deploy` |
| New Worker version | `583e5905-f97a-4c6a-9391-54db89f53ada` (100% traffic, deployed 2026-08-10 22:53 CDT) |
| Rollback | `cd /Users/tkevinbigham/Projects/kevinos/relay && npx wrangler rollback 4fb64ad8-a5c7-4b75-8f59-66a45cbff242 --name kevinos-relay -m "Rollback KevinOS v0.50 relay activation"` |
| Pre-deploy health | 2026-08-10 Central: HTTP 200, `ok:true`, service `kevinos-relay`; configured seats and capability flags present — `MACHINE-PASS` |
| Pre-deploy auth boundary | Synthetic unauthenticated `POST /ai` returned HTTP 401 with `unauthorized` — `MACHINE-PASS` |
| Post-deploy health/security | HTTP 200 with `ok:true`, `service:"kevinos-relay"`, auth enabled, six configured seats, and push/GitHub/sync/extract/capture/summarize/email/calendar/people flags true. Missing-token requests to `/ai`, `/council`, `/summarize`, `/push/key`, and `/sync/pull` returned controlled HTTP 401 responses — `MACHINE-PASS` |

## Automated verification

- `node tools/doctor.js` — `MACHINE-PASS`; app v0.50, schema v39, 20 rooms, 42 relay routes.
- `sh test/run.sh` — `MACHINE-PASS`; complete local gate `ALL GREEN`.
- `git diff --check` — `MACHINE-PASS`.
- Relay security suites cover request ceilings, nonce expiry/single use, correlation IDs, SSRF/private-network rejection, token boundaries, and safe errors — `MACHINE-PASS` locally. Production health, missing-token boundaries, and OAuth replay are `MACHINE-PASS`; protected positive-path smokes require Kevin's device-local token and remain manual.

## Production browser and quality

| Check | Receipt |
|---|---|
| 390×844 | v0.50, deterministic NOW, first-use choice, mobile navigation, no horizontal overflow, zero console warnings/errors — `MACHINE-PASS` |
| 1440×900 | v0.50, desktop navigation, no horizontal overflow, zero console warnings/errors — `MACHINE-PASS` |
| Offline reload | Service-worker-controlled production URL reloaded offline with v0.50 visible; zero console warnings/errors — `MACHINE-PASS` |
| Lighthouse mobile | Lighthouse 13.4.1: Performance 99, Accessibility 100, Best Practices 100, SEO 90 — `MACHINE-PASS` |
| Lighthouse desktop | Lighthouse 13.4.1: Performance 100, Accessibility 100, Best Practices 100, SEO 90 — `MACHINE-PASS` |
| Lighthouse findings | Missing meta description is informational for this personal PWA; Lighthouse 13 no longer emits a PWA category. Manifest/service-worker installability is verified separately. |
| Live app-to-relay proposal | `MANUAL-UNVERIFIED`: the available production Chrome profile visibly offers `Connect AI`; no relay URL/token is configured there. Browser policy also prevented use of the local `file://` app. No token was read, requested, or exposed. |

## External capability status

| Capability | Status | Receipt / limitation |
|---|---|---|
| AI provider | `MANUAL-UNVERIFIED` | Health confirms Gemini plus five Council seats, but the available production browser has no device-local relay token. No provider call was made without authentication. |
| GitHub OAuth | `MACHINE-PASS` boundary / `MANUAL-UNVERIFIED` consent | A synthetic login issued state, the first invalid callback failed safely, replay was rejected, and the synthetic status remained disconnected. No real OAuth token was created or exposed. |
| Google OAuth / Gmail / Calendar / Sheets | `MACHINE-PASS` status / `MANUAL-UNVERIFIED` consent | A synthetic public status check returned zero accounts. No consent, message body, send, calendar create, or Sheets data access was attempted. |
| Push public key | `MANUAL-UNVERIFIED` protected endpoint | Health reports `push:true`; `/push/key` correctly rejects missing authentication. Positive proof requires Kevin's device-local relay token. |
| Real push | `MANUAL-UNVERIFIED` | Requires an installed physical-device PWA. |
| Isolated remote sync | `MANUAL-UNVERIFIED` | No production D1 record was created merely for a receipt. Automated optimistic-revision and three-device convergence suites remain green. |
| Two physical devices | `MANUAL-UNVERIFIED` | See `docs/REAL_DEVICE_VALIDATION_v0.50.md`. |
| Thirty-day adoption | `MANUAL-UNVERIFIED` | `docs/ADOPTION_SOAK.md` remains canonical. |
| GATE-76 | Deferred | Explicitly not crossed. Schema remains v39. |

## Static rollback

Use a normal auditable Git revert or forward-fix pull request from `main`; never force-push. Do not roll back schema or user state. Confirm the resulting Pages deployment and repeat the production browser matrix.

## Release seal

- Release-record pull request: `https://github.com/KevinBigham/kevinos/pull/2`
- Final release-seal commit: pending
- Annotated tag `v0.50.0`: pending
- GitHub Release `KevinOS v0.50 — Convergence`: pending

The release seal may proceed with YELLOW status because the static app and relay are healthy, rollback is exact, and no P0/P1 defect is known. Authenticated provider, push, real OAuth consent, and physical-device checks remain explicitly unclaimed.
