# Grading Machine acceptance ledger

Packet fingerprint: `grading-machine-v1-a8b2826f7b93a83d7656`

Status vocabulary is exactly `pending`, `pass`, `fail`, or `waived`. A waiver requires a written reason and is never a pass.

## Baseline evidence

- Branch start: `main` at `7af764ee8a944e6051801d9b60e3515247e5dab6`; focused work continues on `codex/grading-machine-foundation`.
- `node tools/doctor.js` — pass: app v0.62, schema v40, 20 room definitions, 48 relay routes.
- `node tools/scan-secret-values.js` — pass: 148 text files, zero exposed values.
- `node tools/check-evolution-state.js --mode structure` — pass: 244 tasks, 72 acceptance contracts.
- `sh tools/run-evolution-gates.sh baseline` — pass; evidence log `output/evolution/baseline-20260828T000919Z.log`.
- `sh test/run.sh` — pass, `ALL GREEN`; aggregate completed normally in approximately 29 seconds.
- Code truth: 19 `CONTENT_ARRAYS`, 12 `PORTABLE_OBJS`, schema v40, `FABRIC_DENIED_PRIVACY` contains `YOUTH_SENSITIVE`, `FINANCIAL_SENSITIVE`, and `SECRET`.

## Dependency order

| Order | ID | Dependency | Status | Required evidence |
|---:|---|---|---|---|
| 1 | GM-A01 | placement | pass | `test/grading-machine.test.js`; 20 rooms unchanged; browser More → Teaching Tools launch |
| 2 | GM-A02 | vault boundary | pass | `kevinos-grading-v1` plus seven stores; `test/grading-vault.test.js` canonical-state isolation |
| 3 | GM-A03 | A02 | pass | portable/sync/search/context negative assertions; no grading top-level field |
| 4 | GM-A04 | A02 | pass | session-only selected by default; explicit warned 1/7/30-day choices; browser receipt |
| 5 | GM-A05 | A02 | pass | WebCrypto SHA-256 and random `SUB-` token fixtures; bounded 1 MB/30 file/10 MB intake |
| 6 | GM-A06 | A02 | pass | duplicate IDs, required fields, deterministic total, version and SHA-256 fingerprint tests |
| 7 | GM-A07 | A05,A06 | pass | exact strict schema validator; synthetic-only fixture engine; no relay/provider path |
| 8 | GM-A08 | A06,A07 | pass | deterministic criterion/total/percent/rounding/scale/cutoff fixtures |
| 9 | GM-A09 | A07,A08 | pass | finalized-only gradebook CSV/JSON; browser retained two proposals in review |
| 10 | GM-A10 | A07,A08 | pass | immutable proposal, reasoned override, exact local Undo; browser finalized adjusted grade |
| 11 | GM-A11 | A08,A09 | pass | leading whitespace/control formula corpus; gradebook/summary/review reconciliation |
| 12 | GM-A12 | A05,A07 | pass | original byte hash unchanged; three new feedback HTML sidecars for three sources |
| 13 | GM-A13 | A02,A12 | pass | per-store delete fixture and browser count-only proof across all seven stores |
| 14 | GM-A14 | A03,A11 | pass | protected-marker scans; canonical/portable/sync/search/context clean; browser console clean |
| 15 | GM-A15 | A03 | pass | focused `YOUTH_SENSITIVE` grading fixture denied with zero transport calls |
| 16 | GM-A16 | A01-A15 | pass | service-worker offline reload; full memory-vault workflow with bridge/relay unavailable |
| 17 | GM-B01 | all applicable A pass | pass | `grading-bridge/test/bridge.test.js`: non-loopback construction rejected; raw Host and Origin denial; loopback health; 15-minute bearer session; explicit UI health/reconnect control |
| 18 | GM-B02 | B01 | pass | bounded TXT/MD/CSV/HTML/DOCX/basic-PDF parsers; stable paragraph/page locations; valid PNG/JPEG returns explicit local-OCR-unavailable unreadable state |
| 19 | GM-B03 | B01,B02 | pass | traversal filename and ZIP member, archive bomb, executable, macro, malformed DOCX, encrypted/corrupt PDF, corrupt image, unsupported/oversized file fixtures fail closed |
| 20 | GM-B04 | B01,A07 | pass | `/validate-local-output` uses the packet's exact top-level and nested schema, rubric bounds/fingerprint, and source-evidence validator; only synthetic/mock output tested; no model transport activated |
| 21 | GM-B05 | B01,B02 | pass | new `paper — GRADED v1.pdf`, PDF magic/hash, exclusive temp write, and unchanged original SHA-256 proof |
| 22 | GM-B06 | B01 | pass | authenticated session delete removes exact isolated temp directory and returns only `{temporaryFilesRemoved,sessionsRemoved}` counts |

## Current claim

All GM-A and GM-B acceptance items pass locally. Phase B remains optional and local-only: the basic PDF parser is conservative, image OCR is explicitly unavailable, and no live local-model process or remote provider is activated. Final repository and browser receipts are recorded in `FINAL_GRADING_MACHINE_HANDOFF.md`.
