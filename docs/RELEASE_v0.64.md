# KevinOS v0.64 local candidate — Grading Groq ZDR pilot

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

Kevin authorized one fixed synthetic Groq ZDR probe after confirming Global ZDR in the Personal organization. The call failed closed after one provider request: no proposal was accepted, validation did not run, fallback was zero, no response content was stored, and nothing was posted or finalized. The authorization is consumed and the exact reason is unavailable because the first redacted receipt omitted the relay's content-free failure classification; the tool now preserves that classification for a future separately authorized run. See `docs/grading-machine/groq-zdr-pilot/04_LIVE_PROBE_RECEIPT.md`.

This candidate does not establish a passing live grading route, change production provider policy, or activate transport. It uses no real student data and records no secret value. Any retry requires new just-in-time authorization. Any non-synthetic educational record requires a new privacy packet.

## Rollback

Revert the v0.64 commit and restore `APP_VERSION`/footer to `0.63` plus `CACHE` to `kevinos-v0_63`. Schema remains v40, so no state migration or protected-data rewrite is involved. The disabled relay route has no stored grading content to migrate or delete.
