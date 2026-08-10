# Relay-specific agent contract

Read `../AGENTS.md` first. This file only adds Worker rules.

- `worker.js` is a Cloudflare Worker ES module; modern JavaScript is expected here.
- All routes are protected by `X-KevinOS-Token` when a relay token is configured except the explicit public health and OAuth login/callback/status routes in `isPublicRoute()`.
- CORS is not authentication. Never treat `ALLOW_ORIGIN` as an access boundary.
- Secret values live only in interactive Worker secrets. Never put them in source, docs, command arguments, tests, logs, or responses.
- Parse request bodies through the shared bounded JSON helper and assign the correct route limit class.
- Return stable, safe public errors and a correlation ID; do not expose provider, OAuth, database, or internal exception detail.
- OAuth attempts use cryptographic randomness, expire, and are single-use where compatible.
- External sends/creates must retain an explicit app-side approval boundary.
- When a route changes, update `docs/RELAY_ROUTE_MATRIX.md` and focused relay tests.
- Required checks: `node --check relay/worker.js`, relevant `node relay/test/*.test.js`, then `sh test/run.sh`.
