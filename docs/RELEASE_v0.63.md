# KevinOS v0.63 candidate — Grading Machine foundation

Packet fingerprint: `grading-machine-v1-a8b2826f7b93a83d7656`

Status: local candidate only. Not committed, pushed, published, deployed, or connected to a live model/provider.

## Scope

- More → Teaching Tools launch; no new canonical room.
- Separate seven-store Grading Vault with session-only default.
- Bounded TXT/Markdown/CSV intake, SHA-256 originals, random submission tokens.
- Structured rubric approval and exact-schema synthetic proposals.
- Every-grade local review, override reason, Undo, explicit local finalization, and `NOT POSTED` state.
- Finalized-only gradebook CSV/JSON plus complete hour summary and protected feedback/review/reteach/audit artifacts.
- Batch-scoped deletion with count-only confirmation.
- Optional loopback-only Grading Bridge with bounded local parsers, strict origin/session controls, exact-schema mock-output validation, new PDF sidecars, and content-free temporary deletion.
- No provider, relay, secret, deployment, email, gradebook, or student-contact change.

## Rollback

Return `index.html` and `sw.js` to v0.62/cache `kevinos-v0_62` and remove the Grading Machine-specific tests/docs. Schema remains v40, so no canonical state migration or rollback is required. The separate `kevinos-grading-v1` database can be deleted through the workspace batch deletion flow; do not use a broad storage wipe.

## Evidence

See `docs/grading-machine/05_ACCEPTANCE_LEDGER.md` and `docs/grading-machine/FINAL_GRADING_MACHINE_HANDOFF.md` for exact test/browser evidence, conservative parser limitations, and external/manual boundaries.
