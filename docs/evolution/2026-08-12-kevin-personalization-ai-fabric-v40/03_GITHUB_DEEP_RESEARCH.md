# KevinOS GitHub and External AI Systems Deep Research Report

**Research date:** 2026-08-12
**Question:** Which open-source repositories provide contracts, interaction patterns, algorithms, tests, or carefully bounded ideas that can help make KevinOS more Kevin-shaped without violating its local-first, dependency-free, deterministic, privacy-first architecture?

## Research standard

This is not a stars list. Repositories were evaluated against the live KevinOS constraints:

1. Does the pattern reduce orientation, restart, promise, portfolio, or AI-collaboration friction for Kevin?
2. Can the pattern be translated into the current single-file local-first architecture?
3. Does it preserve explicit user control and privacy?
4. Is it deterministic and testable?
5. Does it avoid a second source of truth?
6. Is the project status/license compatible with the intended use?
7. What should KevinOS explicitly refuse to import?

## Decision summary

| Tier | Repository | Slug | Most valuable pattern | KevinOS adaptation | Do not import | License/reuse posture |
| --- | --- | --- | --- | --- | --- | --- |
| Tier A | GitHub Spec Kit | github/spec-kit | Spec → plan → tasks → implementation; constitution gates; independently testable user stories. | Use its artifact discipline for KevinOS missions and role-playbook feature packets. | Do not add its CLI/runtime as an app dependency; copy the method into Markdown contracts. | MIT |
| Tier A | 12-Factor Agents | humanlayer/12-factor-agents | Own context, structured tool outputs, unified execution/business state, pause/resume, explicit control flow. | Use event-style mission state, compact context packets, human approval before consequential calls, and resumable work. | Do not introduce an autonomous framework or unbounded agent loop. | Apache-2.0 |
| Tier A | Super Productivity | super-productivity/super-productivity | Projects/tags/subtasks, timeboxing, calendar/issue import, project notes/files/bookmarks/commands, private local control. | Borrow project-context affordances, timebox planning, short syntax, and visible local ownership. | Reject passive time surveillance, hidden productivity scoring, backend/plugin complexity. | MIT |
| Tier A | Taskwarrior | GothenburgBitFactory/taskwarrior | Mature task states, projects/tags, waits, dependencies, annotations, ready-work concepts. | Borrow explicit waiting/dependencies/ready state and deterministic reports. | Reject its urgency score as a universal KevinOS ranking model. | MIT |
| Tier A | Monica | monicahq/monica | Personal relationship context, reminders, activities, contact notes, relationship graph, private-for-your-eyes-only philosophy. | Borrow explicit relationship context and requested reminders for People/communication commitments. | Pattern only; do not copy AGPL code or turn people into sales leads. | AGPL |
| Tier A | Aider | Aider-AI/aider | Repository map, git-aware reversible edits, automatic lint/test loops, context-efficient work on existing codebases. | Borrow compact repo maps, immediate verification, diff-first review, and reversible checkpoints for mission packets. | Do not embed Aider or allow automatic commits/pushes in KevinOS. | Apache-2.0 |
| Tier A | Beads | gastownhall/beads | Persistent dependency graph, ready work, claim/close flow, agent memory, hierarchy, audit trail. | Borrow dependency-aware task graph, ready queue, persistent mission insights, and explicit blockers. | Do not install Dolt or create a second source of truth by default; optional stealth use only when already installed. | MIT-style repository license; verify before code reuse |
| Tier A | ai-dev-tasks | snarktank/ai-dev-tasks | Small PRD-to-parent-task-to-subtask Markdown workflow with checkboxes and relevant files. | Borrow simple task-file progress discipline for a one-agent marathon. | Skip its mandatory “Go” pause because Kevin already authorizes the scoped marathon. | Apache-2.0 repository license file |
| Tier B | Vikunja | go-vikunja/vikunja | Self-owned task/project manager with saved views and task relations. | Borrow saved filter/view concepts and relation UX. | Pattern only; no AGPL code; no server rewrite. | AGPL-3.0-or-later |
| Tier B | SilverBullet | silverbulletmd/silverbullet | Private browser PKM with backlinks, typed objects/queries, templates, commands, and tasks. | Borrow typed knowledge objects, provenance links, and template-to-action conversion. | Do not embed Lua, Rust server, or wiki runtime. | Inspect license before code reuse; pattern only |
| Tier B | Memos | usememos/memos | Timeline-first quick capture, Markdown-native, user-controlled data, review-before-save clipper. | Borrow open-write-move-on capture and explicit visibility/privacy choice. | Do not add a server/database just for capture. | MIT |
| Tier B | Actual Budget | actualbudget/actual | Local-first finance with device sync, migration discipline, and bounded domain workflows. | Borrow trust, reconciliation, migration, and local-first sync patterns for Admin/Money views. | Do not absorb a budgeting engine or brokerage workflow. | Inspect current license before code reuse; pattern only |
| Tier B | Vibe Kanban | BloopAI/vibe-kanban | Agent workspaces with branch/terminal/dev server, issue planning, diff review, inline feedback, preview, agent switching. | Borrow project workspace, diff/review, device preview, and agent-switch concepts. | Official README says the project is sunsetting; use as a pattern source only and add no dependency. | Inspect before code reuse; pattern only |
| Tier C | Automerge | automerge/automerge | CRDT/local-first merge model and conflict semantics. | Use as a conceptual/test oracle for conflict thinking. | Do not replace current sync unless a real material lost-edit failure passes the existing evidence gate. | Reference only |
| Tier C | ActivityWatch and passive trackers | various | Automatic activity/time capture. | No recommended import. | Direct conflict with KevinOS’s no-surveillance and explicit-friction principles. | Reject |
| Tier C | OpenHands / broad autonomous agent platforms | various | Large autonomous coding-agent orchestration stacks. | No recommended import for the core. | Too much autonomy, infrastructure, and second-source-of-truth risk for KevinOS. | Reject |


## Tier A: direct pattern donors

### 1. GitHub Spec Kit

**Repository:** https://github.com/github/spec-kit

**Inspected:** feature specification, implementation plan, and task templates.

**Why it matters:** Spec Kit requires prioritized, independently testable user stories, measurable success criteria, technical constraints, a constitution gate, exact project structure, and task-level file paths. Kevin’s best AI work already resembles this; formalizing it inside KevinOS reduces handoff drift.

**Adaptation**

- Every serious KevinOS/Studio mission generates: `spec`, `plan`, `data model`, `contracts`, `tasks`, `test matrix`, and `proof bundle`.
- Each user story must remain independently demonstrable.
- Every complexity exception names the simpler alternative that was rejected.
- Mission packet fingerprint changes when outcome, allowed scope, acceptance, commands, or role changes.

**Do not import:** CLI/runtime/dependencies into the PWA. The value is the contract.

### 2. HumanLayer 12-Factor Agents

**Repository:** https://github.com/humanlayer/12-factor-agents

**Inspected:** Own Your Context Window, Unify Execution State and Business State, Launch/Pause/Resume, and Own Your Control Flow.

**Why it matters:** Kevin’s AI work is long-running and interruption-heavy. The repository’s strongest idea is that context and execution state should be explicit, serializable, inspectable, and resumable, with human approval at high-stakes boundaries.

**Adaptation**

- A mission is an ordered event/history contract, not a vague status badge.
- Context packets include only current project/role/acceptance/proof facts.
- Pause states are first-class: awaiting Kevin, awaiting proof, blocked, scheduled.
- Tool/action selection can be reviewed before invocation.
- Errors are compacted after resolution but receipts remain.

**Do not import:** an autonomous while-loop or framework that outruns Kevin’s review capacity.

### 3. Super Productivity

**Repository:** https://github.com/super-productivity/super-productivity

**Inspected:** README features and project/task context model.

**Best ideas**

- attach notes/files/bookmarks/commands to a project;
- plan locally while integrating external sources;
- timebox intentionally;
- short syntax for capture;
- privacy and user-controlled storage.

**KevinOS translation**

- Project Hub contains references, commands, source links, and restart context.
- Calendar blocks can be suggested from commitments but require confirmation.
- Add concise role/project/status syntax without creating a fragile parser language.
- Preserve external source identity instead of duplicating entire systems.

**Reject:** passive time tracking, productivity scores, plugin/server breadth.

### 4. Taskwarrior

**Repository:** https://github.com/GothenburgBitFactory/taskwarrior

**Why it matters:** It has decades of experience separating pending, waiting, scheduled, blocked, and ready work.

**KevinOS translation**

- `executionStatus` is explicit.
- Waiting work has `waitingOn` and a review date.
- Dependencies block readiness without creating an urgency score.
- Annotations become bounded project/decision/history facts.
- Ready lists are deterministic saved views.

**Reject:** a universal weighted urgency formula. KevinOS should show ordered reasons, not a magic number.

### 5. Monica

**Repository:** https://github.com/monicahq/monica

**Why it matters:** Monica treats relationship memory as private care rather than sales automation. It supports contacts, relationships, reminders, notes, activities, and tasks while explicitly rejecting social-network and tracking behavior.

**KevinOS translation**

- People can belong to roles/projects/organizations.
- Follow-up exists because Kevin requested it or made a promise, not because an AI guesses.
- Activities and communication commitments are visible on the project/person timeline.
- Family relationships remain private and non-gamified.

**Reuse posture:** pattern-only unless license obligations are deliberately accepted.

### 6. Aider

**Repository:** https://github.com/Aider-AI/aider

**Why it matters:** Aider proves that AI coding quality improves when the system builds a compact repository map, uses git/diffs as recovery, and runs lint/tests immediately after changes.

**KevinOS translation**

- Mission packet contains a compact repo map and exact relevant files.
- Every implementation slice is followed by focused tests and a diff review.
- Reversible checkpoints precede schema/migration/high-risk work.
- Proof includes commands and actual results, not “tests pass” prose.

**Reject:** automatic commits or any push/deploy authority in KevinOS.

### 7. Beads

**Repository:** https://github.com/gastownhall/beads

**Why it matters:** Beads models long-horizon agent work as a dependency graph with ready work, claims, blockers, closure, persistent memory, and audit trail.

**KevinOS translation**

- `TASK_GRAPH.md` tracks dependencies and ready waves.
- Missions have blockers and claim/owner state.
- Durable insights go into a bounded decision/memory ledger.
- Parent/child IDs and explicit dependencies prevent marathon drift.

**Critical decision:** do not install Beads as a default KevinOS dependency. The supplied archive has no `.git`, and a Dolt-backed task database would create a second truth. A Codex session may use `bd --stealth` only when it is already installed and KevinOS remains authoritative through the Markdown task graph.

### 8. ai-dev-tasks

**Repository:** https://github.com/snarktank/ai-dev-tasks

**Why it matters:** Its workflow is intentionally small: requirements → parent tasks → subtasks → relevant files → check off each task.

**KevinOS translation**

- Keep a paste-ready task file with exact paths and checks.
- Mark each subtask only after its focused proof passes.
- The marathon skips the “wait for Go” pause because this packet itself is Kevin’s authorization.

## Tier B: selective pattern sources

### Vikunja

Use saved filters, task relations, and ownership concepts. Do not copy AGPL code or add a server.

### SilverBullet

Use typed knowledge objects, bidirectional provenance, and templates. Do not embed its server, Lua runtime, query engine, or editor.

### Memos

Use timeline-first quick capture and explicit clip review/visibility. Do not replace localStorage/state with a backend merely to imitate it.

### Actual Budget

Use local-first migration/reconciliation discipline and bounded domain workflows. Admin & Money Radar should point to or summarize specialized systems, not become an accounting engine.

### Vibe Kanban

Use the concepts of one agent workspace per branch/worktree, inline diff review, preview, and agent switching. Its official README states that the project is sunsetting, so it is not an acceptable dependency or strategic foundation.

## Tier C: references and explicit rejections

### Automerge

KevinOS already has a documented conflict-evidence gate and operation-based reference oracle. CRDTs remain research-only until a real, material, reproduced lost-edit failure proves the current snapshot/tombstone model insufficient.

### Passive trackers

ActivityWatch-style surveillance conflicts with KevinOS’s explicit, local, content-free friction pilot. Do not import.

### Broad autonomous agent platforms

OpenHands-style stacks are too infrastructure-heavy and autonomy-heavy for the core. Kevin’s problem is review capacity and project closure, not lack of agents.

## Pattern-to-goal map

| KevinOS goal | Primary donors | Specific borrowed contract |
| --- | --- | --- |
| Role Registry and modes | Super Productivity, Monica, SilverBullet | Projects/contexts, private relationship domains, typed objects/templates. |
| Commitment Contract | Taskwarrior, Vikunja | Waiting/scheduled/dependency/ready states and saved views. |
| Project Spine | Super Productivity, SilverBullet, Monica | Project context attachments, bidirectional links, relationship/activity context. |
| Resume Capsules | 12-Factor Agents, Aider | Serializable state, compact context, repo maps, recovery checkpoints. |
| WIP and portfolio review | Taskwarrior, Beads, Spec Kit | Ready graph, blockers, explicit priorities, independently testable slices. |
| AI Studio queue | 12-Factor Agents, Vibe Kanban, Aider, Beads | Pause/resume, workspaces, diff/test loop, dependency/claim states. |
| Role playbooks | Spec Kit, SilverBullet, ai-dev-tasks | Specs/templates that instantiate executable tasks. |
| Privacy guardrails | Monica, Memos, Actual Budget | For-your-eyes-only philosophy, reviewed capture, local custody. |
| Internal engineering | Spec Kit, Aider, Automerge reference | Constitution gates, focused test loop, conflict model tests. |


## Recommended code-reuse posture

1. Prefer ideas, contracts, tests, and interaction patterns over copied implementation.
2. For MIT/Apache sources, copy only small, clearly attributable portions when there is a compelling reason; otherwise reimplement for KevinOS’s ES5 architecture.
3. Treat AGPL and uncertain-license repositories as pattern-only unless Kevin explicitly approves legal/architectural implications.
4. Record source, adaptation, and rejection rationale in `docs/evolution/DECISION_LOG.md`.
5. No new runtime dependency is justified by this research.

## Final research conclusion

The strongest open-source lesson is not “install more tools.” It is:

- model state explicitly;
- keep work resumable;
- show blockers and ready work;
- connect context to projects;
- let users review consequential actions;
- test each independently valuable slice;
- preserve local ownership;
- refuse surveillance and opaque scoring.

KevinOS can adopt all of those lessons without ceasing to be KevinOS.

## External AI API research overlay

The repository research remains valid, but provider integration is governed by `07_FREE_AI_PROVIDER_RESEARCH.md` and `08_AI_PROVIDER_FABRIC_BLUEPRINT.md`.

The decisive external-systems lesson is the same as the GitHub lesson:

> **Borrow contracts, not complexity; route by capability, not brand.**

The provider fabric should use native HTTP/Web APIs and small adapters rather than importing provider SDKs or an agent framework. Model catalogs, quotas, data policies, free eligibility, and deprecations are treated as volatile external state. The app keeps stable internal aliases and fails closed when external facts are unknown.

GitHub projects inform mission state, proof, dependency, and local-first interaction patterns. Official provider documentation informs API contracts. Neither becomes a second source of truth for KevinOS state.
