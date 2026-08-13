# KevinOS Free AI Provider Research and Routing Decision

**Date verified:** 2026-08-12
**Mission ID:** `kevinos-personalization-ai-fabric-v40-2026-08-12`
**Purpose:** turn the proposed free-API stack into a current, provider-neutral, privacy-safe implementation contract.

## Executive decision

KevinOS should not be built around one vendor, one model name, or one assumed free quota. It should gain a **server-side AI Provider Fabric** that can use several providers while keeping the local-first app useful with every provider disabled.

The recommended operating stack is:

1. **Groq** as the primary fast free worker lane.
2. **Gemini** as the preferred intelligence and multimodal lane only when the selected model is verified eligible under Kevin's current zero-dollar account settings.
3. **Mistral** as the second-opinion, coding, and alternate reasoning lane through Free Mode, with live account limits discovered rather than assumed.
4. **Cloudflare Workers AI** as the edge-native lane and provider-hosting infrastructure, guarded by a conservative daily Neuron budget.
5. **Cohere, OpenRouter, SambaNova, and NVIDIA NIM** as bounded laboratory, specialist, or emergency lanes with stricter usage classes.

The router must be capable of using the named models Kevin requested, but **must not assume that any model is free forever**. Provider model catalogs, quotas, terms, and deprecations change. Every provider gets a capability registry, lifecycle metadata, quota policy, privacy class, and live health state.

## Corrections to the supplied assumptions

The supplied stack is directionally strong, but two claims are unsafe to encode as permanent facts:

- Google currently lists standard `gemini-3.6-flash` input/output as free of charge on its Free Tier as well as publishing paid-tier prices. The app may prefer it, but zero-dollar mode may call it only when Kevin's account/model eligibility has been explicitly verified; a different current free-eligible Flash-family model may still be required by account or region.
- Mistral officially documents **Free Mode with no credit card required**, but current official material does not guarantee one universal `$10/month` allowance for every account. Limits are account- and service-dependent and must be read from the console/headers or treated conservatively.

These corrections do not weaken the plan. They make the plan resilient to changing provider terms.

## Governing rules

### 1. Zero dollars means a hard execution gate

- `AI_ALLOW_PAID=false` is the default and release requirement.
- A request cannot leave KevinOS unless the selected route is classified `FREE_VERIFIED` for the current account/session or is an explicitly approved local/mock route.
- Unknown price status means **blocked**, not “probably free.”
- Automatic upgrades, credit purchases, billing enrollment, and paid fallbacks are prohibited.
- Free-tier exhaustion returns a calm local fallback or queues the proposal for later. It never spills into paid usage.

### 2. Keys are server-side secrets only

- No provider key may appear in `index.html`, app state, localStorage, backups, sync, exports, screenshots, logs, patches, hashes, or mission packets.
- Browser code calls only the KevinOS relay.
- Local development secrets use ignored `.dev.vars`/environment files.
- Deployed secrets use Cloudflare secrets only after the final credential ceremony and only with Kevin's direct participation.
- The system may report `configured`, `missing`, `verified`, `rate-limited`, or `revoked`; it may never display the secret value or meaningful prefix.

### 3. Privacy routing overrides model quality

The provider fabric must classify every outbound packet before routing:

| Data class | Example | Free external provider policy |
| --- | --- | --- |
| `PUBLIC` | published website copy, public repo text | allowed within provider terms |
| `SANITIZED` | synthetic fixtures, de-identified templates | allowed within provider terms |
| `PERSONAL` | Kevin's ordinary private planning | only through explicitly enabled providers and visible manifest |
| `WORK_INTERNAL` | unpublished school/team/studio operations | default deny on free providers; explicit narrow approval required |
| `YOUTH_SENSITIVE` | student/athlete names, eligibility, parent communication, performance/medical context | always blocked from the free-provider fabric |
| `FINANCIAL_SENSITIVE` | account numbers, tax material, investment account data | always blocked from the free-provider fabric |
| `SECRET` | API keys, OAuth tokens, passwords, private keys | always blocked everywhere |

Even when a provider offers favorable retention controls, KevinOS must not use a free third-party inference service for youth-sensitive, financial-sensitive, secret, or private parent/student material.

### 4. AI remains proposal-only

Every AI result is a draft or proposal with:

- provider;
- exact model returned;
- capability lane;
- prompt/template version;
- packet fingerprint;
- privacy decision;
- redactions;
- timestamp;
- token/usage metadata when available;
- fallback chain;
- proof/validation result.

AI never silently sends, schedules, publishes, changes a project status, moves money, creates a live calendar event, or accepts its own output as proof.

## Provider matrix

| Provider | Mission role | Preferred starting targets | Current free facts to encode | Required guardrails |
| --- | --- | --- | --- | --- |
| Google Gemini | intelligence, long context, multimodal analysis, difficult synthesis | prefer `gemini-3.6-flash` only when free eligibility is verified; otherwise choose a current free-eligible Flash-family target | model catalog and deprecations are queryable; free-tier content may be used to improve Google products; pricing differs by model | server-side only; public/sanitized by default; price eligibility gate; model discovery; deprecation monitor |
| Groq | primary low-latency worker, extraction, JSON, routing, summaries, fast code assistance | `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3.6-27b` | current free limits include 30 RPM / 1,000 RPD / 200,000 TPD for these models; rate headers are returned; ZDR is available | enable ZDR during credential ceremony; parse headers; bounded retries; no sensitive school/athlete data |
| Mistral | coding, independent second opinion, alternate reasoning, economy lane | current `mistral-medium-latest` / Medium 3.5 and `mistral-small-latest` / Small 4; discover current code-capable model | Free Mode needs no card; limits apply and vary; old Devstral/Codestral recommendations may deprecate | model discovery; no fixed-credit assumption; account quota receipt; rotation/expiry support |
| Cloudflare Workers AI | edge-native inference, embeddings/rerank, low-friction relay integration | select current `@cf/` models by capability and Neuron cost | 10,000 Neurons/day free allocation; usage resets daily; exceeding free plan fails, while paid plans can incur overage | local conservative ceiling (default 8,500–9,000); no paid overage; AI binding; no external key in browser |
| Cohere | RAG/rerank/coding laboratory and second opinion | Command A+, North Mini Code, embeddings/rerank where available | evaluation keys are free/limited; newer chat models typically 20 RPM; trial usage is 1,000 calls/month | `EVALUATION_ONLY`; synthetic/public packets; not an automatic production fallback |
| OpenRouter | emergency model buffet and compatibility laboratory | `openrouter/free` or a currently available `:free` model | free account is 50 requests/day; free roster and latency vary; free router may choose different models | `EMERGENCY_ONLY`; pin required capabilities; record actual model; no retry storms; public/synthetic only by default |
| SambaNova | occasional large-model comparison | current free production models such as GPT-OSS 120B/DeepSeek/Llama where listed | current free tier commonly 20 RPM, 20 RPD, 200,000 TPD; preview models may disappear | `LAB_ONLY`; reserve for large comparison prompts; explicit daily budget |
| NVIDIA NIM | retrieval/rerank/model sampler and prototype laboratory | current hosted LLM, embedding, and rerank endpoints | developer-program hosted endpoints are free for prototyping/research/development/testing; production requires enterprise licensing | `PROTOTYPE_ONLY`; synthetic/public inputs; never automatic production route |

## Capability lanes

The app routes by capability, not provider prestige:

| Lane | Default order | Purpose |
| --- | --- | --- |
| `FAST_STRUCTURED` | Groq small/fast → Mistral Small → Cloudflare Workers AI | classification, extraction, tags, JSON, short summaries |
| `DEEP_SYNTHESIS` | verified-free Gemini → Mistral Medium → Groq 120B | long project synthesis, planning, difficult user questions |
| `MULTIMODAL` | verified-free Gemini → current capable Workers AI/Groq route | screenshots, images, PDFs already converted to safe bounded inputs |
| `CODE_SECOND_OPINION` | Mistral Medium/current code-capable model → Groq 120B → Cohere North Mini Code lab | code review, test ideas, independent plan checks |
| `RETRIEVAL_EMBED` | local deterministic search first → Workers AI embedding → Cohere/NVIDIA lab | optional semantic retrieval without replacing local search |
| `RERANK` | local deterministic ordering first → Workers AI/Cohere/NVIDIA lab | bounded experiment only |
| `EMERGENCY_FREE` | OpenRouter free → SambaNova → NVIDIA prototype | manual/synthetic fallback after primary free pools are exhausted |

No route may silently cross from `PUBLIC/SANITIZED` eligibility into a provider with a weaker data or usage policy.

## KevinOS feature opportunities

### Immediate high-value features

- Convert pasted public/sanitized text into proposed tasks, commitments, people links, projects, or events.
- Draft a Resume Capsule from approved project evidence.
- Draft Weekly Review summaries and identify missing next actions.
- Classify capture into Kevin's role/project/commitment types.
- Generate editable role playbooks, practice structures, teaching explanations, and publishing checklists from non-sensitive inputs.
- Produce independent code-plan or mission-packet reviews for Studio work.
- Analyze public screenshots/images and de-identified documents.
- Suggest knowledge-to-action promotions.

### Features that remain prohibited or local-only

- Sending student, athlete, parent, grade, eligibility, medical, financial-account, or secret material to the free-provider fabric.
- Autonomous email/calendar/publishing actions.
- Silent prompt logging.
- Provider-generated priority scores.
- Model-generated “proof” of code correctness.
- Automatic changes to provider routing based only on a model judge.

## Continuous enhancement system

KevinOS should improve its AI use without becoming an autonomous experiment platform.

### Synthetic golden set

Create synthetic Kevin-shaped fixtures for:

- personal-finance teaching explanation;
- swim-practice structure with exact intervals and coach cues but fake swimmers;
- BSWildcats public announcement;
- project Resume Capsule;
- commitment extraction from a fictional email;
- project planning/code-review task;
- privacy redaction challenge;
- structured-output recovery.

### Evaluator stack

1. Deterministic schema and forbidden-data validators.
2. Exact/partial expected-field checks.
3. Latency, token, quota, error, and fallback receipts.
4. Kevin's optional thumbs-up/down and reason.
5. Optional cross-model judge only on synthetic/public fixtures.
6. Human approval before any route/prompt/model becomes the new default.

### Improvement loop

- run the golden set manually or on a local explicit schedule;
- compare current prompt/model route against a candidate;
- record results locally without prompt/response content unless Kevin explicitly saves a fixture;
- generate a recommendation, not an automatic switch;
- require Kevin approval for routing changes;
- preserve the last known-good route and instant rollback.

## Model lifecycle policy

- Never trust a model slug forever.
- Discover provider catalogs where APIs support it.
- Keep aliases such as `groq-fast`, `gemini-intelligence`, and `mistral-code-review` separate from exact model IDs.
- Record exact model returned on each receipt.
- Warn when a model is deprecated, missing, no longer free, or loses a required capability.
- Fallback must be capability-, privacy-, and price-compatible.
- A changing free-model roster must never break core KevinOS use.

## Official sources

- Google Gemini latest models: https://ai.google.dev/gemini-api/docs/latest-model
- Google Gemini pricing/data-use matrix: https://ai.google.dev/gemini-api/docs/pricing
- Google Gemini Models API: https://ai.google.dev/api/models
- Google Gemini API-key guidance: https://ai.google.dev/gemini-api/docs/generate-content/api-key
- Groq rate limits: https://console.groq.com/docs/rate-limits
- Groq data retention/ZDR: https://console.groq.com/docs/your-data
- Groq key security: https://console.groq.com/docs/production-readiness/security-onboarding
- Mistral Free Mode/key setup: https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key
- Mistral Medium 3.5: https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04
- Mistral Small 4: https://docs.mistral.ai/models/model-cards/mistral-small-4-0-26-03
- Cloudflare Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Cloudflare Workers AI binding: https://developers.cloudflare.com/workers-ai/configuration/bindings/
- Cloudflare secret handling: https://developers.cloudflare.com/workers/configuration/secrets/
- Cohere key/rate limits: https://docs.cohere.com/v2/docs/rate-limits
- Cohere North Mini Code: https://docs.cohere.com/docs/north-mini-code-1.0
- Cohere Command A+: https://docs.cohere.com/docs/command-a-plus
- OpenRouter free limits: https://openrouter.ai/docs/faq
- OpenRouter free router: https://openrouter.ai/docs/guides/routing/routers/free-router
- SambaNova free-tier limits: https://docs.sambanova.ai/docs/en/models/rate-limits
- NVIDIA NIM developer access: https://docs.api.nvidia.com/nim/docs/run-anywhere
- NVIDIA LLM APIs: https://docs.api.nvidia.com/nim/reference/llm-apis
- NVIDIA retrieval APIs: https://docs.api.nvidia.com/nim/reference/retrieval-apis

## Final research judgment

The strongest design is not “Gemini plus fallbacks.” It is a **policy-controlled, provider-neutral relay** that treats free quotas as volatile capabilities, keeps secrets out of the browser, refuses sensitive data, preserves offline use, and continuously evaluates routes on synthetic Kevin-shaped work.

That architecture lets Kevin harvest free intelligence without making KevinOS dependent on free-provider generosity or exposing the people he is responsible for.
