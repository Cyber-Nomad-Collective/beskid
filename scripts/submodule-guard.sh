#!/usr/bin/env bash
# Submodule guard — visibility + push-order checklist for nested repos.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
MODE="status"
for a in "$@"; do
  case "$a" in
    --push) MODE="push" ;;
    --summary) MODE="summary" ;;
    -h|--help) sed -n '3,6p' "$0"; exit 0 ;;
    *) echo "unknown arg: $a" >&2; exit 1 ;;
  esac
done
RED='[0;31m'; GREEN='[0;32m'; YELLOW='[1;33m'; NC='[0m'
ISSUES=0
check_repo() {
  local dir="$1" label="$2"
  pushd "$dir" >/dev/null
  local dirty=""; dirty=$(git status --porcelain 2>/dev/null) || true
  local branch; branch=$(git branch --show-current 2>/dev/null) || true
  local ahead=0
  if [[ -n "$branch" ]]; then
    ahead=$(git rev-list --count "@{u}..HEAD" 2>/dev/null || echo "?")
  fi
  if [[ -n "$dirty" ]]; then
    echo -e "  ${RED}✗ DIRTY${NC}  $label  ${YELLOW}[$branch]${NC}"
    if [[ "$MODE" != "summary" ]]; then git status -sb | sed 's/^/    /'; fi
    ISSUES=$((ISSUES + 1))
  elif [[ "$ahead" != "0" && "$ahead" != "?" ]]; then
    echo -e "  ${YELLOW}○ AHEAD $ahead${NC}  $label  [${branch}]"
  else
    echo -e "  ${GREEN}✓ clean${NC}    $label  [${branch}]"
  fi
  popd >/dev/null
}
echo "=== beskid submodule guard ==="
echo "root: $ROOT"; echo ""
check_repo "$ROOT" "(superrepo)"
if [[ -f .gitmodules ]]; then
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue
    if [[ -d "$path/.git" || -f "$path/.git" ]]; then
      check_repo "$path" "$path"
    fi
  done < <(git submodule foreach --recursive --quiet 'pwd' 2>/dev/null | while IFS= read -r p; do d=$(printf '%s' "$p" | tr -cd '/' | wc -c | tr -d ' '); printf '%s %s
' "$d" "$p"; done | sort -t' ' -k1,1nr | cut -d' ' -f2-)
fi
echo ""
if [[ $ISSUES -eq 0 ]]; then echo -e "${GREEN}All repos clean.${NC}"; else echo -e "${RED}${ISSUES} repo(s) dirty or ahead.${NC}"; fi
if [[ "$MODE" == "push" ]]; then
  echo ""; echo "=== push order (deepest first) ==="
  if [[ -f .gitmodules ]]; then
    git submodule foreach --recursive --quiet 'pwd' 2>/dev/null | while IFS= read -r p; do d=$(printf '%s' "$p" | tr -cd '/' | wc -c | tr -d ' '); printf '%s %s
' "$d" "$p"; done | sort -t' ' -k1,1nr | cut -d' ' -f2- | while IFS= read -r p; do echo "  1. $p"; done
  fi
  echo "  N. $(pwd)  (superrepo last)"
  echo ""; echo "Tip: scripts/git-commit-push-recursive.sh 'message' does this automatically."
fi
