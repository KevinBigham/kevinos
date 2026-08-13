#!/bin/sh
# Silent, local-only KevinOS provider credential entry. Never pass keys as arguments.
set -eu

ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
TARGET="$ROOT/relay/.dev.vars"
umask 077

provider_label() {
  case "$1" in
    GROQ_API_KEY) printf '%s' 'Groq (core)' ;;
    MISTRAL_API_KEY) printf '%s' 'Mistral (core)' ;;
    GEMINI_API_KEY) printf '%s' 'Gemini (core)' ;;
    COHERE_API_KEY) printf '%s' 'Cohere (optional)' ;;
    OPENROUTER_API_KEY) printf '%s' 'OpenRouter (optional)' ;;
    SAMBANOVA_API_KEY) printf '%s' 'SambaNova (optional)' ;;
    NVIDIA_API_KEY) printf '%s' 'NVIDIA NIM (optional)' ;;
  esac
}

configured() {
  [ -f "$TARGET" ] || return 1
  awk -F= -v key="$1" '$1==key && length(substr($0,index($0,"=")+1))>0 {found=1} END{exit !found}' "$TARGET"
}

write_name() {
  name=$1
  value=$2
  dir=$(dirname "$TARGET")
  mkdir -p "$dir"
  tmp=$(mktemp "$dir/.dev.vars.tmp.XXXXXX")
  found=0
  if [ -f "$TARGET" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      case "$line" in
        "$name"=*)
          if [ "$found" -eq 0 ]; then printf '%s=%s\n' "$name" "$value" >>"$tmp"; found=1; fi
          ;;
        *) printf '%s\n' "$line" >>"$tmp" ;;
      esac
    done <"$TARGET"
  fi
  if [ "$found" -eq 0 ]; then printf '%s=%s\n' "$name" "$value" >>"$tmp"; fi
  chmod 600 "$tmp"
  mv -f "$tmp" "$TARGET"
  chmod 600 "$TARGET"
}

ensure_policy_defaults() {
  [ -f "$TARGET" ] || : >"$TARGET"
  chmod 600 "$TARGET"
  for row in \
    'AI_ALLOW_PAID=false' \
    'AI_ENABLED_PROVIDERS=' \
    'AI_FREE_VERIFIED_MODELS=' \
    'AI_MAX_FALLBACK_HOPS=2' \
    'AI_MAX_RETRIES_PER_PROVIDER=1' \
    'GROQ_DAILY_CEILING=900' \
    'MISTRAL_DAILY_CEILING=200' \
    'GEMINI_DAILY_CEILING=100' \
    'CLOUDFLARE_DAILY_CEILING=8500' \
    'COHERE_DAILY_CEILING=25' \
    'OPENROUTER_DAILY_CEILING=40' \
    'SAMBANOVA_DAILY_CEILING=18' \
    'NVIDIA_DAILY_CEILING=20'
  do
    name=${row%%=*}
    if ! grep -q "^${name}=" "$TARGET"; then write_name "$name" "${row#*=}"; fi
  done
}

validate_key() {
  value=$1
  [ ${#value} -ge 12 ] || return 1
  case "$value" in *[![:graph:]]*) return 1 ;; esac
  return 0
}

prompt_provider() {
  name=$1
  label=$(provider_label "$name")
  state='not configured'
  if configured "$name"; then state='configured'; fi
  printf '\n%s is %s. [s]kip, [u]pdate/rotate, [x]revoke local: ' "$label" "$state"
  IFS= read -r action
  case "$action" in
    u|U|r|R)
      printf 'Enter %s silently: ' "$label"
      old_tty=$(stty -g)
      trap 'stty "$old_tty" 2>/dev/null || true; exit 130' HUP INT TERM
      trap 'stty "$old_tty" 2>/dev/null || true' EXIT
      stty -echo
      IFS= read -r value
      stty "$old_tty"
      trap - HUP INT TERM EXIT
      printf '\n'
      if ! validate_key "$value"; then
        value=''
        printf '%s\n' 'Rejected: expected one non-whitespace value of at least 12 characters.' >&2
        return 1
      fi
      write_name "$name" "$value"
      value=''
      printf '%s\n' 'Stored locally with mode 600. Provider remains disabled until redacted verification and policy confirmation.'
      ;;
    x|X)
      write_name "$name" ''
      printf '%s\n' 'Local value removed. Revoke the old credential in the provider console.'
      ;;
    *) printf '%s\n' 'Skipped.' ;;
  esac
}

self_test() {
  test_dir=$(mktemp -d "${TMPDIR:-/tmp}/kevinos-credential-test.XXXXXX")
  trap 'rm -rf "$test_dir"' EXIT HUP INT TERM
  TARGET="$test_dir/.dev.vars"
  ensure_policy_defaults
  write_name UNRELATED_FIXTURE keep-me
  write_name GROQ_API_KEY fixture-one-safe
  write_name GROQ_API_KEY fixture-two-rotated
  configured GROQ_API_KEY
  write_name GROQ_API_KEY ''
  if configured GROQ_API_KEY; then printf '%s\n' 'self-test failed: revoke' >&2; exit 1; fi
  grep -q '^UNRELATED_FIXTURE=keep-me$' "$TARGET"
  write_name MISTRAL_API_KEY fixture-mistral-safe
  write_name GROQ_API_KEY fixture-groq-safe
  write_name GEMINI_API_KEY fixture-gemini-safe
  record_core_confirmations >/dev/null
  stage_core_policy 'groq,mistral,gemini' >/dev/null
  grep -q '^AI_ALLOW_PAID=false$' "$TARGET"
  grep -q '^AI_ENABLED_PROVIDERS=groq,mistral,gemini$' "$TARGET"
  grep -q '^AI_FREE_VERIFIED_MODELS=groq:openai/gpt-oss-20b,mistral:mistral-small-latest,gemini:gemini-flash-latest$' "$TARGET"
  grep -q '^GROQ_ZDR_CONFIRMED=1$' "$TARGET"
  grep -q '^MISTRAL_FREE_MODE_CONFIRMED=1$' "$TARGET"
  grep -q '^GEMINI_FREE_DATA_USE_ACKNOWLEDGED=1$' "$TARGET"
  # Node gives one portable permission value. GNU `stat -f` can print partial
  # filesystem output before its BSD-style format operand fails, which made
  # the command-substitution fallback produce a multi-line value in Linux CI.
  mode=$(node -e 'var fs=require("fs"); process.stdout.write(((fs.statSync(process.argv[1]).mode & 511).toString(8)));' "$TARGET")
  [ "$mode" = 600 ]
  result=$(KEVINOS_PROVIDER_CONFIG_FILE="$TARGET" node "$ROOT/tools/verify-ai-provider-config.js" --redacted)
  printf '%s' "$result" | grep -q 'Mistral.*CONFIGURED'
  if printf '%s' "$result" | grep -q 'fixture-'; then printf '%s\n' 'self-test failed: redaction' >&2; exit 1; fi
  printf '%s\n' 'credential ceremony self-test ok — create, preserve, rotate, revoke, permissions, redaction, and core policy staging'
}

stage_core_policy() {
  requested=$1
  enabled=''
  verified=''
  seen_groq=0
  seen_mistral=0
  seen_gemini=0
  old_ifs=$IFS
  IFS=,
  set -- $requested
  IFS=$old_ifs
  [ "$requested" != 'none' ] || set --
  for provider in "$@"; do
    case "$provider" in
      groq)
        [ "$seen_groq" -eq 0 ] || { printf '%s\n' 'Duplicate core provider.' >&2; exit 2; }
        seen_groq=1; key=GROQ_API_KEY; model='openai/gpt-oss-20b' ;;
      mistral)
        [ "$seen_mistral" -eq 0 ] || { printf '%s\n' 'Duplicate core provider.' >&2; exit 2; }
        seen_mistral=1; key=MISTRAL_API_KEY; model='mistral-small-latest' ;;
      gemini)
        [ "$seen_gemini" -eq 0 ] || { printf '%s\n' 'Duplicate core provider.' >&2; exit 2; }
        seen_gemini=1; key=GEMINI_API_KEY; model='gemini-flash-latest' ;;
      *) printf '%s\n' 'Core policy accepts only groq, mistral, gemini, or none.' >&2; exit 2 ;;
    esac
    configured "$key" || { printf '%s is not configured; policy was not changed.\n' "$(provider_label "$key")" >&2; exit 1; }
    if [ -n "$enabled" ]; then enabled="$enabled,$provider"; verified="$verified,$provider:$model"; else enabled=$provider; verified="$provider:$model"; fi
  done
  ensure_policy_defaults
  write_name AI_ALLOW_PAID false
  write_name AI_ENABLED_PROVIDERS "$enabled"
  write_name AI_FREE_VERIFIED_MODELS "$verified"
  printf 'Staged local core policy: providers=%s; paid=false; credentials remain redacted.\n' "${enabled:-none}"
}

record_core_confirmations() {
  ensure_policy_defaults
  write_name GROQ_ZDR_CONFIRMED 1
  write_name MISTRAL_FREE_MODE_CONFIRMED 1
  write_name GEMINI_FREE_DATA_USE_ACKNOWLEDGED 1
  printf '%s\n' 'Recorded the three explicit core account confirmations; no provider route was changed.'
}

case "${1:-}" in
  --self-test) [ $# -eq 1 ] || { printf '%s\n' 'No key values may be passed as arguments.' >&2; exit 2; }; self_test; exit 0 ;;
  --record-core-confirmations) [ $# -eq 1 ] || { printf '%s\n' 'No values may be passed to the fixed confirmation recorder.' >&2; exit 2; }; record_core_confirmations; exit 0 ;;
  --stage-core-policy) [ $# -eq 2 ] || { printf '%s\n' 'Usage: sh tools/credential-ceremony.sh --stage-core-policy groq,mistral,gemini' >&2; exit 2; }; ensure_policy_defaults; stage_core_policy "$2"; exit 0 ;;
  --help) printf '%s\n' 'Usage: sh tools/credential-ceremony.sh' '       sh tools/credential-ceremony.sh --record-core-confirmations' '       sh tools/credential-ceremony.sh --stage-core-policy groq,mistral,gemini' 'Keys are entered silently in an interactive terminal. Never paste them into chat.'; exit 0 ;;
  '') ;;
  *) printf '%s\n' 'No key values or unsupported arguments are permitted.' >&2; exit 2 ;;
esac

[ -t 0 ] && [ -t 1 ] || { printf '%s\n' 'Run this script directly in an interactive terminal.' >&2; exit 2; }
ensure_policy_defaults
printf '%s\n' \
  'KevinOS local credential ceremony' \
  'Values are silent, local-only, mode 600, and never enable a provider automatically.' \
  'Use skip freely. Workers AI has no API key and remains a separate binding/authorization step.'

for name in GROQ_API_KEY MISTRAL_API_KEY GEMINI_API_KEY COHERE_API_KEY OPENROUTER_API_KEY SAMBANOVA_API_KEY NVIDIA_API_KEY; do
  prompt_provider "$name"
done

printf '\n%s\n' 'Entry complete. No provider was contacted. Next run:'
printf '%s\n' 'node tools/verify-ai-provider-config.js --redacted'
printf '%s\n' 'Do not enable routes until free eligibility, model, and required data controls are confirmed.'
