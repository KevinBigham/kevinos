# KevinOS v0.64 local candidate — credentialless Grading Groq ZDR pilot

Packet fingerprint: `grading-groq-zdr-pilot-v1-f85f024dfaa65e676a29`

App/cache/schema: v0.64 / `kevinos-v0_64` / v40. Branch: `codex/grading-groq-zdr-pilot`. Status: local only; not pushed, deployed, published, or activated.

## Candidate scope

- Inactive synthetic-only shadow-capsule preview inside the existing Grading Machine.
- Fresh non-identifying shadow token, exact manifest, visible omissions, capsule hash, and explicit no-transport truth.
- Local hostile/sensitive-pattern blocks and no browser relay invocation.
- Dedicated authenticated/bounded/rate-limited `/grading/pilot/route`, disabled by default.
- Strict Groq-only routing after synthetic, sanitized, ZDR, exact-free-model, policy, ledger, circuit, and quota gates; no fallback.
- Exact grading schema, rubric-bound score checks, source-evidence matching, and proposal-only/finalization/posting blocks.

## Deliberate gates

This release does not establish live Groq account policy, ZDR state, free-model availability, or production transport. It uses no real student data or secret value. A live fixed synthetic probe requires a separate Kevin-authorized credential ceremony. Any non-synthetic educational record requires a new privacy packet.

## Rollback

Revert the v0.64 commit and restore `APP_VERSION`/footer to `0.63` plus `CACHE` to `kevinos-v0_63`. Schema remains v40, so no state migration or protected-data rewrite is involved. The disabled relay route has no stored grading content to migrate or delete.
