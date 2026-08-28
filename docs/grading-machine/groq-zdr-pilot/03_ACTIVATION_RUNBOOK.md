# Activation runbook — authority gate, not current permission

Packet fingerprint: `grading-groq-zdr-pilot-v1-f85f024dfaa65e676a29`

This runbook describes a future fixed synthetic probe. It does not authorize it. The completed v0.64 candidate must first pass every credentialless gate and Kevin must then give separate just-in-time approval.

## Preactivation evidence required

1. Doctor, secret scan, syntax, ES5/contraband, focused pilot suites, all pre-existing app/relay suites, credential-ceremony self-tests, provider-probe self-tests, aggregate runner, and v40 evolution gates pass at the exact candidate commit.
2. Browser inspection confirms the Pilot Lab is inactive, synthetic-only, has no send control, works offline, and shows content-free capsule facts only.
3. The acceptance ledger leaves GP-G01 and GP-G02 gated; neither is counted as pass.
4. Diff inspection confirms `FABRIC_DENIED_PRIVACY`, youth-sensitive denial, `allowPaid=false`, canonical state allowlists, and the sealed provider policy were not weakened.

## Kevin-authorized ceremony

Kevin must not paste a key into chat. Any key remains only in the existing ignored/silent server-side ceremony and its value is never read, printed, echoed, logged, screenshot, diffed, hashed, persisted, synced, exported, or returned.

After authorization, verify only content-free account facts: exact Groq model, no-payment/free eligibility, ZDR account confirmation, daily ceiling/headroom, policy timestamp, and ledger availability. Then enable the two dedicated pilot flags only in the approved environment. Do not broaden the generic fabric route or enable fallback.

Run exactly one fixed built-in synthetic capsule. Inspect the outbound body for absence of identity, filename, course/hour, assignment metadata, accommodations, vault token, official grade, finalization, and original bytes. Verify exact-schema response, evidence match, proposal-only language, content-free quota/circuit state, and zero retained grading content. Disable the pilot flags immediately if any fact is unknown, stale, malformed, billed, retained, or inconsistent.

The local-only command is `node tools/probe-grading-groq-pilot.js --redacted --zdr-confirmed`. The explicit ZDR flag is a just-in-time assertion about the account behind the locally entered key; do not run it unless Kevin confirms that external fact. The tool reads only the ignored mode-600 local store, applies the Groq/free/ZDR/pilot flags ephemerally in one process, binds an in-memory relay to `127.0.0.1`, permits exactly one HTTPS destination and one provider call, prints a content-free receipt, clears memory, and exits. It never modifies `.dev.vars`, the provider allowlist, Worker settings, or production.

## Stop after the probe

A passing synthetic probe does not authorize real educational records. It only converts GP-G01 from an external gate to evidence about one synthetic request at one account/model/policy moment. GP-G02 remains blocked until a new privacy packet defines de-identification assurance, institutional policy, consent/authority, retention/deletion proof, incident response, sampling/calibration, and an explicit real-data release decision.

The 2026-08-27 authorization was consumed by one failed closed probe. See `04_LIVE_PROBE_RECEIPT.md`. Do not rerun the command under that authorization. A future attempt requires new just-in-time authority and must preserve the new content-free HTTP/route/provider failure classification.
