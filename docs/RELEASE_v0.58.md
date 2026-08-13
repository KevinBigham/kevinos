# KevinOS v0.58 release receipt

Status: **YELLOW — STATIC APP, RELAY, AND VERIFIED GROQ ROUTE DEPLOYED**

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
| Relay version | `364b59ca-7f8c-43dc-ad3d-f30c36f99760` |

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
- Live relay: public root 200; Pages-origin CORS preflight 200; unauthenticated `/ai/providers` 401.
- Focused Groq activation: PR #11 CI passed and Worker `364b59ca-7f8c-43dc-ad3d-f30c36f99760` deployed; public root 200, Pages-origin CORS 200, and unauthenticated `/ai/health` plus `/ai/providers` 401.
- Post-deploy browser: live v0.58 Studio and its zero-dollar Provider Control Center opened with zero console warnings/errors; isolated demo data was cleared. The fresh origin stayed in local mode because no relay token was entered or inspected.
- Remote secret registry: the seven requested provider credential names and the existing relay lock/OAuth/push names are present. No value was printed, stored in Git, or added to this receipt.
- Strict Workers AI preview: exact model and 8,500-Neuron ceiling became eligible after the fixed 250-Neuron estimate; the single synthetic call reached the binding, returned an output that failed the local schema contract, stored no response content, ran no fallback, and opened the bounded 60-second circuit as `OUTPUT_SCHEMA`.

## Provider activation truth

Groq is **VERIFIED-FREE-ACTIVE** at exact pair `groq:openai/gpt-oss-20b`. Mistral, Gemini, Cohere, OpenRouter, SambaNova, and NVIDIA are **CONFIGURED / POLICY-DISABLED** for the new fabric. Cloudflare Workers AI is **BOUND / MODEL-REACHABLE / OUTPUT-SCHEMA-FAILED / POLICY-DISABLED**. Key or binding presence is not represented as a successful provider contract, universal free-tier guarantee, or privacy acknowledgement.

Core verification on 2026-08-13 changed only Groq's ruling: Kevin confirmed ZDR, and `groq:openai/gpt-oss-20b` passed the strict schema/privacy/proposal contract with live free-plan rate headers. The old Groq model was replaced ahead of its documented 2026-08-16 retirement. Mistral remains disabled after `OUTPUT_SCHEMA`; Gemini remains disabled after `MODEL_NOT_FOUND`; Workers AI and all optional providers remain disabled. Paid routing remains false.

Only the exact Groq pair is present in the production enable/free allowlists. Optional seats retain their evaluation/emergency/lab/prototype-only classes; failed core seats require a later focused repair and fresh receipt, not optimistic activation.

## Rollback

- Static app: use a normal auditable revert or forward-fix PR against merge commit `9cd35b3c7a459f889c55c2728b2d22704d468813`; never force-push or rewrite user state.
- Relay code: redeploy the pre-probe-fix v0.58 Worker version `791fcd1d-6e35-4ffe-ad50-daa5b286bb51` if the corrected relay regresses; v0.50 version `583e5905-f97a-4c6a-9391-54db89f53ada` remains the deeper compatibility rollback.
- Provider fabric: keep both enable/free allowlists empty to disable every new route without deleting credentials. Rotate or revoke an actual credential only through its provider and the silent ceremony.

## Remaining manual boundary

Failed/optional provider repairs and probes, physical iOS/Android use, real OAuth consent, installed-device push, Lighthouse-on-live, and the elapsed 30-day adoption soak remain incomplete. Groq's strict authenticated receipt and ZDR confirmation are verified. No known P0/P1 regression remains.
