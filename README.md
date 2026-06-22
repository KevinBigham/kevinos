# KevinOS

A calm personal dashboard — one self-contained HTML file, zero dependencies, works offline, installs as an app.

**Daily:** Home · Next (to-do hub) · Calendar · Notes
**Workspace:** Projects · Studio · Briefs · Prompts · Launchpad · GitHub streak keeper

Open `index.html` directly, or use the hosted version. All data is stored locally on your device — export or import a JSON backup any time from the footer. No accounts, no tracking, no secrets in the source.

Live: **https://kevinbigham.github.io/kevinos/**

## Repo layout
- `index.html` — the whole app (one file, ES5-style vanilla JS, zero deps). `manifest.json` + `sw.js` make it an offline PWA.
- `relay/` — optional Cloudflare Worker backend that powers the in-app **Council** (ask-AI). Holds the AI key as a server secret; the browser never sees it. Setup: `relay/RELAY_SETUP.md`.
- `ROADMAP.md` — the phased build plan.
- **`HANDOFF.md` — full project state + how to resume. Read this first if you're picking up the project.**
