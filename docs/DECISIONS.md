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
10. **Attention evidence stays quiet and local.** Recording is opt-in, content-minimized, bounded, removable, and never participates in deterministic priority. Current/prior seven-day evidence uses fixed policy constants; signals use fixed precedence and return at most one intervention.
11. **Mission Capsules are safe handoffs.** JSON capsules use stable field order and a deterministic fingerprint; sensitive connection data is never inferred into a capsule. Sensitive context appears only when Kevin intentionally writes it into mission fields.
12. **AI workflow claims require local evidence.** Workflow summaries group explicit proposal outcomes, require at least three resolved samples before describing a pattern, and never silently select or reroute a provider.
13. **Attention is an explicit overlay.** NOW eligibility remains open today/due work, but daily ranks and stable reason codes are separate from task storage order. No AI, hidden score, or read-time normalization may choose focus.
14. **AI receipts prove process, not truth.** Versioned local receipts preserve context/request/response identity, named deterministic checks, Kevin's decision, application target, and Undo. Raw provider payloads and hidden reasoning are excluded because they add private duplication without granting trustworthy authority.
15. **“Shipped” means locally proved or visibly overridden.** Collaborator-reported success, machine-local/manual pass, pending, fail, reasoned waiver, stale packet, and override are distinct facts. A structured mission ships normally only with resolved acceptance and current local proof; an explicit override stays labeled as an override.
16. **Interrupt only for high stakes.** State replacement and proof overrides use one consequence-first accessible card with explicit confirm/cancel, Escape, focus return, and linked error summaries. Ordinary capture, completion, and navigation stay interruption-free.
17. **Schema v40 uses one save-safe role migration.** Stable Kevin roles, canonical decisions, and portfolio state migrate once from v39; Work and Coaching remain legacy, areas remain unchanged, privacy can only tighten, and remap is previewed, checkpointed, receipted, and undoable.
17. **Operation history is bounded evidence, not a second database.** The initial allowlist is AI apply/Undo and import/restore, stored device-locally as IDs, fingerprints, status, counts, and checkpoint references. Content duplication, universal Undo claims, sync, and ordinary-edit tracking are prohibited.
18. **Friction is explicit personal science, never passive measurement.** The Calm Friction pilot is off by default and device-local. Kevin chooses one of five fixed reasons from NOW or Capture. It stores category/surface/timestamp and optional bounded target identity, never task text, window/activity history, a productivity score, notifications, or external telemetry. Twelve-hour duplicate compaction and 30-day/200-row retention are hard bounds.
19. **Conflict evidence precedes conflict product.** Same-stamp named-field ambiguities have test-only fixtures, while production continues its documented newer-`u`/remote-tie and tombstone rules. No conflict collection, alternate-text retention, System Health conflict card, schema change, or merge editor ships until a real material ambiguity is reproduced and reviewed.
20. **Operation-based sync is a reference oracle, not a migration.** Fixed-seed operation streams may test snapshot merge and tombstone semantics. They do not authorize a production operation log, CRDT, database, or protocol replacement.

## Approved v40 mission decisions

21. **The Kevin Role Registry is first-class while legacy area remains preserved.** Stable roles become canonical in schema v40; `area` remains compatible and Work/Coaching are never auto-split.
22. **Commitment semantics become explicit.** Promise type and execution state are separate, reason-coded facts.
23. **Projects become the shared spine.** Cross-room records link through IDs and read-time indexes rather than duplicated stores.
24. **Privacy is monotonic.** Migration, import, merge, AI context, and public output choose the more restrictive class when ambiguous.
25. **Active work is scarce and explicit.** WIP caps expose overload but never silently change status; overrides need a reason and review date.
26. **The v40 migration is one deliberate gate.** Add `roles`, `decisions`, and `portfolio` through one deterministic v39→v40 migration with complete recovery proof.
27. **Safe ambiguity does not interrupt the marathon.** Codex logs the smallest reversible answer; outward, destructive, secret, privacy-weakening, paid, and GATE-76 actions remain blocked.
28. **Provider-neutral contracts precede integrations.** Features use stable aliases and normalized envelopes, never vendor payloads.
29. **Credentials stay server-side and outside KevinOS state.** Key values never enter browser code, storage, backups, sync, receipts, logs, screenshots, patches, or hashes.
30. **Credentials are requested last.** K-1 through K9 and preactivation complete before K10.
31. **Zero dollars is a hard policy.** `allowPaid=false`; unknown price/free eligibility blocks and paid spillover is forbidden.
32. **Privacy denial occurs before transport.** Youth, finance, secret, and unapproved internal work fail closed with zero provider calls.
33. **Fallback preserves the complete contract.** It is deterministic, sequential, bounded, and never default parallel fan-out.
34. **Model names are live facts.** Stable aliases map only to currently verified eligible models.
35. **Provider claims require evidence.** Eligibility, quota, data controls, and binding availability are redacted discovered facts.
36. **Continuous improvement is synthetic and human-approved.** No automatic prompt/model/route/policy change.
37. **Local usefulness survives zero providers.** Deterministic and recovery workflows remain complete offline.
38. **The Provider Control Center is not a secret form.** It displays only redacted policy and health metadata.
39. **Local activation is not deployment.** Remote secret mutation, deployment, push, publish, or billing changes require separate just-in-time authorization.
40. **Decision and communication state stays canonical.** Decisions preserve options, assumptions, rationale, reversibility, source, privacy, and revisit dates; communication commitments link to existing people/projects/events and `ready` never means sent.
41. **Knowledge conversion is reviewed local mutation.** Promote, checklist, decision, and project attachment actions require a named project, privacy review, exact confirmation, and source provenance. They never send, publish, schedule, deploy, or call a provider.
42. **Search is deterministic retrieval, not ranking authority.** Typed local search uses explicit filters and stable source ordering with a bounded result window; it does not invent a priority score.
43. **Admin and evidence surfaces do not become shadow systems.** Admin & Money uses explicit record classifications rather than keyword guesses, and evidence timelines show factual proof without points or engagement scoring.
44. **Product experiments carry an exit.** Lab Budget entries require friction evidence, a success test, owner, adoption check, sunset/revert plan, and review date. Local counters are content-free and bounded.
45. **v0.58 is the single credentialless v40 release checkpoint.** App version, footer fallback, and service-worker cache advance together after the complete local release candidate is green; schema remains v40.

## GATE-76 — deferred

The retained encryption direction is split-doc client-side AES-GCM for content plus an explicit opt-in plaintext digest for server-side smart push. Implementation remains blocked until all three conditions hold: the live deployed version is confirmed, the v2-key real-device re-key drill passes, and Kevin explicitly approves GATE-76. This Convergence mission must not bypass that stop condition.

## Deferred Track B

Generic SaaS/multi-user productization, framework migration, provider-count expansion, autonomous AI actions, external analytics, and broad public marketing remain outside KevinOS v1 daily-driver convergence.
