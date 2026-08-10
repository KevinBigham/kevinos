---
name: kevinos-release
description: Verify and prepare a KevinOS release without pushing or deploying.
---

# KevinOS release procedure

Confirm app/footer/cache versions and schema migration discipline. Run `node tools/doctor.js` and `sh test/run.sh`. Check backup/import, snapshots, sync/convergence, relay auth, secret patterns, and browser console. Record mobile 320/390/430, tablet 768, and desktop evidence. Separate machine/manual/unverified status. Do not push, deploy, mutate secrets, or cross GATE-76 without explicit approval.
