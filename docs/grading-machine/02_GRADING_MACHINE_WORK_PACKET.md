# KevinOS work packet — Grading Machine Phase A/B foundation

## Outcome

Kevin can launch a privacy-separated Grading Machine from More, create a batch, approve a structured rubric, ingest local assignment files, process synthetic/local grading proposals, review criterion evidence, and export summaries plus graded feedback artifacts—without putting student records in canonical KevinOS state or making any live provider call.

Packet version: `1`
Packet fingerprint: `grading-machine-v1-a8b2826f7b93a83d7656`

## Current evidence

Repository baseline inspected on 2026-08-27:

- `index.html` declares app v0.62 and schema v40.
- `ROOM_DEFS` centralizes 20 routes; architecture documentation preserves a zero-new-room direction for supporting surfaces.
- `CONTENT_ARRAYS` / `PORTABLE_OBJS` are backup/sync allowlists.
- Exact-context provider jobs already preview a manifest, require approval, use `/ai/preview` + `/ai/route`, validate outputs, and create proposal-only receipts.
- `relay/worker.js` denies `YOUTH_SENSITIVE`, `FINANCIAL_SENSITIVE`, and `SECRET` before provider transport.
- Existing file ingestion handles bounded text and calendar/backup inputs, not durable PDF/DOCX student batches.
- The repository doctor and secret scan pass.
- Every app and relay suite passes when executed individually; credential and provider self-tests pass. The aggregate `sh test/run.sh` invocation stalled after `project-spine.test.js` during this inspection, while that suite and all subsequent suites passed individually. Preserve this baseline fact and investigate separately if the aggregate runner still hangs.

## Scope

### Allowed files for Phase A

- `index.html`
- `sw.js`
- `test/grading-machine.test.js`
- `test/grading-vault.test.js`
- `test/grading-export.test.js`
- `docs/ARCHITECTURE.md`
- `docs/STATE_CONTRACT.md`
- `docs/ROOM_MAP.md`
- `docs/CURRENT_STATE.md`
- new docs under `docs/grading-machine/`
- one release note

### Allowed files for Phase B

- everything in Phase A;
- new `grading-bridge/` directory;
- bridge-local tests and setup files;
- `SECURITY.md` and `GETTING_STARTED.md` for loopback setup.

### Forbidden in this packet

- changing `FABRIC_DENIED_PRIVACY`;
- adding a live remote grading route or prompt;
- enabling Gemini/Groq or changing model/account/provider bindings;
- requesting, reading, changing, or testing real secret values;
- deploying/pushing;
- adding student records to `state`, `CONTENT_ARRAYS`, or `PORTABLE_OBJS`;
- including Grading Vault data in backups, snapshots, sync, Library, typed search, Council, contextual AI, logs, or receipts;
- automatic gradebook posting, email, publishing, or student contact;
- real student data in fixtures, screenshots, docs, commits, or tests.

### Data/schema classification

- Original student files, extracted text, identity mapping, scores, and feedback: `YOUTH_SENSITIVE`, local vault only.
- Rubric templates without student data: `WORK_INTERNAL`; local by default and optionally saveable as an ordinary brief only through an explicit separate action.
- Synthetic fixtures: `PUBLIC` or `SANITIZED`.
- Canonical state schema: no change expected. The Grading Vault is a separate IndexedDB database.

### Security/privacy impact

High. The implementation must fail closed. A denied input must make zero provider calls and must not enter any portable, synced, searched, logged, or contextual-AI surface.

## Implementation contract

### Product placement

- Add a `Grading Machine` launch card under More in a Teaching Tools group.
- Open a dedicated workspace/overlay; do not add a top-level route in this packet.
- Keep the workspace usable offline.

### Phase A — local shell

Implement:

1. A session-only `kevinos-grading-v1` IndexedDB vault with `batches`, `rubrics`, `submissions`, `identityMap`, `results`, `artifacts`, and `queue` stores.
2. A batch wizard with assignment name, local course/hour label, rubric, grading scale, and retention mode.
3. TXT/MD/CSV ingestion using bounded `FileReader` reads; preserve source hash, size, and parse status.
4. Random submission tokens that are not derived from student identity or filename.
5. A structured rubric editor with stable IDs, max points, descriptions, performance levels, and deterministic total validation.
6. A synthetic grading engine fixture using the exact provider-output schema; it must never call the relay.
7. A Review Desk showing source, rubric, criterion evidence, proposed score, editable feedback, flags, finalization, and override reason.
8. Deterministic local totals, percentage, grade scale, rounding, and cutoff flags.
9. CSV and JSON exports, including safe CSV-cell escaping.
10. A content-free batch status only; no student data enters canonical state.
11. Explicit clear/delete with count-only confirmation.
12. Strong UI labels: “proposal,” “review,” “finalized locally,” and “not posted.”

### Phase B — loopback bridge

Implement:

1. A loopback-only service with strict origin allowlist and short-lived sessions.
2. Bounded parsing for PDF, DOCX, TXT/MD/HTML/CSV, images, and optional XLSX.
3. Safe archive handling; no macro/executable processing.
4. Page/paragraph evidence mapping.
5. Local OCR only when installed/configured; otherwise mark unreadable.
6. Feedback artifact generation that never overwrites originals.
7. Optional local-model adapter returning the strict schema.
8. Content-free logs only and explicit temporary-file deletion.
9. Browser capability/health display and fail-safe offline behavior.

### Existing patterns to reuse

- ES5 code style and one-file browser architecture.
- Stable container + event delegation.
- IndexedDB snapshot helper patterns, but with a new DB and no snapshot integration.
- Exact manifest preview and explicit approval UX.
- Proposal/review/finalize semantics.
- Content-free receipts and bounded Undo.
- Local download helpers and safe escaping.

### Explicit non-goals

- remote free-provider grading;
- inline PDF annotations beyond a reliable appended feedback page;
- Google Classroom/Drive/PowerSchool integration;
- automated plagiarism/AI detection;
- full app-level encryption claims;
- multi-device grading-vault sync;
- analytics on protected demographic or accommodation data.

## Acceptance

- `[GM-A01]` More contains a clear Grading Machine launch under Teaching Tools; no new canonical room is introduced. `pending`
- `[GM-A02]` Creating/opening a batch writes only to the separate Grading Vault, never canonical `state`. `pending`
- `[GM-A03]` Backup, import/export, snapshots, sync, Library, typed search, Council, and contextual AI omit every grading-vault record. `pending`
- `[GM-A04]` Session-only is the default; persistent retention requires an explicit choice and is visibly labeled. `pending`
- `[GM-A05]` Uploading a supported local text file creates a random token and preserves source hash without deriving the token from the filename. `pending`
- `[GM-A06]` Rubric point totals and criterion IDs are validated before grading can start. `pending`
- `[GM-A07]` Synthetic grading returns only schema-valid criterion proposals, evidence, feedback, flags, and review state. `pending`
- `[GM-A08]` All arithmetic, rounding, percent, and letter-grade conversion are deterministic local functions. `pending`
- `[GM-A09]` A proposal cannot be exported as final until Kevin explicitly finalizes it. `pending`
- `[GM-A10]` Score overrides preserve the proposal, record a local reason, and offer bounded Undo before final export. `pending`
- `[GM-A11]` CSV output is protected against spreadsheet formula injection and reconciles totals/status counts. `pending`
- `[GM-A12]` Generated feedback is a new artifact; the original file/hash remains unchanged. `pending`
- `[GM-A13]` Clear/delete removes all batch blobs, mappings, results, artifacts, and queue state; confirmation reveals no student content. `pending`
- `[GM-A14]` Search/inspection of canonical state, backups, operation receipts, console output, and logs finds no synthetic student names, submission text, scores, or feedback. `pending`
- `[GM-A15]` Any attempt to send an original/identified grading record through the existing Fabric is blocked before transport and makes zero provider calls. `pending`
- `[GM-A16]` The workspace remains usable when the relay and Grading Bridge are unavailable. `pending`
- `[GM-B01]` Bridge binds only to loopback and rejects a non-allowlisted origin. `pending`
- `[GM-B02]` PDF/DOCX/image parsing returns bounded text plus stable evidence locations or an explicit unreadable state. `pending`
- `[GM-B03]` Traversal, archive bomb, executable, macro, corrupt, password-protected, and oversized fixtures fail safely. `pending`
- `[GM-B04]` Local-model outputs pass the same schema and validators as synthetic outputs. `pending`
- `[GM-B05]` Feedback rendering never overwrites the original and returns a deterministic versioned filename. `pending`
- `[GM-B06]` Session deletion removes bridge temporary data and returns content-free proof. `pending`

Each item ends as `pending`, `pass`, `fail`, or `waived`; a waiver requires a reason and does not become a pass.

## Verification contract

### Focused automated checks

- new Grading Machine, vault, export, and bridge suites;
- privacy/transport fixtures from `04_GRADING_PRIVACY_AND_QA_TEST_MATRIX.md`;
- schema validation against `03_GRADING_PROVIDER_OUTPUT.schema.json`;
- source-hash/original-preservation checks;
- CSV injection corpus;
- prompt-injection and invented-evidence corpus;
- zero-provider-call spies for all blocked data paths.

### Full gate

- `node tools/doctor.js`
- `node tools/scan-secret-values.js`
- `node --check` for changed JavaScript
- ES5 contraband scan for the `index.html` script
- every pre-existing app and relay suite
- credential ceremony and provider probe self-tests
- bridge unit/integration tests with network disabled
- aggregate `sh test/run.sh`; if it still stalls, preserve the exact point and separately report the individually passing suites rather than claiming aggregate success.

### Manual surfaces/viewports

- desktop: intake, rubric, queue, review, export, delete;
- mobile: readable status/review access, but file-heavy batch work may be desktop-recommended;
- offline reload;
- bridge unavailable/reconnect;
- empty, one-file, mixed-format, and 30-file synthetic batches;
- keyboard navigation and visible focus;
- dark/light theme;
- long rubric, long filename, Unicode, and malformed file names.

### Evidence required

- exact changed files;
- packet fingerprint quoted in the final report;
- test commands and unedited results;
- screenshots using synthetic data only;
- proof canonical backup/sync/state omit vault data;
- proof blocked grading data makes zero provider calls;
- proof originals remain byte-identical;
- known limitations and failed attempts preserved.

### Which results can be verified locally

All Phase A/B behavior, schema, vault isolation, parsing, export, local-model mocks, zero-network tests, and UI behavior.

### Which results can only be collaborator-reported

Real-device/browser storage quotas, local-model quality on Kevin's machine, district authorization, provider-account/ZDR status, live provider output quality, and any future gradebook integration.

Returned work must quote the packet fingerprint. Reported success is not local proof. Preserve failed attempts instead of overwriting them.

## Authority gates

- Schema v40 changes are excluded unless the implementer proves a canonical-state change is unavoidable and stops for approval.
- Deployment, push, provider settings, secrets, model activation, paid use, and outward actions are excluded.
- Real student data is excluded from development and validation until Kevin and the district authorize a controlled local pilot.
- A future remote grading packet must be a separate work packet with an explicit district/privacy gate, strict Groq ZDR-only policy, and zero-fallback tests.
