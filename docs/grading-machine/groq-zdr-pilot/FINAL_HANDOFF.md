# KevinOS v0.64 credentialless Grading Groq ZDR pilot handoff

Packet fingerprint: `grading-groq-zdr-pilot-v1-f85f024dfaa65e676a29`

Date: 2026-08-27 America/Chicago
Branch: `codex/grading-groq-zdr-pilot`
Release candidate: app v0.64 / cache `kevinos-v0_64` / schema v40
Remote status: not pushed, deployed, published, activated, or connected to a live grading provider.

## 1. Outcome

KevinOS now has the complete credentialless preactivation slice for the next gated packet. Inside the existing Grading Machine, the inactive Pilot Lab prepares a transient synthetic-only shadow capsule with a fresh one-time token, approved rubric contract, bounded source paragraphs, exact omissions, byte count, and SHA-256 fingerprint. It has no send control and the browser contains no invocation of the new relay route.

The relay now exposes a protected/bounded/rate-limited `POST /grading/pilot/route` contract that is disabled by default. If a future authority gate enables both dedicated flags, it still requires the exact synthetic/sanitized/reviewed packet and valid capsule fingerprint, routes strictly to Groq with no fallback, and fails unless ZDR, exact free-model verification, policy freshness, content-free ledger, circuit, and quota headroom all pass. Output is constrained to the exact Grading Provider Output v1 structural schema and a grading-specific validator checks rubric bounds, source evidence, proposal-only status, and forbidden claims.

Still gated: any secret ceremony, live Groq call, live account/ZDR/free-policy proof, real student data, non-synthetic capsule, provider-policy mutation, deployment, push, publication, finalization by a model, or grade posting.

## 2. Acceptance ledger

`02_ACCEPTANCE_LEDGER.md` records GP-A01–A07, GP-B01–B09, and GP-C01–C02 as `pass` with local evidence. GP-G01 (one future fixed synthetic live probe) remains `pending / BLOCKED-EXTERNAL` for separate Kevin authorization. GP-G02 (any real educational record) remains `pending / BLOCKED-AUTHORITY` and requires a new privacy packet. No item is waived and a pending gate is not counted as pass.

## 3. Changed-file map

- `index.html` — v0.64 Pilot Lab preview, local scanner/capsule/fingerprint functions, inactive UI, mobile overflow repair, no transport control.
- `sw.js` — matching `kevinos-v0_64` offline shell cache.
- `relay/worker.js` — route registration, disabled-by-default handler, exact request/fingerprint/output validation, dedicated prompt/schema, strict Groq/ZDR routing.
- `test/harness.js` — exports pilot app contracts to dependency-free tests.
- `test/run.sh` — includes both new pilot suites.
- `test/grading-groq-pilot.test.js` — transient/canonical/portable isolation, synthetic-only, token, omission, hostile-input, UI, and zero-call source contracts.
- `relay/test/grading-groq-pilot.test.js` — auth/disabled/privacy/ZDR/free/ledger/no-fallback gates, exact schema equality, outbound minimization, evidence, forbidden-claim, and content-free ledger tests.
- `docs/grading-machine/groq-zdr-pilot/00_READ_ME_FIRST.md` — scope and hard stops.
- `docs/grading-machine/groq-zdr-pilot/01_BLUEPRINT.md` — trust boundary and relay architecture.
- `docs/grading-machine/groq-zdr-pilot/02_ACCEPTANCE_LEDGER.md` — dependency-ordered evidence ledger.
- `docs/grading-machine/groq-zdr-pilot/03_ACTIVATION_RUNBOOK.md` — future JIT authority gate; no current permission.
- `docs/grading-machine/groq-zdr-pilot/FINAL_HANDOFF.md` — this formal handoff.
- `docs/RELEASE_v0.64.md` — local candidate scope and rollback.
- `docs/CURRENT_STATE.md` — current v0.64 candidate truth and remaining gates.
- `docs/ARCHITECTURE.md`, `docs/STATE_CONTRACT.md`, `docs/ROOM_MAP.md`, `docs/RELAY_ROUTE_MATRIX.md`, `GETTING_STARTED.md` — pilot isolation, placement, route, and operator boundaries.
- `output/evolution/wave-20260828T005734Z.log`, `preactivation-20260828T005806Z.log`, `final-20260828T005838Z.log` — unedited wrapper outputs, including the preserved historical v40 mission-state findings.

The user-supplied zip and extracted directory remain untracked and untouched.

## 4. Architecture proof

No room or schema was added: doctor reports 20 rooms and schema v40. The capsule lives only in transient `gmUi.pilotPreview`, is never written to the seven Grading Vault stores, and is absent from canonical state and portable backup assertions. No pilot data enters `CONTENT_ARRAYS`, `PORTABLE_OBJS`, sync, snapshots, search, Library, Council, contextual AI, general receipts, or operations.

The app and Pilot Lab render from the dependency-free cached `index.html`. With the local HTTP server stopped, a real-browser reload served KevinOS v0.64 from the service worker and reopened Teaching Tools. Original source blobs remain under the unchanged Grading Vault contract; the shadow capsule contains bounded extracted synthetic paragraphs, never original bytes.

## 5. Privacy and security proof

- Browser source contains no `/grading/pilot/route` call and the UI has no send control.
- Local preparation rejects non-synthetic work and hostile instruction, accommodation/health, contact/identifier, and secret-like fixtures.
- The relay defaults to `GRADING_PILOT_DISABLED` before provider transport.
- `FABRIC_DENIED_PRIVACY` remains exactly youth-sensitive, finance-sensitive, and secret; `allowPaid=false` remains mandatory.
- Blocked disabled/auth/privacy/manifest/ZDR/free/ledger/provider cases leave the fetch spy at zero.
- The only successful transport in tests is a mocked Groq request. Its user body contains only the shadow token, rubric fingerprint/version/criteria, and synthetic source paragraphs. No identity, filename, course/hour, assignment metadata, vault token, official grade, or finalization is sent.
- KV evidence contains counters/circuit state only and no source or response text.
- Exact request keys, cryptographic capsule fingerprint, bounded paragraphs/criteria, and output schema all fail closed. Invented evidence and finalization/posting/integrity claims are rejected.

## 6. Testing

Starting HEAD `3a17d7799b03c6a299dff0db83a8fb47ec61c296` passed doctor, secret scan, structure, and aggregate baseline before edits; the aggregate completed normally.

Final focused and aggregate commands:

```sh
node --check relay/worker.js
node test/grading-groq-pilot.test.js
node relay/test/grading-groq-pilot.test.js
node relay/test/ai-fabric.test.js
node relay/test/route-auth.test.js
node tools/doctor.js
node tools/scan-secret-values.js
node tools/check-evolution-state.js --mode structure
sh test/run.sh
sh tools/run-evolution-gates.sh wave
sh tools/run-evolution-gates.sh preactivation
sh tools/run-evolution-gates.sh final
```

Final aggregate result, unedited summary:

```text
KevinOS doctor ok — app v0.64, schema v40, 20 rooms, 49 relay routes
KevinOS secret-value scan ok — 177 text files, 0 approved local secret store(s) skipped, 0 exposed values
syntax ok (app script, sw.js, worker.js)
es5 clean
grading Groq pilot app privacy ok
grading Groq pilot relay privacy and schema ok
credential ceremony self-test ok — create, preserve, rotate, revoke, permissions, redaction, and core policy staging
provider probe self-test ok — loopback-only, strict single-provider, synthetic, content-free, and redacted
ALL GREEN ✓
```

The aggregate yielded once after 30 seconds, then completed normally. It did not stall.

An exact-HEAD repeat after the local candidate commit produced the same doctor, secret, focused-suite, credential/probe self-test, and `ALL GREEN` aggregate result.

The wave wrapper was clean and returned `EVOLUTION GATE PASS`. The preactivation wrapper also returned pass while its embedded checker printed that the already-completed v40 mission was not in historical `PREACTIVATION_READY` and K10 was no longer TODO. The final wrapper returned pass while its embedded checker printed that the v40 mission file was not marked `COMPLETE` and retained 12 unchecked legacy ledger items. Those findings are preserved in the logs and are not misreported as clean mission-state checks; changing the completed v40 ledger was outside this packet.

## 7. Synthetic demonstration and browser QA

The built-in Hour 3 fictional batch produced three local submissions. The Pilot Lab prepared one shadow capsule with two rubric criteria, bounded fictional source paragraphs, a distinct random token, content-free counts, and an SHA-256 fingerprint. The manifest stayed unapproved and the screen stated `No transport performed`.

Real in-app-browser checks covered 390×844 and 1440×900, the Teaching Tools launch, batch creation, rubric approval, synthetic sample intake, capsule preview, light and dark themes, visible focus, Shift-Tab focus wrap, origin-server-off offline reload, bridge unavailable (`workspace unaffected`), and zero console warnings/errors. Initial 390px inspection found internal horizontal overflow from long hashes/status strings; the CSS was repaired and the repeated check showed document overflow 0, workspace overflow 0, and no offending descendants.

## 8. Known limitations and failed attempts

- This is credentialless policy proof, not live Groq/account/ZDR/free-tier proof.
- Pattern scanning cannot prove arbitrary educational text is de-identified; that is why all non-synthetic data remains blocked.
- The relay route exists but is disabled, and the browser intentionally has no activation or send path.
- Two guessed standalone check commands (`tools/check-es5.js` and `tools/check-contraband.js`) did not exist. The repository's actual extracted-script syntax and ES5/contraband checks in `test/run.sh` were then used and passed.
- One browser inspection attempted a direct performance-resource read that the isolated inspection context did not expose. Zero transport is instead proven by source absence, no send control, fetch-spy assertions, default-disabled route tests, and the successful offline flow.
- The first mobile browser pass exposed real overflow; the repaired pass, not the first screenshot, is the release evidence.
- The v40 preactivation/final wrapper mission-state findings described above remain visible and unresolved rather than being rewritten away.

## 9. Next authority gate

Follow `03_ACTIVATION_RUNBOOK.md` only after fresh Kevin authorization. Do not paste keys into chat. Verify content-free account facts, enable only the two dedicated flags, run one fixed built-in synthetic capsule, inspect the exact outbound body and response, then stop. A successful probe still does not authorize real educational data. Any such expansion requires a separate de-identification/privacy/institutional-authority packet.

## 10. Packet fingerprint

`grading-groq-zdr-pilot-v1-f85f024dfaa65e676a29`
