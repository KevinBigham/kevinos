# KevinOS v0.58 release receipt

Status: **YELLOW — STATIC APP AND RELAY DEPLOYED; LIVE PROVIDER POLICY GATES REMAIN CLOSED**

## Release identity

| Field | Receipt |
|---|---|
| Repository | `KevinBigham/kevinos` |
| Release pull request | `https://github.com/KevinBigham/kevinos/pull/7` |
| Static release commit | `9cd35b3c7a459f889c55c2728b2d22704d468813` |
| App / cache / schema | `0.58` / `kevinos-v0_58` / `40` |
| Static production | `https://kevinbigham.github.io/kevinos/` |
| Post-merge CI | `https://github.com/KevinBigham/kevinos/actions/runs/31696190329` — `MACHINE-PASS` |
| Pages deployment | `https://github.com/KevinBigham/kevinos/actions/runs/31696189587` — `MACHINE-PASS` |
| Relay production | `https://kevinos-relay.kevinbigham.workers.dev` |
| Relay version | `791fcd1d-6e35-4ffe-ad50-daa5b286bb51` |

## Product result

- Today now uses explicit Role Lanes, device-local Operating Modes, capacity, hard stops, physical next actions, commitment limits, and visible fit/mismatch facts.
- Projects own outcomes, truth capsules, resume context, sources, proof, review dates, and Ship/Maintain/Incubate/Parked/Done governance.
- Fifteen versioned playbooks instantiate deterministic, approval-bounded operational checklists without sending, publishing, scheduling, deploying, or executing code.
- Studio owns project-linked AI missions, one-writer locks, exact Awaiting Kevin questions, proof gates, handoffs, and a redacted Provider Control Center.
- The Provider Fabric supplies eight server-side adapters, seven proposal jobs, nine synthetic eval fixtures, exact context manifests, privacy denial before transport, sequential routing, bounded receipts, and explicit Kevin review/Undo.

## Data and authority boundaries

- Schema v39 migrates once to v40 with an explicit previous-version gate, idempotence tests, recovery proof, and an updated v39 fixture.
- Connections and credentials remain device/server-local and are excluded from backups, sync documents, portable state, screenshots, patches, logs, and browser payloads.
- AI remains proposal-only. It cannot silently mutate, send, publish, schedule, deploy, or start an agent.
- The live fabric keeps `allowPaid=false`; unknown or stale free eligibility, sensitive privacy classes, missing approval/manifests, quota exhaustion, circuit state, and usage-class mismatch fail closed.
- GATE-76 encryption remains closed.

## Verification

- `node tools/doctor.js` — app v0.58, schema v40, 20 rooms, 48 relay routes.
- `node tools/scan-secret-values.js` — zero exposed values; the mode-600 local store is skipped without reading content into output.
- `sh test/run.sh` — complete app and relay suite `ALL GREEN` locally and in GitHub Linux CI.
- `sh tools/run-evolution-gates.sh wave` — 244 mission tasks, 72 acceptance contracts, secret boundary, doctor, and full suite `PASS`.
- Live Pages source reports v0.58/schema v40 and service-worker cache `kevinos-v0_58`.
- Live in-app browser: onboarding, Today operating model, isolated demo setup/cleanup, Studio Mission Control, and Provider Control Center rendered with zero console errors.
- Live relay: public health 200; Pages-origin CORS preflight 200; unauthenticated `/ai/providers` 401.
- Remote secret registry: the seven requested provider credential names and the existing relay lock/OAuth/push names are present. No value was printed, stored in Git, or added to this receipt.

## Provider activation truth

Groq, Mistral, Gemini, Cohere, OpenRouter, SambaNova, and NVIDIA are **CONFIGURED / POLICY-DISABLED** for the new fabric. Cloudflare Workers AI is **BOUND / POLICY-DISABLED**. Key or binding presence is not represented as a successful provider call, free-tier guarantee, privacy acknowledgement, or current model proof.

Before any route becomes active, complete the exact remaining K10 gate: verify the account's model and quota, confirm Groq ZDR, confirm Mistral Free Mode, acknowledge Gemini free-tier data use, record the exact `provider:model` pair, and run at most one strict synthetic content-discarding probe. Optional seats retain their evaluation/emergency/lab/prototype-only classes.

## Rollback

- Static app: use a normal auditable revert or forward-fix PR against merge commit `9cd35b3c7a459f889c55c2728b2d22704d468813`; never force-push or rewrite user state.
- Relay code: redeploy the last-known-good Worker version `583e5905-f97a-4c6a-9391-54db89f53ada` if v0.58 relay behavior regresses.
- Provider fabric: keep both enable/free allowlists empty to disable every new route without deleting credentials. Rotate or revoke an actual credential only through its provider and the silent ceremony.

## Remaining manual boundary

Authenticated fabric/provider probes, provider dashboard policy controls, physical iOS/Android use, real OAuth consent, installed-device push, Lighthouse-on-live, and the elapsed 30-day adoption soak remain unverified. No known P0/P1 regression remains.
