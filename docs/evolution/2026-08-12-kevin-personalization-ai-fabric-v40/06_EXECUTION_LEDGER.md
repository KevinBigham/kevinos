# KevinOS v40 Personalization + AI Provider Fabric — Execution Ledger

**Mission ID:** `kevinos-personalization-ai-fabric-v40-2026-08-12`
**Status at handoff:** READY / NOT STARTED
**Rule:** Codex must keep advancing through every unchecked safe task. A product ambiguity is resolved through the assumption protocol, not by asking Kevin.

## Status vocabulary

- `[ ]` not completed.
- `[x]` completed with evidence indexed.
- A blocked task remains unchecked until every safe local portion is completed. Then annotate `BLOCKED-EXTERNAL` with the exact missing real-world gate and continue all independent work.
- Never check a task based only on collaborator prose.

## K-1 — Preflight, stabilization, and durable mission memory

- [x] **K-1.01** — Read every governing file in the required precedence order before editing source. **Goals:** G-19
- [x] **K-1.02** — Locate the exact workspace root; record whether real Git metadata exists; never initialize Git for an archive that lacks it. **Goals:** G-19
- [x] **K-1.03** — Create a timestamped safety copy or equivalent deterministic hash/patch checkpoint before source edits. **Goals:** G-19
- [x] **K-1.04** — Record SHA-256 hashes and byte sizes for index.html, sw.js, relay/worker.js, and governing state docs. **Goals:** G-19
- [x] **K-1.05** — Run node tools/doctor.js and sh test/run.sh; preserve complete logs and exit codes. **Goals:** G-19 · **Acceptance:** AT-120
- [x] **K-1.06** — If any baseline failure appears, enter stabilization mode: reproduce, isolate, repair safely, rerun, and continue rather than ending the mission. **Goals:** G-00, G-19 · **Acceptance:** AT-120
- [x] **K-1.07** — Inventory app state arrays, portable objects, boot whitelist, constructors, selectors, renderers, modal patterns, and test harnesses relevant to v40. **Goals:** G-19
- [x] **K-1.08** — Update MISSION_STATE.json, PROGRESS.md, ASSUMPTIONS.md, and EVIDENCE_INDEX.md with the real baseline. **Goals:** G-19
- [x] **K-1.09** — Detect available browser tooling and record the exact responsive/offline verification path without adding a dependency. **Goals:** G-19 · **Acceptance:** AT-110, AT-111
- [x] **K-1.10** — Build a concise code-anchor map for every P0 defect and each planned state/UI insertion point. **Goals:** G-00, G-19

## K0 — P0 correctness and canonical task normalization

- [x] **K0.01** — Add a regression fixture that fails when opted-in People context reads notes instead of canonical note. **Goals:** G-00, G-11 · **Acceptance:** AT-001
- [x] **K0.02** — Add the paired opt-out fixture proving person note text is absent unless explicitly included. **Goals:** G-00, G-11 · **Acceptance:** AT-001
- [x] **K0.03** — Fix the canonical People AI-context field reference without widening any consent boundary. **Goals:** G-00, G-11 · **Acceptance:** AT-001
- [x] **K0.04** — Add task-person editing tests covering capture, edit, clear, change, reload, portable export/import, and link preservation. **Goals:** G-00, G-12 · **Acceptance:** AT-002
- [x] **K0.05** — Add a Person selector to the standard task editor using existing safe modal/form patterns. **Goals:** G-00, G-12 · **Acceptance:** AT-002
- [x] **K0.06** — Inventory every task creation/ingress path: manual add, Quick Capture, recurrence, import, portable apply, AI proposal/apply, demo/fixture, merge, and any special constructors. **Goals:** G-00, G-19 · **Acceptance:** AT-003
- [x] **K0.07** — Implement pure idempotent normalizeTaskRecord() with safe optional defaults and no read-time touch/u mutation. **Goals:** G-00, G-19 · **Acceptance:** AT-003
- [x] **K0.08** — Route every task ingress and constructor through normalizeTaskRecord() without changing existing valid behavior. **Goals:** G-00, G-19 · **Acceptance:** AT-003
- [x] **K0.09** — Add malformed, legacy, and repeated-normalization fixtures for task shape consistency. **Goals:** G-00, G-19 · **Acceptance:** AT-003
- [x] **K0.10** — Add a failing contract for the false Goals empty-state promise. **Goals:** G-00 · **Acceptance:** AT-004
- [x] **K0.11** — Remove the false copy immediately or make it conditional until goalId is fully implemented in K2. **Goals:** G-00 · **Acceptance:** AT-004
- [x] **K0.12** — Run focused P0 tests, the doctor, the full suite, and a browser smoke for the edited task/person flows. **Goals:** G-00, G-19 · **Acceptance:** AT-001, AT-002, AT-003, AT-004, AT-120

## K1 — Schema v40, Kevin Role Registry, privacy, and reversible migration

- [x] **K1.01** — Create representative v39 fixtures before touching production boot or schema logic. **Goals:** G-01, G-11, G-19 · **Acceptance:** AT-010
- [x] **K1.02** — Create canonical registries for roles, privacy classes, project statuses, WIP classes, commitment types, execution states, capacity modes, day modes, and reason codes. **Goals:** G-01, G-02, G-03, G-04, G-11, G-19
- [x] **K1.03** — Add roles and decisions to canonical content arrays and portfolio to portable objects, preserving all connection exclusions. **Goals:** G-01, G-13, G-19 · **Acceptance:** AT-012
- [x] **K1.04** — Implement normalizeRoleRecord() as a pure idempotent normalizer. **Goals:** G-01, G-19 · **Acceptance:** AT-011, AT-020
- [x] **K1.05** — Implement normalizeProjectRecord(), normalizeBuildRecord(), normalizeEventRecord(), normalizePersonRecord(), normalizeGoalRecord(), normalizeDecisionRecord(), normalizeBriefRecord(), and normalizePortfolio(). **Goals:** G-01, G-05, G-09, G-11, G-13, G-19 · **Acceptance:** AT-011
- [x] **K1.06** — Implement normalizeStateV40() without generating IDs during read-only normalization or weakening privacy. **Goals:** G-01, G-11, G-19 · **Acceptance:** AT-011, AT-014
- [x] **K1.07** — Update boot restore allowlists, portable export/import, snapshots, fixture factories, merge setup, and any state walkers for the new canonical state. **Goals:** G-01, G-11, G-13, G-19 · **Acceptance:** AT-012, AT-013
- [x] **K1.08** — Implement a single deterministic v39-to-v40 migration gate in memory before one persist. **Goals:** G-01, G-11, G-19 · **Acceptance:** AT-010, AT-011
- [x] **K1.09** — Before migration, compute a portable fingerprint and create a pre-v40-personalization snapshot/receipt with no content duplication. **Goals:** G-01, G-11 · **Acceptance:** AT-010
- [x] **K1.10** — Seed the eight stable Kevin roles exactly once with conservative privacy defaults and readable labels. **Goals:** G-01, G-11 · **Acceptance:** AT-020
- [x] **K1.11** — Create stable legacy role records for every unknown area encountered so no record becomes orphaned. **Goals:** G-01 · **Acceptance:** AT-010, AT-021
- [x] **K1.12** — Map only unambiguous legacy areas: Teaching, Ana, Personal, and Inbox; preserve Work and Coaching as legacy roles. **Goals:** G-01, G-11 · **Acceptance:** AT-010, AT-021
- [x] **K1.13** — Preserve the legacy area field exactly for backward compatibility and display fallback. **Goals:** G-01, G-19 · **Acceptance:** AT-010
- [x] **K1.14** — Apply conservative privacy defaults and enforce privacy monotonicity across migration/import/merge. **Goals:** G-11 · **Acceptance:** AT-014
- [x] **K1.15** — Initialize portfolio limits and compatibility WIP classes without silently changing any project status. **Goals:** G-04 · **Acceptance:** AT-040, AT-041
- [x] **K1.16** — Build a role editor/settings surface with status/order/privacy defaults/capture aliases while keeping the main navigation calm. **Goals:** G-01, G-11 · **Acceptance:** AT-020
- [x] **K1.17** — Build the legacy-role remap preview with counts, record types, titles, and privacy impact. **Goals:** G-01, G-11 · **Acceptance:** AT-022
- [x] **K1.18** — Implement remap checkpoint, explicit apply, operation receipt, and Undo restoring the before fingerprint. **Goals:** G-01, G-11 · **Acceptance:** AT-022
- [x] **K1.19** — Add boot, idempotence, portable round-trip, connection exclusion, merge, tombstone, and three-device convergence coverage for v40. **Goals:** G-01, G-11, G-19 · **Acceptance:** AT-010, AT-011, AT-012, AT-013, AT-014
- [x] **K1.20** — Bump SCHEMA_VERSION exactly once from 39 to 40 only after migration tests are green; do not perform an app/cache release bump yet. **Goals:** G-19 · **Acceptance:** AT-010, AT-120

## K2 — Typed links, Project Spine, Project Hub, and Resume Capsules

- [x] **K2.01** — Define and normalize optional roleId/projectId/goalId/person/source/privacy links without duplicating canonical records. **Goals:** G-05, G-11, G-19 · **Acceptance:** AT-050
- [x] **K2.02** — Implement task goalId and goal-link editing so the Goals promise becomes truthful. **Goals:** G-00, G-05 · **Acceptance:** AT-004
- [x] **K2.03** — Add project role, goal links, kind, WIP class, health, review date, current state, blockers, resume checklist, repo refs, last proof, and privacy fields. **Goals:** G-05, G-06, G-11 · **Acceptance:** AT-051
- [x] **K2.04** — Require every newly created Studio mission/build to link to a project or an explicit Incubator placeholder. **Goals:** G-05, G-09 · **Acceptance:** AT-052
- [x] **K2.05** — Add optional role/project links to events, briefs, notes, prompts, links, stash, goals, and people where the blueprint permits. **Goals:** G-05, G-12, G-13, G-14 · **Acceptance:** AT-050
- [x] **K2.06** — Build a pure read-time relationship index by project, role, person, and goal; never persist it. **Goals:** G-05, G-19 · **Acceptance:** AT-050
- [x] **K2.07** — Add orphan/link-integrity diagnostics that preserve data and propose repairs rather than silently relinking. **Goals:** G-05, G-11, G-19 · **Acceptance:** AT-050
- [x] **K2.08** — Create a Project Hub using views over canonical records, not a second project database. **Goals:** G-05 · **Acceptance:** AT-050
- [x] **K2.09** — Make outcome, role/privacy, status/health/review, current state, next action, open promises, and next hard stop dominant in Project Hub. **Goals:** G-05, G-06 · **Acceptance:** AT-050, AT-051
- [x] **K2.10** — Implement a durable Resume Capsule with current state, next physical action, blocker, key links, last proof, and restart checklist. **Goals:** G-06 · **Acceptance:** AT-051
- [x] **K2.11** — Show related tasks, events, people/communications, goals/evidence, Studio missions/proof, decisions, playbooks, notes, links, prompts, and repos through the relationship index. **Goals:** G-05, G-12, G-13, G-14, G-17 · **Acceptance:** AT-050
- [x] **K2.12** — Generate a compact copyable project context packet with privacy-aware field selection and provenance. **Goals:** G-05, G-06, G-11 · **Acceptance:** AT-051, AT-090
- [x] **K2.13** — Add project-link editing to relevant existing editors with progressive disclosure rather than new primary rooms. **Goals:** G-05, G-19 · **Acceptance:** AT-050
- [x] **K2.14** — Prove Project Spine and Resume Capsule persistence through reload, backup/import, merge, and convergence. **Goals:** G-05, G-06, G-19 · **Acceptance:** AT-050, AT-051, AT-052
- [x] **K2.15** — Browser-check Project Hub and Resume Capsule at phone, tablet, and desktop widths with keyboard/focus coverage. **Goals:** G-05, G-06, G-19 · **Acceptance:** AT-110

## K3 — Commitment Contract, Promise Radar, and explicit execution states

- [x] **K3.01** — Add canonical commitment type, execution status, energy, and risk-reason registries. **Goals:** G-03, G-19 · **Acceptance:** AT-032, AT-033
- [x] **K3.02** — Extend task normalization with roleId, goalId, commitmentType, executionStatus, startBy, leadDays, hardStop, waitingOn, delegatedToPersonId, reviewDate, effortMinutes, energy, sourceRef, privacyClass, and reasonNote. **Goals:** G-03, G-11, G-19 · **Acceptance:** AT-030, AT-031, AT-032
- [x] **K3.03** — Add progressive task-editor controls that keep ordinary capture fast and advanced commitment fields discoverable. **Goals:** G-03 · **Acceptance:** AT-030, AT-031
- [x] **K3.04** — Extend Quick Capture with bounded optional syntax/aliases for promise, waiting, delegation, role, project, start-by, and review without breaking existing 41-case capture behavior. **Goals:** G-03, G-19 · **Acceptance:** AT-030, AT-031, AT-120
- [x] **K3.05** — Implement a pure deterministic actionability selector for open/actionable/scheduled work and waiting/delegated review dates. **Goals:** G-03, G-19 · **Acceptance:** AT-030, AT-032
- [x] **K3.06** — Implement deterministic start-by calculation from explicit startBy or leadDays without guessing hidden urgency. **Goals:** G-03 · **Acceptance:** AT-031, AT-032
- [x] **K3.07** — Implement stable set-valued risk reasons including PROMISE_OVERDUE, PROMISE_DUE_TODAY, PROMISE_START_BY, HARD_STOP_PREP, WAITING_REVIEW, and DELEGATION_REVIEW. **Goals:** G-03, G-07 · **Acceptance:** AT-031, AT-032, AT-033
- [x] **K3.08** — Ensure waiting and delegated work stays out of actionable lists until its review date is due. **Goals:** G-03 · **Acceptance:** AT-030
- [x] **K3.09** — Create saved views for External Promises, Start-by Risk, Waiting, Delegated, Scheduled, Admin/Maintenance, Ideas, and Someday. **Goals:** G-03, G-16 · **Acceptance:** AT-030, AT-031
- [x] **K3.10** — Add visible reason chips and a plain-language Why explanation for every surfaced commitment. **Goals:** G-03, G-07 · **Acceptance:** AT-032, AT-033
- [x] **K3.11** — Represent promise owner/beneficiary/source using existing people/project/source fields where useful without creating a CRM or duplicate task system. **Goals:** G-03, G-12 · **Acceptance:** AT-030
- [x] **K3.12** — Add empty, malformed, tie, date-boundary, daylight-saving, waiting, delegation, and privacy fixtures. **Goals:** G-03, G-11, G-19 · **Acceptance:** AT-030, AT-031, AT-032
- [x] **K3.13** — Prove selectors never mutate source records and produce identical ordering/reason sets for identical input. **Goals:** G-03, G-19 · **Acceptance:** AT-032, AT-033
- [x] **K3.14** — Run full regression and responsive browser checks for capture/editor/saved views. **Goals:** G-03, G-19 · **Acceptance:** AT-110, AT-120

## K4 — Role-aware Today, day modes, capacity, and Do Next Coach

- [x] **K4.01** — Define explicit day-mode registry for School Day, BSHS Practice, BSHS Meet, BSPC Practice/Meet, Deep Build, Publishing Burst, Family/Recovery, and Travel. **Goals:** G-02
- [x] **K4.02** — Define Full, Normal, and Low/Minimum capacity behavior with configurable commitment limits. **Goals:** G-02, G-07 · **Acceptance:** AT-062
- [x] **K4.03** — Add role/mode/capacity controls to Today with optional calendar suggestions requiring confirmation. **Goals:** G-02, G-07 · **Acceptance:** AT-060, AT-061, AT-062
- [x] **K4.04** — Rebuild Today as a pure ordered selector over commitments, projects, calendar hard stops, manual focus, role/mode, and capacity. **Goals:** G-02, G-03, G-07, G-19 · **Acceptance:** AT-060, AT-061, AT-062
- [x] **K4.05** — Show exactly one visually primary action and no more than the configured commitment limit. **Goals:** G-07 · **Acceptance:** AT-060
- [x] **K4.06** — Preserve existing manual Focus Rail ranks and reason history as an explicit overlay. **Goals:** G-07, G-19 · **Acceptance:** AT-060
- [x] **K4.07** — Allow hard external promises to cross the active-role filter with a visible explanation. **Goals:** G-03, G-07 · **Acceptance:** AT-061
- [x] **K4.08** — Surface preparation before the next hard stop using HARD_STOP_PREP and start-by facts. **Goals:** G-03, G-07 · **Acceptance:** AT-060, AT-061
- [x] **K4.09** — Make Low capacity reduce the plan without mutating task/project status or shaming Kevin. **Goals:** G-02, G-07 · **Acceptance:** AT-062
- [x] **K4.10** — Add a visible hard stop and transition cue appropriate to the selected mode. **Goals:** G-02, G-07 · **Acceptance:** AT-060
- [x] **K4.11** — Create deterministic stuck reasons such as too big, unclear, blocked, low energy, missing context, or afraid of consequence. **Goals:** G-07 · **Acceptance:** AT-063
- [x] **K4.12** — Map each stuck reason to a safe proposed physical action; never auto-mutate source state. **Goals:** G-07 · **Acceptance:** AT-063
- [x] **K4.13** — Expose Why included and Why deferred explanations using stable reason codes rather than a weighted score. **Goals:** G-07 · **Acceptance:** AT-033, AT-060
- [x] **K4.14** — Verify one-hand mobile use, keyboard navigation, focus return, reduced motion, touch targets, empty states, and console cleanliness. **Goals:** G-07, G-19 · **Acceptance:** AT-110

## K5 — WIP Governor, portfolio decisions, weekly review, and restartability

- [x] **K5.01** — Normalize project status vocabulary to Active, Paused, Scheduled, Someday, Done, and Killed without data loss. **Goals:** G-04, G-05 · **Acceptance:** AT-040, AT-041
- [x] **K5.02** — Implement admitted/support/incubator WIP classes and global/per-role limits from portfolio settings. **Goals:** G-04 · **Acceptance:** AT-040
- [x] **K5.03** — Show existing over-cap state prominently without changing any project automatically. **Goals:** G-04 · **Acceptance:** AT-040, AT-041
- [x] **K5.04** — Guard new Active admission with available capacity or an explicit override reason and review date. **Goals:** G-04 · **Acceptance:** AT-042
- [x] **K5.05** — Make every override visible in Project Hub and Weekly Review and allow explicit expiry/review. **Goals:** G-04, G-08 · **Acceptance:** AT-042
- [x] **K5.06** — Implement deterministic project health/staleness selectors using current state, next action, proof, blocker, and review dates. **Goals:** G-04, G-05, G-06 · **Acceptance:** AT-071
- [x] **K5.07** — Build Weekly Portfolio Review over canonical records rather than a separate truth store. **Goals:** G-08 · **Acceptance:** AT-070
- [x] **K5.08** — Review wins/proof, external promises, waiting/delegated items, stale Active work, and unverified mission claims. **Goals:** G-08, G-17 · **Acceptance:** AT-070, AT-071
- [x] **K5.09** — Require explicit Ship, Schedule, Shelve/Pause, Kill, Admit, or Support decisions for portfolio changes. **Goals:** G-04, G-08 · **Acceptance:** AT-070
- [x] **K5.10** — Record one or two weekly outcome projects, protected family/recovery commitments, an explicit not-now list, and next review date. **Goals:** G-02, G-08 · **Acceptance:** AT-070
- [x] **K5.11** — Create review receipts and Undo/checkpoint behavior for consequential portfolio mutations. **Goals:** G-08, G-19 · **Acceptance:** AT-070
- [x] **K5.12** — Strengthen Resume Capsules from actual linked project data and prove a seven-day restart journey. **Goals:** G-06 · **Acceptance:** AT-051, AT-071
- [x] **K5.13** — Test seven Active projects with a cap of three, stale/waiting cases, overrides, and no silent mutation. **Goals:** G-04, G-08, G-19 · **Acceptance:** AT-040, AT-041, AT-042, AT-070, AT-071

## K6 — Kevin role playbooks and role-aware onboarding

- [x] **K6.01** — Reuse briefs/SOPs as the canonical playbook store with role/project/template/source/privacy fields. **Goals:** G-10, G-14
- [x] **K6.02** — Create first-party Personal Finance Teaching playbooks for lesson loop, retrieval practice, student support, parent/admin-safe communication, and grading closeout. **Goals:** G-10, G-11
- [x] **K6.03** — Create BSHS Boys Swim & Dive playbooks for eligibility/physicals, daily practice, meet-entry countdown, travel/bus, parent communication, results/posting, and season review. **Goals:** G-10, G-11 · **Acceptance:** AT-092
- [x] **K6.04** — Create BSPC playbooks for season map, group practice with exact intervals/SAY cues, meet admin, swimmer development review, family billing/communication, and staff alignment. **Goals:** G-10, G-11
- [x] **K6.05** — Create BSWildcats publishing playbooks for source verification, copy/format, links, mobile, privacy/optics, publish, and receipt. **Goals:** G-10, G-11 · **Acceptance:** AT-092
- [x] **K6.06** — Create AI & Game Studio playbooks for intake, scope, repo read-first, worktree/branch context, acceptance, one-writer lock, implementation, testing, visual proof, handoff, review, and merge authorization. **Goals:** G-09, G-10 · **Acceptance:** AT-080, AT-081
- [x] **K6.07** — Create Family and Personal/Finance playbooks that remain private, respectful, optional, and non-gamified. **Goals:** G-10, G-11
- [x] **K6.08** — Implement playbook instantiation into editable records/checklists with source provenance and no silent execution. **Goals:** G-10, G-14
- [x] **K6.09** — Add role-aware Life Sweep prompts and capture shortcuts without preloading real people or youth data. **Goals:** G-01, G-10, G-11 · **Acceptance:** AT-091
- [x] **K6.10** — Build onboarding for role confirmation, WIP/daily limits, privacy explanation, legacy remap, first Project Spine/Resume Capsule, and first Weekly Review. **Goals:** G-01, G-02, G-04, G-05, G-06, G-08, G-11
- [x] **K6.11** — Keep fresh install calm: seed reusable templates/config only, never sample PII or a fake active workload. **Goals:** G-10, G-11, G-18 · **Acceptance:** AT-091
- [x] **K6.12** — Browser-test fresh install, returning v39 user, remap deferral, onboarding resume, and mobile accessibility. **Goals:** G-10, G-19 · **Acceptance:** AT-110, AT-111

## K7 — AI Studio Command Queue and bounded multi-agent orchestration

- [x] **K7.01** — Add a local agent-profile registry/config with name, model label, strengths, weaknesses, default role, and allowed-action metadata; make no provider API assumption. **Goals:** G-09
- [x] **K7.02** — Normalize mission states: queued, ready, running, awaiting-human, awaiting-proof, blocked, review, complete, and paused. **Goals:** G-09 · **Acceptance:** AT-083
- [x] **K7.03** — Link every mission to a project or explicit Incubator placeholder. **Goals:** G-05, G-09 · **Acceptance:** AT-052
- [x] **K7.04** — Add target files, writer-lock owner, reviewer, packet version, claim summary, and last-proof metadata. **Goals:** G-09 · **Acceptance:** AT-080, AT-081, AT-082
- [x] **K7.05** — Enforce one running writer per target file and specifically one writer for index.html. **Goals:** G-09 · **Acceptance:** AT-080
- [x] **K7.06** — Provide a visible reasoned lock override path that never silently creates simultaneous writers. **Goals:** G-09 · **Acceptance:** AT-080
- [x] **K7.07** — Generate paste-ready mission packets from project context, role, scope, target files, acceptance IDs, commands, privacy manifest, risks, and stop boundaries. **Goals:** G-05, G-09, G-11 · **Acceptance:** AT-082, AT-090
- [x] **K7.08** — Version/fingerprint mission packets and mark old proof stale when scope, acceptance, commands, or selected context changes. **Goals:** G-09 · **Acceptance:** AT-082
- [x] **K7.09** — Intake handoffs as collaborator claims plus evidence references; never convert prose into local verification. **Goals:** G-09 · **Acceptance:** AT-081
- [x] **K7.10** — Preserve and integrate the existing Mission Proof Bundle truth vocabulary and reasoned override behavior. **Goals:** G-09 · **Acceptance:** AT-081, AT-082
- [x] **K7.11** — Add reviewer assignment, side-by-side claim/evidence comparison, and explicit approve/request-rework decisions. **Goals:** G-09 · **Acceptance:** AT-081
- [x] **K7.12** — Serialize pause/resume state and a compact bounded mission event history. **Goals:** G-09 · **Acceptance:** AT-083
- [x] **K7.13** — Show queued/ready/blocked work using dependency-aware views inspired by Beads without installing a second database. **Goals:** G-09, G-19 · **Acceptance:** AT-083
- [x] **K7.14** — Keep browser Studio non-autonomous: it may generate packets and track state, but may not launch terminals, agents, worktrees, pushes, deploys, or provider actions. **Goals:** G-09, G-11 · **Acceptance:** AT-081
- [x] **K7.15** — Test writer collisions, stale packets, reported-vs-local proof, pause/resume, malformed legacy missions, and mobile review flows. **Goals:** G-09, G-19 · **Acceptance:** AT-080, AT-081, AT-082, AT-083, AT-110


## K7A — Provider-neutral free AI fabric, policy firewall, and continuous improvement

- [x] **K7A.01** — Re-verify official provider docs/model catalogs/limits at implementation time; record dated assumptions without hard-coding stale free claims. **Goals:** G-20, G-21, G-23 · **Acceptance:** AT-141, AT-142, AT-143, AT-144, AT-145, AT-146, AT-147, AT-148, AT-155
- [x] **K7A.02** — Define a dependency-free server-side provider adapter contract and normalized request/response/error/usage envelopes. **Goals:** G-20, G-19 · **Acceptance:** AT-130, AT-137
- [x] **K7A.03** — Define stable capability-lane aliases separate from exact model IDs. **Goals:** G-20, G-23 · **Acceptance:** AT-134, AT-155
- [x] **K7A.04** — Implement provider/model descriptors with usage class, lifecycle, capabilities, free eligibility, privacy eligibility, and last verification. **Goals:** G-20, G-23 · **Acceptance:** AT-134, AT-155
- [x] **K7A.05** — Implement the outbound privacy classifier/firewall and prove restricted packets fail before transport. **Goals:** G-11, G-22 · **Acceptance:** AT-132
- [x] **K7A.06** — Extend the AI manifest with exact records/fields, privacy class, redactions, provider usage class, and packet fingerprint. **Goals:** G-11, G-22, G-24 · **Acceptance:** AT-090, AT-091, AT-092, AT-132
- [x] **K7A.07** — Implement hard zero-dollar policy with `allowPaid=false`, `FREE_VERIFIED`, unknown-price blocking, and no credit/billing action. **Goals:** G-21 · **Acceptance:** AT-133
- [x] **K7A.08** — Implement content-free quota windows, conservative app ceilings, and provider rate-header normalization. **Goals:** G-21, G-28 · **Acceptance:** AT-136, AT-152
- [x] **K7A.09** — Implement deterministic compatible route selection with visible include/exclude reasons. **Goals:** G-21, G-23 · **Acceptance:** AT-134
- [x] **K7A.10** — Implement bounded fallback, timeout, retry, and provider/model circuit breaker behavior. **Goals:** G-21, G-28 · **Acceptance:** AT-135, AT-136
- [x] **K7A.11** — Implement Gemini adapter/catalog handling with free-eligibility gate and free-tier data-use warning. **Goals:** G-20, G-21, G-22, G-23 · **Acceptance:** AT-130, AT-141
- [x] **K7A.12** — Implement Groq adapter for current GPT-OSS/Qwen worker aliases, rate headers, and ZDR activation requirement. **Goals:** G-20, G-21, G-23 · **Acceptance:** AT-130, AT-142
- [x] **K7A.13** — Implement Mistral adapter with Free Mode status, live model discovery, key expiry, and current Medium/Small/code-capable aliases. **Goals:** G-20, G-21, G-23 · **Acceptance:** AT-130, AT-143
- [x] **K7A.14** — Implement Cloudflare Workers AI adapter/binding and conservative Neuron budget without enabling paid overage. **Goals:** G-20, G-21, G-28 · **Acceptance:** AT-130, AT-144
- [x] **K7A.15** — Implement Cohere adapter as `EVALUATION_ONLY`, including chat/code/embed/rerank capability metadata where supported. **Goals:** G-20, G-23 · **Acceptance:** AT-130, AT-145
- [x] **K7A.16** — Implement OpenRouter free adapter as `EMERGENCY_ONLY`, recording the actual selected model and fixed low daily ceiling. **Goals:** G-20, G-21, G-23 · **Acceptance:** AT-130, AT-146
- [x] **K7A.17** — Implement SambaNova adapter as `LAB_ONLY` with current live RPD/TPD and preview lifecycle handling. **Goals:** G-20, G-23 · **Acceptance:** AT-130, AT-147
- [x] **K7A.18** — Implement NVIDIA NIM adapter as `PROTOTYPE_ONLY` for synthetic/public LLM/retrieval/rerank tests. **Goals:** G-20, G-23 · **Acceptance:** AT-130, AT-148
- [x] **K7A.19** — Add credentialless catalog/transport fixtures for success, 401/403/404/408/429/5xx, malformed data, stream interruption, and model retirement. **Goals:** G-20, G-28 · **Acceptance:** AT-130, AT-138
- [x] **K7A.20** — Add tests proving no browser/direct-provider key path exists and provider secrets are excluded from all state/portable/sync surfaces. **Goals:** G-22, G-29 · **Acceptance:** AT-131, AT-157
- [x] **K7A.21** — Add structured-output validation, forbidden-field checks, output bounds, and prompt-injection-safe failure behavior. **Goals:** G-22, G-24 · **Acceptance:** AT-151
- [x] **K7A.22** — Add normalized proposal provenance and ensure provider/model/fallback/prompt/packet identity survives edit/apply/reject/Undo. **Goals:** G-24 · **Acceptance:** AT-137, AT-149
- [x] **K7A.23** — Implement credential-absence, quota-exhaustion, offline, timeout, and all-providers-disabled calm fallbacks. **Goals:** G-28 · **Acceptance:** AT-138, AT-139
- [x] **K7A.24** — Build the AI Provider Control Center inside Settings/Studio, not as a new top-level room. **Goals:** G-26 · **Acceptance:** AT-140
- [x] **K7A.25** — Show provider status, usage class, route aliases, exact models, free status, quotas, circuit state, lifecycle, data policy, and synthetic health without key values. **Goals:** G-23, G-26, G-29 · **Acceptance:** AT-140, AT-155, AT-157
- [x] **K7A.26** — Add a route-preview interaction explaining why each provider/model is eligible or blocked for a selected feature/privacy class. **Goals:** G-21, G-26 · **Acceptance:** AT-134, AT-140
- [x] **K7A.27** — Implement proposal-only public/sanitized commitment/task extraction through the provider fabric. **Goals:** G-03, G-24 · **Acceptance:** AT-149, AT-150
- [x] **K7A.28** — Implement Resume Capsule drafting from explicitly approved Project Spine evidence. **Goals:** G-05, G-06, G-24 · **Acceptance:** AT-051, AT-149, AT-150
- [x] **K7A.29** — Implement Weekly Review synthesis and missing-next-action challenge without changing deterministic portfolio decisions. **Goals:** G-08, G-24 · **Acceptance:** AT-070, AT-071, AT-149, AT-150
- [x] **K7A.30** — Implement role/project/capability suggestions for capture while preserving one-tap manual capture. **Goals:** G-01, G-03, G-24 · **Acceptance:** AT-149, AT-150
- [x] **K7A.31** — Implement playbook/checklist drafting with source/provenance and explicit apply. **Goals:** G-10, G-24 · **Acceptance:** AT-149, AT-150
- [x] **K7A.32** — Implement public-copy and safe multimodal proposal paths with redaction/public-output validation. **Goals:** G-11, G-24 · **Acceptance:** AT-092, AT-132, AT-149, AT-150
- [x] **K7A.33** — Implement Studio code/architecture second-opinion lane that never converts model prose to proof. **Goals:** G-09, G-24 · **Acceptance:** AT-081, AT-149, AT-150
- [x] **K7A.34** — Define a versioned prompt registry with capability/privacy/schema/bounds metadata. **Goals:** G-23, G-25 · **Acceptance:** AT-137, AT-153
- [x] **K7A.35** — Create synthetic Kevin-shaped golden fixtures for teaching, swim, public publishing, commitments, capsules, code review, redaction, and structured recovery. **Goals:** G-25 · **Acceptance:** AT-153
- [x] **K7A.36** — Implement deterministic eval validators and content-free scorecards for schema, privacy, expected fields, latency, quota, errors, and fallback. **Goals:** G-25 · **Acceptance:** AT-152, AT-153
- [x] **K7A.37** — Add optional synthetic cross-model comparison that never fans out real Kevin data. **Goals:** G-25 · **Acceptance:** AT-132, AT-153
- [x] **K7A.38** — Make every Lab recommendation require Kevin approval and preserve an instant last-known-good route rollback. **Goals:** G-25 · **Acceptance:** AT-154
- [x] **K7A.39** — Add model lifecycle/deprecation/free-status refresh and visible stale-route handling. **Goals:** G-23 · **Acceptance:** AT-155
- [x] **K7A.40** — Bound and prune local AI usage/eval receipts without storing prompt/response content. **Goals:** G-18, G-25 · **Acceptance:** AT-152
- [x] **K7A.41** — Add representative-scale performance tests for routing/control-center/eval selectors. **Goals:** G-19, G-28 · **Acceptance:** AT-112, AT-139
- [x] **K7A.42** — Browser-check Control Center and AI proposal journeys at required widths, keyboard, touch, reduced-motion, offline, and reload states. **Goals:** G-19, G-26, G-28 · **Acceptance:** AT-110, AT-111, AT-139, AT-140
- [x] **K7A.43** — Update relay route matrix, architecture, state contract, setup docs, and privacy/security docs to implemented truth. **Goals:** G-19, G-20, G-22, G-29
- [x] **K7A.44** — Run focused provider/privacy/router/eval tests, doctor, full suite, and wave gates with no credentials/network. **Goals:** G-19, G-20 · **Acceptance:** AT-120, AT-130 through AT-155
- [x] **K7A.45** — Record exact evidence and leave all providers disabled/key-missing; do not ask Kevin for keys yet. **Goals:** G-27 · **Acceptance:** AT-156

## K8 — Decisions, relationships, knowledge activation, search, admin radar, evidence, and pruning

- [x] **K8.01** — Implement the Decision & Assumption Ledger with question, options/tradeoffs, choice, why, assumptions, reversibility, revisit date, role/project/source/privacy, and timestamps. **Goals:** G-13
- [x] **K8.02** — Surface due decision revisits in Project Hub and Weekly Review without duplicating notes. **Goals:** G-13 · **Acceptance:** AT-071
- [x] **K8.03** — Create communication commitments linked to person, project, event, source, owner, state, and review date; keep sends explicit. **Goals:** G-12
- [x] **K8.04** — Join People, Email source metadata, Calendar events, and promises through links/views rather than copying message or person data. **Goals:** G-12, G-11
- [x] **K8.05** — Add provenance-preserving Promote to Playbook, Instantiate Checklist, Record Decision, and Attach to Project actions for knowledge records. **Goals:** G-14
- [x] **K8.06** — Require confirmation and privacy review before every knowledge-to-action conversion. **Goals:** G-11, G-14
- [x] **K8.07** — Build local deterministic typed search across tasks, projects, people, goals, decisions, briefs, notes, prompts, links, and stash. **Goals:** G-15 · **Acceptance:** AT-100
- [x] **K8.08** — Support filters by type, role, project, person, status, and source with keyboard and mobile navigation. **Goals:** G-15 · **Acceptance:** AT-100
- [x] **K8.09** — Add safe command actions from search results using existing approval/edit boundaries. **Goals:** G-15 · **Acceptance:** AT-100
- [x] **K8.10** — Build Admin & Money Radar as a saved view over typed commitments/events/spend metadata for forms, physicals, certifications, fees, budgets, subscriptions, entries, and publishing deadlines. **Goals:** G-16
- [x] **K8.11** — Keep Admin & Money Radar out of accounting, brokerage, LMS, roster-database, or student-record territory. **Goals:** G-16, G-11
- [x] **K8.12** — Create a factual evidence/wins timeline linked to project, goal, role, source, and proof without points, streak pressure, or engagement scoring. **Goals:** G-17
- [x] **K8.13** — Add KevinOS Lab Budget metadata for friction evidence, success test, owner, adoption check, sunset/revert plan, and review date. **Goals:** G-18
- [x] **K8.14** — Add bounded local content-free counters for orientation, restart completion, open promises, over-cap days, waiting-review overdue, weekly review completion, and feature friction/sunset signals. **Goals:** G-18
- [x] **K8.15** — Create one canonical docs index and a non-destructive historical archive policy; do not delete evidence. **Goals:** G-18, G-19
- [x] **K8.16** — Converge record registries, labels/options, normalizers, pure selectors, relationship indexes, and fixture factories inside the single file. **Goals:** G-19
- [x] **K8.17** — Add an optional no-dependency Chromium smoke path when an existing browser executable/tool is available; keep Node tests authoritative. **Goals:** G-19 · **Acceptance:** AT-110
- [x] **K8.18** — Add privacy, XSS, round-trip, search ordering, and malformed-input tests for every new supporting feature. **Goals:** G-11, G-19 · **Acceptance:** AT-090, AT-091, AT-092, AT-100, AT-120

## K9 — Credentialless whole-system hardening and preactivation release candidate

- [x] **K9.01** — Run every focused suite and resolve every regression rather than weakening an invariant. **Goals:** G-19 · **Acceptance:** AT-120
- [x] **K9.02** — Run node tools/doctor.js and sh test/run.sh until both pass in the final workspace. **Goals:** G-19 · **Acceptance:** AT-120
- [x] **K9.03** — Prove v39-to-v40 migration, idempotence, backup/import, connection exclusion, tombstones, merge, and three-device convergence. **Goals:** G-01, G-11, G-19 · **Acceptance:** AT-010, AT-011, AT-012, AT-013, AT-014
- [x] **K9.04** — Prove every privacy class, AI manifest, youth-sensitive exclusion, person-note opt-in, public-output redaction, and monotonic merge/import rule. **Goals:** G-11 · **Acceptance:** AT-001, AT-014, AT-090, AT-091, AT-092
- [x] **K9.05** — Run critical journeys at 320, 390, 430, 768, and 1440 widths with zero same-page horizontal overflow and zero console errors. **Goals:** G-19 · **Acceptance:** AT-110
- [x] **K9.06** — Verify keyboard navigation, focus return, modal Escape/cancel, labels, error summaries, reduced motion, contrast, coarse-pointer targets, and screen-reader semantics. **Goals:** G-19 · **Acceptance:** AT-110
- [x] **K9.07** — Verify offline first load where supported, hard reload, installed/service-worker cache behavior, and critical role/Today/project/review journeys after reload. **Goals:** G-19 · **Acceptance:** AT-111
- [x] **K9.08** — Run representative scale fixtures with 1,000 tasks, 500 notes, 200 friction marks, and added relationships; record interaction/load observations. **Goals:** G-19 · **Acceptance:** AT-112
- [x] **K9.09** — Inspect index.html size, selector hot paths, relationship-index rebuilds, and rendering costs; optimize only demonstrated regressions. **Goals:** G-18, G-19 · **Acceptance:** AT-112
- [x] **K9.10** — Run hostile-content/XSS coverage across every new render surface and search result. **Goals:** G-11, G-19 · **Acceptance:** AT-092, AT-100, AT-120
- [x] **K9.11** — Update docs/CURRENT_STATE.md, docs/STATE_CONTRACT.md, docs/ARCHITECTURE.md, docs/ROOM_MAP.md, docs/DECISIONS.md, README.md, GETTING_STARTED.md, and the canonical docs index to the implemented truth. **Goals:** G-19
- [x] **K9.12** — Update PROGRESS.md, EXECUTION_LEDGER.md, MISSION_STATE.json, ASSUMPTIONS.md, DECISIONS.md, and EVIDENCE_INDEX.md so a cold reviewer can reconstruct the marathon. **Goals:** G-19
- [x] **K9.13** — Map every credentialless acceptance ID to PASS evidence, or to a narrowly justified external/manual blocker after every independent implementation step is complete; leave only AT-141–AT-148 and AT-156–AT-161 pending for K10 live/account activation where required. **Goals:** G-19 · **Acceptance:** AT-120
- [x] **K9.14** — Perform one final app release bump and matching service-worker cache bump only after the entire release candidate is green. **Goals:** G-19 · **Acceptance:** AT-120
- [x] **K9.15** — Do not request/access/mutate secrets, call live providers, deploy, push, merge, publish, or perform any outward/destructive action before preactivation passes. **Goals:** G-09, G-11, G-19
- [x] **K9.16** — Create final screenshots, logs, fingerprints, performance notes, patch/diff, file hashes, and rollback instructions. **Goals:** G-19 · **Acceptance:** AT-110, AT-111, AT-112, AT-120
- [x] **K9.17** — Prepare the credentialless draft of FINAL_KEVINOS_V40_HANDOFF.md with exact changes, acceptance map, commands/results, migration/recovery proof, privacy/security proof, browser/a11y/performance proof, and the remaining credential ceremony. **Goals:** G-19 · **Acceptance:** AT-120
- [x] **K9.18** — Run tools/check-evolution-state.js --mode preactivation and tools/run-evolution-gates.sh preactivation; keep fixing until both pass before requesting any key. **Goals:** G-19 · **Acceptance:** AT-120
- [x] **K9.19** — Review the whole diff for accidental complexity, duplicate truth stores, hidden scores, privacy widening, dead code, false copy, and unreachable controls. **Goals:** G-18, G-19
- [x] **K9.20** — Declare PREACTIVATION READY only when every K-1 through K9 safe task is complete, every credentialless acceptance result is mapped, the credentialless handoff is honest/reproducible, and no credential has been requested. **Goals:** G-19 · **Acceptance:** AT-120


## K10 — Credentials-last secure activation and live synthetic verification

- [x] **K10.01** — Confirm every K-1 through K9 task is complete and both preactivation gates pass. **Goals:** G-27 · **Acceptance:** AT-156
- [x] **K10.02** — Run a full secret-value scan across source, docs, logs, output, patches, screenshots, portable fixtures, and sync fixtures; preserve only a redacted receipt. **Goals:** G-29 · **Acceptance:** AT-157
- [x] **K10.03** — Finalize official signup/key links, current provider caveats, core/optional classification, and zero-dollar activation checklist. **Goals:** G-20, G-21, G-27
- [x] **K10.04** — Build and test `tools/credential-ceremony.sh` (or equivalent) using silent interactive input, ignored local storage, restrictive permissions, skip/rotate support, and no CLI key arguments. **Goals:** G-27, G-29 · **Acceptance:** AT-157, AT-159
- [x] **K10.05** — Build and test a redacted presence/health verifier that never reads secrets into output or dumps environment/files. **Goals:** G-27, G-29 · **Acceptance:** AT-157, AT-158
- [x] **K10.06** — Ask Kevin exactly once to create the desired provider accounts/keys and run the silent script; explicitly tell him not to paste keys into chat. **Goals:** G-27 · **Acceptance:** AT-156, AT-157
- [ ] **K10.07** — Activate/verify Groq locally with one synthetic structured probe and record exact model/rate headers without content. **Goals:** G-20, G-21, G-27 · **Acceptance:** AT-142, AT-158
- [ ] **K10.08** — Require Kevin to confirm Groq ZDR is enabled before the route becomes `VERIFIED_FREE_ACTIVE`. **Goals:** G-22, G-27 · **Acceptance:** AT-142
- [ ] **K10.09** — Activate/verify Mistral Free Mode locally; discover current models/limits and record no fixed-dollar assumption. **Goals:** G-20, G-21, G-27 · **Acceptance:** AT-143, AT-158
- [ ] **K10.10** — Activate/verify Gemini locally only when a current model's free eligibility is confirmed; otherwise leave Gemini blocked/disabled and preserve fallback. **Goals:** G-20, G-21, G-22, G-27 · **Acceptance:** AT-141, AT-158
- [ ] **K10.11** — Display/record Kevin's acknowledgement of Gemini free-tier data-use limits before activation. **Goals:** G-22, G-27 · **Acceptance:** AT-141
- [ ] **K10.12** — Verify the Cloudflare Workers AI binding path and conservative Neuron ceiling with a synthetic probe only when account/binding access is available and explicitly authorized. **Goals:** G-20, G-21, G-27 · **Acceptance:** AT-144, AT-158, AT-161
- [ ] **K10.13** — Offer/activate Cohere only as an optional evaluation lane; missing key remains honest and non-blocking. **Goals:** G-20, G-27 · **Acceptance:** AT-145, AT-158, AT-160
- [ ] **K10.14** — Offer/activate OpenRouter only as an optional emergency free lane with current low ceiling. **Goals:** G-20, G-21, G-27 · **Acceptance:** AT-146, AT-158, AT-160
- [ ] **K10.15** — Offer/activate SambaNova only as an optional lab lane with live quota. **Goals:** G-20, G-27 · **Acceptance:** AT-147, AT-158, AT-160
- [ ] **K10.16** — Offer/activate NVIDIA NIM only as an optional prototype lane. **Goals:** G-20, G-27 · **Acceptance:** AT-148, AT-158, AT-160
- [ ] **K10.17** — For every configured provider, run at most one bounded synthetic initial probe and discard response content after validation. **Goals:** G-27, G-29 · **Acceptance:** AT-158
- [ ] **K10.18** — Re-run negative privacy fixtures with live provider transports instrumented and prove denied packets make zero outbound calls. **Goals:** G-22 · **Acceptance:** AT-132
- [ ] **K10.19** — Re-prove `allowPaid=false`, free eligibility, quota ceilings, and no paid fallback after live account discovery. **Goals:** G-21 · **Acceptance:** AT-133, AT-141, AT-143, AT-144
- [ ] **K10.20** — Record redacted provider statuses: verified active, configured disabled, optional missing, account/region blocked, free-eligibility blocked, or revoked. **Goals:** G-26, G-27 · **Acceptance:** AT-140, AT-160
- [x] **K10.21** — Do not run `wrangler secret put`, deploy, or mutate remote secrets without a separate just-in-time Kevin authorization; prepare instructions/rollback instead. **Goals:** G-27, G-29 · **Acceptance:** AT-161
- [x] **K10.22** — Test key rotation/replacement/revocation flow using dummy fixtures and document live manual steps. **Goals:** G-29 · **Acceptance:** AT-159
- [x] **K10.23** — Rerun secret scans and verify no secret entered state/export/sync/logs/patches/screenshots/hashes. **Goals:** G-29 · **Acceptance:** AT-157
- [ ] **K10.24** — Run focused live-activation tests, doctor, full suite, final browser/offline smoke, and final mission gates. **Goals:** G-19, G-27 · **Acceptance:** AT-120, AT-158
- [ ] **K10.25** — Complete FINAL_KEVINOS_V40_HANDOFF.md with provider activation status, exact redacted evidence, remote actions not performed, rotation path, and Kevin's next physical action. **Goals:** G-19, G-27, G-29

## Final exhaustion test

- [ ] Every safe task above is checked.
- [x] Every acceptance ID in `05_ACCEPTANCE_TEST_MATRIX.md` has current local evidence or a narrowly documented external/manual blocker.
- [x] `node tools/check-evolution-state.js --mode preactivation` passed before credentials were requested.
- [x] `node tools/check-evolution-state.js --mode preactivation` passed before credentials were requested.
- [x] `node tools/check-evolution-state.js --mode preactivation` passed before credentials were requested.
- [ ] `node tools/check-evolution-state.js --mode final` passes.
- [x] `sh tools/run-evolution-gates.sh preactivation` passed before credentials were requested.
- [x] `sh tools/run-evolution-gates.sh preactivation` passed before credentials were requested.
- [x] `sh tools/run-evolution-gates.sh preactivation` passed before credentials were requested.
- [ ] `sh tools/run-evolution-gates.sh final` passes.
- [x] `FINAL_KEVINOS_V40_HANDOFF.md` exists and names the exact next physical action for Kevin.
