#!/usr/bin/env bash
# scripts/check-loc.sh — Roofsteel LoC discipline check + iteration-over-iteration
# history log.
#
# Rule (AGENTS.md / CLAUDE.md, ADR-004 in docs/DECISIONS.md):
#   - 250-850 LoC average per logic-bearing file
#   - 1,800 LoC hard cap per file
#
# Usage:
#   scripts/check-loc.sh            # human-readable report + append to history
#   scripts/check-loc.sh --quiet    # summary line only (for CI logs)
#
# Exit code is non-zero if any file exceeds the hard cap — wire this into CI
# (.github/workflows/ci.yml already does) so a PR can't merge a file that
# blows the cap without the check being visibly red.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

HARD_CAP=1800
AVG_MIN=250
AVG_MAX=850
LOG_FILE="docs/loc-history.log"
QUIET=false
[ "${1:-}" = "--quiet" ] && QUIET=true

# Logic-bearing source files only — real application code, not generated
# output, not the seed data JSON, not config.
FILES=$(find apps packages -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.py" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/.next/*" \
  -not -name "*.d.ts" \
  | sort)

TOTAL_LOC=0
FILE_COUNT=0
VIOLATIONS=""

if [ "$QUIET" = false ]; then
  echo "Roofsteel LoC Report — $(date -u +"%Y-%m-%d %H:%M UTC")"
  echo "-----------------------------------------------------------------"
  printf "%-65s %8s\n" "File" "LoC"
fi

for f in $FILES; do
  loc=$(wc -l < "$f" | tr -d ' ')
  TOTAL_LOC=$((TOTAL_LOC + loc))
  FILE_COUNT=$((FILE_COUNT + 1))
  if [ "$QUIET" = false ]; then
    printf "%-65s %8s\n" "$f" "$loc"
  fi
  if [ "$loc" -gt "$HARD_CAP" ]; then
    VIOLATIONS="${VIOLATIONS}  - $f: $loc LoC (exceeds $HARD_CAP hard cap)\n"
  fi
done

if [ "$FILE_COUNT" -eq 0 ]; then
  echo "No source files found under apps/ or packages/."
  exit 0
fi

AVG_LOC=$((TOTAL_LOC / FILE_COUNT))
VIOLATION_COUNT=0
if [ -n "$VIOLATIONS" ]; then
  VIOLATION_COUNT=$(echo -e "$VIOLATIONS" | grep -c "^  -")
fi

if [ "$QUIET" = false ]; then
  echo "-----------------------------------------------------------------"
fi
echo "Files: $FILE_COUNT   Total LoC: $TOTAL_LOC   Average LoC/file: $AVG_LOC   Hard-cap violations: $VIOLATION_COUNT"

EXIT_CODE=0

if [ -n "$VIOLATIONS" ]; then
  echo ""
  echo "HARD CAP VIOLATIONS (> $HARD_CAP LoC) — split these files before merging:"
  echo -e "$VIOLATIONS"
  EXIT_CODE=1
fi

if [ "$QUIET" = false ] && { [ "$AVG_LOC" -lt "$AVG_MIN" ] || [ "$AVG_LOC" -gt "$AVG_MAX" ]; }; then
  echo "NOTE: average LoC/file ($AVG_LOC) is outside the target range ($AVG_MIN-$AVG_MAX)."
  echo "Not a hard failure by itself. Early in the project, with mostly small scaffold"
  echo "files, a low average is expected — this is a prompt to look, not an automatic problem."
fi

# Append one row per run to the historical log, so LoC growth is visible
# iteration over iteration, not just as a single point-in-time snapshot.
mkdir -p docs
if [ ! -f "$LOG_FILE" ]; then
  echo "timestamp,files,total_loc,avg_loc,hard_cap_violations" > "$LOG_FILE"
fi
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"),$FILE_COUNT,$TOTAL_LOC,$AVG_LOC,$VIOLATION_COUNT" >> "$LOG_FILE"

if [ "$QUIET" = false ]; then
  echo ""
  echo "Logged to $LOG_FILE"
fi

exit $EXIT_CODE
