# KevinOS Hardcore Open-Source Research Report

**Verification date:** August 11, 2026  
**KevinOS artifact inspected:** supplied `kevinos-main 2(1).zip`  
**Inspected release:** KevinOS v0.50, schema v39, service-worker cache `kevinos-v0_50`  
**Mission type:** research and product direction only; no KevinOS source was modified  
**Research depth:** 40 credible repositories screened; 18 finalists analyzed in depth

## Contents

- [Executive verdict](#executive-verdict)
- [Current KevinOS assessment](#current-kevinos-assessment)
- [Research methodology](#research-methodology)
- [Landscape map](#landscape-map)
- [Comparative scorecard](#comparative-scorecard)
- [Deep repository analyses](#deep-repository-analyses)
- [Out-of-the-box pattern transfer](#out-of-the-box-pattern-transfer)
- [Original KevinOS concepts](#original-kevinos-concepts)
- [Recommended roadmap](#recommended-roadmap)
- [Top three implementation missions](#top-three-implementation-missions)
- [Licensing and attribution review](#licensing-and-attribution-review)
- [Risks and rejected directions](#risks-and-rejected-directions)
- [Source index](#source-index)
- [Cold-start handoff](#cold-start-handoff)
- [Blunt final answer](#if-kevinos-adopts-only-three-lessons-during-its-next-evolution)

---

# Executive verdict

KevinOS is already past the point where copying a larger productivity application would help. It is a mature, unusually well-defended local-first personal operating system whose biggest remaining opportunities are **better contracts**, not more rooms, frameworks, services, or autonomous agents.

The five most important discoveries are:

1. **NOW needs an explicit attention contract, not a smarter black box.** KevinOS currently derives its top three commitments from eligible tasks in global `state.items` array order, and `moveFocusTask()` changes focus by swapping those task records. That is deterministic, but it makes attention order a side effect of storage order and cannot explain *why* a task deserves attention. The strongest transfer from Taskwarrior, ActivityWatch, and safety-critical checklist practice is a small, visible **Attention Receipt**: explicit daily focus rank plus deterministic reason codes, with no AI ranking and no hidden behavioral score.

2. **KevinOS needs a bounded operation history, not a CRDT migration.** Actual Budget, Jujutsu, TaskChampion, TinyBase, and Automerge all prove that recovery improves when canonical evidence, derived state, conflicts, and operations are explicit. KevinOS already has backups, snapshots, tombstones, optimistic revisions, and three-device convergence. Replacing that with Automerge, Yjs, PouchDB, or another database would create migration risk without solving a current user problem. The right next move is a small **Local Flight Recorder** and repair workflow layered onto the existing state contract.

3. **AI proposals should become typed, proof-bearing jobs.** KevinOS already records provider, model, prompt ID/version, context categories, a context fingerprint, lifecycle state, feedback, application target, and Undo. Simon Willison's LLM 0.32, Inspect AI, Promptfoo, and Label Studio reveal the missing layer: output schema version, request/result fingerprints, validation results, timing, decision provenance, and a clean separation between model output and human-reviewed application. This can be added as optional nested fields in existing `pending[kind=ai]` records with no dependency and no schema bump.

4. **Studio missions need structured acceptance evidence, not a longer text form.** Studio already captures outcome, current state, next action, AI/role, repository scope, acceptance criteria, commands, evidence, commit reference, blockers, and handoff. But `missionVerified()` currently treats a mission as proved when status is `manual` or `machine` and the evidence text is non-empty. Aider, Mattermost Playbooks, Inspect AI, and eLabFTW point to a stronger bounded contract: packet fingerprint, acceptance checklist items, attempt receipts, command/result evidence, and explicit override reasons.

5. **Adoption evidence should stay local, coarse, and humane.** ActivityWatch and HPI demonstrate the value of provenance-rich behavioral evidence, but their raw-data potential would be excessive for KevinOS. GOV.UK Frontend demonstrates that interruptions should be rare and reserved for irreversible actions, likely mistakes, or contradictions. KevinOS should record only low-resolution facts such as “NOW opened,” “focus overridden,” “task completed,” or “friction marked,” never window titles, URLs, keystrokes, or silent activity monitoring.

## Decisive product direction

| Decision | Verdict | Why |
|---|---|---|
| Preserve the single-file ES5 local-first architecture | **YES** | It is a product advantage, not technical debt requiring replacement. |
| Add explicit daily focus rank and reason codes | **BUILD NEXT** | Directly improves the north star while preserving determinism and control. |
| Add AI job receipts and local validation | **BUILD NEXT** | Makes AI usefulness measurable and reversible without adding autonomy. |
| Strengthen mission proof and handoffs | **BUILD NEXT** | Improves every external AI collaborator Kevin uses. |
| Add a bounded operation log | **EXPERIMENT AFTER THE TOP THREE** | High trust value, but more cross-cutting than the first three missions. |
| Replace sync with a CRDT/database framework | **DO NOT BUILD** | No demonstrated need justifies the migration and dependency burden. |
| Add always-on productivity surveillance | **DO NOT BUILD** | Violates calmness, privacy, and behavioral trust. |
| Embed a general autonomous-agent runtime | **DO NOT BUILD** | Conflicts with explicit approval, bounded scope, and dependency-light design. |

---

# Current KevinOS assessment

## Authoritative baseline

The supplied repository was unzipped and inspected before external research. The archive contains no `.git` directory, so branch, remote, commit history, and uncommitted-work status cannot be verified. Code and current tests were therefore treated as authoritative when historical plans disagreed.

The mandatory files were read, including:

- `AGENTS.md`;
- `README.md`;
- `docs/CURRENT_STATE.md`;
- `docs/ARCHITECTURE.md`;
- `docs/STATE_CONTRACT.md`;
- `docs/DECISIONS.md`;
- `docs/ROOM_MAP.md`;
- `docs/RELAY_ROUTE_MATRIX.md`;
- `docs/ADOPTION_SOAK.md`;
- `docs/ai/WORK_PACKET_TEMPLATE.md`;
- `docs/ai/HANDOFF_TEMPLATE.md`;
- `CONTRIBUTING-AI.md`;
- `index.html`;
- `sw.js` and `manifest.json`;
- `relay/worker.js`, relay tests, and setup/security documentation;
- recent Convergence and release receipts.

The release gate was rerun from the repository root:

```text
node tools/doctor.js
sh test/run.sh
```

Result:

```text
KevinOS doctor ok — app v0.50, schema v39, 20 rooms, 42 relay routes
syntax ok (app script, sw.js, worker.js)
es5 clean
all app, portability, merge, convergence, relay, and security suites green
ALL GREEN ✓
```

## What KevinOS already does exceptionally well

### 1. The architecture matches the product

`index.html` is the served application: markup, CSS, and a single ES5-style IIFE with no dependency graph or build step. `manifest.json` and `sw.js` provide installation and offline behavior. The optional Cloudflare Worker relay owns provider keys, OAuth tokens, sync storage, push, and live integrations while the browser owns Kevin's content and visible decisions.

This design is unusually compatible with KevinOS's actual goals: inspectability, portability, offline use, low operational burden, and resistance to framework churn.

### 2. The state trust contract is real, not aspirational

KevinOS v0.50 uses schema v39 with 17 allowlisted portable/synced content collections in `CONTENT_ARRAYS` and 11 portable metadata objects in `PORTABLE_OBJS`. Device connections and secrets are excluded. Important state behavior is explicit:

- `touch(record)` stamps the update time;
- `save()` performs visible persistence and schedules downstream work;
- `persist()` is reserved for quiet device-local metadata;
- `bury(id)` creates a tombstone before deleting synced records;
- corrupt local storage blocks writes and exposes recovery;
- portable export/import is allowlist-built and deep-cloned;
- five IndexedDB snapshots provide another recovery layer;
- optimistic sync revisions force stale writers to merge and retry;
- newer `u` wins, remote wins ties, and tombstones prevent resurrection for 30 days;
- tests cover malformed input, portability, merges, and three-device convergence.

### 3. NOW is already calm and deterministic

`windItems()` selects open tasks that are explicitly marked for today or due on/before today. `nowModel()` chooses at most three commitments, identifies the top outcome and first physical action, finds the next hard stop, and reports overdue risk. AI and system material stays collapsed under Support.

The current behavior is materially better than a generic “smart dashboard”: it is bounded, inspectable, fast, and not model-dependent.

### 4. Onboarding proves usefulness before configuration

The five-step first-use path supports restore, clean start, or isolated demo data. A clean start creates one meaningful outcome, one first physical action, an optional hard stop, a capture proof, an Undo proof, and a recovery choice. Demo data is isolated and removable. This is strong progressive disclosure and should be preserved.

### 5. AI authority is correctly bounded

AI requests use versioned prompts, selected roles, explicit context categories, a shared-context preview, and a context fingerprint. Returned text becomes a proposal in `pending[kind=ai]`; it cannot mutate state directly. Kevin can edit, apply, reject, escalate to Council, or undo an applied change. Approved changes use the same `touch()`/`bury()`/`save()` contracts as direct UI changes.

### 6. Studio already encodes serious collaboration discipline

Missions in `builds` can record outcome, current state, next action, AI assignment, role, repository/branch/worktree, allowed and forbidden scope, acceptance criteria, test commands, verification status, evidence, commit/checkpoint reference, blockers, notes, and handoff. Work, audit, verification, and handoff packets can be copied. Shipped status is proof-gated.

### 7. Security and accessibility are unusually well covered

The current release includes route body limits, OAuth nonce checks, URL and private-network guards, safe provider-error envelopes, security headers, hostile-content rendering tests across 12 surfaces, light/dark contrast checks, reduced motion, coarse-pointer target sizing, focus trapping, Escape handling, and responsive checks from 320px through desktop widths.

## Genuine remaining weaknesses

These are not historical roadmap leftovers. They are current contract gaps visible in v0.50 code.

### Weakness 1 — attention order is coupled to task storage order

The code comment above `moveFocusTask()` states that the focus card uses `state.items` array order. Moving a focus task swaps the records in that global array. `nowModel()` then takes `windItems().slice(0,3)`.

Consequences:

- KevinOS cannot distinguish “this task is stored earlier” from “Kevin deliberately chose this as focus number one”;
- a focus change has no durable reason, timestamp, or decision source;
- array order can be affected by capture insertion, import, merge order, and unrelated task operations;
- the UI cannot explain why an item is in NOW;
- stability rules cannot be tested independently from storage behavior.

### Weakness 2 — deterministic does not yet mean explainable

NOW is deterministic, but it does not expose a factor receipt. Kevin can see due/overdue risk, but not a concise reason such as:

- explicitly chosen today;
- carried from an active project next action;
- overdue;
- due before the next hard stop;
- manually moved above another task;
- fallback because no explicit focus was chosen.

The answer should not be a hidden numerical priority score. It should be a small ordered list of deterministic reasons.

### Weakness 3 — Undo is fragmented and short-lived

KevinOS has strong recovery layers and several localized Undo paths, including capture, voice capture, onboarding capture, and approved AI application. It does not have one human-readable history of important changes showing what changed, what caused it, whether it synced, and how to reverse it.

Snapshots answer “restore the whole state.” They do not answer “what exactly happened?” or “undo only this operation.”

### Weakness 4 — AI provenance stops before validation proof

A proposal records important provenance, but it does not yet have:

- a receipt schema version;
- normalized request and response fingerprints;
- structured output type or validation result;
- byte/token estimates and latency;
- retry/attempt history;
- explicit human decision reason;
- a local test-case or assertion result;
- a content-addressed identity for duplicate detection;
- a durable link between source context, proposal, applied record, and Undo outcome.

### Weakness 5 — mission verification is too weak for the quality of the form

`missionVerified(b)` currently returns true when verification status is `manual` or `machine` and the free-text evidence field is non-empty. This allows a mission with incomplete acceptance criteria, failed commands, or vague evidence to become Shipped.

The form is rich; the proof contract is not yet equally rich.

### Weakness 6 — adoption evidence lives mostly outside the product

`docs/ADOPTION_SOAK.md` is a good prune-first 30-day scorecard, but the app itself mainly records room visits and a few local outcome summaries. It does not yet make low-resolution friction visible, such as:

- NOW opened but immediately overridden;
- capture abandoned;
- a task was repeatedly carried without action;
- a recovery reminder was dismissed;
- an AI proposal was edited heavily before acceptance;
- a mission repeatedly failed the same verification step.

The gap should be filled without surveillance.

### Weakness 7 — recovery is strong but not routinely rehearsed

KevinOS can export, inspect an import, restore snapshots, merge across devices, and block corruption. The next trust improvement is a guided, non-destructive recovery drill that proves a backup can be parsed and compared without replacing current state.

### Weakness 8 — context consent is visible but not yet budgeted

The AI composer shows categories and a full preview. It does not summarize how much context is being shared, which local records contributed it, whether duplicate text was removed, or what was omitted by policy. A compact context manifest would make consent easier to understand.

## Constraints that should remain non-negotiable

The research found no evidence strong enough to overturn these constraints:

- local-first and offline-capable;
- one primary dependency-free `index.html`;
- ES5-style application JavaScript;
- optional relay, never mandatory cloud state;
- deterministic NOW behavior;
- explicit AI approval and no silent important-state mutation;
- safe backup, restore, sync, tombstones, and convergence;
- visible user control;
- no unnecessary SaaS or account system;
- no framework rewrite;
- no embedded general-purpose autonomous-agent platform.

---

# Research methodology

## Process

1. Unzipped and inspected the supplied KevinOS repository.
2. Read current contracts, code, tests, onboarding, AI proposal flow, Studio mission flow, service worker, manifest, relay boundaries, and release receipts.
3. Ran the repository doctor and full dependency-free release gate.
4. Built a landscape of 40 credible open-source repositories across attention systems, local-first data/recovery, human-controlled AI, collaborator mission control, accessibility, incident response, laboratory records, personal data provenance, and observability.
5. Selected 18 finalists for deeper analysis.
6. Verified each finalist against current primary sources: official repository metadata, release/tag or exact commit, license text, repository documentation, specific source files, and official project documentation.
7. Scored finalists directionally from 1–5 against KevinOS-specific criteria. Scores are comparative judgments, not measurements.
8. Separated five kinds of transfer:
   - interaction and product ideas;
   - algorithms and data contracts;
   - portable source modules;
   - installable dependencies;
   - concepts that should be reimplemented locally.

## Verification date and activity standard

Repository status was verified on **August 11, 2026**. “Active” means the default branch had recent activity or a recent release/tag at the time of verification. A project with an older formal release but newer commits is described that way rather than being called fully current without qualification.

## Selection criteria

Candidates were shortlisted when they proved at least one of the following:

- transparent next-action selection;
- local-first persistence or deterministic repair;
- reliable undo, operation history, or conflict representation;
- explicit human approval around AI/tool execution;
- model-neutral structured jobs and logs;
- resumable work packets with proof;
- low-friction capture or progressive disclosure;
- accessibility and error-recovery patterns;
- provenance-rich evidence without requiring central surveillance.

Projects were downgraded when their primary value depended on:

- a framework or database migration;
- multi-user collaboration KevinOS does not need;
- always-on behavioral surveillance;
- a large autonomous-agent runtime;
- cloud telemetry or hosted control planes;
- gamification pressure;
- a plugin marketplace;
- licenses incompatible with direct reuse;
- product complexity larger than the user problem.

## Limitations

- The supplied KevinOS archive has no Git metadata.
- No live KevinOS deploy, live OAuth consent, real provider call, push delivery, multi-device re-key, or 30 elapsed days of adoption evidence was performed.
- Repository activity and licenses can change after the verification date.
- License analysis here is engineering guidance, not legal advice.
- No recommendation assumes that popularity equals fit.

---

# Landscape map

Forty repositories were reviewed. “Finalist” means a full analysis appears later. “Screened” means the repository contributed context but did not justify deep integration analysis.

## Attention and personal operating systems

| Repository | Screen result | KevinOS lesson or rejection reason |
|---|---|---|
| [ActivityWatch](https://github.com/ActivityWatch/activitywatch) | **Finalist** | Local event buckets, heartbeats, provenance, and privacy; adapt only coarse user-chosen evidence. |
| [Super Productivity](https://github.com/super-productivity/super-productivity) | Screened — LEARN | Useful focus, time-boxing, and review interactions, but the Angular/Electron/mobile product is much larger than KevinOS. |
| [Taskwarrior](https://github.com/GothenburgBitFactory/taskwarrior) | **Finalist** | Transparent urgency factors, waiting/blocked semantics, active work, and a clear “next” report. |
| [Org mode](https://github.com/bzg/org-mode) | Screened — LEARN | Capture/refile, agenda construction, TODO states, and plain-text durability; reject its full configuration surface. |
| [Vikunja](https://github.com/go-vikunja/vikunja) | Screened — REJECT runtime | Mature task collaboration, filters, and views, but server, database, users, permissions, and frontend stack do not fit. |
| [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | Screened — REJECT architecture | Strong local workspace ambition, but Flutter/Rust/cloud collaboration is a replacement product, not a bounded improvement. |
| [Logseq](https://github.com/logseq/logseq) | Screened — LEARN | Daily-journal capture and block references are useful; graph/database complexity and plugin surface are not. |
| [SilverBullet](https://github.com/silverbulletmd/silverbullet) | Screened — LEARN | Keyboard-first commands and local markdown spaces; avoid turning KevinOS into a programmable PKM. |
| [TriliumNext](https://github.com/TriliumNext/Trilium) | Screened — LEARN | Revision history, import/export, and tree navigation; reject server/editor/plugin complexity. |
| [TiddlyWiki5](https://github.com/TiddlyWiki/TiddlyWiki5) | **Finalist** | Self-contained delivery, import staging, saver contracts, backup-first upgrade, record-level filters. |
| [todo.txt-cli](https://github.com/todotxt/todo.txt-cli) | Screened — LEARN | Near-zero-friction capture and portable text; useful as a simplicity ceiling. |
| [Habitica](https://github.com/HabitRPG/habitica) | Screened — REJECT | Demonstrates engagement mechanics, but rewards, punishment, and game pressure conflict with calm daily adoption. |

## Local-first data, recovery, and convergence

| Repository | Screen result | KevinOS lesson or rejection reason |
|---|---|---|
| [Actual Budget](https://github.com/actualbudget/actual) | **Finalist** | Canonical change evidence, explicit sync migrations, derived-state repair, and reset/rebuild workflows. |
| [TaskChampion](https://github.com/GothenburgBitFactory/taskchampion) | **Finalist** | Replica specification, atomic key/value task properties, operation-based sync discipline. |
| [TinyBase](https://github.com/tinyplex/tinybase) | **Finalist** | Store/index/checkpoint/persister separation and deterministic rollback after partial startup. |
| [Automerge](https://github.com/automerge/automerge) | **Finalist** | Conflicts as data, convergence, history, and sync protocol; reject a runtime migration now. |
| [Yjs](https://github.com/yjs/yjs) | Screened — WATCH | Excellent real-time shared editing CRDT; KevinOS does not have a concurrent rich-text problem. |
| [Apache PouchDB](https://github.com/apache/pouchdb) | Screened — REJECT dependency | Proven offline replication, but adopting its database and Couch protocol would replace the current state contract. |
| [RxDB](https://github.com/pubkey/rxdb) | Screened — REJECT dependency | Rich local database and replication plugins; dependency, schema, and runtime surface are disproportionate. |
| [LiveStore](https://github.com/livestorejs/livestore) | Screened — WATCH | Event-sourced local-first ideas are relevant, but the ecosystem is too young and architecture-changing for KevinOS. |
| [Joplin](https://github.com/laurent22/joplin) | Screened — LEARN | Offline notes, sync targets, encryption, revision retention, and import/export; full application architecture is a poor fit. |
| [Jujutsu](https://github.com/jj-vcs/jj) | **Finalist** | Whole-system operation log, inspectable history, undo/redo, restore, and divergent operations. |

## Human-controlled AI and collaborator mission control

| Repository | Screen result | KevinOS lesson or rejection reason |
|---|---|---|
| [Aider](https://github.com/Aider-AI/aider) | **Finalist** | Scoped repository context, repository map, test/lint loop, commits, and undo. |
| [LLM](https://github.com/simonw/llm) | **Finalist** | Model-neutral structured messages, typed parts, resumable approval pauses, and content-addressed logs. |
| [Langfuse](https://github.com/langfuse/langfuse) | Screened — LEARN | Trace/span/evaluation vocabulary is useful; hosted observability and production telemetry are wrong for KevinOS. |
| [Promptfoo](https://github.com/promptfoo/promptfoo) | **Finalist** | Declarative prompts/providers/cases/assertions and local evaluation; reject the dependency-heavy toolchain. |
| [Inspect AI](https://github.com/UKGovernmentBEIS/inspect_ai) | **Finalist** | Task = dataset + solver + scorer, durable logs, and explicit evaluation boundaries. |
| [Label Studio](https://github.com/HumanSignal/label-studio) | **Finalist** | Separates input data, model predictions, human annotations, review state, comments, and timing. |
| [OpenHands](https://github.com/OpenHands/OpenHands) | **Finalist — REJECT** | Typed events and tool boundaries are instructive; the autonomous runtime, sandbox, server, and UI are a bad product fit. |
| [Cline](https://github.com/cline/cline) | Screened — LEARN | Human approval before tool use and visible action plans; VS Code/runtime coupling is unsuitable for KevinOS. |
| [Continue](https://github.com/continuedev/continue) | Screened — LEARN | Model/provider abstraction and context providers; editor extension and agent stack are too broad. |
| [SWE-agent](https://github.com/SWE-agent/SWE-agent) | Screened — LEARN | Bounded issue environments, trajectory logs, and benchmarkable completion; not an in-product runtime candidate. |
| [Apache Burr](https://github.com/apache/burr) | Screened — WATCH | State-machine actions and persistence are relevant to resumable jobs, but a Python workflow dependency is unnecessary. |

## Out-of-the-box pattern sources

| Repository | Screen result | KevinOS lesson or rejection reason |
|---|---|---|
| [Mattermost Playbooks](https://github.com/mattermost/mattermost-plugin-playbooks) | **Finalist** | Playbook templates, run checklists, status updates, timelines, and retrospectives. |
| [eLabFTW](https://github.com/elabftw/elabftw) | **Finalist** | Laboratory templates, revision evidence, timestamps, exports, and audit-oriented records. |
| [HPI](https://github.com/karlicoss/HPI) | **Finalist** | Source adapters, provenance, deduplication, and error-as-data for personal information. |
| [GOV.UK Frontend](https://github.com/alphagov/govuk-frontend) | **Finalist** | Interruption pages, error summaries, confirmation, accessible progressive disclosure, and clear recovery language. |
| [W3C ARIA Authoring Practices](https://github.com/w3c/aria-practices) | Screened — ADAPT | Keyboard/focus/state patterns for dialogs, disclosures, tabs, menus, and error recovery. |
| [NASA F Prime](https://github.com/nasa/fprime) | Screened — LEARN | Commands, events, telemetry, health, and explicit component contracts from flight software. |
| [OpenTelemetry semantic conventions](https://github.com/open-telemetry/semantic-conventions) | Screened — LEARN | Stable event names, timestamps, status, attributes, and source identity for local operation receipts. |

---
# Comparative scorecard

Scores are directional judgments from 1–5. A 5 means unusually strong for KevinOS; it does **not** mean the repository is universally better. No totals are calculated because a high-novelty, low-compatibility project should not outrank a simpler compatible pattern through arithmetic.

**Columns:** Fit = KevinOS product fit; Arch = architectural compatibility; Daily = daily usefulness; Trust = trust/recoverability; Privacy = privacy compatibility; Simple = implementation simplicity; Mobile = mobile/accessibility value; Novel = novelty; Maint = maintainability; License = licensing safety for the recommended transfer.

| Finalist | Class | Fit | Arch | Daily | Trust | Privacy | Simple | Mobile | Novel | Maint | License |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ActivityWatch | ADAPT | 4 | 4 | 4 | 3 | 5 | 3 | 3 | 4 | 4 | 3 |
| Actual Budget | ADAPT | 5 | 3 | 4 | 5 | 5 | 2 | 3 | 4 | 5 | 5 |
| Taskwarrior | ADAPT | 5 | 5 | 5 | 3 | 5 | 4 | 2 | 4 | 5 | 5 |
| TaskChampion | LEARN | 4 | 3 | 3 | 5 | 5 | 2 | 1 | 4 | 5 | 5 |
| TiddlyWiki5 | ADAPT | 4 | 5 | 4 | 4 | 5 | 4 | 4 | 4 | 5 | 5 |
| TinyBase | ADAPT | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 5 | 5 | 5 |
| Automerge | WATCH | 3 | 1 | 3 | 5 | 5 | 1 | 2 | 5 | 5 | 5 |
| Jujutsu | ADAPT | 4 | 3 | 4 | 5 | 5 | 3 | 2 | 5 | 5 | 5 |
| Aider | ADAPT | 4 | 2 | 4 | 4 | 3 | 3 | 2 | 5 | 4 | 5 |
| LLM | ADAPT | 5 | 3 | 5 | 4 | 4 | 4 | 3 | 5 | 5 | 5 |
| Promptfoo | ADAPT | 5 | 3 | 5 | 4 | 4 | 4 | 3 | 4 | 5 | 5 |
| Inspect AI | ADAPT | 5 | 2 | 5 | 5 | 4 | 3 | 3 | 5 | 5 | 5 |
| Label Studio | LEARN | 4 | 2 | 4 | 4 | 3 | 3 | 4 | 4 | 5 | 5 |
| Mattermost Playbooks | ADAPT | 5 | 2 | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 4 |
| eLabFTW | LEARN | 4 | 2 | 4 | 5 | 4 | 3 | 3 | 5 | 5 | 2 |
| HPI | ADAPT | 4 | 3 | 4 | 4 | 5 | 3 | 2 | 5 | 3 | 5 |
| GOV.UK Frontend | ADAPT | 5 | 4 | 5 | 4 | 5 | 4 | 5 | 3 | 5 | 5 |
| OpenHands | REJECT | 2 | 1 | 2 | 3 | 2 | 1 | 2 | 4 | 4 | 5 |

## How to read the scores

- **Highest practical fit:** Taskwarrior, Actual Budget, LLM, Promptfoo, Inspect AI, Mattermost Playbooks, and GOV.UK Frontend each address a current KevinOS contract gap.
- **Highest architectural danger despite strong ideas:** Automerge and OpenHands. Their lessons are valuable; their runtimes are not.
- **Highest licensing caution:** ActivityWatch because MPL-2.0 is file-level copyleft; eLabFTW because AGPL-3.0 is network copyleft; Mattermost because its `server/enterprise` tree uses a separate source-available license.
- **Best code-donor licenses:** MIT, Apache-2.0, and TiddlyWiki's three-clause BSD text are permissive, but direct copying is still rarely the best move for a dependency-free ES5 application.

## Score rationale by finalist

| Finalist | Why the pattern scored this way for KevinOS |
|---|---|
| ActivityWatch | Strong privacy-aware evidence and provenance; reduced for MPL copying risk and the danger of sliding from explicit evidence into surveillance. |
| Actual Budget | Excellent repair, migration, and local-first trust patterns; reduced for CRDT/database complexity that should not enter KevinOS. |
| Taskwarrior | The closest fit for transparent attention reasons and deterministic next-action logic; weaker mobile/accessibility transfer because it is CLI-first. |
| TaskChampion | Exceptional synchronization specification and operation discipline; lower daily usefulness and simplicity because it is a Rust library, not a user interaction model. |
| TiddlyWiki5 | Extremely compatible self-contained delivery and import/backup thinking; less direct impact on NOW and AI proof. |
| TinyBase | Strong canonical/derived/checkpoint separation with permissive licensing; installing it would still create a second state framework. |
| Automerge | Best-in-class convergence and conflict concepts; lowest architecture/simplicity scores because a CRDT migration would be disproportionate. |
| Jujutsu | Outstanding operation history, restore, and undo model; integration is cross-cutting and its CLI/VCS interface has little mobile value. |
| Aider | Highly useful scope maps, test loops, and handoffs; lower architecture/privacy fit because the actual tool is a repository-editing Python agent. |
| LLM | Very close match for model-neutral receipts, structured messages, and approval pauses; reduced only because its Python/plugin runtime should not be embedded. |
| Promptfoo | Excellent declarative test and assertion vocabulary; reduced architecture score because the current Node toolchain is large and unnecessary. |
| Inspect AI | Strongest evaluation boundary and durable log discipline; lower direct compatibility because it is a substantial Python evaluation framework. |
| Label Studio | Clear model-output versus human-review separation; lower simplicity/privacy scores because it is a multi-user annotation platform. |
| Mattermost Playbooks | Excellent mission template/run/checklist/retrospective fit; lower architecture and licensing scores because it is a Go/React team plugin with a mixed-license subtree. |
| eLabFTW | Excellent evidence, revision, and experiment-record discipline; direct reuse is constrained by AGPL and server architecture. |
| HPI | Strong source provenance, deduplication, and partial-error patterns; lower maintainability score because its personal adapter ecosystem is deliberately heterogeneous. |
| GOV.UK Frontend | Highest accessibility and high-stakes interaction fit with small independent implementation cost; novelty is intentionally modest. |
| OpenHands | Typed events are useful, but the autonomous runtime conflicts with nearly every KevinOS architectural and authority boundary. |

---

# Deep repository analyses

## 1. ActivityWatch

**Repository:** [ActivityWatch/activitywatch](https://github.com/ActivityWatch/activitywatch)  
**Classification:** **ADAPT** the event contract; do not install or copy the full tracker.

### Verified facts

- **License:** MPL-2.0.
- **Activity:** the meta repository was active at reviewed commit [`25e34c71882fd4cf054731bf7f74ca92b934b0d6`](https://github.com/ActivityWatch/activitywatch/commit/25e34c71882fd4cf054731bf7f74ca92b934b0d6) on August 6, 2026. The current research prerelease reviewed was [`v0.14.0b3-research`](https://github.com/ActivityWatch/activitywatch/releases/tag/v0.14.0b3-research), published August 6, 2026.
- **Problem solved:** private, local collection and analysis of computer activity.
- **Architecture:** a meta repository coordinates a local server, web UI, and independent watchers. Events are stored in source-specific **buckets**. A bucket declares its event type and source. Adjacent events with identical data can be merged through **heartbeats**.

### What it actually proves

ActivityWatch proves that behavioral evidence becomes more trustworthy when every event has a clear source, type, timestamp, duration, and local ownership. Its heartbeat model also proves that repeated identical observations can be compacted deterministically.

It does **not** prove that KevinOS should monitor applications, window titles, browser URLs, files, or idle status. Those data are useful for ActivityWatch's purpose but excessive for KevinOS.

### Exact KevinOS weakness addressed

KevinOS has a 30-day adoption scorecard and `roomStats`, but little in-product evidence about whether NOW, capture, AI proposals, and recovery are helping. The risk is either continuing without evidence or overcorrecting with surveillance.

### Specific targets worth studying

- [ActivityWatch data model: buckets, events, and heartbeats](https://docs.activitywatch.net/en/latest/buckets-and-events.html)
- [ActivityWatch architecture documentation](https://docs.activitywatch.net/en/latest/architecture.html)
- [`aw-core`](https://github.com/ActivityWatch/aw-core), especially event schemas and heartbeat merging
- the reviewed [meta-repository README](https://github.com/ActivityWatch/activitywatch/blob/25e34c71882fd4cf054731bf7f74ca92b934b0d6/README.md)

### Smallest compatible KevinOS implementation

Add a device-local, bounded `adoptionEvidence` bucket containing only explicit KevinOS events:

```text
now.opened
focus.overridden
capture.completed
capture.abandoned
task.completed_from_now
ai.reviewed
ai.applied
recovery.checked
friction.marked
```

Each event should contain only:

```text
id, type, source="kevinos", timestamp, durationBucket?, targetKind?, outcome?
```

Merge consecutive identical events within a fixed window. Keep 30 days or a maximum of 500 events. Never record task text, window titles, URLs, keystrokes, email content, calendar details, or external application activity.

### User-facing improvement

The weekly review could say, for example, “NOW was used on 5 days; focus was overridden twice; 4 tasks were completed directly from NOW; capture friction was marked once.” That is enough to improve the product without turning Kevin into a data subject.

### Data, privacy, security, and migration

- Prefer device-local storage for the first experiment.
- Export only aggregate counts unless Kevin explicitly approves portable raw events.
- No relay transmission and no analytics SDK.
- A new device-local side store requires no schema bump.
- If later made portable, add an explicit state classification and retention rule first.

### Testing strategy

- deterministic heartbeat merge;
- retention cap and expiration;
- no event payload contains user content;
- disabled-by-default path records nothing;
- aggregate report is identical for the same events;
- private mode/delete clears the bucket;
- browser check at 320px and 390px for the weekly summary.

### Cost and maintenance

**Cost:** small to medium. **Ongoing burden:** low if the event vocabulary remains fixed and local.

### Failure modes and reasons not to proceed

- event creep turns into surveillance;
- metrics become a score or punishment system;
- raw evidence syncs unintentionally;
- the app optimizes for usage frequency rather than useful outcomes;
- Kevin spends more time reviewing analytics than acting.

**Proceed only with a hard content-minimization contract.**

### Sources

- [Repository](https://github.com/ActivityWatch/activitywatch)
- [Research prerelease](https://github.com/ActivityWatch/activitywatch/releases/tag/v0.14.0b3-research)
- [Reviewed commit](https://github.com/ActivityWatch/activitywatch/commit/25e34c71882fd4cf054731bf7f74ca92b934b0d6)
- [Data model](https://docs.activitywatch.net/en/latest/buckets-and-events.html)
- [Documentation](https://docs.activitywatch.net/)

---

## 2. Actual Budget

**Repository:** [actualbudget/actual](https://github.com/actualbudget/actual)  
**Classification:** **ADAPT** repair, migration, and canonical-evidence patterns; do not adopt its CRDT package.

### Verified facts

- **License:** MIT.
- **Activity:** current release [`v26.8.1`](https://github.com/actualbudget/actual/releases/tag/v26.8.1) was published August 7, 2026; the reviewed default-branch commit was [`435f2d51ee312ed9a6925bad506fc3b7132d8017`](https://github.com/actualbudget/actual/commit/435f2d51ee312ed9a6925bad506fc3b7132d8017) on August 11, 2026.
- **Problem solved:** local-first personal finance with optional multi-device sync.
- **Architecture:** a TypeScript monorepo with a local client database, a shared CRDT/message layer, sync server support, explicit migrations, and repair/reset utilities.

### What it actually proves

Actual Budget proves that a local-first application can treat one durable evidence stream as canonical and rebuild derived sync structures from it. Its repair code reconstructs a Merkle trie by replaying timestamps from canonical CRDT messages rather than trusting a possibly corrupt index. Its migration code emits explicit timestamped messages instead of silently mutating synchronized state.

Its own CRDT README warns that external use is undocumented and risky. That is important evidence **against** installing the package into KevinOS.

### Exact KevinOS weakness addressed

KevinOS recovery is strong at the document and snapshot level, but it lacks a first-class “verify and rebuild derived state” command. `roomStats`, summaries, caches, focus displays, and future operation indexes should be reproducible from canonical content rather than restored blindly when corruption is suspected.

### Specific targets worth studying

- [`packages/crdt/README.md`](https://github.com/actualbudget/actual/blob/435f2d51ee312ed9a6925bad506fc3b7132d8017/packages/crdt/README.md)
- [`packages/loot-core/src/server/sync/repair.ts`](https://github.com/actualbudget/actual/blob/435f2d51ee312ed9a6925bad506fc3b7132d8017/packages/loot-core/src/server/sync/repair.ts)
- [`packages/loot-core/src/server/sync/migrate.ts`](https://github.com/actualbudget/actual/blob/435f2d51ee312ed9a6925bad506fc3b7132d8017/packages/loot-core/src/server/sync/migrate.ts)
- [`packages/loot-core/src/server/sync/reset.ts`](https://github.com/actualbudget/actual/blob/435f2d51ee312ed9a6925bad506fc3b7132d8017/packages/loot-core/src/server/sync/reset.ts)

### Smallest compatible KevinOS implementation

Add a read-only **State Integrity Check** that:

1. builds `portableDoc(state)`;
2. validates collection types, IDs, tombstones, update stamps, connection exclusion, and referenced project/task IDs;
3. recomputes derived counts and fingerprints;
4. reports repairable metadata separately from content problems;
5. offers a safe “rebuild derived metadata” action only for known derived fields;
6. creates a pre-repair snapshot and a receipt.

Do not change the existing merge model in this slice.

### User-facing improvement

System Health can answer “Your content is intact; two derived counters were rebuilt” instead of offering only broad backup/sync status.

### Data, privacy, security, and migration

- Runs entirely in-browser.
- Never sends content to the relay.
- Content arrays remain canonical.
- Derived-only repair should not require a schema bump.
- Any future canonical operation stream would require a separate approved state decision.

### Testing strategy

- malformed `roomStats`, `sweepLog`, and cached data are detected and safely rebuilt;
- content arrays are never changed by derived repair;
- connection fields remain untouched;
- a pre-repair snapshot is created;
- repeated repair is idempotent;
- portable, merge, convergence, and corruption-blocking tests remain green.

### Cost and maintenance

**Cost:** medium. **Ongoing burden:** medium because each new derived field must declare whether it can be rebuilt.

### Failure modes and reasons not to proceed

- incorrectly labeling canonical data as derived;
- repair silently deleting unknown fields;
- giving a green “healthy” result without full coverage;
- using the feature to justify a CRDT migration;
- restoring derived values from an untrusted backup instead of rebuilding them.

### Sources

- [Repository](https://github.com/actualbudget/actual)
- [Release v26.8.1](https://github.com/actualbudget/actual/releases/tag/v26.8.1)
- [Reviewed commit](https://github.com/actualbudget/actual/commit/435f2d51ee312ed9a6925bad506fc3b7132d8017)
- [CRDT package warning](https://github.com/actualbudget/actual/blob/435f2d51ee312ed9a6925bad506fc3b7132d8017/packages/crdt/README.md)
- [Repair implementation](https://github.com/actualbudget/actual/blob/435f2d51ee312ed9a6925bad506fc3b7132d8017/packages/loot-core/src/server/sync/repair.ts)

---

## 3. Taskwarrior

**Repository:** [GothenburgBitFactory/taskwarrior](https://github.com/GothenburgBitFactory/taskwarrior)  
**Classification:** **ADAPT** transparent factors and explicit focus semantics.

### Verified facts

- **License:** MIT.
- **Activity:** reviewed release [`v3.4.2`](https://github.com/GothenburgBitFactory/taskwarrior/releases/tag/v3.4.2), published October 21, 2025; reviewed default-branch commit [`74bd22ad53125a6d3f00d4ab65a28c165578d54a`](https://github.com/GothenburgBitFactory/taskwarrior/commit/74bd22ad53125a6d3f00d4ab65a28c165578d54a) dated August 10, 2026.
- **Problem solved:** durable command-line task management with filters, reports, dependencies, waiting, recurrence, and a calculated “next” order.
- **Architecture:** C++ core with task records, reports, configuration, hooks, JSON import/export, and TaskChampion-backed synchronization.

### What it actually proves

Taskwarrior proves that a next-action engine can be transparent. Its urgency is a polynomial of named factors such as `next`, due date, blocking, priority, scheduled, active, age, waiting, and blocked status. The documentation explicitly says urgency is an approximation, not truth, and recommends small adjustments based on real use.

The transferable principle is not the numeric formula. It is that every influence is named, inspectable, and reversible.

### Exact KevinOS weakness addressed

KevinOS's NOW order is deterministic but unexplained. It also conflates explicit focus with task array order.

### Specific targets worth studying

- [Urgency documentation](https://taskwarrior.org/docs/urgency/)
- [Task representation](https://taskwarrior.org/docs/task/)
- [Best practices](https://taskwarrior.org/docs/best-practices/)
- [Task configuration manual](https://taskwarrior.org/docs/man/taskrc.5/)
- source areas related to urgency, reports, and task state in the reviewed repository

### Smallest compatible KevinOS implementation

Add optional fields to task records:

```text
focusDate: "YYYY-MM-DD"
focusRank: 1 | 2 | 3
focusSetAt: epochMs
focusSource: "manual" | "onboarding"
```

Then:

1. create `focusItems()` that starts from `windItems()`;
2. place current-day explicit ranks first;
3. preserve current `state.items` order as the deterministic fallback;
4. make `moveFocusTask()` swap focus ranks, not task records;
5. call `touch()` on changed tasks so the decision syncs;
6. return named `attentionReasons` from `nowModel()`.

Initial reason codes should stay simple:

```text
manual-focus
marked-today
overdue
due-today
project-next-action
fallback-order
```

Do not expose a composite score. Do not let AI set focus rank.

### User-facing improvement

NOW can display a quiet line such as:

```text
Why now: chosen first · due today · next action is ready
```

Reordering focus no longer changes unrelated task storage order.

### Data, privacy, security, and migration

- Uses optional nested fields in existing task records.
- Old records remain valid; schema can stay v39.
- Fields are portable and synced through existing item records.
- No new external data or relay behavior.
- Manual decisions remain visibly owned by Kevin.

### Testing strategy

- moving focus does not reorder `state.items`;
- focus ranks survive save, export/import, merge, and three-device convergence;
- duplicate or invalid ranks normalize deterministically;
- deleted/completed/ineligible ranked tasks are ignored;
- stale `focusDate` values do not affect a new day;
- fallback order exactly matches current behavior when no explicit ranks exist;
- reason codes are stable for fixed state and time;
- 320px/390px NOW remains calm and readable.

### Cost and maintenance

**Cost:** small to medium. **Ongoing burden:** low if the factor set stays deliberately small.

### Failure modes and reasons not to proceed

- adding too many factors until the receipt becomes another dashboard;
- turning factors into an opaque score;
- allowing AI or behavior tracking to silently rank tasks;
- ranking blocked work above an executable physical action;
- changing fallback behavior and surprising existing users.

### Sources

- [Repository](https://github.com/GothenburgBitFactory/taskwarrior)
- [Release v3.4.2](https://github.com/GothenburgBitFactory/taskwarrior/releases/tag/v3.4.2)
- [Reviewed commit](https://github.com/GothenburgBitFactory/taskwarrior/commit/74bd22ad53125a6d3f00d4ab65a28c165578d54a)
- [Urgency](https://taskwarrior.org/docs/urgency/)
- [Best practices](https://taskwarrior.org/docs/best-practices/)

---

## 4. TaskChampion

**Repository:** [GothenburgBitFactory/taskchampion](https://github.com/GothenburgBitFactory/taskchampion)  
**Classification:** **LEARN** from its replica and atomic-property contracts; do not add the Rust library.

### Verified facts

- **License:** MIT.
- **Activity:** reviewed release [`v3.1.0`](https://github.com/GothenburgBitFactory/taskchampion/releases/tag/v3.1.0), published May 30, 2026; reviewed commit [`314dcf7e2cbd5a1f63e3fc945b2866ee870eac05`](https://github.com/GothenburgBitFactory/taskchampion/commit/314dcf7e2cbd5a1f63e3fc945b2866ee870eac05) dated August 9, 2026.
- **Problem solved:** storage and synchronization engine behind Taskwarrior.
- **Architecture:** a Rust library with C bindings, a replica abstraction, task records represented as key/value properties, local storage backends, and synchronization operations.

### What it actually proves

TaskChampion proves the value of specifying the replica behavior independently from a user interface. It also demonstrates that independently mergeable atomic properties are safer than packing multiple meanings into one string or array. Its documentation warns that synchronized changes are not automatically equivalent to user-facing undo.

### Exact KevinOS weakness addressed

KevinOS has strong tests around whole-record `u` timestamps and merges, but future additions such as focus order, AI receipts, and mission proof can accidentally create nested atomicity problems. For example, replacing a whole acceptance-checklist array from another device could erase a local checklist update.

### Specific targets worth studying

- [Reviewed README](https://github.com/GothenburgBitFactory/taskchampion/blob/314dcf7e2cbd5a1f63e3fc945b2866ee870eac05/README.md)
- [`src/replica.rs`](https://github.com/GothenburgBitFactory/taskchampion/blob/314dcf7e2cbd5a1f63e3fc945b2866ee870eac05/src/replica.rs)
- [`src/taskdb/sync.rs`](https://github.com/GothenburgBitFactory/taskchampion/blob/314dcf7e2cbd5a1f63e3fc945b2866ee870eac05/src/taskdb/sync.rs)
- [`src/task/task.rs`](https://github.com/GothenburgBitFactory/taskchampion/blob/314dcf7e2cbd5a1f63e3fc945b2866ee870eac05/src/task/task.rs)
- [`src/task/data.rs`](https://github.com/GothenburgBitFactory/taskchampion/blob/314dcf7e2cbd5a1f63e3fc945b2866ee870eac05/src/task/data.rs)

### Smallest compatible KevinOS implementation

Do not change sync. Add design rules and tests for new nested records:

- every checklist/attempt/evidence item gets its own stable ID and `u` timestamp;
- list elements are merged by ID when they need independent concurrency;
- scalar fields remain whole-field last-write-wins;
- sync and Undo are documented as different mechanisms;
- all new portable state gets a replica-style convergence fixture.

### User-facing improvement

Kevin can update one mission acceptance item on one device without another device replacing the entire checklist. Proof stays intact and conflicts become explainable.

### Data, privacy, security, and migration

- No new dependency or service.
- No Rust/WASM bridge.
- Optional nested IDs fit schema v39.
- Adds test burden but not user data exposure.

### Testing strategy

- concurrent checklist item updates converge;
- adding different items on two devices preserves both;
- same-item ties follow the documented rule;
- deletion uses item-level tombstones or a deliberate parent-record replacement rule;
- sync result is not presented as Undo;
- three-device fixtures include nested mission and AI records.

### Cost and maintenance

**Cost:** small as a contract, large as a runtime dependency. **Recommended burden:** small.

### Failure modes and reasons not to proceed

- recreating TaskChampion inside KevinOS;
- adding operation-based sync without a demonstrated failure in current sync;
- pretending field-level merge removes all semantic conflicts;
- proliferating IDs and tombstones for fields that do not need independent editing.

### Sources

- [Repository](https://github.com/GothenburgBitFactory/taskchampion)
- [Release v3.1.0](https://github.com/GothenburgBitFactory/taskchampion/releases/tag/v3.1.0)
- [Reviewed commit](https://github.com/GothenburgBitFactory/taskchampion/commit/314dcf7e2cbd5a1f63e3fc945b2866ee870eac05)
- [Replica source](https://github.com/GothenburgBitFactory/taskchampion/blob/314dcf7e2cbd5a1f63e3fc945b2866ee870eac05/src/replica.rs)

---

## 5. TiddlyWiki5

**Repository:** [TiddlyWiki/TiddlyWiki5](https://github.com/TiddlyWiki/TiddlyWiki5)  
**Classification:** **ADAPT** import, saver, and upgrade interactions; do not add its plugin/runtime model.

### Verified facts

- **License:** the root [`license`](https://github.com/TiddlyWiki/TiddlyWiki5/blob/40b353bd0e7ed5a2f8103277f4600726b8ea317a/license) file contains the three-clause BSD license text. GitHub metadata did not assign a standard SPDX identifier at verification time.
- **Activity:** reviewed commit [`40b353bd0e7ed5a2f8103277f4600726b8ea317a`](https://github.com/TiddlyWiki/TiddlyWiki5/commit/40b353bd0e7ed5a2f8103277f4600726b8ea317a) dated August 11, 2026.
- **Problem solved:** a self-contained, extensible personal wiki that can run as a single HTML file or under Node.js.
- **Architecture:** records called tiddlers, a filter pipeline, import/deserialization, saver modules, plugins, browser storage/download paths, and upgrade workflows.

### What it actually proves

TiddlyWiki proves that a single-file application can have serious data portability, import staging, and upgrade ergonomics. Its self-contained delivery model is evidence that KevinOS's one-file architecture is viable rather than primitive.

### Exact KevinOS weakness addressed

KevinOS already has a dry-run import report, but recovery could become more legible with record-level staging, explicit add/update/ignore categories, and a backup-first upgrade/recovery narrative.

### Specific targets worth studying

- [TiddlyWiki documentation](https://tiddlywiki.com/)
- [Importing Tiddlers](https://tiddlywiki.com/static/Importing%2520Tiddlers.html)
- [Upgrading](https://tiddlywiki.com/static/Upgrading.html)
- [Savers](https://tiddlywiki.com/static/Saver.html)
- [Filters](https://tiddlywiki.com/static/Filters.html)
- source under [`core/modules/deserializers`](https://github.com/TiddlyWiki/TiddlyWiki5/tree/40b353bd0e7ed5a2f8103277f4600726b8ea317a/core/modules/deserializers) and [`core/modules/savers`](https://github.com/TiddlyWiki/TiddlyWiki5/tree/40b353bd0e7ed5a2f8103277f4600726b8ea317a/core/modules/savers)

### Smallest compatible KevinOS implementation

Extend the existing import dry run with a staged table:

```text
Add: 12
Update: 3
Unchanged: 144
Ignored unknown fields: 2
Connections preserved: yes
```

Allow inspection of a small sample of changed records and make the final action read “Create snapshot and import 15 changes.” Do not add a generic plugin system or wiki record model.

### User-facing improvement

Restore/import becomes less frightening because Kevin can see the exact class of change before state replacement.

### Data, privacy, security, and migration

- Parsing remains local.
- Render all imported text through existing escaping/text-node paths.
- Never preview secrets because connections are excluded.
- No state schema change is needed for a richer preview.
- Keep raw corrupt bytes unchanged in the corruption recovery path.

### Testing strategy

- deterministic add/update/unchanged counts;
- unknown/newer fields are reported without execution;
- no imported string can create markup or selector injection;
- connections stay unchanged after import;
- pre-import snapshot always precedes state mutation;
- cancel leaves state byte-identical;
- mobile preview remains readable and keyboard accessible.

### Cost and maintenance

**Cost:** small. **Ongoing burden:** low.

### Failure modes and reasons not to proceed

- turning import into a complex merge editor;
- showing sensitive content unnecessarily;
- implying that a count-only preview proves semantic compatibility;
- copying TiddlyWiki plugin/runtime code when simple local logic is enough.

### Sources

- [Repository](https://github.com/TiddlyWiki/TiddlyWiki5)
- [Reviewed commit](https://github.com/TiddlyWiki/TiddlyWiki5/commit/40b353bd0e7ed5a2f8103277f4600726b8ea317a)
- [License text](https://github.com/TiddlyWiki/TiddlyWiki5/blob/40b353bd0e7ed5a2f8103277f4600726b8ea317a/license)
- [Official documentation](https://tiddlywiki.com/)

---

## 6. TinyBase

**Repository:** [tinyplex/tinybase](https://github.com/tinyplex/tinybase)  
**Classification:** **ADAPT** bounded checkpoint, index, and rollback contracts; **WATCH** the dependency.

### Verified facts

- **License:** MIT.
- **Activity:** current release [`v9.4.0`](https://github.com/tinyplex/tinybase/releases/tag/v9.4.0) was published August 8, 2026; reviewed commit [`a404aa9c961b01374dd7fcc5a342cee418c612e2`](https://github.com/tinyplex/tinybase/commit/a404aa9c961b01374dd7fcc5a342cee418c612e2) dated August 8, 2026.
- **Problem solved:** reactive local structured data with derived metrics/indexes, checkpoints, persistence, and optional synchronization.
- **Architecture:** modular Store, Metrics, Indexes, Relationships, Queries, Checkpoints, Persisters, MergeableStore, and Synchronizers APIs.

### What it actually proves

TinyBase proves the value of keeping canonical state, derived views, checkpoints, and persistence adapters separate even inside a small local-first system. Its current release notes emphasize deterministic collision behavior, explicit migration for ambiguous persistence names, and rollback after partial startup failures.

### Exact KevinOS weakness addressed

KevinOS computes many views directly from a large state object. That is appropriate now, but new attention receipts, local evidence, and operation history could accidentally create hidden derived state or startup ordering bugs.

### Specific targets worth studying

- [TinyBase documentation](https://tinybase.org/)
- [Store API](https://tinybase.org/api/store/)
- [Indexes](https://tinybase.org/api/indexes/)
- [Checkpoints](https://tinybase.org/api/checkpoints/)
- [Persisters](https://tinybase.org/api/persisters/)
- [MergeableStore](https://tinybase.org/api/mergeable-store/)
- [Release v9.4.0](https://github.com/tinyplex/tinybase/releases/tag/v9.4.0)

### Smallest compatible KevinOS implementation

Do not replace `state`. Create a plain-ES5 **derived view contract**:

```text
canonical inputs
compute function
fingerprint
last computed at
repair/recompute function
```

Use it first for one bounded view, such as an attention-reason index or local evidence aggregate. Add a checkpoint before any derived-data migration and roll back if initialization fails.

### User-facing improvement

System Health can distinguish “content saved” from “derived view rebuilt,” and a failed startup enhancement can fall back safely instead of blocking the app.

### Data, privacy, security, and migration

- Reimplement in ES5; no npm package.
- Derived output must be discardable.
- Canonical content stays in current state.
- No schema bump for device-local indexes.
- A portable derived object should be rejected unless it saves material work and has repair tests.

### Testing strategy

- same canonical input yields the same derived fingerprint;
- corrupt derived data is ignored and recomputed;
- partial initialization restores the previous checkpoint;
- app works with the derived feature disabled;
- no canonical write occurs during read-only computation;
- performance with 1,000 tasks and 500 notes remains within the existing baseline envelope.

### Cost and maintenance

**Cost:** small for one view; high if generalized into a second framework. **Ongoing burden:** low only with a strict one-use-case limit.

### Failure modes and reasons not to proceed

- building an internal reactive database abstraction;
- keeping duplicate canonical and derived fields that drift;
- importing the library and its modern JavaScript assumptions;
- optimizing before a measured performance problem exists.

### Sources

- [Repository](https://github.com/tinyplex/tinybase)
- [Release v9.4.0](https://github.com/tinyplex/tinybase/releases/tag/v9.4.0)
- [Reviewed commit](https://github.com/tinyplex/tinybase/commit/a404aa9c961b01374dd7fcc5a342cee418c612e2)
- [Official documentation](https://tinybase.org/)

---

## 7. Automerge

**Repository:** [automerge/automerge](https://github.com/automerge/automerge)  
**Classification:** **WATCH** the runtime; **ADAPT** conflict-as-data and convergence tests.

### Verified facts

- **License:** MIT.
- **Activity:** reviewed commit [`e4f9420a63b5ebfd079de7f22a852c2abb6e2774`](https://github.com/automerge/automerge/commit/e4f9420a63b5ebfd079de7f22a852c2abb6e2774) dated August 10, 2026; current JavaScript release [`v3.4.0`](https://github.com/automerge/automerge/releases/tag/js%2Fautomerge-3.4.0) was published July 31, 2026.
- **Problem solved:** automatic convergence of independently edited JSON-like documents, including offline edits and concurrent changes.
- **Architecture:** a Rust CRDT core with JavaScript/WASM and other bindings. Documents contain actor-attributed changes and causal history. Sync peers exchange compact protocol messages based on known heads rather than replacing whole documents.

### What it actually proves

Automerge proves that concurrent state can converge without a central lock and that irreconcilable same-field edits can remain inspectable instead of being silently discarded. It also proves the testing value of permutation, replay, and convergence properties.

It does **not** remove application responsibilities for transport security, authorization, schema migration, user-facing conflict meaning, storage limits, or destructive-operation policy. A CRDT can preserve both edits and still leave the product unable to explain which value should drive NOW.

### Exact KevinOS weakness addressed

KevinOS intentionally resolves equal-update ties in favor of remote state. That is deterministic and currently acceptable, but it can conceal a meaningful ambiguity if two devices update the same high-value field within the same timestamp envelope. The immediate opportunity is better conflict evidence, not a CRDT replacement.

### Specific targets worth studying

- [`rust/automerge/src/sync.rs`](https://github.com/automerge/automerge/blob/e4f9420a63b5ebfd079de7f22a852c2abb6e2774/rust/automerge/src/sync.rs) for peer sync-state and message exchange;
- the [Automerge sync documentation](https://automerge.org/docs/reference/sync/);
- the [conflicts documentation](https://automerge.org/docs/reference/documents/conflicts/);
- the [change and history APIs](https://automerge.org/docs/reference/documents/changes/);
- repository convergence and fuzz tests.

### Smallest compatible KevinOS implementation

Create an isolated **ambiguity fixture layer** in tests and, only for a narrow list of high-value fields, an optional conflict receipt:

```text
conflictId
recordKind
recordId
field
localValueFingerprint
remoteValueFingerprint
localUpdatedAt
remoteUpdatedAt
resolutionRule
resolvedValueFingerprint
resolvedAt
resolvedBy
```

Start with test-only fixtures for:

- same task title changed on two devices;
- task completed on one device and edited on another;
- project next action changed concurrently;
- proposal edited locally while another device rejects it;
- tombstone competing with a stale edit.

Only surface a user-visible conflict card when KevinOS cannot apply its documented rule without losing materially different content. Routine newer-wins merges should remain quiet.

### User-facing improvement

A rare conflict would say what happened in plain language: “Two devices changed this next action before syncing. KevinOS kept the newer version and preserved the other text for review.” Kevin sees evidence without being forced into a merge editor for every sync.

### Data, privacy, security, and migration

- Do not add Automerge, WASM, actor IDs, or its binary document format to production.
- Conflict fingerprints should avoid duplicating full private content in logs.
- If alternate text must be retained, keep it inside the existing encrypted/local content boundary and expire it after resolution.
- Test-only fixtures require no state change.
- A portable conflict collection would require an explicit allowlist decision and likely a schema migration; do not add it until real-world evidence justifies it.

### Testing strategy

- run every two-device operation permutation and assert the same final portable document;
- repeat with three devices and randomized delivery order;
- verify tombstones cannot be defeated by stale edits;
- verify equal-value concurrent edits do not create noise;
- verify materially different concurrent values either follow the documented rule or produce exactly one conflict receipt;
- verify resolving a conflict converges and does not resurrect the alternate value;
- verify malformed conflict metadata is ignored without blocking content load.

### Cost and maintenance

**Cost:** small for test fixtures; medium for a bounded conflict receipt; extreme for a runtime migration. **Ongoing burden:** low only if the production feature remains rare and field-limited.

### Failure modes and reasons not to proceed

- CRDT enthusiasm causes a full state rewrite without a real concurrent-editing need;
- conflict cards appear for harmless merges and reduce trust;
- alternate private content becomes a second unbounded archive;
- a binary/runtime dependency makes backup inspection harder;
- developers assume convergence equals semantic correctness.

**Do not migrate KevinOS to Automerge during the next evolution.** Revisit only if simultaneous multi-device editing becomes a frequent, observed problem that the current optimistic merge cannot solve.

### Sources

- [Repository](https://github.com/automerge/automerge)
- [Release v3.4.0](https://github.com/automerge/automerge/releases/tag/js%2Fautomerge-3.4.0)
- [Reviewed commit](https://github.com/automerge/automerge/commit/e4f9420a63b5ebfd079de7f22a852c2abb6e2774)
- [Official documentation](https://automerge.org/docs/)
- [Sync implementation](https://github.com/automerge/automerge/blob/e4f9420a63b5ebfd079de7f22a852c2abb6e2774/rust/automerge/src/sync.rs)

---

## 8. Jujutsu

**Repository:** [jj-vcs/jj](https://github.com/jj-vcs/jj)  
**Classification:** **ADAPT** the operation-log and targeted-restore contract; do not embed the VCS.

### Verified facts

- **License:** Apache-2.0.
- **Activity:** reviewed commit [`f4c039309fb6a4f1935eb1d9d3eb8dc465c40259`](https://github.com/jj-vcs/jj/commit/f4c039309fb6a4f1935eb1d9d3eb8dc465c40259) dated August 11, 2026; current release [`v0.44.0`](https://github.com/jj-vcs/jj/releases/tag/v0.44.0) was published August 6, 2026.
- **Problem solved:** a Git-compatible version-control system with first-class change identity, automatic working-copy snapshots, and recovery from nearly every command.
- **Architecture:** a Rust CLI and library built around commits plus a separate **operation store**. Each modifying command records an operation containing the resulting repository view and metadata. `jj op log`, `jj op show`, `jj undo`, `jj op revert`, and `jj op restore` expose and reverse those operations.

### What it actually proves

Jujutsu proves that an application becomes calmer when “what the system did” is a first-class object independent of the content history itself. A user can inspect operations, identify the command that produced a state, restore a prior view, or reverse an earlier operation without pretending the latest state never existed.

The most relevant idea is not version control. It is the separation among:

- canonical content;
- an operation receipt;
- a view before and after the operation;
- human-readable cause and status;
- targeted inverse or restore behavior.

### Exact KevinOS weakness addressed

KevinOS has snapshots and several feature-specific Undo paths but no shared record of important actions. When a restore, import, merge, AI application, project archive, or focus change surprises Kevin, System Health cannot yet answer:

- What changed?
- Which surface or actor initiated it?
- What records were affected?
- Did it sync?
- Can only that operation be reversed?

### Specific targets worth studying

- [Operation log documentation](https://jj-vcs.github.io/jj/latest/operation-log/);
- [`cli/src/commands/operation/log.rs`](https://github.com/jj-vcs/jj/tree/f4c039309fb6a4f1935eb1d9d3eb8dc465c40259/cli/src/commands/operation);
- [`lib/src/op_store.rs`](https://github.com/jj-vcs/jj/blob/f4c039309fb6a4f1935eb1d9d3eb8dc465c40259/lib/src/op_store.rs);
- [`lib/src/operation.rs`](https://github.com/jj-vcs/jj/blob/f4c039309fb6a4f1935eb1d9d3eb8dc465c40259/lib/src/operation.rs);
- documentation for [`jj undo`](https://jj-vcs.github.io/jj/latest/cli-reference/#jj-undo) and [`jj op restore`](https://jj-vcs.github.io/jj/latest/cli-reference/#jj-op-restore).

### Smallest compatible KevinOS implementation

Build a device-local, bounded **Local Flight Recorder** for important operations only:

```text
operationId
operationType
sourceSurface
actor = user | system | ai-approved | sync | import | recovery
startedAt
completedAt
status = applied | failed | reverted | superseded
summary
recordRefs[]
beforeFingerprint
afterFingerprint
inverseKind
inversePayload?          // only the minimum required for targeted undo
parentOperationId?
errorCode?
```

Initial operation types should be limited to:

- approved AI application;
- import/restore;
- destructive archive/delete;
- conflict resolution;
- focus-order change;
- mission shipped/unshipped;
- sync merge with content changes;
- re-key or connection reset.

Cap the log by count and age. Never record raw secrets. Keep snapshots as the whole-state recovery layer; the flight recorder explains and reverses bounded operations.

### User-facing improvement

System Health gains a quiet “Recent important changes” view. Each row says, for example:

> Applied AI proposal to task “Call insurance” · 2 fields changed · Undo available

or:

> Imported backup · 14 added, 3 updated, 0 deleted · Pre-import snapshot available

### Data, privacy, security, and migration

- Start device-local because operation history can reveal sensitive behavior even without full content.
- Store record IDs and concise summaries; prefer fingerprints to full before/after documents.
- Inverse payloads must be scoped, size-capped, and cleared after expiry or successful revert.
- A portable operation log is a later policy decision, not an automatic sync addition.
- No schema bump is needed for a separate device-local store. A portable `operations` collection would require one.

### Testing strategy

- every recorded operation has one terminal state;
- a failed operation cannot claim an `afterFingerprint` as applied;
- repeating Undo is idempotent and cannot double-delete or resurrect;
- undoing operation B after dependent operation C either blocks with an explanation or creates an explicit compensating operation;
- log pruning never removes the only pre-import/recovery pointer while it is still advertised;
- no secret-shaped fields appear in serialized receipts;
- corruption of the log cannot block loading canonical KevinOS state;
- operation summaries render as text, never HTML.

### Cost and maintenance

**Cost:** medium because it crosses several mutation paths. **Ongoing burden:** medium unless initial operation types remain tightly bounded.

### Failure modes and reasons not to proceed

- logging every keystroke or ordinary edit creates noise and surveillance;
- inverse payloads silently become a duplicate state database;
- developers promise universal undo when dependencies make it unsafe;
- operation recording changes business behavior instead of observing it;
- sync of operation logs creates a second convergence problem.

This is valuable, but it should follow the top three smaller missions rather than be bundled with them.

### Sources

- [Repository](https://github.com/jj-vcs/jj)
- [Release v0.44.0](https://github.com/jj-vcs/jj/releases/tag/v0.44.0)
- [Reviewed commit](https://github.com/jj-vcs/jj/commit/f4c039309fb6a4f1935eb1d9d3eb8dc465c40259)
- [Operation log documentation](https://jj-vcs.github.io/jj/latest/operation-log/)
- [CLI reference](https://jj-vcs.github.io/jj/latest/cli-reference/)

---

## 9. Aider

**Repository:** [Aider-AI/aider](https://github.com/Aider-AI/aider)  
**Classification:** **ADAPT** scoped context, repository maps, verification loops, and reversible checkpoints; do not install it inside KevinOS.

### Verified facts

- **License:** Apache-2.0.
- **Activity:** reviewed commit [`5dc9490bb35f9729ef2c95d00a19ccd30c26339c`](https://github.com/Aider-AI/aider/commit/5dc9490bb35f9729ef2c95d00a19ccd30c26339c) dated May 22, 2026. The latest formal release returned by the repository was [`v0.86.0`](https://github.com/Aider-AI/aider/releases/tag/v0.86.0), published August 9, 2025; therefore current activity is better represented by the reviewed commit than by the older tag.
- **Problem solved:** model-assisted software editing in a terminal with explicit repository/file context, Git integration, and optional test/lint feedback.
- **Architecture:** a Python CLI with model adapters, coder/edit formats, a token-budgeted repository map, chat chunks, Git commits, commands, and validation hooks.

### What it actually proves

Aider proves that AI collaborators perform better when context is selected rather than dumped, the repository is summarized structurally, writable files are explicit, edits are represented in a constrained format, and the result is tested before it is accepted. Its Git integration also makes AI work easier to inspect and reverse.

It does not prove that KevinOS should let an AI roam the repository or run commands automatically. KevinOS's work-packet model is safer and should remain authoritative.

### Exact KevinOS weakness addressed

Studio captures repository scope and tests, but mission packets do not yet carry a deterministic packet fingerprint, a compact map of relevant files/symbols, or structured attempt receipts. A new collaborator can still spend time rediscovering context or claim completion without tying evidence to the exact packet it received.

### Specific targets worth studying

- [`aider/repomap.py`](https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/repomap.py);
- [repository map documentation](https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/website/docs/repomap.md);
- [`aider/coders/base_coder.py`](https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/coders/base_coder.py);
- [Git integration and undo documentation](https://aider.chat/docs/git.html);
- [lint and test documentation](https://aider.chat/docs/usage/lint-test.html);
- [edit format documentation](https://aider.chat/docs/more/edit-formats.html).

### Smallest compatible KevinOS implementation

Extend Studio's copied work packet with a deterministic **Mission Scope Map**:

```text
packetVersion
packetFingerprint
repository
branchOrWorktree
writablePaths[]
readOnlyPaths[]
forbiddenPaths[]
relevantSymbols[]
requiredDocuments[]
acceptanceIds[]
verificationCommands[]
```

The map should be user-authored or generated deterministically from selected fields, not inferred by an embedded agent. On return, a handoff must echo the `packetFingerprint` and identify:

- files inspected;
- files changed;
- tests run;
- commands not run and why;
- remaining blockers;
- commit/checkpoint reference.

### User-facing improvement

Kevin can hand a mission to Codex, Claude Code, Cline, or another model and immediately see whether the result corresponds to the current packet rather than an earlier version. Handoffs become faster, comparable, and less vulnerable to “agent theater.”

### Data, privacy, security, and migration

- Repository paths and branch names may reveal private project information; share only with the selected collaborator.
- Never include `.env`, keys, connection payloads, or broad home-directory paths in generated scope maps.
- No automatic command execution or repository access belongs in KevinOS.
- Optional nested fields inside existing `builds` records can remain schema-v39-compatible if normalization preserves unknown optional keys.
- Exported work packets are ordinary text and should include a visible privacy reminder.

### Testing strategy

- identical mission fields yield an identical packet fingerprint;
- reordering set-like path lists does not change the normalized fingerprint;
- changing acceptance criteria or writable scope does change it;
- forbidden paths can never also be writable;
- handoff fingerprint mismatch blocks “verified” status and explains why;
- missing commands are represented explicitly, not treated as passes;
- all generated packet text escapes repository-provided strings;
- mobile copy controls remain keyboard operable.

### Cost and maintenance

**Cost:** small to medium. **Ongoing burden:** low because it strengthens existing mission objects rather than creating a new runtime.

### Failure modes and reasons not to proceed

- the scope map becomes an enormous repository dump;
- packet fingerprinting is unstable because arrays are not normalized;
- a returned handoff can self-declare verification without local checks;
- KevinOS begins executing shell commands or reading repositories;
- collaborator-specific fields make packets non-portable between models.

### Sources

- [Repository](https://github.com/Aider-AI/aider)
- [Reviewed commit](https://github.com/Aider-AI/aider/commit/5dc9490bb35f9729ef2c95d00a19ccd30c26339c)
- [Release v0.86.0](https://github.com/Aider-AI/aider/releases/tag/v0.86.0)
- [Repository map source](https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/repomap.py)
- [Official documentation](https://aider.chat/docs/)

---

## 10. LLM

**Repository:** [simonw/llm](https://github.com/simonw/llm)  
**Classification:** **ADAPT** the structured message, approval pause, and content-addressed receipt contracts.

### Verified facts

- **License:** Apache-2.0.
- **Activity:** reviewed commit [`c410af0774d93d00c727bab22f33619c316d6148`](https://github.com/simonw/llm/commit/c410af0774d93d00c727bab22f33619c316d6148) dated August 9, 2026; current release [`0.32`](https://github.com/simonw/llm/releases/tag/0.32) was published August 4, 2026.
- **Problem solved:** a model-neutral command-line and Python interface for prompts, conversations, templates, tools, structured outputs, embeddings, and logs.
- **Architecture:** a Python core with provider plugins, structured `Message`/typed `Part` objects, tool-call IDs, pause/resume mechanics, and SQLite logging. Release 0.32 introduced a content-addressed message store and richer serialized responses.

### What it actually proves

LLM 0.32 is the closest external match to KevinOS's AI boundary. It proves that one canonical structured representation can cover text, attachments, reasoning metadata, tool calls, and tool results across providers. It also proves that tool loops can pause for human approval and resume without repeating already completed calls.

The content-addressed log demonstrates a useful distinction between:

- the canonical message content;
- provider-specific raw payloads;
- a turn or job that references the content;
- the model and options used;
- the resulting tool activity and status.

### Exact KevinOS weakness addressed

KevinOS records strong proposal provenance but cannot yet prove exactly what normalized request was sent, what structured output shape returned, whether it validated, whether it duplicated an earlier result, or which human decision turned the proposal into state.

### Specific targets worth studying

- [LLM 0.32 changelog](https://llm.datasette.io/en/stable/changelog.html#v0-32);
- [`llm/models.py`](https://github.com/simonw/llm/blob/c410af0774d93d00c727bab22f33619c316d6148/llm/models.py) for messages, responses, and tool-call types;
- [structured message documentation](https://llm.datasette.io/en/stable/python-api.html#python-api-messages);
- [tool pause/resume documentation](https://llm.datasette.io/en/stable/python-api.html#python-api-tools-pause);
- [logging and message-store documentation](https://llm.datasette.io/en/stable/logging.html#logging-message-store);
- [templates documentation](https://llm.datasette.io/en/stable/templates.html).

### Smallest compatible KevinOS implementation

Add an optional nested **AI Job Receipt v2** to `pending[kind=ai]`:

```text
receiptVersion = 2
jobId
mode
createdAt
startedAt
completedAt
latencyMs
prompt = { id, version, fingerprint }
provider = { id, model, seat, optionsFingerprint? }
context = {
  categories[],
  recordCount,
  approximateBytes,
  sourceRefs[],
  omittedCategories[],
  fingerprint
}
requestFingerprint
responseFingerprint
output = { kind, schemaVersion, textFingerprint, parseStatus }
validation = { status, checks[] }
attempts[]
decision = { status, at, reasonCode?, edited? }
application = { targetKind, targetId, operationId?, undoAvailable? }
```

Do not store hidden reasoning. Preserve only provider-visible summaries Kevin explicitly receives and metadata needed for reproducibility.

### User-facing improvement

Every AI proposal can answer:

- what was shared;
- which model and prompt version were used;
- whether the response passed local checks;
- whether Kevin edited it;
- where it was applied;
- how to undo it.

A duplicate response can be recognized by fingerprint instead of creating another indistinguishable card.

### Data, privacy, security, and migration

- The context manifest should summarize sources and size without copying a second full context payload.
- `sourceRefs` must be bounded and should use local IDs, not full content.
- Raw provider payloads should not be stored by default because they may contain private context, reasoning metadata, or provider-specific secrets.
- Provider API keys remain relay-only.
- Optional nested receipt fields can fit existing proposal records without a schema bump if old clients ignore them safely.
- Normalization and fingerprint rules must be documented before release.

### Testing strategy

- canonical request serialization is stable across property order;
- a changed prompt, model, context record, or mode changes the request fingerprint;
- equivalent whitespace-only output follows a documented normalization rule;
- pending, failed, cancelled, rejected, and applied jobs each have valid state transitions;
- resume cannot repeat an already completed attempt;
- validation failures cannot silently become applied;
- edited proposals retain the original response fingerprint and add an edited-result fingerprint;
- receipts survive portable export, merge, and three-device convergence;
- no secret or relay credential can enter the receipt.

### Cost and maintenance

**Cost:** medium. **Ongoing burden:** low to medium because every future AI mode must declare an output kind and local validation policy.

### Failure modes and reasons not to proceed

- receipts become a raw transcript archive and duplicate private content;
- fingerprint normalization is undocumented or unstable;
- KevinOS records hidden chain-of-thought or encrypted reasoning blobs it cannot use;
- validation status is confused with factual correctness;
- providers leak into the state contract through model-specific fields;
- an “approved tool loop” becomes an autonomous-agent runtime.

### Sources

- [Repository](https://github.com/simonw/llm)
- [Release 0.32](https://github.com/simonw/llm/releases/tag/0.32)
- [Reviewed commit](https://github.com/simonw/llm/commit/c410af0774d93d00c727bab22f33619c316d6148)
- [0.32 changelog](https://llm.datasette.io/en/stable/changelog.html#v0-32)
- [Official documentation](https://llm.datasette.io/)

---

## 11. Promptfoo

**Repository:** [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo)  
**Classification:** **ADAPT** the declarative case/assertion format; **REJECT** the production dependency.

### Verified facts

- **License:** MIT.
- **Activity:** reviewed commit [`a1f22f6f4db9e01986ae73ef26177491ab0e7b67`](https://github.com/promptfoo/promptfoo/commit/a1f22f6f4db9e01986ae73ef26177491ab0e7b67) dated August 11, 2026; current release [`0.122.0`](https://github.com/promptfoo/promptfoo/releases/tag/0.122.0) was published August 4, 2026.
- **Problem solved:** repeatable comparison, evaluation, and red-teaming of prompts, models, agents, and retrieval systems.
- **Architecture:** a large TypeScript/Node CLI and web application driven by declarative configuration for prompts, providers, variables, test cases, transforms, assertions, graders, and reports.

### What it actually proves

Promptfoo proves that AI quality improves when expectations are written before a model run as small reusable cases rather than judged from one impressive-looking response. It also proves the usefulness of separating:

- inputs;
- provider/model configuration;
- expected assertions;
- grader output;
- pass/fail thresholds;
- result artifacts.

Its current release also illustrates the dependency cost KevinOS should avoid: modern Node requirements and a large supply-chain surface that needs constant patching.

### Exact KevinOS weakness addressed

KevinOS has prompt versions and manual feedback but no small local regression suite proving that a revised prompt still produces a usable proposal for each AI mode. A prompt can improve one example while quietly breaking another.

### Specific targets worth studying

- [Configuration guide](https://www.promptfoo.dev/docs/configuration/guide/);
- [test cases](https://www.promptfoo.dev/docs/configuration/expected-outputs/);
- [assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/deterministic/);
- [providers](https://www.promptfoo.dev/docs/providers/);
- [red-team strategy](https://www.promptfoo.dev/docs/red-team/);
- [release 0.122.0](https://github.com/promptfoo/promptfoo/releases/tag/0.122.0).

### Smallest compatible KevinOS implementation

Create a dependency-free JSON fixture format under a future test file or `test/fixtures/ai-cases.json`:

```text
{
  "caseVersion": 1,
  "mode": "next-action",
  "input": { ...synthetic local context... },
  "expected": {
    "outputKind": "task-proposal",
    "requiredFields": ["title", "nextAction"],
    "forbiddenPatterns": ["<script", "api_key"],
    "maxCharacters": 800,
    "deterministicChecks": ["onePhysicalAction", "noSilentMutation"]
  }
}
```

Run deterministic checks against saved synthetic responses and parser outputs. Live model evaluation should remain an explicit manual/relay-assisted developer action, never part of app startup or the ordinary release gate.

### User-facing improvement

Prompt upgrades stop being based on vibes. Kevin can see that a new “next action” prompt still produces one concrete action, does not invent dates, does not expose private context, and parses into a reviewable proposal.

### Data, privacy, security, and migration

- Use synthetic fixtures only in the repository.
- Never check real KevinOS state, provider payloads, or keys into test data.
- No telemetry, hosted dashboard, or Promptfoo installation.
- Production state does not need to store the suite.
- AI receipts may store the local assertion result and suite version, not the fixture contents.

### Testing strategy

- validate fixture schema;
- reject unknown assertion names rather than ignoring them;
- produce stable pass/fail output and exit code;
- test malformed JSON, oversized output, hostile HTML, missing fields, extra fields, duplicate actions, and prohibited mutation commands;
- confirm mode-specific validators fail closed;
- ensure changing a case changes the suite fingerprint;
- keep live-provider tests outside `sh test/run.sh` unless explicitly enabled.

### Cost and maintenance

**Cost:** small. **Ongoing burden:** low if the suite starts with 3–5 cases for the highest-value AI modes.

### Failure modes and reasons not to proceed

- importing Promptfoo and its dependency tree;
- using an LLM judge as the only pass/fail authority;
- fixtures contain real private data;
- tests reward verbose output instead of useful actions;
- a passing parser test is presented as proof that the advice is true;
- dozens of brittle cases make prompt iteration impossible.

### Sources

- [Repository](https://github.com/promptfoo/promptfoo)
- [Release 0.122.0](https://github.com/promptfoo/promptfoo/releases/tag/0.122.0)
- [Reviewed commit](https://github.com/promptfoo/promptfoo/commit/a1f22f6f4db9e01986ae73ef26177491ab0e7b67)
- [Official documentation](https://www.promptfoo.dev/docs/)
- [Configuration guide](https://www.promptfoo.dev/docs/configuration/guide/)

---

## 12. Inspect AI

**Repository:** [UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai)  
**Classification:** **ADAPT** task/solver/scorer boundaries and durable evaluation receipts; do not embed the Python framework.

### Verified facts

- **License:** MIT.
- **Activity:** reviewed commit [`83c283346c35a8de464abb9737b02407f11b9aea`](https://github.com/UKGovernmentBEIS/inspect_ai/commit/83c283346c35a8de464abb9737b02407f11b9aea) dated August 11, 2026. The repository had no GitHub `latest` release response at verification time, so the exact default-branch commit is the activity anchor.
- **Problem solved:** reproducible evaluation of large language models and agentic systems.
- **Architecture:** Python tasks combine a dataset, solver, scorer, model configuration, tools/sandbox, limits, and generation settings. Evaluation runs emit structured logs containing samples, messages, model usage, scores, status, and errors.

### What it actually proves

Inspect proves that an AI job should declare what is being tested, how the model may act, how success is scored, and what evidence survives the run. Its strongest transfer is the separation of **execution** from **scoring**: the same output can be reviewed by deterministic checks, human judgment, or a separate evaluator without allowing the generator to certify itself.

### Exact KevinOS weakness addressed

KevinOS proposal validity is currently implicit in mode-specific UI and human review. There is no uniform contract saying which parser/checks ran, whether they passed, what limits applied, or whether the job ended normally, failed, timed out, or was cancelled.

### Specific targets worth studying

- [Task documentation](https://inspect.aisi.org.uk/tasks.html);
- [datasets](https://inspect.aisi.org.uk/datasets.html), [solvers](https://inspect.aisi.org.uk/solvers.html), and [scorers](https://inspect.aisi.org.uk/scorers.html);
- [`src/inspect_ai/_eval/task/run.py`](https://github.com/UKGovernmentBEIS/inspect_ai/blob/83c283346c35a8de464abb9737b02407f11b9aea/src/inspect_ai/_eval/task/run.py);
- [`src/inspect_ai/_eval/task/log.py`](https://github.com/UKGovernmentBEIS/inspect_ai/blob/83c283346c35a8de464abb9737b02407f11b9aea/src/inspect_ai/_eval/task/log.py);
- [`src/inspect_ai/log/_log.py`](https://github.com/UKGovernmentBEIS/inspect_ai/blob/83c283346c35a8de464abb9737b02407f11b9aea/src/inspect_ai/log/_log.py);
- [evaluation logs](https://inspect.aisi.org.uk/logs.html).

### Smallest compatible KevinOS implementation

For each high-value AI mode, define a plain object:

```text
modeDefinition = {
  mode,
  inputVersion,
  promptId,
  outputKind,
  limits: { maxContextBytes, maxOutputCharacters, timeoutMs },
  validators: [ ...named deterministic checks... ],
  humanDecisionRequired: true
}
```

A completed AI receipt references the exact `modeDefinition` version and emits named check results such as:

```text
parse-json: pass
allowed-fields-only: pass
single-next-action: fail
no-date-invention: pass
content-safe-for-text-rendering: pass
```

The generator never marks itself correct. Only local validators and Kevin's decision set the final status.

### User-facing improvement

Instead of “AI answered,” Kevin sees “AI returned a task proposal; 4 of 5 local checks passed; the next action is not singular; review required.” That is more useful than a confidence score.

### Data, privacy, security, and migration

- Validators operate on the already returned proposal inside the browser.
- Do not send extra data to a grader model by default.
- Mode limits should fail before relay transmission when context exceeds policy.
- Store status and named checks, not hidden reasoning.
- The mode registry belongs in code and documentation; result references can live in existing AI receipts.
- No schema bump is required for optional nested validation fields.

### Testing strategy

- every AI mode has exactly one output kind and at least one deterministic validator;
- unknown validators fail closed in development tests;
- timeout, cancellation, provider error, parse error, validation failure, rejection, and application are distinct terminal paths;
- validators cannot mutate state;
- the same normalized output yields the same check results;
- a model cannot inject a fake `validation: pass` field that overrides local checks;
- live-provider errors are converted to bounded safe envelopes;
- synthetic evaluation fixtures run in the dependency-free gate.

### Cost and maintenance

**Cost:** small to medium. **Ongoing burden:** medium because validators must evolve when output contracts change.

### Failure modes and reasons not to proceed

- every mode gains a complex benchmark instead of one useful check;
- scores create false certainty about advice quality;
- evaluator models send private content to another provider;
- validation logic becomes a second opaque prioritization engine;
- a failed nonessential check blocks all useful proposals without an override path.

### Sources

- [Repository](https://github.com/UKGovernmentBEIS/inspect_ai)
- [Reviewed commit](https://github.com/UKGovernmentBEIS/inspect_ai/commit/83c283346c35a8de464abb9737b02407f11b9aea)
- [Official documentation](https://inspect.aisi.org.uk/)
- [Task execution source](https://github.com/UKGovernmentBEIS/inspect_ai/blob/83c283346c35a8de464abb9737b02407f11b9aea/src/inspect_ai/_eval/task/run.py)
- [Log source](https://github.com/UKGovernmentBEIS/inspect_ai/blob/83c283346c35a8de464abb9737b02407f11b9aea/src/inspect_ai/log/_log.py)

---

## 13. Label Studio

**Repository:** [HumanSignal/label-studio](https://github.com/HumanSignal/label-studio)  
**Classification:** **LEARN** from prediction/annotation/review separation; do not adopt the platform.

### Verified facts

- **License:** Apache-2.0 for the open-source repository reviewed.
- **Activity:** reviewed commit [`f010f38324df5d15cecd32358bb64b67079491d8`](https://github.com/HumanSignal/label-studio/commit/f010f38324df5d15cecd32358bb64b67079491d8) dated August 11, 2026; current release [`v1.23.0`](https://github.com/HumanSignal/label-studio/releases/tag/v1.23.0) was published March 13, 2026.
- **Problem solved:** configurable data annotation with imported tasks, model predictions, human annotations, review, comments, and export.
- **Architecture:** a Django backend and modern web frontend. A task owns source data; predictions are separate model-produced records; annotations are separate human-produced records with completion, cancellation, timing, and review metadata.

### What it actually proves

Label Studio proves that model output should not masquerade as the reviewed truth. The original input, prediction, human edit, reviewer decision, timing, and cancellation state remain separate objects. This separation makes evaluation and disagreement possible.

### Exact KevinOS weakness addressed

KevinOS keeps the AI proposal separate from applied state, which is correct. It does not yet clearly preserve the difference among:

- raw model response;
- parsed proposal;
- Kevin-edited proposal;
- Kevin's accept/reject decision;
- final applied values;
- later outcome feedback.

Those stages can currently collapse into a smaller set of fields, making it hard to learn whether the model was right or Kevin repaired it.

### Specific targets worth studying

- [`label_studio/tasks/models.py`](https://github.com/HumanSignal/label-studio/blob/f010f38324df5d15cecd32358bb64b67079491d8/label_studio/tasks/models.py);
- [task format documentation](https://github.com/HumanSignal/label-studio/blob/f010f38324df5d15cecd32358bb64b67079491d8/docs/source/includes/task_format.md);
- [`web/libs/datamanager/src/types/Task.ts`](https://github.com/HumanSignal/label-studio/blob/f010f38324df5d15cecd32358bb64b67079491d8/web/libs/datamanager/src/types/Task.ts);
- [predictions documentation](https://labelstud.io/guide/predictions.html);
- [annotations and review documentation](https://labelstud.io/guide/labeling.html).

### Smallest compatible KevinOS implementation

Keep one AI proposal record but preserve stage fingerprints:

```text
rawResponseFingerprint
parsedProposalFingerprint
reviewedProposalFingerprint
reviewAction = accept | edit-and-accept | reject | defer
reviewReasonCode?
reviewDurationBucket?
appliedRecordFingerprint?
outcomeFeedback?
```

The UI should explicitly label model text “Proposal,” Kevin's changed text “Reviewed version,” and applied content “Saved to KevinOS.” A compact diff appears only when Kevin edited the proposal.

### User-facing improvement

Kevin can tell whether an AI job was genuinely useful or merely supplied a rough draft that required major repair. The system can later report coarse outcomes such as “7 of 10 accepted proposals were edited first” without storing surveillance-level detail.

### Data, privacy, security, and migration

- Do not copy full raw response and full reviewed response when fingerprints plus the existing proposal text are sufficient.
- If a diff is retained, cap it and keep it inside the proposal's existing lifecycle/retention policy.
- Outcome feedback stays local unless Kevin explicitly includes it in a later AI context category.
- Optional nested review metadata can remain in current proposal records.
- Avoid workforce-style reviewer metrics; this is personal learning, not performance monitoring.

### Testing strategy

- accepting without edits keeps parsed and reviewed fingerprints equal;
- edit-and-accept preserves the original fingerprint and records a different reviewed fingerprint;
- rejection can never create an application target;
- application uses the reviewed version, never the hidden raw response;
- later edits to the task do not rewrite the historical proposal receipt;
- diff rendering is escaped, bounded, and accessible;
- merge/convergence preserves one human decision and does not duplicate application.

### Cost and maintenance

**Cost:** small. **Ongoing burden:** low.

### Failure modes and reasons not to proceed

- the UI becomes an annotation platform;
- edit distance is treated as a quality score;
- raw content is duplicated indefinitely;
- Kevin is asked for mandatory feedback after every proposal;
- review metadata becomes another source of guilt or noise.

### Sources

- [Repository](https://github.com/HumanSignal/label-studio)
- [Release v1.23.0](https://github.com/HumanSignal/label-studio/releases/tag/v1.23.0)
- [Reviewed commit](https://github.com/HumanSignal/label-studio/commit/f010f38324df5d15cecd32358bb64b67079491d8)
- [Task model](https://github.com/HumanSignal/label-studio/blob/f010f38324df5d15cecd32358bb64b67079491d8/label_studio/tasks/models.py)
- [Official documentation](https://labelstud.io/guide/)

---

## 14. Mattermost Playbooks

**Repository:** [mattermost/mattermost-plugin-playbooks](https://github.com/mattermost/mattermost-plugin-playbooks)  
**Classification:** **ADAPT** template/run/checklist/timeline/retrospective patterns; copy no enterprise code.

### Verified facts

- **License:** the repository README states Apache-2.0 except `server/enterprise`, which uses the Mattermost Source Available License. Direct reuse therefore requires path-level license verification.
- **Activity:** reviewed commit [`d91a6600dc2bfa8b22fa043fa266e27a35e410f0`](https://github.com/mattermost/mattermost-plugin-playbooks/commit/d91a6600dc2bfa8b22fa043fa266e27a35e410f0) dated August 10, 2026; release [`v2.10.1`](https://github.com/mattermost/mattermost-plugin-playbooks/releases/tag/v2.10.1) was published July 23, 2026.
- **Problem solved:** repeatable operational coordination through playbook templates, live runs, checklists, owners, status updates, timelines, and retrospectives.
- **Architecture:** a Mattermost plugin with a Go server and React web application. A playbook template produces a run; runs contain checklist items, participants, status, updates, timeline events, and retrospective material.

### What it actually proves

Incident-command systems work because they distinguish the reusable plan from the live execution and the after-action review. They do not ask participants to remember the process during stress. Mattermost also demonstrates reproducible seeded test data and release-candidate validation, both useful mission-control habits.

### Exact KevinOS weakness addressed

Studio currently stores a mission largely as one record with rich text fields. It lacks first-class acceptance-item identities, attempt history, status updates tied to evidence, and a concise retrospective. As a result, a mission can become long without becoming more verifiable.

### Specific targets worth studying

- [Repository README and license boundary](https://github.com/mattermost/mattermost-plugin-playbooks/blob/d91a6600dc2bfa8b22fa043fa266e27a35e410f0/README.md);
- [official Playbooks documentation](https://docs.mattermost.com/end-user-guide/workflow-automation.html);
- repository models for playbooks, runs, checklist items, timelines, and retrospectives outside `server/enterprise`;
- release and seeded-test-data workflow described in the README.

### Smallest compatible KevinOS implementation

Add a **Mission Proof Bundle** as optional nested fields inside `builds`:

```text
packetVersion
packetFingerprint
acceptanceItems[] = {
  id,
  text,
  status: pending | pass | fail | waived,
  evidenceRefs[],
  checkedAt?,
  checkedBy?
}
attempts[] = {
  id,
  startedAt,
  completedAt?,
  collaborator,
  packetFingerprint,
  summary,
  verificationReceipts[]
}
statusUpdates[]
retrospective? = { worked, failed, carryForward }
override? = { reason, at }
```

`missionVerified()` should require every acceptance item to be pass or explicitly waived, at least one valid verification receipt, and a packet fingerprint match. Free-text evidence alone is insufficient.

### User-facing improvement

A mission card can say “5/6 acceptance items proved; one failed command; not shippable” rather than showing a green status because evidence text is non-empty. The next AI collaborator receives the exact failed item and attempt history.

### Data, privacy, security, and migration

- Reimplement the contract in KevinOS ES5; do not copy from `server/enterprise`.
- Repository paths, command output, and commit references may be sensitive; export only through explicit packet copy.
- Bound attempt and status histories to prevent mission records from growing forever.
- Optional nested fields can remain inside existing `builds` records without adding a new top-level collection.
- Keep automatic reminders local and quiet; no chat/team machinery.

### Testing strategy

- stable acceptance IDs survive text edits and merge;
- duplicate acceptance IDs are rejected or repaired deterministically;
- all items pass → verified; any pending/fail → not verified;
- waived items require a non-empty human reason;
- a handoff from an old packet fingerprint cannot verify the current mission;
- attempts are append-only after completion;
- command status, evidence, and exit code remain distinct;
- shipped status cannot be forced through malformed nested data;
- three-device convergence preserves one canonical item state.

### Cost and maintenance

**Cost:** medium. **Ongoing burden:** low to medium because it formalizes fields already present.

### Failure modes and reasons not to proceed

- every tiny task becomes an incident playbook;
- checklist completion replaces actual outcome evidence;
- attempt histories grow without pruning or summarization;
- waivers become an easy bypass;
- copied code crosses the enterprise license boundary;
- Studio becomes a multi-user project-management product.

### Sources

- [Repository](https://github.com/mattermost/mattermost-plugin-playbooks)
- [Release v2.10.1](https://github.com/mattermost/mattermost-plugin-playbooks/releases/tag/v2.10.1)
- [Reviewed commit](https://github.com/mattermost/mattermost-plugin-playbooks/commit/d91a6600dc2bfa8b22fa043fa266e27a35e410f0)
- [README and license statement](https://github.com/mattermost/mattermost-plugin-playbooks/blob/d91a6600dc2bfa8b22fa043fa266e27a35e410f0/README.md)
- [Official documentation](https://docs.mattermost.com/guides/playbooks.html)

---

## 15. eLabFTW

**Repository:** [elabftw/elabftw](https://github.com/elabftw/elabftw)  
**Classification:** **LEARN** from laboratory evidence and template discipline; do not copy code into KevinOS.

### Verified facts

- **License:** AGPL-3.0.
- **Activity:** reviewed commit [`086676173022d0c42dbf7b07ec4c22096f32c7b5`](https://github.com/elabftw/elabftw/commit/086676173022d0c42dbf7b07ec4c22096f32c7b5) dated August 11, 2026; current release [`5.6.12`](https://github.com/elabftw/elabftw/releases/tag/5.6.12) was published August 3, 2026.
- **Problem solved:** an electronic laboratory notebook and inventory system with templates, experiments, revisions, timestamps, attachments, exports, and audit-oriented administration.
- **Architecture:** a server-hosted PHP application with a relational database, web UI, API, entity templates, experiment/item records, revision history, exports, and optional trusted timestamping/signing workflows.

### What it actually proves

Laboratory systems distinguish a plan from an observation and an observation from a conclusion. They preserve timestamps, revisions, source attachments, and the identity of the procedure used. A later reader can see what was attempted, not only the polished final result.

This is highly relevant to KevinOS missions and AI experiments. The code itself is not a practical donor because of AGPL obligations and architectural mismatch.

### Exact KevinOS weakness addressed

Mission evidence and adoption experiments can currently become narrative summaries after the fact. KevinOS needs a more disciplined distinction among:

- hypothesis or intended outcome;
- procedure/packet version;
- attempt;
- observation or command result;
- interpretation;
- decision;
- next action.

### Specific targets worth studying

- [official eLabFTW documentation](https://doc.elabftw.net/);
- [experiments and templates](https://doc.elabftw.net/user-guide.html);
- [revisions and audit trail guidance](https://doc.elabftw.net/);
- [export and backup documentation](https://doc.elabftw.net/admin-guide.html);
- the reviewed repository's entity, revision, export, and timestamping modules.

### Smallest compatible KevinOS implementation

For bounded experiments such as a new NOW behavior or adoption intervention, add a plain **Experiment Receipt** template:

```text
experimentId
question
hypothesis
baseline
procedureVersion
startDate
endDate
successEvidence
safetyGuardrails
observations[]
result = supported | not-supported | inconclusive
interpretation
shipPruneRevise
nextAction
```

Use the same structure for a Studio mission attempt when empirical proof matters. Observations should append; conclusions may be revised without rewriting past observations.

### User-facing improvement

KevinOS stops accumulating clever experiments without a clear outcome. A bounded trial can end with “Keep,” “Revise,” or “Prune,” and the evidence remains understandable months later.

### Data, privacy, security, and migration

- Transfer only ideas and field names written independently; do not copy AGPL source into KevinOS.
- Keep observations local and minimal. Do not turn personal behavior into a clinical record.
- Attachments remain under existing KevinOS file/URL safety rules.
- Experiment receipts can initially live in Studio missions or review notes without a new top-level collection.
- Any timestamp/signature feature should use existing local fingerprints first; no external notarization service is justified.

### Testing strategy

- observations are append-only after capture;
- changing the conclusion does not rewrite observation timestamps;
- a result cannot be “supported” without the declared evidence field being addressed;
- end date cannot precede start date;
- private notes are excluded from copied public handoffs unless selected;
- export/import preserves procedure version and observation order;
- hostile attachment names and notes render safely.

### Cost and maintenance

**Cost:** small. **Ongoing burden:** low if used only for bounded product or workflow experiments.

### Failure modes and reasons not to proceed

- KevinOS becomes a lab notebook instead of an action system;
- every personal choice demands evidence logging;
- observations become surveillance;
- AGPL source is copied without understanding obligations;
- external timestamping adds accounts, keys, or unnecessary legal theater.

### Sources

- [Repository](https://github.com/elabftw/elabftw)
- [Release 5.6.12](https://github.com/elabftw/elabftw/releases/tag/5.6.12)
- [Reviewed commit](https://github.com/elabftw/elabftw/commit/086676173022d0c42dbf7b07ec4c22096f32c7b5)
- [Official documentation](https://doc.elabftw.net/)
- [License](https://github.com/elabftw/elabftw/blob/086676173022d0c42dbf7b07ec4c22096f32c7b5/LICENSE)

---

## 16. HPI

**Repository:** [karlicoss/HPI](https://github.com/karlicoss/HPI)  
**Classification:** **ADAPT** provenance, source adapters, deduplication, and error-as-data for context manifests.

### Verified facts

- **License:** MIT.
- **Activity:** reviewed commit [`abde883473479d59ff6c5696d6b424386d1be6de`](https://github.com/karlicoss/HPI/commit/abde883473479d59ff6c5696d6b424386d1be6de) dated August 10, 2026. HPI is maintained primarily through commits rather than a conventional frequent release stream.
- **Problem solved:** a personal data access layer that turns exports and local application data into uniform Python iterables while preserving source provenance and recoverable errors.
- **Architecture:** small source modules under `src/my`, user configuration/overlays, common core helpers, optional caching, deduplication, and APIs that can yield data records alongside exceptions rather than hiding partial failure.

### What it actually proves

HPI proves that a personal information system can integrate heterogeneous sources without centralizing them into one opaque database. Each adapter stays close to the source, provenance remains visible, and one malformed record does not need to erase all usable data.

That pattern is especially relevant to KevinOS's AI context composer: context should be assembled from named local sources with bounded errors and deduplication, not flattened into an unexplained prompt blob.

### Exact KevinOS weakness addressed

KevinOS shows selected context categories and a preview but not a compact manifest of contributing records, duplicates removed, omitted categories, source errors, or approximate size. If one category fails to serialize, the user cannot easily distinguish “empty” from “failed.”

### Specific targets worth studying

- [HPI README](https://github.com/karlicoss/HPI/blob/abde883473479d59ff6c5696d6b424386d1be6de/README.md);
- [`doc/DESIGN.org`](https://github.com/karlicoss/HPI/blob/abde883473479d59ff6c5696d6b424386d1be6de/doc/DESIGN.org);
- [`doc/MODULE_DESIGN.org`](https://github.com/karlicoss/HPI/blob/abde883473479d59ff6c5696d6b424386d1be6de/doc/MODULE_DESIGN.org);
- [`doc/modules.md`](https://github.com/karlicoss/HPI/blob/abde883473479d59ff6c5696d6b424386d1be6de/doc/modules.md);
- source modules under [`src/my`](https://github.com/karlicoss/HPI/tree/abde883473479d59ff6c5696d6b424386d1be6de/src/my).

### Smallest compatible KevinOS implementation

Add a deterministic **Context Manifest** before every AI send:

```text
manifestVersion
categories[]
sources[] = {
  category,
  recordCount,
  approximateBytes,
  latestUpdatedAt?,
  deduplicatedCount,
  status: included | empty | omitted | error,
  errorCode?
}
totalRecords
totalApproximateBytes
omissionReasons[]
fingerprint
```

The preview should show “Tasks: 8 records, 2.1 KB; Calendar: 3 records, 0.7 KB; Notes: omitted by you; Projects: 1 duplicate removed.” The actual context remains visible through the existing full preview.

### User-facing improvement

Kevin understands what is leaving the device before it leaves. A category failure becomes actionable instead of silently reducing AI quality.

### Data, privacy, security, and migration

- Manifest values should be metadata, not duplicated content.
- Source errors must use bounded codes and safe messages.
- Deduplication must use local fingerprints and documented normalization.
- The manifest can be stored inside AI Job Receipt v2; no new collection is needed.
- Do not add connectors or read arbitrary personal sources merely because HPI supports them.

### Testing strategy

- category order does not affect the normalized fingerprint;
- duplicate records are counted once using a stable rule;
- a failed category remains visible as `error`, not `empty`;
- omitted categories contribute no content;
- byte estimates are deterministic for the same serialization;
- manifest total equals included source totals;
- source refs cannot expose secrets or full text;
- context send is blocked when the manifest does not match the preview fingerprint.

### Cost and maintenance

**Cost:** small. **Ongoing burden:** low.

### Failure modes and reasons not to proceed

- the manifest becomes more complex than the content preview;
- source IDs leak sensitive titles or URLs;
- deduplication removes meaningfully different records;
- “partial success” hides a critical source failure;
- HPI becomes justification for importing all of Kevin's personal data.

### Sources

- [Repository](https://github.com/karlicoss/HPI)
- [Reviewed commit](https://github.com/karlicoss/HPI/commit/abde883473479d59ff6c5696d6b424386d1be6de)
- [README](https://github.com/karlicoss/HPI/blob/abde883473479d59ff6c5696d6b424386d1be6de/README.md)
- [Design notes](https://github.com/karlicoss/HPI/blob/abde883473479d59ff6c5696d6b424386d1be6de/doc/DESIGN.org)
- [Module design](https://github.com/karlicoss/HPI/blob/abde883473479d59ff6c5696d6b424386d1be6de/doc/MODULE_DESIGN.org)

---

## 17. GOV.UK Frontend

**Repository:** [alphagov/govuk-frontend](https://github.com/alphagov/govuk-frontend)  
**Classification:** **ADAPT** interruption, error-summary, confirmation, and progressive-disclosure patterns; do not import the design system.

### Verified facts

- **License:** MIT.
- **Activity:** reviewed commit [`cfa71a46485329d14c6c07b2338a5ca9cc6bda8c`](https://github.com/alphagov/govuk-frontend/commit/cfa71a46485329d14c6c07b2338a5ca9cc6bda8c) dated August 11, 2026; current release [`v6.4.0`](https://github.com/alphagov/govuk-frontend/releases/tag/v6.4.0) was published July 16, 2026.
- **Problem solved:** accessible, consistent components and interaction guidance for high-stakes public services.
- **Architecture:** Nunjucks templates, Sass, and JavaScript components backed by a public design system, accessibility guidance, test fixtures, and browser support policy.

### What it actually proves

GOV.UK's strongest KevinOS lesson is restraint. Its interruption-page guidance reserves the pattern for cases where the user is about to make a likely mistake, perform an irreversible action, or contradict information already provided. Ordinary choices should remain ordinary pages.

Its error-summary pattern also proves that a form error should be summarized at the top, linked to the exact field, and paired with specific recovery language instead of a generic toast.

### Exact KevinOS weakness addressed

KevinOS has safe confirmations and focus handling, but high-stakes flows such as destructive restore, re-key, import replacement, proposal application with target drift, or conflict resolution do not yet share one recognizable risk pattern and one error-summary contract.

### Specific targets worth studying

- [Interruption page pattern](https://design-system.service.gov.uk/patterns/interruption-pages/);
- [error summary component](https://design-system.service.gov.uk/components/error-summary/);
- [notification banner](https://design-system.service.gov.uk/components/notification-banner/);
- [confirmation pages](https://design-system.service.gov.uk/patterns/confirmation-pages/);
- [details component](https://design-system.service.gov.uk/components/details/);
- [GOV.UK Frontend repository](https://github.com/alphagov/govuk-frontend).

### Smallest compatible KevinOS implementation

Create one native KevinOS **High-Stakes Interruption Card** with strict eligibility:

Use only when:

1. the action is hard to reverse or destroys current state;
2. the current state has changed since the preview;
3. the action conflicts with a declared user choice;
4. a required backup/recovery prerequisite is missing.

The card must show:

```text
plain-language consequence
records or connection affected
last safe checkpoint
primary action with specific verb
safe alternative/back action
expandable technical details
```

Add an error summary to multi-field restore, relay, and mission-proof forms that moves focus to the summary and links to each invalid field.

### User-facing improvement

High-risk moments become unmistakable without making the whole app feel dangerous. Kevin sees “Replace current local state with this backup” rather than “Continue?” and always has a visible safe exit.

### Data, privacy, security, and migration

- Reimplement markup and behavior in existing KevinOS styles; no package.
- Keep technical details collapsed and sanitize all imported/provider text.
- The card cannot turn into a dark pattern: the safe back action remains visually available.
- No state migration.
- Existing focus trap, Escape, return-focus, contrast, reduced-motion, and 44px target contracts remain mandatory.

### Testing strategy

- interruption card appears only for enumerated high-stakes cases;
- browser Back/Escape/cancel leaves state unchanged;
- action label names the consequence;
- focus enters the heading or error summary and returns safely on cancel;
- error links focus the exact invalid field;
- screen-reader status text is not duplicated;
- 320px and 390px layouts preserve full action text and target size;
- no imported or provider text is inserted as HTML;
- snapshot creation failure blocks destructive continuation.

### Cost and maintenance

**Cost:** small to medium. **Ongoing burden:** low because one pattern replaces ad hoc confirmations.

### Failure modes and reasons not to proceed

- overuse creates alert fatigue;
- every delete becomes a full-screen interruption;
- alarming language reduces calmness;
- confirmation is used as a substitute for reversible design;
- copied GOV.UK visual branding makes KevinOS feel governmental rather than personal.

### Sources

- [Repository](https://github.com/alphagov/govuk-frontend)
- [Release v6.4.0](https://github.com/alphagov/govuk-frontend/releases/tag/v6.4.0)
- [Reviewed commit](https://github.com/alphagov/govuk-frontend/commit/cfa71a46485329d14c6c07b2338a5ca9cc6bda8c)
- [Interruption page guidance](https://design-system.service.gov.uk/patterns/interruption-pages/)
- [Error summary guidance](https://design-system.service.gov.uk/components/error-summary/)

---

## 18. OpenHands

**Repository:** [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands)  
**Classification:** **REJECT** as a KevinOS runtime; **LEARN** only from typed events and explicit tool envelopes.

### Verified facts

- **License:** MIT for the reviewed repository.
- **Activity:** reviewed commit [`c4593be967961d2f32917ccb0ac3507262262541`](https://github.com/OpenHands/OpenHands/commit/c4593be967961d2f32917ccb0ac3507262262541) dated August 11, 2026; current release [`v1.12.0`](https://github.com/OpenHands/OpenHands/releases/tag/v1.12.0) was published August 7, 2026.
- **Problem solved:** a general software-development agent platform that can plan, edit files, run commands, browse, interact with repositories, and execute work inside controlled runtimes.
- **Architecture:** a substantial Python/TypeScript system with an agent controller, event stream, action/observation types, runtime/sandbox layers, server APIs, web UI, integrations, persistence, and evaluation infrastructure.

### What it actually proves

OpenHands proves the value of typed action and observation envelopes, explicit runtime boundaries, event streams, and resumable sessions. It also demonstrates how much infrastructure is required to make a general autonomous agent even partially governable.

That infrastructure is the reason to reject it for KevinOS. The product north star is personal attention and next physical action, not autonomous software execution. Embedding OpenHands would add attack surface, dependency management, credential boundaries, process control, logs, sandboxes, and an agent UI that compete with KevinOS itself.

### Exact KevinOS weakness addressed

Only one bounded lesson applies: mission handoffs and AI jobs should distinguish a proposed action from an observed result and give each an ID and status. KevinOS already does most of this without an agent runtime.

### Specific targets worth studying

- [OpenHands architecture documentation](https://docs.openhands.dev/usage/architecture);
- repository event, action, observation, controller, and runtime packages;
- [security documentation](https://docs.openhands.dev/usage/security);
- [headless and SDK documentation](https://docs.openhands.dev/);
- the reviewed [repository](https://github.com/OpenHands/OpenHands).

### Smallest compatible KevinOS implementation

Do **not** install OpenHands. Transfer only a tiny envelope vocabulary into mission receipts:

```text
action = { id, type, requestedAt, scope, approvalStatus }
observation = { actionId, status, completedAt, evidenceRef, errorCode? }
```

This can strengthen command receipts in Studio without allowing KevinOS to execute the command.

### User-facing improvement

A collaborator handoff can distinguish “command requested,” “command reported as run,” and “evidence locally verified.” Kevin does not have to trust a prose claim.

### Data, privacy, security, and migration

- No runtime, shell, browser automation, workspace mount, agent server, or credential broker enters KevinOS.
- No new connector permission follows from this research.
- Action/observation metadata can live in Mission Proof Bundle attempt receipts.
- Repository output stays outside KevinOS until Kevin pastes or imports an explicit handoff.

### Testing strategy

- every observation references an existing action ID;
- an agent-reported success is not equivalent to local machine verification;
- unapproved actions cannot have an applied observation status;
- unknown tool/action types remain inert text;
- evidence refs are bounded and escaped;
- old packet fingerprints cannot verify current scope.

### Cost and maintenance

**Cost:** tiny for the envelope vocabulary; unacceptable for the runtime. **Ongoing burden:** tiny if the rejection boundary is preserved.

### Failure modes and reasons not to proceed

- KevinOS becomes an agent launcher instead of an attention system;
- credentials or local files are exposed to an embedded runtime;
- autonomous progress creates false confidence and noisy status theater;
- dependency and sandbox maintenance overwhelm the single-file product;
- “human approval” becomes a rapid stream of meaningless clicks;
- mission proof is delegated to the same agent that performed the work.

### Sources

- [Repository](https://github.com/OpenHands/OpenHands)
- [Release v1.12.0](https://github.com/OpenHands/OpenHands/releases/tag/v1.12.0)
- [Reviewed commit](https://github.com/OpenHands/OpenHands/commit/c4593be967961d2f32917ccb0ac3507262262541)
- [Official documentation](https://docs.openhands.dev/)
- [Architecture documentation](https://docs.openhands.dev/usage/architecture)

---

# Out-of-the-box pattern transfer

The unconventional sources are useful only when translated into KevinOS's scale. The objective is not to make a personal operating system feel like an aircraft cockpit, hospital, incident room, or laboratory. The objective is to borrow the **small contracts those domains use to remain trustworthy under stress**.

## 1. Flight software: separate command, event, telemetry, and health

NASA's [F Prime](https://github.com/nasa/fprime) distinguishes commands sent to a component, events emitted by it, telemetry describing state, and health/fault behavior. OpenTelemetry's [semantic conventions](https://github.com/open-telemetry/semantic-conventions) similarly emphasize stable names, timestamps, status, and attributes.

### Safe KevinOS translation

- **Command:** Kevin explicitly requests “apply proposal,” “restore backup,” or “move this to focus 1.”
- **Event:** the operation succeeds, fails, is cancelled, or is reverted.
- **Telemetry:** local coarse state such as last successful backup or count of unresolved mission checks.
- **Health:** a rule-based warning such as corrupt storage, stale sync revision, or missing recovery proof.

Do not mix these. A button click is not proof of success; a provider's “done” text is not a local observation; a metric is not an instruction.

### What not to transfer

No command bus, component framework, binary telemetry, ground station, or always-on instrumentation is warranted. The transfer is a naming and receipt discipline for important actions.

## 2. Aviation and safety checklists: prove the critical few, not everything

Safety-critical checklists work because they are short, ordered, and attached to a consequential transition. Mattermost Playbooks provides the software analogue: reusable checklist template, live run, status, timeline, and retrospective.

### Safe KevinOS translation

Use a checklist only for transitions where omission is costly:

- shipping a mission;
- replacing local state;
- re-keying sync;
- promoting an AI proposal into important state;
- closing a bounded experiment.

Each item needs an ID, status, and evidence reference. “I looked at it” is not machine proof; “command exited 0 and output contains the expected invariant” is stronger. Waivers remain possible but require a reason.

### What not to transfer

Do not put checklists on ordinary captures, simple task completion, or every navigation. Checklist saturation destroys the attention benefit.

## 3. Incident command: distinguish the playbook from the live run

Incident systems separate a reusable response pattern from the actual event. The live run has its own participants, timestamps, decisions, blockers, evidence, and after-action review.

### Safe KevinOS translation

A Studio work-packet template is not the mission itself. The template can define required fields and acceptance structure; each mission attempt records the collaborator, packet fingerprint, evidence, and result. A new attempt should not overwrite the old attempt's facts.

### What not to transfer

No chat rooms, on-call rotations, escalation trees, or team permissions are needed. KevinOS is personal mission control, not a workplace incident product.

## 4. Hospital triage: choose the next safe action without pretending to solve everything

Triage systems prioritize the next safe intervention based on urgency, risk, and available evidence. Taskwarrior's factor model and KevinOS's existing due/overdue rules offer a non-medical software equivalent.

### Safe KevinOS translation

NOW should answer:

1. Is there a hard time constraint?
2. Did Kevin explicitly choose this?
3. Is the item overdue or blocking a larger outcome?
4. What is the smallest safe physical action?

The output is an ordered action list with reason codes, not a diagnosis of Kevin's motivation or a hidden score of personal importance.

### What not to transfer

No medical severity labels, anxiety-producing colors, or claims about mental state. “Blocked” and “unclear” are work conditions, not personal defects.

## 5. Laboratory notebooks: preserve observations before conclusions

eLabFTW and Inspect AI both preserve the difference between a procedure, a run, observed evidence, and a scored conclusion.

### Safe KevinOS translation

For experiments and missions:

- write the expected outcome first;
- fingerprint the procedure or packet;
- append observations and command receipts;
- record the conclusion separately;
- preserve failed attempts;
- end with keep, revise, prune, or next experiment.

This prevents hindsight from rewriting what was actually tried.

### What not to transfer

No legal-signature theater, external notarization, mandatory laboratory formality, or exhaustive personal measurement.

## 6. Version-control interfaces: make history useful to humans

Jujutsu and TiddlyWiki demonstrate two complementary recovery ideas: an operation log that explains system-level changes and import/backup surfaces that let a user inspect consequences before committing.

### Safe KevinOS translation

For important operations, show:

- what changed;
- why it changed;
- what records were affected;
- the before/after fingerprints;
- whether a targeted inverse or whole-state checkpoint exists.

Import should always stage, summarize, snapshot, and then apply.

### What not to transfer

Do not expose commit graphs, branches, rebases, or repository jargon to ordinary KevinOS use. “Restore before import” is useful; “rebase your state” is not.

## 7. Strategy-game quest logs: keep state, objective, blocker, and next move

Quest logs are effective when they show the objective, current stage, blocker, and one next action. Studio already approaches this model.

### Safe KevinOS translation

A mission card should answer:

- What outcome are we pursuing?
- What state is it in?
- What blocks progress?
- What proof remains?
- What is the next physical action?

The “quest” ends through evidence, not points.

### What not to transfer

No XP, streak punishment, loot, leaderboards, artificial scarcity, or shame. Habitica was explicitly rejected because its engagement mechanics would distort KevinOS's calmness.

## 8. Personal science: record friction only when Kevin chooses to mark it

ActivityWatch proves the value of timestamped local evidence. HPI proves that provenance and partial errors can remain visible. A humane personal-science transfer is a one-tap friction mark, not passive surveillance.

### Safe KevinOS translation

From NOW, capture, AI review, or Studio, Kevin may mark one reason:

```text
unclear
still-too-big
blocked-by-person
blocked-by-tool
bad-timing
not-worth-doing
missing-information
```

The event records the category and surface, not private task text. Weekly Review aggregates counts and asks whether to revise the system.

### What not to transfer

No application tracking, window titles, keystrokes, emotion inference, productivity scoring, or intervention notifications generated from silent observation.

## 9. Accessibility systems: errors are navigation problems, not just messages

GOV.UK Frontend and the [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) demonstrate that an error is not solved by displaying red text. Users need focus placement, a concise summary, field-level links, predictable keyboard behavior, and a safe way back.

### Safe KevinOS translation

- focus the error summary after failed submission;
- link each summary item to its exact field;
- preserve entered values;
- return focus after closing dialogs;
- use interruption cards only for high-stakes decisions;
- keep technical details progressively disclosed.

### What not to transfer

Do not copy a visual brand or add ARIA roles without matching keyboard behavior. KevinOS's existing native elements and focus contracts remain the starting point.

## 10. Observability: use stable local event names, not a telemetry platform

OpenTelemetry demonstrates the value of naming events consistently so records remain interpretable across time. ActivityWatch demonstrates source-specific buckets and retention.

### Safe KevinOS translation

Adopt a tiny semantic vocabulary:

```text
kevinos.focus.set
kevinos.ai.job.completed
kevinos.ai.proposal.applied
kevinos.mission.verification.failed
kevinos.recovery.drill.passed
kevinos.sync.conflict.created
```

Every name has a documented purpose, allowed attributes, retention, and privacy class.

### What not to transfer

No exporter, collector, cloud trace backend, distributed tracing IDs, or external analytics. This is a local receipt vocabulary, not production observability infrastructure.

---

# Original KevinOS concepts

The following concepts combine multiple source patterns into KevinOS-specific opportunities. They are ordered roughly by near-term product value, not novelty.

## Concept 1 — Focus Rail and Attention Receipt

### User problem

NOW is deterministic but its order is coupled to global task storage order. Kevin cannot reliably see whether an item is first because he chose it, because it is overdue, or because it happened to appear earlier in `state.items`.

### Source patterns

- Taskwarrior's named urgency factors and explicit coefficients;
- ActivityWatch's source/type/timestamp event discipline;
- aviation checklist ordering;
- strategy-game objective/next-move clarity.

### User experience

NOW continues to show at most three commitments. Each commitment has a quiet reason line:

```text
1 · Chosen for today
2 · Overdue · next action ready
3 · Due before 4:00 PM
```

Dragging or using Move Up/Down changes a **daily focus rank**, not task storage order. An expandable “Why these?” panel lists the deterministic rules and the last explicit focus change. No score is shown.

### Deterministic rules

1. Eligibility remains the current `windItems()` contract: open and either marked today or due on/before today.
2. A task with `focusDate === todayKey()` and integer `focusRank` 1–3 is explicit focus.
3. Explicit-focus items sort by rank; ties resolve by `focusSetAt`, then task ID.
4. Remaining eligible items preserve current array order for migration continuity.
5. NOW takes the first three after explicit focus is overlaid.
6. A completed, buried, or no-longer-eligible task vacates its rank; remaining explicit ranks compact deterministically on the next focus edit, not silently during read.
7. Reason codes are evaluated in fixed order:
   - `manual-focus`;
   - `overdue`;
   - `due-today`;
   - `marked-today`;
   - `project-next-action`;
   - `fallback-order`.
8. AI cannot set focus fields. Only a direct Kevin action in the interface may do so in the first release.

### State changes

Optional task fields:

```text
focusDate
focusRank
focusSetAt
focusSource = manual | onboarding
```

No new top-level collection. Existing records without fields behave exactly as v0.50.

### Privacy boundary

No new content leaves the device. The receipt records reason codes and timestamps, not inferred motivation.

### Smallest viable slice

- add `focusItems()` as a pure helper;
- change `moveFocusTask()` to swap ranks instead of array records;
- extend `nowModel()` with reason codes;
- render the primary reason in NOW;
- add unit, portability, merge, and convergence tests.

### Acceptance criteria

- legacy state produces the same top-three order as v0.50;
- moving focus never changes global `state.items` order;
- refresh, export/import, and two-device sync preserve focus rank;
- identical state produces identical NOW and reason codes;
- task completion cannot leave a duplicate rank;
- no AI request or background process can change focus;
- 320px and keyboard interaction remain clean.

### Tests

- pure ordering table tests;
- same-rank tie fixtures;
- old state without fields;
- stale `focusDate` ignored;
- merge where two devices set different ranks;
- tombstone/complete interaction;
- portable round-trip;
- no hidden score or nondeterministic clock read inside pure ordering.

### Rollback

Remove the new helper/rendering and ignore optional fields. Because array order remains untouched and legacy fallback remains authoritative, rollback restores v0.50 behavior without data loss.

### Reasons it could fail

- reason rules become a covert priority algorithm;
- too many badges make NOW noisy;
- rank conflicts across devices are frequent and confusing;
- updating focus touches whole task records and unexpectedly wins unrelated concurrent edits;
- explicit focus becomes stale because Kevin never resets it.

The first release should therefore keep only daily ranks 1–3 and one visible reason.

---

## Concept 2 — Calm Friction Ledger

### User problem

When Kevin does not act on a NOW item, abandons capture, rejects an AI proposal, or repeatedly fails a mission check, KevinOS cannot distinguish a bad product interaction from a task that was simply not worth doing.

### Source patterns

- ActivityWatch event buckets and retention;
- HPI provenance and error-as-data;
- personal-science experiment discipline from eLabFTW;
- cognitive-behavioral practice of naming a barrier before choosing a smaller action.

### User experience

A small “What made this hard?” link appears only after a visible friction moment, never as a pop-up. Kevin can select one category and optionally write a replacement next action.

Categories:

```text
unclear
still-too-big
blocked-by-person
blocked-by-tool
bad-timing
missing-information
not-worth-doing
other
```

Weekly Review shows aggregate counts and at most one suggestion: “Three items were marked still-too-big. Review whether next actions are physical enough.”

### Deterministic rules

- events occur only after explicit Kevin action;
- one event per target/surface per 12-hour window unless the category changes;
- retention is 30 days or 200 events, whichever is smaller;
- aggregation counts categories and surfaces only;
- no score, streak, prediction, or automatic reprioritization;
- the suggestion table is fixed and local.

### State changes

Prefer a device-local side store for the experiment:

```text
id, type="friction.marked", surface, targetKind?, category, timestamp
```

Do not store target title or body. A replacement action, when entered, uses the normal task edit contract rather than the evidence record.

### Privacy boundary

No passive activity, content text, external application data, or relay transmission. Raw events remain device-local; only Kevin-selected aggregate text may enter an AI context later.

### Smallest viable slice

Add the mark action to NOW and Capture only, with five categories and a simple weekly aggregate. Do not instrument AI or Studio until the first 30-day experiment proves value.

### Acceptance criteria

- disabled or unused ledger records nothing;
- no payload contains task text;
- duplicate marks compact deterministically;
- delete/clear works immediately;
- Weekly Review remains useful with zero events;
- no notification is generated from the ledger.

### Tests

Retention, deduplication, content-minimization scanning, deterministic aggregates, disabled path, local clear, hostile category rejection, mobile keyboard behavior.

### Rollback

Delete the side store and remove the link. Canonical tasks are unaffected.

### Reasons it could fail

- marking friction becomes another task;
- categories feel clinical or judgmental;
- aggregates create guilt;
- developers expand into surveillance;
- the system suggests changes without enough evidence.

---

## Concept 3 — Local Flight Recorder

### User problem

KevinOS can restore snapshots but cannot always explain which important operation changed state or reverse only that operation.

### Source patterns

- Jujutsu operation log and restore;
- F Prime command/event distinction;
- OpenTelemetry semantic names;
- TiddlyWiki/Actual Budget backup-first repair.

### User experience

System Health gains “Recent important changes,” capped at 25 rows. A row includes action, source, result, time, affected record count, and either **Undo**, **View checkpoint**, or **No safe targeted undo**.

### Deterministic rules

- only an allowlisted set of consequential mutations is recorded;
- start and terminal event share one operation ID;
- inverse payload is minimum required and size-capped;
- targeted undo emits a new operation rather than deleting history;
- dependent-operation rules block unsafe undo with a reason;
- log corruption never blocks canonical state.

### State changes

Device-local bounded operation records as described in the Jujutsu analysis. Initial operation types: AI apply, import/restore, destructive archive/delete, focus reorder, mission ship, and conflict resolution.

### Privacy boundary

No secrets, raw provider payloads, or whole-state copies. Record references and fingerprints are preferred to duplicated content. Whole-state recovery remains in snapshots.

### Smallest viable slice

Instrument only approved AI application and import/restore. Prove one targeted undo and one checkpoint link before expanding.

### Acceptance criteria

- each instrumented operation produces exactly one terminal receipt;
- failure is distinguishable from cancellation;
- Undo is idempotent;
- pruning cannot strand a visible undo button;
- no ordinary typing/edit event enters the log;
- app works if operation store is absent or corrupt.

### Tests

State-machine transitions, inverse behavior, dependency blocking, retention, secret scanning, corruption tolerance, rendering safety, offline behavior.

### Rollback

Stop writing the side store and remove the view. Existing canonical state and snapshots remain valid.

### Reasons it could fail

- operation types grow without control;
- inverse payloads become a duplicate database;
- users expect universal undo;
- logs become behavioral surveillance;
- sync of the log creates new conflict complexity.

---

## Concept 4 — AI Job Receipt v2

### User problem

An AI proposal is reviewable but not yet fully reproducible or locally scored. The system cannot clearly show request identity, response identity, validation, attempts, human editing, and application as one connected job.

### Source patterns

- LLM structured messages, typed parts, pause/resume, content-addressed logs;
- Inspect AI task/solver/scorer/log split;
- Promptfoo declarative assertions;
- Label Studio prediction/annotation/review separation;
- HPI context provenance.

### User experience

Every proposal card gains a collapsed **Receipt** section:

```text
Prompt: plan v2
Model: provider / model / seat
Shared: Tasks 6 · Projects 2 · 2.8 KB
Checks: 4 passed · 1 needs review
Run: 1 attempt · 3.2s
Decision: Edited and applied
Undo: Available
```

Kevin sees full context before send and concise provenance after return.

### Deterministic rules

- normalized request and response fingerprints use documented serialization;
- the local mode registry defines output kind, limits, and validators;
- provider/model metadata cannot certify validation;
- human review is mandatory before important-state application;
- edits preserve original and reviewed fingerprints;
- retry creates an attempt entry and never overwrites the prior result;
- hidden reasoning is neither requested for storage nor persisted.

### State changes

Optional `receipt` object inside existing AI proposal records, plus optional `review` and `application` subobjects. No new collection.

### Privacy boundary

Store metadata and fingerprints, not a duplicate of the full context. Raw provider payloads, keys, and hidden reasoning are excluded. Source refs are bounded local IDs.

### Smallest viable slice

Implement for one mode, preferably `Plan`, using existing text output:

- receipt version/job ID;
- context manifest;
- request/response fingerprints;
- start/complete/latency;
- three deterministic validators;
- accept/edit/reject decision metadata.

Then generalize only after the contract survives export/merge/convergence tests.

### Acceptance criteria

- legacy proposals still render and normalize;
- same normalized request yields same request fingerprint;
- proposal application cannot occur with `working` or `error` status;
- failed validation remains reviewable but visibly not passed;
- edit-and-apply preserves the original response identity;
- receipt contains no secret-shaped fields;
- portable round-trip and three-device convergence remain green.

### Tests

Canonical serialization, state transitions, retry, cancellation, provider failure, parser/validator failure, edit preservation, duplicate detection, application/Undo linkage, hostile text rendering.

### Rollback

Old proposal fields remain authoritative. Ignore or strip the optional receipt object; no content is lost.

### Reasons it could fail

- receipt UI overwhelms the proposal;
- fingerprints drift across releases;
- validators are mistaken for truth;
- metadata duplicates private context;
- every provider requires special-case state fields;
- retry logic becomes a hidden autonomous loop.

---

## Concept 5 — Mission Proof Bundle

### User problem

Studio's mission form is rich, but the current proof gate can accept any non-empty evidence text with a manual/machine status. Acceptance criteria and command evidence are not independently testable.

### Source patterns

- Mattermost template/run/checklist/timeline/retrospective;
- Aider scoped repository maps and test loops;
- Inspect AI execution/scoring separation;
- eLabFTW procedure/attempt/observation records;
- OpenHands action/observation envelope without its runtime.

### User experience

A mission shows:

```text
Acceptance: 4/5 proved
Verification: 3 passed · 1 failed · 1 not run
Packet: matches current scope
Attempts: 2
Ship status: blocked
```

Each acceptance item expands to evidence. A handoff copies only current scope, unresolved items, failed receipts, and the packet fingerprint.

### Deterministic rules

- acceptance criteria are parsed or created as stable-ID items;
- `pass`, `fail`, `pending`, and `waived` are distinct;
- a waiver requires a human reason;
- a returned attempt must match the current packet fingerprint;
- collaborator-reported success is separate from locally verified success;
- Shipped requires all items pass/waived plus at least one valid verification receipt;
- override is possible only through a visible high-stakes action and reason.

### State changes

Optional nested `proofBundle` in each `builds` record. Existing free-text fields remain for compatibility and can seed the first structured items.

### Privacy boundary

Scope maps exclude secrets. Command output is bounded and may be summarized. Copied packets include only explicitly selected repository context.

### Smallest viable slice

- add packet version/fingerprint;
- convert acceptance free text into manually managed checklist items;
- add verification receipts with command, reported status, local status, and evidence;
- strengthen `missionVerified()`;
- preserve current copied packet formats with added IDs/fingerprint.

### Acceptance criteria

- current v0.50 missions remain editable;
- free-text evidence alone no longer verifies a structured mission;
- all checks pass → shippable;
- any fail/pending → not shippable;
- waived item requires reason;
- packet mismatch is visible;
- export, merge, and convergence preserve item/attempt identity.

### Tests

Migration normalization, duplicate IDs, packet fingerprint stability, old-handoff mismatch, waiver, stage cycling, malformed nested data, merge conflicts, XSS-safe evidence, mobile checklist controls.

### Rollback

Keep current fields; revert `missionVerified()` and ignore `proofBundle`. No mission narrative is lost.

### Reasons it could fail

- small missions become bureaucratic;
- IDs/fingerprints confuse Kevin;
- checklists become box-checking;
- waivers are abused;
- evidence blobs make records too large;
- local verification is impossible for external work and the UI provides no honest “reported only” status.

---

## Concept 6 — Recovery Drill Card

### User problem

KevinOS has strong backup and snapshot features but no routine, non-destructive proof that a chosen backup can still be parsed and understood.

### Source patterns

- Actual Budget repair/rebuild;
- TiddlyWiki import staging;
- Jujutsu inspect/restore;
- safety-critical rehearsal and readiness checks.

### User experience

System Health occasionally offers **Test a backup without replacing anything**. Kevin selects a file. KevinOS parses it in memory, validates the portable contract, compares counts/fingerprint, reports warnings, and discards it.

Result example:

```text
Backup readable
Schema: 39
Created: August 4, 2026
14 collections present
Connections excluded
3 records differ from current state
No replacement performed
```

### Deterministic rules

- drill is always read-only;
- import parser and validator are the same production code used before restore;
- no `save()`, `touch()`, `bury()`, relay call, or sync write occurs;
- result receives a local timestamp and backup fingerprint;
- reminder appears only when no drill has passed within a user-selected interval.

### State changes

Device-local metadata only:

```text
lastRecoveryDrillAt
lastRecoveryDrillFingerprint
lastRecoveryDrillStatus
```

### Privacy boundary

The backup never leaves the browser. No file name or contents are transmitted. Results can omit record titles.

### Smallest viable slice

A manual “Test backup” button and result card. Add reminders only after the manual flow proves stable.

### Acceptance criteria

- state byte-for-byte unchanged after pass, fail, or cancel;
- malformed/newer-schema backup produces a safe report;
- connection secrets remain absent;
- large file limit is enforced;
- keyboard and mobile file-selection recovery are clear;
- corrupt local state path remains fail-closed.

### Tests

Good/old/newer/malformed/oversized files, unknown fields, hostile strings, cancellation, state identity before/after, memory cleanup, offline use.

### Rollback

Remove the card and metadata. Backup/restore behavior remains untouched.

### Reasons it could fail

- a parse pass is misunderstood as proof of every semantic invariant;
- reminders create anxiety;
- large backups cause browser memory problems;
- the drill accidentally shares code with mutating import in an unsafe way.

---

## Concept 7 — Context Budget Preview

### User problem

Kevin can preview AI context but cannot quickly judge size, source coverage, duplicates, omissions, or partial failures.

### Source patterns

- HPI adapters and provenance;
- LLM structured messages;
- Aider token-budgeted repository maps;
- Promptfoo explicit input/provider/test configuration.

### User experience

Above Send, a compact line reads:

```text
8 records · 3.4 KB · Tasks, Projects, Notes · 1 duplicate removed
```

Expanding it shows each source status and omitted categories. The full text preview remains available.

### Deterministic rules

- count serialized records after deduplication;
- byte estimate uses the exact normalized string to be sent;
- source status is included/empty/omitted/error;
- a preview fingerprint must equal the send fingerprint;
- category limits are mode-defined;
- exceeding a hard limit blocks send and offers deselection, never silent truncation unless the prompt contract explicitly defines deterministic truncation.

### State changes

Manifest nested in AI Job Receipt v2. Pre-send UI state can remain ephemeral.

### Privacy boundary

No extra provider call. Manifest metadata does not duplicate content. Source refs are local and bounded.

### Smallest viable slice

Record count, byte count, categories, omitted categories, fingerprint match. Defer source-level errors/dedup until needed.

### Acceptance criteria

- displayed bytes match sent bytes;
- changing a selected record invalidates the preview;
- omitted categories contribute no data;
- limit errors preserve user selections;
- no hidden auto-expansion of context.

### Tests

Normalization, category order, dedup, mutation after preview, limit boundaries, malformed record, source error, secret exclusion.

### Rollback

Hide the manifest and continue using existing preview/context fingerprint.

### Reasons it could fail

- size numbers distract from meaning;
- byte count is mistaken for token count;
- deterministic truncation removes the most important context;
- manifests become stale between preview and send.

---

## Concept 8 — Conflict Review Card

### User problem

Rare same-field concurrent edits may be resolved deterministically but invisibly, creating distrust when meaningful text appears to disappear.

### Source patterns

- Automerge conflicts as data;
- TaskChampion operation synchronization;
- Actual Budget repair receipts;
- GOV.UK high-stakes interruption and error language.

### User experience

Only a material ambiguity produces a card:

```text
Two devices changed this task before syncing.
Kept: “Email the parent group”
Also preserved: “Call the parent representative”
Choose one, combine, or keep current.
```

The card shows device labels and update times if available, never a raw merge structure.

### Deterministic rules

- conflict eligibility is limited to named fields and materially different normalized values;
- routine newer-wins behavior stays quiet;
- each conflict has one ID and one terminal resolution;
- resolution is an ordinary touched record plus a tombstoned/closed conflict receipt;
- unresolved conflict cannot silently alter NOW reason text if it affects the selected next action.

### State changes

Begin with test fixtures. Production requires either an optional portable `conflicts` collection or a nested conflict object on the affected record; that decision should follow observed need and a schema review.

### Privacy boundary

Preserve only the two competing field values required for resolution. Expire resolved alternate content. No relay analysis.

### Smallest viable slice

Test-only convergence fixtures and a System Health diagnostic count. Do not ship the card until a real ambiguity is reproduced.

### Acceptance criteria

- no duplicate conflict for the same two versions;
- equal normalized values create no conflict;
- resolution converges across three devices;
- stale clients cannot reopen a resolved conflict;
- alternate content is not shown in unrelated exports.

### Tests

Permutation/property tests, tombstone race, complete/edit race, focus-rank race, resolution, expiry, malformed receipt, portable policy.

### Rollback

Discard diagnostics/receipts and return to documented newer/remote rules. Canonical content remains valid.

### Reasons it could fail

- conflicts are too rare to justify UI;
- every timestamp tie becomes noise;
- alternate text retention complicates privacy and sync;
- users are forced to understand distributed systems.

---

## Concept 9 — One-at-a-Time Capture Triage

### User problem

Capture is fast, but a growing inbox can become a second task list. Batch processing can create overwhelm, especially on mobile or during low-energy transitions.

### Source patterns

- Org mode capture/refile;
- todo.txt simplicity;
- TiddlyWiki import staging;
- hospital-triage principle of making the next safe disposition;
- GOV.UK progressive disclosure.

### User experience

A **Process one capture** action opens one inbox item with four large choices:

```text
Do next
Schedule
Attach to project
Keep as note / delete
```

Only the selected branch reveals additional fields. After disposition, Kevin may stop or process one more. The UI never celebrates an empty inbox as a moral achievement.

### Deterministic rules

- select oldest unprocessed capture, then ID tie-break;
- one item is active at a time;
- no automatic AI classification;
- every disposition previews the resulting record type;
- cancel leaves the capture untouched;
- Undo returns the item to its original position and content.

### State changes

Use existing `pending`, task, note, event, and project contracts. Add only optional disposition metadata if needed:

```text
processedAt
processedToKind
processedToId
```

### Privacy boundary

No external service and no passive classification. Existing safe rendering applies.

### Smallest viable slice

Support Do next, Keep as note, and Delete for one capture. Add Schedule and Project only after the interaction is proven.

### Acceptance criteria

- oldest item selected deterministically;
- cancel is byte-identical;
- disposition creates exactly one target record;
- source is removed only after target save succeeds;
- Undo restores source and removes target safely;
- 320px controls remain one-handed and keyboard accessible.

### Tests

Selection order, each disposition, save failure, duplicate click, Undo, stale target, hostile capture text, mobile focus, offline persistence.

### Rollback

Remove the triage view. Captures remain in existing lists.

### Reasons it could fail

- one-at-a-time is slower for experienced batch processing;
- branching choices add friction;
- “Do next” floods NOW;
- Undo across record types becomes fragile;
- the feature implies every capture must be processed.

---

# Recommended roadmap

## Sequencing principles

1. Ship one contract at a time.
2. Preserve legacy behavior for records without new optional fields.
3. Prefer optional nested/record fields over a new top-level collection.
4. Do not bump schema v39 unless a real migration or new canonical collection is unavoidable.
5. Every app release must follow KevinOS's existing three-bump rule: `APP_VERSION` in `index.html`, the static footer fallback, and `CACHE` in `sw.js` move together.
6. Every mission must be independently revertible and must leave the full release gate green.
7. The 30-day adoption soak should decide expansion, not enthusiasm during implementation.

## Standard verification gates

The roadmap references these exact gates:

**V1 — focused app behavior**

```text
node tools/doctor.js
node test/app-logic.test.js
node test/ui-contract.test.js
```

**V2 — state trust**

```text
node test/portable.test.js
node test/merge.test.js
node test/convergence.test.js
```

**V3 — hostile content and affected workflow**

```text
node test/xss-corpus.test.js
node test/capture.test.js        # when capture/inbox changes
```

**V4 — full release gate**

```text
sh test/run.sh
```

**V5 — relay gate, only if `relay/worker.js` changes**

```text
node relay/test/route-auth.test.js
node relay/test/sync-push.test.js
node relay/test/lane-pins.test.js
node relay/test/length-control.test.js
node relay/test/inbox-intelligence.test.js
node relay/test/security-boundaries.test.js
```

## Standard manual browser checks

**M1 — responsive and keyboard**

- 320×568;
- 390×844;
- 430×932;
- 768×1024;
- 1440×900;
- keyboard-only navigation;
- visible focus;
- Escape/cancel behavior;
- focus return after dialog/card close;
- coarse-pointer target sizing.

**M2 — persistence/offline**

- save, hard reload, and reopen;
- offline reload through service worker;
- install/PWA launch if the release touches startup or navigation;
- zero console errors.

**M3 — state movement**

- portable export/import;
- two-browser/device sync when applicable;
- stale revision/merge retry;
- three-device convergence fixture in automated tests.

**M4 — high-stakes/recovery**

- cancel leaves state unchanged;
- pre-action snapshot or Undo exists where promised;
- corrupt/malformed input fails closed;
- user-facing consequence is specific.

---

## Track A — Small, high-confidence improvements

### A1. Focus Rail and Attention Receipt

- **Priority:** P0; first implementation mission.
- **Expected impact:** very high. Directly improves the north star every day and removes the most important current contract ambiguity.
- **Complexity:** small to medium.
- **Risk:** medium. Focus fields touch task records and therefore interact with merge behavior.
- **Dependencies:** existing `windItems()`, `moveFocusTask()`, `nowModel()`, task rendering, `touch()`, portable clone, record merge.
- **Likely files affected:** `index.html`; `test/app-logic.test.js`; `test/ui-contract.test.js`; `test/portable.test.js`; `test/merge.test.js`; `test/convergence.test.js`; `docs/STATE_CONTRACT.md`; `docs/DECISIONS.md`; `docs/CURRENT_STATE.md`; `HANDOFF.md`; `sw.js` for the release cache bump.
- **State/schema changes:** optional task fields `focusDate`, `focusRank`, `focusSetAt`, and `focusSource`. No schema bump expected because item records are deep-cloned and merged without a field whitelist. Prove this in tests before deciding.
- **Verification commands:** V1, V2, V4.
- **Manual checks:** M1, M2, M3; verify legacy tasks preserve current order and focus changes never reorder the global task array.
- **Rollback:** remove focus overlay and ignore optional fields. Legacy array-order fallback restores v0.50 behavior.

### A2. AI Job Receipt v2 with Context Budget Preview

- **Priority:** P0; second implementation mission.
- **Expected impact:** very high. Improves trust, provider neutrality, debugging, and learning from AI outcomes.
- **Complexity:** medium.
- **Risk:** medium. Fingerprint instability or duplicated private context would undermine trust.
- **Dependencies:** `AI_PROMPTS`, `buildAiSharedContext()`, `aiFingerprint()`, `runAiProposal()`, `normalizeAiProposal()`, `editAIProposal()`, `applyAIProposal()`, `rejectAIProposal()`, `undoAIProposal()`.
- **Likely files affected:** `index.html`; `test/app-logic.test.js`; `test/ui-contract.test.js`; `test/portable.test.js`; `test/merge.test.js`; `test/convergence.test.js`; `test/xss-corpus.test.js`; `docs/STATE_CONTRACT.md`; `docs/ARCHITECTURE.md`; `docs/CURRENT_STATE.md`; `HANDOFF.md`; `sw.js`. `relay/worker.js` should remain unchanged in the minimum slice.
- **State/schema changes:** optional `receipt`, `review`, and `application` nested objects inside existing `pending[kind=ai]` records. No schema bump expected. Do not add raw provider payloads.
- **Verification commands:** V1, V2, V3, V4. V5 only if relay response envelopes are deliberately changed.
- **Manual checks:** M1, M2, M3; run success, provider error, cancel/close, edit-and-apply, reject, escalate, Undo, and old legacy proposal rendering.
- **Rollback:** render and act from existing top-level proposal fields; ignore nested receipt objects.

### A3. Mission Proof Bundle

- **Priority:** P0; third implementation mission.
- **Expected impact:** very high for every Codex/Claude/Cline collaboration and release handoff.
- **Complexity:** medium.
- **Risk:** medium. Too much ceremony could make Studio slower.
- **Dependencies:** `addBuild()`, build edit/render handlers, `missionVerified()`, `missionPacket()`, stage cycling, portable merge/convergence.
- **Likely files affected:** `index.html`; `test/app-logic.test.js`; `test/ui-contract.test.js`; `test/portable.test.js`; `test/merge.test.js`; `test/convergence.test.js`; `test/xss-corpus.test.js`; `docs/ai/WORK_PACKET_TEMPLATE.md`; `docs/ai/HANDOFF_TEMPLATE.md`; `docs/STATE_CONTRACT.md`; `docs/CURRENT_STATE.md`; `docs/DECISIONS.md`; `HANDOFF.md`; `sw.js`.
- **State/schema changes:** optional `proofBundle` object within `builds`, containing packet version/fingerprint, acceptance items, attempts, verification receipts, and override. No new top-level collection and no schema bump expected.
- **Verification commands:** V1, V2, V3, V4.
- **Manual checks:** M1, M2, M3; create legacy and structured missions, copy every packet type, return an old fingerprint, fail a check, waive an item, attempt Ship, and verify focus/keyboard behavior.
- **Rollback:** keep current mission fields and revert to legacy verification logic while ignoring `proofBundle`.

### A4. High-Stakes Interruption Card and Error Summary

- **Priority:** P1.
- **Expected impact:** high trust and accessibility improvement during rare risky actions.
- **Complexity:** small to medium.
- **Risk:** low if strictly allowlisted; high if overused.
- **Dependencies:** existing inline confirm pattern, focus-trap helpers, import/restore, sync re-key, AI apply target checks, form validation.
- **Likely files affected:** `index.html`; `test/ui-contract.test.js`; `test/app-logic.test.js`; `test/xss-corpus.test.js`; `docs/DECISIONS.md`; `docs/CURRENT_STATE.md`; `sw.js`.
- **State/schema changes:** none.
- **Verification commands:** V1, V3, V4.
- **Manual checks:** M1, M4; restore replacement, missing snapshot, re-key, cancel, browser Back/Escape, error-summary links, screen-reader announcement behavior.
- **Rollback:** return individual flows to current inline confirms. No state impact.

### A5. Read-Only Recovery Drill

- **Priority:** P1.
- **Expected impact:** high trust/recoverability; moderate daily frequency.
- **Complexity:** small to medium.
- **Risk:** low if the read-only boundary is mechanically enforced.
- **Dependencies:** existing backup parser, `portableDoc()`, import preview, corruption checks, snapshot metadata.
- **Likely files affected:** `index.html`; `test/app-logic.test.js`; `test/ui-contract.test.js`; `test/portable.test.js`; `test/xss-corpus.test.js`; `docs/STATE_CONTRACT.md`; `docs/CURRENT_STATE.md`; `docs/ADOPTION_SOAK.md`; `sw.js`.
- **State/schema changes:** device-local drill metadata only. No portable collection and no schema bump.
- **Verification commands:** V1, V2, V3, V4.
- **Manual checks:** M1, M2, M4 with good, old, newer, corrupt, oversized, and cancelled files; compare pre/post serialized state.
- **Rollback:** remove the drill UI and metadata. Restore/import remain unchanged.

---

## Track B — Valuable bounded experiments

### B1. Local Flight Recorder, two-operation pilot

- **Priority:** P1 after Track A top three.
- **Expected impact:** high trust and debugging value.
- **Complexity:** medium.
- **Risk:** medium to high because operation history can become cross-cutting.
- **Dependencies:** approved AI application, import/restore, snapshot/Undo helpers, a device-local bounded store.
- **Likely files affected:** `index.html`; `test/app-logic.test.js`; `test/ui-contract.test.js`; `test/xss-corpus.test.js`; possibly a new dependency-free `test/operations.test.js` wired into `test/run.sh`; `docs/STATE_CONTRACT.md`; `docs/ARCHITECTURE.md`; `docs/CURRENT_STATE.md`; `sw.js`.
- **State/schema changes:** device-local `operations` side store; no portable/synced state in the pilot.
- **Verification commands:** V1, V3, V4 plus the new operation test file.
- **Manual checks:** M1, M2, M4; apply/undo AI proposal, import/cancel/restore, prune expired receipt, corrupt side store.
- **Rollback:** stop recording, delete side-store key, remove view. Canonical state and snapshots remain valid.

### B2. Calm Friction Ledger, NOW-and-Capture pilot

- **Priority:** P1 experiment.
- **Expected impact:** medium to high if it reveals actionable system friction.
- **Complexity:** small.
- **Risk:** medium privacy/behavioral risk despite simple code.
- **Dependencies:** NOW item actions, Capture completion/abandon paths, Weekly Review rendering.
- **Likely files affected:** `index.html`; `test/app-logic.test.js`; `test/ui-contract.test.js`; `test/capture.test.js`; `test/xss-corpus.test.js`; `docs/ADOPTION_SOAK.md`; `docs/DECISIONS.md`; `sw.js`.
- **State/schema changes:** bounded device-local evidence bucket. No task text and no portable state.
- **Verification commands:** V1, V3, V4.
- **Manual checks:** M1, M2; mark, dismiss, duplicate-window compaction, weekly aggregate, clear all, disabled/no-use path.
- **Rollback:** delete local bucket and remove controls.

### B3. One-at-a-Time Capture Triage

- **Priority:** P2 experiment after adoption evidence confirms inbox friction.
- **Expected impact:** medium, potentially high on mobile.
- **Complexity:** medium because cross-record Undo must be correct.
- **Risk:** medium.
- **Dependencies:** existing Capture, task/note creation, `bury()`, save failure handling, feature-specific Undo.
- **Likely files affected:** `index.html`; `test/capture.test.js`; `test/app-logic.test.js`; `test/ui-contract.test.js`; `test/portable.test.js`; `test/merge.test.js`; `test/xss-corpus.test.js`; `docs/CURRENT_STATE.md`; `sw.js`.
- **State/schema changes:** optional disposition metadata only; likely no schema bump.
- **Verification commands:** V1, V2, V3, V4.
- **Manual checks:** M1, M2, M3; each disposition, cancel, double click, save failure, Undo, hostile text, empty inbox.
- **Rollback:** remove triage surface; captures and created records remain valid.

### B4. Material Conflict Diagnostics

- **Priority:** P2 experiment; test-first.
- **Expected impact:** uncertain but potentially high for sync trust.
- **Complexity:** medium in tests, high in production UI.
- **Risk:** high if routine merges become noisy.
- **Dependencies:** current merge helpers, tombstones, revisions, three-device convergence harness.
- **Likely files affected:** `test/merge.test.js`; `test/convergence.test.js`; possibly new `test/conflicts.test.js`; `docs/STATE_CONTRACT.md`; `docs/DECISIONS.md`. Production `index.html` only after evidence.
- **State/schema changes:** none in the first test-only phase. A production conflict record requires a separate schema decision.
- **Verification commands:** V2, V4 plus randomized/permutation fixtures.
- **Manual checks:** none for test-only phase; if UI follows, M1, M3, M4.
- **Rollback:** remove diagnostics/tests that are not part of the documented merge contract; do not alter current merge behavior during exploration.

### B5. Derived-View Checkpoint Pilot

- **Priority:** P2.
- **Expected impact:** medium trust/performance value if new receipts create expensive derived views.
- **Complexity:** small for one view; high if generalized.
- **Risk:** medium architectural creep.
- **Dependencies:** one measured derived view with meaningful recomputation cost.
- **Likely files affected:** `index.html`; `test/app-logic.test.js`; a focused new test if justified; `docs/ARCHITECTURE.md`; `docs/DECISIONS.md`; `sw.js`.
- **State/schema changes:** device-local discardable index/checkpoint only.
- **Verification commands:** V1, V4 plus a deterministic fingerprint/rebuild test and measured 1,000-task fixture.
- **Manual checks:** M2; corrupt/delete derived store and prove clean recomputation/fallback.
- **Rollback:** disable the derived view and recompute directly from canonical state.

---

## Track C — Research or future architecture options

### C1. Operation-based sync reference harness

- **Priority:** research only.
- **Expected impact:** improves confidence in current merge semantics and future conflict decisions.
- **Complexity:** medium.
- **Risk:** low if test-only; high if it becomes production architecture.
- **Dependencies:** TaskChampion-style operation fixtures and current KevinOS merge rules.
- **Likely files affected:** test-only files under `test/`; `docs/STATE_CONTRACT.md`; `docs/DECISIONS.md`.
- **State/schema changes:** none.
- **Verification commands:** V2, V4 plus permutation/property runs with fixed seeds.
- **Manual checks:** none.
- **Rollback:** remove the reference harness; production remains unchanged.

### C2. CRDT migration decision gate

- **Priority:** future option only after observed evidence.
- **Expected impact:** potentially high only for frequent simultaneous editing.
- **Complexity:** extreme.
- **Risk:** extreme migration, bundle, backup, performance, and semantic risk.
- **Dependencies:** measured unresolved conflicts, multi-device use data, field-level semantic policy, migration prototype, backward/forward compatibility plan.
- **Likely files affected:** nearly all state, sync, backup, service-worker, relay, and test surfaces.
- **State/schema changes:** fundamental document-format replacement.
- **Verification commands:** a new migration/convergence/property/performance/security suite far beyond the current gate.
- **Manual checks:** multi-version, multi-device, offline, interrupted migration, rollback, large-state, corrupt-state, and restore drills.
- **Rollback:** must be designed before approval and include deterministic export back to schema-v39-compatible JSON. Without that proof, the project does not begin.

**Approval threshold:** do not approve based on elegance. Require repeated real-world lost-edit incidents that cannot be fixed with the current revision/tombstone model plus bounded conflict receipts.

### C3. External personal-data adapter contract

- **Priority:** future option.
- **Expected impact:** uncertain; useful only when one specific source repeatedly improves a defined KevinOS action.
- **Complexity:** medium to high per source.
- **Risk:** high privacy and maintenance risk.
- **Dependencies:** a named use case, explicit user-selected source, data minimization, credential boundary, failure-as-data, and local cache policy.
- **Likely files affected:** relay route matrix/worker/tests if OAuth/API based; `index.html`; state/security docs.
- **State/schema changes:** source-specific and not approved in advance.
- **Verification commands:** V1–V5 plus route-specific OAuth, SSRF, body-limit, error-envelope, and secret-scan tests.
- **Manual checks:** consent, disconnect, token revocation, partial failure, offline behavior, delete-source-data.
- **Rollback:** disconnect source, revoke token, delete local cache, preserve canonical KevinOS records only if Kevin explicitly created them.

HPI is the pattern source, not a mandate to collect more data.

---

## Do not build

1. **No React/Vue/Svelte/Angular/Flutter rewrite.** It would replace a verified product advantage with build tooling and migration risk.
2. **No Automerge, Yjs, PouchDB, RxDB, TinyBase, or LiveStore production migration now.** Learn from their contracts; do not replace KevinOS state without a demonstrated failure.
3. **No always-on activity surveillance.** No window titles, URLs, keystrokes, idle monitoring, emotion inference, or productivity score.
4. **No autonomous-agent runtime inside KevinOS.** No shell, browser automation, repository mounts, sandbox manager, or self-directed loops.
5. **No plugin marketplace or user-script system.** It would weaken CSP, deterministic behavior, supportability, and privacy.
6. **No provider expansion for its own sake.** Add a provider only when a concrete mode, privacy policy, and test case justify it.
7. **No multi-user SaaS, roles, team workspaces, billing, or account system.** The relay remains optional infrastructure, not the product center.
8. **No gamification pressure.** No XP, streak punishment, guilt messages, leaderboards, or artificial completion celebrations.
9. **No general knowledge graph or PKM transformation.** Notes, Library, and projects should support action; KevinOS does not need to become Logseq or AppFlowy.
10. **No universal numerical priority score.** Reason codes and explicit focus are more trustworthy than an opaque composite.
11. **No mandatory evidence capture for ordinary life.** Proof is for consequential system transitions and delegated technical missions, not every personal choice.
12. **No cloud observability stack.** Local semantic receipts are enough.
13. **No raw provider transcript archive by default.** Preserve only the proposal and minimum proof metadata Kevin needs.
14. **No conflict editor before evidence.** Strengthen fixtures first; ship UI only for a reproduced material ambiguity.
15. **No giant combined “KevinOS Intelligence Release.”** The top three missions must land separately.

---

# Top three implementation missions

These missions are intentionally ordered. Each is independently shippable, reversible, and small enough for one Codex engineer to implement and prove. Do not combine them into one branch or one release.

## Mission 1 — Decouple attention from storage order

### Mission outcome

KevinOS NOW uses an explicit, deterministic daily focus order and shows a concise reason for each selected commitment. Reordering focus does not reorder `state.items`.

### Why this is first

This is the only recommendation that directly changes the answer to KevinOS's north-star question every day. It also fixes a concrete implementation smell in v0.50: `moveFocusTask()` swaps records in the canonical task array while `nowModel()` takes the first three eligible records.

### Authoritative starting points

Read before editing:

- `AGENTS.md`;
- `docs/STATE_CONTRACT.md`;
- `docs/DECISIONS.md`;
- `docs/CURRENT_STATE.md`;
- `index.html` around:
  - `CONTENT_ARRAYS` and `portableDoc()`;
  - `touch()` and `bury()`;
  - `moveFocusTask()`;
  - `windItems()`;
  - `nowModel()`;
  - NOW/focus rendering and event handlers;
- `test/app-logic.test.js`;
- `test/ui-contract.test.js`;
- `test/portable.test.js`;
- `test/merge.test.js`;
- `test/convergence.test.js`;
- `README.md` release checklist.

### In scope

1. Add optional task fields:

```text
focusDate
focusRank
focusSetAt
focusSource
```

2. Add pure helpers with no state mutation during read:

```text
validFocusRank(task, dayKey)
focusItems(dayKey)
attentionReasons(task, dayKey, context)
compactFocusRanks(dayKey)       // called only after an explicit mutation
```

3. Change `moveFocusTask(id, dir)` so it:

- operates only on currently eligible focus items;
- assigns or swaps explicit ranks;
- never swaps `state.items` records;
- stamps `focusDate`, `focusRank`, `focusSetAt`, `focusSource="manual"`;
- calls `touch()` only on tasks whose focus metadata changes;
- calls the existing save/render path once.

4. Change `nowModel()` to use `focusItems()` and include reason codes/labels.

5. Render one quiet reason line per NOW commitment and an expandable “Why these?” explanation.

6. Preserve current v0.50 order exactly for all legacy states with no active focus fields.

7. Add a clear action to remove explicit daily focus and return to deterministic fallback order.

8. Document the ordering and tie rules as a state contract.

### Out of scope

- no numerical priority score;
- no AI-generated focus;
- no automatic time tracking;
- no new top-level state collection;
- no CRDT or merge rewrite;
- no project-wide drag-and-drop framework;
- no changes to task eligibility beyond the existing `windItems()` rule;
- no recurrence redesign;
- no notifications.

### Required deterministic contract

For `dayKey = todayKey()`:

```text
eligible = all open tasks where task.today is true
           OR task.due exists and task.due <= dayKey

explicit = eligible tasks where task.focusDate === dayKey
           AND focusRank is integer 1..3

sort explicit by:
  focusRank ascending
  focusSetAt ascending
  id ascending

fallback = eligible tasks not in explicit, preserving state.items order

ordered = explicit + fallback
NOW = ordered.slice(0, 3)
```

If two explicit tasks have the same rank after merge, the deterministic sort above chooses display order. The UI should flag duplicate active ranks in an expandable diagnostic and the next explicit focus mutation should compact ranks. Do not silently mutate state during render or boot merely to repair rank duplicates.

Reason codes are evaluated in this fixed order and may return more than one code, with only the first shown by default:

```text
manual-focus
overdue
due-today
marked-today
project-next-action
fallback-order
```

Labels must be plain-language and stable. Avoid claims such as “most important” unless Kevin explicitly set rank 1.

### Acceptance criteria

1. Given any v0.50 state with no focus fields, `nowModel()` returns the same task IDs and order as before.
2. Moving a task up/down changes focus metadata but leaves the sequence of `state.items.map(id)` byte-identical.
3. Refresh and offline reload preserve explicit focus.
4. Portable export/import preserves optional focus fields.
5. Two-device merge and three-device convergence remain deterministic.
6. Completing, deleting, or making a task ineligible cannot produce a duplicate visible NOW item.
7. Stale focus fields from a prior date do not affect today's ordering.
8. A task may be explicitly focused only through direct UI or a separately approved proposal application; no background function sets it.
9. Reason labels are rendered with text escaping.
10. Keyboard controls expose the same move/reset capability as pointer controls.
11. The app remains usable at 320px without horizontal scrolling.
12. Full release gate is green.

### Required automated tests

Add table-driven tests for:

- legacy fallback parity;
- ranks 1/2/3;
- missing rank;
- invalid rank values;
- stale date;
- same-rank tie by timestamp then ID;
- explicit items plus fallback;
- overdue/due-today/marked-today reason order;
- project next-action reason;
- completion and tombstone;
- rank reset;
- move up/down at boundaries;
- repeated move idempotence;
- merge where separate devices focus different tasks;
- merge where separate devices assign the same rank;
- export/import;
- three-device permutations.

Run:

```text
node tools/doctor.js
node test/app-logic.test.js
node test/ui-contract.test.js
node test/portable.test.js
node test/merge.test.js
node test/convergence.test.js
sh test/run.sh
```

### Required manual browser proof

At 320×568, 390×844, 430×932, 768×1024, and 1440×900:

1. create five eligible tasks;
2. set ranks 1–3;
3. move rank 3 to rank 1;
4. prove Library/task-list storage order did not change unexpectedly;
5. reload online and offline;
6. complete rank 2;
7. reset focus;
8. use keyboard only;
9. inspect focus, Escape behavior, and zero console errors.

### Documentation and release work

- update `docs/STATE_CONTRACT.md` with the exact focus fields, ordering, tie, and merge behavior;
- record the decision in `docs/DECISIONS.md`;
- update `docs/CURRENT_STATE.md` with test evidence;
- update `HANDOFF.md` with the implemented symbols and remaining risks;
- follow the release three-bump rule in `index.html`/footer/`sw.js`;
- do not bump `SCHEMA_VERSION` unless tests prove current normalization cannot preserve the optional fields.

### Rollback plan

A clean rollback removes the helper/render logic and causes NOW to use legacy eligible-array order. Optional focus fields remain inert and harmless. Do not write a destructive migration that strips them.

### Stop conditions

Stop and report instead of expanding scope if:

- preserving legacy order requires a broad task-data migration;
- focus metadata causes unrelated task fields to lose concurrent edits in realistic fixtures;
- the UI needs more than one new visible line and one expandable explanation per item;
- a schema bump becomes necessary for reasons other than optional-field preservation.

### Completion receipt

The engineer's handoff must include:

- exact changed files;
- old vs new task-order proof;
- focus contract summary;
- test commands and exit status;
- browser widths checked;
- app/schema/cache versions;
- commit/checkpoint reference;
- known limitations;
- rollback instructions.

---

## Mission 2 — Make every AI proposal a proof-bearing job

### Mission outcome

AI proposals carry a versioned, model-neutral receipt covering context manifest, request/response identity, timing, local validation, human review, application target, and Undo state. Existing explicit approval behavior remains unchanged.

### Why this is second

KevinOS already has the correct authority boundary. This mission strengthens evidence without introducing autonomy. It will improve every current and future provider more than adding another provider or AI mode.

### Authoritative starting points

Read before editing:

- `AGENTS.md`;
- `docs/ARCHITECTURE.md`;
- `docs/STATE_CONTRACT.md`;
- `docs/DECISIONS.md`;
- `index.html` around:
  - `AI_PROMPTS`;
  - `normalizeAiProposal()`;
  - `aiContext()`;
  - `buildAiSharedContext()`;
  - `aiFingerprint()`;
  - `runAiProposal()`;
  - `editAIProposal()`;
  - `applyAIProposal()`;
  - `rejectAIProposal()`;
  - `escalateAIProposal()`;
  - `undoAIProposal()`;
  - AI proposal rendering;
- relay route documentation, but do not change the Worker in the minimum slice;
- relevant app, UI, portable, merge, convergence, and XSS tests.

### In scope

1. Define `AI_RECEIPT_VERSION = 2` or an equivalent named policy constant.
2. Define a model-neutral mode registry around existing `AI_PROMPTS`:

```text
mode
promptId
promptVersion
outputKind
maxContextBytes
maxOutputCharacters
validatorNames[]
```

3. Build a deterministic context manifest before send.
4. Canonicalize and fingerprint the normalized request.
5. Record start, completion, latency, provider, model, and attempt status.
6. Canonicalize and fingerprint returned proposal text.
7. Run named deterministic local validators.
8. Preserve the difference among raw returned proposal, Kevin-edited proposal, decision, and applied target.
9. Render a compact collapsed receipt.
10. Normalize legacy proposals into a safe read-only receipt view without fabricating facts.

### Out of scope

- no hidden reasoning storage;
- no chain-of-thought request;
- no raw provider JSON archive;
- no automatic retry loop;
- no AI judge as sole validator;
- no tool execution;
- no new provider;
- no relay refactor;
- no automatic application;
- no telemetry or hosted observability;
- no new top-level state collection.

### Required receipt contract

A new proposal should contain an optional object equivalent to:

```text
receipt: {
  version: 2,
  jobId,
  mode,
  createdAt,
  startedAt,
  completedAt?,
  latencyMs?,
  prompt: {
    id,
    version,
    fingerprint
  },
  provider: {
    id,
    model,
    seat
  },
  context: {
    categories[],
    sources[],
    recordCount,
    approximateBytes,
    omittedCategories[],
    fingerprint
  },
  requestFingerprint,
  responseFingerprint?,
  output: {
    kind,
    schemaVersion,
    parseStatus,
    reviewedFingerprint?
  },
  validation: {
    status,
    checks[]
  },
  attempts[]
},
review: {
  action,
  at,
  edited,
  reasonCode?
},
application: {
  state,
  targetKind?,
  targetId?,
  appliedAt?,
  undoneAt?,
  undoAvailable?
}
```

Use the current top-level fields as compatibility mirrors during the transition. Do not move data in a way that breaks old records.

### Minimum context-manifest contract

For the first release, each source entry needs only:

```text
category
recordCount
approximateBytes
status = included | empty | omitted | error
deduplicatedCount
```

`approximateBytes` must be measured from the exact normalized context string sent to `relayPost()`. Do not label it tokens.

Before sending, compute the context fingerprint. Immediately before `relayPost()`, recompute and assert it matches the preview/send value. A mismatch blocks send and asks Kevin to review again.

### Minimum local validators

Start with the existing text proposal contract, not a new structured-output format. Use three or four deterministic checks:

```text
non-empty-text
within-output-character-limit
safe-text-rendering-path
one-primary-action-line       # only for Plan/next-action-like modes
```

A failed validator does not erase the proposal. It marks the receipt “Needs review.” Provider text cannot override these results.

### Required state transitions

```text
working -> review
working -> error
working -> cancelled          # if cancellation is added; otherwise omit
review -> edited
review|edited -> applied
review|edited -> rejected
review|edited -> escalated
applied -> undone
```

Do not allow `error`, `rejected`, `escalated`, or `undone` to apply without an explicit new review transition.

A retry, if included, must append a new attempt and preserve the old response/result. It must be user-triggered.

### Acceptance criteria

1. Every new AI proposal receives a receipt v2 job ID and request fingerprint before relay send.
2. Context preview shows categories, record count, byte count, and omission status.
3. The exact send string matches the recorded context fingerprint.
4. Provider error creates a bounded error attempt without a response fingerprint.
5. Successful response records provider/model, completion, latency, response fingerprint, and named validation checks.
6. Editing preserves original response fingerprint and records a reviewed fingerprint.
7. Applying uses the reviewed text and records target/Undo state.
8. Undo updates application state without rewriting the original receipt.
9. Rejection cannot create a target.
10. Legacy proposals render with “legacy/unrecorded” values only where facts are absent; no invented timing or validation pass.
11. Receipts survive export/import, merge, and three-device convergence.
12. No receipt contains relay token, provider key, OAuth token, raw hidden reasoning, or duplicated full context.
13. Full release gate is green.

### Required automated tests

- stable canonical request serialization;
- property-order normalization;
- category-order normalization;
- context byte count and fingerprint;
- preview/send mismatch block;
- provider success/error;
- output-size failure;
- empty output;
- hostile HTML/script text;
- edit-and-apply;
- reject;
- escalate;
- Undo;
- duplicate response fingerprint;
- legacy normalization;
- malformed receipt normalization;
- portable round-trip;
- two-device merge of review decisions;
- three-device convergence;
- secret-shaped field scan.

Run:

```text
node tools/doctor.js
node test/app-logic.test.js
node test/ui-contract.test.js
node test/xss-corpus.test.js
node test/portable.test.js
node test/merge.test.js
node test/convergence.test.js
sh test/run.sh
```

Do not run V5 unless the Worker changes. The preferred implementation does not require a Worker change.

### Required manual browser proof

At the standard widths:

1. open composer and select/deselect every context category;
2. inspect compact and full previews;
3. send one successful proposal;
4. simulate or use a provider error path;
5. edit and apply to task/note/event and project where supported;
6. reject another proposal;
7. escalate another to Council;
8. Undo an applied proposal;
9. reload offline;
10. export/import;
11. inspect keyboard, focus return, and zero console errors.

### Documentation and release work

- document receipt fields, normalization, allowed transitions, and privacy exclusions in `docs/STATE_CONTRACT.md`;
- update `docs/ARCHITECTURE.md` with request → proposal → review → application evidence flow;
- record why raw provider payloads and hidden reasoning are excluded in `docs/DECISIONS.md`;
- update `docs/CURRENT_STATE.md` and `HANDOFF.md`;
- follow the three-bump release rule;
- keep schema v39 unless an unavoidable migration is demonstrated.

### Rollback plan

All existing top-level proposal fields remain functional. A rollback hides/ignores `receipt`, `review`, and `application` nested data. It must not delete receipt data during downgrade.

### Stop conditions

Stop and report if:

- the implementation requires storing a second copy of the full context;
- provider-specific response structures invade the portable state contract;
- deterministic fingerprints cannot be stable without a documented breaking version;
- the minimal validators require an LLM judge;
- the Worker must be broadly redesigned;
- proposal review becomes slower or visually noisier than the current primary task.

### Completion receipt

The handoff must include:

- receipt schema and normalization version;
- example redacted receipt;
- privacy exclusions;
- validator list;
- state transition table;
- changed files;
- test exits;
- browser proof;
- version/cache/schema status;
- rollback path;
- unresolved provider limitations.

---

## Mission 3 — Make “Shipped” mean proved

### Mission outcome

Studio missions use stable acceptance items, packet fingerprints, attempt receipts, and locally honest verification states. `missionVerified()` no longer treats arbitrary non-empty evidence text as sufficient proof.

### Why this is third

KevinOS is already being used as mission control for multiple AI collaborators. Improving handoff and proof quality compounds across every external coding tool, while remaining bounded to one existing content type.

### Authoritative starting points

Read before editing:

- `AGENTS.md`;
- `CONTRIBUTING-AI.md`;
- `docs/ai/WORK_PACKET_TEMPLATE.md`;
- `docs/ai/HANDOFF_TEMPLATE.md`;
- `docs/STATE_CONTRACT.md`;
- `docs/DECISIONS.md`;
- `index.html` around:
  - `addBuild()`;
  - build edit form and save handler;
  - `missionVerified()`;
  - `missionPacket()`;
  - `buildCard()`;
  - stage cycle and Shipped gate;
  - mission filters;
- app/UI/portable/merge/convergence/XSS tests.

### In scope

1. Add an optional `proofBundle` object inside each mission.
2. Add stable acceptance-item IDs and statuses.
3. Add packet version and deterministic packet fingerprint.
4. Add attempt records tied to packet fingerprint.
5. Add verification receipts that distinguish collaborator report from local verification.
6. Strengthen `missionVerified()`.
7. Update copied Work, Audit, Verification, and Handoff packets.
8. Preserve legacy free-text fields and normalize old missions.
9. Provide a visible, reasoned override path without weakening the default gate.

### Out of scope

- no repository access from KevinOS;
- no shell execution;
- no GitHub API requirement;
- no autonomous agent;
- no multi-user roles;
- no chat thread;
- no Kanban rewrite;
- no generic project management;
- no mandatory structure for simple idea-stage missions;
- no automatic parsing of command output as truth beyond named deterministic checks KevinOS can actually perform.

### Required proof-bundle contract

```text
proofBundle: {
  version: 1,
  packetFingerprint,
  acceptanceItems: [
    {
      id,
      text,
      status: pending | pass | fail | waived,
      evidenceRefs: [],
      checkedAt?,
      checkedBy?,
      waiverReason?
    }
  ],
  attempts: [
    {
      id,
      collaborator,
      role,
      packetFingerprint,
      startedAt,
      completedAt?,
      summary,
      changedFiles?: [],
      verificationReceipts: [
        {
          id,
          actionType: command | browser | manual-inspection | artifact,
          action,
          reportedStatus,
          localStatus: unverified | pass | fail | not-applicable,
          exitCode?,
          evidence,
          completedAt?
        }
      ]
    }
  ],
  override?: {
    reason,
    at
  }
}
```

Bound lengths and counts. For example, retain at most 10 attempts and 50 verification receipts per mission unless archived summary replaces older details.

### Packet fingerprint rules

The fingerprint must include normalized values for:

- mission outcome;
- current state;
- next physical action;
- repository, branch, worktree;
- allowed scope;
- forbidden files/actions;
- acceptance item IDs and text;
- verification commands;
- assigned role, but not transient UI state.

Set-like lists should be trimmed, de-duplicated, and sorted before hashing. Ordered acceptance items should preserve order. Any scope, acceptance, or command change changes the fingerprint.

### Strengthened verification rule

For a structured mission:

```text
missionVerified =
  acceptanceItems.length > 0
  AND every item is pass or waived
  AND every waived item has waiverReason
  AND at least one verification receipt has localStatus === pass
  AND latest relevant attempt.packetFingerprint === current packetFingerprint
  AND no latest relevant receipt has localStatus === fail
```

For a legacy mission with no `proofBundle`, preserve current editing and display but label it “Legacy evidence — convert to structured proof.” Do not silently mark it verified under the new contract. Provide a one-click conversion that creates acceptance items from non-empty lines only after Kevin reviews them.

An override can allow Shipped but must use the high-stakes interruption pattern and remain visibly “Shipped with override,” not “Verified.”

### Acceptance criteria

1. Existing missions load without data loss.
2. New structured missions cannot ship with only free-text evidence.
3. Every acceptance item has a stable safe ID.
4. All pass plus local proof permits Shipped.
5. Any pending/fail blocks Shipped.
6. Waiver requires a reason and remains visible in copied packets.
7. A returned attempt with a stale packet fingerprint cannot verify current scope.
8. Collaborator-reported pass is not automatically a local pass.
9. Packet copy includes fingerprint and acceptance IDs.
10. Handoff copy emphasizes unresolved items and failed/not-run checks.
11. Attempt and evidence text renders safely.
12. Portable export/import and convergence preserve bundle identity.
13. Stage filters remain correct.
14. Full release gate is green.

### Required automated tests

- legacy mission normalization;
- structured mission creation;
- safe stable IDs;
- duplicate IDs;
- packet fingerprint stability;
- fingerprint changes for scope/acceptance/test changes;
- irrelevant UI edit does not change fingerprint;
- pass/fail/pending/waived matrix;
- waiver without reason;
- local vs reported status;
- stale packet attempt;
- Shipped gate via button cycle and form save;
- override flow;
- copy packet escaping;
- bounded attempt retention;
- malformed proof bundle;
- portable round-trip;
- two-device acceptance-item merge;
- three-device convergence;
- XSS corpus across evidence, command, paths, and handoff.

Run:

```text
node tools/doctor.js
node test/app-logic.test.js
node test/ui-contract.test.js
node test/xss-corpus.test.js
node test/portable.test.js
node test/merge.test.js
node test/convergence.test.js
sh test/run.sh
```

### Required manual browser proof

At all standard widths:

1. create a legacy mission and confirm no data loss;
2. convert acceptance lines to reviewed items;
3. copy Work/Audit/Verify/Handoff packets;
4. add one attempt with a matching fingerprint;
5. mark a check reported pass but locally unverified;
6. prove Shipped is blocked;
7. add local proof and pass all items;
8. ship;
9. change allowed scope and prove old proof becomes stale;
10. waive one item with reason;
11. use the explicit override and confirm the visual distinction;
12. keyboard-only edit, focus, Escape, and zero console errors.

### Documentation and release work

- update both AI templates to mirror the implemented packet and handoff contract;
- document proof-bundle fields and legacy behavior in `docs/STATE_CONTRACT.md`;
- document the difference among reported, machine-local, manual, waived, and override states in `docs/DECISIONS.md`;
- update `docs/CURRENT_STATE.md`, `CONTRIBUTING-AI.md`, and `HANDOFF.md`;
- follow the three-bump release rule;
- keep schema v39 unless optional nested preservation fails under current normalizers.

### Rollback plan

Revert the new verification UI/logic and continue using legacy fields. Leave `proofBundle` data untouched and inert. Do not flatten structured evidence back into one text blob.

### Stop conditions

Stop and report if:

- stable packet fingerprinting requires repository access;
- the minimum UI cannot remain understandable on mobile;
- structured evidence forces a new top-level collection;
- merge behavior can silently delete acceptance items or attempts;
- the implementation starts executing commands;
- the engineer attempts to redesign all Studio stages or add team collaboration.

### Completion receipt

The handoff must include:

- proof-bundle schema;
- exact `missionVerified()` truth table;
- packet fingerprint normalization rules;
- legacy behavior;
- changed files;
- test exits;
- copied packet examples;
- manual browser proof;
- version/cache/schema status;
- rollback instructions;
- unresolved limitations.

---

# Licensing and attribution review

## Engineering conclusion

The safest default for KevinOS is **independent reimplementation of bounded ideas and contracts**. Even permissive code is rarely worth transplanting into a dependency-free ES5 single-file application because the source is usually TypeScript, Rust, Python, Go, PHP, or framework-specific JavaScript. Independent implementation also avoids dragging foreign abstractions into KevinOS.

This section is engineering guidance, not legal advice.

## Reuse categories

### 1. Ideas and interaction patterns

Examples:

- explicit attention reasons;
- operation logs;
- prediction versus human review;
- checklist/run/retrospective separation;
- interruption-page eligibility;
- context provenance.

These should be described in KevinOS's own words and implemented independently. Keep a design-source note in `docs/DECISIONS.md`, but do not copy distinctive prose, screenshots, or visual branding.

### 2. Algorithms and data contracts

Examples:

- stable normalized fingerprints;
- source/type/timestamp event envelopes;
- operation/action/observation IDs;
- assertion case structure;
- packet fingerprints;
- conflict receipts.

A general contract can be re-created independently, but exact source structures, comments, test vectors, or distinctive naming may still be copyrighted expression. Use clean-room-style translation: write the KevinOS requirement first, then implement against KevinOS tests.

### 3. Portable source modules or snippets

No finalist module is recommended for direct copy into `index.html` during the next evolution. If a future engineer copies even a small snippet:

- record repository, exact commit, path, license, and copied lines;
- retain required copyright/license notices;
- verify the snippet does not depend on unreviewed transitive code;
- add an attribution file or comment appropriate to the license;
- run a license scan before release.

### 4. Installable dependencies

No new dependency is recommended for the top three missions. TinyBase, Automerge, Promptfoo, Inspect AI, Aider, and OpenHands are all useful sources, but installing them would violate or pressure the current architecture.

### 5. Concepts that should only be studied

AGPL, mixed-license, surveillance-heavy, or architecture-replacing systems should contribute principles only. This includes eLabFTW code, Mattermost enterprise code, ActivityWatch's full tracking stack, and OpenHands's runtime.

## License-by-license implications

### MIT

Finalists verified as MIT include Actual Budget, Taskwarrior, TaskChampion, TinyBase, Automerge, Promptfoo, Inspect AI, HPI, GOV.UK Frontend, and OpenHands.

MIT generally permits use, modification, and redistribution with preservation of the copyright and permission notice. For KevinOS:

- direct copying is legally simpler than copyleft sources but still creates attribution and maintenance obligations;
- visual branding and trademarks are separate;
- independent ES5 implementation remains preferred.

### Apache-2.0

Aider, LLM, Label Studio, and Jujutsu use Apache-2.0. The open portion of Mattermost Playbooks is also Apache-2.0.

Apache-2.0 adds an express patent license and conditions around notices and modified files. If copied code includes a `NOTICE` requirement, preserve it. Do not assume “permissive” means “no attribution.”

### Three-clause BSD text

TiddlyWiki's root `license` file contains the three-clause BSD form even though GitHub's repository metadata did not assign a standard SPDX ID at verification time. Preserve the copyright, conditions, and disclaimer for any copied code.

### MPL-2.0

ActivityWatch uses MPL-2.0, a file-level copyleft license. Copying ActivityWatch code into KevinOS's monolithic `index.html` could create source-distribution obligations for that modified file. Because `index.html` is the product's primary file, direct copying is a poor fit. Transfer the event-bucket idea only.

### AGPL-3.0

eLabFTW uses AGPL-3.0. Modified network-accessible versions generally trigger source-offer obligations. KevinOS should not copy eLabFTW source. Study laboratory record patterns and write independent code.

### Mixed Mattermost license

Mattermost Playbooks states that the repository is Apache-2.0 except `server/enterprise`, which uses the Mattermost Source Available License. Never copy from, adapt from, or use enterprise-path code without a separate license review. The recommended Mission Proof Bundle is an independent contract based on generic playbook/run/checklist concepts.

### W3C materials

GitHub reports `NOASSERTION` for the W3C ARIA Practices repository. W3C publishes its own document/software license terms. Use the APG as behavior guidance and verify the applicable W3C license before copying examples verbatim. Native semantic HTML plus KevinOS-authored tests is preferable.

## Finalist reuse matrix

| Finalist | Ideas/patterns | Contract/algorithm | Copy code | Install dependency |
|---|---|---|---|---|
| ActivityWatch | **Yes** | Reimplement | **No recommended** — MPL risk in monolith | No |
| Actual Budget | **Yes** | Reimplement | Possible under MIT, not needed | No |
| Taskwarrior | **Yes** | Reimplement named factors/reasons | Possible under MIT, not needed | No |
| TaskChampion | **Yes** | Test/reference only | Possible under MIT, poor language/runtime fit | No |
| TiddlyWiki5 | **Yes** | Reimplement import staging | Possible with BSD notice, not needed | No |
| TinyBase | **Yes** | Reimplement one derived-view contract | Possible under MIT, not needed | **Watch only** |
| Automerge | **Yes** | Convergence/conflict fixtures | Possible under MIT, not recommended | **No now** |
| Jujutsu | **Yes** | Reimplement operation receipt | Possible under Apache-2.0, not needed | No |
| Aider | **Yes** | Reimplement scope map/fingerprint | Possible under Apache-2.0, not needed | No |
| LLM | **Yes** | Reimplement receipt/message ideas | Possible under Apache-2.0, not needed | No |
| Promptfoo | **Yes** | Reimplement tiny JSON cases | Possible under MIT, not needed | No |
| Inspect AI | **Yes** | Reimplement task/check/log split | Possible under MIT, not needed | No |
| Label Studio | **Yes** | Reimplement proposal/review stages | Possible under Apache-2.0, not needed | No |
| Mattermost Playbooks | **Yes** | Reimplement proof bundle | Only after path-level license check; not recommended | No |
| eLabFTW | **Yes** | Independent experiment receipt | **No** — AGPL source | No |
| HPI | **Yes** | Reimplement context manifest | Possible under MIT, not needed | No |
| GOV.UK Frontend | **Yes** | Reimplement behavior and language principles | Possible under MIT, avoid branding transplant | No |
| OpenHands | Typed-envelope lesson only | Tiny independent envelope | No runtime code needed | **Reject** |

## Attribution ledger recommended for future work

Add a lightweight documentation table if any external code is ever copied:

```text
Source project
Repository URL
Exact commit/tag
Source path and line range
License/SPDX
KevinOS destination
Nature of use: copied | modified | translated
Required notice location
Reviewer/date
```

No attribution ledger is required for this research mission because KevinOS source was not modified and no external code was copied.

---

# Risks and rejected directions

## Primary implementation risks

### 1. Whole-record merge amplification

KevinOS merges entity records by update stamp. Adding focus or proof metadata to an existing record and calling `touch()` can cause that record to win against a concurrent edit to another field. This is already part of the current record-level contract, but the new fields may increase the frequency of touches.

**Mitigation:** add realistic concurrent-edit fixtures before release; touch only records that actually change; avoid background normalization writes; consider a future field-level strategy only if evidence shows lost edits.

### 2. Optional-field drift across versions

An older client may preserve unknown fields through deep clone but not understand their meaning. A newer client may rely on fields an older client edits around.

**Mitigation:** legacy behavior must remain correct without the fields; new UI must tolerate missing/malformed nested objects; fingerprint/version fields must be explicit; multi-version testing should be added before any field becomes safety-critical.

### 3. Fingerprints that are stable only by accident

Property order, whitespace, array order, timestamps, or release-specific normalization can change fingerprints unexpectedly.

**Mitigation:** define canonical serialization and version it; sort only set-like data; preserve semantically ordered arrays; never include transient UI state; test fixtures across releases.

### 4. Receipts becoming duplicated private content

AI, mission, operation, and friction receipts can quietly become a second archive of task text, context, command output, and personal behavior.

**Mitigation:** store fingerprints, IDs, counts, bounded summaries, and explicit evidence references; cap retention; classify every field as portable, synced, device-local, or excluded; add secret/content-minimization tests.

### 5. Proof bureaucracy

Structured acceptance and evidence can improve trust but also make small work feel heavy.

**Mitigation:** require full proof only in Testing/Shipped transitions; keep Idea/Building lightweight; allow simple missions to opt into structure when delegated; show unresolved items, not the entire record, by default.

### 6. Validation mistaken for truth

A proposal can pass structure, length, and safety checks while still being bad advice.

**Mitigation:** label checks as local contract validation, not factual verification; keep human review mandatory; use outcome feedback only as coarse evidence.

### 7. Accessibility regression from richer cards

Expandable receipts and checklists can introduce focus loss, nested controls, small targets, and unreadable mobile layouts.

**Mitigation:** native elements first; one disclosure depth; WAI-ARIA APG behavior tests; full M1 checks; no horizontal data tables in primary mobile flows.

### 8. Cache/version drift

KevinOS has previously shipped app/cache version drift. Every app release touching `index.html` must bump app version, static footer, and service-worker cache together.

**Mitigation:** keep `tools/doctor.js` authoritative; add focused tests only if the current doctor does not already fail on all three forms of drift.

### 9. Experiment persistence after failure

A friction ledger or derived view may remain after it stops helping because removal feels like lost work.

**Mitigation:** every experiment has an end date, success evidence, retention, and prune path in `docs/ADOPTION_SOAK.md`.

### 10. Research freshness

Repository licenses, releases, ownership, and architecture can change.

**Mitigation:** pin exact reviewed commits in implementation notes; re-verify license before copying or installing anything; do not treat this August 11, 2026 snapshot as permanent.

## Rejected direction 1 — framework rewrite

**Attraction:** component structure, modern tooling, easier recruitment, ecosystem libraries.

**Why rejected:** KevinOS's single-file dependency-free PWA is part of its trust and portability model. A rewrite would create an extended parity project, new supply-chain risk, build/deploy failure modes, and migration complexity without improving the north star.

**Revisit only if:** the current architecture demonstrably prevents a required accessibility, performance, or security property and an isolated fix has failed.

## Rejected direction 2 — full CRDT migration

**Attraction:** elegant offline convergence and conflict preservation.

**Why rejected:** KevinOS already has optimistic revisions, tombstones, remote merge, snapshots, and three-device convergence. There is no evidence of frequent simultaneous editing requiring a new document model. CRDT adoption would change backups, schema, performance, bundle size, and user-facing conflict semantics.

**Revisit only if:** repeated real lost-edit incidents remain after better fixtures and bounded conflict receipts.

## Rejected direction 3 — autonomous agent mission control

**Attraction:** visible progress, tool use, automated coding, resumable work.

**Why rejected:** OpenHands-scale infrastructure would compete with KevinOS, expose local files/credentials, and weaken explicit approval. Kevin already uses specialized external coding agents; KevinOS should improve packets and proof, not recreate them.

**Revisit only if:** a narrowly scoped, local, non-mutating verification action has a clear security model and cannot be done through an external tool.

## Rejected direction 4 — passive behavioral surveillance

**Attraction:** “objective” productivity evidence and smart suggestions.

**Why rejected:** it changes KevinOS from a trusted tool into an observer, creates a sensitive data set, encourages metric optimization, and risks guilt. ActivityWatch is valuable because it is transparent and local for its own purpose; KevinOS does not need its data breadth.

**Revisit:** never for window titles, URLs, keystrokes, or silent emotion/productivity inference. Only explicit low-resolution events are compatible.

## Rejected direction 5 — universal urgency score

**Attraction:** one sortable number and automatic prioritization.

**Why rejected:** factor weights create false precision and hide values. KevinOS should show explicit manual focus and plain reasons. Taskwarrior's model is useful as a lesson in transparency, not as a score to import.

**Revisit only if:** Kevin explicitly asks for configurable scoring and the UI always exposes the factors. Even then, it should remain an optional view, not NOW authority.

## Rejected direction 6 — gamification

**Attraction:** engagement, streaks, rewards, visible progress.

**Why rejected:** it can create pressure, shame, and optimization for points rather than meaningful action. KevinOS already has enough positive feedback through completion and recovery proof.

## Rejected direction 7 — cloud observability and AI evaluation stack

**Attraction:** dashboards, traces, provider comparison, centralized logs.

**Why rejected:** Langfuse/Promptfoo/Inspect-style hosted or developer infrastructure is disproportionate for a personal local-first app and could expose private prompts and outcomes. Tiny local receipts and synthetic fixtures supply the needed trust.

## Rejected direction 8 — plugin marketplace and programmable PKM

**Attraction:** extensibility, community modules, custom workflows.

**Why rejected:** arbitrary code, plugin permissions, version compatibility, CSP exceptions, and user support would undermine deterministic behavior. SilverBullet, Logseq, Trilium, and TiddlyWiki show the power and cost of programmability. KevinOS should remain curated.

## Rejected direction 9 — multi-user SaaS productization

**Attraction:** collaboration, accounts, shared workspaces, revenue paths.

**Why rejected:** it would require identity, permissions, cloud storage, moderation, billing, and a different threat model. It does not improve Kevin's personal daily operating system.

## Rejected direction 10 — all concepts in one release

**Attraction:** a dramatic “intelligence upgrade.”

**Why rejected:** it would entangle state, UI, AI, mission, recovery, and evidence changes, making regressions and adoption results impossible to attribute. Ship Focus Rail, AI Job Receipt, and Mission Proof Bundle separately.

---

# Source index

All sources below are primary repositories, official documentation, exact reviewed commits, or official releases. Verification date: August 11, 2026.

## KevinOS source inspected

- Supplied archive: `kevinos-main 2(1).zip`
- Required internal files: `AGENTS.md`, `README.md`, `docs/CURRENT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/STATE_CONTRACT.md`, `docs/DECISIONS.md`, `docs/ROOM_MAP.md`, `docs/RELAY_ROUTE_MATRIX.md`, `docs/ADOPTION_SOAK.md`, AI templates, `index.html`, `sw.js`, `manifest.json`, relay worker/tests, and handoffs.

## Attention and personal operating systems

- [ActivityWatch repository](https://github.com/ActivityWatch/activitywatch) · [reviewed commit](https://github.com/ActivityWatch/activitywatch/commit/25e34c71882fd4cf054731bf7f74ca92b934b0d6) · [data model](https://docs.activitywatch.net/en/latest/buckets-and-events.html)
- [Super Productivity](https://github.com/super-productivity/super-productivity)
- [Taskwarrior repository](https://github.com/GothenburgBitFactory/taskwarrior) · [release v3.4.2](https://github.com/GothenburgBitFactory/taskwarrior/releases/tag/v3.4.2) · [urgency documentation](https://taskwarrior.org/docs/urgency/)
- [Org mode](https://github.com/bzg/org-mode)
- [Vikunja](https://github.com/go-vikunja/vikunja)
- [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy)
- [Logseq](https://github.com/logseq/logseq)
- [SilverBullet](https://github.com/silverbulletmd/silverbullet)
- [TriliumNext](https://github.com/TriliumNext/Trilium)
- [TiddlyWiki5 repository](https://github.com/TiddlyWiki/TiddlyWiki5) · [reviewed commit](https://github.com/TiddlyWiki/TiddlyWiki5/commit/40b353bd0e7ed5a2f8103277f4600726b8ea317a) · [license text](https://github.com/TiddlyWiki/TiddlyWiki5/blob/40b353bd0e7ed5a2f8103277f4600726b8ea317a/license)
- [todo.txt-cli](https://github.com/todotxt/todo.txt-cli)
- [Habitica](https://github.com/HabitRPG/habitica)

## Local-first data, recovery, and convergence

- [Actual Budget repository](https://github.com/actualbudget/actual) · [release v26.8.1](https://github.com/actualbudget/actual/releases/tag/v26.8.1) · [reviewed commit](https://github.com/actualbudget/actual/commit/435f2d51ee312ed9a6925bad506fc3b7132d8017) · [CRDT warning](https://github.com/actualbudget/actual/blob/435f2d51ee312ed9a6925bad506fc3b7132d8017/packages/crdt/README.md) · [repair source](https://github.com/actualbudget/actual/blob/435f2d51ee312ed9a6925bad506fc3b7132d8017/packages/loot-core/src/server/sync/repair.ts)
- [TaskChampion repository](https://github.com/GothenburgBitFactory/taskchampion) · [release v3.1.0](https://github.com/GothenburgBitFactory/taskchampion/releases/tag/v3.1.0) · [reviewed commit](https://github.com/GothenburgBitFactory/taskchampion/commit/314dcf7e2cbd5a1f63e3fc945b2866ee870eac05)
- [TinyBase repository](https://github.com/tinyplex/tinybase) · [release v9.4.0](https://github.com/tinyplex/tinybase/releases/tag/v9.4.0) · [documentation](https://tinybase.org/)
- [Automerge repository](https://github.com/automerge/automerge) · [release v3.4.0](https://github.com/automerge/automerge/releases/tag/js%2Fautomerge-3.4.0) · [sync source](https://github.com/automerge/automerge/blob/e4f9420a63b5ebfd079de7f22a852c2abb6e2774/rust/automerge/src/sync.rs)
- [Yjs](https://github.com/yjs/yjs)
- [Apache PouchDB](https://github.com/apache/pouchdb)
- [RxDB](https://github.com/pubkey/rxdb)
- [LiveStore](https://github.com/livestorejs/livestore)
- [Joplin](https://github.com/laurent22/joplin)
- [Jujutsu repository](https://github.com/jj-vcs/jj) · [release v0.44.0](https://github.com/jj-vcs/jj/releases/tag/v0.44.0) · [operation log](https://jj-vcs.github.io/jj/latest/operation-log/)

## Human-controlled AI and collaborator mission control

- [Aider repository](https://github.com/Aider-AI/aider) · [reviewed commit](https://github.com/Aider-AI/aider/commit/5dc9490bb35f9729ef2c95d00a19ccd30c26339c) · [repository map source](https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/repomap.py) · [official docs](https://aider.chat/docs/)
- [LLM repository](https://github.com/simonw/llm) · [release 0.32](https://github.com/simonw/llm/releases/tag/0.32) · [0.32 changelog](https://llm.datasette.io/en/stable/changelog.html#v0-32)
- [Langfuse](https://github.com/langfuse/langfuse)
- [Promptfoo repository](https://github.com/promptfoo/promptfoo) · [release 0.122.0](https://github.com/promptfoo/promptfoo/releases/tag/0.122.0) · [configuration guide](https://www.promptfoo.dev/docs/configuration/guide/)
- [Inspect AI repository](https://github.com/UKGovernmentBEIS/inspect_ai) · [reviewed commit](https://github.com/UKGovernmentBEIS/inspect_ai/commit/83c283346c35a8de464abb9737b02407f11b9aea) · [official docs](https://inspect.aisi.org.uk/)
- [Label Studio repository](https://github.com/HumanSignal/label-studio) · [release v1.23.0](https://github.com/HumanSignal/label-studio/releases/tag/v1.23.0) · [task model](https://github.com/HumanSignal/label-studio/blob/f010f38324df5d15cecd32358bb64b67079491d8/label_studio/tasks/models.py)
- [OpenHands repository](https://github.com/OpenHands/OpenHands) · [release v1.12.0](https://github.com/OpenHands/OpenHands/releases/tag/v1.12.0) · [architecture docs](https://docs.openhands.dev/usage/architecture)
- [Cline](https://github.com/cline/cline)
- [Continue](https://github.com/continuedev/continue)
- [SWE-agent](https://github.com/SWE-agent/SWE-agent)
- [Apache Burr](https://github.com/apache/burr)

## Out-of-the-box pattern sources

- [Mattermost Playbooks repository](https://github.com/mattermost/mattermost-plugin-playbooks) · [release v2.10.1](https://github.com/mattermost/mattermost-plugin-playbooks/releases/tag/v2.10.1) · [license statement](https://github.com/mattermost/mattermost-plugin-playbooks/blob/d91a6600dc2bfa8b22fa043fa266e27a35e410f0/README.md)
- [eLabFTW repository](https://github.com/elabftw/elabftw) · [release 5.6.12](https://github.com/elabftw/elabftw/releases/tag/5.6.12) · [documentation](https://doc.elabftw.net/)
- [HPI repository](https://github.com/karlicoss/HPI) · [reviewed commit](https://github.com/karlicoss/HPI/commit/abde883473479d59ff6c5696d6b424386d1be6de) · [design notes](https://github.com/karlicoss/HPI/blob/abde883473479d59ff6c5696d6b424386d1be6de/doc/DESIGN.org)
- [GOV.UK Frontend repository](https://github.com/alphagov/govuk-frontend) · [release v6.4.0](https://github.com/alphagov/govuk-frontend/releases/tag/v6.4.0) · [interruption pages](https://design-system.service.gov.uk/patterns/interruption-pages/) · [error summary](https://design-system.service.gov.uk/components/error-summary/)
- [WAI-ARIA Authoring Practices](https://github.com/w3c/aria-practices) · [official APG](https://www.w3.org/WAI/ARIA/apg/)
- [NASA F Prime](https://github.com/nasa/fprime) · [official documentation](https://fprime.jpl.nasa.gov/)
- [OpenTelemetry semantic conventions](https://github.com/open-telemetry/semantic-conventions) · [official docs](https://opentelemetry.io/docs/specs/semconv/)

---

# Cold-start handoff

## Mission status

Research mission complete. No KevinOS source was modified.

## Authoritative KevinOS baseline

- supplied artifact: `kevinos-main 2(1).zip`;
- current code release: v0.50;
- state schema: v39;
- service-worker cache: `kevinos-v0_50`;
- architecture: dependency-free ES5-style single-file `index.html` PWA plus optional Cloudflare relay;
- portable/synced content arrays: 17;
- portable metadata objects: 11;
- tests rerun: repository doctor and complete `sh test/run.sh`, all green;
- archive contains no `.git`, so repository commit/branch/remote state is unknown.

## Current code facts that matter

- `moveFocusTask()` changes focus by swapping records in `state.items`;
- `windItems()` selects open today/due items;
- `nowModel()` uses the first three eligible records;
- AI proposal records already include provider/model/seat, prompt ID/version, context categories/fingerprint, lifecycle, feedback, target, and Undo;
- `missionVerified()` currently accepts manual/machine status plus non-empty evidence;
- portable export deep-clones records from allowlisted collections, so optional record fields should survive without a schema bump, but this must be proven;
- app releases must bump `APP_VERSION`, static footer, and `sw.js` cache together.

## Decisions already made by this report

1. Preserve the architecture.
2. Do not add a production dependency.
3. Do not migrate sync to a CRDT.
4. Do not add surveillance or an autonomous-agent runtime.
5. Implement the top three missions separately, in this order:
   - Focus Rail and Attention Receipt;
   - AI Job Receipt v2 with Context Budget Preview;
   - Mission Proof Bundle.
6. Keep schema v39 for each mission unless tests prove an optional-field approach cannot work.
7. Use local deterministic validation and explicit Kevin approval; no model certifies itself.
8. Treat Local Flight Recorder as the next bounded experiment after the top three, not part of them.

## Immediate next action for an implementation engineer

Start **Mission 1 — Decouple attention from storage order** from the work packet above. Do not repeat the repository landscape research. Re-read the live repository because it may have evolved since the supplied archive, then compare actual symbols/tests to this baseline.

## Required first commands

```text
node tools/doctor.js
sh test/run.sh
```

Record the actual app/schema/cache versions before editing. If they are newer than v0.50/v39, adapt the mission without overwriting newer work.

## Hard constraints

- no framework rewrite;
- no new npm/runtime dependency;
- ES5 app script only;
- no silent important-state mutation;
- no secret values in app or receipts;
- preserve backup, tombstone, merge, and convergence behavior;
- preserve keyboard, focus, mobile, contrast, and hostile-content contracts;
- no background work claims;
- no combining missions.

## Definition of a good handoff

The implementation handoff includes:

- exact goal and result;
- changed files;
- state/contract changes;
- test commands with exit status;
- manual browser proof;
- release/schema/cache versions;
- commit/checkpoint reference;
- known risks;
- rollback instructions;
- next physical action.

---

# If KevinOS adopts only three lessons during its next evolution

## 1. Make attention an explicit user decision, separate from storage order

Build daily focus ranks and plain reason codes. Kevin should be able to see *why* an item is in NOW, and moving it should not shuffle the underlying task database. This improves clarity, focus stability, determinism, and trust without adding AI or a scoring system.

## 2. Make every AI result a proposal with a verifiable receipt

Record the exact prompt/context identity, model, timing, response identity, local checks, Kevin's edits, decision, application target, and Undo state. This makes AI useful across providers while preserving the rule that Kevin—not the model—authorizes important change.

## 3. Make delegated work shippable only through structured proof

Replace “non-empty evidence text” with stable acceptance items, packet fingerprints, attempt receipts, and honest local-versus-reported verification. This will improve every Codex, Claude Code, Cline, or other collaborator Kevin uses and prevent impressive prose from masquerading as completed work.

**Blunt verdict:** do those three before adding another room, provider, database, agent, or framework. They make KevinOS calmer, wiser, and more trustworthy without making it bigger.
