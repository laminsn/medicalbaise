#!/usr/bin/env bash
# check-schema-parity.sh
#
# Casa Baise, Medical Baise and Legal Baise share ONE Supabase project
# (xpcoaedbfmtyzvkwhaav). Anything schema-shaped must therefore be identical in
# all three checkouts, or the apps silently disagree about the database.
#
# This intentionally polices only files created from 2026-07-30 onward. Older
# migrations are historical and were never applied to the live database — see
# supabase/migrations/README.md. Trying to make those agree is a trap.
#
# Usage:  ./scripts/check-schema-parity.sh [apps-root]
# Exit:   0 = in parity, 1 = drift detected, 2 = setup problem

set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
REPOS=("Casa-Baise" "Legal-Baise" "medicalbaise")
CUTOFF="20260730"
FAILED=0

hash_file() {
  if command -v md5sum >/dev/null 2>&1; then md5sum "$1" | awk '{print $1}'
  else md5 -q "$1"; fi
}

for r in "${REPOS[@]}"; do
  if [[ ! -d "$ROOT/$r" ]]; then
    echo "SETUP ERROR: missing repo $ROOT/$r" >&2
    exit 2
  fi
done

echo "Schema parity check across: ${REPOS[*]}"
echo "Root: $ROOT"
echo

# --- 1. generated database types ------------------------------------------
REL="src/integrations/supabase/types.ts"
echo "== $REL =="
BASE_HASH="$(hash_file "$ROOT/${REPOS[0]}/$REL")"
for r in "${REPOS[@]}"; do
  h="$(hash_file "$ROOT/$r/$REL")"
  if [[ "$h" == "$BASE_HASH" ]]; then
    printf '   ok    %-14s %s\n' "$r" "$h"
  else
    printf '   DRIFT %-14s %s\n' "$r" "$h"; FAILED=1
  fi
done
echo

# --- 2. migrations dated >= CUTOFF ----------------------------------------
echo "== supabase/migrations (>= $CUTOFF) =="
# NOTE: `mapfile` is bash 4+; macOS ships bash 3.2. Use a portable read loop.
MIGRATIONS=""
while IFS= read -r line; do
  MIGRATIONS="${MIGRATIONS}${line}"$'\n'
done < <(
  for r in "${REPOS[@]}"; do
    find "$ROOT/$r/supabase/migrations" -maxdepth 1 -name '*.sql' -exec basename {} \; 2>/dev/null
  done | sort -u | awk -v c="$CUTOFF" 'substr($0,1,8) >= c'
)

if [[ -z "$(printf '%s' "$MIGRATIONS" | tr -d '[:space:]')" ]]; then
  echo "   (none yet)"
else
  while IFS= read -r m; do
    [[ -z "$m" ]] && continue
    ref=""; drift=0; missing=0
    for r in "${REPOS[@]}"; do
      f="$ROOT/$r/supabase/migrations/$m"
      if [[ ! -f "$f" ]]; then missing=1; continue; fi
      h="$(hash_file "$f")"
      if [[ -z "$ref" ]]; then ref="$h"; elif [[ "$h" != "$ref" ]]; then drift=1; fi
    done
    if [[ $missing -eq 1 ]]; then
      printf '   MISSING %s (not present in every repo)\n' "$m"; FAILED=1
    elif [[ $drift -eq 1 ]]; then
      printf '   DRIFT   %s\n' "$m"; FAILED=1
    else
      printf '   ok      %s\n' "$m"
    fi
  done <<< "$MIGRATIONS"
fi
echo

if [[ $FAILED -ne 0 ]]; then
  cat >&2 <<'MSG'
FAIL: schema drift detected.

One shared database means these files must be byte-identical. Author the change
once, then copy it to all three repos before committing. Regenerate types.ts once
and copy the same file to all three.
MSG
  exit 1
fi

echo "PASS: all three repos agree on schema-shaped files."
