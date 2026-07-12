# KevinOS

A calm personal dashboard — one self-contained HTML file, zero dependencies, works offline, installs as an app.

## Start here

New setup, fresh device, or rebuilding the relay? Start with **[KevinOS Getting Started](GETTING_STARTED.md)**. It walks through the live app, local preview, GitHub Pages, Cloudflare Worker relay, AI, Web Push, sync, GitHub OAuth, Google OAuth, and verification.

Quick local preview:

```sh
cd /Users/kevin/KevinOS/app
python3 -m http.server 8128
```

Then open `http://localhost:8128/`.

**Primary nav:** Today · Calendar · Tasks · Library · More
**Under More (the Attic):** Council & Briefs · Projects · Habits · People · Email · GitHub · Goals · Studio · Briefs · Prompts · Launchpad · Notes · Stash

Open `index.html` directly, or use the hosted version. All data is stored locally on your device — export or import a JSON backup any time from the footer. No accounts, no tracking, no secrets in the source.

Live: **https://kevinbigham.github.io/kevinos/**

## Release checklist (the three-bump rule)

Every release bumps all of these together, or none — drift here has bitten before (a v0.39 app shipped with a v0_38 service-worker cache):

1. `index.html` footer version — `KevinOS v0.NN`.
2. `sw.js` — `CACHE = "kevinos-v0_NN"`.
3. `SCHEMA_VERSION` in `index.html` — **only** if the persisted data shape changed, and always with a `prevV<NN` migration gate. Never bump it casually.

Check all three before every commit that ships a version.

## Repo layout
- `index.html` — the whole app (one file, ES5-style vanilla JS, zero deps). `manifest.json` + `sw.js` make it an offline PWA.
- `GETTING_STARTED.md` — full end-to-end setup tutorial and verification checklist.
- `relay/` — optional Cloudflare Worker backend that powers AI, OAuth, sync, reminders, and live integrations. Holds provider keys and OAuth secrets server-side; the browser never sees them. Lock it with the `KEVINOS_TOKEN` secret (`GETTING_STARTED.md` Part 3.5) — an unlocked relay is open to anyone with the URL. The relay-only deep reference is `relay/RELAY_SETUP.md`.
- `ROADMAP.md` — the phased build plan.
- **`MISSION.md` — the current release's ground truth (marathon spec + ledger). Read this first if you're picking up the project**, then `HANDOFF.md` (deep history + architecture, with a v0.39 addendum).
