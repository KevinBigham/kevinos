# KevinOS — THE FINAL ASCENT · Codex Edition (v0.49 → v1.0.0)
*(Kevin: paste everything below this line as the FIRST message in a fresh Codex session. Be present for Phase 0 and every ⛳ GO checkpoint; the long build stretches run without you. Written 2026-07-23 against live v0.49.)*

---

You are Codex, taking over as implementation owner for **KevinOS** — a live, ES5, single-file, local-first personal life OS that Kevin daily-drives, built through a multi-session AI marathon now at **88/100 roadmap items + Inbox Intelligence**, live at https://kevinbigham.github.io/kevinos/ with a Cloudflare Worker relay. You have shipped here before (v0.48/v0.49, 2026-07-23 — Inbox Intelligence + the relay-token repair). This is a MARATHON: your mission is **everything between here and v1.0.0**, as far as the gates allow. A verified stop at any phase beats an unverified finish.

## Step 0 — Establish the workspace

1. The workspace is **`~/Downloads/kevinos-live`** (home dir `/Users/tkevinbigham`, "Uncle T's Mac mini") — a real clone with `origin` wired. `git fetch origin && git switch main && git status --short`; anything dirty the Wave Log doesn't explain = STOP and report. If the clone is missing on this machine: `git clone https://github.com/KevinBigham/kevinos.git ~/Downloads/kevinos-live`.
2. **Never work in a folder named `kevinos-main`** — that's a `.git`-less GitHub-archive extraction, read-only reference.
3. Housekeeping from your last session: the local branch `codex/email-inbox-intelligence` equals `main` — delete it locally (`git branch -d`). Work on `main` (house convention: direct push to `main` at GO checkpoints only).
4. Auth preflight: `gh auth status` and, in `relay/`, `npx wrangler whoami`. If wrangler isn't logged in, Kevin runs `npx wrangler login` himself.

## Required reading, in this order, before any edit

1. **The Wave Log** at the bottom of `KEVINOS_EXECUTION_ORDER.md` — the project's memory. The last two entries (Session 6 Phase 0 + the 2026-07-23 out-of-band session) are your starting state, including the **MASTER DRILL CHECKLIST (D0–D5)** and the version renumbering (v0.48/49 consumed → your releases are **v0.50** and **v0.51**).
2. `KEVINOS_AUDIT_V2.md` — certified state, findings V2-F1…F6, the remaining-fourteen map. (Read its version numbers through the renumbering above.)
3. `CONTRIBUTING-AI.md` — the standing rules: ES5 law, three-bump rule, `touch()/save()/persist()/bury()` data contract, *new persisted field ⇒ same-commit round-trip coverage*, verification ritual.
4. `SECURITY.md` — the trust model. `MISSION.md` decision log — the recorded **GATE-76 Option A** decision you will implement, verbatim.
5. `KEVINOS_AUDIT.md` §5–§10 — architecture + the original specs for every W9/W10 item number below.
6. Source: `index.html` (whole app), `sw.js`, `relay/worker.js`, `test/` (harness + `run.sh`), `relay/test/`.

Then: `git log --oneline -15` (tip must match the Wave Log), `sh test/run.sh` (**ALL GREEN** baseline — 13 suites incl. three-device convergence and your inbox-intelligence suite), and open a new Wave Log session entry recording both.

## Authority model (unchanged from Deploy Day; your 07-23 session followed it correctly)

- Edit, commit, run local servers/tests/curl freely. One item per commit, `W#.item:` prefix where applicable, and the repo-mandated trailer on every commit:
  `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- **`git push` and `npx wrangler deploy` ONLY at the named ⛳ checkpoints**, each requiring Kevin to type GO after you show exactly what ships.
- Secrets: Kevin's hands only. Never generate, view, echo, or store secret values in the transcript. (The 07-23 temp-file token handoff was a Kevin-directed repair; don't repeat the pattern unprompted.)
- **No force flags, no history rewrites, no deletions without GO.** Surprising output = stop, explain plainly, wait.
- STOP and ask before any `SCHEMA_VERSION` bump (exactly one is expected — W9.92, scripted below).
- Anything you can't run: record **MANUAL-UNVERIFIED with exact steps**; never claim PASSED unrun. Wave Log entry before context runs low; last line = exact next task.
- **ES5 constitution** in `index.html`: `var` / function declarations / `.then()` chains / string concat / classic loops. No arrows, `const`/`let`, template literals, `async/await`, dependencies, build steps. Contraband scan every commit batch: `git diff -- index.html | grep -nE '=>|\x60|\bconst\b|\blet\b|async |await '` must return nothing. Tests and `relay/worker.js` are modern JS — correct and expected.
- Three-bump release rule: footer `APP_VERSION` + `sw.js` CACHE together every release; `SCHEMA_VERSION` only on a persisted-shape change, always with a `prevV<NN` migration gate.

## PHASE 0 — Finish Trust Restoration (Kevin present, ~30 min)

Session 6 shipped the autonomous Phase-0 items (V2-F1 auto-discovery round-trip, V2-F3 CI). Your 07-23 session cleared most of **D0** (relay token restored server-side, Mac connected, Gmail live, sync **Synced** across Uncle T Mac + Phone + Macbook, link code `465662`). Remaining:

1. **D0 tail:** confirm the relay token + sync passphrase are in Kevin's password manager (**V2-F6** — a v1.0 gate line). Confirm the Phone and Macbook still connect cleanly post-token-repair (they hold device-local copies of the relay token; if either shows "unauthorized," Kevin pastes the Mac's token into that device — values never through you).
2. **Burn down the MASTER DRILL CHECKLIST (D1–D5)** from the Session 6 Wave Log entry, device-in-hand, recording PASS/FAIL per line. Any FAIL = triage immediately, one commit per fix. D5's 8am-brief line records as pending-tomorrow, not blocking.
3. **Offline-chip check (07-23 observation):** in live DOM snapshots the nav status chip read "Offline" while the relay was green and sync was Synced. Reproduce; if the W7.58 chip misreports under normal online use, fix it (it contradicts "trust what I see"). Small, but do it here.
4. **V2-F4:** the stray remote branch `origin/codex/owner-secret-relay-gate` is inventoried (superseded, unmergeable; recommendation on file: DELETE). Ask Kevin for GO and delete it, or record his deferral.
5. ⛳ **CHECKPOINT — push Phase 0** (Wave Log + any fixes). Then state the **GATE-76 precondition verdict** explicitly: drills PASSED = Phases 1–2 unlocked; anything else = GATE-76 and item 64 stay locked, skip to Phase 3 with 64 still deferred. **No exceptions.**

## PHASE 1 — GATE-76: Option A split-doc encryption (autonomous build)

Implement exactly the recorded `MISSION.md` decision — the sync doc's content encrypts client-side; a small opt-in plaintext digest keeps every server-side smart feature alive:

1. **Key:** a second PBKDF2 derivation from the sync passphrase, distinct label (`kevinos-enc-v1`), same iterations as the v2 sync-id derivation. The relay never sees it.
2. **Doc fmt:3:** `{fmt:3, enc:{iv, ct}, digest:{…}}` — the 17 content arrays AES-GCM-encrypted via WebCrypto **promise chains** (ES5 side). `digest` plaintext carries ONLY: today's task titles + counts, today's open-habit count, overdue-people count, and profile facts Kevin has individually opted in (**opt-in toggles in the profile UI, default OFF**). Protocol meta (`rev`) stays per the sync contract.
3. **Merge unchanged:** decrypt → existing `mergeById`/tombstone logic → re-encrypt on push.
4. **Fork guards:** fmt marker; pre-v3 devices get an upgrade nudge, never a corrupted read; push guards stop a pre-v3 device overwriting a v3 doc (reuse the item-15 pattern).
5. **Worker:** all six doc-readers (`buildServerBrief`, `buildLaunchPlan`, `buildWeeklyReview`, `countOpenHabits`, people nudges, `profileDigest`) read the digest when fmt:3, graceful pre-v3 fallback.
6. **Tests:** encryption round-trip vector, digest-builder unit test, worker suites against fake-D1 v3 docs, and **re-run `test/convergence.test.js` against fmt:3 — mandatory PASS, recorded** (it's part of the decision note). Doc `fmt` ≠ `SCHEMA_VERSION`; if a true state-shape change appears, STOP and ask.
7. Commits `W5.76a…`, granular.

## PHASE 2 — Item 64 on the digest (autonomous)

Tomorrow-focus tasks + open goals join the digest (honoring opt-in defaults where profile-derived) and `/launch` names them in the narration. Extend digest + worker tests. Clear the 64 deferral in the ledger.

⛳ **CHECKPOINT — v0.50 + deploy #4** *(renumbered from Audit V2's "v0.48" — that number was consumed by Inbox Intelligence)*: three-bump release, full ritual, Wave Log. On GO: **relay deploys FIRST** (it must understand fmt:3 before any v3 client exists) → verify health → push the app. Post-deploy drill with Kevin (two devices, same passphrase): edits on both sides converge on fmt:3; the next morning's brief still arrives (digest alive) — record pending-tomorrow if outside session hours.

## PHASE 3 — Wave 9: Generalization & Release Assets ("AnyoneOS")

Strictly in order; item specs in `KEVINOS_AUDIT.md` §10:

- **92 — configurable areas. SCHEMA CONVERSATION FIRST:** present Kevin the shape (`AREAS` hydrates from `state.areas`, seeded with the current four, editable in Settings; every existing read keeps working), the migration gate (`prevV<40` seeds from the constant), and the bump **SCHEMA_VERSION 39→40**. Proceed only on his explicit yes. Remember the standing rule: new persisted field ⇒ same-commit auto-discovery round-trip coverage.
- **91** generic seeds + first-boot name prompt → **50** onboarding tour (5 cards, written for a stranger) → **93** demo mode (`?demo=1`: seeded sample data, relay mocked, banner) → **95 — LICENSE: Kevin chooses** (director recommendation on file: MIT; note the dead branch's "All rights reserved" data point) + the README philosophy/manifesto section → **94** — prep everything for the 90-second walkthrough (shot list, script, exact click-path, demo data staged); **Kevin records it** — mark MANUAL-KEVIN → **39** Library search perf @5k seeded records → **40** boot-to-Today budget measured + recorded (<800ms warm target) → **96** Lighthouse against the LIVE URL (post-deploy-#4 app): PWA/a11y/perf **≥90 each**; fix what's fixable (the ledger's dark-mode cosmetic remainders — GH contribution ramp + email row borders — live here); screenshot scores into README.
- ⛳ **CHECKPOINT — W9 release: v0.51** (schema 40 rides this wave) + push; redeploy the relay only if W9 touched it.

## PHASE 4 — Wave 10: The Gate

- **98:** write the **v1.0 release gate** into `MISSION.md` and HOLD it: every 🔴/🟠 across both audits closed (V2-F1 ✅ already; V2-F2 = drill checklist all-PASS, 8am brief included by now), suite green, CI green, Lighthouse ≥90s, credentials-in-password-manager confirmed (V2-F6), docs drift-swept (README/GETTING_STARTED/HANDOFF version facts match the footer), GATE-76 fmt:3 convergence proof on file. Any unmet line = the gate stays shut; report exactly what's missing.
- **99:** ⛳ **CHECKPOINT — v1.0.0:** on GO, tag `v1.0.0`, push the tag, write honest release notes (what it is, what it deliberately isn't), and have Kevin export + archive a backup of the moment.
- **100:** declare the **30-day soak OPEN** in the Wave Log — **zero new features until it ends.** The metric: *open every day → trust what I see → capture instantly → close without anxiety.*

## Parking lot — post-soak only (do NOT build during the soak)

Recorded so nothing gets lost; each needs Kevin's word after the soak: batch triage (archive/snooze a whole inbox group at once) · send-later / scheduled replies · Outlook account support · Inbox Intelligence follow-ups (unified `all:true` multi-account scans, saved prompts, scheduled overnight intelligence runs) · digest opt-in expansion per GATE-76 learnings.

## Final report format

(1) Phase 0 drill results table + GATE-76 precondition verdict · (2) GATE-76 status + fmt:3 convergence result + digest field list + opt-ins-default-OFF confirmed · (3) item 64 cleared · (4) W9 items shipped, the three Kevin-decisions as recorded (schema, license, video), Lighthouse scores · (5) W10 gate line-by-line verdict · (6) every commit/push/deploy made, each with its GO · (7) full remaining MANUAL/KEVIN list · (8) exact next task.

Begin with the Required Reading, step 1. The disk is your memory; the Wave Log is the truth. LFG. 🐐
