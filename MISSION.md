# KevinOS MISSION.md - Getting Started Tutorial

/goal Read this file completely before acting. Your mission is to add a large, accurate, beginner-friendly Getting Started tutorial to KevinOS so Kevin can set up the whole project end to end without needing tribal memory from previous chats.

This is a documentation mission, not a feature mission. Do not change app behavior unless you discover a broken setup instruction that requires a tiny code/config fix. The desired output is a polished setup guide plus the necessary doc links so the guide is easy to find.

LFG, but with seatbelts: verify every setup step against the current repo before writing it.

---

## Objective

Create a comprehensive `GETTING_STARTED.md` in the KevinOS repo root (`/Users/kevin/KevinOS/app/GETTING_STARTED.md`) that walks a new or returning KevinOS owner through:

1. Opening KevinOS locally.
2. Understanding the app/relay architecture.
3. Deploying or updating the static PWA on GitHub Pages.
4. Deploying or recreating the Cloudflare Worker relay.
5. Configuring required Cloudflare resources: Worker AI, KV, D1, cron, and VAPID push.
6. Adding required and optional AI provider secrets.
7. Registering GitHub OAuth.
8. Registering Google OAuth for Gmail and Calendar.
9. Connecting the live app to the relay.
10. Turning on cross-device sync, reminders, GitHub, Gmail, Calendar, and AI features in the app.
11. Verifying each major subsystem.
12. Troubleshooting the common failure modes.
13. Maintaining and redeploying the stack safely.

Then update the existing docs so this tutorial is the obvious entrypoint:

- `README.md`: add a prominent "Start here" link and a short setup overview.
- `relay/RELAY_SETUP.md`: either keep it as a relay-only appendix and link to `GETTING_STARTED.md`, or lightly revise its opening so it no longer competes with the new guide.
- `HANDOFF.md`: update the repo/file map to mention `GETTING_STARTED.md`.

Do not overwrite the hard-won technical detail in `HANDOFF.md` or `relay/RELAY_SETUP.md`; consolidate and route it. The new guide should be friendly and procedural. The old docs can remain deep references.

---

## Best Approach

Write the tutorial as a path, not as a feature encyclopedia.

KevinOS has many shipped features, but setup has a smaller number of real gates:

1. The static PWA must load.
2. The relay must deploy.
3. Health `GET /` must show the expected capabilities.
4. The app must know the relay URL.
5. Optional accounts and secrets unlock GitHub, Gmail, Calendar, Council seats, reminders, sync, and AI-powered rooms.

The tutorial should therefore use a "happy path first, deeper appendices later" structure:

- Begin with a 5-minute "use the existing live instance" path.
- Then provide a full "rebuild from a fresh clone/account" path.
- Put exact commands in copyable fenced code blocks.
- Use placeholders for private secrets and make clear which values are public.
- Add checklists after each setup stage so Kevin can stop and know what is working.
- Keep "already set up in Kevin's current live stack" separate from "how to reproduce on a fresh stack."

Tone: calm, practical, confidence-building. Kevin is technical enough to follow terminal commands, but the guide should not assume he remembers Cloudflare, Google Cloud, OAuth, D1, KV, VAPID, or GitHub Pages details.

---

## Required Source Audit

Before writing docs, inspect these files and reconcile the guide against the actual code/config:

- `README.md`
- `HANDOFF.md`
- `ROADMAP.md`
- `index.html`
- `manifest.json`
- `sw.js`
- `relay/RELAY_SETUP.md`
- `relay/wrangler.toml`
- `relay/worker.js`

Minimum facts to verify from source:

- Current app version in footer: `KevinOS v0.36`.
- Current service worker cache: `kevinos-v0_36`.
- Current persisted schema version: `state.v = 35`.
- Live app URL: `https://kevinbigham.github.io/kevinos/`.
- Live relay URL: `https://kevinos-relay.kevinbigham.workers.dev`.
- Relay name: `kevinos-relay`.
- Relay entrypoint: `relay/worker.js`.
- Relay config: `relay/wrangler.toml`.
- Cloudflare Worker compatibility date.
- Cloudflare bindings: `[ai]`, `PUSH` KV, `SYNC` D1, cron trigger.
- Public vars in `wrangler.toml`: `ALLOW_ORIGIN`, model vars, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, `GITHUB_CLIENT_ID`, `GOOGLE_CLIENT_ID`.
- Secrets that must never be committed: AI provider API keys, VAPID private key, GitHub client secret, Google client secret.
- Relay health response capabilities listed by `GET /`.
- OAuth callback URLs implemented by the worker:
  - GitHub: `/github/callback`
  - Google: `/google/callback`
- In-app connection points:
  - Relay/Council from Next.
  - Cross-device sync in footer.
  - Phone reminders from Next.
  - GitHub room OAuth.
  - Email room Gmail OAuth.
  - Calendar room Google Calendar connect.

If a current doc contradicts the code, trust the code and note the correction in the new guide. Do not invent setup steps.

---

## Deliverables

### 1. New `GETTING_STARTED.md`

Create `/Users/kevin/KevinOS/app/GETTING_STARTED.md`.

The guide must be substantial and complete. Recommended outline:

```md
# KevinOS Getting Started

## What This Guide Sets Up
## The Two Ways To Start
## Architecture In One Page
## Prerequisites
## Part 1: Open The App Locally
## Part 2: Use Or Deploy The Static PWA
## Part 3: Deploy The Cloudflare Relay
## Part 4: Configure AI
## Part 5: Configure Web Push Reminders
## Part 6: Configure Cross-Device Sync
## Part 7: Configure GitHub OAuth
## Part 8: Configure Google OAuth For Gmail And Calendar
## Part 9: Connect Everything Inside KevinOS
## Part 10: Verify Every Feature Area
## Troubleshooting
## Security Notes
## Maintenance And Redeploys
## Quick Reference
```

Use exact headings if they make sense, but optimize for clarity.

### 2. Updated `README.md`

Keep README short, but add:

- A top-level "Start here" link to `GETTING_STARTED.md`.
- A sentence explaining that `relay/RELAY_SETUP.md` is the relay-only deep reference.
- A short local/opening command if useful.

Do not turn README into the full tutorial.

### 3. Updated `relay/RELAY_SETUP.md`

At the top, add a note:

- For full end-to-end setup, start with `../GETTING_STARTED.md`.
- This file is the relay-focused appendix.

Then adjust only obvious drift or contradictions found during audit. Avoid a giant rewrite unless it is clearly necessary.

### 4. Updated `HANDOFF.md`

Add `GETTING_STARTED.md` to the repo map and mention it as the onboarding entrypoint.

No need to update `ROADMAP.md` unless the repo already tracks docs milestones there.

---

## Content Requirements For `GETTING_STARTED.md`

### Opening

The first page should answer:

- What KevinOS is.
- What is already live for Kevin.
- What a fresh setup requires.
- What is optional.
- Rough time estimate.
- Cost expectation: designed for free tiers, with AI usage depending on provider.

Be explicit that the app works offline without the relay, but AI/OAuth/sync/push features need the relay.

### Prerequisites

Include:

- macOS Terminal or equivalent shell.
- Git.
- Node/npm available for `npx wrangler`.
- A GitHub account.
- A Cloudflare account.
- A Google account if Gmail/Calendar are desired.
- AI provider keys as desired.
- The local repo path:

```sh
cd /Users/kevin/KevinOS/app
```

Mention that a first-time `npx wrangler ...` command may ask to install Wrangler and that pressing `y` is expected.

### App Basics

Explain:

- The repo root is `/Users/kevin/KevinOS/app`.
- `index.html` is the whole app.
- `manifest.json` and `sw.js` make it an installable PWA.
- Opening `index.html` directly works for basic use.
- GitHub Pages is the live static host.
- Service worker behavior is only fully relevant over `https://` or local HTTP, not plain `file://`.

Include one simple local preview option:

```sh
cd /Users/kevin/KevinOS/app
python3 -m http.server 8128
```

Then open:

```text
http://localhost:8128/
```

Warn that the relay CORS is locked to the live GitHub Pages origin, so local browser calls to the live relay may be blocked unless the relay config is adjusted. Server-side `curl` health checks still work.

### GitHub Pages Deploy

Document:

- The live app is served from GitHub Pages.
- The current repo is public.
- Static app deploy is commit and push to `main`.
- Pages usually rebuilds quickly.
- If app code changes, bump the visible version and service worker cache. If docs only change, no version/cache bump is needed.

Commands:

```sh
cd /Users/kevin/KevinOS/app
git status
git add README.md GETTING_STARTED.md relay/RELAY_SETUP.md HANDOFF.md
git commit -m "Add Getting Started guide"
git push origin main
```

Do not require committing from this mission unless the user asks. The guide can show commands.

### Relay Deployment

Document the relay as Cloudflare Worker:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler login
npx wrangler deploy
```

Explain `wrangler.toml`:

- Worker name.
- Main file.
- Worker AI binding.
- KV namespace.
- D1 database.
- Cron.
- Public vars.
- Secret names.

Explain that deploy output gives a URL like:

```text
https://kevinos-relay.YOURNAME.workers.dev
```

For Kevin's current stack, the live relay is:

```text
https://kevinos-relay.kevinbigham.workers.dev
```

Verification:

```sh
curl https://kevinos-relay.kevinbigham.workers.dev/
```

Describe a healthy result in prose rather than hardcoding a full response that may drift.

### AI Providers

Document required/minimum AI:

- `GEMINI_API_KEY` powers Gemini-backed app features and the synthesis chair.
- Cloudflare Workers AI seat needs no provider key beyond the `[ai]` binding.

Document optional Council seats:

- `GROQ_API_KEY`
- `MISTRAL_API_KEY`
- `OPENROUTER_API_KEY`
- `ANTHROPIC_API_KEY` if supported/kept for provider switching.

Use interactive secret commands only:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put MISTRAL_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler deploy
```

Do not show fake secret values. Do not tell Kevin to pass secrets as command-line arguments.

### Web Push Reminders

Explain:

- Push enables morning brief, task due reminders, habit nudges, people nudges, weekly review, and overnight draft notifications.
- The public VAPID key belongs in `wrangler.toml`.
- The private VAPID key belongs only in a Worker secret.
- The `PUSH` KV namespace stores subscriptions/reminder schedules.
- The cron runs every 2 minutes (each fire costs a KV list; every-minute exceeded the free tier's 1,000 lists/day).

Include reproduction steps:

1. Generate VAPID keypair.
2. Put public key in `wrangler.toml`.
3. Store private key with `npx wrangler secret put VAPID_PRIVATE_KEY`.
4. Create KV namespace if rebuilding fresh:

```sh
npx wrangler kv namespace create PUSH
```

5. Paste KV id into `wrangler.toml`.
6. Deploy.
7. In KevinOS, turn on Phone reminders and send a test.

Mention iOS/PWA caveats:

- Install KevinOS to Home Screen first.
- Browser notification permission must be granted.
- Push delivery is easiest to verify with "Send test".

### Cross-Device Sync

Explain:

- Sync is optional.
- Data is keyed by SHA-256 passphrase fingerprint.
- The passphrase itself does not leave the device.
- Content syncs; device connections stay local.
- Backup import does not auto-link sync.

Fresh D1 setup:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler d1 create kevinos-sync
npx wrangler d1 execute kevinos-sync --remote --command "CREATE TABLE IF NOT EXISTS docs (id TEXT PRIMARY KEY, doc TEXT NOT NULL, updated_at INTEGER NOT NULL, rev INTEGER NOT NULL DEFAULT 0, device_id TEXT);"
npx wrangler deploy
```

Then app steps:

- Open KevinOS.
- Footer -> Cross-device sync.
- Connect.
- Use same passphrase on every device.
- Compare the link code if devices do not match.

### GitHub OAuth

Document:

- Create GitHub OAuth App.
- Homepage URL:

```text
https://kevinbigham.github.io/kevinos/
```

- Callback URL:

```text
https://kevinos-relay.kevinbigham.workers.dev/github/callback
```

- Client ID is public and belongs in `wrangler.toml`.
- Client secret is private and goes into:

```sh
npx wrangler secret put GITHUB_CLIENT_SECRET
```

- Deploy.
- In KevinOS -> GitHub -> Connect with GitHub.

Mention that app stores only a session handle; token lives on relay KV.

### Google OAuth For Gmail And Calendar

Document carefully:

1. Create/select Google Cloud project.
2. Enable Gmail API.
3. Enable Google Calendar API.
4. Configure OAuth consent screen.
5. Keep app in Testing mode for personal use.
6. Add all Gmail accounts as test users.
7. Create OAuth Client ID, type Web application.
8. Add redirect URI:

```text
https://kevinos-relay.kevinbigham.workers.dev/google/callback
```

9. Put public Client ID in `wrangler.toml` as `GOOGLE_CLIENT_ID`.
10. Store secret:

```sh
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler deploy
```

11. In KevinOS -> Email -> Connect Gmail.
12. In KevinOS -> Calendar -> Connect Google Calendar if needed.

Explain expected Google warning:

- In Testing mode, Google may show "KevinOS hasn't been verified."
- That is expected for a personal app owned by Kevin.
- Use Advanced -> Continue only for your own app/accounts.

Mention Calendar scope reconnect:

- If Gmail was connected before Calendar scopes were added, reconnect the Google account once.

### Connect Everything In-App

Create a checklist:

- Open live app.
- Next -> Council queue -> Connect AI -> paste relay URL.
- Ask a one-sentence Council test.
- Footer -> Cross-device sync -> connect passphrase.
- Next -> Phone reminders -> Turn on -> Send test.
- GitHub room -> Connect with GitHub.
- Email room -> Connect Gmail.
- Calendar room -> Connect Google Calendar.
- Calendar -> Smart add -> test pasted event text.
- Next -> Daily brief refresh.
- Launch -> refresh game plan.
- Email -> Draft all or draft a selected reply.
- Stash -> add URL and summarize.
- People -> enrich from Gmail if contacts have email.
- Spend Pulse -> scan receipts if Gmail connected.
- Goals/Habits -> create one test item and confirm sync/visibility.

### Verification Matrix

Add a table with columns:

- Area
- Setup needed
- How to verify
- Common fix

Rows should include:

- Static app
- Service worker/PWA install
- Relay health
- Council
- AI brief/Launch/Weekly
- Web Push
- Sync
- GitHub
- Gmail
- Calendar
- Stash summarize
- People enrich
- Spend scan

### Troubleshooting

Include practical fixes for:

- `wrangler` asks to install.
- Wrong Cloudflare account.
- Missing KV binding.
- Missing D1 binding.
- D1 table missing.
- `GET /` health flag false.
- `invalid redirect_uri` on GitHub or Google.
- Google app not verified warning.
- Google test user missing.
- Gmail connected but Calendar fails.
- Localhost CORS blocked.
- Push not available until app is installed as PWA.
- Push permission denied.
- Stale service worker cache.
- Sync passphrase mismatch.
- "not connected" Gmail/GitHub session.
- AI route returns missing key/provider error.
- OpenRouter free model slug goes stale.

### Security Notes

Must include:

- Client IDs are public; client secrets are not.
- Never paste API keys or client secrets into chat, source, README, issue comments, or shell command arguments.
- Use `npx wrangler secret put NAME`.
- OAuth tokens are stored on the relay, keyed by random session ids.
- Browser localStorage holds app data and session handles, not provider tokens.
- The repo is public, so docs must use placeholders.

### Maintenance

Document:

- App/static docs deploy: commit/push to GitHub.
- Relay deploy: `npx wrangler deploy` from `relay/`.
- Secret rotation: `npx wrangler secret put NAME`, then deploy if needed.
- Model changes: edit public model vars in `wrangler.toml`, then deploy.
- Version/cache bump rule for app code changes.
- No version/cache bump for docs-only changes.
- Backup/export before major changes.

---

## Style Guide

Use Markdown that is easy to scan:

- Short sections.
- Numbered setup steps.
- Copyable shell blocks.
- "You should see..." checkpoints.
- Tables for capability matrices.
- Notes/warnings only where they protect Kevin from real footguns.

Avoid:

- Secret values.
- Overly clever language.
- Unverified provider claims.
- Mentioning obsolete future-roadmap work as if it is still pending.
- Long historical phase logs in the tutorial body.

Use absolute URLs when they are user-facing:

- `https://kevinbigham.github.io/kevinos/`
- `https://kevinos-relay.kevinbigham.workers.dev`
- `https://github.com/settings/developers`
- `https://console.cloud.google.com`
- `https://dash.cloudflare.com`

Use relative links for repo docs:

- `[Relay setup appendix](relay/RELAY_SETUP.md)`
- `[Handoff](HANDOFF.md)`
- `[Roadmap](ROADMAP.md)`

---

## Verification Before Finishing

Run these from `/Users/kevin/KevinOS/app`:

```sh
git diff --check
node --check relay/worker.js
curl -s https://kevinos-relay.kevinbigham.workers.dev/ | head -c 1000
rg -n "sk-|AIza|client_secret|GITHUB_CLIENT_SECRET|GOOGLE_CLIENT_SECRET|VAPID_PRIVATE_KEY|GEMINI_API_KEY|GROQ_API_KEY|MISTRAL_API_KEY|OPENROUTER_API_KEY" GETTING_STARTED.md README.md relay/RELAY_SETUP.md HANDOFF.md
```

The `rg` command may find secret names, which is OK. It must not find real secret values.

Also manually inspect:

```sh
git diff -- GETTING_STARTED.md README.md relay/RELAY_SETUP.md HANDOFF.md
```

Make sure:

- `GETTING_STARTED.md` is the clear first-stop tutorial.
- `README.md` points to it.
- `relay/RELAY_SETUP.md` still works as a relay-specific appendix.
- `HANDOFF.md` file map mentions it.
- No private data was added.
- No app code was changed unless absolutely necessary.
- If only docs changed, no app version/cache bump was made.

---

## Definition Of Done

- [ ] `GETTING_STARTED.md` exists and covers full setup end to end.
- [ ] README has a prominent "Start here" link.
- [ ] Relay setup doc points readers to the new guide.
- [ ] Handoff file map mentions the new guide.
- [ ] All commands and URLs are checked against current source/config.
- [ ] Secrets policy is explicit and respected.
- [ ] Verification commands were run or any inability to run them is reported.
- [ ] Final response summarizes changed files and any remaining setup caveats.

Namaste. Make it sturdy, kind, and usable.
