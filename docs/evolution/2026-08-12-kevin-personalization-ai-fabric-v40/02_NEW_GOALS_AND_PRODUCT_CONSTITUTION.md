# KevinOS New Goals and Product Constitution — Personalization + AI Provider Fabric

**Date:** 2026-08-12
**Purpose:** convert the personalization and free-provider audits into one decisive product-goal contract for implementation.

## North star

> **What deserves Kevin’s attention right now, why does it deserve that attention, and what is the next physical action?**

## Product promise

KevinOS is the trusted orchestration layer across Kevin’s teaching, coaching, publishing, studio, family, and personal-finance responsibilities. It protects promises, limits work in progress, preserves restart context, and makes AI collaborators useful without giving them silent authority.

## Goal hierarchy

| ID | Priority | Goal | Objective | Definition of done |
| --- | --- | --- | --- | --- |
| G-00 | P0 | Correctness before intelligence | Repair person-note AI sharing, goal-link false copy, task-person editing, and task normalization. | Every supported creation/edit/import path emits normalized records; regression tests fail on old bugs. |
| G-01 | P1 | Kevin Role Registry | Represent Kevin’s actual responsibilities with stable IDs, privacy defaults, playbooks, filters, and legacy mappings. | Role records round-trip through boot/backup/import/merge; legacy areas are preserved; remap is previewed and undoable. |
| G-02 | P1 | Seasonal Modes and Capacity | Let Kevin choose the kind of day and honest capacity before Today proposes a plan. | Mode/capacity are explicit, local, deterministic, optional, and never inferred from surveillance. |
| G-03 | P1 | Commitment Contract and Promise Radar | Distinguish external promises, scheduled commitments, project actions, maintenance, and ideas; add actionable/waiting/delegated/scheduled states and start-by risk. | Every surfaced risk has a stable reason code; waiting work stays out of actionable lists until review. |
| G-04 | P1 | WIP Governor and Commitment Portfolio | Make Active scarce across projects and daily commitments. | Configurable global/per-role WIP caps; explicit override reason; weekly Ship/Schedule/Shelve/Pause/Kill review. |
| G-05 | P1 | Project Spine | Join tasks, goals, events, people, knowledge, decisions, repos, builds, proof, and links under one project identity. | Project Hub can reconstruct the effort without duplicating canonical records. |
| G-06 | P1 | Resume Capsules | Make any project restartable after interruption. | Current state, next physical action, blocker, key links, last proof, and restart checklist visible and copyable. |
| G-07 | P1 | Role-aware Today and Do Next Coach | Show one justified primary action, up to three commitments, hard stop, risk, and a stuck-to-action assistant. | No opaque score; every inclusion/exclusion is explainable; low-capacity mode shrinks rather than shames. |
| G-08 | P1 | Weekly Portfolio Review | Choose one or two outcomes, reconcile promises, inspect project health, and intentionally stop work. | Review produces explicit decisions and a bounded active portfolio. |
| G-09 | P1 | AI Studio Command Queue | Manage AI collaborators as bounded project missions with agent profiles, writer locks, packets, proof, and handoffs. | No mission can be Shipped from collaborator claims alone; one writer per target file; outward actions remain blocked. |
| G-10 | P1 | Kevin Role Playbooks | Encode Kevin’s best teaching, coaching, publishing, studio, and family workflows as reusable SOPs/templates. | Playbooks instantiate editable checklists and context with provenance; they do not create domain mega-apps. |
| G-11 | P1 | Privacy Classes and Youth-data Guardrails | Make privacy a record-level contract and AI-context rule. | Sensitive classes fail closed; AI manifest shows exact fields; migration never weakens privacy. |
| G-12 | P2 | Relationship and Communication Commitments | Join people, promises, events, email sources, and projects. | Follow-ups have owner, date/state, project/role, and source; sends remain explicit. |
| G-13 | P2 | Decision and Assumption Ledger | Preserve decisions, tradeoffs, reversibility, evidence, and revisit dates. | Project Hub and reviews surface due decision revisits without duplicating notes. |
| G-14 | P2 | Knowledge-to-Action | Convert notes, briefs, prompts, and links into playbooks, checklists, decisions, or project context. | Conversion preserves source/provenance and requires Kevin confirmation. |
| G-15 | P2 | Global Local Search and Command | Find any record by text, role, project, person, status, source, or type. | Search is local, deterministic, typed, keyboard/mobile accessible, and does not create an external index. |
| G-16 | P2 | Admin and Money Radar | Expose certifications, physicals, forms, fees, budgets, subscriptions, entries, and publishing deadlines as a saved risk view. | Built from existing typed commitments; no separate accounting or student database. |
| G-17 | P2 | Evidence, Wins, and Skill Growth | Tie proof and outcomes to projects, goals, and roles without gamification. | Evidence is factual, source-linked, private, and optional; no engagement score. |
| G-18 | P2 | KevinOS Lab Budget and Pruning | Prevent the OS from becoming its own attention sink. | Every new feature has friction evidence, success test, owner, adoption check, and sunset/revert plan. |
| G-19 | P2 | Internal Contract Convergence | Make the single file safer through registries, normalizers, pure selectors, fixture factories, and optional browser smoke. | No framework or dependency; doctor/full suite/browser receipts remain green. |
| G-20 | P1 | AI Provider Fabric | Normalize Gemini, Groq, Mistral, Workers AI, and bounded specialist providers behind one server-side relay contract. | Every adapter passes credentialless mocks; browser contains no provider key or provider-specific request logic. |
| G-21 | P1 | Zero-Dollar Capability Router | Route by capability, privacy, health, and verified-free eligibility rather than one fixed model. | Unknown price blocks; paid usage is disabled; quota exhaustion falls back safely or pauses. |
| G-22 | P0 | AI Privacy Firewall | Deny youth-sensitive, financial-sensitive, secret, and unapproved work-internal packets before transport. | Forbidden fixtures never invoke a provider transport; visible manifest and redaction proof exist. |
| G-23 | P1 | Provider/Model Lifecycle Registry | Discover models where supported and track exact capabilities, deprecations, free status, and replacement routes. | Stable aliases survive model churn; stale/deprecated/non-free routes are visibly disabled. |
| G-24 | P1 | Kevin AI Feature Pipeline | Add proposal-only AI assistance for capture, commitments, Resume Capsules, Weekly Review, playbooks, public content, multimodal analysis, and Studio review. | Every output is bounded, validated, editable, provenance-linked, and explicitly applied. |
| G-25 | P2 | Continuous AI Improvement Lab | Evaluate prompts/routes on synthetic Kevin-shaped fixtures and recommend improvements. | Deterministic validators and local scorecards exist; no automatic production route change. |
| G-26 | P1 | AI Provider Control Center | Show provider status, policy, aliases, quota, lifecycle, health, and activation without exposing keys. | Kevin can understand and disable every route; secret values never appear. |
| G-27 | P0 | Credentials-Last Activation | Complete all architecture/tests before requesting keys; collect them only through a silent secure local ceremony. | Preactivation passes first; Kevin never pastes a key into chat; redacted live probes complete last. |
| G-28 | P1 | AI Graceful Degradation | Preserve complete local use with no keys, no network, exhausted quotas, or provider failure. | Every AI surface has a deterministic/manual path and calm failure state. |
| G-29 | P1 | Secret Rotation and Incident Safety | Make provider keys easy to rotate/revoke without source changes or data loss. | Ignored secret storage, redacted checks, rotation runbook, and leak-response tests exist. |


## Detailed goal contracts

### G-00 — Correctness before intelligence

**Why now:** Personalization built on inconsistent records will magnify defects. The current People AI-sharing typo is a direct trust failure.

**Capabilities**

- Correct `note`/`notes` mismatch.
- Add Person to task editor.
- Remove or fulfill false goal-link copy.
- Introduce normalizers for tasks, projects, people, goals, events, builds, decisions, and roles as each type evolves.
- Treat malformed optional fields safely at boot/import/merge.

**Non-goals:** redesigning screens before correctness; broad schema changes in this wave.

### G-01 — Kevin Role Registry

**Why Kevin:** generic areas cannot preserve the boundaries among BSHS, BSPC, classroom, BSWildcats, Studio, family, and personal finance.

**Capabilities**

- stable `roleId` plus readable label/color/icon/order/status/privacy default;
- seeded Kevin roles;
- legacy-area compatibility;
- role filters and saved views;
- role-specific capture aliases and templates;
- reversible remap wizard;
- inactive/archived roles without data loss.

**Critical rule:** never auto-split legacy Coaching or Work.

### G-02 — Seasonal Modes and Capacity

**Why Kevin:** his appropriate plan depends on whether it is a school day, meet day, practice day, deep-build day, publishing burst, travel day, or recovery day.

**Capabilities**

- mode selection on Today/Close/Review;
- optional calendar-based suggestion with confirmation;
- Full, Normal, and Low capacity;
- mode-specific role visibility, maximum commitments, and checklists;
- a visible hard stop and transition cue.

**Non-goals:** activity tracking, keyboard monitoring, inferred mood, automated productivity scoring.

### G-03 — Commitment Contract and Promise Radar

**Why Kevin:** he has deadlines where preparation starts before the due date and where another person is relying on him.

**Capabilities**

- commitment type;
- execution status;
- due/date/time versus start-by;
- lead time and hard stop;
- `waitingOn`, delegate, and review date;
- source/provenance;
- privacy class;
- stable risk reasons;
- explicit promise owner and beneficiary where useful.

**Truth rule:** an idea is not a commitment; a collaborator claim is not proof; a waiting task is not actionable.

### G-04 — WIP Governor and Commitment Portfolio

**Why Kevin:** his opportunity set is larger than available attention.

**Capabilities**

- global and per-role project caps;
- maximum daily commitments, default three;
- admitted Active versus Paused/Scheduled/Someday/Done/Killed;
- explicit override reason with expiry/review date;
- portfolio health and stale-active detection;
- Ship, Schedule, Shelve, Pause, Kill decision flow.

**Tone:** competence-building, never shame-based.

### G-05 — Project Spine

**Why Kevin:** every serious effort spans multiple rooms and often multiple AI tools.

**Capabilities**

- `projectId` on builds, events, decisions, briefs, prompts, notes, links, and communication commitments;
- project hub with outcome/current state/next action/resume capsule;
- related tasks, events, people, goals, sources, repos, missions, proof, and decisions;
- generated relationship index rather than duplicated record blobs;
- project health/review date.

**Non-goal:** replacing specialized repos or apps.

### G-06 — Resume Capsules

**Why Kevin:** context switching is unavoidable; re-discovery should not be.

**Required capsule**

- outcome;
- current state in plain language;
- next physical action;
- blockers/waiting state;
- last trusted proof and its date;
- key links/repo/branch/worktree;
- restart checklist;
- explicit “not doing now” note.

### G-07 — Role-aware Today and Do Next Coach

**Why Kevin:** Today should reduce decision load, not merely list selected tasks.

**Capabilities**

- active role/mode/capacity;
- one primary action and at most three commitments;
- next hard stop and preparation requirement;
- promise risk and reason codes;
- fast role switch with context-safe transition;
- “I’m stuck” reasons: unclear, too big, waiting, low energy, afraid of consequence, missing context;
- deterministic interventions: define next action, make two-minute slice, delegate, schedule, request information, or shelve.

### G-08 — Weekly Portfolio Review

**Why Kevin:** weekly review is where creative breadth becomes intentional execution.

**Outputs**

- wins/proof;
- open external promises;
- role health;
- stale/waiting/delegated items;
- Active project admission decisions;
- one or two outcomes for the week;
- explicit things not being pursued;
- protected family/recovery commitments;
- next review date.

### G-09 — AI Studio Command Queue

**Why Kevin:** he works across Codex, Claude, Gemini, and other agents with model-specific strengths and parallel project windows.

**Capabilities**

- agent profile: name/model/strengths/weaknesses/default role/allowed actions;
- mission status: queued/ready/running/awaiting-human/awaiting-proof/blocked/review/complete/paused;
- project, repo, branch, worktree, target files, writer lock, acceptance IDs, commands, risk class;
- generated context packet and paste-ready mission prompt;
- handoff intake that separates claim from evidence;
- reviewer assignment and comparison notes;
- resume/pause without hidden autonomous continuation.

**Hard boundary:** no push, deploy, secrets, live OAuth/provider mutation, email send, calendar create, financial action, or destructive history change without Kevin’s explicit approval.

### G-10 — Kevin Role Playbooks

**Teaching examples:** opening-week lesson loop, retrieval practice, student support, parent/admin-safe communication, assessment/grading closeout.

**BSHS examples:** preseason eligibility/physicals, daily practice, meet-entry countdown, travel/bus, parent communication, meet results/post, season review.

**BSPC examples:** season map, group practice with exact intervals and SAY cues, meet admin, swimmer development review, family billing/communication, staff alignment.

**BSWildcats examples:** verify source, write/format, link check, mobile check, privacy/optics check, publish, receipt.

**Studio examples:** intake, scope, architecture/read-first, branch/worktree, acceptance, one-writer lock, implement, test, visual proof, handoff, review, merge authorization.

**Family examples:** protected time, shared logistics, important follow-up; private, respectful, and non-gamified.

### G-11 — Privacy Classes and Youth-data Guardrails

- Store minimum necessary data.
- Use pseudonymous IDs where workable.
- Keep student/athlete PII out of generic profile and AI context.
- Default `youth-sensitive` to no-AI/no-export-to-public.
- Show included fields before AI send.
- Preserve privacy through migration/import/merge.
- Add public-output redaction checks for BSWildcats and parent/admin artifacts.

### G-12 through G-19 — Supporting goals

These goals deepen the core model after the three foundations are stable:

- relationship promises connect people, sources, events, and projects;
- decisions retain tradeoffs, assumptions, evidence, and revisit dates;
- knowledge can be promoted into executable playbooks/checklists;
- global search reconstructs context without external indexing;
- Admin & Money Radar prevents paperwork and subscription surprises;
- evidence/wins show real progress without gamification;
- the Lab Budget blocks feature creep;
- internal contracts keep the single-file architecture safe.


### G-20 — AI Provider Fabric

**Why Kevin:** Kevin uses several AI systems and benefits from model diversity, but KevinOS should present one trustworthy contract rather than eight vendor-specific integrations.

**Capabilities**

- relay-side provider adapters;
- stable capability aliases;
- normalized requests, errors, usage, and provenance;
- deterministic route preview;
- exact model receipt;
- no provider key or provider SDK in `index.html`.

### G-21 — Zero-Dollar Capability Router

**Rules**

- `allowPaid=false` by default and at release;
- `FREE_VERIFIED` required for automatic routes;
- unknown cost or account eligibility blocks;
- bounded provider quotas and daily ceilings;
- deterministic capability/privacy-compatible fallback;
- no automatic credit purchase, billing enrollment, or paid spillover.

### G-22 — AI Privacy Firewall

- classify before routing;
- deny `youth-sensitive`, `financial-sensitive`, and `secret` always;
- deny `work-internal` by default;
- keep People notes separately opt-in;
- show fields/records/redactions before send;
- test that denied packets never reach mock transport.

### G-23 — Provider/Model Lifecycle Registry

Stable product aliases such as `fast-structured`, `deep-synthesis`, and `code-second-opinion` point to exact models only after capability, lifecycle, free eligibility, and privacy checks. Provider catalog refreshes can recommend replacements but cannot silently change production routing.

### G-24 — Kevin AI Feature Pipeline

Prioritize features that reduce re-discovery and clerical work:

- commitment/task extraction from public or sanitized text;
- Resume Capsule drafts from approved project evidence;
- Weekly Review synthesis;
- role/project capture suggestions;
- playbook/checklist drafts;
- public BSWildcats copy checks;
- safe multimodal analysis;
- independent Studio mission review.

Every feature retains a complete deterministic/manual path.

### G-25 — Continuous AI Improvement Lab

Use synthetic fixtures representing Kevin's real work without real PII. Score schema validity, privacy, expected fields, latency, quota usage, fallback count, and Kevin's optional judgment. The Lab recommends a change; Kevin approves it.

### G-26 — AI Provider Control Center

Place the Control Center in Settings or Studio. It shows configuration/health/free status/circuit/quota/model aliases/data policy. It never displays or stores key values in app state.

### G-27 — Credentials-Last Activation

The only permissible final clarification is the external credential ceremony after `preactivation` passes. Kevin creates accounts/keys and runs a silent terminal script. Codex does not request keys earlier and never asks Kevin to paste them into chat.

### G-28 — AI Graceful Degradation

No AI key is required to open, capture, prioritize, review, search, back up, restore, or resume a project. AI failures return clear manual next steps and never block core state transitions.

### G-29 — Secret Rotation and Incident Safety

Use ignored `.dev.vars`/environment storage locally and Cloudflare secrets only with explicit outward-action authorization. Build redacted presence checks, minimal synthetic probes, rotation/revoke guidance, and a response plan that treats any pasted/logged key as compromised.

## Goal interaction rules

1. Role Registry, Commitment Contract, and Project Spine are foundational and should land before dependent views.
2. Today is a selector over contracts, not a separate truth store.
3. Studio is a view over project missions, not a second project database.
4. Weekly Review mutates only through explicit Kevin actions.
5. Search is an index/view, not canonical state.
6. Playbooks create editable records with provenance; they do not silently execute.
7. Privacy rules override convenience and AI context expansion.
8. WIP controls never hide external promises; they force a portfolio decision.
9. The Lab Budget applies to this entire goal list after initial delivery.

## Priority sequencing

**P0:** G-00.
**Foundation P1:** G-01, G-03, G-05, G-11.
**Operating P1:** G-02, G-04, G-06, G-07, G-08.
**AI leverage P1:** G-09, G-10, G-20 through G-24, G-26 through G-29.
**Completion P2:** G-12 through G-19 and G-25.

## Portfolio-level definition of done

The project is not done when every card exists. It is done when Kevin can use the new loop on real work:

> Open → confirm role/mode/capacity → see the real promise and next action → act → preserve proof/context → close or wait intentionally → review the portfolio → trust tomorrow.
