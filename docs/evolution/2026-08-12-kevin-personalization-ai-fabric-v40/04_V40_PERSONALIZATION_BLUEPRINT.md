# KevinOS v40 Personalization + AI Provider Fabric Blueprint

**Date:** 2026-08-12
**Purpose:** implementation-ready state, migration, selector, privacy, UI, relay, and provider-fabric contract for the marathon mission.

## Architectural ruling

Use schema v40 because this evolution adds canonical top-level state and incompatible meaning that should not hide inside ad hoc optional fields. The migration must be one deliberate, deterministic gate from v39.

Keep:

- one `index.html` app;
- dependency-free ES5-style JavaScript;
- local-first canonical state;
- current relay architecture;
- backup/import/snapshot/tombstone/sync convergence;
- explicit approval and one-writer rule.

## Canonical additions

### New content arrays

- `roles`
- `decisions`

Avoid adding more top-level arrays until a demonstrated need. Reuse existing arrays with optional links.

### New portable object

`portfolio`

Suggested shape:

```json
{
  "activeRoleId": "role-teaching",
  "activeModeId": "mode-school-day",
  "capacityMode": "normal",
  "dailyCommitmentLimit": 3,
  "projectWipLimit": 3,
  "roleWipLimits": {},
  "lastWeeklyReviewAt": 0,
  "nextWeeklyReviewDate": "",
  "weeklyOutcomeProjectIds": [],
  "protectedCommitmentIds": []
}
```

## Role record

```json
{
  "id": "role-bshs-swim",
  "label": "BSHS Boys Swim & Dive",
  "shortLabel": "BSHS Swim",
  "legacyArea": "Coaching",
  "color": "#...",
  "icon": "",
  "order": 20,
  "status": "active",
  "privacyDefault": "youth-sensitive",
  "captureAliases": ["bshs", "highschoolswim"],
  "playbookBriefIds": [],
  "createdAt": 0,
  "u": 0
}
```

Seed roles with stable IDs:

- `role-teaching`
- `role-bshs-swim`
- `role-bspc`
- `role-bswildcats`
- `role-studio`
- `role-family`
- `role-personal-finance`
- `role-inbox`

Also create legacy role records for any existing area values encountered during migration so no record becomes orphaned.

## Optional record-field evolution

### Tasks

Add defensively:

```text
roleId
goalId
commitmentType = externalPromise | scheduled | projectAction | maintenance | idea
executionStatus = actionable | waiting | delegated | scheduled | someday | done | canceled
startBy
leadDays
hardStop
waitingOn
delegatedToPersonId
reviewDate
effortMinutes
energy = low | normal | high
sourceRef
privacyClass
reasonNote
```

Keep `area` for backward compatibility and display fallback.

### Projects

```text
roleId
goalIds[]
projectKind
wipClass = admitted | support | incubator
health = onTrack | atRisk | blocked | stale
reviewAt
currentState
blockers
resumeChecklist[]
repoRefs[]
lastProofAt
privacyClass
```

Status vocabulary:

- Active
- Paused
- Scheduled
- Someday
- Done
- Killed

### Builds / Studio missions

```text
projectId
agentProfileId
missionStatus
packetVersion
writerLock
reviewer
claimSummary
lastProofAt
```

Keep current proof bundle and acceptance contracts. Never infer verification from prose.

### Events

```text
roleId
projectId
personIds[]
prepLeadDays
startBy
hardStop
sourceRef
privacyClass
```

### People

```text
roleIds[]
organization
relationshipType
privacyClass
```

Retain canonical `note` singular. Add tests forbidding accidental `notes` reads.

### Goals

```text
roleIds[]
projectIds[]
horizon
definitionOfDone
evidenceRefs[]
```

### Briefs / SOPs

Reuse `briefs` for playbooks. Add:

```text
roleId
projectId
templateType
sourceRefs[]
privacyClass
```

### Notes, prompts, links, stash

Add optional `roleId`, `projectId`, `sourceRef`, and `privacyClass` as needed. Do not require a schema bump for absent optional fields after v40.

### Decisions

```json
{
  "id": "...",
  "question": "",
  "context": "",
  "options": [{"id":"a","label":"","tradeoffs":""}],
  "choiceId": "",
  "why": "",
  "assumptions": [],
  "reversible": true,
  "revisitAt": "",
  "roleId": "",
  "projectId": "",
  "sourceRef": "",
  "privacyClass": "work-internal",
  "createdAt": 0,
  "u": 0
}
```

## Normalization contract

Implement pure, idempotent functions:

- `normalizeRoleRecord`
- `normalizeTaskRecord`
- `normalizeProjectRecord`
- `normalizeBuildRecord`
- `normalizeEventRecord`
- `normalizePersonRecord`
- `normalizeGoalRecord`
- `normalizeDecisionRecord`
- `normalizeBriefRecord`
- `normalizePortfolio`
- `normalizeStateV40`

Requirements:

- safe on missing, malformed, and legacy data;
- does not stamp `u` during read-only normalization;
- does not create IDs at read time except in explicit ingress sanitization;
- preserves unknown compatible fields;
- never weakens privacy;
- is stable under repeated calls;
- is used at boot, import, portable apply, merge fixture setup, and every constructor boundary.

## v39 → v40 migration

### Phase 1: checkpoint

- Compute portable fingerprint.
- Create snapshot labeled `pre-v40-personalization`.
- Record migration receipt without content.

### Phase 2: seed roles

- Add stable Kevin role records if absent.
- Scan every record’s `area` and create a legacy role for unknown values.
- Assign `roleId` only where mapping is unambiguous:
  - Teaching → `role-teaching`
  - Ana → `role-family`
  - Personal → `role-personal-finance`
  - Inbox → `role-inbox`
- Coaching and Work receive stable **legacy role IDs**, not speculative assignment.

### Phase 3: normalize

- Normalize all affected records.
- Preserve `area` exactly.
- Set privacy defaults conservatively:
  - family role → `family-private`
  - BSHS/BSPC roles → `youth-sensitive`
  - Studio/Teaching legacy → `work-internal`
  - Personal/Finance → `private-personal`
  - public only when explicitly set.

### Phase 4: portfolio

- Initialize limits without changing project statuses.
- Mark existing Active projects as `wipClass:"admitted"` only for display compatibility, but immediately show an over-cap review rather than silently pausing projects.

### Phase 5: migrate relationships

- Preserve existing task `projectId` and `personId`.
- Add missing optional fields with safe defaults.
- Do not invent `goalId`, `projectId`, or people links.

### Phase 6: validate and persist

- Run content/portable contract assertions.
- Set schema to 40 only after all migration steps complete in memory.
- Persist once.
- Show a human-readable migration receipt and remap invitation.

## Remap wizard contract

The wizard is a separate explicit operation after migration.

1. Show legacy role and counts by record type.
2. Offer candidate target roles.
3. Preview every affected title and privacy change.
4. Never bulk-map Coaching or Work by default.
5. Create snapshot/checkpoint.
6. Apply with one operation receipt.
7. Provide Undo that restores the before fingerprint/state checkpoint.

## Relationship index

Build a read-time index:

```text
byProject[projectId] -> tasks/events/builds/goals/people/decisions/briefs/notes/links/prompts
byRole[roleId] -> records
byPerson[personId] -> tasks/events/projects/communications
byGoal[goalId] -> tasks/projects/evidence
```

Do not persist this index in canonical state.

## Deterministic readiness selector

A task is actionable when:

- open;
- execution status is actionable or scheduled and its start time has arrived;
- dependencies are resolved;
- not waiting/delegated unless review date is due.

Risk reasons are set-valued, stable strings:

```text
PROMISE_OVERDUE
PROMISE_DUE_TODAY
PROMISE_START_BY
HARD_STOP_PREP
WAITING_REVIEW
DELEGATION_REVIEW
MANUAL_FOCUS
ACTIVE_PROJECT_NEXT
ROLE_MODE_MATCH
CAPACITY_DEFERRED
WIP_NOT_ADMITTED
MISSING_NEXT_ACTION
MISSING_START_BY
```

Do not collapse reasons into an opaque score.

## WIP contract

- Count admitted Active projects globally and per role.
- Show over-cap, but never silently change status.
- New Active admission requires capacity or an explicit override reason/review date.
- An external promise can remain visible even when its project is not admitted.
- Weekly review is the preferred place to resolve over-cap state.

## Project Hub contract

Top section:

- outcome;
- role/privacy;
- status/health/review date;
- current state;
- next action;
- Resume Capsule;
- open external promises;
- next hard stop.

Related sections are views over canonical records:

- tasks/commitments;
- events;
- people/communications;
- goals/evidence;
- Studio missions/proof;
- decisions/assumptions;
- playbooks/notes/links/prompts;
- repos/branches/worktrees.

## AI context packet v3

The packet must show:

- purpose/mode;
- role and project;
- selected record IDs and exact included fields;
- privacy classes;
- redacted/excluded fields;
- current state, next action, blocker;
- acceptance IDs and proof status for missions;
- token/character bounds;
- prompt and schema version.

Sensitive classes require explicit opt-in every time unless Kevin creates a narrowly scoped saved consent. Saved consent may never include youth-sensitive person notes.

## UI strategy

Do not add many new primary tabs.

- Today gains role/mode/capacity and reason chips.
- Projects gains WIP/health and opens Project Hub.
- Studio becomes a mission view linked to project.
- Plan & Review gains Weekly Portfolio Review.
- More contains Decisions, Playbooks, Admin Radar, and Search only if they cannot fit existing Library/Project views.
- Global command palette gains typed search and role switching.

## Versioning

- Bump `SCHEMA_VERSION` once from 39 to 40.
- Bump `APP_VERSION` and service-worker cache together only at release checkpoints.
- Add migration fixtures before touching production boot logic.
- Do not create intermediate schemas 40/41/42 within the marathon.

## Safety gates

Stop and report before continuing when:

- a v39 fixture loses a record or connection-exclusion guarantee;
- portable fingerprints cannot round-trip;
- migration changes Coaching/Work assignments without explicit user action;
- privacy class is weakened;
- same input yields different Today reasons/order;
- a mission becomes verified from prose alone;
- a browser console exception appears;
- bundle size or performance materially regresses without explanation;
- implementation requires a framework, database, build step, CRDT, or new runtime dependency.
