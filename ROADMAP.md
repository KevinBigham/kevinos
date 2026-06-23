# KevinOS — Implementation Roadmap
*The build plan for the soon-to-be-legendary life OS. Set 2026-06-22. Check boxes as we ship.*

---

## North Star
KevinOS is a **calm daily cockpit** that unifies tasks, calendar, notes, projects, email, and reference across every device Kevin owns. One live dataset, installable as an app, works offline, and gets smart when connected. AI **proposes**, Kevin **approves** — nothing acts on its own.

## Operating principles (the rules we don't break)
1. **Local-first.** The app is fully usable with no network. Cloud is an enhancement, never a dependency.
2. **Review-queue is the core primitive.** Every AI action lands in `pending` → Kevin approves → `done`. Email never auto-sends. Calendar events never auto-create.
3. **Calm, not noisy.** Token expiry is a gentle "Reconnect," not an error. No alarm-red UI.
4. **Cheap by design.** Free tiers first. Hard ceiling ~$25/mo + AI <$5/mo.
5. **Evolve, don't rewrite.** One self-contained file as long as it holds; add a build step only when it genuinely hurts.
6. **Secrets off the browser.** Once the relay lands, OAuth tokens live server-side. PAT-on-device is a temporary, eyes-open tradeoff.

---

## Status board
| | Phase | State |
|---|---|---|
| ✅ | **0 — Foundation** (bug fixes, JSON backup, PWA-ify) | **Shipped** v0.6 |
| ✅ | **GitHub Room** (streak keeper) | **Shipped** v0.7 |
| ✅ | **0.5 — Permanent Deploy** | **Shipped** → kevinbigham.github.io/kevinos |
| ✅ | **1 — Ultimate To-Do Hub + offline Council bridge** | **Shipped** v0.8 |
| ✅ | **1.5 — Daily polish** (recurring, share-capture, backup nudge, wind-down) | **Shipped** v0.9 |
| ✅ | **2 — The Relay** (online AI + review queue) — *first slice LIVE* | **Shipped** v0.10 → relay on Gemini, $0/mo |
| ✅ | **2 — Multi-model Council** (5-seat fan-out + synthesis chair) | **Shipped** v0.11 → Gemini · Cloudflare · Groq · Mistral · OpenRouter, $0/mo |
| ✅ | **2 — Council depth** (per-seat lanes + save-to-Notes + auto-run on connect) | **Shipped** v0.12 → grounded · tactical · research · open-model · devil's-advocate, $0/mo |
| ⬜ | **3 — Sync** (one live dataset across devices) | Planned |
| ⬜ | **4 — Calendar / File AI** | Planned |
| ⬜ | **5 — Email Command Center** | Planned (built last) |

---

## ✅ Phase 0 — Foundation *(shipped, v0.6)*
- [x] `.ics` re-import dedupe in `handleFile`
- [x] JSON Export / Import backup buttons (cache-clear no longer wipes data)
- [x] Panel-scoped edit reads via `pf(sv,id)` (fixes wrong-record save with two editors open)
- [x] Installable PWA — `manifest.json` + network-first `sw.js`, registration guarded to http(s)
- [x] State bumped v5 → v6, verified in-browser (boots clean, no console errors)

## ✅ GitHub Room — Streak Keeper *(shipped, v0.7)*
- [x] Connect via Personal Access Token, called directly against `api.github.com/graphql` (CORS-enabled → zero backend)
- [x] One `viewer` query → profile + last 6 repos + contribution calendar
- [x] `computeStreaks()` — current + longest (current survives a still-zero "today")
- [x] Profile, "shipped today" banner, 3 stat tiles, purple→gold heatmap, recent repos w/ language dots + stars + private lock + relative push time
- [x] Caches last fetch for instant/offline load; Refresh / Disconnect

---

## ✅ Phase 0.5 — Permanent Deploy *(shipped, v0.8)*
**Goal:** A forever-URL that installs on the iPhone for keeps, so Kevin can actually live in it every day.

**Shipped:**
- [x] Host: **GitHub Pages** (public repo `KevinBigham/kevinos`, branch `main` /root, `.nojekyll`)
- [x] One-time `gh auth login` done (token in keyring, scopes repo+workflow) — future deploys need nothing from Kevin
- [x] **Scrubbed all personal/proprietary data** from the code before going public (generic seeds; real data stays on-device + in backups)
- [x] Pushed `app/` → **live at https://kevinbigham.github.io/kevinos/** (HTTP 200, all PWA assets serving)
- [ ] *(Kevin)* Add to Home Screen on iPhone; *(Kevin)* carry data over via footer Export → Import if needed

**Deploy flow now:** edit in `/Users/kevin/KevinOS/app` → `git push` → Pages auto-rebuilds in ~10s. The old trycloudflare tunnel is retired.
**Done when:** ~~the app opens from the home-screen icon, offline, on the real permanent URL.~~ ✅
**Cost:** $0.

---

## ✅ Phase 1 — Ultimate To-Do Hub + offline Council bridge *(shipped, v0.8)*
**Goal:** One screen that answers "what do I do next?" — and a way to capture AI-worthy thoughts even with no signal.

**Shipped:**
- [x] **Next room** — unified command center aggregating open tasks **+ project next-actions + build next-steps** into one prioritized view (surfaces the next-actions otherwise buried inside Projects/Studio)
- [x] Buckets: **Overdue / Today / This week**, with a "+N more without a near-term date →" link out to Tasks; filterable by life area (Work, Coaching, Teaching, Personal, Ana, Inbox)
- [x] Calm focus hero ("N things need you today" / "You're clear for today"); fast quick-capture (pins to today so it surfaces instantly); check tasks off in place
- [x] **Offline Council queue** — capture a question offline; persists with a `queued` pill + "runs when AI connects (Phase 2)" note. Stub now, wired to the relay later.
- [x] GitHub polish: **commit-today nudge** on Home — appears only when today's contributions are still 0, shows the live streak count, taps through to the GitHub room; auto-hides once you've shipped

**Tech:** all client-side, no backend. Reads existing `state` entities + new `state.council[]`; fully delegated event handling so the room re-renders cleanly. Verified in-browser end-to-end (capture, buckets, area filter, check-off, council add/delete, nudge render + nav), zero console errors.
**Done when:** ~~every open task across rooms shows in one ranked list, and offline captures persist for later AI.~~ ✅
**Cost:** $0.

---

## ✅ Phase 1.5 — Daily polish *(shipped, v0.9)*
**Goal:** Make it sticky enough to live in every day, before the backend lands.

**Shipped:**
- [x] **Recurring tasks** — daily / weekdays / weekly / monthly; completing one rolls the next occurrence forward automatically (↻ indicator, repeat picker in capture + editor)
- [x] **Share / URL quick capture** — `?add=…&area=…` (and Web Share Target `title/text/url`) drops straight into the Inbox pinned to today, then cleans the URL + toasts. iOS path = a one-tap Shortcut that opens that URL.
- [x] **Backup-hygiene nudge** — Home reminds you to export when data exists and the last backup is >7 days old (tracks `lastBackupAt`)
- [x] **Evening wind-down ritual** — calm overlay to close the day: finish / push-to-tomorrow / let-go each open item, or roll all forward; gentle evening Home nudge after 5pm; records `lastShutdown`
- [x] Fix: sweep-card title/subtitle now stack properly

**Tech:** all client-side, no backend. Verified in-browser end-to-end (recurrence roll-forward, share ingest, backup nudge + persist, wind-down actions), zero console errors.
**Cost:** $0.

---

## ✅ Phase 2 — The Relay  *(the unlock — backend is LIVE)*
**Goal:** A tiny server that holds secrets and does the things a browser shouldn't: hold OAuth tokens, call AI, send push.

**Shipped & LIVE (v0.10):**
- [x] **Cloudflare Worker** written + **deployed** — live at `https://kevinos-relay.kevinbigham.workers.dev` (`/relay/worker.js` + `wrangler.toml` + `RELAY_SETUP.md`); **switchable provider** (Claude *or* Gemini via `PROVIDER` env); API key held as a Worker secret, never in the browser
- [x] **Provisioned** *(Kevin)* — free Cloudflare account + AI key; running **Gemini 2.5 Flash** on the free tier (**$0/mo**); both `GEMINI_API_KEY` (active) and `ANTHROPIC_API_KEY` (idle) secrets set; relay URL connected in-app
- [x] **Online AI in-app** — Council queue wired to `<relay>/ai`: `queued → running → answered/error`, inline answers + Copy + Retry, auto-runs on Ask when connected, fully degrades offline; CORS locked to the Pages origin
- [x] **Review-queue engine** — first incarnation (the Council `queued → answered` flow); generalizes to calendar/email later

**Shipped & LIVE (v0.11) — Multi-model Council:**
- [x] **`/council` endpoint** — fans one prompt to every configured seat in parallel (`Promise.all`, 45s per-seat timeout); one slow/failed seat never blocks the rest
- [x] **5 free seats**, each self-enabling when its credential exists: **Gemini** (chair), **Cloudflare Workers AI** (no key — `[ai]` binding), **Groq**, **Mistral**, **OpenRouter** (wildcard `:free`). All free tiers, **$0/mo**
- [x] **Synthesis chair** (Gemini) — distills the answers into one brief: Consensus / Split / Recommendation / Watch-fors (runs when ≥2 seats answer)
- [x] **App UI** — synthesis card + collapsible "N of M answered" roster of per-seat cards (lane, provider, timing, Copy); legacy single-answer items still render; `state.v` → 11
- [x] **Verified live** end-to-end via server-side `curl /council` (the relay doesn't reject by Origin) — real multi-model answers + synthesis
- [x] Realizes the **"Council of Friends"** workflow — automated, in-app, $0/mo

**Shipped & LIVE (v0.12) — Council depth:**
- [x] **Per-seat lanes** — each seat answers from a distinct assigned role (grounded / fast tactical / research / open-model / devil's advocate) instead of the same prompt ×5; the synthesis chair is lane-aware. Realizes Kevin's "distinct assignment per friend" rule end-to-end — verified live (5/5 seats genuinely diverged on the same question)
- [x] **Save Council → Notes** — one tap turns a session (question + synthesis + every seat) into a durable note (`Resource` bucket, `council` tag)
- [x] **Auto-run on connect** — offline-queued questions fire automatically the moment the relay connects (fulfils the UI's existing promise); `state.v` → 12
- [x] **Verified** — live `curl /council` (divergent lane answers + lane-aware synthesis) **and** browser preview against a mocked relay (Save-to-Notes + auto-run, no console errors)

- [ ] **Web Push** reminders to the installed PWA + **email-to-self** backstop *(Phase 2b — next)*
- [ ] Move the **GitHub token off-device** to OAuth via the relay *(Phase 2b — next)*

**Tech:** Cloudflare Worker; Google kept in **Testing mode** (sole user) to dodge the ~$900–1,500/yr CASA audit; treat 7-day token expiry as a calm "Reconnect."
**Done when:** an AI suggestion appears in the review queue, Kevin approves it, and a push notification fires — all without any token in the browser.
**Cost:** ~$0 (free tiers), AI <$5/mo.

---

## ⬜ Phase 3 — Sync  *(one dataset, every device)*
**Goal:** Edit on the Mac, see it on the phone. No more per-URL islands.

**Ships:**
- [ ] **Supabase** (free tier) as the synced store
- [ ] Start simple: **last-write-wins + `updatedAt`** (correct enough for a solo user)
- [ ] Upgrade to op-log / field-merge + tombstones **only if** real conflicts show up
- [ ] Backup/restore still works as the escape hatch

**Tech:** Supabase; the existing storage abstraction (`window.storage` → localStorage → memory) gets a cloud tier.
**Done when:** a change on one device appears on another within seconds, offline edits reconcile on reconnect.
**Cost:** $0 → $25/mo ceiling only if it ever outgrows free.

---

## ⬜ Phase 4 — Calendar / File AI
**Goal:** Throw messy input at it — notes, PDFs, screenshots — and get clean calendar events out.

**Ships:**
- [ ] Capture by typing **and** file upload → AI routes it
- [ ] AI extracts events from notes/PDFs/screenshots → **review queue** → export Apple/Google (`.ics`)
- [ ] **Calendar hardening** (clears the last v0.5 bugs): `parseICS` to honor DTEND / TZID / RRULE / EXDATE; export timed events with TZID/Z so they stop drifting across DST

**Tech:** relay AI (Phase 2) + review queue; reuses the existing `.ics` engine, fixed.
**Done when:** a screenshot of a flyer becomes a correctly-timed, reviewed event on the calendar.
**Cost:** AI usage only.

---

## ⬜ Phase 5 — Email Command Center  *(built last, on purpose)*
**Goal:** Wake up to thoughtful draft replies waiting for one tap of approval.

**Ships:**
- [ ] Connect **multiple Gmail + Outlook** accounts (via relay OAuth)
- [ ] AI drafts **selectable** replies overnight → review queue
- [ ] **Never auto-sends** — approval is always a human tap
- [ ] Unified inbox triage surfaced in the cockpit

**Tech:** relay + review queue + sync, all the earlier phases compounding.
**Done when:** morning shows a queue of ready drafts; approving one sends it, ignoring one sends nothing.
**Cost:** AI usage only.

---

## Infra & cost summary
- **Stack:** Cloudflare (Pages + Worker) + Supabase, all free-tier first. Vanilla JS, no framework — add a light build step only when the single file gets unwieldy.
- **AI:** Gemini Flash/Flash-Lite for volume; a stronger model reserved for quality drafts.
- **Trajectory:** $0 to start → ~$25/mo hard ceiling (only if Supabase Pro is ever needed) → AI <$5/mo.

## Security & privacy model
- Review-queue everywhere; **email never auto-sends**, **events never auto-create**.
- Tokens off-browser once the relay exists; until then GitHub PAT is on-device only, wiped on Disconnect.
- Google **Testing mode** (sole user) avoids the CASA audit cost; 7-day token expiry is a calm reconnect, not a failure.

## Hardening backlog (carry-over)
- [ ] `parseICS` ignores DTEND / TZID / RRULE / EXDATE *(scheduled in Phase 4)*
- [ ] Exported timed events are local-floating → DST drift *(scheduled in Phase 4)*

## Open decisions
- **Host for Phase 0.5:** GitHub Pages vs Cloudflare Pages (lean GitHub Pages for simplicity + theme fit).
- **Sync trigger:** ship Phase 3 only once two devices are actively in daily use.

---

## 🔥 Next move
**Phases 0 → 1.5 are all shipped and live** at https://kevinbigham.github.io/kevinos/ — installed-on-your-phone, daily-driver ready, now with recurring tasks, share-capture, backup nudge, and the wind-down ritual.

**Phase 2 first slice is LIVE 🎉** The Council queue talks to real AI through the Cloudflare Worker relay (`https://kevinos-relay.kevinbigham.workers.dev`), running Gemini 2.5 Flash on the free tier — the whole stack (Pages app + Worker + AI) is operational at **$0/mo**, with the API key held only as a server secret and CORS locked to the live site.

**Multi-model Council shipped 🎉🎉 (v0.11)** The Council is now a true **council**: one prompt fans out to **5 free seats** (Gemini · Cloudflare · Groq · Mistral · OpenRouter) in parallel, then a Gemini **synthesis chair** distills one decision-ready brief. Each seat self-enables when its key lands on the relay — adding a model is one `wrangler secret put` + redeploy, no app change. Still **$0/mo**. Built from two free-API research reports; realizes Kevin's "Council of Friends" workflow, automated.

**Council depth shipped 🎉🎉🎉 (v0.12)** The council now genuinely *diverges*: each seat answers from a **distinct lane** — Gemini grounded, Groq fast-tactical, Mistral research, Cloudflare open-model wildcard, OpenRouter **devil's advocate** — and the chair synthesizes lane-aware. Any session **saves to Notes** in one tap, and offline-queued questions **auto-run the moment the relay connects**. Verified live (5/5 seats split on the same question) + in-browser. This is Kevin's "distinct assignment per friend" rule, fully automated.

**Next up (Phase 2b — only when Kevin says go):** Web Push reminders to the installed PWA + email-to-self backstop, then move the GitHub token off-device to OAuth via the relay. After that, Phase 3 (Supabase sync across devices). Remaining Council polish on deck: **progressive streaming** (per-seat cards fill as each model returns, instead of all-at-once) — the last of the three v0.12 polish ideas, and the one worth doing next for the Council.
