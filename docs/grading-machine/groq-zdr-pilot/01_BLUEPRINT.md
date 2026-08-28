# Credentialless de-identified Groq ZDR grading pilot

Packet fingerprint: `grading-groq-zdr-pilot-v1-f85f024dfaa65e676a29`

## Trust boundary

The local Grading Vault remains authoritative for source bytes, extracted text, identity mappings, rubric approval, proposals, review, overrides, arithmetic, finalization, exports, and deletion. The pilot preview is transient UI memory only and is not persisted.

The only future-eligible remote object is a synthetic shadow capsule containing:

- a newly generated one-time shadow token unrelated to the vault submission token;
- approved rubric fingerprint and bounded criterion contracts;
- bounded synthetic source paragraphs with stable local locations;
- a content-free manifest listing included and omitted categories;
- the packet, prompt, and schema versions.

The capsule omits local identity, student name, source filename, course, hour, assignment name, accommodations, teacher-only notes, vault token, official totals, letter grades, finalization state, and original bytes.

The local scanner rejects prompt-injection or grading-instruction language and accommodation, contact, identifier, or secret-like content. Pattern redaction is defense in depth, not proof that arbitrary educational data is de-identified; therefore this packet remains synthetic-only.

## Dedicated relay gate

`POST /grading/pilot/route` is authenticated, rate-limited, bounded, and disabled unless both `GRADING_GROQ_PILOT_ENABLED=1` and `GRADING_GROQ_PILOT_SYNTHETIC_ONLY=1` exist server-side. The endpoint accepts only the exact packet shape, `SANITIZED`, `synthetic=true`, `allowPaid=false`, an explicit reviewed manifest, and Groq as the strict provider.

Before adapter invocation it also requires the existing fabric gates: configured and enabled Groq, exact free-model verification, current policy, ZDR confirmation, content-free usage ledger, closed circuit, and quota headroom. There is no fallback. The grading prompt is dedicated-route-only so the generic fabric route cannot invoke it.

Provider output must match the Grading Provider Output v1 shape exactly. The grading-specific validator rejects extra fields, unknown or duplicate criteria, out-of-bounds scores, invented evidence, invalid flags, arithmetic/finalization/posting claims, and schema drift. The relay returns proposal content and content-free provenance only. It cannot finalize or post a grade.

## Preactivation and later authority gate

Preactivation uses mock fetches and synthetic fixtures only. Passing tests prove policy behavior, not Groq account terms, ZDR account state, live model eligibility, or live transport. Those remain external facts. A later Kevin-authorized ceremony may verify the account and run one fixed synthetic probe; it may not send real student work. Any expansion beyond synthetic fixtures requires a new privacy packet and separate authorization.
