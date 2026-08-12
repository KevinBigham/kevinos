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
10. **Attention is an explicit overlay.** NOW eligibility remains open today/due work, but daily ranks and stable reason codes are separate from task storage order. No AI, hidden score, or read-time normalization may choose focus.
11. **AI receipts prove process, not truth.** Versioned local receipts preserve context/request/response identity, named deterministic checks, Kevin's decision, application target, and Undo. Raw provider payloads and hidden reasoning are excluded because they add private duplication without granting trustworthy authority.
12. **“Shipped” means locally proved or visibly overridden.** Collaborator-reported success, machine-local/manual pass, pending, fail, reasoned waiver, stale packet, and override are distinct facts. A structured mission ships normally only with resolved acceptance and current local proof; an explicit override stays labeled as an override.
13. **Interrupt only for high stakes.** State replacement and proof overrides use one consequence-first accessible card with explicit confirm/cancel, Escape, focus return, and linked error summaries. Ordinary capture, completion, and navigation stay interruption-free.
14. **Operation history is bounded evidence, not a second database.** The initial allowlist is AI apply/Undo and import/restore, stored device-locally as IDs, fingerprints, status, counts, and checkpoint references. Content duplication, universal Undo claims, sync, and ordinary-edit tracking are prohibited.
15. **Friction is explicit personal science, never passive measurement.** The Calm Friction pilot is off by default and device-local. Kevin chooses one of five fixed reasons from NOW or Capture. It stores category/surface/timestamp and optional bounded target identity, never task text, window/activity history, a productivity score, notifications, or external telemetry. Twelve-hour duplicate compaction and 30-day/200-row retention are hard bounds.
16. **Conflict evidence precedes conflict product.** Same-stamp named-field ambiguities have test-only fixtures, while production continues its documented newer-`u`/remote-tie and tombstone rules. No conflict collection, alternate-text retention, System Health conflict card, schema change, or merge editor ships until a real material ambiguity is reproduced and reviewed.
17. **Operation-based sync is a reference oracle, not a migration.** Fixed-seed operation streams may test snapshot merge and tombstone semantics. They do not authorize a production operation log, CRDT, database, or protocol replacement.

## GATE-76 — deferred

The retained encryption direction is split-doc client-side AES-GCM for content plus an explicit opt-in plaintext digest for server-side smart push. Implementation remains blocked until all three conditions hold: the live deployed version is confirmed, the v2-key real-device re-key drill passes, and Kevin explicitly approves GATE-76. This Convergence mission must not bypass that stop condition.

## Deferred Track B

Generic SaaS/multi-user productization, framework migration, provider-count expansion, autonomous AI actions, external analytics, and broad public marketing remain outside KevinOS v1 daily-driver convergence.
