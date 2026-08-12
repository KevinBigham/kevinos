# KevinOS architecture

## Delivery model

KevinOS is a static local-first PWA. `index.html` contains markup, styles, and one ES5-style IIFE. There is no dependency graph or build artifact: the served source is the app. `manifest.json` and `sw.js` provide install/offline behavior.

The optional `relay/worker.js` is a Cloudflare Worker. It owns provider keys, OAuth tokens, sync storage access, push, and live integrations. The browser stores only relay URL/token and opaque OAuth session handles.

## App flow

```text
DOM/event delegation -> deterministic mutation helper -> touch/bury -> save
                                            |               |
                                            |               +-> local persistence
                                            |               +-> debounced sync/push
                                            +-> render current room
```

Room renderers rebuild stable room containers with escaped HTML or text nodes. Event delegation belongs on those stable containers. `go()` normalizes a route, records heat, activates the room, runs explicit entry effects, and invokes the canonical renderer.

## State and recovery

The current schema is v39. `CONTENT_ARRAYS` is the shared portable/sync content list. `PORTABLE_OBJS` covers portable metadata. Device connections are excluded. Recovery layers are: corruption-blocked boot, JSON export/import, a five-deep IndexedDB snapshot ring, and optional revisioned cross-device sync.

See `STATE_CONTRACT.md` before edits.

## Trust boundaries

- Browser: Kevin's content and device-local connection settings.
- Relay: provider/OAuth secrets, D1 sync rows, KV sessions/subscriptions/caches.
- Providers: only explicit bounded context for the selected operation.
- Outward actions: app review/confirmation before email send or calendar creation.

AI requests use a small deterministic proposal layer: a selected role and versioned prompt, explicit context categories, a context fingerprint, provider/model receipt, and a persisted review state. Returned text has no mutation authority. Approved proposal actions call the same local state/touch/bury/save contracts as direct UI actions and retain an Undo receipt.

Attention evidence is an explicitly enabled device-local recorder. Its allowlisted receipts are bounded and sanitized, are restored on local boot, and are deliberately absent from portable documents, sync documents, relay requests, and AI context. Pure digest/signal functions compute current/prior seven-day evidence and provide at most one calm, fixed-precedence intervention without participating in `nowModel()`. Today only renders the deterministic NOW explanation and a qualifying friction signal; status, privacy, summaries, and controls live under collapsed Plan & Review disclosure.

Proposal workflow evidence reuses the existing proposal provenance and explicit feedback. A pure grouper summarizes resolved outcomes by mode, AI seat, provider/model, and prompt ID/version. Groups below the named minimum sample remain explicitly insufficient; evidence never selects or reroutes a provider.

Studio can copy a versioned JSON Mission Capsule with stable field order and a deterministic fingerprint. Capsules contain mission metadata only and exclude connections, tokens, credentials, and unrelated content.

The evidence flow is `context preview -> fingerprinted request -> bounded attempt -> fingerprinted response -> local contract checks -> Kevin review/edit -> explicit application -> optional Undo`. Receipt v2 is provider-neutral and stores metadata rather than duplicate context or raw provider envelopes. A local validation pass means only that the output meets the named text contract.

A bounded device-local flight-recorder sidecar observes only allowlisted consequential operations. It is recovery/debug evidence, never canonical state or sync authority. The pilot covers AI apply/Undo and import/restore; snapshots remain the whole-state checkpoint and operation corruption is ignored.

A second bounded sidecar supports the opt-in Calm Friction pilot. It accepts only explicit fixed-category marks from NOW and Capture, carries no content, and feeds one local seven-day aggregate. It is independent of canonical state, backups, sync, relay, and notifications; deletion or corruption simply returns the pilot to an empty view.

Studio stores missions inside the existing open `builds` records. Optional fields describe outcome, current state, next action, assigned AI/role, repo/branch/worktree, allowed and forbidden scope, source evidence, context policy, privacy boundary, data/schema classification, expected artifact, acceptance criteria, verification commands/status/evidence, rollback plan, commit reference, blockers, and handoff. No agent runtime exists inside the product.

Structured Studio missions add a nested proof bundle: stable acceptance identities, a fingerprint of the current packet, append-only bounded attempts, and verification receipts that separate collaborator report from KevinOS-local/manual proof. Sync unions acceptance and attempt identities inside a shared mission; ordinary mission fields retain the established whole-record newer-wins policy. KevinOS copies packets and records evidence but never executes repository commands.

## Testing

`test/harness.js` extracts the app IIFE and provides a tiny DOM/localStorage stub. App suites characterize parsing, mutation, portability, migrations, recurrence, and convergence. Test-only material-conflict fixtures inspect narrow same-stamp ambiguity without changing production behavior. The operation-stream reference harness compares 50 fixed seeds across every three-device merge order. Relay suites import the real Worker with fake bindings. Browser checks cover layout, focus, and interaction behavior that the stub cannot prove.
