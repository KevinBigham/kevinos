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

Studio stores missions inside the existing open `builds` records. Optional fields describe outcome, current state, next action, assigned AI/role, repo/branch/worktree, allowed and forbidden scope, acceptance criteria, verification commands/status/evidence, commit reference, blockers, and handoff. No agent runtime exists inside the product.

## Testing

`test/harness.js` extracts the app IIFE and provides a tiny DOM/localStorage stub. App suites characterize parsing, mutation, portability, migrations, recurrence, and convergence. Relay suites import the real Worker with fake bindings. Browser checks cover layout, focus, and interaction behavior that the stub cannot prove.
