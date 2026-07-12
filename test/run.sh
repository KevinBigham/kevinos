#!/bin/sh
# KevinOS test runner (W1 item 29). Run from the repo root: sh test/run.sh
# Static checks first, then every suite in sequence. Any failure stops the run.
set -e
cd "$(dirname "$0")/.."

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
node test/capture.test.js
node test/merge.test.js
node test/portable.test.js
node test/ics.test.js
node test/recurrence.test.js
node test/streaks.test.js
node test/convergence.test.js

echo "── relay suites ───────────────────────────────"
node relay/test/route-auth.test.js
node relay/test/sync-push.test.js

echo "───────────────────────────────────────────────"
echo "ALL GREEN ✓"
