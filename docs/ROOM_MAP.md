# Room and route map

Canonical product groups for the Convergence release:

| Route | Label | Group | Primary role | Notes |
|---|---|---|---|---|
| `today` | Today | Primary | NOW, capture, support, close | `home` and `launch` alias here. |
| `tasks` | Tasks | Primary | Commitments, communication lifecycle, explicit Admin & Money kinds, and task actions | Mobile trust surface; Ready never means Sent. |
| `calendar` | Calendar | Primary | Hard stops and events | Local plus optional Google data. |
| `attic` | More | Primary | Grouped secondary navigation | User label remains More. |
| `next` | Plan & Review | Plan | Daily/weekly review, Portfolio Review, decision revisits, relationship/admin/evidence views, Lab Budget, and Council entry | Route ID retained for deep links. |
| `projects` | Projects | Plan | Outcomes, next actions, Project Hub, Decision Ledger, and WIP Governor | WIP caps expose overload without automatic status changes. |
| `goals` | Goals | Plan | Quarterly direction | |
| `habits` | Habits | Plan | Routines and streaks | |
| `studio` | Studio | Work | AI Mission Control/builds | Nine-state command queue, agent profiles, one-writer locks, packets, claims, and proof review; never launches external work. |
| `people` | People | Work | Relationship follow-up and linked communication commitments | Message/person data is not copied. |
| `email` | Email | Work | Gmail review/drafts/send approval | |
| `github` | GitHub | Work | Contribution/repo context | |
| `library` | Library | Reference | Federated saved knowledge, typed local search, and confirmed knowledge conversion | Desktop primary candidate; mobile under More. |
| `briefs` | Briefs | Reference | Briefs, SOPs, and versioned role playbooks | Preview/instantiate stays explicit and non-executing. |
| `prompts` | Prompts | Reference | Reusable prompts | |
| `launchpad` | Launchpad | Reference | Curated links | Distinct from legacy `launch`. |
| `notes` | Notes | Reference | PARA notes | |
| `stash` | Stash | Reference | Read later | |

System functions (connections, health, sync, snapshots, backup/import, theme) currently live in Today/footer/connection rooms; the convergence target is one calm System Health disclosure.

Legacy disposition:

- `?room=home` and `?room=launch`: KEEP as compatibility aliases to Today.
- Weather: MIGRATE to optional compact Today support.
- Swim Pulse and Sheets digest: MIGRATE to conditional Work Pulse/Studio support.
- Intake: MIGRATE to first-use/progressive onboarding.
- Life Sweep: KEEP in Plan & Review, deriving prompts from enabled roles and safe capture aliases.
- Legacy AI plan: RETAIN only as collapsed explanation subordinate to deterministic NOW.
- Legacy Home/Launch DOM/functions: RETIRE only after all above are reachable and deletion receives explicit approval.

## v40 + AI fabric placement — implemented

No provider room was added. Studio contains project-linked missions, proof receipts, second-opinion and other proposal jobs, synthetic evaluation, and the detailed Provider Control Center. System Health shows collapsed redacted availability and the `allowPaid=false` policy. Proposal Inbox preserves the context manifest, exact provider/model/prompt/packet provenance, validations, and explicit edit/apply/reject/Undo. Existing universal AI actions remain in their current rooms; the new provider-fabric jobs accept only manually pasted Public or attested de-identified text, so no protected source record is silently gathered. Credential entry remains terminal/server-side only.
