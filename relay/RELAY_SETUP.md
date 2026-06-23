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

## Phone reminders (Web Push) — already set up (v0.14)

KevinOS can push a **morning brief** and **per-task due reminders** to the installed PWA. This is wired and live — you don't need to redo it. Here's how it works, and how to reproduce it on a fresh relay:

1. **Generate a VAPID keypair** (one P-256 keypair — the public half is advertised to the app, the private half signs the pushes):
   ```sh
   node -e 'const c=crypto.subtle;(async()=>{const k=await c.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);const pub=Buffer.from(await c.exportKey("raw",k.publicKey)).toString("base64url");const d=(await c.exportKey("jwk",k.privateKey)).d;console.log("PUBLIC:",pub);console.log("PRIVATE:",d);})()'
   ```
2. Put **PUBLIC** in `wrangler.toml` as `VAPID_PUBLIC_KEY` (it's meant to be public). Set **PRIVATE** as a secret (paste at the prompt — never as a CLI argument):
   ```sh
   npx wrangler secret put VAPID_PRIVATE_KEY
   ```
3. **Create the KV store** for subscriptions + reminders, then paste its id into `wrangler.toml` under `[[kv_namespaces]] binding = "PUSH"`:
   ```sh
   npx wrangler kv namespace create PUSH
   ```
4. The cron is already in `wrangler.toml` (`[triggers] crons = ["* * * * *"]`). **Deploy:** `npx wrangler deploy`.
5. In KevinOS → **Next** → **Phone reminders** → **Turn on** (needs KevinOS added to your iPhone home screen, and the relay connected above). Tap **Send test** to confirm a notification lands.

The keys never touch the app or the repo: the **private** key is a Cloudflare secret; the app fetches the **public** key from `GET /push/key`. There's **no `web-push` library** — the relay does VAPID signing + RFC-8291 payload encryption in WebCrypto (verified against the RFC test vector). Cost stays **$0** (KV + Cron free tier).

## GitHub sign-in (OAuth) — register the app once (v0.15)

KevinOS connects to GitHub with **OAuth** so the token lives on the relay, never on your phone. Register a GitHub "OAuth App" once (~2 min):

1. Go to **https://github.com/settings/developers** → **OAuth Apps** → **New OAuth App** (direct: https://github.com/settings/applications/new).
2. Fill in:
   - **Application name:** `KevinOS`
   - **Homepage URL:** `https://kevinbigham.github.io/kevinos/`
   - **Authorization callback URL:** `https://kevinos-relay.kevinbigham.workers.dev/github/callback` ← must be exact
   - Leave "Enable Device Flow" unchecked.
3. Click **Register application**.
4. Copy the **Client ID** (public). Then click **Generate a new client secret** and copy the **secret** (shown once).
5. Put the Client ID in `wrangler.toml` (`GITHUB_CLIENT_ID = "…"`), set the secret, redeploy:
   ```sh
   cd /Users/kevin/KevinOS/app/relay
   npx wrangler secret put GITHUB_CLIENT_SECRET   # paste the secret at the prompt
   npx wrangler deploy
   ```
6. In KevinOS → **GitHub** room → **Connect with GitHub** → approve → done. The token is held on the relay; the app only keeps a random session id.

Scope is `read:user repo` (matches the old token — counts private contributions). Disconnecting in-app **revokes** the token on GitHub. `GET /` shows `"github":true` once configured.

## Cross-device sync — already set up (v0.16)

KevinOS keeps your tasks, notes, and everything else **in lock-step across every device**. This is wired and live — you don't redo it. To **use** it: open KevinOS on each device → footer → **Cross-device sync · Connect** → enter the **same passphrase** on every device. That's the only step. Data flows through the relay, and **no database key is ever in your browser** — the app only sends a fingerprint of your passphrase.

How it works, and how to reproduce it on a fresh relay:

1. **Create the D1 database** (a tiny free SQL store on your Cloudflare account) and its one table:
   ```sh
   cd /Users/kevin/KevinOS/app/relay
   npx wrangler d1 create kevinos-sync
   # paste the printed database_id into wrangler.toml under [[d1_databases]] binding = "SYNC"
   npx wrangler d1 execute kevinos-sync --remote --command "CREATE TABLE IF NOT EXISTS docs (id TEXT PRIMARY KEY, doc TEXT NOT NULL, updated_at INTEGER NOT NULL, rev INTEGER NOT NULL DEFAULT 0, device_id TEXT);"
   ```
2. The `[[d1_databases]]` binding is already in `wrangler.toml`. **Deploy:** `npx wrangler deploy`. `GET /` then shows `"sync":true`.
3. In KevinOS → footer → **Cross-device sync** → **Connect** → pick any passphrase (or tap **Generate**) → **Start syncing**. Enter the **same** passphrase on your other devices to link them.

The model is **last-write-wins**: the most recent edit wins. **Content** syncs (tasks, notes, projects, calendar, …); **device connections** (the relay URL, push, GitHub) stay per-device. Your passphrase never leaves the device — only `sha256(passphrase)` is sent, and that's the database row key. Backup/restore still works as the escape hatch, and importing a backup never links a device on its own. Cost stays **$0** (Cloudflare D1 free tier — 5 GB, far beyond a personal dataset).

## Calendar / File AI — already set up (v0.17)

The calendar can turn a **photo, a PDF, or pasted text** into events. This rides on your existing Gemini key — **nothing to set up.** In KevinOS → **Calendar** → **✨ Smart add** → paste text or pick a photo/PDF → **Extract events** → approve each proposed event onto your calendar. The relay endpoint is `POST /extract` (Gemini multimodal); `GET /` shows `"extract":true` whenever a `GEMINI_API_KEY` is set. Cost stays **$0** (Gemini free tier).

## Email Command Center (Gmail) — register a Google app once (v0.18)

KevinOS can read your Gmail and send AI-drafted replies you approve. This is a one-time Google Cloud registration (~10 min). It's fiddlier than GitHub, so go slow — every step matters. The code is already built and live; it just needs a Client ID + secret to switch on.

1. Go to **https://console.cloud.google.com** → sign in (any of your Google accounts can own this).
2. **Create a project:** top bar → project dropdown → **New Project** → name it `KevinOS` → Create → make sure it's selected.
3. **Enable the Gmail API:** left menu → **APIs & Services → Library** → search **Gmail API** → **Enable**.
4. **OAuth consent screen:** APIs & Services → **OAuth consent screen** → User type **External** → Create.
   - App name `KevinOS`; your email for support + developer contact → Save and continue.
   - **Scopes:** just **Save and continue** (no need to add any here).
   - **Test users:** **Add users** → add every Gmail address you'll connect (e.g. `Kevin.Bigham@bspowercats.com` + any personal one) → Save.
   - Leave **Publishing status = Testing**. (Testing mode keeps you off the paid verification/CASA audit — only your listed test-user accounts can connect, which is exactly what you want for a personal tool.)
5. **Create the OAuth client:** APIs & Services → **Credentials** → **Create credentials → OAuth client ID** → Application type **Web application** → name `KevinOS relay`.
   - Under **Authorized redirect URIs** → **Add URI** → paste **exactly**:
     `https://kevinos-relay.kevinbigham.workers.dev/google/callback`
   - **Create.** A dialog shows your **Client ID** and **Client secret**.
6. Give me the **Client ID** (it's public — I'll put it in `wrangler.toml`). Set the secret yourself (don't paste it in chat):
   ```sh
   cd /Users/kevin/KevinOS/app/relay
   npx wrangler secret put GOOGLE_CLIENT_SECRET   # paste the client secret at the prompt
   ```
   I'll add `GOOGLE_CLIENT_ID` + redeploy. `GET /` then shows `"email":true`.
7. In KevinOS → **Email** → **Connect Gmail** → pick your account → approve. Google warns "**KevinOS hasn't been verified**" — expected in Testing mode; click **Advanced → Continue** (you're the developer). Connect more accounts with **+ Account**.

Scopes: `gmail.readonly` (read inbox) + `gmail.send` (send the replies you approve) + `userinfo.email` (label accounts). Tokens are held on the relay and **refreshed automatically — never stored on your phone**, and KevinOS **never sends without your explicit approval**. Disconnecting in-app revokes the token on Google. Cost stays **$0** (Gmail API + Gemini free tiers).

## Notes
- The key lives **only** on Cloudflare as an encrypted secret — never in the app, the repo, or your phone.
- `ALLOW_ORIGIN` is locked to your live site (`https://kevinbigham.github.io`). If you ever serve KevinOS from somewhere else, change it in `wrangler.toml` and redeploy.
- Cost: Cloudflare Workers free tier = 100k requests/day (you'll use a handful). AI = your provider's usage (tiny).
