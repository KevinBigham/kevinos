# KevinOS v40 activation handoff

## 1. Executive result

KevinOS v0.58/schema v40 is a merged and deployed release. It now models Kevin's roles, operating modes, commitments, portfolio capacity, project truth, restart context, AI missions, decisions, communication state, knowledge activation, local search, admin facts, evidence, and bounded product experiments without adding a room or weakening local-first custody. Core use remains complete with every new fabric route disabled.

Static and relay deployment are complete. All seven requested key-backed providers are present remotely by redacted name. Kevin confirmed the three core account controls. Groq passed the strict synthetic contract on `openai/gpt-oss-20b`; Mistral, Gemini, and Workers AI failed closed and remain disabled. Optional-provider and physical-device claims remain deliberately incomplete.

## 2. Baseline and final versions

- Start: app v0.57, schema v39, cache `kevinos-v0_57`; canonical Git base `43715bf46f33163fc764341e16a7f798852ee157`.
- Final: app/footer v0.58, schema v40, cache `kevinos-v0_58`; merged from `codex/kevinos-v40-ai-fabric`.
- Migration: one v39→v40 gate only. No intermediate schema exists.
- PR #7 merged the v0.58 implementation as `9cd35b3c7a459f889c55c2728b2d22704d468813`; post-merge CI and Pages passed. PR #11 merged the strict core-provider activation as `aacabef`; Worker version `364b59ca-7f8c-43dc-ad3d-f30c36f99760` is deployed with Groq as the sole enabled fabric route.
- Final credentialless K10 wave gate: `output/evolution/wave-20260813T112952Z.log`. The earlier preactivation log is `output/evolution/preactivation-20260813T072756Z.log`.

## 3. Kevin-shaped product evolution

- Eight stable Kevin roles plus reviewable legacy Work/Coaching; active day mode stays device-local.
- Explicit promise/execution facts, start-by/review state, capacity-aware NOW, one primary action, fit/transition facts, and visible reason codes without a hidden score.
- Project Spine, Project Hub, Resume Capsule, repository/source links, proof freshness, one-writer Studio queue, dependency/handoff states, and claim-vs-local-proof review.
- WIP Governor, explicit overrides, Weekly Portfolio Review, 15 version-locked role playbooks, preview/instantiate/Undo, and resumable fresh/returning onboarding.
- Decision/assumption ledger, Ready-not-Sent communication lifecycle, canonical people/event/project joins, confirmed privacy-monotonic knowledge conversion, typed local search, explicit Admin & Money facts, factual evidence, Lab Budget, and content-free device counters.

## 4. AI Provider Fabric

The relay exposes one normalized request/result/error/usage contract and native adapters for Groq, Mistral, Gemini, Cloudflare Workers AI, Cohere, OpenRouter, SambaNova, and NVIDIA NIM. Stable capability aliases remain separate from exact models. `allowPaid=false`, explicit free allowlists, conservative quotas, one transient retry, bounded circuits, and sequential compatible fallback all fail closed.

Only PUBLIC or explicitly SANITIZED packets with an exact approved manifest and de-identification attestation may reach transport. Youth-sensitive, finance-private, secret-pattern, and unapproved internal packets are rejected before a transport call. Seven jobs create editable Proposal Inbox entries only. The nine-fixture Eval Lab includes a synthetic-only optional-provider health path and stores content-free scorecards; route promotion and rollback require Kevin.

## 5. Provider activation status

| Provider | Status | Exact model/runtime fact |
| --- | --- | --- |
| Groq | `VERIFIED_FREE_ACTIVE` | `openai/gpt-oss-20b`; ZDR confirmed; strict schema/privacy/proposal receipt passed in 687 ms with free-plan rate headers; sole production-enabled route. |
| Mistral | `CONFIGURED / CONTROL_CONFIRMED / DISABLED` | `mistral-small-latest`; Free Mode confirmed; strict receipt failed `OUTPUT_SCHEMA`. |
| Gemini | `CONFIGURED / ACKNOWLEDGED / DISABLED` | `gemini-2.5-flash`; data use acknowledged and catalog visibility confirmed; strict receipt failed `MODEL_NOT_FOUND`. |
| Cloudflare Workers AI | `MODEL_REACHABLE / OUTPUT_SCHEMA / DISABLED` | Exact model and binding were reached once; response content was discarded after local schema failure and no fallback ran. |
| Cohere | `CONFIGURED / OPTIONAL_DISABLED` | Optional evaluation lane; strict activation pending. |
| OpenRouter | `CONFIGURED / OPTIONAL_DISABLED` | Optional emergency free lane; strict activation pending. |
| SambaNova | `CONFIGURED / OPTIONAL_DISABLED` | Optional lab lane; strict activation pending. |
| NVIDIA NIM | `CONFIGURED / OPTIONAL_DISABLED` | Optional prototype lane; strict activation pending. |

Provider policy was reviewed against official sources on 2026-08-13 in `docs/AI_PROVIDER_VERIFICATION_2026-08-13.md`; runtime facts still fail closed after the documented stale window.

## 6. Credentials-last ceremony and secret proof

No credential value was printed, requested in chat, stored in Git, or exposed to browser state. The approved local store transferred values directly to Cloudflare through Wrangler; portable export, sync, source, logs, screenshots, patches, and content-free receipts contain no provider credential. The final scanner passed over 345 text files with zero exposed values. The tested K10 artifacts are `tools/credential-ceremony.sh`, `tools/verify-ai-provider-config.js`, and `tools/probe-ai-provider.js`; Kevin must never paste keys into chat or command arguments.

## 7. State and migration contract

Schema v40 adds canonical `roles` and `decisions` arrays and portable `portfolio`; supporting facts are optional fields or nested portfolio metadata. Migration snapshots the pre-v40 portable document, fingerprints it, preserves every legacy area/status/record, creates stable reviewable legacy roles, tightens privacy on ambiguity, writes once, and is idempotent. Portable import excludes relay/sync/push/GitHub/email/calendar/provider credentials. Tombstones, lossless merge, both merge orders, and three-device convergence remain green.

Rollback before publication is the base commit plus the pre-v40 snapshot/import path. A v40 save must not be relabeled v39; restore the snapshot through the tested recovery UI if a real migration rollback is required.

## 8. Acceptance map

`docs/evolution/2026-08-12-kevin-personalization-ai-fabric-v40/EVIDENCE_INDEX.md` is the canonical row-by-row map for all 72 IDs.

- Credentialless product/state/browser contracts AT-001–AT-140 and AT-149–AT-155: machine-verified, including AT-100 search, AT-111 offline/reload, AT-112 representative scale, and AT-120 whole-system gates.
- AT-142 now passes on Groq's exact model, ZDR confirmation, strict receipt, and rate metadata. AT-141 and AT-143 remain failed/blocked at the transport/output contracts despite their human account controls being complete. AT-144–AT-148 and the remaining portion of AT-158 stay narrowly pending; none is falsely claimed from key presence or a mock.

## 9. Tests and commands

```sh
node tools/doctor.js
sh test/run.sh
node tools/browser-smoke.js
sh tools/credential-ceremony.sh --self-test
node tools/verify-ai-provider-config.js --redacted
node tools/probe-ai-provider.js --self-test
node tools/check-evolution-state.js --mode structure
sh tools/run-evolution-gates.sh wave
```

The authoritative preactivation and safe K10 log paths and UTC times are in `EVIDENCE_INDEX.md` and `PROGRESS.md`. The complete suite covers syntax/ES5, state/migration/portable/merge/convergence, UI/XSS, all feature contracts, relay auth/security, mocked provider behavior, credential rotation/revocation, and strict single-provider probe boundaries.

## 10. Browser, accessibility, offline, and performance evidence

- Chromium: critical Today, Tasks, Projects, Plan & Review, Library, and Studio journeys at 320, 390, 430, 768, and 1440; 30/30 room-width checks had zero horizontal overflow and the online console had zero warnings/errors.
- Accessibility: command palette and Do Next Coach Escape paths return focus; all visible fields in eight critical rooms have accessible names; screen-reader landmarks/headings remain present; reduced-motion maximum is 0.01 ms; coarse-pointer CSS enforces 44 px on buttons, links, summaries, text fields, selects, and textareas. Key light-theme ratios are 4.78–17.09 and dark-theme ratios are 6.51–15.08.
- Offline: controlled v0.58 installed shell exposes only cache `kevinos-v0_58`; hard reload and a new offline tab render Today plus Projects/Review/Library/Studio. Expected failed relay health/provider fetches are caught and do not block local work.
- Scale: synthetic 526,011-byte state with 1,000 tasks, 500 notes, 200 friction marks, 20 projects, 50 people, 20 goals, and 50 events loaded in 70 ms on this machine. Critical room renders measured 38–92 ms; a fully local typed query returned one exact note in 11 ms. No speculative optimization was added.

Screenshots include `output/playwright/k9-v058-offline-390.png` and `output/playwright/k9-scale-v058-390.png`, plus the K8 decision/review/search/admin and five-width receipts indexed under EV-K8-002.

## 11. Privacy and security proof

Tests cover monotonic privacy through migration/import/both merge orders, youth-sensitive exclusion, explicit person-note opt-in, exact AI manifests, public-output identifier rejection, secret-pattern denial before transport with zero calls, connection exclusion, hard free-only routing, no direct browser provider authorization, bounded content-free receipts, URL/body/OAuth relay boundaries, and hostile content across all render families. Final scans report only secret names/placeholders, never values.

## 12. Files changed

- App shell: `index.html`, `sw.js`.
- Relay: `relay/worker.js`, relay contracts/docs, mocked adapter/security tests.
- Tests: new task/schema/project/commitment/Today/WIP/playbook/Studio/provider/supporting suites plus expanded portable/merge/convergence/UI/XSS coverage.
- Docs: current architecture/state/rooms/routes/decisions/provider policy, canonical index, mission ledger/state/progress/evidence, setup/readme, and this handoff.
- Tools/evidence: mission checker, secret scanner, gate runner, silent credential ceremony, redacted verifier, strict loopback provider probe, optional Chromium smoke, logs, screenshots, patch, and checksums.

## 13. Assumptions and decisions

Key reversible assumptions are AS-009 through AS-012; key implementation decisions are EV-D014 through EV-D019. Revisit only if canonical checkout authority changes, a provider/account fact changes, a real measured performance regression appears, or Kevin chooses another release train.

## 14. Residual risks and external/manual gates

- Physical iOS/Android validation, elapsed adoption, optional-provider probes, and real OAuth/push journeys remain unproved. Hosted v0.58, public relay health/CORS, unauthenticated denial, and the strict Groq receipt are live-verified.
- Mistral and Gemini remain disabled after exact failed receipts. Workers AI remains disabled after its schema failure. Provider models, quotas, regions, and free eligibility are still dated runtime facts.
- GATE-76 encryption remains closed. Optional providers may remain missing without reducing local completion.

## 15. Remote action receipt

Kevin explicitly authorized branch publication, PR/merge, static publication, remote secret transfer, and Worker deployment; those actions completed through PR #7 and the release receipt in `docs/RELEASE_v0.58.md`. No tag, GitHub Release, outward send, calendar creation, financial action, billing change, provider-policy change, data deletion, or GATE-76 bypass occurred.

## 16. Patch, checksums, and rollback

- Credentialless review diff: `output/evolution/kevinos-v058-credentialless.patch`. It is committed as a bounded evidence artifact; the Git commits remain the authoritative file manifest.
- Key SHA-256 values at handoff: `index.html` `df972a734716fc6b64d4940fd508e956e3e56462473ec3142b5d7d28794e6587`; `sw.js` `e51f6bf22c56aa9871dc15c019a8d7954e65dc3775f0e8d8d308f7139eacbf2c`; `relay/worker.js` `fd07c1a3df5dfa7131e17035905650324a69be145f10712284aea978fbb1b012`.
- Code rollback before publication: review/revert this focused branch against base `43715bf...`; do not use a destructive reset in a dirty workspace.
- Data rollback: use the tested pre-v40 snapshot or a verified portable backup; connection state remains device-local.
- Provider rollback: disable the route, restore last-known-good alias/prompt/policy metadata, then rotate/revoke the credential through the provider and local ceremony. Never copy a secret into a patch or ticket.

## 17. Kevin's next physical action

No credential action is required. Use Groq for public or explicitly sanitized proposal jobs now. Mistral, Gemini, Workers AI, and the optional seats stay visibly unavailable until a later focused repair/verification slice passes their exact contracts. Never paste or rotate a key merely to fix an adapter/schema failure.
