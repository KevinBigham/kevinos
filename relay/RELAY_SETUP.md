# KevinOS Relay — setup (the fool-proof version)

This is a tiny free server ("Worker") that holds your AI key so your phone/browser never has to. Once it's live, the **Council queue** in KevinOS answers itself.

You only do this **once**. ~10 minutes. Everything is free.

---

## What you'll end up with
A URL like `https://kevinos-relay.YOURNAME.workers.dev` that you paste into KevinOS once.

---

## Step 1 — Pick your AI and get ONE key

**Option A — Claude (recommended, your ecosystem):**
1. Go to **https://console.anthropic.com** → sign in.
2. Left sidebar → **API Keys** → **Create Key** → name it `kevinos` → **Copy** it. (Starts with `sk-ant-…`)
3. Add a few dollars of credit under **Billing** (Haiku is ~pennies; $5 lasts a long time).

**Option B — Gemini (has a free tier, $0 to start):**
1. Go to **https://aistudio.google.com/app/apikey** → sign in.
2. **Create API key** → **Copy** it.
3. If you pick this, open `wrangler.toml` and change `PROVIDER = "claude"` to `PROVIDER = "gemini"`.

Keep the key on your clipboard for Step 3.

---

## Step 2 — Make a free Cloudflare account
Go to **https://dash.cloudflare.com/sign-up**, sign up, verify your email. That's it — no credit card.

---

## Step 3 — Deploy the relay (copy/paste these in Terminal)

Open **Terminal** and run these one at a time:

```sh
cd /Users/kevin/KevinOS/app/relay

# Log in to Cloudflare (opens your browser → click "Allow")
npx wrangler login

# Save your API key as a secret (it will prompt you to paste it):
#   If you chose Claude:
npx wrangler secret put ANTHROPIC_API_KEY
#   If you chose Gemini instead, run this one instead of the line above:
# npx wrangler secret put GEMINI_API_KEY

# Ship it
npx wrangler deploy
```

When `deploy` finishes it prints a line like:

```
https://kevinos-relay.YOURNAME.workers.dev
```

**Copy that URL.** That's the only thing you need.

> First time `npx` runs it may ask to install `wrangler` — just say yes (press `y`).

---

## Step 4 — Connect it in KevinOS
1. Open KevinOS → **Next** tab → scroll to **Council queue**.
2. Tap **Connect AI** → paste the URL from Step 3 → **Save**.
3. Type a question in **Ask the Council…** → it answers right there. 🎉

---

## Add more Council seats (optional — all free)

The Council asks **every seat that has a credential**, in parallel, then a "chair" model synthesizes one brief. Two seats work out of the box:

- **Gemini** — already set (your `GEMINI_API_KEY`).
- **Cloudflare** — no key needed; it's the `[ai]` binding already in `wrangler.toml`.

To add the other three, make a free key and store it as a secret, then redeploy. Each new seat joins automatically — no app or code change.

```sh
cd /Users/kevin/KevinOS/app/relay

# Groq — https://console.groq.com/keys
npx wrangler secret put GROQ_API_KEY

# Mistral — https://console.mistral.ai/api-keys
npx wrangler secret put MISTRAL_API_KEY

# OpenRouter — https://openrouter.ai/keys
npx wrangler secret put OPENROUTER_API_KEY

npx wrangler deploy
```

Check which seats are live any time:

```sh
curl https://kevinos-relay.YOURNAME.workers.dev/
# -> {"ok":true,"service":"kevinos-relay","provider":"gemini","seats":["gemini","cloudflare","groq","mistral","openrouter"]}
```

Swap any seat's model by editing the matching var in `wrangler.toml` (`GROQ_MODEL`, `MISTRAL_MODEL`, `OPENROUTER_MODEL`, …) and redeploying. If the OpenRouter default ever 404s, copy a current free slug from <https://openrouter.ai/models?max_price=0>.

## Switching the single-model endpoint later
The `/ai` endpoint (one model) still uses `PROVIDER`. Edit `wrangler.toml` → change `PROVIDER`, set the matching secret (Step 3), then `npx wrangler deploy` again. The Council (`/council`) ignores `PROVIDER` — it always uses every seat.

## Test the relay directly (optional)
```sh
curl https://kevinos-relay.YOURNAME.workers.dev/
# -> {"ok":true,"service":"kevinos-relay","provider":"claude"}
```

## Notes
- The key lives **only** on Cloudflare as an encrypted secret — never in the app, the repo, or your phone.
- `ALLOW_ORIGIN` is locked to your live site (`https://kevinbigham.github.io`). If you ever serve KevinOS from somewhere else, change it in `wrangler.toml` and redeploy.
- Cost: Cloudflare Workers free tier = 100k requests/day (you'll use a handful). AI = your provider's usage (tiny).
