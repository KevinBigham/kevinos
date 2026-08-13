# KevinOS Credentials-Last Activation Runbook

**Mission:** KevinOS v40 Personalization + AI Provider Fabric
**Rule:** this runbook is invoked only after every credentialless implementation and preactivation gate has passed.

## Why credentials are last

API signup, key creation, account controls, and live calls are external gates. They must not delay architecture, tests, UI, privacy enforcement, mocks, fallbacks, quota handling, documentation, or offline behavior.

Codex must complete all safe local work first. It may ask Kevin for credentials only when `sh tools/run-evolution-gates.sh preactivation` passes.

## The only permitted final interruption

At K10, Codex may send Kevin one concise request to complete the credential ceremony. That request must:

- state that all credentialless work is complete;
- link/list official provider signup/key pages;
- tell Kevin which keys are core and which are optional;
- tell Kevin **not to paste any key into chat**;
- instruct Kevin to run the repository's silent local setup script in his own terminal;
- wait only because this is a genuinely external secret-creation action;
- resume verification after Kevin confirms the script completed.

Codex must not ask any earlier key question.

## Core activation order

1. **Groq** — fast worker lane.
2. **Mistral** — second-opinion/coding lane.
3. **Gemini** — intelligence/multimodal lane, but only with a currently verified free-eligible model.
4. **Cloudflare Workers AI binding** — edge lane; no provider API key, but account/binding authorization may be required.

## Optional laboratory order

5. Cohere.
6. OpenRouter.
7. SambaNova.
8. NVIDIA NIM.

Optional providers do not block the production-quality local fabric. They remain disabled until configured.

Current official setup links are maintained in `docs/AI_PROVIDER_VERIFICATION_2026-08-13.md`. Re-open those official pages at the ceremony; do not use copied keys, third-party tutorials, or stale quota claims.

## Required secret names

```text
GEMINI_API_KEY
GROQ_API_KEY
MISTRAL_API_KEY
COHERE_API_KEY
OPENROUTER_API_KEY
SAMBANOVA_API_KEY
NVIDIA_API_KEY
```

Workers AI uses the `AI` binding rather than another model API key.

## Secure local entry design

Codex must build a script equivalent to:

```sh
sh tools/credential-ceremony.sh
```

Requirements:

- interactive terminal only;
- `read -s`/silent input;
- never accept key values as CLI arguments;
- never echo values;
- never include values in shell history;
- write only to ignored `relay/.dev.vars` or use process environment;
- preserve any unrelated existing secret names without displaying values;
- create restrictive permissions (`chmod 600`);
- use an ignored temp/backup path;
- validate only safe structural properties, not print prefixes;
- support skip, replace, rotate, and revoke instructions;
- make optional providers skippable;
- do not contact a provider until Kevin confirms the entry step.

Codex itself must never open, cat, diff, checksum, snapshot, index, or attach the secret file.

## Redacted verification

Build a verifier equivalent to:

```sh
node tools/verify-ai-provider-config.js --redacted
```

Permitted output:

```text
Groq       CONFIGURED / VERIFIED / ZDR-CONFIRMED
Mistral    CONFIGURED / VERIFIED / FREE-MODE-CONFIRMED
Gemini     CONFIGURED / VERIFIED / MODEL-FREE-ELIGIBILITY-CONFIRMED
Workers AI BINDING-PRESENT / DAILY-CAP-CONFIGURED
Cohere     NOT CONFIGURED (optional)
```

Prohibited output:

- key values;
- key prefixes/suffixes;
- key length if it materially fingerprints the key;
- authorization headers;
- full provider response bodies containing user data;
- `.dev.vars` contents;
- environment dumps.

## Minimal live probe contract

Each configured provider gets at most one small synthetic probe initially.

Example input:

```text
Return JSON with exactly {"status":"ok","number":7}.
```

The verifier records only:

- HTTP/result category;
- exact model returned;
- structured-output validity;
- latency;
- token/usage metadata;
- rate-limit/quota headers;
- free/paid eligibility confirmation method;
- timestamp.

The response content is discarded after validation.

The repository implements this contract with a strict single-provider, loopback-only probe:

```sh
node tools/probe-ai-provider.js --self-test
node tools/probe-ai-provider.js --redacted --provider groq
```

The live command is run only after local Wrangler is serving the relay, the exact model is free-verified for Kevin's account, and the route is locally enabled. It accepts no key argument, cannot target a non-loopback relay, disables fallback spillover for the probe, and emits only the bounded receipt fields above.

## Provider account checklist

### Groq

- Create the key in Groq Console.
- Enable Zero Data Retention in Data Controls before marking activation verified.
- Keep batch/fine-tuning disabled for this free provider lane.
- Confirm current free limits in the console.

### Mistral

- Activate Studio Free Mode; no credit card should be required.
- Create a key with an expiration date.
- Confirm current Free Mode limits in the console.
- Use live model discovery; do not assume a fixed monthly dollar credit.

### Gemini

- Create/restrict an auth key for the Gemini API.
- Confirm which current model is actually eligible on Kevin's free tier.
- Display the free-tier data-use warning.
- Use only public/sanitized packets by default.
- Do not enable billing merely to make the preferred model work.

### Cloudflare Workers AI

- Configure the `AI` binding.
- Set a conservative local daily cap below 10,000 Neurons.
- Remember that local Workers AI development still consumes account usage.
- A remote binding/secret/deploy change remains an outward action. Do not perform it without Kevin's explicit authorization at that moment.

### Cohere

- Create an evaluation key.
- Mark provider `EVALUATION_ONLY`.
- Keep automatic production routing disabled.

### OpenRouter

- Create a free key without adding credits.
- Read the current account/free-model limits from the key endpoint and console; do not encode a historical request count as permanent truth.
- Keep the app ceiling at 40 or below the smaller live account limit.
- Keep `openrouter/free` in manual/emergency mode.

### SambaNova

- Create a no-payment-method free-tier key.
- Keep the provider's daily app ceiling at or below the live free-tier RPD.
- Treat preview models as temporary.

### NVIDIA NIM

- Join/use the NVIDIA Developer program and create the API key.
- Mark `PROTOTYPE_ONLY`.
- Keep it out of production routing.

## Remote secret and deployment rule

The final credential ceremony authorizes **secure local key entry and local synthetic verification**. It does not silently authorize deployment.

Cloudflare documentation notes that `wrangler secret put` creates and deploys a Worker version immediately. Therefore:

- do not run `wrangler secret put` automatically;
- do not deploy automatically;
- prepare exact redacted commands/instructions;
- request separate explicit Kevin authorization immediately before any remote secret mutation or deploy;
- prefer `wrangler versions secret put` only when Kevin explicitly wants a non-deployed version and the installed Wrangler supports it;
- preserve rollback instructions.

## Rotation and incident response

For every provider, document:

- create replacement key;
- enter replacement silently;
- verify synthetic probe;
- revoke old key in provider console;
- confirm old key no longer works without logging it;
- clear local secret backup files;
- check repository/log/output secret scan;
- record only the rotation date and provider status.

Local dry-run coverage is part of the ordinary suite:

```sh
sh tools/credential-ceremony.sh --self-test
node tools/probe-ai-provider.js --self-test
```

For a live rotation, create the replacement in the official console, rerun `sh tools/credential-ceremony.sh`, choose update/rotate for only that provider, run redacted presence verification and one strict synthetic probe, then revoke the old key in the provider console. To revoke locally, rerun the ceremony and choose `x`; the provider remains disabled until a replacement is separately free-verified and enabled. If exposure is suspected, revoke in the provider console first.

If a key is ever pasted into chat, source, an issue, or a log, treat it as compromised and revoke it immediately.

## Final activation outcomes

A provider ends as one of:

- `VERIFIED_FREE_ACTIVE`;
- `CONFIGURED_DISABLED`;
- `KEY_MISSING_OPTIONAL`;
- `BLOCKED_ACCOUNT_OR_REGION`;
- `BLOCKED_FREE_ELIGIBILITY`;
- `REVOKED`.

No provider is labeled active merely because a key exists.

## Final gate

After Kevin completes the secure entry step, Codex must:

1. run redacted presence verification;
2. run minimal synthetic probes;
3. confirm privacy firewall still blocks restricted classes before transport;
4. confirm paid routes remain disabled;
5. confirm no key value is present in source/output/patch/log/export/sync;
6. update provider activation receipts;
7. rerun the full final gates;
8. finish `FINAL_KEVINOS_V40_HANDOFF.md`.
