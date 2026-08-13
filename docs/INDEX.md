# KevinOS Documentation Index

This is the canonical map for current documentation. Start with `CURRENT_STATE.md`; historical reports are evidence, not implementation instructions.

## Current operating truth

- `CURRENT_STATE.md` — live mission status, verified releases, gates, and cold-resume point.
- `ARCHITECTURE.md` — app, relay, and provider-fabric boundaries.
- `STATE_CONTRACT.md` — persistence, portability, migration, privacy, merge, and recovery law.
- `ROOM_MAP.md` — current room ownership and zero-new-room placement.
- `RELAY_ROUTE_MATRIX.md` — relay route, authentication, data, and failure contracts.
- `DECISIONS.md` — durable product and architecture decisions.
- `LOCAL_EVIDENCE_VOCABULARY.md` — allowed proof labels and claim/evidence separation.

## Provider and security policy

- `AI_PROVIDER_SECURITY_POLICY.md` — server-only secrets, privacy, budget, and activation law.
- `AI_PROVIDER_CAPABILITY_MATRIX.md` — capability and usage-class policy.
- `AI_PROVIDER_VERIFICATION_2026-08-13.md` — dated official-source snapshot; runtime eligibility still fails closed.

## Release and validation

- `RELEASE_v0.50.md`, `RELEASE_v0.51.md` — verified published release receipts.
- `REAL_DEVICE_VALIDATION_v0.50.md` — physical-device checklist and evidence boundary.
- `ADOPTION_SOAK.md` — local 30-day adoption and prune-first review.

## Active v40 evolution mission

- `evolution/2026-08-12-kevin-personalization-ai-fabric-v40/00_START_HERE.md` — mission entry.
- `evolution/2026-08-12-kevin-personalization-ai-fabric-v40/MISSION_STATE.json` — machine-readable current wave/task and acceptance state.
- `evolution/2026-08-12-kevin-personalization-ai-fabric-v40/06_EXECUTION_LEDGER.md` — all bounded tasks.
- `evolution/2026-08-12-kevin-personalization-ai-fabric-v40/PROGRESS.md` — cold-resume receipts.
- `evolution/2026-08-12-kevin-personalization-ai-fabric-v40/EVIDENCE_INDEX.md` — acceptance-to-evidence map.
- `../FINAL_KEVINOS_V40_HANDOFF.md` — credentialless v0.58 release-candidate handoff and rollback.
- `evolution/2026-08-12-kevin-personalization-ai-fabric-v40/09_CREDENTIALS_LAST_ACTIVATION_RUNBOOK.md` — explicit post-preactivation ceremony only.

## Agent work packets

- `ai/WORK_PACKET_TEMPLATE.md` — bounded implementation packet.
- `ai/HANDOFF_TEMPLATE.md` — incomplete-work handoff.
- `ai/ATTENTION_PROOF_LOOP_WORK_PACKET.md` — retained completed work packet.

## Historical archive policy

Files under `docs/history/` are append-only evidence. Do not delete, rewrite, rename, or treat them as current plans merely to reduce clutter. A historical file may move into that folder only when its provenance and filename remain intact and current docs link to any still-relevant decision. When historical prose conflicts with `CURRENT_STATE.md`, the current state and governing contracts win.

Root historical files such as `MISSION.md`, `HANDOFF.md`, and `ROADMAP.md` remain in place until Kevin explicitly authorizes a non-destructive move. Generated logs and screenshots remain evidence and are never silently promoted into product truth.
