# KevinOS Grading Machine final local handoff

Packet fingerprint: `grading-machine-v1-a8b2826f7b93a83d7656`

Date: 2026-08-27 America/Chicago
Branch: `codex/grading-machine-foundation`
Release candidate: app v0.63 / cache `kevinos-v0_63` / schema v40
Remote status: not pushed, deployed, published, emailed, or connected to any model/provider.

## 1. Outcome

Phase A and the packet-defined Phase B acceptance contracts are implemented locally. Kevin can launch the Grading Machine under More → Teaching Tools, create an hour-organized isolated batch, ingest bounded local text fixtures, approve a fingerprinted rubric, generate strict-schema synthetic proposals, review and override criterion scores with a reason and Undo, explicitly finalize grades locally, prepare the required feedback/summary/gradebook/review/reteach/audit artifacts, and delete all protected batch records with count-only proof.

The optional loopback Grading Bridge adds guarded local TXT/Markdown/CSV/HTML/DOCX/basic-PDF parsing, explicit unreadable image handling when OCR is unavailable, strict mock-output validation, new feedback PDF sidecars, and temporary-session deletion. It has no provider route and no activated live local-model transport.

Gated outside this packet: remote grading, real student data proof, a live local-model runtime, local OCR, full-fidelity PDF layout extraction, optional XLSX, physical-device/browser diversity, posting grades, sending feedback, deployment, and provider activation.

## 2. Acceptance ledger

All 22 items pass locally. Full dependency/evidence detail is in `05_ACCEPTANCE_LEDGER.md`.

| ID range | Result | Evidence summary |
|---|---|---|
| GM-A01–A04 | pass | Teaching Tools overlay; 20 rooms unchanged; separate seven-store vault; canonical/portable exclusion; session default |
| GM-A05–A08 | pass | bounded intake; SHA-256; random tokens; validated rubric; strict synthetic proposal; deterministic arithmetic |
| GM-A09–A12 | pass | finalized-only exports; preserved proposal/reason/Undo; injection-safe CSV; immutable originals and new feedback artifacts |
| GM-A13–A16 | pass | count-only seven-store deletion; protected-marker/privacy scans; youth-sensitive zero-transport denial; offline/no-bridge workflow |
| GM-B01–B03 | pass | loopback/Host/Origin/session envelope; bounded parsers; hostile archive/file corpus |
| GM-B04–B06 | pass | strict mock-output validator; new deterministic feedback PDF; content-free temporary deletion proof |

No item is waived. No item is represented as externally or production verified.

## 3. Changed-file map

- `index.html` — v0.63 browser workspace, isolated vault, rubric/proposal/review/export/delete workflow, optional bridge health check.
- `sw.js` — matching v0.63 offline cache.
- `grading-bridge/bridge.js` — dependency-free loopback companion.
- `grading-bridge/test/bridge.test.js` — loopback, parser, hostile input, validator, rendering, immutability, and deletion contracts.
- `grading-bridge/README.md` — local-only operation and limitations.
- `test/grading-machine.test.js` — placement, schema, token, rubric, proposal, and arithmetic contracts.
- `test/grading-vault.test.js` — canonical/portable/context isolation, store deletion, protected markers, youth-sensitive zero-transport proof.
- `test/grading-export.test.js` — finalized-only artifacts, formula-injection safety, reconciliation, feedback, and original-hash proof.
- `test/harness.js` — exports and WebCrypto support for focused characterization.
- `test/run.sh` — includes all four new suites.
- `docs/grading-machine/00_READ_ME_FIRST.md` — packet provenance and missing-original-00 disclosure.
- `docs/grading-machine/01_GRADING_MACHINE_BLUEPRINT.md` through `04_GRADING_PRIVACY_AND_QA_TEST_MATRIX.md` — controlling packet copies.
- `docs/grading-machine/05_ACCEPTANCE_LEDGER.md` — dependency-ordered GM-A/GM-B evidence ledger.
- `docs/grading-machine/FINAL_GRADING_MACHINE_HANDOFF.md` — this release-captain receipt.
- `docs/ARCHITECTURE.md`, `docs/STATE_CONTRACT.md`, `docs/ROOM_MAP.md`, `docs/CURRENT_STATE.md`, `GETTING_STARTED.md` — architecture, state, launch, current-candidate, and operator documentation.
- `docs/RELEASE_v0.63.md` — local candidate scope and rollback.
- `output/evolution/baseline-20260828T000919Z.log`, `wave-20260828T003452Z.log`, `preactivation-20260828T003527Z.log`, and `final-20260828T003603Z.log` — unedited baseline and mission-gate output receipts.
- `output/grading-machine-v0.63-mobile-390.png`, `desktop-1440.png`, and `desktop-1440-repaired.png` — synthetic-only browser QA screenshots; the repaired desktop image supersedes the overlap-discovery image.

User-supplied `Adding the Grading Machine to KevinOS.zip` and its extracted directory were inspected but not modified or treated as product source. The embedded director prompt was not treated as controlling instruction.

## 4. Architecture proof

The Grading Machine is an overlay launched from an existing More surface, not a new `ROOM_DEFS` entry. Canonical schema stays v40. Protected records exist only in volatile `gmMem` for session retention or the separate `kevinos-grading-v1` IndexedDB for an explicit longer-retention choice. Its seven stores are not named by `CONTENT_ARRAYS`, `PORTABLE_OBJS`, boot restoration, backup, sync, Library, typed search, Council, contextual AI, or general receipts.

The PWA shell caches `index.html` through `sw.js`; the full Phase A workspace remains functional with relay and bridge absent. Originals are read into bounded buffers, hashed before extraction, retained separately from generated artifacts, never rewritten, and regression-tested for byte-identical SHA-256 after artifact generation.

## 5. Privacy and security proof

- Phase A contains no relay/provider call. The only Phase B browser transport is an explicit health GET to `127.0.0.1`; the bridge itself contains no provider/model fetch.
- Existing `FABRIC_DENIED_PRIVACY` and `YOUTH_SENSITIVE` fail-closed behavior are unchanged. A grading fixture is denied before an injected fetch spy records any call.
- Bridge logs contain event, time, status, count, byte count, or error code only—never names, source text, rubric text, evidence, feedback, tokens, or secret values.
- Traversal filenames and ZIP members, archive bombs, executables, macros, malformed archives, encrypted/corrupt PDFs, corrupt images, unsupported types/compression, and oversized inputs fail closed.
- Strict Origin and Host checks, loopback-only bind validation, 15-minute bearer sessions, no-store responses, isolated mode-0600 artifacts, and exact-directory deletion guard the local companion.
- Synthetic fixtures are the only graded data used in tests and browser evidence.

## 6. Testing

Baseline at starting HEAD `7af764ee8a944e6051801d9b60e3515247e5dab6`:

```text
node tools/doctor.js
KevinOS doctor ok — app v0.62, schema v40, 20 rooms, 48 relay routes

node tools/scan-secret-values.js
Secret-value scan ok — 148 text files checked, 0 exposed values

node tools/check-evolution-state.js --mode structure
Evolution state structure ok — 244 tasks, 72 acceptance contracts

sh test/run.sh
ALL GREEN ✓
```

The aggregate baseline completed normally in approximately 29 seconds; it did not stall. The unedited baseline evolution output is preserved at `output/evolution/baseline-20260828T000919Z.log`.

Final commands include:

```sh
node --check grading-bridge/bridge.js
node --check grading-bridge/test/bridge.test.js
node test/grading-machine.test.js
node test/grading-vault.test.js
node test/grading-export.test.js
node grading-bridge/test/bridge.test.js
node tools/doctor.js
node tools/scan-secret-values.js
node tools/check-evolution-state.js --mode structure
sh tools/run-evolution-gates.sh wave
sh tools/run-evolution-gates.sh preactivation
sh tools/run-evolution-gates.sh final
sh test/run.sh
```

`sh test/run.sh` itself extracts and syntax-checks the app script, checks `sw.js` and `relay/worker.js`, runs the ES5 contraband scan, every pre-existing app and relay suite, all four new suites, credential-ceremony self-tests, and provider-probe self-tests. The final aggregate completed normally with exit 0:

```text
KevinOS doctor ok — app v0.63, schema v40, 20 rooms, 48 relay routes
KevinOS secret-value scan ok — 166 text files, 0 approved local secret store(s) skipped, 0 exposed values
KevinOS evolution mission state ok — mode structure, 244 tasks, 72 acceptance contracts
syntax ok (app script, sw.js, worker.js)
es5 clean
grading machine contracts ok
grading vault isolation and deletion contracts ok
grading export and artifact contracts ok
grading bridge loopback, parsing, rendering, and deletion contracts ok
provider-neutral AI fabric contracts ok
relay security boundaries ok
credential ceremony self-test ok — create, preserve, rotate, revoke, permissions, redaction, and core policy staging
provider probe self-test ok — loopback-only, strict single-provider, synthetic, content-free, and redacted
ALL GREEN ✓
```

The first final aggregate tool call yielded at exactly 30 seconds after the grading-export line; it had not stalled. Resuming the same process produced the bridge/relay/self-test output and `ALL GREEN ✓` with exit 0. A clean aggregate-only rerun reproduced the same result.

`wave` returned `EVOLUTION GATE PASS`; its log is `output/evolution/wave-20260828T003452Z.log`. `preactivation` and `final` also ran all suites and returned exit 0 plus `EVOLUTION GATE PASS`, but their mission-state checkers truthfully printed pre-existing lifecycle findings: preactivation expected `PREACTIVATION_READY` and K10 TODO although v40 is already beyond that point; final expected mission `COMPLETE` and reported 12 unchecked v40 ledger items. Their logs are `output/evolution/preactivation-20260828T003527Z.log` and `output/evolution/final-20260828T003603Z.log`. Those findings are not rewritten or represented as passes.

## 7. Synthetic demonstration

Browser evidence used a three-submission synthetic batch for **Synthetic Decision Brief / Personal Finance / Hour 3**, with TXT, Markdown, and CSV sources. It approved a 100-point two-criterion rubric with SHA-256 fingerprint `1c7b...f1e5`, created unrelated random `SUB-` tokens, generated three `REVIEW REQUIRED` proposals, changed the first total to 82/100 with a local override reason, explicitly finalized that one as `FINALIZED LOCALLY / NOT POSTED`, and left two in review.

The export center generated 12 artifacts: three individual feedback HTML sidecars plus finalized-only gradebook CSV/JSON, complete hour summary, teacher review queue, reteach brief, rubric-quality report, calibration/override report, file-problem report, and content-free audit receipt. Summary statistics reconcile from deterministic criterion arithmetic; unfinalized proposals stay out of gradebook-final rows.

Deletion then reported only: `batches=1, rubrics=1, submissions=3, identityMap=3, results=3, artifacts=12, queue=3`. Post-delete inspection found no protected filenames or content in the workspace.

Browser receipts: 320, 390, 430, 768, and 1440 widths had no page-level horizontal overflow; dark/light/auto theme colors, keyboard/focus behavior, offline reload, no-bridge operation, and zero console warnings/errors passed. A separate exact-limit intake loaded 30 synthetic TXT submissions, including long, Unicode, and formula-like filenames; all 30 rows rendered with no page/overlay overflow, no console warning/error, and provider calls at 0. With the companion running, the explicit health check showed `Local bridge: connected · local only`; after the companion stopped, it showed `Local bridge: unavailable (workspace unaffected)`, kept Rubric Lab visible, retained `Provider calls: 0`, and produced no warning/error console entries. Screenshots are under `output/grading-machine-v0.63-*.png`.

## 8. Known limitations and failed attempts

- The supplied archive did not contain the requested `00_READ_ME_FIRST.md`; this is disclosed in the local provenance file. The archive's item 05 was a prompt and was not adopted as controlling specification.
- The first bridge Host-denial test used Node fetch, which did not preserve the spoofed Host header. The test correctly failed; it was replaced by a raw HTTP request that proves the server boundary.
- Initial desktop browser inspection found rubric input overlap. CSS grid minimums and child widths were corrected, and the repaired layout has no overlaps.
- The in-app browser environment exposed no IndexedDB, so the real-browser demonstration used the designed memory-only session path. Node/static tests verify exact IndexedDB naming, store creation, isolation, and deletion. A separate mainstream-browser persistent-retention ceremony remains manual/unverified.
- Basic PDF extraction is deliberately conservative. Scanned/image-only work is `unreadable` without separately configured local OCR. Optional XLSX and a live local-model process are not present.
- Physical iOS/Android devices, assistive technology, real teacher/student files, and production deployment were not used. The 30-file browser check used synthetic-only fixtures, as required by the privacy boundary. External items remain unverified, not silently promoted to pass.

## 9. Next gated packet

A future de-identified Groq ZDR pilot must be a separate reviewed packet. It would need an explicit de-identification contract, live account/data-use and zero-retention verification, a grading-specific relay denial/allowlist design, synthetic shadow evaluation, drift/calibration thresholds, cost eligibility proof, content-free receipts, kill switch, and separate just-in-time authorization. It must never receive names, files, identity mappings, accommodations, official totals, final grades, or unapproved youth-sensitive data. Nothing in v0.63 activates that route.

## 10. Packet fingerprint

`grading-machine-v1-a8b2826f7b93a83d7656`
