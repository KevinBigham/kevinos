# State, persistence, backup, and sync contract

## Canonical shape

- Schema: `SCHEMA_VERSION=39`.
- Synced/portable collections: the 17 names in `CONTENT_ARRAYS`.
- Portable metadata: `PORTABLE_OBJS` plus explicitly copied scalar settings.
- Device-local/connection state: relay token, sync key/revision, push subscription, GitHub/Google sessions, calendar connection, and caches.
- `attention` is device-local evidence: `{version, enabled, retentionDays, receipts, lastPrunedAt}`. Receipts are sanitized, retained for 30 days, and capped at 500. It is restored by the boot whitelist but excluded from `CONTENT_ARRAYS`, `PORTABLE_OBJS`, backups, sync documents, relay requests, and AI context.

Nested records are intentionally tolerant of missing optional fields. Read old records defensively and normalize at use sites. A new top-level field is stricter: initialize it, restore it in the boot whitelist, classify it, and add round-trip coverage in one change.

Convergence intentionally keeps schema v39. `pending[kind=ai]` carries text-proposal provenance, sharing categories/fingerprint, lifecycle feedback, and an application Undo receipt. `pending[kind=event]` carries newly extracted calendar proposals; legacy calendar proposals without `kind` remain readable. Calendar bulk actions operate only on event proposals and the AI Inbox operates only on AI proposals. `builds` may carry mission-control fields. These are optional nested fields; old records remain valid and portable/synced documents preserve unknown nested keys.

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

The Attention Proof Loop is a compatible top-level extension; `SCHEMA_VERSION` remains 39 because no incompatible persisted-shape migration was required. Rollback is the normal prior app build; old builds ignore the optional field and retain their existing content state.

## Sync

The relay uses optimistic revision control. A push includes `baseRev`; stale writers receive the remote document, merge losslessly by ID, union tombstones, then retry. Newer `u` wins; remote wins ties. Tombstones prevent resurrection and are garbage-collected after 30 days. Connection fields never sync.

## Recovery acceptance

Any state change must preserve: corrupt-store write blocking, raw recovery, verified export/import, snapshot restore, connection exclusion, tombstones, and three-device convergence. Run `test/app-logic.test.js`, `test/portable.test.js`, `test/merge.test.js`, and `test/convergence.test.js` for state-sensitive work.
