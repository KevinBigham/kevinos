# KevinOS v0.62 production release receipt

Status: `PRODUCTION ACTIVE — YELLOW FOLLOW-UP GATES REMAIN`

## Release identity

| Field | Receipt |
|---|---|
| Repository | `KevinBigham/kevinos` |
| Release pull request | `https://github.com/KevinBigham/kevinos/pull/15` |
| Production merge | `4d3048de84df2adeae4ed6e925555e9f70f75271` |
| App / cache / schema | `0.62` / `kevinos-v0_62` / `40` |
| Static production | `https://kevinbigham.github.io/kevinos/` |
| Post-merge CI | `https://github.com/KevinBigham/kevinos/actions/runs/31712591695` — `MACHINE-PASS` |
| Pages deployment | `https://github.com/KevinBigham/kevinos/actions/runs/31712591088` — `MACHINE-PASS` |
| Relay production | `https://kevinos-relay.kevinbigham.workers.dev` |
| Relay version | `0790d9dc-3c2e-4d57-a5ec-7949baafff8b` |

## Summary

- v0.59 unifies Fabric, Council, legacy `/ai`, and dedicated Gemini provider calls under one free-only eligibility, timeout, circuit, safe-error, and content-free usage ledger. Missing ledgers, stale or unknown free policy, zero/exhausted quotas, open circuits, retired models, and paid routing all block before transport.
- v0.60 adds optional nested `project.aiPolicy` plus deterministic selected-record Context Capsules. Capsules are capped at 20 records, five selected repository files, 12,000 repository characters, and 24,000 combined content characters; every call exposes the exact manifest and fingerprint for approval.
- v0.61 adds proposal-only actions in Today, Projects, Plan & Review, Studio, Capture, Library, and Awaiting Kevin. Results enter the existing editable Proposal Inbox with exact provider/model/prompt/context provenance and Apply/Reject/Undo controls.
- v0.62 adds specialist routing, deterministic local search before explicit sanitized reranking, five-sample local route recommendations that never self-activate, and an off-by-default Coach Mode gated behind 14 days of manual adoption.

## Safety and state

- `allowPaid=false` remains mandatory. Unknown cost means blocked; no paid or credit fallback exists.
- Public and Sanitized routing remains eligible by exact passing capability. Personal and Work Internal require project opt-in, per-call approval, and currently route only to Groq with confirmed ZDR and no fallback.
- Youth-sensitive, finance-sensitive, secret, malformed-manifest, and secret-pattern packets fail before transport. General routing and Council cannot consume dedicated Gmail, Spend Pulse, Swim Radar, or Sheets source material.
- AI remains proposal-only. It cannot send, publish, schedule, deploy, purchase, delete, write repositories, or mutate important state without Kevin's existing explicit apply path.
- Save schema remains v40. There is no migration. Old projects without `aiPolicy` remain AI-disabled except for the existing manual sanitized-text workflow; portable backup and sync contracts preserve optional nested policy while excluding connections and secrets.

## Verification

- `node tools/doctor.js` — PASS: app v0.62, schema v40, 20 rooms, 48 relay routes.
- `node tools/scan-secret-values.js` — PASS: 368 text files scanned, one approved local secret store skipped, zero exposed values.
- `node tools/check-evolution-state.js --mode structure` — PASS: 244 tasks, 72 acceptance contracts.
- `sh test/run.sh` — PASS: syntax, ES5, state, privacy, portability, convergence, UI, routing, Council, dedicated endpoint, accounting, credential ceremony, and provider-probe suites; `ALL GREEN`.
- `sh tools/run-evolution-gates.sh wave` — PASS: `output/evolution/wave-20260813T142916Z.log`.
- Chromium — MACHINE-VERIFIED at 320, 390, 430, 768, and 1440 widths across all six contextual surfaces with no horizontal overflow. Exact context approval, provider denial, cancellation and focus return, offline failure, nested project policy, Coach Mode boundaries, and service-worker offline reload passed. Final console: zero warnings and zero errors.
- Production Pages — live source returned app v0.62/schema v40 and service-worker cache `kevinos-v0_62`. The in-app browser opened live Today, loaded isolated demo data, showed the contextual AI actions, rejected an offline AI request with “Local work is unchanged,” rendered Studio's zero-dollar Control Center and Coach Mode Off, cleared the demo, and finished with zero console warnings/errors.
- Production relay — Worker `0790d9dc-3c2e-4d57-a5ec-7949baafff8b` deployed with the existing KV, D1, Workers AI, model, OAuth, push, credential, and sealed policy bindings. Public root and Pages-origin CORS returned 200; unauthenticated `/ai/providers` and `/ai/health` returned 401. Redacted name-only secret inspection confirmed the free-only policy, provider credentials, ZDR/data-use confirmations, quota ceilings, and relay lock remain present without exposing values.

## Deliberately unchanged or not performed

- No provider was re-probed, promoted, or enabled.
- No key, sealed policy value, provider allowlist, Cloudflare binding, or remote secret was changed. The deploy reused the existing sealed production configuration.
- No tag or GitHub Release was created.
- No real youth, finance, secret, personal, school, athlete, Gmail, Sheets, or repository content was sent to a provider.
- Physical-device, live OAuth/push, 14-day adoption, and 30-day usefulness gates remain pending.

## Rollback

Rollback is immediate: remove the provider from `AI_ENABLED_PROVIDERS` and its exact entry from `AI_FREE_VERIFIED_MODELS`. Local KevinOS and every remaining approved provider continue to operate.

For a code regression, use a normal auditable revert or forward-fix PR against merge `4d3048de84df2adeae4ed6e925555e9f70f75271`; never rewrite user state or force-push. The prior compatible Worker version is `12fab779-f1b5-430e-b67b-64d3543ef295`.
