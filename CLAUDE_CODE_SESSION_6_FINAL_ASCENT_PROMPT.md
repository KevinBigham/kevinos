# KevinOS — THE FINAL ASCENT Marathon Prompt (Session 6 · fresh window)
*(Paste everything below this line as the FIRST message in a brand-new Claude Code chat. Kevin: have this file and `KEVINOS_AUDIT_V2.md` sitting in `~/Downloads/kevinos-main` — Step 0 seeds them into the real workspace for you. Be present for Phase 0 and the GO checkpoints; the long build stretches run without you.)*

---

You are Claude Code, taking over as implementation owner for **KevinOS** — a live, ES5, single-file, local-first personal life OS that Kevin daily-drives, built through a multi-session AI marathon now at 88/100 roadmap items. This is a fresh window: **you have zero memory of prior sessions. The disk is your memory.** This is a MARATHON: your mission is everything between here and **v1.0.0**, as far as the gates allow.

## Step 0 — Establish the workspace (get this right first)

The home directory on this machine is **`/Users/tkevinbigham`** ("Uncle T's Mac mini"). Older ledger entries written as `/Users/kevin/…` refer to the same folders by name — always resolve paths by folder name under the real `$HOME`, never by literal ledger text.

1. If `~/Downloads/kevinos-live/.git` exists with an `origin` remote → that's the workspace. `git fetch origin && git status --short`; anything dirty that the Wave Log doesn't explain = STOP and report.
2. If it does NOT exist here (Deploy Day may have run on a different Mac): `git clone https://github.com/KevinBigham/kevinos.git ~/Downloads/kevinos-live` — full history + origin, correct on any machine.
3. **Name-collision warning:** `~/Downloads/kevinos-main` on this machine is a fresh GitHub-archive extraction of the live repo — **it has NO `.git` and is never the workspace** (a different, retired folder carried the same name in the patch era). Treat it as read-only staging: copy `KEVINOS_AUDIT_V2.md` — plus this prompt file and any session-prompt `.md`s present there but absent from the clone — INTO the clone, commit them (`docs: seed Audit V2 + session prompts`, standard trailer), then never touch kevinos-main again this session.
4. Auth preflight (this machine may never have pushed or deployed): `gh auth status` and, in `relay/`, `npx wrangler whoami`. If either is missing, guide Kevin through `gh auth login` / `npx wrangler login` — his hands on the keyboard for any password or 2FA.

## Required reading, in this order, before any edit

1. `KEVINOS_AUDIT_V2.md` — current certified state, findings V2-F1…F6, the remaining-fourteen map. Your mission brief.
2. `KEVINOS_EXECUTION_ORDER.md` — the full campaign plan; the **Wave Log at the bottom is the project's memory**, especially the Deploy Day entry (drill-recovery plan, regime change) and each wave's MANUAL-UNVERIFIED list.
3. `CONTRIBUTING-AI.md` — the standing rules. `SECURITY.md` — the trust model.
4. `KEVINOS_AUDIT.md` §5–§10 — architecture + the original item specs (your spec source for W9/W10 items).
5. `MISSION.md` decision log — the recorded GATE-76 decision you will implement.
6. Source: `index.html` (whole app), `sw.js`, `relay/worker.js`, `test/` (read the harness + run.sh).

Then: `git log --oneline -15` (tip must match the Wave Log), `sh test/run.sh` (ALL GREEN baseline), and record both in a new Wave Log session entry.

## Authority model (director-approved, Deploy Day precedent)

- Edit, commit, run local servers/tests/curl freely. One item per commit, `W#.item:` prefix, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **`git push` and `npx wrangler deploy` ONLY at the named ⛳ checkpoints below, each requiring Kevin to type GO** after you show exactly what ships.
- Secrets: Kevin's hands only. You never generate, view, echo, or store secret values.
- **No force flags, no history rewrites, no deletions without GO — ever.** Surprising output = stop, explain plainly, wait.
- STOP and ask before any `SCHEMA_VERSION` bump (one is expected — W9.92 — and its conversation is scripted below).
- MANUAL-UNVERIFIED with exact steps for anything you can't run; never claim PASSED unrun. Wave Log before context runs low; last line = exact next task. Zero freelancing.
- ES5 constitution in `index.html` (var / function declarations / .then chains / string concat; no arrows, const/let, template literals, async/await, deps, build steps). Contraband scan every commit batch. Tests and relay are modern JS — correct and expected.

## PHASE 0 — Trust Restoration (Kevin present, ~30 min)

1. **Credential + drill recovery:** walk Kevin through the 6-step drill-recovery plan in the Deploy Day Wave Log entry (check the Mac app's relay row for a surviving token; else Kevin rotates `KEVINOS_TOKEN` in his own Terminal; fresh sync passphrase → password manager; Mac connects sync first, then phone). Note from the ledger: with no reachable v1 sync row, the re-key drill becomes a **fresh v2 connect** — convergence + persistence are the real assertions, not the literal "Sync upgraded ✓" toast.
2. **Master drill checklist:** consolidate EVERY MANUAL-UNVERIFIED item from the W4–W8 Wave Log entries into one checklist in the Wave Log, then burn it down with Kevin device-in-hand, recording PASS/FAIL per line. Triage any FAIL immediately (one commit per fix) before proceeding. The 8am-brief line is recorded as pending-tomorrow, not blocking.
3. **V2-F1:** upgrade the boot round-trip test to auto-discovery — it must walk every key of a saved doc and assert survival through boot, so an unlisted future field fails loudly. Add the CONTRIBUTING-AI rule: *new persisted field ⇒ same-commit round-trip coverage.*
4. **V2-F3:** CI `node-version: 'lts/*'`.
5. **V2-F4:** inventory `origin/codex/owner-secret-relay-gate` (`git log origin/main..origin/codex/owner-secret-relay-gate --stat`); recommend merge-worthy or delete; deletion needs Kevin's GO.
6. ⛳ **CHECKPOINT — push Phase 0** (Wave Log + fixes). GATE-76's precondition is now either MET (drills passed) or NOT — state it explicitly. **If drills did not pass, GATE-76 and item 64 stay locked; skip Phase 1–2 and continue at Phase 3 with 64 still deferred. No exceptions.**

## PHASE 1 — GATE-76: Option A split-doc encryption (autonomous build)

Implement exactly the recorded MISSION.md decision:
1. **Key:** second PBKDF2 derivation from the sync passphrase, distinct label (`kevinos-enc-v1`), same iterations as the v2 sync-id derivation. The relay never sees it.
2. **Doc fmt:3:** `{fmt:3, enc:{iv, ct}, digest:{...}}` — the 17 content arrays AES-GCM-encrypted via WebCrypto promise chains. `digest` plaintext carries ONLY: today's task titles + counts, today's open-habit count, overdue-people count, and profile facts Kevin has individually opted in (**opt-in toggles in the profile UI, default OFF**). Protocol meta (rev) stays per the sync contract.
3. **Merge unchanged:** decrypt → existing `mergeById`/tombstone logic → re-encrypt on push.
4. **Fork guards:** reuse the item-15 pattern — fmt marker; pre-v3 devices get an upgrade nudge, never a corrupted read; push guards stop a pre-v3 device overwriting a v3 doc.
5. **Worker:** all six doc-readers (`buildServerBrief`, `buildLaunchPlan`, `buildWeeklyReview`, `countOpenHabits`, people nudges, `profileDigest`) read the digest when fmt:3, graceful pre-v3 fallback.
6. **Tests:** encryption round-trip vector, digest-builder unit test, worker suites with fake-D1 v3 docs, and **re-run `test/convergence.test.js` against fmt:3 — mandatory PASS, recorded** (it's part of the decision note). Doc `fmt` ≠ `SCHEMA_VERSION`; if a true state-shape change appears, STOP and ask.
7. Commits `W5.76a…`, granular.

## PHASE 2 — Item 64 on the digest (autonomous)

Tomorrow-focus tasks + open goals join the digest (honoring opt-in defaults where profile-derived) and `/launch` names them in the narration. Extend digest + worker tests. Clear the deferral in the ledger.

⛳ **CHECKPOINT — v0.48 + deploy #4:** three-bump release, full ritual, Wave Log. Then, on GO: **relay deploys FIRST** (it must understand fmt:3 before any v3 client exists) → verify health → push app. Post-deploy drill with Kevin (two devices, same passphrase): edits both sides converge on fmt:3; the next morning's brief still arrives (digest alive) — recorded pending if outside session hours.

## PHASE 3 — Wave 9: Generalization & Release Assets

Strictly in order; specs in `KEVINOS_AUDIT.md` §10:
- **92 — configurable areas. SCHEMA CONVERSATION FIRST:** present Kevin the shape (AREAS hydrates from `state.areas`, seeded with the current four, editable in Settings; every existing read keeps working), the migration gate (`prevV<40` seeds from the constant), and the bump SCHEMA_VERSION 39→40. Proceed only on his yes.
- **91** generic seeds + first-boot name prompt → **50** onboarding tour (5 cards, written for a stranger) → **93** demo mode (`?demo=1`: seeded sample data, relay mocked, banner) → **95 — LICENSE: ask Kevin to choose** (director recommendation on file: MIT) + the README philosophy/manifesto section → **94** — you prep everything for the 90-second walkthrough (shot list, script, the exact click-path, demo data staged); **Kevin records it** — mark MANUAL-KEVIN → **39** Library search perf @5k seeded records (pre-lowered index if needed) → **40** boot-to-Today budget measured + recorded (<800ms warm target) → **96** Lighthouse against the LIVE URL (post-deploy-#4 app): PWA/a11y/perf ≥90 each; fix what's fixable (the ledger's known dark-mode cosmetic remainders live here); screenshot scores into README.
- ⛳ **CHECKPOINT — W9 release** (v0.49 or as the checklist dictates; schema 40 rides this wave) + push; redeploy relay only if W9 touched it.

## PHASE 4 — Wave 10: The Gate

- **98:** write the v1.0 release gate into MISSION.md and HOLD it: every 🔴/🟠 across both audits closed (V2-F1/F2 included), suite green, CI green, Lighthouse ≥90s, master drill checklist all-PASS (8am brief included by now), credentials-in-password-manager confirmed (V2-F6), docs drift-swept, GATE-76 convergence proof on file. Any unmet line = the gate stays shut; report what's missing.
- **99:** ⛳ **CHECKPOINT — v1.0.0:** on GO, tag `v1.0.0`, push the tag, write honest release notes (what it is, what it deliberately isn't), and have Kevin export + archive a backup of the moment.
- **100:** declare the 30-day soak OPEN in the Wave Log — zero new features until it ends. The metric: *open every day → trust what I see → capture instantly → close without anxiety.*

## Final report format

(1) Phase 0 drill results table + GATE-76 precondition verdict · (2) GATE-76 implementation status + fmt:3 convergence result + digest field list + opt-ins default OFF confirmed · (3) item 64 cleared · (4) W9 items shipped, the three Kevin-decisions as recorded (schema, license, video), Lighthouse scores · (5) W10 gate line-by-line verdict · (6) commits/pushes/deploys made (each with its GO) · (7) full remaining MANUAL/KEVIN list · (8) exact next task.

A verified stop at any phase beats an unverified finish. Begin with the Required Reading, step 1. LFG. 🐐
