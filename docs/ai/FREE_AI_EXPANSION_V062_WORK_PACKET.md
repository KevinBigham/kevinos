# KevinOS work packet — Free AI Expansion v0.59–v0.62

## Outcome

Make KevinOS's free AI fabric useful inside the rooms where Kevin already works while preserving manual approval, exact context visibility, local-first operation, and a hard zero-dollar ceiling.

Packet version: `1`
Packet fingerprint: `free-ai-expansion-v062-2026-08-13`

## Current evidence

- v0.58/schema v40 is green and live; Groq and Gemini are the only production-enabled fabric routes.
- Seven proposal jobs exist, but the main interface is a generic manual-text composer in Studio.
- Council and dedicated Gemini paths do not yet share the complete Fabric eligibility/accounting contract.
- Projects have no per-project AI policy or deterministic selected-record Context Capsule.

## Scope

- Allowed files: `index.html`, `sw.js`, `relay/worker.js`, focused tests, active mission/current-state/release documentation, and generated verification logs.
- Forbidden files: historical evidence and unrelated application behavior.
- Data/schema classification: compatible optional nested `project.aiPolicy`; schema remains v40.
- Security/privacy impact: expands approved `PERSONAL` and `WORK_INTERNAL` general-AI context to ZDR-confirmed Groq only; youth, finance, secret, and unapproved packets remain transport-denied.

## Implementation contract

- Keep `allowPaid=false`; unknown or stale free eligibility blocks.
- Keep new calls manual-first and proposal-only.
- Preserve existing routes and dedicated Google integrations.
- Add no top-level room, framework, dependency, database, autonomous action, or vector store.
- Place contextual AI actions in Today, Projects, Plan & Review, Capture, Library, and Studio.
- Keep provider activation and deployment behind fresh authority.

## Acceptance

- [x] `[FAI-001]` Unified provider accounting and Council eligibility are deterministic, sequential, bounded, and free-only.
- [x] `[FAI-002]` Optional nested project AI policy round-trips and converges without schema change.
- [x] `[FAI-003]` Context Capsules are selected, deterministic, bounded, fingerprinted, and connection/secret-free.
- [x] `[FAI-004]` Personal/Work Internal packets require project opt-in, exact approval, ZDR, and no non-ZDR fallback.
- [x] `[FAI-005]` Youth, finance, secret, malformed, and secret-pattern packets cause zero outbound calls.
- [x] `[FAI-006]` Contextual room actions create editable Proposal Inbox records with complete provenance and no mutation authority.
- [x] `[FAI-007]` Specialist routing, local recommendation evidence, and optional Coach Mode remain bounded and never auto-apply.
- [x] `[FAI-008]` App/cache advance together to v0.62; schema remains v40; full and browser gates pass.

## Verification contract

- Focused automated checks: provider control, privacy matrix, context capsule/state, contextual actions, routing/learning.
- Full gate: `node tools/doctor.js`, `node tools/scan-secret-values.js`, `node tools/check-evolution-state.js --mode structure`, `sh test/run.sh`.
- Manual surfaces/viewports: Today, Projects, Plan & Review, Capture, Library, Studio at 320/390/430/768/desktop, plus offline/error/cancel/focus paths.
- Evidence required: exact commands/results, content-free provider status, screenshots/console receipts, and unresolved remote activation gates.
- Locally verifiable: implementation, state compatibility, privacy denial, routing, UI, offline behavior.
- Collaborator/authority-only: provider-account probes, secret transfer, deployment, production verification.

## Authority gates

- Schema change, deploy, push, remote secrets, provider activation, outward actions, destructive operations, and GATE-76 are excluded without fresh explicit authority.
- Local branch edits, tests, versioned commits, and release preparation are authorized by Kevin's implementation request.
