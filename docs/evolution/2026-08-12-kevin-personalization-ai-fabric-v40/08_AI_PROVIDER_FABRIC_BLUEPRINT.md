# KevinOS v40 AI Provider Fabric Blueprint

**Date:** 2026-08-12
**Mission ID:** `kevinos-personalization-ai-fabric-v40-2026-08-12`
**Status:** implementation contract; not yet implemented at mission handoff.

## North-star contract

The AI Provider Fabric exists to make KevinOS more useful while preserving this invariant:

> KevinOS remains calm, local-first, recoverable, and useful with every provider disabled and every API key absent.

## Architecture boundary

```text
index.html (no secrets)
    |
    | authenticated KevinOS relay request
    v
relay/worker.js
    |
    +-- policy firewall
    +-- capability router
    +-- provider adapters
    +-- quota/circuit breaker
    +-- response normalizer/validator
    +-- content-free usage receipt
    |
    +--> Gemini
    +--> Groq
    +--> Mistral
    +--> Workers AI binding
    +--> Cohere (lab)
    +--> OpenRouter (emergency/lab)
    +--> SambaNova (lab)
    +--> NVIDIA NIM (prototype)
```

The browser must never call a provider directly.

## No new dependency requirement

- Keep `index.html` dependency-free ES5 style.
- Keep `relay/worker.js` modern module JavaScript.
- Use native `fetch`, Web APIs, and small local adapter functions.
- Do not add an AI SDK, provider package, orchestration framework, database, queue service, or client-side model library merely to normalize HTTP calls.
- Add a dependency only if a current capability cannot be implemented safely with native APIs and the mission's Lab Budget approves it. Default answer is no.

## Provider adapter contract

Every provider adapter exposes the same conceptual interface:

```text
getProviderDescriptor()
listModels(context)
normalizeCapabilities(rawModel)
healthCheck(context)
generate(request, context)
stream(request, context)         optional
embed(request, context)          optional
rerank(request, context)         optional
normalizeUsage(response)
classifyError(error)
```

A normalized provider descriptor includes:

```json
{
  "id": "groq",
  "label": "Groq",
  "usageClass": "PRIMARY_FREE",
  "secretName": "GROQ_API_KEY",
  "serverOnly": true,
  "productionEligible": true,
  "defaultEnabled": false,
  "dataPolicy": {
    "maxClass": "SANITIZED",
    "zdrRequired": true
  },
  "capabilities": ["text", "structured", "tools"],
  "models": [],
  "lastCatalogRefreshAt": null,
  "lastHealthAt": null,
  "status": "KEY_MISSING"
}
```

Do not persist secret values or provider responses in this descriptor.

## Model descriptor contract

```json
{
  "providerId": "groq",
  "modelId": "openai/gpt-oss-20b",
  "alias": "groq-fast",
  "label": "GPT-OSS 20B on Groq",
  "capabilities": ["text", "structured", "tools"],
  "contextWindow": null,
  "maxOutput": null,
  "lifecycle": "ACTIVE",
  "priceClass": "FREE_VERIFIED",
  "usageClass": "PRIMARY_FREE",
  "allowedPrivacyClasses": ["PUBLIC", "SANITIZED"],
  "supportsStreaming": true,
  "supportsJsonSchema": true,
  "lastVerifiedAt": null,
  "source": "provider-catalog"
}
```

Exact model IDs are runtime configuration. Product code uses stable lane aliases.

## Routing request contract

```json
{
  "requestId": "...",
  "feature": "resume-capsule-draft",
  "lane": "DEEP_SYNTHESIS",
  "requiredCapabilities": ["text", "structured"],
  "privacyClass": "SANITIZED",
  "packetFingerprint": "sha256:...",
  "promptVersion": "resume-capsule-v1",
  "maxInputChars": 30000,
  "maxOutputTokens": 2000,
  "timeoutMs": 25000,
  "allowFallback": true,
  "allowPaid": false,
  "candidateAliases": ["gemini-intelligence", "mistral-reasoning", "groq-deep"]
}
```

The relay rejects requests without an explicit feature, lane, privacy class, packet fingerprint, bounds, and approval state.

## Policy firewall

Order of enforcement:

1. Authenticate KevinOS relay session.
2. Validate route and payload schema.
3. Classify/confirm privacy.
4. Scan for forbidden secret patterns and prohibited record classes.
5. Enforce visible AI-manifest approval.
6. Enforce provider usage/production class.
7. Enforce zero-dollar eligibility.
8. Enforce per-request size/token/timeout bounds.
9. Select capability-compatible route.
10. Execute with circuit breaker and bounded retry.
11. Validate/normalize output.
12. Return proposal plus provenance receipt.

A failure at any step is explicit and local. No silent downgrade.

## Privacy matrix

Canonical outbound privacy order from least to most restrictive:

```text
PUBLIC < SANITIZED < PERSONAL < WORK_INTERNAL < YOUTH_SENSITIVE < FINANCIAL_SENSITIVE < SECRET
```

Rules:

- `YOUTH_SENSITIVE`, `FINANCIAL_SENSITIVE`, and `SECRET` are always denied to the free-provider fabric.
- `WORK_INTERNAL` is denied by default and requires a saved narrowly scoped consent plus a provider explicitly approved for that class. The initial v40 implementation may choose to deny it universally.
- Person notes remain separately opt-in even when their parent record is otherwise eligible.
- Redaction creates a new bounded packet; it does not mutate canonical source records.
- The UI shows exact included record IDs/fields and redaction counts before send.

## Zero-dollar budget engine

Canonical configuration defaults:

```json
{
  "allowPaid": false,
  "requireFreeVerified": true,
  "unknownPricePolicy": "BLOCK",
  "automaticCreditPurchase": false,
  "automaticBillingEnrollment": false,
  "cloudflareDailyNeuronCeiling": 8500,
  "providerConcurrency": 1,
  "maxFallbackHops": 2,
  "maxRetriesPerProvider": 1
}
```

Budget state stores content-free counters only:

- provider/model alias;
- UTC/local window;
- request count;
- input/output token totals when returned;
- Neuron estimate/actual where available;
- 429/limit headers;
- last reset time;
- circuit state;
- last success/error category.

No prompt or response content is stored in usage counters.

## Fallback algorithm

A fallback candidate is eligible only when all are true:

- provider is configured and enabled;
- key/binding is present;
- provider is healthy enough;
- exact model is active;
- required capabilities match;
- price class is `FREE_VERIFIED`;
- privacy class is allowed;
- quota remains;
- production/evaluation usage class matches the feature;
- context/output bounds fit;
- route does not violate Kevin's manual provider exclusions.

Stable selection order is deterministic and visible. Never randomly use OpenRouter unless the selected lane explicitly permits its free router.

## Circuit breaker and retry

Per provider/model:

- `CLOSED`: normal.
- `OPEN`: temporarily skipped after threshold failures/429s.
- `HALF_OPEN`: one synthetic/low-risk probe after reset.

Rules:

- obey `Retry-After` and provider rate headers;
- no more than one retry per provider by default;
- no more than two fallback hops;
- no parallel fan-out on real Kevin data;
- optional comparison fan-out is synthetic/public and user-triggered only;
- network failure never blocks core local KevinOS.

## Output envelope

```json
{
  "ok": true,
  "proposal": {},
  "provenance": {
    "providerId": "groq",
    "modelId": "openai/gpt-oss-20b",
    "routeAlias": "groq-fast",
    "promptVersion": "commitment-extract-v1",
    "packetFingerprint": "sha256:...",
    "privacyClass": "SANITIZED",
    "fallbacksAttempted": [],
    "timestamp": "..."
  },
  "validation": {
    "schema": "PASS",
    "forbiddenData": "PASS",
    "businessRules": "PASS"
  },
  "usage": {
    "inputTokens": null,
    "outputTokens": null,
    "quotaRemaining": null,
    "latencyMs": 0
  }
}
```

AI output is not code proof, factual proof, or permission to mutate canonical state.

## Provider-specific implementation notes

### Gemini

- Secret: `GEMINI_API_KEY`.
- Use server-side requests only.
- Query the Models API and preserve exact returned model metadata.
- Configure `gemini-intelligence` as a preferred alias, not a hard guarantee that `gemini-3.6-flash` is free.
- Refuse a route when zero-dollar eligibility is unknown.
- Free-tier data-use warning must be visible in the activation UI and manifest.
- Default to public/sanitized packets.

### Groq

- Secret: `GROQ_API_KEY`.
- Preferred aliases: `groq-fast` (`openai/gpt-oss-20b`), `groq-deep` (`openai/gpt-oss-120b`), `groq-qwen` (`qwen/qwen3.6-27b`).
- Parse rate-limit headers.
- Credential ceremony requires Kevin to enable ZDR before activation is marked verified.
- Do not rely on models with announced near-term retirement.

### Mistral

- Secret: `MISTRAL_API_KEY`.
- Preferred aliases discover current `mistral-medium-latest` and `mistral-small-latest` or current replacements.
- Treat coding as a capability, not a permanent `Codestral` slug.
- Free Mode status and limits are account facts recorded during activation.
- Respect key expiry/rotation.

### Cloudflare Workers AI

- No third-party provider API key; use `[ai] binding = "AI"` and `env.AI`.
- Add binding only in the relay boundary.
- Local development still accesses the Cloudflare account and consumes usage; synthetic smoke calls remain explicit.
- Default daily app ceiling is below 10,000 Neurons.
- Never allow paid-plan overage while `allowPaid=false`.

### Cohere

- Secret: `COHERE_API_KEY`.
- Default usage class `EVALUATION_ONLY`.
- North Mini Code/Command A+/Rerank/Embed are opt-in lab lanes.
- No automatic production fallback with a trial key.

### OpenRouter

- Secret: `OPENROUTER_API_KEY`.
- Default usage class `EMERGENCY_ONLY`.
- `openrouter/free` may choose a different model each request; capture actual model.
- At zero credits, budget for no more than 50 requests/day and maintain a lower app ceiling.
- Never retry randomly through the free pool repeatedly.

### SambaNova

- Secret: `SAMBANOVA_API_KEY`.
- Default usage class `LAB_ONLY`.
- App ceiling no greater than the documented free daily request cap.
- Preview models are never permanent defaults.

### NVIDIA NIM

- Secret: `NVIDIA_API_KEY`.
- Default usage class `PROTOTYPE_ONLY`.
- Use only synthetic/public development and evaluation packets.
- Production route remains disabled absent an appropriate license and explicit future decision.

## AI Provider Control Center

Add this inside Settings or Studio rather than as a new top-level room.

It shows:

- provider label/status;
- key/binding presence without value;
- usage class;
- enabled/disabled;
- allowed privacy classes;
- current exact model behind each alias;
- free eligibility status and last verification;
- quota/limit window;
- circuit state;
- ZDR/data-policy checklist;
- last synthetic health check;
- deprecation warning;
- route preview for each feature;
- activation/disable/rotate instructions.

It does not include a normal text field that stores keys in app state.

## Continuous AI Improvement Lab

### Prompt registry

Each AI feature uses a versioned prompt record:

```json
{
  "id": "commitment-extract-v1",
  "feature": "commitment-extract",
  "version": 1,
  "requiredCapabilities": ["structured"],
  "maxPrivacyClass": "SANITIZED",
  "schemaId": "CommitmentProposalV1",
  "status": "ACTIVE",
  "lastEvaluatedAt": null
}
```

### Golden fixtures

Fixtures are synthetic and stored in source control. They include expected schemas, forbidden content, and key behavioral assertions. Real Kevin records are never copied into the test corpus by default.

### Evaluation report

```json
{
  "runId": "...",
  "candidate": {"provider": "groq", "model": "...", "promptVersion": "..."},
  "fixtureCount": 8,
  "schemaPass": 8,
  "privacyPass": 8,
  "businessRulePass": 7,
  "medianLatencyMs": 0,
  "fallbackCount": 0,
  "estimatedFreeUsage": {},
  "recommendation": "KEEP_CURRENT",
  "requiresKevinApproval": true
}
```

The lab may recommend a route/prompt change. It may not apply one automatically.

## Credentialless development contract

Every adapter and route must be fully buildable and testable before keys exist:

- mock transport fixtures for success, 401, 403, 404/model missing, 408, 429, 5xx, malformed JSON, invalid schema, streaming interruption, and deprecation;
- deterministic provider catalog fixtures;
- redaction/privacy fixtures;
- quota/circuit/fallback fixtures;
- local UI provider-status fixtures;
- credential-absence behavior;
- no outbound network in default test suite.

The K9 preactivation gate requires every credentialless contract to pass before Codex may ask Kevin for a key.

## Credentials-last activation contract

1. Complete K-1 through K9.
2. Run `sh tools/run-evolution-gates.sh preactivation` and obtain PASS.
3. Confirm no secret values exist in source, logs, output, patches, backups, or screenshots.
4. Present Kevin one secure signup/activation checklist.
5. Ask Kevin to create keys and run the silent credential ceremony script locally.
6. Never ask Kevin to paste a key into chat.
7. Never inspect or print the resulting secret file.
8. Run redacted presence checks and minimal synthetic live probes.
9. Record provider status and exact model/quota response without content or secrets.
10. Keep optional providers disabled when Kevin elects not to create them.
11. Do not deploy or mutate remote Cloudflare secrets unless Kevin separately authorizes that outward action.

## Required implementation files

Codex should decide exact names after inspecting the current relay, but the final system should have clear equivalents of:

- provider registry;
- provider policy firewall;
- routing selector;
- provider adapters;
- usage/circuit state;
- prompt registry;
- synthetic eval fixtures;
- provider contract tests;
- privacy tests;
- credential ceremony script;
- redacted verifier;
- activation runbook;
- provider Control Center UI;
- local usage/evaluation receipts.

## Non-goals

- replacing deterministic Today/Promise Radar with AI;
- replacing local search with hosted RAG;
- sending all KevinOS state to a model;
- storing conversation transcripts by default;
- autonomous prompt/model changes;
- paid inference;
- a new AI framework;
- a second canonical data store;
- provider-specific UI scattered through rooms;
- cloud dependence for core use.

## Definition of done

The fabric is done when:

- every provider adapter passes mocks with no keys;
- privacy-denied packets never reach transport;
- free-price uncertainty blocks rather than bills;
- fallbacks are deterministic and policy-compatible;
- quota/circuit behavior is bounded;
- every result has provenance;
- the Control Center is useful without showing secrets;
- the app remains fully useful offline;
- all core AI features degrade gracefully;
- preactivation passes before keys are requested;
- Kevin can add keys silently at the very end;
- live probes use synthetic data and produce redacted receipts;
- no secret value appears in any user-visible or portable artifact.
