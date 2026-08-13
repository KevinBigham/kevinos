# KevinOS v40 Personalization + AI Fabric — Implementation Decisions

This log supplements, but does not replace, `docs/DECISIONS.md`.

## Seed decisions

| ID | Date | Decision | Rationale | Reversible? | Evidence / files |
| --- | --- | --- | --- | --- | --- |
| EV-D001 | 2026-08-12 | Use one deliberate schema v39→v40 migration for roles, decisions, and portfolio. | Canonical top-level state requires formal recovery/portability proof. | Partly; pre-v40 snapshot/rollback required. | `04_V40_PERSONALIZATION_BLUEPRINT.md` |
| EV-D002 | 2026-08-12 | Preserve legacy `area`; never auto-split Work or Coaching. | Speculative mapping risks data/privacy errors. | Yes, through previewed remap/Undo. | AT-021/022 |
| EV-D003 | 2026-08-12 | Keep Today deterministic and reason-coded. | KevinOS must explain priority, not hide it in a score. | Yes. | G-03/G-07, AT-032/033 |
| EV-D004 | 2026-08-12 | Keep Studio project-linked, not a second project database. | Project state and AI work need one spine. | Yes. | G-05/G-09, AT-050/052 |
| EV-D005 | 2026-08-12 | Keep record privacy monotonic. | Youth, family, work, and finance boundaries fail closed. | No weakening permitted. | AT-014/090/091/092 |
| EV-D006 | 2026-08-12 | Use one provider-neutral relay contract and stable capability aliases. | Feature code survives provider/model churn and remains testable without keys. | Yes. | `08_AI_PROVIDER_FABRIC_BLUEPRINT.md`, AT-130/155 |
| EV-D007 | 2026-08-12 | Enforce `allowPaid=false` before routing and fallback. | “Free” must be mechanically safe, not marketing copy. | Yes only through a later explicit paid-policy decision. | AT-133/135 |
| EV-D008 | 2026-08-12 | Classify/minimize/deny before provider transport. | Sensitive data cannot be recovered after sending. | Policy can become stricter; weakening needs new approval. | AT-132 |
| EV-D009 | 2026-08-12 | Store content-free provider receipts and exact model identity. | Enough evidence for trust/debugging without private duplication. | Yes. | AT-137/152 |
| EV-D010 | 2026-08-12 | Complete K-1–K9 before asking for credentials; keys use silent local ceremony. | Maximizes credentialless work and prevents conversational leakage. | No during this mission. | `09_CREDENTIALS_LAST_ACTIVATION_RUNBOOK.md`, AT-156/157 |
| EV-D011 | 2026-08-12 | Keep Groq/Mistral/Gemini/Workers AI as conditional core lanes; specialists optional. | Broad capability with honest degradation, no key sprawl requirement. | Yes through registry policy. | `07_FREE_AI_PROVIDER_RESEARCH.md` |
| EV-D012 | 2026-08-12 | Keep continuous improvement synthetic and human-promoted. | Avoids self-modifying prompts/routes and protects trust. | Yes. | AT-153/154 |
| EV-D013 | 2026-08-12 | Treat local activation and remote deployment as separate authorizations. | Prevents accidental production mutation. | No weakening permitted. | AT-161 |
| EV-D014 | 2026-08-13 | Preserve the canonical Git checkout and import the attached package as a mission overlay, not a product replacement. | The package product file would remove shipped Attention behavior and tests. | Yes; isolated branch and base commit remain available. | AS-009, K-1 diff evidence |
| EV-D015 | 2026-08-13 | Commitment selection preserves canonical record order and exposes a stable set of reason codes; it does not calculate a weighted urgency score. | Kevin must be able to inspect why work is surfaced, and KevinOS must not invent duration or priority. Missing start-by remains a visible fact. | Yes; the closed registries and pure selector are independently testable. | AT-030–033, EV-K3-001/002 |
| EV-D016 | 2026-08-13 | Active day mode is device-local; calendar facts can suggest a mode but never apply one. | A live operating context should not create cross-device sync conflict or infer Kevin’s state without confirmation. Role/capacity settings remain explicit portable portfolio preferences. | Yes; clearing the side-store returns to no mode. | AT-060–063, EV-K4-001/002 |
| EV-D017 | 2026-08-13 | Supporting surfaces remain read-time views over canonical records; only decisions, explicit communication/admin fields, and nested Lab Budget metadata persist. | Prevents shadow CRM/accounting/proof databases while making links and lifecycle visible. | Yes; optional fields remain lossless and removable. | EV-K8-001/002 |
| EV-D018 | 2026-08-13 | Knowledge conversion requires a named project, monotonic privacy, exact confirmation, and source provenance before local mutation. | A useful shortcut must not turn Ready into Sent or weaken custody. | Yes through ordinary editable records and existing tombstones. | AT-100, EV-K8-001/002 |
| EV-D019 | 2026-08-13 | Advance app/footer/cache together from v0.57 to v0.58 after the credentialless candidate is green; keep schema v40. | One bounded release checkpoint matches existing version law and the already-complete migration. | Yes by reverting the candidate patch before publication. | AS-011, K9.14 |

Add implementation decisions as `EV-D017` onward.
