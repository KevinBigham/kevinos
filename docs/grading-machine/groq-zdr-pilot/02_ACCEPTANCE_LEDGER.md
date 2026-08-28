# Acceptance ledger — Groq ZDR grading pilot

Packet fingerprint: `grading-groq-zdr-pilot-v1-f85f024dfaa65e676a29`

Statuses are `pending`, `pass`, `fail`, or `waived`. A waiver is never a pass.

| ID | Dependency | Acceptance item | Status | Evidence |
|---|---|---|---|---|
| GP-A01 | — | Separate packet and fingerprint preserve the local Grading Machine contract | pass | Packet docs; original Grading Machine/Vault/export/bridge suites pass in aggregate |
| GP-A02 | A01 | Pilot preview lives inside Teaching Tools and adds no canonical room or state | pass | `test/grading-groq-pilot.test.js`; doctor remains 20 rooms/schema v40 |
| GP-A03 | A02 | Preview is synthetic-only, transient, offline, and performs zero transport | pass | App source contains no pilot relay call; offline browser reload served v0.64 with origin server stopped |
| GP-A04 | A03 | Capsule uses a fresh random shadow token unrelated to identity, filename, or vault token | pass | WebCrypto token assertions in app suite |
| GP-A05 | A03 | Capsule omits identity, class metadata, originals, official grades, notes, and finalization | pass | App suite plus browser exact omissions display |
| GP-A06 | A03 | Hostile instructions, accommodation/contact/identifier/secret patterns block preparation | pass | Five local hostile fixture classes fail closed |
| GP-A07 | A03 | Preview shows included/omitted fields, redaction/blocker counts, byte count, hash, and no-transport truth | pass | 390/1440 browser inspection; app suite |
| GP-B01 | A01 | Dedicated authenticated, bounded, rate-limited relay route is disabled by default | pass | AI route registration, route-auth assertion, default-disabled zero-fetch assertion |
| GP-B02 | B01 | Route requires synthetic, sanitized, reviewed exact manifest and packet versions | pass | Exact-key/version/manifest/fingerprint request validator and hostile fixtures |
| GP-B03 | B02 | Existing privacy denial, allowPaid=false, and youth-sensitive fail-closed rules are unchanged | pass | Sealed denial-set assertion; provider-fabric regression suite |
| GP-B04 | B02 | Groq is strict with no fallback and requires ZDR, exact free verification, policy freshness, ledger, circuit, and headroom | pass | Credentialless gate matrix; one-candidate/fallback-chain assertions |
| GP-B05 | B04 | Every blocked request makes zero provider calls | pass | Fetch spy remains zero across disabled/auth/privacy/ZDR/free/ledger/provider gates |
| GP-B06 | B02 | Exact grading output schema is validated, including rubric bounds and evidence existence | pass | Generated schema deep-equals Provider Output v1 structural schema; invented quote rejected |
| GP-B07 | B06 | Output cannot claim totals, finalization, posting, or authoritative educational decisions | pass | Extra-field and posted-grade adversarial outputs rejected |
| GP-B08 | B04 | Successful mock transport sends only capsule fields and records content-free provenance | pass | Mock Groq body inspection; KV ledger contains no source text |
| GP-B09 | B01 | Generic `/ai/route` cannot invoke the dedicated grading prompt | pass | `dedicatedRouteOnly` bypass assertion |
| GP-C01 | A07,B09 | Pre-existing app, relay, credential ceremony, provider probe, evolution, and aggregate gates remain green | pass | Final `sh test/run.sh` completed normally with `ALL GREEN`; wave wrapper clean. Preactivation/final wrappers exited pass but retained their historical v40 mission-state findings—see handoff |
| GP-C02 | C01 | Manual browser checks cover desktop/mobile, keyboard/focus, themes, offline, and disabled relay truth | pass | 390×844 and 1440×900, zero overflow after repair, visible focus and Shift-Tab wrap, light/dark, offline reload, bridge unavailable, zero console warning/error |
| GP-G01 | C01 | Live credential ceremony and one fixed synthetic provider probe | fail | Kevin authorized one call and confirmed Global ZDR by screenshot. The fixed synthetic probe made exactly one Groq request and failed closed: no accepted proposal, validation not run, zero fallback, zero retained response content, nothing posted/finalized. Exact receipt: `04_LIVE_PROBE_RECEIPT.md`. No retry was attempted. |
| GP-G02 | G01 | Any real educational record or non-synthetic pilot | pending | `BLOCKED-AUTHORITY`: requires a new privacy packet; expressly out of scope |
