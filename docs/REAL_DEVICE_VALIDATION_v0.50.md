# KevinOS v0.50 real-device validation

Use this checklist on Kevin's installed iPhone PWA. It should take about 10 minutes. Do not convert a desktop mobile viewport into a device pass.

Record each result as `PASS`, `FAIL`, or `NOT TESTED`, then add one short friction note when useful.

## Test record

- Device:
- iOS version:
- Installed PWA or Safari:
- Date/time:
- Tester:

## Checklist

| Check | Exact expected behavior | Result | Friction note |
|---|---|---|---|
| Launch from Home Screen | KevinOS opens without normal Safari browser chrome. | NOT TESTED | |
| Release identity | Footer reports `KevinOS v0.50`. | NOT TESTED | |
| First use or restore | A fresh device clearly offers Restore, Start clean, or isolated demo; no sample data enters normal state silently. | NOT TESTED | |
| NOW clarity | Today immediately names the outcome and next physical action; system and AI support remain secondary. | NOT TESTED | |
| Fast Capture | Capture is visible, opens Quick text first, and accepts an item in under 10 seconds. | NOT TESTED | |
| Long task | A deliberately long title wraps; completion and overflow controls remain reachable and at least 44px. | NOT TESTED | |
| Offline launch | After one online load, airplane mode still opens the app shell and existing local state. | NOT TESTED | |
| Push notification | `Send test` produces one KevinOS notification on this phone. | NOT TESTED | |
| GitHub connection | GitHub shows connection status and can perform a read-only identity/repository refresh without exposing a token. | NOT TESTED | |
| Google connection, optional | Email or Calendar shows connection status without sending mail or creating an event. | NOT TESTED | |
| Two-device sync | A uniquely named synthetic task appears on device B, a completion/deletion returns to device A, and no tombstoned item resurrects. | NOT TESTED | |
| Backup export | Footer export produces a readable JSON backup without live connection credentials. | NOT TESTED | |
| Recovery reminder | Backup/sync status and any deferred-recovery reminder are understandable. | NOT TESTED | |
| Data integrity | Existing real records remain present, unduplicated, and unchanged after the synthetic checks. | NOT TESTED | |

## Safe cleanup

Remove only the uniquely named synthetic task and any disposable test records created during this checklist. Do not disconnect accounts, rotate credentials, or alter real synced data for the sake of a receipt.

## Decision

- Overall: `NOT TESTED`
- P0/P1 issue found:
- Follow-up owner/action:
