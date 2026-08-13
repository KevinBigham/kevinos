#!/bin/sh
# KevinOS v40 personalization + AI-fabric gate runner.
# Run from anywhere: sh tools/run-evolution-gates.sh baseline|structure|wave|preactivation|final
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
MODE=${1:-wave}
case "$MODE" in
  baseline|structure|wave) CHECK_MODE=structure ;;
  preactivation) CHECK_MODE=preactivation ;;
  final) CHECK_MODE=final ;;
  *)
    echo "usage: sh tools/run-evolution-gates.sh baseline|structure|wave|preactivation|final" >&2
    exit 2
    ;;
esac

STAMP=$(date -u +"%Y%m%dT%H%M%SZ")
OUT="$ROOT/output/evolution"
LOG="$OUT/${MODE}-${STAMP}.log"
TMP="${TMPDIR:-/tmp}/kevinos-evolution-${MODE}-${STAMP}.$$"
mkdir -p "$OUT"

cleanup() { rm -f "$TMP"; }
trap cleanup EXIT HUP INT TERM

if (
  cd "$ROOT"
  echo "KevinOS evolution gate mode: $MODE"
  echo "UTC start: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "── mission state ──────────────────────────────"
  node tools/check-evolution-state.js --mode "$CHECK_MODE"
  echo "── secret-value boundary ──────────────────────"
  node tools/scan-secret-values.js
  echo "── repository doctor ──────────────────────────"
  node tools/doctor.js
  echo "── complete test suite ────────────────────────"
  sh test/run.sh
  echo "UTC end: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "EVOLUTION GATE PASS"
) >"$TMP" 2>&1; then
  cat "$TMP" | tee "$LOG"
  echo "Evidence log: $LOG"
  exit 0
else
  STATUS=$?
  cat "$TMP" | tee "$LOG" >&2
  echo "EVOLUTION GATE FAIL (exit $STATUS)" >&2
  echo "Evidence log: $LOG" >&2
  exit "$STATUS"
fi
