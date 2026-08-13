# Relay-specific agent contract

Read `../AGENTS.md` first. This file adds Worker and provider-fabric rules.

- `worker.js` is a Cloudflare Worker ES module; modern JavaScript is expected here.
- All routes are protected by `X-KevinOS-Token` when a relay token is configured except the explicit public health and OAuth login/callback/status routes in `isPublicRoute()`.
- CORS is not authentication. Never treat `ALLOW_ORIGIN` as an access boundary.
- Secret values live only in interactive Worker secrets. Never put them in source, docs, command arguments, tests, logs, or responses.
- Parse request bodies through the shared bounded JSON helper and assign the correct route limit class.
- Return stable, safe public errors and a correlation ID; do not expose provider, OAuth, database, or internal exception detail.
- OAuth attempts use cryptographic randomness, expire, and are single-use where compatible.
- External sends/creates must retain an explicit app-side approval boundary.

## Provider-fabric law

- Provider keys live only in Worker bindings/secrets or an ignored local secret store used by the credential ceremony. Never put values in source, docs, wrangler config, command arguments, tests, fixtures, logs, responses, screenshots, patches, hashes, or browser payloads.
- No credential is requested or live provider called before the K9 preactivation gate passes.
- The app sends one canonical capability envelope. Provider adapters own provider-specific mapping and normalize success, errors, usage, model identity, and retry facts.
- Run classification, minimization/redaction, approval checks, hard `allowPaid=false`, model/free-eligibility checks, quota ceilings, and circuit checks before transport.
- Denied privacy fixtures must make zero provider/binding/fetch calls.
- Fallback is deterministic, sequential, bounded, and contract-compatible. No paid spillover, unbounded retry, or default parallel fan-out.
- Store/log only content-free provider facts. Never log prompt or response content.
- Model aliases must fail closed on missing/deprecated/non-free models and preserve local/offline app behavior.
- Remote secret mutation, deployment, provider setting changes, or billing changes require separate just-in-time Kevin approval.

When a route/provider changes, update `docs/RELAY_ROUTE_MATRIX.md`, provider capability docs, and credentialless focused tests. Required checks are `node --check relay/worker.js`, relevant `node relay/test/*.test.js`, `node tools/scan-secret-values.js`, then `sh test/run.sh`.
