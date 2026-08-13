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

The current schema is v40. `CONTENT_ARRAYS` is the shared portable/sync content list and includes canonical roles and decisions. `PORTABLE_OBJS` includes the portfolio governor. Device connections are excluded. Recovery layers are: corruption-blocked boot, JSON export/import, a five-deep IndexedDB snapshot ring, and optional revisioned cross-device sync. Role settings and explicit legacy remap live inside Plan & Review, preserving the zero-new-room ruling.

Project Spine uses optional typed IDs on canonical records. `relationshipIndex()` reconstructs project, role, person, goal, and event relationships at read time and is never persisted. Projects opens a Project Hub over those records, while the durable project record owns only its truth/resume fields: outcome, current state, next physical action, blockers, review/health, repos, last proof, restart checklist, and privacy. Link diagnostics report and propose repairs without rewriting data. New Studio missions must select a project or explicitly use the canonical Someday/Incubator placeholder.

Supporting v40 surfaces reuse canonical records and existing rooms. Project Hub owns the Decision and Assumption Ledger; Plan and Review derives due revisits, linked communication commitments, Admin and Money facts, factual evidence, and bounded experiment reviews; Tasks owns explicit communication/admin fields; People shows linked commitments; Library owns deterministic typed search and confirmed knowledge conversions. Search indexes no persisted copy and uses explicit type/role/project/person/status/source filters. Knowledge conversion preserves source and monotonic privacy and never sends, publishes, schedules, deploys, or executes external work.

The Portfolio Governor is also a derived decision surface. `projectWipSummary()`, `projectAdmissionDecision()`, `projectHealthFacts()`, and `weeklyPortfolioModel()` read canonical project/task/build facts without changing them. Projects shows global/per-role admitted capacity and six explicit decisions; Plan & Review records one/two weekly outcomes, protected commitments, a derived not-now list, and next review. Consequential mutations checkpoint first, emit content-free device-local operation receipts, and offer bounded exact-state Undo. Unknown legacy project statuses are retained in `legacyStatus` and conservatively normalized to Someday rather than silently activated.

Role playbooks remain ordinary canonical `briefs` records. Fifteen stable built-in templates seed only when absent and carry version, lock, role, privacy, source, bounded steps, and safeguards. Preview is read-only; explicit instantiation creates ordinary editable unscheduled tasks with deterministic source provenance and duplicate prevention. Undo buries those tasks before removal. Role-aware Life Sweep and the seven-step onboarding reuse canonical role/project/task/portfolio contracts; only progress markers and active step are device-local. Returning v39 users may defer legacy-role review without any remap.

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

The v40 Lab signal sidecar is also device-local and content-free. It stores bounded named counters and at-most-once-per-day markers for orientation, restart, open-promise, over-cap, waiting-review, weekly-review, feature-friction, and sunset-review signals. Human-readable experiment hypotheses, owners, success tests, adoption checks, sunset plans, and review dates live in `portfolio.labBudget` and round-trip as ordinary portable configuration; no score, streak, surveillance, or engagement ranking is derived.

Studio stores missions inside the existing open `builds` records. Optional fields describe the closed queue state, outcome, current state, next action, local agent profile/role/reviewer, repo/branch/worktree, target files and writer owner, dependencies, packet version, allowed and forbidden scope, source evidence, context policy, privacy boundary, data/schema classification, expected artifact, acceptance criteria, verification commands/status/evidence, collaborator claim/references/changed files, last local proof, rollback, blockers, and handoff. A pure lock preflight permits only one Running writer per exact target; a reasoned collision requests handoff and becomes Awaiting Kevin. Dependency views and the bounded 30-event pause/resume history derive from these same records. No agent runtime exists inside the product.

Structured Studio missions add a nested proof bundle: stable acceptance identities, a fingerprint of the current packet, append-only bounded attempts, and verification receipts that separate collaborator report from KevinOS-local/manual proof. Sync unions acceptance and attempt identities inside a shared mission; ordinary mission fields retain the established whole-record newer-wins policy. KevinOS copies packets and records evidence but never executes repository commands.

Mission packet identity covers packet version, project, profile/reviewer, repository coordinates, target files, scope, source/context/privacy selection, acceptance, commands, and role. Changing any covered field makes prior proof stale. Handoff intake creates reported/unverified receipts; reviewer approval fails closed without current structured local proof. Studio explicitly cannot launch terminals, agents, worktrees, pushes, deploys, or provider actions.

## Testing

`test/harness.js` extracts the app IIFE and provides a tiny DOM/localStorage stub. App suites characterize parsing, mutation, portability, migrations, recurrence, and convergence. Test-only material-conflict fixtures inspect narrow same-stamp ambiguity without changing production behavior. The operation-stream reference harness compares 50 fixed seeds across every three-device merge order. Relay suites import the real Worker with fake bindings. Browser checks cover layout, focus, and interaction behavior that the stub cannot prove.

## AI Provider Fabric — credentialless implementation complete

The browser remains keyless and provider-neutral. Provider work lives behind `relay/worker.js` and follows: exact context manifest → classify/minimize/redact → approve → zero-dollar gate → deterministic route → bounded transport → normalize/validate → content-free receipt → editable proposal.

Eight adapters use native `fetch` or the Workers AI binding: Groq, Mistral, Gemini, Cloudflare Workers AI, Cohere, OpenRouter, SambaNova, and NVIDIA NIM. Routing filters by privacy, `allowPaid=false`, explicit `FREE_VERIFIED` eligibility, capability, context/output limits, quota, lifecycle freshness, circuit state, and usage class. Unknown price and stale policy block. Fallback is sequential, at most two hops beyond the first candidate, at most one retry for a transient failure, and never retries auth, payment, forbidden, rate-limit, or missing-model errors.

Studio contains the redacted Provider Control Center, content-free route preview, seven Public/Sanitized proposal jobs, and a nine-fixture synthetic Eval Lab. The ninth fixture is a synthetic-only optional-provider health probe; strict probe mode pins exactly one provider and cannot spill into fallback. Real proposal calls require an exact one-record manual manifest plus visible approval and, for Sanitized input, de-identification attestation. Returned structured output enters the existing Proposal Inbox with exact provider/model/alias/prompt/packet/privacy/fallback provenance. It has no mutation authority until Kevin edits/applies it; Undo preserves route identity.

Eval comparisons are synthetic-only, sequential, and capped at three providers. Device-local scorecards use a strict metadata allowlist and retain the newest 50. Recommendations require five passing samples, never auto-apply, and preserve an instant last-known-good Lab route. This Lab route does not change production routing.
