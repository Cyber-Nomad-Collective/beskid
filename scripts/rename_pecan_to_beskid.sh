#!/usr/bin/env bash
set -euo pipefail

# Rename migration script:
# - Replaces content occurrences: beskid/Beskid/BESKID -> beskid/Beskid/BESKID
# - Replaces extension references in content: .bd -> .bd
# - Renames files/dirs containing beskid/Beskid/BESKID
# - Renames file extensions: .bd -> .bd
#
# Safety model:
# - Dry run by default
# - Use --apply to execute changes
#
# Usage:
#   bash scripts/rename_beskid_to_beskid.sh           # preview only
#   bash scripts/rename_beskid_to_beskid.sh --apply   # perform rename

APPLY=0
if [[ "${1:-}" == "--apply" ]]; then
  APPLY=1
elif [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage:
  bash scripts/rename_beskid_to_beskid.sh           # dry run
  bash scripts/rename_beskid_to_beskid.sh --apply   # apply changes
EOF
  exit 0
elif [[ $# -gt 0 ]]; then
  echo "Unknown argument: $1" >&2
  exit 1
fi

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

echo "Repository root: $ROOT_DIR"
if [[ $APPLY -eq 0 ]]; then
  echo "Mode: DRY RUN (no files will be modified)"
else
  echo "Mode: APPLY (files will be modified)"
fi

# Exclude VCS and build output.
FIND_EXCLUDES=(
  -not -path './.git'
  -not -path './.git/*'
  -not -path './target'
  -not -path './target/*'
)

is_text_file() {
  local f="$1"
  [[ -f "$f" ]] || return 1
  grep -Iq . "$f"
}

replace_content_in_file() {
  local f="$1"

  # Quick pre-check to avoid unnecessary writes.
  if ! grep -qE 'beskid|Beskid|BESKID|\.bd\b' "$f"; then
    return 0
  fi

  if [[ $APPLY -eq 0 ]]; then
    echo "[content] $f"
    return 0
  fi

  perl -i -pe '
    s/BESKID/BESKID/g;
    s/Beskid/Beskid/g;
    s/beskid/beskid/g;
    s/\.bd\b/.bd/g;
  ' "$f"
}

rename_path_if_needed() {
  local old="$1"
  local new="$old"

  new="${new//BESKID/BESKID}"
  new="${new//Beskid/Beskid}"
  new="${new//beskid/beskid}"

  if [[ "$new" == *.bd ]]; then
    new="${new%.bd}.bd"
  fi

  if [[ "$old" == "$new" ]]; then
    return 0
  fi

  if [[ $APPLY -eq 0 ]]; then
    echo "[rename] $old -> $new"
    return 0
  fi

  if [[ -e "$new" ]]; then
    echo "ERROR: target already exists, cannot rename: $old -> $new" >&2
    exit 1
  fi

  mv "$old" "$new"
}

# 1) Content updates (text files only).
while IFS= read -r -d '' file; do
  if is_text_file "$file"; then
    replace_content_in_file "$file"
  fi
done < <(find . "${FIND_EXCLUDES[@]}" -type f -print0)

# 2) Path renames (depth-first so children are handled before parent dirs).
# 2a) Rename directories first so file-level destination parents exist.
while IFS= read -r -d '' path; do
  rename_path_if_needed "$path"
done < <(find . -depth "${FIND_EXCLUDES[@]}" \
  -type d \
  \( -name '*beskid*' -o -name '*Beskid*' -o -name '*BESKID*' \) \
  -not -path './scripts/rename_beskid_to_beskid.sh' \
  -print0)

# 2b) Rename files after directory structure has stabilized.
while IFS= read -r -d '' path; do
  rename_path_if_needed "$path"
done < <(find . "${FIND_EXCLUDES[@]}" \
  -type f \
  \( -name '*beskid*' -o -name '*Beskid*' -o -name '*BESKID*' -o -name '*.bd' \) \
  -not -path './scripts/rename_beskid_to_beskid.sh' \
  -print0)

echo
if [[ $APPLY -eq 0 ]]; then
  echo "Dry run complete."
  echo "Run with --apply to execute changes."
else
  echo "Rename complete."
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo
    echo "Changed files:"
    git status --short
  fi
fi
