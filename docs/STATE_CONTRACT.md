# State, persistence, backup, and sync contract

## Canonical shape

- Schema: `SCHEMA_VERSION=40` with one deterministic v39→v40 migration.
- Synced/portable collections: the 19 names in `CONTENT_ARRAYS`, including canonical `roles` and `decisions`.
- Portable metadata: `PORTABLE_OBJS` plus explicitly copied scalar settings.
- Device-local/connection state: relay token, sync key/revision, push subscription, GitHub/Google sessions, calendar connection, and caches.
- `attention` is device-local evidence: `{version, enabled, retentionDays, receipts, lastPrunedAt}`. Receipts contain only an opaque ID, timestamp, day key, allowlisted event type, optional entity type/opaque ID, and source surface. They are sanitized, retained for 30 days, and capped at 500. The field is restored by the boot whitelist but excluded from `CONTENT_ARRAYS`, `PORTABLE_OBJS`, backups/imports, sync documents, relay requests, AI context, and Mission Capsules.

Nested records are intentionally tolerant of missing optional fields. Read old records defensively and normalize at use sites. A new top-level field is stricter: initialize it, restore it in the boot whitelist, classify it, and add round-trip coverage in one change.

Typed `roleId`, `projectId`, `goalId`, `eventId`, person, source, and privacy links remain optional and normalize without inventing identities. Projects carry the durable Resume Capsule source fields; related tasks/events/builds/goals/people/decisions/briefs/notes/links/prompts/stash remain in their canonical arrays. The relationship/search indexes are pure derived views and must never appear in backup or sync documents. Missing targets are preserved and surfaced as repair proposals rather than silently cleared or relinked.

Project status is one of Active, Paused, Scheduled, Someday, Done, or Killed; WIP class is admitted, support, or incubator. `portfolio.projectWipLimit` and `portfolio.roleWipLimits` expose overload only. They never rewrite project status or class. New Active/admitted work must have capacity or a visible `overrideReason` plus current/future `overrideReviewDate`. Weekly-review IDs and its content-free receipt live in the portable `portfolio` object; operation history and in-session Undo checkpoints remain device-local. `notNowProjectIds` is refreshed only by an explicit portfolio decision or review.

Decision records preserve bounded options/tradeoffs, chosen option, rationale, assumptions, reversibility, revisit date, role/project/source/privacy, evidence references, status, and timestamps. Communication commitments remain ordinary task records with optional event/person/project/source links and an explicit lifecycle; `ready` never means `sent`. `adminKind` is a closed explicit field on tasks/events (and a compatible spend category mapping); Admin and Money Radar never guesses from title text or becomes accounting, brokerage, roster, LMS, or student-record storage. `portfolio.labBudget` is bounded experiment metadata inside the existing portable object, not a new top-level field.

Playbooks use the existing `briefs` collection with optional `templateVersion`, `versionLocked`, `builtIn`, `steps`, and `safeguards` fields plus the shared role/project/source/privacy links. First-party seeds are configuration, not active workload. Instantiated task checklists carry a deterministic `sourceRef`; they remain editable, actionable, and unscheduled until Kevin changes them. Playbook Undo calls `bury(id)` before removal. Onboarding progress is device-local and never enters portable or synced state; the project, physical task, and weekly outcome it creates use their canonical collections.

Tasks may carry optional daily attention metadata: `focusDate`, integer `focusRank` 1–3, `focusSetAt`, and `focusSource`. For the current day, eligible explicit-focus tasks sort by rank, then `focusSetAt`, then ID; remaining eligible tasks preserve canonical `items` array order. Stale/invalid metadata is ignored. Duplicate active ranks remain a read-only diagnostic and compact only during Kevin's next explicit focus edit. Rendering and boot never repair focus silently. Focus fields use the existing whole-record newer-`u`/remote-tie merge rule.

Convergence now uses schema v40 after one deterministic v39 migration; all previously optional Convergence fields remain compatible. `pending[kind=ai]` carries text-proposal provenance, sharing categories/fingerprint, lifecycle feedback, and an application Undo receipt. `pending[kind=event]` carries newly extracted calendar proposals; legacy calendar proposals without `kind` remain readable. Calendar bulk actions operate only on event proposals and the AI Inbox operates only on AI proposals. `builds` may carry mission-control, structured-proof, Mission Capsule policy, nine-state queue, target/writer/reviewer, dependencies, packet version, claims, last-proof, and bounded event-history fields. These are optional nested fields; old records remain valid and portable/synced documents preserve unknown nested keys. Legacy stages map conservatively; no read path invents a project, writer, proof, or completed state.

New AI proposals carry optional receipt v2 objects. Canonical request identity sorts object keys and set-like category names while preserving ordered arrays. Context metadata stores categories, per-source status/count, exact UTF-8 byte count of the sent string, omissions, and a fingerprint—not a second context copy. Attempts are append-only bounded facts; provider failure has no response fingerprint. Local validators establish text-contract status only, never factual truth. `review` distinguishes edit/apply/reject/escalate and `application` links the approved target with Undo state. Legacy proposals render absent facts as unrecorded. Relay secrets, OAuth data, raw provider payloads, and hidden reasoning are forbidden.

Studio missions may carry an optional `proofBundle` v1 inside the existing `builds` record. It holds at most 50 stable acceptance items, 10 attempts, and 50 receipts per attempt. Packet fingerprints cover normalized outcome/state/next action, repository coordinates, set-normalized allowed/forbidden scope, ordered acceptance IDs/text, set-normalized verification commands, and role. Notes and transient UI do not affect identity. Structured acceptance and attempts merge by nested ID; same-ID facts resolve by their explicit check/completion time and canonical tie-break, preventing whole-record sync from silently dropping an independently added item or attempt. Shipped requires every item pass or carry a reasoned waiver, a current-packet attempt, at least one local pass, and no current local fail. Collaborator-reported pass remains `unverified`. Legacy prose never silently verifies. An override is reasoned and visible but never changes `missionVerified()` to true.

The Studio queue allows queued, ready, running, awaiting-human, awaiting-proof, blocked, review, complete, and paused. Running requires a project link, non-empty target files, writer owner, completed dependencies, and no exact-file collision with another Running mission. A reasoned collision records a handoff request and moves to awaiting-human; it never grants a simultaneous lock. Pause remembers its prior state; at most 30 normalized events are retained. Packet fingerprints additionally cover packet version, project, agent profile/reviewer, target files, source/context/privacy selection. Collaborator claim receipts are always locally `unverified`; only a separate named local/manual receipt can establish proof.

## Mutation rules

- `touch(record)` stamps `u` and invalidates day caches.
- `save()` is the user-visible write: it schedules sync/reminders, persists, and surfaces failure.
- `persist()` is quiet local persistence for metadata/cache changes.
- `bury(id)` records a tombstone before synced deletion.
- Never mutate meaningful synced records without `touch()`.

## Portability

`portableDoc()` is allowlist-built and deep-cloned. It excludes `sync`, `push`, `github`, `email`, and `calendar`; it preserves `relay.url` but blanks `relay.token`. `applyPortableDoc()` applies allowlisted data without changing this device's connections, sanitizes IDs, invalidates caches, and marks connected sync dirty for a merge push.

## Boot and migration

Boot parses `kevinos:v1`, blocks all writes on corruption, captures the previous version, restores through a whitelist, runs ordered migration gates, stamps the current schema, sanitizes IDs, and records last-good-boot evidence. Imports from newer schemas warn and still apply only known allowlisted fields.

Schema changes require one deterministic previous-version gate and tests for old/malformed fixtures, boot round trip, backup/import, merge, and convergence.

The Attention Proof Loop remains a compatible device-local extension. Schema v40 is instead required by canonical `roles`, `decisions`, `portfolio`, typed role/privacy links, and the deliberate migration receipt/checkpoint contract. A v39 save is fingerprinted, snapshotted as `pre-v40-personalization`, normalized in memory, validated, then persisted once as v40.

## Sync

The relay uses optimistic revision control. A push includes `baseRev`; stale writers receive the remote document, merge losslessly by ID, union tombstones, then retry. Newer `u` wins; remote wins ties. Tombstones prevent resurrection and are garbage-collected after 30 days. Connection fields never sync.

## Recovery acceptance

Any state change must preserve: corrupt-store write blocking, raw recovery, verified export/import, snapshot restore, connection exclusion, tombstones, and three-device convergence. Run `test/app-logic.test.js`, `test/portable.test.js`, `test/merge.test.js`, and `test/convergence.test.js` for state-sensitive work.

The manual recovery drill is mechanically read-only: it parses at most 5 MB in memory, checks schema/portable collections/connection exclusion, compares record fingerprints and counts, and reports that no replacement occurred. It never calls `save()`, `touch()`, `bury()`, relay, sync, import, or snapshot restore. Only `{at, fingerprint, status}` is retained in the device-local `kevinos:recoveryDrill` sidecar; file names and content are not retained or synced.

The Local Flight Recorder pilot is a separate device-local `kevinos:operations` sidecar capped at 25 rows. Its allowlist is AI apply/Undo, backup import/snapshot restore, and explicit role remap/Undo. A row holds stable operation/type/source/status/timestamps, affected count, before/after portable fingerprints, bounded target/proposal IDs, optional checkpoint reason, and safe-Undo availability. It never stores content, provider payloads, secrets, or whole-state copies; it never syncs or enters backups. Started and terminal facts share one ID, Undo creates a linked new operation, and corrupt/absent history behaves as empty without affecting canonical state.

The Calm Friction pilot uses device-local keys `kevinos:friction:enabled` and `kevinos:friction`. It is disabled by default. A mark contains only a safe ID, `kevinos.friction.marked`, `now`/`capture` surface, optional bounded target kind/ID, one of five fixed categories, and timestamp. Same surface/target/category marks within 12 hours compact; only the newest 200 valid marks from 30 days are readable. Weekly aggregation is deterministic and local, emits at most one fixed suggestion after a repeated category, and never records task text or sends data. Turning the pilot off stops collection; Clear deletes the sidecar immediately. Corrupt pilot data behaves as empty and cannot affect canonical state.

The `kevinos:lab-signals:v1` sidecar stores only eight allowlisted integer counters, bounded daily marker keys, version, and update time. It contains no titles, notes, people, projects, sources, prompts, responses, finance facts, or protected content; it never enters backup, sync, relay, or AI context. Duplicate same-day signals compact, corrupt content normalizes to empty, and removal affects no canonical workflow.

Material-conflict diagnostics and the operation-based sync model are test-only. Production merge remains whole-record newer-`u`, remote-wins on ties, with tombstones preventing resurrection. `test/conflicts.test.js` names the only fields eligible for experimental ambiguity detection and proves routine/equivalent/tombstoned cases remain quiet. It does not persist competing values. `test/sync-reference.test.js` folds deterministic operation fixtures only to check the existing snapshot/tombstone contract; it is not a synced operation store or migration path.

## Active v40 state + AI Provider Fabric

Schema v40 is active. It adds canonical `roles`, `decisions`, and `portfolio` plus compatible record links, commitment fields, and monotonic privacy classes defined in the active blueprint. Work and Coaching remain deterministic legacy roles until an explicit previewed remap; `area` is preserved unchanged.

Provider configuration is not canonical user content. Secret values and provider enable/free allowlists exist only as relay bindings/environment configuration. Redacted runtime status stays in browser memory. The Eval Lab sidecar `kevinos:ai-fabric-lab:v1` stores at most 50 allowlisted content-free scorecards plus an explicitly approved synthetic Lab route and last-known-good route; it never syncs or enters backups. Authorization headers, raw provider envelopes, prompts, responses, source content, and hidden reasoning are forbidden from canonical state, portable state, sync, exports, operations, and diagnostics.

Every outbound Provider Fabric packet is classified before transport as `PUBLIC`, `SANITIZED`, `PERSONAL`, `WORK_INTERNAL`, `YOUTH_SENSITIVE`, `FINANCIAL_SENSITIVE`, or `SECRET`. The initial implementation permits only Public and explicitly attested Sanitized packets. Personal, work-internal, youth, finance, secret, incomplete manifests, and secret-pattern inputs fail closed with zero adapter calls. The zero-dollar contract also fails closed: `allowPaid=false`; unknown, non-free, or stale eligibility blocks; fallback cannot cross price, privacy, capability, context, output, quota, circuit, lifecycle, or usage-class boundaries. All-provider-disabled state is valid and preserves complete local operation.
