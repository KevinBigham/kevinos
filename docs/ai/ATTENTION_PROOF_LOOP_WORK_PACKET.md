# Attention Proof Loop work packet

## Outcome

Ship KevinOS v0.51 candidate with opt-in, content-minimized attention evidence; deterministic Today/Plan & Review integration; local AI workflow outcome summaries; and safe fingerprinted Mission Capsules.

## Current evidence

Luna's `4f1712c` foundation added the device-local state and initial pure functions, but omitted lifecycle coverage, AI workflow grouping, Mission Capsule editor fields, the focused suite from `test/run.sh`, and browser verification.

## Scope

- Allowed: `index.html`, `sw.js`, focused app tests/harness/runner, and canonical mission docs.
- Forbidden: relay resources, secrets, GATE-76, dependencies, frameworks, autonomous actions, deployment, and direct changes to `main`.
- Data/schema: compatible device-local top-level `attention`; optional nested `pending`/`builds` fields; schema remains v39.
- Privacy: raw attention receipts never enter backup, sync, relay, AI context, or Mission Capsules.

## Acceptance

- `node test/attention-proof.test.js`
- `node tools/doctor.js`
- `sh test/run.sh`
- Chromium at 320x568, 390x844, 430x932, 768x1024, and 1440x900 with no same-page overflow, significant console messages, or offline-reload failure.

## Authority gates

Push the focused branch and open a draft pull request. Do not merge, deploy, alter secrets, or cross GATE-76.
