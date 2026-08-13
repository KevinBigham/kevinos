# KevinOS v0.62 local release candidate

Status: `LOCAL VERIFIED — REMOTE AUTHORITY REQUIRED`

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

## Deliberately not performed

- No provider was re-probed, promoted, or enabled.
- No key, sealed policy, Cloudflare binding, or remote secret was changed.
- No static or Worker deployment, push, merge, tag, or GitHub release was performed.
- No real youth, finance, secret, personal, school, athlete, Gmail, Sheets, or repository content was sent to a provider.
- Physical-device, live OAuth/push, 14-day adoption, and 30-day usefulness gates remain pending.

## Activation and rollback

Activation requires Kevin's fresh just-in-time authorization. Follow credentialless mocks, one synthetic preview per provider, exact capability promotion only after PASS, public/sanitized golden fixtures, one Groq ZDR private synthetic fixture, sealed-policy transfer, deploy, and production verification in that order.

Rollback is immediate: remove the provider from `AI_ENABLED_PROVIDERS` and its exact entry from `AI_FREE_VERIFIED_MODELS`. Local KevinOS and every remaining approved provider continue to operate.
