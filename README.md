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

**Daily:** Home · Next (to-do hub) · Calendar · Notes
**Workspace:** Projects · Studio · Briefs · Prompts · Launchpad · GitHub streak keeper

Open `index.html` directly, or use the hosted version. All data is stored locally on your device — export or import a JSON backup any time from the footer. No accounts, no tracking, no secrets in the source.

Live: **https://kevinbigham.github.io/kevinos/**

## Repo layout
- `index.html` — the whole app (one file, ES5-style vanilla JS, zero deps). `manifest.json` + `sw.js` make it an offline PWA.
- `GETTING_STARTED.md` — full end-to-end setup tutorial and verification checklist.
- `relay/` — optional Cloudflare Worker backend that powers AI, OAuth, sync, reminders, and live integrations. Holds provider keys and OAuth secrets server-side; the browser never sees them. The relay-only deep reference is `relay/RELAY_SETUP.md`.
- `ROADMAP.md` — the phased build plan.
- **`HANDOFF.md` — full project state + how to resume. Read this first if you're picking up the project.**
