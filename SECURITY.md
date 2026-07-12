# Security

KevinOS is a local-first personal life OS: a single public HTML file, a public Cloudflare Worker relay URL, and one person's real data. This document is the honest map of what protects what.

## Threat model

**What's public by design:**

- This repository — all app and relay source, docs, OAuth client IDs, the VAPID public key, and the live relay URL (`https://kevinos-relay.kevinbigham.workers.dev`).
- The live app at `https://kevinbigham.github.io/kevinos/` — it ships no data; all user data lives in the visitor's own browser.

**What's private and where it lives:**

| Asset | Location | Protection |
|---|---|---|
| AI provider keys (`GEMINI_API_KEY`, `GROQ_API_KEY`, …) | Cloudflare Worker secrets | Never leave the Worker; never in the repo or the browser |
| OAuth client secrets (`GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_SECRET`) | Cloudflare Worker secrets | Same |
| GitHub / Google OAuth tokens | Worker KV, keyed by random session ids | The browser holds only the session handle |
| `VAPID_PRIVATE_KEY` | Cloudflare Worker secret | Public half is in `wrangler.toml` on purpose |
| Relay auth token (`KEVINOS_TOKEN`) | Worker secret + device-local app setting | Blanked in backups/snapshots; never synced |
| App data (tasks, notes, people, spend, …) | Browser `localStorage` + IndexedDB snapshots | Local-first; travels only via passphrase-keyed sync |
| Synced doc | Relay D1 (`docs` table), one row per key | Row key = `sha256("kevinos-sync\0" + passphrase)`; routes require the relay token when set |

**Trust boundaries:**

- The relay is the custody boundary: secrets and OAuth tokens live there, never in the browser. XSS in the app could read `localStorage` (app data, relay token, sync key fingerprint) but cannot reach provider keys or OAuth tokens.
- The relay token (`KEVINOS_TOKEN`) is the gate on every non-public route. **An unlocked relay (no token set) is open to anyone with the URL** — set it per `GETTING_STARTED.md` Part 3.5. The token compare is not constant-time; for a single-user hobby relay behind Cloudflare that is an accepted trade, noted here so nobody "fixes" it into complexity.
- The sync doc is stored in plaintext in D1. Confidentiality of synced data rests on the relay token + Cloudflare account access + the passphrase-derived row key. (Client-side encryption is roadmap item 76 — a formal decision gate.)
- CORS (`ALLOW_ORIGIN`) is a browser courtesy, not an auth layer: `curl` works from anywhere by design.

**Data safety promises (enforced in code):**

- Backups and snapshots are allowlist-built (`portableDoc`): no `sync`, `push`, `github`, `email`, or `calendar` state; `relay.url` kept, `relay.token` blanked. Connections never travel.
- A corrupt local blob can never be silently overwritten: boot renders an emergency UI, preserves the raw bytes, and blocks saves until recovery.
- Nothing auto-sends: AI proposes, Kevin approves. Every outward action (email send, calendar create, task creation from AI) goes through an explicit confirm or review queue.

## Secrets policy

- Secrets are set **only** via interactive `npx wrangler secret put NAME` — never as CLI arguments, never in files, docs, commits, logs, screenshots, or chat.
- Secret *names* are fine to write anywhere; secret *values* are never fine.
- Pre-release gate: run the secret-pattern scan (see `MISSION.md` → verification ritual) and record the clean result before pushing.

## Reporting a vulnerability

This is a personal project with a single maintainer. If you find a security issue, please open a GitHub issue on `KevinBigham/kevinos` **without exploit details** and ask for a private channel, or contact Kevin directly via the email on his GitHub profile. Good-faith reports are appreciated; there is no bounty, but there is gratitude.
