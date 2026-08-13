# KevinOS Personalization + AI Provider Fabric Acceptance Test Matrix

**Date:** 2026-08-12

| ID | Area | Contract | Executable acceptance |
| --- | --- | --- | --- |
| AT-001 | P0 | People AI sharing | Opt in to person notes; generated context contains canonical `note`. Opt out; no note text appears. |
| AT-002 | P0 | Task person editing | Capture with `+person`, edit Person in UI, clear/change it, reload, export/import, and preserve link. |
| AT-003 | P0 | Task normalization | Every constructor and malformed fixture produces the same complete safe optional shape. |
| AT-004 | P0 | Goal copy/link truth | No UI claims task-goal linking unless task `goalId` is implemented and editable. |
| AT-010 | State | v39 migration | Representative v39 fixture migrates once to v40 with no record loss and stable legacy areas. |
| AT-011 | State | Idempotence | Running normalization/migration again yields identical portable fingerprint. |
| AT-012 | State | Backup/import | v40 roles/decisions/portfolio and optional links round-trip; connections remain device-local. |
| AT-013 | State | Merge/convergence | Three-device fixtures with role/project/decision edits converge under current contract. |
| AT-014 | State | Privacy monotonicity | Import/merge/migration never changes a record to a less restrictive privacy class. |
| AT-020 | Roles | Seed registry | Stable Kevin roles exist once, with no duplicates across repeated boots/imports. |
| AT-021 | Roles | Legacy preservation | Coaching and Work remain legacy until explicit remap. |
| AT-022 | Roles | Remap preview/undo | Counts and titles match preview; apply creates receipt; Undo restores before fingerprint. |
| AT-030 | Commitments | Waiting/delegated readiness | Waiting/delegated items are excluded from actionable view until review date. |
| AT-031 | Commitments | Start-by risk | A future due date with elapsed start-by shows `PROMISE_START_BY`. |
| AT-032 | Commitments | Reason determinism | Fixed fixtures produce identical ordered actions and stable reason sets. |
| AT-033 | Commitments | No hidden score | UI and selectors expose reason codes; no weighted universal urgency value controls order. |
| AT-040 | WIP | Cap visibility | Seven Active projects with cap three shows over-cap and requires explicit portfolio decisions. |
| AT-041 | WIP | No silent status mutation | Changing cap never auto-pauses or archives projects. |
| AT-042 | WIP | Override | Over-cap admission requires reason and review date; visible in review. |
| AT-050 | Project Spine | Relationship index | Project Hub shows linked records across every supported type without duplicating canonical data. |
| AT-051 | Project Spine | Resume capsule | Project current state, next action, blocker, links, last proof, and restart checklist survive reload/export/import. |
| AT-052 | Project Spine | Studio link | Every newly created mission requires/links a project or an explicit Incubator placeholder. |
| AT-060 | Today | Primary action | Representative Kevin day shows one primary and at most configured commitments. |
| AT-061 | Today | Hard promise crosses role | A hard external promise remains visible even when another role is active, with explanation. |
| AT-062 | Today | Low capacity | Low mode reduces commitments without changing source task/project state. |
| AT-063 | Today | Stuck coach | Each stuck reason returns a deterministic safe action and never auto-mutates. |
| AT-070 | Review | Portfolio output | Review records one/two weekly outcomes, project decisions, protected commitments, and next review. |
| AT-071 | Review | Stale/waiting review | Stale Active, overdue waiting review, and unverified mission claims are visible. |
| AT-080 | AI Studio | One writer | Two running missions cannot claim `index.html`; second is blocked until lock release/override. |
| AT-081 | AI Studio | Proof truth | Reported pass remains unverified; shipped requires current local proof or visible override. |
| AT-082 | AI Studio | Packet fingerprint | Changing scope/acceptance/commands increments packet identity and marks old proof stale. |
| AT-083 | AI Studio | Pause/resume | Mission can pause awaiting human/proof and resume from serialized state. |
| AT-090 | Privacy | AI manifest | Before send, UI lists exact fields, redactions, privacy classes, and size bounds. |
| AT-091 | Privacy | Youth-sensitive default | Youth-sensitive records are excluded unless explicitly selected; person notes remain separately opt-in. |
| AT-092 | Privacy | Public output check | BSWildcats/public copy excludes private/youth-sensitive fields. |
| AT-100 | Search | Typed local results | Query returns task/project/person/goal/decision/brief results with type/role/project, keyboard/mobile accessible. |
| AT-110 | Browser | Responsive receipts | 320, 390, 430, 768, and 1440 widths show no horizontal overflow or console errors on critical journeys. |
| AT-111 | Browser | Offline/reload | Critical role/Today/project/review journeys remain usable offline and after reload. |
| AT-112 | Performance | Representative scale | 1,000 tasks + 500 notes + 200 friction marks + added relationships remain within existing calm interaction budget. |
| AT-120 | Regression | Complete suite | `node tools/doctor.js` and `sh test/run.sh` remain green. |
| AT-130 | AI Fabric | Adapter contract | Every provider adapter passes the same credentialless success/error/usage normalization contract. |
| AT-131 | Secrets | Browser key absence | No provider key name/value or direct provider authorization logic is present in browser request payloads, portable state, sync, or export. |
| AT-132 | Privacy | Pre-transport denial | Youth-sensitive, financial-sensitive, secret, and unapproved work-internal fixtures are rejected before provider transport is called. |
| AT-133 | Budget | Hard zero-dollar gate | `allowPaid=false`; unknown/non-free price status blocks; no route can purchase credits, enable billing, or spill into paid use. |
| AT-134 | Routing | Deterministic capability routing | Fixed health/quota/privacy/capability fixtures produce the same ordered eligible routes and visible reasons. |
| AT-135 | Routing | Compatible fallback | Fallback never crosses price, privacy, usage-class, context, or capability boundaries. |
| AT-136 | Resilience | Quota/circuit breaker | 429/retry-after/quota fixtures open and recover circuits without retry storms or parallel fan-out. |
| AT-137 | Provenance | Exact route receipt | Every AI proposal records provider, exact model, alias, prompt version, packet fingerprint, fallback chain, privacy, and timestamp. |
| AT-138 | Testing | Credentialless completeness | Full provider/router/UI test suite runs with no keys and no outbound network. |
| AT-139 | Offline | No-provider usefulness | Capture, Today, Project Hub, review, search, backup, and recovery remain usable with all providers disabled/offline. |
| AT-140 | UI | Provider Control Center | Settings/Studio shows status, policy, model aliases, quota, lifecycle, and health without accepting/storing/showing secret values in app state. |
| AT-141 | Gemini | Free eligibility/data warning | Preferred Gemini route is used only after current free eligibility is confirmed; free-tier data-use warning is visible; otherwise route is blocked/falls back. |
| AT-142 | Groq | Fast worker/ZDR | GPT-OSS/Qwen aliases, current rate headers, bounded quotas, and a ZDR-confirmation requirement are implemented. |
| AT-143 | Mistral | Free Mode/model discovery | Free Mode is recorded from live account state; current Medium/Small/code-capable models are discovered; no fixed `$10` assumption exists. |
| AT-144 | Workers AI | Binding/Neuron budget | `env.AI` binding path works; app ceiling remains below free allocation; unknown/over-budget routes fail closed. |
| AT-145 | Cohere | Evaluation-only lane | Trial/evaluation routes accept only synthetic/public fixtures and cannot become automatic production fallback. |
| AT-146 | OpenRouter | Emergency free lane | Free router is manual/emergency, captures actual selected model, respects the smaller of the 40-request app ceiling or current live account limit, and has no retry storm. |
| AT-147 | SambaNova | Lab daily ceiling | Free-tier route respects current live RPD/TPD and keeps preview models temporary. |
| AT-148 | NVIDIA | Prototype-only lane | NIM routes are limited to synthetic/public prototyping and remain disabled for production use. |
| AT-149 | AI Features | Proposal-only application | AI-generated commitments, capsules, reviews, playbooks, and classifications remain editable proposals until Kevin applies them. |
| AT-150 | AI Features | Kevin-shaped journeys | Synthetic capture → commitment, Project Spine → capsule, Weekly Review, public copy, and Studio second-opinion journeys pass end to end. |
| AT-151 | Validation | Structured/output safety | Malformed JSON, wrong schema, prompt-injection text, forbidden fields, and overlong output fail safely without mutation. |
| AT-152 | Privacy | Content-free usage receipts | Usage/health receipts contain provider/model/tokens/latency/status only; no prompt, response, person note, or source-record content. |
| AT-153 | AI Lab | Golden fixture evaluation | Synthetic Kevin-shaped fixtures evaluate schema, privacy, business rules, latency, quota, and fallback with reproducible reports. |
| AT-154 | AI Lab | Human-approved improvement | Lab can recommend but cannot automatically change active prompt/model/route; rollback to last known good is immediate. |
| AT-155 | Lifecycle | Model churn | Deprecated/missing/non-free models are disabled with visible replacement guidance; stable aliases preserve app behavior. |
| AT-156 | Activation | Credentials requested last | Codex cannot request credentials until every K-1–K9 task and preactivation gate is complete. |
| AT-157 | Secrets | Silent ceremony/no leakage | Kevin enters keys through silent ignored local secret handling; no key value appears in chat, source, logs, patches, screenshots, hashes, output, export, or sync. |
| AT-158 | Activation | Minimal synthetic live probes | Each configured provider receives one bounded synthetic probe; only redacted status/model/usage/quota evidence is retained. |
| AT-159 | Secrets | Rotation/revoke | Replacement verification, old-key revocation, incident response, and secret-file cleanup are documented and testable without exposing values. |
| AT-160 | Activation | Optional-provider honesty | Missing optional providers remain explicitly disabled and do not block core/local completion or masquerade as verified. |
| AT-161 | Remote safety | No implicit deploy | Local credential activation does not run `wrangler secret put`, deploy, or mutate remote secrets without a separate just-in-time Kevin authorization. |


## Required proof bundle per wave

- exact files changed;
- focused tests added and their pre-change failure/post-change pass where practical;
- exact commands and exit codes;
- full-suite result;
- portable before/after fingerprints for state work;
- desktop/mobile screenshot paths for UI work;
- console error count;
- performance observation for changed critical path;
- unresolved risks, assumptions, and deferred items;
- next resumable action.

## Release proof

The final release report must map every acceptance ID to one of:

- PASS — local proof attached;
- WAIVED — reason, consequence, and Kevin authorization attached;
- BLOCKED-EXTERNAL — exact external gate and safe handoff attached.

No `reported`, `looks good`, or collaborator prose may be converted to PASS.
