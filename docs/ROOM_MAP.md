# Room and route map

Canonical product groups for the Convergence release:

| Route | Label | Group | Primary role | Notes |
|---|---|---|---|---|
| `today` | Today | Primary | NOW, capture, support, close | `home` and `launch` alias here. |
| `tasks` | Tasks | Primary | Commitments and task actions | Mobile trust surface. |
| `calendar` | Calendar | Primary | Hard stops and events | Local plus optional Google data. |
| `attic` | More | Primary | Grouped secondary navigation | User label remains More. |
| `next` | Plan & Review | Plan | Daily/weekly review and Council entry | Route ID retained for deep links. |
| `projects` | Projects | Plan | Outcomes and next actions | |
| `goals` | Goals | Plan | Quarterly direction | |
| `habits` | Habits | Plan | Routines and streaks | |
| `studio` | Studio | Work | AI Mission Control/builds | |
| `people` | People | Work | Relationship follow-up | |
| `email` | Email | Work | Gmail review/drafts/send approval | |
| `github` | GitHub | Work | Contribution/repo context | |
| `library` | Library | Reference | Federated saved knowledge | Desktop primary candidate; mobile under More. |
| `briefs` | Briefs | Reference | Briefs and SOPs | |
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
- Legacy AI plan: RETAIN only as collapsed explanation subordinate to deterministic NOW.
- Legacy Home/Launch DOM/functions: RETIRE only after all above are reachable and deletion receives explicit approval.
