# KevinOS Hardcore Personalization + Free AI Fabric Audit

**Prepared:** 2026-08-12
**Audited artifact:** supplied `kevinos-main 3(1).zip`
**Baseline:** KevinOS v0.57 · schema v39 · 20 rooms · 42 relay routes · automated baseline green
**One goal:** make KevinOS fit Kevin’s actual life, work, projects, strengths, bottlenecks, and decision patterns without sacrificing calm, privacy, trust, recovery, or deterministic behavior.

## Executive verdict

KevinOS is already an unusually trustworthy personal operating system. Its strongest work is the hard work most personal dashboards skip: recoverability, deterministic state, explicit AI approval, content-safe portability, merge convergence, bounded evidence, and fail-closed relay boundaries.

The next leap is not “more features.” It is **personal operating intelligence**.

Today, KevinOS can hold nearly every category of Kevin’s life, but its organizing model is still generic. `Work`, `Coaching`, and `Teaching` do not adequately represent a Personal Finance classroom, a high-school swim program, an age-group club, a school sports publishing operation, an AI/game studio, a marriage, and personal finance. The rooms are capable, but the relationships among them are too weak. Projects, missions, people, events, goals, notes, and email often describe the same real-world effort without sharing one durable spine.

The recommended product direction is:

> **KevinOS becomes a calm attention-and-commitment system that understands Kevin’s roles, seasons, promises, project state, AI collaborators, capacity, and privacy boundaries, then presents one justified next physical action.**

Three load-bearing upgrades create nearly all of the value:

1. **Kevin Role Registry** — a backward-compatible model of Kevin’s actual roles and seasonal modes.
2. **Commitment Contract** — a truthful distinction among external promises, scheduled actions, project actions, maintenance, waiting/delegated work, and ideas.
3. **Project Spine** — one project identity joining tasks, goals, people, events, knowledge, decisions, repositories, AI missions, proof, and restart context.

Everything else should attach to those three. Do not add another isolated room.

## Audit method

This was a repository-first audit, not a feature brainstorm. The work included:

- full archive inventory and source inspection;
- current-state, architecture, state-contract, decision, security, adoption, and agent-instruction review;
- static inspection of record constructors, boot whitelist, portability, capture, Today, Projects, Goals, People, Studio, AI context, and relay boundaries;
- rerun of the repository doctor and complete automated test harness;
- representative Kevin data loaded into the current app and rendered at desktop/mobile dimensions;
- current primary-source review of relevant open-source repositories and official Codex documentation;
- inversion analysis: how KevinOS could technically succeed while still failing Kevin.

### Baseline receipt

| Dimension | Observed baseline |
| --- | --- |
| Application | KevinOS v0.57 |
| State schema | 39 |
| Primary app | Single-file, dependency-free, ES5-style PWA |
| Rooms | 20 registered rooms |
| Relay | 42 routes |
| Persistence | Local-first canonical state plus bounded device-local sidecars |
| Automated baseline | `node tools/doctor.js` PASS; `sh test/run.sh` ALL GREEN |
| Core trust coverage | Syntax, ES5, XSS, capture, operations, friction, conflicts, merge, portability, ICS, recurrence, habits, three-device convergence, operation-reference sync, relay auth/sync/security |


The complete logs and representative screenshots are in `evidence/` inside this mission pack.

## Kevin operating profile the product must honor

Kevin is not one generic knowledge worker. He is simultaneously:

- a high-school Personal Finance teacher and curriculum designer;
- the BSHS Boys Swim & Dive head coach;
- the founder/head coach of BSPC, an age-group swim program;
- a school sports publisher and widget/site operator through BSWildcats.com;
- an AI-assisted product studio operator managing KevinOS, BSPC Coach HQ/SwimCoachHelper, MFD, MBD, standalone 3D games, Party Games, StatLens, and other experiments;
- a husband and family member whose protected time with Ana should not lose to endless project energy;
- a personal-finance educator and active investor who needs high-stakes decisions separated from ordinary tasks.

### Strengths KevinOS should amplify

- **Systems thinking:** Kevin naturally identifies workflows, constraints, incentives, and second-order effects.
- **High-output synthesis:** he can turn research, coaching knowledge, and AI work into practical artifacts quickly.
- **Teaching and coaching clarity:** he values exact cues, checks for understanding, usable examples, and clear definitions of done.
- **Agent direction:** he writes ambitious missions, compares AI collaborators, and expects receipts.
- **Creative range:** he generates valuable ideas across education, sports, media, software, games, and finance.
- **Iterative refinement:** he pressure-tests outputs and keeps improving them rather than accepting shallow work.
- **Human encouragement:** his best leadership style combines high standards with confidence, warmth, friendship, and belief.

### Bottlenecks KevinOS should compensate for

- **Too many legitimate projects:** the problem is not laziness; it is excess opportunity relative to implementation capacity.
- **Fragmented attention:** roles switch rapidly across school, pool, website, family, and coding contexts.
- **Idea-to-WIP leakage:** an exciting idea can become “Active” before another project is truly done.
- **Restart friction:** long-running code and coaching projects need a trustworthy “where was I?” packet.
- **Agent follow-up debt:** multiple AI collaborators can create claims, handoffs, and proof requests faster than Kevin can review them.
- **Intensity spikes:** high-energy build sessions can crowd out sleep, recovery, and protected family time.
- **Overbuilding risk:** improving KevinOS can itself become a project that steals focus from the work KevinOS is meant to support.

The product should never frame these as character defects. It should create environmental controls that make good choices easier.

## Current scorecard

These are audit judgments, not telemetry or scientific measurements.

| Dimension | Score | Assessment | Evidence |
| --- | --- | --- | --- |
| Data trust and recoverability | 9.4/10 | Excellent | Corrupt-store write block, raw recovery, portable backup/import, snapshot ring, tombstones, convergence tests. |
| Deterministic behavior | 9.0/10 | Excellent | Manual focus ranks and explicit reason codes; AI does not silently mutate or choose. |
| Security boundaries | 9.0/10 | Excellent | Relay route matrix, fail-closed URL fetch, bounded bodies, approval at outward boundaries. |
| Capture speed | 8.4/10 | Strong | Quick capture, share target, voice, deterministic power syntax. |
| AI mission governance | 8.3/10 | Strong | Proposal inbox, receipts, acceptance/proof bundles, handoffs, overrides kept visibly distinct. |
| Daily orientation | 7.2/10 | Good but incomplete | NOW is useful, but it does not understand promise type, start-by risk, role mode, waiting state, or capacity. |
| Kevin-specific fit | 4.8/10 | Main opportunity | Generic areas flatten materially different jobs and projects. |
| Portfolio control | 4.2/10 | Weak | No costly definition of Active, WIP cap, project health, or stop/shelve review. |
| Cross-record coherence | 4.5/10 | Weak | Projects, Studio, Goals, People, Calendar, Notes, and Email are capable but only lightly connected. |
| Restart/resume support | 5.0/10 | Weak-to-fair | Missions have handoffs; ordinary projects lack a complete restart packet. |
| Privacy granularity | 6.8/10 | Good foundation | Explicit AI sharing exists, but records lack consistent privacy classes and youth-data defaults. |
| Maintainability inside constraints | 7.0/10 | Good but dense | Intentional single-file design is protected by tests, but registries and normalizers need further convergence. |


## What KevinOS already gets right and must protect

### 1. It treats trust as a product feature

The repository blocks writes after corrupt storage, retains raw recovery, supports portable export/import, keeps connection credentials out of backups, uses snapshots and tombstones, and tests convergence. That is the correct foundation for a personal OS.

### 2. AI is subordinate to Kevin

The proposal inbox, explicit sharing choices, provenance, deterministic checks, application receipts, and Undo boundaries are materially better than ordinary “AI assistant” designs. The rule remains: **AI proposes; Kevin approves.**

### 3. Priority is explicit rather than magical

NOW uses open work, calendar facts, and Kevin’s manual focus ranks. The product already rejects hidden universal urgency scores. Preserve that. Add better facts and reason codes rather than an opaque algorithm.

### 4. The single-file PWA is a recovery choice

`index.html` is dense, but the architecture is intentionally inspectable, portable, offline, and build-free. The correct evolution is stronger internal contracts and registries, not a framework rewrite.

### 5. The repo already contains an excellent proof culture

Missions distinguish reported proof from local proof, acceptance items from prose, current packets from stale packets, normal shipment from override, and claims from evidence. Extend that culture to ordinary projects.

### 6. It is already calm

The visual system, bounded interruptions, friction pilot, morning/evening loop, and no-shame language are worth preserving. Personalization must not turn the cockpit into a loud enterprise dashboard.

## Hardcore findings

| Priority | ID | Finding | Evidence / consequence | Required response |
| --- | --- | --- | --- | --- |
| P0 | F-01 | Approved People notes can be silently omitted from AI context | People records write `note`; AI sharing reads `notes` at `index.html:5267`. | Fix field reference, add regression fixture proving opt-in notes are included and opt-out notes are excluded. |
| P0 | F-02 | Goals advertise a link that does not exist | Empty state says “link tasks to it” at `index.html:4325`; no `goalId` task contract exists. | Either remove the false promise immediately or implement goal links as part of v40. The plan does both in sequence. |
| P0 | F-03 | Task-person association is partially write-only | Capture supports `+person` and task rows display `personId`, but task editor has no Person field (`index.html:1499–1507`, `1595–1599`). | Add person selector and normalize every task constructor. |
| P0 | F-04 | Task shapes are inconsistent across constructors | Some creation paths omit `personId`, `dueTime`, or other optional fields. | Add one `normalizeTaskRecord()` contract used at ingress, boot, import, capture, add, recurrence, and merge fixtures. |
| P1 | F-05 | Area taxonomy is not Kevin’s real operating map | Hardcoded areas are Work, Coaching, Teaching, Personal, Ana, Inbox (`index.html:1067–1073`). | Add a backward-compatible Kevin Role Registry; retain `area` while introducing `roleId`. |
| P1 | F-06 | “Coaching” combines two distinct organizations | BSHS Boys Swim & Dive and BSPC have different athletes, families, schedules, seasons, staff, communications, and risk. | Never auto-split legacy Coaching. Seed separate roles and provide a previewed, reversible remap. |
| P1 | F-07 | “Work” hides several incompatible kinds of work | BSWildcats publishing, AI studio projects, school admin, and KevinOS stewardship all compete under Work. | Use role and project context, plus saved views; do not proliferate separate apps. |
| P1 | F-08 | Active has no scarcity | Representative Kevin data produces seven Active projects with no cost or cap. | Add WIP limits and explicit Ship, Schedule, Shelve, Pause, or Kill review. |
| P1 | F-09 | Projects and Studio are parallel project systems | Projects track outcomes/next actions; Studio tracks agent missions/proof. They are not anchored to one project spine. | Make builds/missions children of projects via `projectId`; keep Studio as a mission view, not a second truth. |
| P1 | F-10 | Goals are motivational cards, not operating constraints | Goals have progress but no typed links to projects, tasks, decisions, or evidence. | Link goals to role/project/outcome evidence; Today should show why an action matters without letting goals override hard promises. |
| P1 | F-11 | Due date cannot represent the real promise | A task can be due, but KevinOS cannot distinguish external promise, preparation start-by, scheduled action, maintenance, or idea. | Introduce Commitment Contract fields and deterministic risk reasons. |
| P1 | F-12 | Waiting and delegated work masquerade as open work | No first-class execution status, `waitingOn`, or delegation contract. | Add actionable/waiting/delegated/scheduled/someday/done, with next review dates. |
| P1 | F-13 | Today cannot adapt to Kevin’s day type | A school day, BSHS meet day, BSPC meet weekend, deep-build day, and recovery day should not produce the same plan. | Add explicit role/mode and capacity settings; never infer from passive surveillance. |
| P1 | F-14 | No start-by/lead-time radar for deadline-heavy work | Meet entries, physicals, websites, parent communication, lessons, and travel often fail before the due date. | Compute deterministic start-by risk from lead time, calendar hard stops, and promise type. |
| P1 | F-15 | Ordinary projects lack a restart packet | A next action alone is insufficient after a week away from a repo, meet task, season plan, or school project. | Add Resume Capsules: current state, next physical action, blocker, links, last proof, restart checklist. |
| P1 | F-16 | Role-specific know-how is not operationalized | Kevin has repeatable teaching, coaching, publishing, and AI-studio methods, but they are not seeded as executable playbooks. | Create role templates/SOPs that instantiate checklists and context, not giant new rooms. |
| P1 | F-17 | AI agent choice and work sequencing remain manual memory | Studio captures assignments and evidence but lacks a durable agent roster, mission queue, writer lock, and project packet generator. | Add deterministic agent profiles, one-writer locks, mission states, context packet generation, and proof intake. |
| P1 | F-18 | Privacy is explicit at AI actions but not consistently typed at records | Student/athlete/family information needs stronger defaults than ordinary project notes. | Add `privacyClass`, youth-data guardrails, minimum-necessary context, and redaction manifests. |
| P2 | F-19 | People, email, events, and promises do not form one communication loop | People Radar knows cadence; tasks can link a person; email/calendar are separate. | Create communication commitments linked to person/project/event/source with explicit approval. |
| P2 | F-20 | Decisions and assumptions disappear into notes or chats | Kevin makes many architecture, scope, coaching, publishing, and investment decisions across projects. | Add a compact Decision & Assumption Ledger with revisit date and reversibility. |
| P2 | F-21 | Knowledge is stored more often than activated | Library unifies reference records but does not consistently turn them into checklists/templates/next actions. | Add Promote to Playbook, Instantiate checklist, and provenance-preserving conversion. |
| P2 | F-22 | The UI remains room-first when Kevin thinks work-first | Twenty rooms are well organized, but cross-room navigation is required to reconstruct one project. | Add project hubs and global command/search; do not delete stable rooms until adoption evidence supports pruning. |
| P2 | F-23 | No single search spans every meaningful record | Command palette navigates and triggers actions, but Kevin needs project/person/source-aware retrieval. | Add local deterministic search across records with typed results and no external index. |
| P2 | F-24 | Administrative risk is scattered | Physicals, certifications, fees, entries, budgets, subscriptions, publishing dates, and forms are ordinary tasks with no saved risk view. | Add an Admin & Money Radar as a saved view driven by typed commitments, not a new finance app. |
| P2 | F-25 | Wins and proof are present but not joined to growth | Studio has proof; goals have progress; coaching/teaching outcomes are not tied to evidence. | Add non-gamified evidence and wins timeline linked to projects/goals/roles. |
| P2 | F-26 | KevinOS itself can become attention debt | Kevin’s creativity can produce more improvements than daily use can absorb. | Add a KevinOS Lab Budget: no feature without friction evidence, an acceptance test, and a sunset rule. |
| P2 | F-27 | Dense single-file internals increase change risk | The app is 6,445 lines with many inline contracts; single-file is intentional, not a rewrite target. | Converge registries, record normalizers, selectors, view models, and contract tests inside the file. |
| P2 | F-28 | Browser proof is strong but not continuously automated | Current browser receipts are local/manual; CI is mostly Node contract tests. | Add a tiny optional browser smoke that can run when Chromium is available; never make core use depend on a build system. |
| P2 | F-29 | Historical evidence creates context noise | The repository preserves many audits, prompts, screenshots, and Playwright artifacts. | Create a canonical docs index and archive policy; do not delete historical evidence without explicit approval. |
| P2 | F-30 | Adoption metrics do not yet measure the new promise | Current local adoption/friction pilots are excellent but do not measure resume time, open promises, or active-project overload. | Add bounded, local, content-free counters for orientation and portfolio health. |


## The core product diagnosis

KevinOS currently has **strong rooms and weak joints**.

- Tasks know projects and sometimes people.
- Projects know an outcome and next action.
- Studio missions know repos, agents, proof, and handoffs.
- Goals know progress.
- People know cadence and notes.
- Calendar knows time.
- Library knows reference material.
- Email knows conversations.

But Kevin’s real work is not room-shaped. A BSHS meet, BSPC season plan, KevinOS evolution, widget publication, or family commitment cuts across several rooms. Kevin should not have to mentally join them every time he returns.

The fix is not a super-room. It is a small set of typed relationships and project/role views built over the existing rooms.

## Inversion: how KevinOS could fail Kevin while passing every test

| Failure mode | What it looks like | Countermeasure |
| --- | --- | --- |
| Everything is Active | Kevin sees many valid projects but no scarcity signal; nothing truly finishes. | WIP governor + weekly Ship/Schedule/Shelve/Kill review. |
| Generic Coaching hides organizational context | A BSHS eligibility item and a BSPC practice look similar but have different people, policies, and deadlines. | Role Registry + role-aware templates/privacy. |
| AI output creates follow-up debt | Many agents report success; Kevin must remember which repo, proof, branch, and next review. | Project Spine + mission queue + proof intake + resume capsule. |
| Due dates warn too late | A meet entry or lesson deadline becomes risky days before it is due. | Start-by and lead-time radar. |
| Context switching burns the day | Kevin jumps from school to pool to website to code without a bounded transition. | Operating modes + restart/resume capsules + role-filtered Today. |
| KevinOS becomes another project to maintain | The OS grows faster than adoption. | Lab Budget, friction receipts, sunset rules, 30-day soak. |
| Private youth/family context leaks into AI | A convenient context packet includes more than necessary. | Privacy classes, explicit manifests, redaction tests, fail-closed defaults. |


## New KevinOS product constitution

1. KevinOS exists to answer: **What deserves Kevin’s attention right now, why, and what is the next physical action?**
2. It is a calm attention-and-commitment system, not a feature warehouse or generic SaaS product.
3. Specialized apps remain specialized. KevinOS orchestrates SwimCoachHelper/BSPC Coach HQ, BSWildcats, game repos, email, calendar, and finance workflows rather than absorbing all of their domain logic.
4. A real promise outranks an interesting idea. A start-by date can matter before a due date.
5. “Active” is scarce. Work in progress is capped, reviewed, and reversible.
6. AI proposes, explains, drafts, challenges, and packages work. Kevin approves consequential changes and every outward action.
7. Student, athlete, family, and financial context is minimum-necessary, private by default, and excluded from AI unless explicitly approved.
8. No passive surveillance, hidden urgency score, engagement optimization, or shame loop.
9. Local-first custody, deterministic behavior, recovery, portability, and convergence remain release gates.
10. The single-file dependency-free PWA remains a product choice. Improve its contracts before considering architecture expansion.
11. Every feature must either reduce orientation time, reduce restart time, prevent a missed promise, close a project, or improve trust. Otherwise it is a candidate for the Lab, not the core.
12. Every marathon implementation wave must leave a proof bundle and a resumable handoff.

## Proposed Kevin role map

| Role | What belongs here | Boundary |
| --- | --- | --- |
| Personal Finance Teaching | Lessons, retrieval practice, grading, student support, parent/admin communication, school deadlines. | Work/school data; student PII excluded from general context and AI by default. |
| BSHS Boys Swim & Dive | Eligibility, physicals, roster, practice, meet entries, diving, buses, results, website, parent communication. | Youth data; minimum necessary; parent/admin-safe artifacts. |
| BSPC | Group/season planning, exact practices, swimmer development, meets, billing, family/staff follow-up. | Youth and customer data; separate from BSHS. |
| BSWildcats.com & School Sports Publishing | Widgets, schedule links, source verification, mobile presentation, publication deadlines. | Public-facing; protect program optics and accuracy. |
| AI & Game Studio | KevinOS, BSPC Coach HQ, SwimCoachHelper, MFD/MBD/3D, Party Games, StatLens, agent missions. | Repos, branches, worktrees, acceptance, proof, decisions, WIP. |
| Family & Ana | Protected time, shared logistics, plans, relationship commitments. | Private by default; never gamified or optimized as productivity. |
| Personal & Finance | Health, home, errands, subscriptions, money administration, investing research. | Financial details private; high-stakes decisions require explicit confirmation. |
| Inbox | Unclassified capture awaiting clarification. | Must be emptied or intentionally deferred during review. |


### Legacy-area migration rule

Do not silently reinterpret old data.

- Existing `Teaching` can be preview-mapped to Personal Finance Teaching.
- Existing `Ana` can be preview-mapped to Family & Ana.
- Existing `Personal` can be preview-mapped to Personal & Finance.
- Existing `Coaching` **must remain legacy until Kevin explicitly splits records** between BSHS and BSPC.
- Existing `Work` **must remain legacy until Kevin explicitly assigns records** to Studio, BSWildcats, School/Admin, or another role.
- Existing `Inbox` remains Inbox.

Every remap must show counts, affected record types, a before/after preview, a snapshot checkpoint, and Undo.

## Recommended operating model

### Layer 1: Roles

Roles answer: **Which responsibility and privacy boundary is this part of?**

### Layer 2: Commitments

Commitments answer: **What kind of obligation is this, when does risk begin, and is it actionable?**

Recommended types:

- external promise;
- scheduled commitment;
- project action;
- maintenance/admin;
- idea/option.

Recommended execution states:

- actionable;
- waiting;
- delegated;
- scheduled;
- someday;
- done/canceled.

### Layer 3: Projects

Projects answer: **What outcome is being pursued, what is the current state, what is the next action, and how do we restart?**

### Layer 4: Modes and capacity

Modes answer: **What kind of day is Kevin having and how much work can responsibly fit?**

Suggested modes:

- School Day;
- BSHS Practice Day;
- BSHS Meet Day;
- BSPC Practice/Meet;
- Deep Build;
- Publishing Burst;
- Family/Recovery;
- Travel.

Suggested capacity settings:

- Full;
- Normal;
- Low / Minimum Viable Day.

These are explicit settings or deterministic calendar-derived suggestions Kevin confirms. They are not passive surveillance.

### Layer 5: Views

Views answer: **What should be visible now?** Existing rooms remain, but Today, Project Hub, Weekly Review, Admin Radar, and search become work-first lenses over the same canonical records.

## Deterministic Today contract

Today should not compute a mysterious score. It should apply ordered rules and show reason codes.

1. Surface overdue or start-by-risk external promises.
2. Surface preparation required before the next hard calendar stop.
3. Preserve Kevin’s explicit Today ranks.
4. Surface the next action of an admitted Active project, respecting WIP caps.
5. Exclude waiting/delegated items unless their review date is due.
6. Respect active role/mode and capacity, except that a real hard promise may cross the role filter.
7. Show at most three commitments; one should be visually primary.
8. Explain every inclusion with a stable reason such as `PROMISE_START_BY`, `HARD_STOP_PREP`, `MANUAL_FOCUS`, `ACTIVE_PROJECT_NEXT`, or `WAITING_REVIEW`.

## Privacy and safeguarding model

KevinOS must support these record privacy classes:

- `private-personal`;
- `family-private`;
- `work-internal`;
- `youth-sensitive`;
- `public`.

Rules:

- Student and athlete PII is not part of general profile context.
- Youth-sensitive content is excluded from AI by default.
- Any AI context packet displays a manifest of included record IDs/fields and redactions before send.
- Person notes are private by default and require explicit opt-in.
- No record privacy class silently becomes less restrictive during import, migration, merge, or AI proposal application.
- Public publishing playbooks verify that private fields are absent before copy/export.

## Maintainability direction

Keep the single file. Add internal order:

- canonical registries for roles, record types, statuses, privacy classes, and reason codes;
- `normalize*Record()` functions for every record type touched by v40;
- pure selectors/view-model builders for Today, project hub, portfolio review, and search;
- one migration function with explicit fixture coverage;
- one relationship index generated at read time rather than duplicated state;
- one source of truth for field labels/options;
- compact test fixture factories;
- comments that name contracts, not historical waves.

## Release success criteria

The v40 evolution is successful when:

- Kevin can open Today and understand the primary action, its role, its promise type, its reason, and the next hard stop in under 20 seconds;
- a seven-day-old project can be resumed in under two minutes without rereading an entire chat or repo;
- no more than the configured number of projects can remain Active without an explicit override;
- BSHS and BSPC records are separate without losing legacy Coaching data;
- every external promise has a clear start-by/due state and owner;
- waiting/delegated work no longer clutters actionable lists;
- every Studio mission belongs to a project and has a current proof/review state;
- a weekly review produces one or two outcomes, a maximum of three daily commitments, and explicit shelved work;
- AI context is field-manifested, privacy-aware, and opt-in for sensitive records;
- v39 backup/import/sync/convergence behavior remains intact;
- doctor, full tests, migration fixtures, and desktop/mobile browser receipts are green.

## What not to build

- a generic multi-user SaaS;
- a full LMS, swim-team management platform, CMS, brokerage terminal, or family CRM inside KevinOS;
- passive activity or time surveillance;
- an AI-generated hidden priority score;
- autonomous email, calendar, deployment, financial, or destructive actions;
- a plugin marketplace;
- a framework/database/CRDT rewrite without a reproduced failure that the current architecture cannot safely solve;
- more rooms merely because a domain exists;
- gamification, shame streaks, or productivity theater;
- youth-data enrichment or broad student/athlete profiles.

## Recommended implementation order

1. Fix the four P0 correctness and normalization problems.
2. Establish v40 state contract, Role Registry, migration, previewed remap, and privacy classes.
3. Add typed links and Project Spine before building new views.
4. Add Commitment Contract, waiting/delegated states, start-by risk, and deterministic reason codes.
5. Rebuild Today over those contracts; then add capacity/modes and Do Next Coach.
6. Add WIP governor, Resume Capsules, and Weekly Portfolio Review.
7. Seed Kevin role playbooks and role-aware onboarding.
8. Join Studio missions to projects; add agent roster, queue, writer lock, packets, and proof intake.
9. Add decisions, communication commitments, knowledge activation, global search, Admin Radar, and wins/evidence.
10. Run hardening, browser/a11y/performance, adoption instrumentation, docs convergence, and release evidence.


## AI systems expansion audit

KevinOS already has the right philosophical boundary — AI proposes and Kevin approves — but the previous plan treated external intelligence mostly as one relay capability. Kevin's new free-provider strategy creates an opportunity to make the system substantially more capable without making the app dependent on one model or one paid account.

### New high-value opportunity

A provider-neutral fabric can give KevinOS:

- high-quality long-context and multimodal synthesis;
- very fast structured extraction and classification;
- independent coding/architecture second opinions;
- specialist embedding/rerank experiments;
- graceful quota fallback across multiple free pools;
- local evaluation of which model/prompt actually works best for Kevin's recurring tasks.

### New failure modes introduced by more APIs

| Failure mode | Why it matters to Kevin | Required countermeasure |
| --- | --- | --- |
| Browser-exposed keys | A single-file PWA is easy to inspect; leaked keys can be abused immediately. | All provider calls remain relay-side; no key in app state, export, sync, logs, or screenshots. |
| “Free” model becomes paid | Provider pricing and model availability change faster than app releases. | Hard `allowPaid=false`, unknown-price blocking, live model/lifecycle metadata, conservative quotas. |
| Sensitive school/team data leaves approved systems | Kevin is responsible for students, athletes, parents, and institutional trust. | Privacy firewall denies youth-sensitive, financial-sensitive, and secret packets before transport. |
| Free-tier training/data use | Some providers may use free-tier content to improve products. | Public/sanitized defaults, visible manifest, provider-specific warning, no silent routing. |
| Retry/fallback storm | Multiple free providers can multiply requests and burn quotas. | One bounded retry, deterministic compatible fallback, circuit breakers, no parallel fan-out on real data. |
| Provider churn | Model slugs and free rosters are temporary. | Capability aliases, catalog discovery, deprecation receipts, last-known-good route and rollback. |
| AI begins controlling KevinOS | More models can create more suggestions, noise, and accidental authority. | Proposal-only outputs, deterministic core selectors, explicit approval, AI Lab recommendations only. |
| Key collection blocks the marathon | Sign-up friction could stop engineering before architecture is complete. | Build and prove everything with mocks first; request keys only after preactivation PASS. |

### Corrected product diagnosis

The next KevinOS problem is no longer merely “connect more AI.” It is:

> **Build one governed intelligence utility that can use many changing free providers without leaking secrets, exposing protected people, incurring charges, or weakening the deterministic operating system underneath it.**

### Kevin-specific AI routing principles

1. Fast routine work should use the fastest compatible free lane, usually Groq.
2. Complex synthesis should prefer a verified-free Gemini route, then Mistral/Groq alternatives.
3. Coding and architecture reviews should seek an independent model family rather than merely a second sample from the same model.
4. School, athlete, parent, medical, eligibility, financial-account, and secret data do not enter this free-provider fabric.
5. Kevin sees the provider/model and why it was chosen.
6. Quota exhaustion produces a calm local fallback, not a bill.
7. Continuous improvement uses synthetic Kevin-shaped fixtures and Kevin approval, not surveillance or silent A/B changes.

### New architecture conclusion

The Cloudflare relay is the correct trust boundary. The browser stays provider-neutral and keyless. Provider adapters, privacy enforcement, zero-dollar routing, quota controls, output validation, and provenance belong in the relay. Provider status and policy belong in a Settings/Studio Control Center, not in a new top-level room.

### New implementation gates

Before any key is requested, Codex must prove:

- adapter contracts through mocks for every provider;
- privacy denial occurs before any transport call;
- unknown price status blocks;
- free quotas and 429 headers are bounded;
- exact model/provenance are preserved;
- offline/local core use remains complete;
- AI features degrade gracefully with zero providers;
- no secret pattern exists in source, docs, logs, patches, output, export, sync, or screenshots;
- `preactivation` gates pass.

Only then may Codex ask Kevin to create keys and run a silent local credential ceremony.

## Final audit judgment

KevinOS has already earned the right to become Kevin’s trusted daily system. It does not need a new technological foundation. It needs a more honest model of Kevin’s reality.

The decisive shift is from:

> “Here are all the rooms and records in Kevin’s life.”

To:

> “Here is the real promise at risk, the role Kevin is inhabiting, the project context he needs, and the smallest physical action that moves the right outcome without overloading the day.”

That is the path from a strong personal dashboard to a truly Kevin-shaped operating system.
