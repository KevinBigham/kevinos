#!/bin/sh
# KevinOS test runner (W1 item 29). Run from the repo root: sh test/run.sh
# Static checks first, then every suite in sequence. Any failure stops the run.
set -e
cd "$(dirname "$0")/.."

echo "── repository doctor ──────────────────────────"
node tools/doctor.js

echo "── static checks ──────────────────────────────"
awk '/<script>/{flag=1;next}/<\/script>/{flag=0}flag' index.html > /tmp/kevinos-index-script.js
node --check /tmp/kevinos-index-script.js
node --check sw.js
node --check relay/worker.js
echo "syntax ok (app script, sw.js, worker.js)"

echo "── ES5 contraband scan (app script) ───────────"
# The whole extracted script must stay ES5: no arrows, template literals,
# const/let declarations, or async/await anywhere in index.html's script.
# (const/let are matched at statement positions so UI copy like "let go"
# doesn't false-positive; the stricter per-diff scan still runs in review.)
if grep -nE '=>|`|(^|[;{}(])[[:space:]]*(const|let)[[:space:]]+[A-Za-z_$]|\basync[[:space:]]+function|\bawait[[:space:]]' /tmp/kevinos-index-script.js; then
  echo "ES5 CONTRABAND FOUND in index.html script — fix before committing." >&2
  exit 1
fi
echo "es5 clean"

echo "── app suites ─────────────────────────────────"
node test/app-logic.test.js
node test/task-normalization.test.js
node test/schema-v40.test.js
node test/project-spine.test.js
node test/commitment-contract.test.js
node test/role-aware-today.test.js
node test/wip-governor.test.js
node test/playbooks-onboarding.test.js
node test/studio-command.test.js
node test/ai-fabric-client.test.js
node test/supporting-surfaces.test.js
node test/attention-proof.test.js
node test/ui-contract.test.js
node test/xss-corpus.test.js
node test/capture.test.js
node test/operations.test.js
node test/friction.test.js
node test/conflicts.test.js
node test/merge.test.js
node test/portable.test.js
node test/ics.test.js
node test/recurrence.test.js
node test/streaks.test.js
node test/convergence.test.js
node test/sync-reference.test.js

echo "── relay suites ───────────────────────────────"
node relay/test/route-auth.test.js
node relay/test/sync-push.test.js
node relay/test/lane-pins.test.js
node relay/test/length-control.test.js
node relay/test/inbox-intelligence.test.js
node relay/test/ai-fabric.test.js
node relay/test/security-boundaries.test.js
sh tools/credential-ceremony.sh --self-test
node tools/probe-ai-provider.js --self-test

echo "───────────────────────────────────────────────"
echo "ALL GREEN ✓"
