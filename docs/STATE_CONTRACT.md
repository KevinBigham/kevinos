# State, persistence, backup, and sync contract

## Canonical shape

- Schema: `SCHEMA_VERSION=39`.
- Synced/portable collections: the 17 names in `CONTENT_ARRAYS`.
- Portable metadata: `PORTABLE_OBJS` plus explicitly copied scalar settings.
- Device-local/connection state: relay token, sync key/revision, push subscription, GitHub/Google sessions, calendar connection, and caches.

Nested records are intentionally tolerant of missing optional fields. Read old records defensively and normalize at use sites. A new top-level field is stricter: initialize it, restore it in the boot whitelist, classify it, and add round-trip coverage in one change.

Tasks may carry optional daily attention metadata: `focusDate`, integer `focusRank` 1–3, `focusSetAt`, and `focusSource`. For the current day, eligible explicit-focus tasks sort by rank, then `focusSetAt`, then ID; remaining eligible tasks preserve canonical `items` array order. Stale/invalid metadata is ignored. Duplicate active ranks remain a read-only diagnostic and compact only during Kevin's next explicit focus edit. Rendering and boot never repair focus silently. Focus fields use the existing whole-record newer-`u`/remote-tie merge rule.

Convergence intentionally keeps schema v39. `pending[kind=ai]` carries text-proposal provenance, sharing categories/fingerprint, lifecycle feedback, and an application Undo receipt. `pending[kind=event]` carries newly extracted calendar proposals; legacy calendar proposals without `kind` remain readable. Calendar bulk actions operate only on event proposals and the AI Inbox operates only on AI proposals. `builds` may carry mission-control fields. These are optional nested fields; old records remain valid and portable/synced documents preserve unknown nested keys.

New AI proposals carry optional receipt v2 objects. Canonical request identity sorts object keys and set-like category names while preserving ordered arrays. Context metadata stores categories, per-source status/count, exact UTF-8 byte count of the sent string, omissions, and a fingerprint—not a second context copy. Attempts are append-only bounded facts; provider failure has no response fingerprint. Local validators establish text-contract status only, never factual truth. `review` distinguishes edit/apply/reject/escalate and `application` links the approved target with Undo state. Legacy proposals render absent facts as unrecorded. Relay secrets, OAuth data, raw provider payloads, and hidden reasoning are forbidden.

Studio missions may carry an optional `proofBundle` v1 inside the existing `builds` record. It holds at most 50 stable acceptance items, 10 attempts, and 50 receipts per attempt. Packet fingerprints cover normalized outcome/state/next action, repository coordinates, set-normalized allowed/forbidden scope, ordered acceptance IDs/text, set-normalized verification commands, and role. Notes and transient UI do not affect identity. Structured acceptance and attempts merge by nested ID; same-ID facts resolve by their explicit check/completion time and canonical tie-break, preventing whole-record sync from silently dropping an independently added item or attempt. Shipped requires every item pass or carry a reasoned waiver, a current-packet attempt, at least one local pass, and no current local fail. Collaborator-reported pass remains `unverified`. Legacy prose never silently verifies. An override is reasoned and visible but never changes `missionVerified()` to true.

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

## Sync

The relay uses optimistic revision control. A push includes `baseRev`; stale writers receive the remote document, merge losslessly by ID, union tombstones, then retry. Newer `u` wins; remote wins ties. Tombstones prevent resurrection and are garbage-collected after 30 days. Connection fields never sync.

## Recovery acceptance

Any state change must preserve: corrupt-store write blocking, raw recovery, verified export/import, snapshot restore, connection exclusion, tombstones, and three-device convergence. Run `test/app-logic.test.js`, `test/portable.test.js`, `test/merge.test.js`, and `test/convergence.test.js` for state-sensitive work.

The manual recovery drill is mechanically read-only: it parses at most 5 MB in memory, checks schema/portable collections/connection exclusion, compares record fingerprints and counts, and reports that no replacement occurred. It never calls `save()`, `touch()`, `bury()`, relay, sync, import, or snapshot restore. Only `{at, fingerprint, status}` is retained in the device-local `kevinos:recoveryDrill` sidecar; file names and content are not retained or synced.

The Local Flight Recorder pilot is a separate device-local `kevinos:operations` sidecar capped at 25 rows. Its allowlist is AI apply/Undo and backup import/snapshot restore. A row holds stable operation/type/source/status/timestamps, affected count, before/after portable fingerprints, bounded target/proposal IDs, optional checkpoint reason, and safe-Undo availability. It never stores content, provider payloads, secrets, or whole-state copies; it never syncs or enters backups. Started and terminal facts share one ID, Undo creates a linked new operation, and corrupt/absent history behaves as empty without affecting canonical state.

The Calm Friction pilot uses device-local keys `kevinos:friction:enabled` and `kevinos:friction`. It is disabled by default. A mark contains only a safe ID, `kevinos.friction.marked`, `now`/`capture` surface, optional bounded target kind/ID, one of five fixed categories, and timestamp. Same surface/target/category marks within 12 hours compact; only the newest 200 valid marks from 30 days are readable. Weekly aggregation is deterministic and local, emits at most one fixed suggestion after a repeated category, and never records task text or sends data. Turning the pilot off stops collection; Clear deletes the sidecar immediately. Corrupt pilot data behaves as empty and cannot affect canonical state.

Material-conflict diagnostics and the operation-based sync model are test-only. Production merge remains whole-record newer-`u`, remote-wins on ties, with tombstones preventing resurrection. `test/conflicts.test.js` names the only fields eligible for experimental ambiguity detection and proves routine/equivalent/tombstoned cases remain quiet. It does not persist competing values. `test/sync-reference.test.js` folds deterministic operation fixtures only to check the existing snapshot/tombstone contract; it is not a synced operation store or migration path.
