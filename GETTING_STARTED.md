# KevinOS Getting Started

This is the end-to-end setup path for KevinOS: the static personal dashboard, the Cloudflare Worker relay, sync, reminders, OAuth, and AI features.

KevinOS is Kevin's personal life operating system. It is a local-first, installable PWA for tasks, calendar, notes, projects, GitHub, Gmail, Calendar, habits, goals, people, spend tracking, link stash, and a morning Launch sequence. The app works offline without an account. The relay adds AI, OAuth, push reminders, cross-device sync, and server-held tokens.

## What This Guide Sets Up

By the end, you can:

1. Open KevinOS locally or at the live GitHub Pages URL.
2. Understand what lives in the static app and what lives in the relay.
3. Deploy the static PWA through GitHub Pages.
4. Deploy or recreate the Cloudflare Worker relay.
5. Configure Worker AI, KV, D1, cron, VAPID push, OAuth, and AI secrets.
6. Connect the live app to the relay.
7. Turn on sync, reminders, GitHub, Gmail, Google Calendar, and AI features.
8. Verify the major subsystems and troubleshoot the common failures.

What is already live for Kevin:

- Static app: https://kevinbigham.github.io/kevinos/
- Relay: https://kevinos-relay.kevinbigham.workers.dev
- App version shown in the footer: `KevinOS v0.38`
- Service worker cache: `kevinos-v0_38`
- Persisted schema stamp: `state.v = 37`
- Relay name: `kevinos-relay`
- Relay entrypoint: `relay/worker.js`
- Relay config: `relay/wrangler.toml`

What a fresh setup requires:

- A GitHub Pages deploy for the static files.
- A Cloudflare Worker deploy for `relay/worker.js`.
- A Cloudflare KV namespace named by the `PUSH` binding.
- A Cloudflare D1 database named by the `SYNC` binding, with the `docs` table.
- A VAPID keypair for Web Push.
- Optional provider keys for non-Cloudflare AI seats.
- GitHub and Google OAuth clients if those rooms should connect to live accounts.

What is optional:

- The relay itself. KevinOS still opens and stores local data offline without it.
- Cross-device sync.
- Phone reminders.
- GitHub, Gmail, and Google Calendar OAuth.
- Extra Council seats beyond Gemini and Cloudflare Workers AI.

Time estimate:

- Use the existing live app: about 5 minutes.
- Fresh clone plus relay recreation: about 45-90 minutes, mostly Cloudflare and OAuth console clicking.

Cost expectation:

- The stack is designed for free tiers: GitHub Pages, Cloudflare Workers, Workers AI, KV, D1, cron, Gmail API, and Calendar API.
- AI provider usage depends on the provider and key. Keep provider dashboards on free/low limits unless you intentionally opt into spend.

## The Two Ways To Start

### Fast Path: Use The Existing Live Instance

1. Open https://kevinbigham.github.io/kevinos/
2. If you are on iPhone or iPad, install it to the Home Screen for the full PWA and push-notification path.
3. In **Next -> Council queue**, confirm the relay URL is:

```text
https://kevinos-relay.kevinbigham.workers.dev
```

4. Ask the Council a one-sentence test.
5. Use the footer **Cross-device sync** panel to connect a passphrase if this device should share the live dataset.

You can stop here if the live app and relay are already configured.

### Full Rebuild: Fresh Clone Or Fresh Accounts

Use this when you are recreating the stack from source, changing Cloudflare accounts, or setting up a new owner environment.

1. Open the static app locally.
2. Confirm GitHub Pages deployment.
3. Deploy the relay with Wrangler.
4. Recreate KV, D1, cron, VAPID, and secrets as needed.
5. Register OAuth clients.
6. Paste the relay URL into KevinOS.
7. Verify each feature area.

## Architecture In One Page

KevinOS has two halves:

| Piece | Files or service | What it does | Secrets? |
| --- | --- | --- | --- |
| Static PWA | `index.html`, `manifest.json`, `sw.js` | The whole browser app, localStorage data, offline shell, PWA install, rooms, UI, backup/import | No secrets |
| GitHub Pages | https://kevinbigham.github.io/kevinos/ | Public static hosting for the PWA | No secrets |
| Cloudflare Worker relay | `relay/worker.js` | AI calls, Council fan-out, OAuth token storage/proxy, push sending, sync API, Gmail/Calendar helpers | Secrets live here |
| Cloudflare KV | `PUSH` binding | Push subscriptions, reminder schedules, GitHub sessions, Google sessions, overnight draft cache | Contains server-side session/token records |
| Cloudflare D1 | `SYNC` binding | One synced document per passphrase fingerprint | No browser DB credential |
| Cloudflare Workers AI | `[ai]` binding | Free Council seat with no provider key | No provider key |

The app is intentionally local-first. Without the relay, the rooms still open, local data still saves, and backup/export still works. Features that call AI, OAuth providers, D1 sync, or Web Push need the relay.

The relay health endpoint is:

```sh
curl https://kevinos-relay.kevinbigham.workers.dev/
```

A healthy response has `ok:true`, `service:"kevinos-relay"`, the selected single-model `provider`, a `seats` list, and capability flags such as `push`, `github`, `sync`, `extract`, `capture`, `summarize`, `spend`, `launch`, `calendar`, `habits`, `email`, and `peopleEnrich`.

## Prerequisites

You need:

- macOS Terminal or an equivalent shell.
- Git.
- Node/npm, because relay deployment uses `npx wrangler`.
- A GitHub account.
- A Cloudflare account.
- A Google account if Gmail or Calendar should connect.
- AI provider keys as desired.
- This repo path on Kevin's Mac:

```sh
cd /Users/kevin/KevinOS/app
```

The first `npx wrangler ...` command may ask to install Wrangler. Press `y`; that is expected.

## Part 1: Open The App Locally

The repo root is:

```sh
cd /Users/kevin/KevinOS/app
```

Important app files:

- `index.html` is the whole app.
- `manifest.json` makes KevinOS installable and declares the share target.
- `sw.js` is the service worker. It caches the offline shell and handles push notification clicks.

Opening `index.html` directly works for basic use:

```sh
open /Users/kevin/KevinOS/app/index.html
```

For a more realistic PWA preview, serve the folder over local HTTP:

```sh
cd /Users/kevin/KevinOS/app
python3 -m http.server 8128
```

Then open:

```text
http://localhost:8128/
```

Service worker behavior is only fully relevant over `https://` or local HTTP. It is not the same under plain `file://`.

Local CORS caveat:

- The live relay sets `ALLOW_ORIGIN = "https://kevinbigham.github.io"`.
- That means browser calls from `http://localhost:8128` to the live relay can be blocked by CORS.
- Server-side checks such as `curl https://kevinos-relay.kevinbigham.workers.dev/` still work.
- To use a local browser against a relay, temporarily change `ALLOW_ORIGIN` in `relay/wrangler.toml` to your local origin and redeploy, then change it back before relying on the live app.

Checkpoint:

- The page opens.
- The footer shows `KevinOS v0.38`.
- Local edits save in the browser.
- No relay-dependent feature is expected to work until a relay URL is connected.

## Part 2: Use Or Deploy The Static PWA

The live app is served from GitHub Pages:

```text
https://kevinbigham.github.io/kevinos/
```

The repo is public. The static app deploy is a normal commit and push to `main`; GitHub Pages usually rebuilds quickly.

For docs-only changes, do not bump the app version, `state.v`, or service worker cache. For app code changes, bump the visible footer version and the service worker cache so installed clients fetch the new shell. Only bump `state.v` when the persisted state shape changes.

Docs deploy example:

```sh
cd /Users/kevin/KevinOS/app
git status
git add README.md GETTING_STARTED.md relay/RELAY_SETUP.md HANDOFF.md
git commit -m "Add Getting Started guide"
git push origin main
```

This guide shows the commit commands for later use. Do not commit from an automation run unless Kevin asks for it.

Checkpoint:

- GitHub Pages opens at https://kevinbigham.github.io/kevinos/
- The current footer still says `KevinOS v0.38` if only docs changed.
- `sw.js` still has `var CACHE = "kevinos-v0_38";` if only docs changed.

## Part 3: Deploy The Cloudflare Relay

The relay is a Cloudflare Worker.

Current source:

- Worker name: `kevinos-relay`
- Main file: `relay/worker.js`
- Wrangler config: `relay/wrangler.toml`
- Compatibility date: `2024-11-01`
- Current live URL: https://kevinos-relay.kevinbigham.workers.dev

Deploy:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler login
npx wrangler deploy
```

Deploy output prints a URL like:

```text
https://kevinos-relay.YOURNAME.workers.dev
```

For Kevin's current stack, use:

```text
https://kevinos-relay.kevinbigham.workers.dev
```

What `wrangler.toml` defines:

- Worker name: `name = "kevinos-relay"`
- Worker entrypoint: `main = "worker.js"`
- Compatibility date: `compatibility_date = "2024-11-01"`
- Worker AI binding: `[ai] binding = "AI"`
- KV binding: `PUSH`
- D1 binding: `SYNC`
- Cron trigger: `crons = ["* * * * *"]`
- Public vars: `PROVIDER`, `ALLOW_ORIGIN`, model vars, `MAX_TOKENS`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`, `GITHUB_CLIENT_ID`, `GOOGLE_CLIENT_ID`
- Secret names: `GEMINI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `VAPID_PRIVATE_KEY`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_SECRET`

Verify:

```sh
curl https://kevinos-relay.kevinbigham.workers.dev/
```

You should see JSON with `ok:true`, `service:"kevinos-relay"`, a `provider`, a `seats` array, and capability flags. If a capability is `false`, the matching binding, public var, or secret is missing from that Worker environment.

Checkpoint:

- `npx wrangler deploy` succeeds.
- `curl` returns JSON, not HTML.
- `service` is `kevinos-relay`.
- `sync` is true when the D1 binding exists.
- `push` is true when `VAPID_PUBLIC_KEY` exists.
- `email`, `calendar`, and `peopleEnrich` are true when `GOOGLE_CLIENT_ID` is present.
- `github` is true when `GITHUB_CLIENT_ID` is present.

## Part 4: Configure AI

Minimum useful AI:

- `GEMINI_API_KEY` powers Gemini-backed app features, the synthesis chair, `/extract`, `/actions`, `/capture`, `/brief`, `/weekly`, `/launch`, `/summarize`, `/spend/scan`, and Calendar parsing.
- Cloudflare Workers AI needs no provider key. It uses the `[ai]` binding in `wrangler.toml`.

Optional Council seats:

- `GROQ_API_KEY`
- `MISTRAL_API_KEY`
- `OPENROUTER_API_KEY`
- `ANTHROPIC_API_KEY` for the single-model Claude fallback/provider path if you want to keep it available.

Set secrets interactively only:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put MISTRAL_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

Paste each secret only at Wrangler's prompt. Do not pass secrets as command-line arguments. Do not put secret values in `wrangler.toml`, Markdown docs, chat, issues, screenshots, or shell history.

Model changes:

- The single-model endpoint `/ai` follows `PROVIDER`.
- The Council endpoint `/council` ignores `PROVIDER` and uses every configured seat.
- Swap models by editing public model vars such as `GEMINI_MODEL`, `CF_MODEL`, `GROQ_MODEL`, `MISTRAL_MODEL`, or `OPENROUTER_MODEL`, then redeploy.
- `OPENROUTER_MODEL` is a comma-separated fallback chain. Free model slugs can go stale; refresh them from OpenRouter if that seat starts returning model errors.

Checkpoint:

- Relay health `seats` includes `gemini` when `GEMINI_API_KEY` exists.
- Relay health `seats` includes `cloudflare` when the `[ai]` binding is active.
- Next -> Council queue can answer a one-sentence prompt after the relay URL is connected in the app.

## Part 5: Configure Web Push Reminders

Push reminders enable:

- Morning brief notifications.
- Task due-time reminders.
- Habit nudges.
- People nudges.
- Weekly review reminders.
- Overnight draft notifications when Gmail is connected.

How it works:

- The public VAPID key lives in `wrangler.toml` as `VAPID_PUBLIC_KEY`.
- The private VAPID key lives only as the Worker secret `VAPID_PRIVATE_KEY`.
- The `PUSH` KV namespace stores push subscriptions and reminder schedules.
- The Worker cron runs every 2 minutes (each fire costs a KV list; every-minute exceeded the free tier's 1,000 lists/day).
- The service worker in `sw.js` displays the notification and opens KevinOS on tap.

Fresh setup:

1. Generate a VAPID keypair.

```sh
node -e 'const c=crypto.subtle;(async()=>{const k=await c.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);const pub=Buffer.from(await c.exportKey("raw",k.publicKey)).toString("base64url");const d=(await c.exportKey("jwk",k.privateKey)).d;console.log("PUBLIC:",pub);console.log("PRIVATE:",d);})()'
```

2. Put the public value in `relay/wrangler.toml` as `VAPID_PUBLIC_KEY`.
3. Store the private value as a Worker secret.

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler secret put VAPID_PRIVATE_KEY
```

4. Create the KV namespace if this is a fresh Cloudflare account.

```sh
npx wrangler kv namespace create PUSH
```

5. Paste the printed KV namespace id into `wrangler.toml` under:

```toml
[[kv_namespaces]]
binding = "PUSH"
id = "PASTE_KV_NAMESPACE_ID_HERE"
```

6. Confirm the cron trigger exists.

```toml
[triggers]
crons = ["* * * * *"]
```

7. Deploy.

```sh
npx wrangler deploy
```

8. In KevinOS, open **Next -> Phone reminders**, choose **Turn on**, then **Send test**.

iOS/PWA caveats:

- Install KevinOS to the Home Screen before expecting push to work on iPhone or iPad.
- Browser notification permission must be granted.
- Push delivery is easiest to verify with **Send test**.
- If permission was denied, change the browser/site notification setting and try again.

Checkpoint:

- `GET /push/key` returns a public key.
- Relay health has `push:true`.
- **Send test** displays a notification on the installed PWA device.

## Part 6: Configure Cross-Device Sync

Sync is optional. It links devices by passphrase without sending the passphrase itself.

How it works:

- The browser derives a salted SHA-256 passphrase fingerprint.
- The passphrase itself does not leave the device.
- The relay stores one document per fingerprint in D1.
- Content syncs: tasks, events, projects, notes, Council queue, habits, goals, stash, people, spend, and related app content.
- Device connections stay local: relay URL, push subscription, GitHub session, Google session, Calendar connection, sync settings, brief/launch/weekly device caches.
- Backup import does not auto-link sync.
- The current sync API uses server-authoritative `rev` values and merges conflicts losslessly by id.

Fresh D1 setup:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler d1 create kevinos-sync
npx wrangler d1 execute kevinos-sync --remote --command "CREATE TABLE IF NOT EXISTS docs (id TEXT PRIMARY KEY, doc TEXT NOT NULL, updated_at INTEGER NOT NULL, rev INTEGER NOT NULL DEFAULT 0, device_id TEXT);"
npx wrangler deploy
```

After `d1 create`, paste the printed database id into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "SYNC"
database_name = "kevinos-sync"
database_id = "PASTE_D1_DATABASE_ID_HERE"
```

App steps:

1. Open KevinOS.
2. In the footer, open **Cross-device sync**.
3. Choose **Connect**.
4. Enter the same passphrase on every device.
5. Compare the link code if devices do not match. Different link codes mean different passphrases.

Checkpoint:

- Relay health has `sync:true`.
- Footer sync status shows connected.
- A test task created on one connected device appears on the other after focus, refresh, or the 60-second poll.

## Part 7: Configure GitHub OAuth

GitHub OAuth lets KevinOS proxy GitHub GraphQL through the relay so the token is not stored in the browser.

Create the OAuth app:

1. Open https://github.com/settings/developers
2. Choose **OAuth Apps -> New OAuth App**.
3. Use:

```text
Application name: KevinOS
Homepage URL: https://kevinbigham.github.io/kevinos/
Authorization callback URL: https://kevinos-relay.kevinbigham.workers.dev/github/callback
```

4. Register the app.
5. Copy the Client ID. This value is public and belongs in `wrangler.toml` as `GITHUB_CLIENT_ID`.
6. Generate a client secret. This value is private.
7. Store the secret with Wrangler.

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler deploy
```

The Worker implements:

- `GET /github/login`
- `GET /github/callback`
- `GET /github/status`
- `POST /github/graphql`
- `POST /github/logout`

The OAuth scope is `read:user repo`, matching the app's contribution and private-repo streak needs.

App steps:

1. Make sure the relay URL is connected in **Next -> Council queue**.
2. Open the **GitHub** room.
3. Choose **Connect with GitHub**.
4. Approve the OAuth screen.
5. Return to KevinOS and refresh if needed.

The app stores only a random session handle. The token lives on the relay in KV and is revoked on disconnect.

Checkpoint:

- Relay health has `github:true`.
- GitHub room shows the connected account and contribution data.
- Disconnect removes the session and revokes the token.

## Part 8: Configure Google OAuth For Gmail And Calendar

Google OAuth powers Gmail, Google Calendar, and the read-only Google Sheets digest through the same relay-held token record.

Create or configure the Google app:

1. Open https://console.cloud.google.com
2. Create or select a project named `KevinOS`.
3. Enable **Gmail API**.
4. Enable **Google Calendar API**.
5. Enable **Google Sheets API**.
6. Configure the OAuth consent screen.
7. Keep the app in **Testing** mode for personal use.
8. Add every Gmail account you want to connect as a test user.
9. Create an OAuth Client ID with application type **Web application**.
10. Add this redirect URI exactly:

```text
https://kevinos-relay.kevinbigham.workers.dev/google/callback
```

11. Copy the Client ID. This value is public and belongs in `wrangler.toml` as `GOOGLE_CLIENT_ID`.
12. Store the client secret privately.

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler deploy
```

The Worker implements:

- `GET /google/login`
- `GET /google/callback`
- `GET /google/status`
- `POST /google/threads`
- `POST /google/draft`
- `POST /google/send`
- `POST /google/overnight`
- `POST /google/modify`
- `POST /google/logout`
- `POST /calendar/list`
- `POST /calendar/calendars`
- `POST /calendar/freebusy`
- `POST /calendar/parse`
- `POST /calendar/create`
- `POST /swim/scan`
- `POST /sheets/digest`

The current worker requests:

- `openid`
- `email`
- Gmail readonly.
- Gmail send.
- Calendar events.
- Calendar readonly.
- Spreadsheets readonly.

Google warning:

- In Testing mode, Google may show **KevinOS hasn't been verified**.
- That is expected for a personal app owned by Kevin.
- Use **Advanced -> Continue** only for your own app and your own accounts.

App steps:

1. Make sure the relay URL is connected in **Next -> Council queue**.
2. Open the **Email** room.
3. Choose **Connect Gmail**.
4. Approve the Google consent screen.
5. Open the **Calendar** room.
6. Choose **Connect Google Calendar** if Calendar is not already connected.

Calendar/Sheets reconnect note:

- If Gmail was connected before the Calendar or Sheets scopes were added, reconnect the Google account once (Calendar room, or the reconnect prompt on the Launch Sheets card).
- No new Worker secret is needed for Calendar or Sheets; both reuse the Google OAuth setup.

Checkpoint:

- Relay health has `email:true`, `calendar:true`, and `peopleEnrich:true`.
- Email room loads inbox groups.
- Calendar room loads live agenda items.
- Calendar can parse a typed event and create it after review.

## Part 9: Connect Everything Inside KevinOS

Use this checklist after the static app and relay are deployed.

1. Open https://kevinbigham.github.io/kevinos/
2. Go to **Next -> Council queue -> Connect AI**.
3. Paste:

```text
https://kevinos-relay.kevinbigham.workers.dev
```

4. Ask the Council a one-sentence test.
5. In the footer, open **Cross-device sync**, connect, and enter the same passphrase on each device.
6. Go to **Next -> Phone reminders -> Turn on -> Send test**.
7. Go to **GitHub -> Connect with GitHub**.
8. Go to **Email -> Connect Gmail**.
9. Go to **Calendar -> Connect Google Calendar**.
10. In **Calendar -> Smart add**, paste event text and extract a reviewed local event.
11. In **Next**, refresh the daily brief.
12. In **Launch**, refresh the game plan.
13. In **Email**, use **Draft all** or draft a selected reply.
14. In **Stash**, add a URL and confirm it summarizes or falls back to manual note.
15. In **People**, add a contact with an email and use **Enrich from Gmail**.
16. In **Spend Pulse**, scan receipts if Gmail is connected.
17. In **Goals** and **Habits**, create one test item and confirm it saves and syncs as expected.

Checkpoint:

- Local-first rooms work even if the network drops.
- Relay-dependent rooms degrade with friendly "connect" or "not connected" states.
- Nothing sends email or creates Google Calendar events without a human approval step.

## Part 10: Verify Every Feature Area

| Area | Setup needed | How to verify | Common fix |
| --- | --- | --- | --- |
| Static app | GitHub Pages or local HTTP | Open the app and confirm footer `KevinOS v0.38` | Hard refresh or clear stale service worker cache |
| Service worker/PWA install | `manifest.json`, `sw.js`, HTTPS or local HTTP | Install to Home Screen or app shell opens offline | Use HTTPS/live URL, not `file://` |
| Relay health | Worker deployed | `curl https://kevinos-relay.kevinbigham.workers.dev/` | Deploy from `relay/`; check Cloudflare account |
| Council | Relay URL plus AI seats | Next -> Council queue -> ask a test | Set `GEMINI_API_KEY`, confirm `[ai]`, redeploy |
| AI brief/Launch/Weekly | `GEMINI_API_KEY`, relay URL | Refresh brief, Launch, or Weekly Review | Add/rotate Gemini key; check relay health flags |
| Web Push | `PUSH` KV, VAPID keys, cron, installed PWA | Next -> Phone reminders -> Send test | Install PWA, grant permission, set `VAPID_PRIVATE_KEY` |
| Sync | `SYNC` D1 binding and `docs` table | Same passphrase on two devices syncs a test task | Create D1 table; compare link codes |
| GitHub | GitHub OAuth app, client id, client secret, `PUSH` KV | GitHub room connects and loads contribution data | Fix callback URL; set `GITHUB_CLIENT_SECRET` |
| Gmail | Google OAuth app, Gmail API, client id/secret, `PUSH` KV | Email room loads inbox groups | Add test user; set `GOOGLE_CLIENT_SECRET`; reconnect |
| Calendar | Google OAuth with Calendar API/scopes | Calendar room lists events and creates reviewed event | Enable Calendar API; reconnect account |
| Stash summarize | `GEMINI_API_KEY` | Add URL in Stash | Some pages block fetch; use manual fallback |
| People enrich | Gmail connected and contact emails | People -> Enrich from Gmail | Reconnect Gmail; check account/test user |
| Spend scan | Gmail connected plus `GEMINI_API_KEY` | Next -> Spend Pulse -> Scan inbox | Gmail session expired; reconnect Email |

## Troubleshooting

### Wrangler asks to install

This is normal the first time:

```text
Need to install the following packages: wrangler
Ok to proceed? (y)
```

Press `y`.

### Wrong Cloudflare account

Symptoms:

- Deploy creates a Worker in the wrong account.
- Wrangler cannot see the expected KV or D1 resources.
- The deployed URL uses an unexpected workers.dev subdomain.

Fix:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler logout
npx wrangler login
npx wrangler deploy
```

Then confirm the deploy URL and `curl` health.

### Missing KV binding

Symptoms:

- Push, GitHub, or Google session routes fail.
- Errors mention push storage, email not configured, or GitHub not configured.

Fix:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler kv namespace create PUSH
```

Paste the id into `wrangler.toml` under the `PUSH` binding and redeploy.

### Missing D1 binding

Symptoms:

- Relay health has `sync:false`.
- Footer sync fails.
- Habits health may also be false because habits use synced data.

Fix:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler d1 create kevinos-sync
```

Paste the database id into `wrangler.toml` and redeploy.

### D1 table missing

Symptoms:

- `sync:true` may appear, but `/sync/pull` or `/sync/push` errors.

Fix:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler d1 execute kevinos-sync --remote --command "CREATE TABLE IF NOT EXISTS docs (id TEXT PRIMARY KEY, doc TEXT NOT NULL, updated_at INTEGER NOT NULL, rev INTEGER NOT NULL DEFAULT 0, device_id TEXT);"
npx wrangler deploy
```

### Health flag is false

Use the flag to find the missing setup:

- `push:false`: `VAPID_PUBLIC_KEY` missing from vars.
- `github:false`: `GITHUB_CLIENT_ID` missing from vars.
- `sync:false`: `SYNC` D1 binding missing.
- `extract:false`, `capture:false`, `summarize:false`, `spend:false`, `launch:false`: `GEMINI_API_KEY` missing.
- `calendar:false`, `email:false`, `peopleEnrich:false`: `GOOGLE_CLIENT_ID` missing.

After changing vars, bindings, or secrets, redeploy the Worker.

### GitHub `invalid redirect_uri`

The GitHub OAuth callback must match exactly:

```text
https://kevinos-relay.kevinbigham.workers.dev/github/callback
```

If you deploy a fresh Worker URL, update the GitHub OAuth app callback to that new URL.

### Google `redirect_uri_mismatch`

The Google OAuth authorized redirect URI must match exactly:

```text
https://kevinos-relay.kevinbigham.workers.dev/google/callback
```

If you deploy a fresh Worker URL, update the Google OAuth client redirect URI to that new URL.

### Google app not verified warning

For a personal app in Testing mode, this is expected. Continue only if the Google Cloud project is yours and the account is one you added as a test user.

### Google test user missing

Symptoms:

- Google blocks consent.
- The account cannot proceed through Testing mode.

Fix:

- Open the Google Cloud OAuth consent screen.
- Add that Gmail address as a test user.
- Try the KevinOS connection again.

### Gmail connected but Calendar fails

The existing token may not include Calendar scopes. In KevinOS, open **Calendar -> Connect Google Calendar** and reconnect once. Also confirm the Google Calendar API is enabled in the Google Cloud project.

### Localhost CORS blocked

The live relay CORS is locked to:

```toml
ALLOW_ORIGIN = "https://kevinbigham.github.io"
```

For local browser testing, either mock fetches, test with server-side `curl`, or temporarily set `ALLOW_ORIGIN` to the local origin and redeploy. Restore the live origin afterward.

### Push not available

Push requires browser support, a service worker, notification permission, and usually an installed PWA on iOS. Use the live HTTPS app, install it, then turn on reminders.

### Push permission denied

Change the browser/site notification permission, then return to KevinOS and turn reminders on again. If the browser does not allow another prompt, remove the site permission first.

### Stale service worker cache

Symptoms:

- The live app looks old after a deploy.
- New code does not appear on an installed PWA.

Fixes:

- Hard refresh the page.
- Close and reopen the installed app.
- Clear site data if needed.
- For app code releases, bump `sw.js` cache name before deploy.

Docs-only changes do not need a cache bump.

### Sync passphrase mismatch

Symptoms:

- Devices do not see the same data.
- Footer link codes differ.

Fix:

- Re-enter the same passphrase exactly on both devices.
- Watch for mobile auto-capitalization or autocorrect.
- Use the link code only as a check, not as the passphrase.

### Gmail or GitHub says not connected

The app stores a session handle; the relay stores the token. A missing, expired, deleted, or revoked relay session returns "not connected".

Fix:

- Reconnect from the GitHub or Email room.
- Confirm the relay URL is still connected in Next.
- Confirm KV is configured, because OAuth sessions live in the `PUSH` KV namespace.

### AI route returns missing key or provider error

Fix:

- Set the relevant provider secret with `npx wrangler secret put NAME`.
- Confirm `PROVIDER` is `gemini` or `claude` for `/ai`.
- Confirm the Council `seats` list includes the providers you expect.
- Redeploy after var/model changes.

### OpenRouter free model slug goes stale

OpenRouter free models can rotate or rate-limit. Update `OPENROUTER_MODEL` in `wrangler.toml` to current free slugs and redeploy.

## Security Notes

- Client IDs are public. Client secrets are not.
- `VAPID_PUBLIC_KEY` is public. `VAPID_PRIVATE_KEY` is not.
- Never paste API keys, private VAPID keys, or OAuth client secrets into chat, source files, README files, issue comments, screenshots, or shell command arguments.
- Use `npx wrangler secret put NAME` and paste only at the prompt.
- OAuth tokens are stored on the relay, keyed by random session ids.
- Browser localStorage holds app data and session handles, not provider OAuth tokens.
- The repo is public, so docs must use placeholders for private values.
- Export a KevinOS backup before major migrations or before force-linking sync from a device.

## Maintenance And Redeploys

Static app and docs:

```sh
cd /Users/kevin/KevinOS/app
git status
git add README.md GETTING_STARTED.md relay/RELAY_SETUP.md HANDOFF.md
git commit -m "Update KevinOS docs"
git push origin main
```

Relay:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler deploy
```

Secret rotation:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler secret put NAME
npx wrangler deploy
```

Model changes:

1. Edit public model vars in `relay/wrangler.toml`.
2. Redeploy from `relay/`.
3. Check relay health and ask a Council test.

Version and cache rule:

- App code change: bump footer version and `sw.js` cache.
- Persisted state shape change: bump the state schema stamp.
- Docs-only change: no version/cache/schema bump.

Before major changes:

1. Export a KevinOS backup from the footer.
2. Check `git status`.
3. Make one focused change.
4. Verify locally.
5. Deploy app and/or relay as needed.
6. Re-check health and the affected room.

## Quick Reference

Live app:

```text
https://kevinbigham.github.io/kevinos/
```

Live relay:

```text
https://kevinos-relay.kevinbigham.workers.dev
```

Local app path:

```sh
cd /Users/kevin/KevinOS/app
```

Local preview:

```sh
cd /Users/kevin/KevinOS/app
python3 -m http.server 8128
```

Relay deploy:

```sh
cd /Users/kevin/KevinOS/app/relay
npx wrangler deploy
```

Relay health:

```sh
curl https://kevinos-relay.kevinbigham.workers.dev/
```

OAuth consoles:

- GitHub OAuth apps: https://github.com/settings/developers
- Google Cloud console: https://console.cloud.google.com
- Cloudflare dashboard: https://dash.cloudflare.com

Related repo docs:

- [Relay setup appendix](relay/RELAY_SETUP.md)
- [Handoff](HANDOFF.md)
- [Roadmap](ROADMAP.md)
