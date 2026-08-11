# KevinOS decisions

## Active decisions

1. **Single-file PWA stays.** The dependency-free `index.html` is a product/recovery choice, not technical debt awaiting a framework rewrite.
2. **Local-first and explicit custody.** Core use works without relay connections. Connections do not travel in backups or sync.
3. **Deterministic priority.** Kevin's focus ordering and calendar determine NOW. AI may explain, challenge, or propose; it never silently chooses or applies consequential state.
4. **Human approval at outward boundaries.** Email send, calendar create, task/project mutation from AI, deployment, and destructive operations require explicit approval.
5. **One room registry.** Routing, rendering, labels, navigation, command entries, aliases, and More grouping converge on one source of truth.
6. **Compatible record evolution before schema churn.** Existing `pending` and `builds` records are open nested shapes. Add optional fields defensively when possible and preserve old records. A top-level or incompatible change triggers the formal schema gate.
7. **No external telemetry.** Adoption and AI feedback remain local.
8. **Relay boundaries fail closed before work.** Bounded bodies are read before provider/KV/D1 calls; OAuth provider state is random, expiring, and single-use; unexpected failures expose only a correlation ID; server-side URL fetches reject private/local targets and unsafe redirects.
9. **Stable installed-app identity.** The manifest uses `id: "./"`, matching the existing scope and start URL, so future path/query changes do not create a second installed KevinOS identity.
10. **Attention evidence stays quiet and local.** Recording is opt-in, content-minimized, bounded, removable, and never participates in deterministic priority. Signals use fixed precedence and return at most one intervention.
11. **Mission Capsules are safe handoffs.** JSON capsules use stable field order and a deterministic fingerprint; sensitive connection data is never inferred into a capsule.

## GATE-76 — deferred

The retained encryption direction is split-doc client-side AES-GCM for content plus an explicit opt-in plaintext digest for server-side smart push. Implementation remains blocked until all three conditions hold: the live deployed version is confirmed, the v2-key real-device re-key drill passes, and Kevin explicitly approves GATE-76. This Convergence mission must not bypass that stop condition.

## Deferred Track B

Generic SaaS/multi-user productization, framework migration, provider-count expansion, autonomous AI actions, external analytics, and broad public marketing remain outside KevinOS v1 daily-driver convergence.
