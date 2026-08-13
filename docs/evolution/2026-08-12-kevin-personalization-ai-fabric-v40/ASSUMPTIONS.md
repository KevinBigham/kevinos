# KevinOS v40 Personalization + AI Fabric — Assumptions

## Operating rule

Codex does not ask Kevin routine product, UX, naming, provider, or implementation questions during this marathon. It chooses the safest, simplest, most reversible answer consistent with the mission, logs it here, and proceeds.

Privacy chooses the more restrictive answer. Migration preserves legacy meaning. UI prefers existing rooms and progressive disclosure. Architecture prefers dependency-free local behavior. Priority uses visible reasons, never hidden scoring. Provider routing chooses no call over an uncertain privacy, price, or eligibility decision.

## Seed assumption log

| ID | Date | Uncertainty | Chosen answer | Why safest/reversible | Affected scope | Revisit trigger |
| --- | --- | --- | --- | --- | --- | --- |
| AS-000 | 2026-08-12 | How should routine ambiguity be handled? | Make and log a best-safe assumption; do not ask Kevin or stop. | Kevin authorized autonomous safe judgment; outward/destructive/secret/paid boundaries remain blocked. | Entire mission | Only if a choice needs unauthorized action or weakens safety. |
| AS-001 | 2026-08-12 | Is the pasted provider/model/quota list permanent source truth? | Treat it as product intent; verify live official/account facts and fail closed on drift. | Model catalogs, free eligibility, and quotas change. | Provider registry/router/docs | Official/account discovery changes a fact. |
| AS-002 | 2026-08-12 | Is `gemini-3.6-flash` guaranteed free? | No. Keep a Gemini capability alias; activate an exact model only after current free eligibility is verified. | Gemini adapter/router/UI | Google exposes a verified free-eligible replacement. |
| AS-003 | 2026-08-12 | Does Mistral guarantee a fixed `$10/month` allowance? | Do not encode a dollar amount. Verify Free Mode/account limits live. | Mistral adapter/router/docs | Official account/API exposes a stable allowance. |
| AS-004 | 2026-08-12 | Should every optional provider be required? | No. Core/local completion must work with zero keys; specialists remain explicit optional lanes. | Activation/fallback/tests | Kevin later promotes a lane with a separate decision. |
| AS-005 | 2026-08-12 | Where do credentials enter? | Silent ignored local terminal ceremony after preactivation; never chat/browser/app state. | K10/security/tooling | A separately approved managed-secret path replaces it. |
| AS-006 | 2026-08-12 | Does local key activation authorize Cloudflare deployment or remote secrets? | No. Prepare instructions only; require separate just-in-time approval. | Relay/K10/handoff | Kevin explicitly authorizes the exact remote action. |
| AS-007 | 2026-08-12 | May provider failures cause fan-out? | Sequential compatible fallback only, bounded by quota/circuit and one result need. | Router/cost/privacy | A specific feature proves a separately approved comparison need. |
| AS-008 | 2026-08-12 | May sensitive school/athlete/finance content use free providers? | Fail closed by default; use synthetic/sanitized/public content unless a future approved data contract exists. | Privacy manifest/router | Approved institutional contract and policy packet exist. |
| AS-009 | 2026-08-13 | The attached package claims product source is current, but its `index.html` omits the canonical Attention Proof Loop. | Adopt mission/control artifacts and contracts; preserve the Git checkout's newer application/tests and merge mission overlays deliberately. | Prevents a silent regression and is reversible through the feature branch. | Mission adoption, all later implementation | A package source file is proved newer and compatible by diff plus full tests. |
| AS-010 | 2026-08-13 | The supplied archive had no Git metadata, while the authoritative workspace does. | Use the real Git checkout at base `43715bf` and focused branch `codex/kevinos-v40-ai-fabric`; do not import archive history claims. | Preserves canonical releases, Attention evidence, and safe rollback. | Repository workflow and evidence | Canonical remote/branch authority changes. |
| AS-011 | 2026-08-13 | The mission requires one final app/cache release bump but does not name a target. | Advance the canonical v0.57 candidate by one release to v0.58 and keep schema v40. | Smallest truthful checkpoint; avoids inventing skipped releases and obeys the three-bump rule. | K9 release candidate | Kevin chooses a different release train before publication. |
| AS-012 | 2026-08-13 | Representative scale shows large DOMs but fast measured interactions. | Record the evidence and do not add virtualization or a dependency without a demonstrated regression. | Avoids premature architecture churn inside the recovery-friendly single file. | Tasks, Library, relationship selectors | A real target interaction exceeds the documented calm budget. |

Add rows as `AS-009`, `AS-010`, and so on.
