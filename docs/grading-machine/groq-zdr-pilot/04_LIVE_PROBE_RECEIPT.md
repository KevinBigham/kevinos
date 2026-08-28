# Fixed synthetic Groq ZDR probe receipt

Grading Machine foundation fingerprint: `grading-machine-v1-a8b2826f7b93a83d7656`

Pilot packet fingerprint: `grading-groq-zdr-pilot-v1-f85f024dfaa65e676a29`

Date: 2026-08-27 America/Chicago

## Authority and account gate

Kevin authorized one fixed synthetic Groq ZDR probe and prohibited real student data, deployment, push, provider-policy change, and production activation. Kevin then supplied a screenshot of the Groq Personal organization Data Controls page showing `Global ZDR` as `Enabled - API specific Settings are overridden`. No credential value or provider response content was captured in this receipt.

## Exact command

```sh
node tools/probe-grading-groq-pilot.js --redacted --zdr-confirmed
```

## Unedited content-free result

```text
KevinOS grading Groq pilot probe — REDACTED
{
  "packetFingerprint": "grading-groq-zdr-pilot-v1-f85f024dfaa65e676a29",
  "result": "FAIL",
  "syntheticOnly": true,
  "provider": "NOT_CONFIRMED",
  "exactModel": "",
  "schema": "NOT_RUN",
  "privacy": "NOT_RUN",
  "businessRules": "NOT_RUN",
  "proposalStatus": "NOT_RETURNED",
  "criterionCount": 0,
  "evidenceCount": 0,
  "fallbackHops": 0,
  "providerCalls": 1,
  "responseContentStored": false,
  "posted": false,
  "finalized": false,
  "usage": {
    "inputTokens": 0,
    "outputTokens": 0,
    "totalTokens": 0
  }
}
```

Process exit code: `1`.

## Truth and stop condition

The one authorized provider call was consumed. It returned no accepted proposal and did not reach schema, privacy, or business-rule validation. There was no fallback, retry, stored response content, grade posting, or finalization. The first probe implementation discarded the relay's already-content-free failure classification, so the exact transport/provider/validation cause cannot be recovered from this run. The diagnostic receipt is now hardened to retain only HTTP status, route code, and provider error code on any future separately authorized attempt. This improvement was verified locally and was not used to make another provider call.

GP-G01 is `fail`. Do not rerun the live probe without new just-in-time authorization. GP-G02 remains `pending / BLOCKED-AUTHORITY`; no real educational record is eligible.
