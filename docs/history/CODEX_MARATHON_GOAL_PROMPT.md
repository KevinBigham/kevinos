> **HISTORICAL ARTIFACT — do not follow as current spec.** This is the original v0.39 marathon /goal prompt, preserved for the record. Current truth: MISSION.md (release record) and KEVINOS_EXECUTION_ORDER.md (active roadmap).

/goal

You are Codex acting as the implementation owner for KevinOS.

This is a MARATHON mission. Do not stop after one patch. Do not treat this as “try P1.” Your goal is to complete the full KevinOS Evolution Mission from P1 through P10, in order, with every phase tested and every acceptance contract satisfied.

Repository context:
- KevinOS is a local-first single-file HTML app.
- Main app: `app/index.html`
- Relay worker: `app/relay/worker.js`
- Service worker: `app/sw.js`
- Route auth test: `app/relay/test/route-auth.test.js`
- Single-file HTML stays.
- No framework.
- No new required backend.
- Protect data first. Adoption is the metric: open every day → trust what I see → capture instantly → close without anxiety.

First action:
1. Look for `MISSION.md` at the repo root.
2. If it does not exist, create it using the full `MISSION.md` content below.
3. If it exists, merge/update it so it contains the same mission rules, phase order, and acceptance contracts.
4. Then execute the mission from P1 through P10.

Hard rules:
- Work phases in order: P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10.
- P1 is the safety gate. Do not start P2 until P1 passes static checks and its critical acceptance tests.
- Do not skip tests.
- Do not claim manual/browser tests passed unless you actually ran them. If you cannot run them, mark them `MANUAL-UNVERIFIED` and provide exact test steps.
- Keep every phase bootable.
- Do not hide failures.
- Do not invent green tests.
- Do not silently drop user data.
- Do not let backups/snapshots carry live credentials.
- Connections never travel. Backups/snapshots restore KevinOS data only, not live device connections.
- If a later phase becomes too risky, finish the current safe phase, document the blocker in `MISSION.md`, and leave an exact handoff.

Before editing, run:

```sh
awk '/<script>/{flag=1;next}/<\/script>/{flag=0}flag' app/index.html > /tmp/kevinos-index-script.js
node --check /tmp/kevinos-index-script.js
node --check app/sw.js
node --check app/relay/worker.js
node app/relay/test/route-auth.test.js
```

After each phase, run the same checks.

Required final response:
- Phases completed
- Files changed
- Tests run
- Tests passing/failing
- Manual tests still needed
- Known risks
- Exact next step if anything remains

Now create/update `MISSION.md` with the following content, then execute it fully.

--- BEGIN MISSION.md ---

# MISSION.md — KevinOS Evolution Marathon

## Mission

KevinOS is Kevin's local-first personal life OS. The product metric is adoption:

> Open every day → trust what I see → capture instantly → close without anxiety.

This mission upgrades KevinOS from an accreted feature-complete single-file app into a safer, faster, calmer daily-driver.

Do not optimize for feature count. Optimize for:
1. Data trust
2. One-glance daily use
3. Capture speed
4. Calm system health
5. Measured pruning
6. AI leverage where it reduces friction

## Constraints

- Single-file HTML app stays.
- No framework.
- No build step unless already present.
- ES5-compatible JavaScript style unless the file already clearly uses newer syntax in nearby code.
- No new required backend.
- Existing Cloudflare Worker relay may be used but should not be expanded unless the phase explicitly says so.
- Keep relay security intact. Do not weaken `X-KevinOS-Token`.
- Keep app usable offline/local-first wherever possible.
- Never trade data safety for UI progress.
- Never silently drop user data.
- Never let portable backups/snapshots carry live credentials.
- Connections never travel. Backups/snapshots restore KevinOS data, not live device connections.

## Codebase anchors

Main files:

- `app/index.html` — single-file KevinOS app.
- `app/relay/worker.js` — Cloudflare Worker relay.
- `app/sw.js` — service worker.
- `app/relay/test/route-auth.test.js` — relay route-auth test.

Known high-risk areas:

- `var STORE_KEY="kevinos:v1";`
- `function makeStore()`
- `function save()`
- `function persist()`
- `relayPost()`
- `runCouncil()`
- `runCouncilLegacy()`
- `ghFetch()` or GitHub relay fetch path
- sync helpers: `buildSyncDoc()`, `applySyncDoc()`, `mergeRemoteDoc()`
- backup helpers: `exportBackup()`, `importBackup()`
- boot/init `store.load().then(...)`
- router `go(r)`
- launch/brief/weekly generators:
  - `maybeAutoLaunch()`
  - `maybeAutoBrief()`
  - `maybeAutoWeekly()`
- voice capture:
  - `vcSend()`
  - `vcUndo`

Line numbers may drift. Search by symbol, not line number.

## Marathon execution rules

You are working in marathon mode.

1. Read this file first.
2. Inspect the current code before editing.
3. Work through phases in order: P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10.
4. Do not skip a phase.
5. Do not start a later phase if an earlier phase has failing acceptance tests.
6. Keep every phase bootable.
7. Prefer small, reviewable patches inside each phase.
8. Run the static checks after every phase.
9. If browser/manual tests cannot be executed in the environment, add a precise manual test checklist and mark those tests as `MANUAL-UNVERIFIED`, not `PASSED`.
10. If context/session is running out, stop only after updating `MISSION.md` with:
    - completed phases
    - files changed
    - tests run
    - failing tests
    - exact next task
11. Do not claim completion unless acceptance tests pass or are explicitly marked manual-unverified with exact instructions.
12. Do not introduce new dependencies unless absolutely necessary and justified in the mission log.
13. If a safer implementation differs from this mission, prefer safety and document the deviation.

## Required static checks

Run these before starting and after every phase:

```sh
awk '/<script>/{flag=1;next}/<\/script>/{flag=0}flag' app/index.html > /tmp/kevinos-index-script.js
node --check /tmp/kevinos-index-script.js
node --check app/sw.js
node --check app/relay/worker.js
node app/relay/test/route-auth.test.js
```

Note: the `awk` extraction is a pragmatic check for the current single-script layout. If future script/template tags make it false-fail, document that and use a more precise extraction method.

## Mission status ledger

Update this ledger after each phase.

| Phase | Status | Schema | Notes |
|---|---:|---:|---|
| P1 Trust Guardrails | TODO | 38 | Save/load/import/backup/schema/401 trust patch |
| P2 Blob Diet | TODO | 39 | Memory-only caches |
| P3 Snapshot Ring | TODO | 39 | IDB snapshots using P1 helpers |
| P4 Today Alias + Heat | TODO | 39 | Option C Today shell, roomStats sync |
| P5 Today Renderer | TODO | 40 if needed | Full cockpit |
| P6 Global Capture + Bottom Nav | TODO | 40 if needed | Task-first capture |
| P7 Relay Health Chip | TODO | 40 if needed | Visual health state |
| P8 Federated Library | TODO | 40 if needed | Search across five shelves |
| P9 Attic Collapse | TODO | 40 if needed | Measured pruning |
| P10 Evening Close + Universal AI | TODO | 40 if needed | Close loop + AI actions |

Use schema bumps only when persistent data shape changes. Do not bump casually.

---

# P1 — Trust Guardrails

## Goal

KevinOS must never lose or leak data silently.

This phase fixes:

- silent save failure
- corrupt-load overwrite
- unsafe backup secret export
- unsafe import behavior
- schema-version drift
- unclear relay-token rejection

## Schema

Introduce:

```js
var SCHEMA_VERSION = 38;
```

Initial state should use `v: SCHEMA_VERSION`.

Boot should capture `prevV` from saved data before migrations. Preserve existing migration gates. Add a `prevV < 38` no-op normalization gate. Replace hard-coded `state.v=37` with `state.v=SCHEMA_VERSION`.

Imports never apply `saved.v`. If `saved.v > SCHEMA_VERSION`, confirm:

```text
This backup is from a newer KevinOS. Import anyway? Unknown data may be dropped.
```

If confirmed, apply allowlisted data only and stamp `SCHEMA_VERSION`.

## Helpers

Add these names:

```js
var loadFailed = false;
var loadFailedRaw = null;
var saveFailing = false;
var lastSaveBytes = 0;
var relayAuthRejected = false;
var relayAuthToastShown = false;

function cloneJSON(x){ return JSON.parse(JSON.stringify(x)); }
function portableDoc(src){ ... }
function applyPortableDoc(doc, opts){ ... }
function handleSaveResult(r){ ... }
function renderSaveBanner(){ ... }
function currentSaveBytes(){ ... }
function renderStorageStats(){ ... }
function renderLoadEmergency(){ ... }
function downloadRawStorage(){ ... }
function completeRecovery(){ ... }
function handleRelayUnauthorized(opts){ ... }
```

`handleRelayUnauthorized(opts)`:

```js
function handleRelayUnauthorized(opts){
  relayAuthRejected = true;
  if(!(opts&&opts.silent) && !relayAuthToastShown){
    relayAuthToastShown = true;
    toast("Relay token rejected — re-paste it in Settings.");
  }
}
```

## Store load/save contract

`makeStore().load()` returns:

```js
{ok:true,data:parsedOrNull}
```

or:

```js
{ok:false,err:String(e),raw:rawStringValue}
```

`makeStore().save(d)` returns:

```js
{ok:true,bytes:n}
```

or:

```js
{ok:false,err:String(e),bytes:n}
```

Compute `bytes` inside `makeStore().save()` where `JSON.stringify(d)` already happens. Do not stringify the full state again inside `handleSaveResult`.

For quota failure after stringify, return the size that failed to fit.

## Save/persist contract

`save()` and `persist()` early-return while `loadFailed`.

Keep existing sync scheduling order in `save()`:

```js
// NOTE: cloud/push may schedule ahead of a failed local save; P1 surfaces that failure loudly.
// Keep this ordering for now because scheduleSyncPush() marks sync.dirty before persistence.
```

Shape:

```js
function save(){
  if(loadFailed)return Promise.resolve({ok:false,err:"load-failed",bytes:0});
  scheduleReminderSync();
  scheduleSyncPush();
  return store.save(state).then(handleSaveResult);
}
function persist(){
  if(loadFailed)return Promise.resolve({ok:false,err:"load-failed",bytes:0});
  return store.save(state).then(handleSaveResult);
}
```

Normal local save persists raw `state`, not `portableDoc(state)`.

## Save failure UI

`handleSaveResult(r)`:

- reads `r.bytes` into `lastSaveBytes`
- on success:
  - clears `saveFailing`
  - removes save banner
  - refreshes storage stats
- on failure:
  - toast once per failure episode:
    `⚠ Save failed — your changes are NOT being stored. Export a backup now.`
  - set `saveFailing=true`
  - render persistent banner
  - refresh storage stats

`renderSaveBanner()` injects/removes `#saveBanner`:

- fixed top
- full width
- high z-index
- red background
- white text
- text:
  `Saving is failing on this device — export a backup from Settings before closing.`
- inline `Export backup` button calling `exportBackup()`

Do not show save-failure banner over load-failure emergency UI.

## Storage stats

Add a visible `#storageStats` slot near backup/settings/system status.

Show:

```text
Data size: X KB of ~5 MB
Storage: local / Claude storage / memory
```

Thresholds:

- >3.5 MB: warning
- >4.5 MB: critical

`currentSaveBytes()` returns `lastSaveBytes` if nonzero, otherwise a best-effort `JSON.stringify(state).length`.

## Load corruption guard

On load failure:

- `loadFailed=true`
- `loadFailedRaw=raw`
- render emergency UI
- do not apply defaults
- do not render normal app as fresh
- do not run migrations
- do not call boot `save()`
- normal `save()` and `persist()` are blocked

Emergency UI text:

```text
Saved data couldn't be read — nothing has been overwritten.
```

Buttons:

- `Download raw storage`
- `Import backup`

`downloadRawStorage()` downloads `loadFailedRaw` exactly as stored as:

```text
KevinOS-raw-storage-recovery.json.txt
```

`completeRecovery()`:

- clears `loadFailed`
- clears `loadFailedRaw`
- removes emergency UI
- calls `save()`
- toasts `Recovery saved ✓` on success
- if save fails, shows save banner and reports that recovery is loaded in memory but not saved

Navigation/render after recovery is caller’s job.

## Portable doc contract

`portableDoc(src)` is allowlist-based.

Include:

DATA arrays:

- `items`
- `events`
- `projects`
- `builds`
- `briefs`
- `links`
- `prompts`
- `notes`
- `stash`
- `people`
- `spend`
- `goals`
- `habits`
- `council`
- `pending`
- `profile`
- `sheets`

META:

- `deleted`
- `lastBackupAt`
- `lastShutdown`
- `weatherLoc`
- `roomStats` if present

AI continuity / personalization:

- `brief`
- `launch`
- `weekly`
- `intake`
- `peopleCfg`
- `spendMeta`

VERSION:

- `v: SCHEMA_VERSION`

RELAY:

```js
relay:{url: existingUrl || "", token:""}
```

Exclude completely:

- `sync`
- `push`
- `github`
- `email`
- `calendar`
- `sheetsCache`
- `swim`

Portable docs are for backup/snapshot only, never normal local persistence.

## Apply portable doc

`applyPortableDoc(doc, opts)`:

- applies allowlisted portable data only
- never applies:
  - `sync`
  - `push`
  - `github`
  - `email`
  - `calendar`
  - `relay`
- never applies `doc.v`
- always stamps `state.v = SCHEMA_VERSION`
- clears all editing IDs currently cleared by import
- if sync is linked:
  - `state.sync.dirty = true`
  - `state.sync.rev = 0`
  - `_lastPushedDoc = null`

For current-format backups, arrays replace current arrays.

For legacy backups missing a key, leave current state for that missing key rather than wiping it.

## Export backup

Before export:

- `state.lastBackupAt = Date.now()`

Then:

- `copy = portableDoc(state)`
- download JSON
- call `save()`
- update nudges if relevant

Exported JSON must contain:

- no `sync`
- no `push`
- no `github`
- no `email`
- no `calendar`
- no `sheetsCache`
- no `swim`
- `relay.url` present
- `relay.token === ""`

## Import backup

Flow:

1. Read file.
2. Parse JSON.
3. Validate object.
4. If `saved.v > SCHEMA_VERSION`, show newer-version confirm; abort if canceled.
5. Existing destructive import confirm remains.
6. Leave this comment where P3 will hook in:

```js
// P3: snapPut(portableDoc(state), "pre-import") before applying import.
```

7. Call:

```js
applyPortableDoc(saved,{reason:"import"});
```

8. If `loadFailed`:

```js
completeRecovery();
go(room);
if(syncOn())syncPull();
```

9. Else:

```js
save();
go(room);
if(syncOn())syncPull();
```

Delete current relay restore behavior:

```js
if(saved.relay&&typeof saved.relay==="object")state.relay=saved.relay;
```

Delete/replace current version restore:

```js
if(saved.v)state.v=saved.v;
```

Importing a pre-fix backup containing `relay.token`, `email`, or `calendar` must not change current device connection state.

## Relay unauthorized handling

Patch `relayPost()`:

- if `r.status===401`:
  - `handleRelayUnauthorized()`
  - return `{ok:false,error:"unauthorized",status:401}`
- otherwise parse JSON safely
- if JSON parse fails, return `{ok:false,error:"bad-json",status:r.status}`

Patch direct fetches:

`runCouncil()`:

```js
.then(function(r){
  if(r.status===401){
    handleRelayUnauthorized();
    councilFail(id,"Relay token rejected — re-paste it in Settings.");
    return;
  }
  if(r.status===404){
    runCouncilLegacy(id);
    return;
  }
  ...
```

`runCouncilLegacy()`:

```js
.then(function(r){
  if(r.status===401){
    handleRelayUnauthorized();
    return {ok:false,j:{error:"Relay token rejected — re-paste it in Settings."}};
  }
  return r.json().then(function(j){return {ok:r.ok,j:j};},function(){return {ok:false,j:null};});
})
```

Patch GitHub relay fetch:

- if `/github/graphql` fetch returns `401`:
  - call `handleRelayUnauthorized()`
  - throw/use existing auth-kind error so GitHub UI remains consistent

Patch push sync fetches only if trivial:

- `/push/sync` in reminder sync
- `/push/sync` in enable push
- on `401`, call `handleRelayUnauthorized({silent:true})`

If push handling gets messy, defer push 401s.

## P1 acceptance tests

- Syntax/static checks pass.
- Simulated quota failure shows red banner within one edit.
- Save failure toast fires once per failure episode.
- Later successful save clears banner.
- Corrupt `localStorage["kevinos:v1"]="{{{"`; reload shows emergency UI.
- Corrupt raw string remains byte-identical after 60 seconds.
- Raw storage download yields corrupt string exactly.
- Emergency import of valid backup renders app and persists after reload.
- Exported backup contains no `sync`, `push`, `github`, `email`, `calendar`, `sheetsCache`, or `swim`.
- Exported backup preserves `relay.url` and blanks `relay.token`.
- Importing pre-fix backup does not change current `state.relay`, `state.email`, or `state.calendar`.
- Importing newer `"v":99` backup warns and then stamps persisted data as `38` if confirmed.
- Storage stats visible and warning thresholds work.
- Wrong relay token + Council ask shows actionable token rejected toast and row error.
- v37 blob boots to v38 with no data loss.

---

# P2 — Blob Diet

## Goal

Remove regenerable large caches from the persisted localStorage blob.

## Schema

Bump:

```js
var SCHEMA_VERSION = 39;
```

Add `prevV < 39` migration gate.

## Memory-only caches

Add:

```js
var ghMem     = { cache:null, fetchedAt:0 };
var sheetsMem = { at:0, text:"" };
var swimMem   = { at:0, items:[] };
```

Replace all reads/writes of:

- `state.github.cache`
- `state.github.fetchedAt`
- `state.sheetsCache.*`
- `state.swim.*`

with memory equivalents.

Do not confuse `state.sheets` user data with `sheetsCache`.

Persisted GitHub connection fields remain:

- `token`
- `session`
- `login`
- `pendingOAuth`

## Migration

On `prevV < 39`:

- delete `state.github.cache`
- delete `state.github.fetchedAt`
- delete `state.sheetsCache`
- delete `state.swim`

Initial state should drop `sheetsCache` and `swim` keys and shrink `github` to connection fields.

Keep defensive deletes in `portableDoc()` even if redundant.

Update OAuth polling condition from `!state.github.cache` to `!ghMem.cache`.

## P2 acceptance tests

- Boot from v38 blob, persisted localStorage contains no GitHub contribution calendar, sheets digest text, or swim scan items.
- `state.v===39`.
- GitHub room refetches and renders.
- GitHub streak nudge is empty-not-erroring before fetch.
- Pending OAuth poll still completes.
- Sheets digest and swim cards render after refetch.
- Sheets/swim empty states produce no console errors.
- `currentSaveBytes()` drops compared to equivalent pre-P2 state.
- Sync remains unaffected.

---

# P3 — Snapshot Ring

## Goal

Make local recovery automatic without requiring Kevin to remember exports.

## Dependencies

Requires P1 and P2.

## IndexedDB

Create database:

```text
kevinos-snapshots
```

Object store:

```text
snaps
```

Key:

```text
at
```

Record shape:

```js
{
  at: Date.now(),
  reason: "boot"|"autosave"|"pre-import"|"pre-restore",
  bytes: n,
  doc: portableDoc(state)
}
```

Helpers:

- `snapOpen()`
- `snapPut(doc, reason)`
- `snapList()`
- `snapGet(at)`
- `snapPruneKeep(5)`
- `renderSnapshots()`

All IDB failures are best-effort:
- warn once with `console.warn`
- never block app saves
- snapshot UI should say unavailable if IDB unavailable

## Counter policy

Add:

```js
var _writeOk = 0;
var _lastSnapAt = 0;
```

Inside `handleSaveResult` on `ok:true`:

- `_writeOk++`
- if `_writeOk >= 25 && Date.now() - _lastSnapAt >= 600000`:
  - `snapPut(portableDoc(state),"autosave")`
  - reset counter/time only after successful put attempt

Also:

- boot snapshot if newest is older than 20 hours
- no boot snapshot during `loadFailed`
- pre-import snapshot before import applies
- pre-restore snapshot before restoring snapshot

## Restore

Settings shows newest-first snapshots:

```text
Date · reason · KB · [Restore]
```

Restore flow:

1. Confirm.
2. `snapPut(portableDoc(state),"pre-restore")`
3. `applyPortableDoc(snap.doc,{reason:"snapshot"})`
4. If `loadFailed`: `completeRecovery()`
5. Else: `save()`
6. `go(room)`
7. If sync linked: `syncPull()`
8. Toast success.

Do not duplicate import logic.

## P3 acceptance tests

- 25 rapid task adds do not snapshot unless 10-minute floor is satisfied.
- Adjust/lower floor in test and confirm snapshot appears.
- Ring caps at five records.
- Oldest record evicted.
- Snapshot reason labels render.
- Snapshot doc contains no `sync`, `push`, `github`, `email`, `calendar`.
- Snapshot `relay.token===""`.
- Bad import can be undone via pre-import snapshot.
- Restore on sync-linked device merges rather than rolling cloud back.
- Restore path works from emergency load-failed mode.
- App works with IDB unavailable.

---

# P4 — Today Alias 3A + Heat Tracking

## Goal

Create a real Today shell without risky full DOM migration. Start room heat tracking.

## Today shell

Add:

```html
<section data-room="today">
  <div id="todayView"></div>
</section>
```

`renderToday()` composes, in order:

1. `launchGreeting()` header
2. `launchPlanCardHTML()`
3. `launchAgendaCardHTML()`
4. `launchFocusCardHTML()`
5. `launchHabitsCardHTML()`
6. quick capture row: Enter creates Inbox task
7. button row:
   - `Council & Briefs →` calls `go("next")`
   - `Start Life Sweep`
   - `Wind down` only after 17:00 / when appropriate

No inbox card, no nudges, no DOM moves in P4. Those belong to P5.

## Routing

Add:

```js
function normalizeRoom(r){
  return (r==="home"||r==="launch") ? "today" : r;
}
function isTodayRoom(){
  return room==="today";
}
```

Apply normalization inside `go()`.

Important:

- `next` is not aliased.
- `next` is hidden from primary nav but reachable through Today button and command palette.
- Home and Launch tabs removed.
- Today tab first.
- Boot room becomes Today.
- Command palette:
  - add `room-today` with keywords `today home launch morning plan`
  - remove `room-home` and `room-launch`
  - keep `room-next`, relabel as `Council & Briefs`

## Auto-generation rules

On Today entry:

- `maybeAutoLaunch()` fires once per `todayKey()`
- `maybeAutoWeekly()` fires once per `weekKey()`
- `maybeAutoBrief()` no longer auto-fires
- Generate brief remains manual in Next

Relay off:

- Today plan card renders local fallback:
  - today’s events
  - top 3 due/pinned tasks
  - title `Local plan`

Never render blank plan gaps.

## Event wiring

Delegated listener on `#todayView`:

- forwards launch card actions to `handleLaunchClick(e)`
- handles quick capture row
- handles three buttons

Leave existing old room listeners in place if harmless.

## Heat tracking

Add:

```js
state.roomStats = state.roomStats || {};
state.roomStats[r] = { visits: ..., last: Date.now() };
```

Increment inside `go()` after normalization. Persist after increment.

`roomStats` is portable META and import-applied.

## roomStats sync

Do not add `roomStats` to `SYNC_SKIP`.

Add:

```js
function mergeRoomStats(remote){
  if(!remote||typeof remote!=="object")return;
  if(!state.roomStats||typeof state.roomStats!=="object")state.roomStats={};
  var k,l,r;
  for(k in remote){
    if(!remote.hasOwnProperty(k))continue;
    r=remote[k]||{};
    l=state.roomStats[k]||{visits:0,last:0};
    state.roomStats[k]={
      visits:Math.max(l.visits||0,r.visits||0),
      last:Math.max(l.last||0,r.last||0)
    };
  }
}
```

Call:

- in `applySyncDoc(doc)` after `SYNC_ARRAYS` loop
- in `mergeRemoteDoc(doc)` after `SYNC_ARRAYS` loop

Never sum visits.

## P4 acceptance tests

- Today tab exists and renders shell.
- Home/Launch route to Today.
- Next still routes to Council & Briefs.
- Relay on: launch auto-generates once per day.
- Weekly auto-generates once per week from Today.
- Brief never auto-generates.
- Relay off: local plan renders.
- Quick capture creates Inbox task without navigation.
- Room visits increment.
- roomStats sync doc includes stats.
- Cross-device roomStats merge uses max, not sum.
- v39 blob boots to Today with zero loss.

---

# P5 — Today Renderer 3B

## Goal

Make Today the real daily cockpit.

## Structure

Render in order:

1. Greeting
2. Relay/system health chip placeholder or actual chip if P7 lands here
3. Game plan
4. Agenda
5. Top focus
6. Quick capture
7. Habits
8. Inbox peek only if email connected
9. Briefs/review section
10. Nudges
11. Collapsed Council
12. Life Sweep / Intake entry points

Reuse existing Launch HTML helpers where possible.

Do not make Council visually dominant. It should be available but collapsed.

Do not reintroduce Home/Launch/Next decision tax.

## P5 acceptance tests

- Today has no duplicate plan/brief/focus clutter.
- Council can be opened and used.
- Habit toggle works from Today.
- Task pin/done works from Today.
- Wind-down starts from Today.
- Life Sweep starts from Today.
- Relay off still shows local plan.
- No console errors.
- Old Home/Launch links still route to Today.
- Next remains accessible until P8/P9 decide final placement.

---

# P6 — Global Capture + Bottom Nav

## Goal

Capture from anywhere in one key or one thumb tap.

## Existing system

KevinOS already has voice/text capture via `vcPanel`, `vcSend()`, and `vcUndo`.

Do not create a competing capture system. Upgrade the existing one.

## Behavior

Desktop:

- `c` opens global capture unless typing in an input/textarea/contenteditable.
- Keep `/` behavior consistent with existing command palette; do not hijack if it breaks command search.

Mobile:

- bottom nav:
  - Today
  - +
  - Calendar
  - More
- `+` opens existing voice/text capture panel.

## Parser

Deterministic parser before relay:

Supported area tags:

- `#Work`
- `#Coaching`
- `#Teaching`
- `#Personal`
- `#Ana`
- `#Inbox`

Supported dates:

- `@today`
- `@tomorrow`
- `@tue`
- `@wed`
- `@fri`
- `@7/12`

Pin:

- `!` means pin/focus/today

Prefixes:

- `note:` creates note
- `event:` creates event

Default:

- plain untagged capture creates Task in Inbox

Relay `/capture` becomes enrichment only when parser found no strong signal. Relay failure still yields a Task, never a Note.

Keep `vcUndo`.

## P6 acceptance tests

- From any room, `c` opens capture.
- On mobile, `+` opens capture.
- `email parent #Teaching @tomorrow !` creates pinned Teaching task due tomorrow.
- Plain text creates Inbox task.
- `note:` creates note.
- `event:` creates event or opens event flow.
- Works offline.
- Relay failure does not turn capture into note.
- Undo still works.

---

# P7 — Relay Health Chip

## Goal

Make relay degradation visible and calm.

## Health state

```js
var relayHealth = {
  status: "unknown", // unknown | off | ok | auth | error
  checkedAt: 0,
  caps: null,
  err: ""
};
```

Rules:

- no relay URL → `off`
- `GET /` checks reachability/capabilities only
- wrong token is detected opportunistically via `handleRelayUnauthorized()`
- if `relayAuthRejected` → status `auth`
- poll only when:
  - `document.visibilityState === "visible"`
  - relay URL exists
  - enough time has elapsed

No new relay route required.

## UI

Chip on Today:

- Green: Relay online
- Amber: Local mode
- Red: Relay token rejected / relay unreachable

Tapping chip explains affected features:

- AI plan
- Council
- Gmail/Calendar OAuth
- Sync
- Push reminders

## P7 acceptance tests

- No relay URL shows Local mode.
- Reachable relay shows online.
- Wrong token after protected request shows auth/rejected.
- Network failure shows unreachable without blocking app.
- Chip never prevents local use.

---

# P8 — Federated Library

## Goal

Merge five reference shelves into one searchable Library without schema migration.

## Room

Add `room-library`.

Search across:

- `state.briefs`
- `state.prompts`
- `state.notes`
- `state.links`
- `state.stash`
- launchpad data if present

Filters:

- All
- SOP
- Prompt
- Note
- Link
- Read-later

Search fields:

- title
- label
- url
- tags
- body
- summary

Actions:

- Open original item editor
- Copy prompt/text
- Send to Council
- Save Council result to Notes

Old rooms can remain hidden/reachable during transition. Do not delete arrays.

## P8 acceptance tests

- Library finds records across all source arrays.
- Filters work.
- Opening an item uses existing editor.
- Copy action works.
- Send to Council works.
- Existing rooms still preserve data.
- No schema migration required.

---

# P9 — Attic Collapse

## Goal

Use heat data to reduce nav without regret deletion.

## Behavior

After enough roomStats exist:

- show room heat card in Settings/System
- cold rooms collapse into More/Attic
- do not delete underlying data

Likely primary nav:

- Today
- Capture
- Calendar
- Tasks
- More

More/Attic:

- Projects
- Habits
- People
- Email
- Library
- Settings/System
- GitHub
- Spend
- Goals
- Studio if not merged yet

Recommended demotions:

- GitHub: demote to Attic after cache dehydration
- Spend: remove from Today, keep reachable
- Goals: demote to weekly review card
- Studio: merge UI into Projects

## P9 acceptance tests

- No data deleted.
- Cold rooms accessible through Attic.
- Primary nav is small and mobile-friendly.
- Heat card shows visits/last.
- Old routes alias or route safely.

---

# P10 — Evening Close v2 + Universal AI Actions

## Goal

Complete the habit loop and make AI a universal verb.

## Evening Close

After 5pm / configurable evening:

- show close loop nudge
- 3-tap ritual:
  - mark done
  - roll to tomorrow
  - drop
- set tomorrow’s top 3 focus tasks
- feed tomorrow `/launch`

## Universal AI actions

On Library item, person, task, and project:

- Send to Council
- Draft with AI
- Save result to Notes or Pending review queue

Use existing relay and pending/review queue primitives.

No new required backend.

## P10 acceptance tests

- Evening nudge appears with open tasks.
- Close ritual updates tasks correctly.
- Tomorrow focus tasks affect launch plan.
- Universal AI action appears on key item types.
- AI output goes through review/pending path.
- Relay off degrades calmly.

---

# Final completion definition

The mission is complete when:

- all phases P1–P10 are implemented or explicitly documented as deferred with a hard blocker
- all static checks pass
- app boots with existing data
- no console errors in normal flows
- backup export is credential-safe
- corrupt localStorage cannot be overwritten silently
- snapshots can restore from bad import
- Today is the daily cockpit
- capture works globally and offline
- mobile nav is usable
- relay health is visible
- Library exists
- cold rooms collapse without data deletion
- evening close loop works
- universal AI actions exist
- `MISSION.md` ledger is updated
- final response includes:
  - completed phases
  - files changed
  - tests run
  - manual tests still needed
  - known risks


--- END MISSION.md ---

Begin immediately.
