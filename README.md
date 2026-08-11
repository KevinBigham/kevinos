# KevinOS

A calm personal dashboard — one self-contained HTML file, zero dependencies, works offline, installs as an app.

## Start here

New setup or fresh device? Start with **[KevinOS Getting Started](GETTING_STARTED.md)**. It begins with one useful day; optional relay, sync, OAuth, and deployment setup follow afterward.

Quick local preview:

```sh
cd /Users/tkevinbigham/Projects/kevinos
python3 -m http.server 8128
```

Then open `http://localhost:8128/`.

**Primary nav:** Today · Calendar · Tasks · Library · More
**Mobile nav:** Today · Tasks · Capture · Calendar · More
**Under More:** Plan & Review · Projects · Goals · Habits · Studio · People · Email · GitHub · Briefs · Prompts · Launchpad · Notes · Stash

Open `index.html` directly, or use the hosted version. All data is stored locally on your device — export or import a JSON backup any time from the footer. No accounts, no tracking, no secrets in the source.

Live: **https://kevinbigham.github.io/kevinos/**

## The Data Trust Contract

KevinOS holds a life. These promises are enforced in code, tested in `test/`, and non-negotiable:

1. **Your data can never be silently lost.** A failing save shows a red banner and a toast within one edit, and after 5 minutes of failure a backup downloads automatically. A corrupt store can never be overwritten: boot shows a recovery screen, preserves the raw bytes exactly, and blocks all writes until you recover — including a "last good boot" line telling you what's at stake.
2. **Deletions are deliberate.** Destructive actions (import, restore, disconnects) confirm in-card, and imports show a dry-run report (schema + counts vs your device) before anything is touched. Synced deletions use tombstones so nothing resurrects — and nothing deleted on one device reappears from another.
3. **Backups contain your content, never your connections.** Exports and snapshots carry the 17 content collections + portable meta. They never contain sync keys, push subscriptions, GitHub/Google sessions, or the relay token (`relay.url` is kept, `relay.token` blanked). Importing a backup can never change what this device is connected to.
4. **Recovery has layers.** JSON export/import (manual), a 5-deep IndexedDB snapshot ring (boot/autosave/pre-import/pre-restore/manual), and cross-device sync (passphrase-keyed, lossless merges — linking devices unions data, never halves it).
5. **Sync never drops a side.** Conflicting edits merge by id with newer-edit-wins; anything either device added survives. The server orders writes by revision, not clocks.

If any behavior in the app contradicts this contract, that's a bug — file it as data-safety, fix-first.

## Release checklist (the three-bump rule)

Every release bumps all of these together, or none — drift here has bitten before (a v0.39 app shipped with a v0_38 service-worker cache):

1. `APP_VERSION` in `index.html` — the single version source; it stamps the footer at boot (the static footer text is kept in step as the no-JS fallback).
2. `sw.js` — `CACHE = "kevinos-v0_NN"`.
3. `SCHEMA_VERSION` in `index.html` — **only** if the persisted data shape changed, and always with a `prevV<NN` migration gate. Never bump it casually.

Check all three before every commit that ships a version. One grep verifies:

```sh
grep -n 'APP_VERSION=' index.html; grep -n 'KevinOS v0' index.html | head -1; grep -n 'CACHE = ' sw.js; grep -n 'SCHEMA_VERSION=' index.html
```

## Repo layout
- `index.html` — the whole app (one file, ES5-style vanilla JS, zero deps). `manifest.json` + `sw.js` make it an offline PWA.
- `GETTING_STARTED.md` — full end-to-end setup tutorial and verification checklist.
- `relay/` — optional Cloudflare Worker backend that powers AI, OAuth, sync, reminders, and live integrations. Holds provider keys and OAuth secrets server-side; the browser never sees them. Lock it with the `KEVINOS_TOKEN` secret (`GETTING_STARTED.md` Part 3.5) — an unlocked relay is open to anyone with the URL. The relay-only deep reference is `relay/RELAY_SETUP.md`.
- `AGENTS.md` — the concise AI operating contract.
- `docs/CURRENT_STATE.md` — the canonical live ledger and cold-resume point.
- `docs/ARCHITECTURE.md`, `docs/STATE_CONTRACT.md`, and `docs/ROOM_MAP.md` — current structural contracts.
- `docs/ADOPTION_SOAK.md` — the 30-day local daily-driver scorecard and prune-first review.
- `MISSION.md`, `HANDOFF.md`, and `ROADMAP.md` — retained historical evidence; their banners point to the canonical current docs.
