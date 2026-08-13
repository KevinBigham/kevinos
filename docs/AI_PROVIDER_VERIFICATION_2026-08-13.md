# AI Provider policy verification — 2026-08-13

This is the dated implementation snapshot for the credentialless KevinOS Provider Fabric. It is not an activation receipt. No account was created, no key was requested, no live provider was called, and no billing or credit action was taken.

> Activation addendum, 2026-08-13 11:53 UTC: after the credentialless snapshot, Kevin separately authorized deployment and bounded live verification. All requested credential names are present remotely without value exposure. One strict synthetic Workers AI call reached `@cf/meta/llama-3.3-70b-instruct-fp8-fast` after an explicit 250-Neuron estimate passed the 8,500-Neuron ceiling; the returned content failed the local `OUTPUT_SCHEMA` contract, was discarded, and triggered the bounded circuit. Production fabric allowlists remain empty.

> Core-control addendum, 2026-08-13 12:55 UTC: Kevin explicitly confirmed Groq ZDR, Mistral Free Mode, and acknowledgement of Gemini free-tier data use. Groq's nearly retired `llama-3.3-70b-versatile` default was replaced with `openai/gpt-oss-20b`. A strict post-fix Groq probe passed schema, privacy, proposal-only, exact-model, usage, and live rate-header checks in 687 ms; no response content was retained. Mistral returned `OUTPUT_SCHEMA`, and Gemini returned `MODEL_NOT_FOUND` even though its authenticated model catalog exposed `models/gemini-2.5-flash` with `generateContent`. Both remain policy-disabled. Paid routing remains false.

> Production addendum, 2026-08-13 13:02 UTC: PR #11 merged and Worker `364b59ca-7f8c-43dc-ad3d-f30c36f99760` deployed. The production enable/free allowlists contain only Groq and `groq:openai/gpt-oss-20b`; paid routing remains false. Public root/CORS/auth boundaries and the live Studio shell passed. No additional provider inference was run during deployment.

## Routing rule

A provider is routable only when all of these runtime facts are true:

- its server-side credential/binding exists;
- its provider ID is explicitly present in `AI_ENABLED_PROVIDERS`;
- the exact `provider:model` pair is explicitly present in `AI_FREE_VERIFIED_MODELS`;
- the policy snapshot is not older than 30 days;
- the selected model matches capability, privacy, usage class, quota, and circuit requirements;
- the request declares `allowPaid=false`.

Unknown price, stale policy, missing credential, missing enablement, or absent exact-model verification blocks the route. Static provider defaults are adapter shapes, not claims that a model is still free.

## Official-source snapshot

| Provider | Official fact checked on 2026-08-13 | Conservative KevinOS ruling | Official source |
|---|---|---|---|
| Gemini | Google lists `gemini-2.5-flash` as a stable model with Free Tier pricing and warns that free-tier content may be used to improve products. Kevin acknowledged that policy; his authenticated model catalog exposed the exact model, but the strict generation probe returned `MODEL_NOT_FOUND`. | `PRIMARY_FREE`; Public/Sanitized only; configured but disabled until the transport contract passes. | [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing), [models](https://ai.google.dev/gemini-api/docs/models) |
| Groq | Groq lists `openai/gpt-oss-20b` as a production model with free-plan limits and strict structured-output support. `llama-3.3-70b-versatile` is scheduled to shut down for free/developer tiers on 2026-08-16. Kevin confirmed ZDR; the exact replacement model and live account rate headers passed. | `PRIMARY_FREE`; Public/Sanitized only; production active with paid routing disabled. | [GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b), [structured outputs](https://console.groq.com/docs/structured-outputs), [deprecations](https://console.groq.com/docs/deprecations), [rate limits](https://console.groq.com/docs/rate-limits) |
| Mistral | Studio Free Mode enables API access without a credit card, with variable usage/rate limits; keys support expiry. | `PRIMARY_FREE`; exact model, account limits, Free Mode, and key expiry must be verified live. | [Free Mode and key setup](https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key) |
| Cloudflare Workers AI | The free allocation is 10,000 Neurons per day and resets at 00:00 UTC; paid overage belongs to paid Workers plans, and some named models require a paid method. | `PRIMARY_FREE`; binding only; conservative 8,500-Neuron app ceiling; exclude paid-only models and never enable paid overage for this mission. | [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [binding setup](https://developers.cloudflare.com/workers-ai/configuration/bindings/) |
| Cohere | Trial/evaluation keys are free but rate-limited; Cohere documents a 1,000-call monthly trial limit and model-specific per-minute limits. | `EVALUATION_ONLY`; synthetic/public evaluation only. | [Cohere rate limits](https://docs.cohere.com/docs/rate-limits) |
| OpenRouter | Free-model access is rate-limited and the free router can select a changing upstream model. | `EMERGENCY_ONLY`; manual synthetic emergency lane, 40-request app ceiling, actual returned model required. | [OpenRouter limits](https://openrouter.ai/docs/api-reference/limits) |
| SambaNova | Free-cloud rate limits are model/account specific and preview models may change. | `LAB_ONLY`; synthetic evaluation only, 18-request app ceiling, lifecycle recheck required. | [SambaNova rate limits](https://docs.sambanova.ai/cloud/docs/get-started/rate-limits) |
| NVIDIA NIM | NVIDIA's Developer Program provides free hosted NIM API access for prototyping, research, development, and testing; production requires enterprise licensing. | `PROTOTYPE_ONLY`; synthetic/public LLM, retrieval, or rerank checks only. | [NVIDIA Build](https://build.nvidia.com/), [NIM FAQ](https://docs.api.nvidia.com/nim/docs/product) |

## Official account and key entry pages

Core activation:

- [Groq API keys](https://console.groq.com/keys) and [Groq Data Controls/ZDR](https://console.groq.com/docs/your-data)
- [Mistral Studio Free Mode and API key guide](https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key)
- [Google AI Studio API keys](https://aistudio.google.com/apikey), [Gemini key restrictions](https://ai.google.dev/gemini-api/docs/api-key), and [current Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Cloudflare Workers AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/) and [current Neuron pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/); there is no provider API key for the binding

Optional laboratory activation:

- [Cohere evaluation keys](https://dashboard.cohere.com/api-keys) and [trial limits](https://docs.cohere.com/docs/rate-limits)
- [OpenRouter API keys](https://openrouter.ai/settings/keys) and [live free-model limits](https://openrouter.ai/docs/api-reference/limits)
- [SambaNova API keys](https://cloud.sambanova.ai/apis)
- [NVIDIA Build](https://build.nvidia.com/) and [Developer Program limits](https://docs.api.nvidia.com/nim/docs/product)

These links were refreshed from official sources on 2026-08-13. Console/account/region availability can still differ and must be recorded as a live result, never inferred from a documentation page.

## Honest activation-state receipt

Groq is the only verified production-active route: `groq:openai/gpt-oss-20b`, ZDR confirmed, strict synthetic receipt passed, `allowPaid=false`. Mistral, Gemini, Cloudflare Workers AI, and every optional provider remain configured/bound but policy-disabled after their current result or pending gate. The app remains fully useful without any provider.

## Refresh rule

Recheck the official pages, provider catalog, selected model, current account quota, retention controls, and exact free eligibility immediately before activation and at least every 30 days thereafter. A stale route becomes `POLICY_STALE`/`STALE_REVERIFY` and is excluded rather than silently used.
