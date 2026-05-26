#!/usr/bin/env bash
# Stage, commit, and push every dirty git repo in the current superproject tree
# (nested submodules deepest-first, then the root). Intended for Beskid's
# multi-repo layout; pair with scripts/lazygit/config.yml in lazygit.
set -euo pipefail

usage() {
	cat <<'EOF'
Usage: git-commit-push-recursive.sh [options] [message]

Walks all initialized submodules (recursive, deepest first), then the
superproject. For each repo with changes: git add -A, commit, push.

Options:
  -n, --dry-run    Show what would run; do not commit or push
  --no-push        Commit only; skip push
  -h, --help       Show this help

If message is omitted, prompts on a TTY (lazygit should pass one via -m).
EOF
}

MESSAGE=""
DRY_RUN=false
NO_PUSH=false

while [[ $# -gt 0 ]]; do
	case "$1" in
	-n | --dry-run)
		DRY_RUN=true
		shift
		;;
	--no-push)
		NO_PUSH=true
		shift
		;;
	-h | --help)
		usage
		exit 0
		;;
	-*)
		echo "Unknown option: $1" >&2
		usage >&2
		exit 1
		;;
	*)
		if [[ -n "$MESSAGE" ]]; then
			echo "Unexpected extra argument: $1" >&2
			exit 1
		fi
		MESSAGE="$1"
		shift
		;;
	esac
done

if [[ -z "$MESSAGE" ]]; then
	if [[ -t 0 ]]; then
		read -r -p "Commit message (all dirty repos): " MESSAGE
	else
		echo "error: commit message required (non-interactive)" >&2
		exit 1
	fi
fi

if [[ -z "${MESSAGE//[[:space:]]/}" ]]; then
	echo "error: empty commit message" >&2
	exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	echo "error: not inside a git repository" >&2
	exit 1
fi

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

repos=()
if [[ -f .gitmodules ]]; then
	while IFS= read -r path; do
		[[ -n "$path" ]] || continue
		if [[ -d "$path/.git" || -f "$path/.git" ]]; then
			repos+=("$(cd "$path" && pwd)")
		fi
	done < <(
		git submodule foreach --recursive --quiet 'pwd' 2>/dev/null \
			| while IFS= read -r p; do
				depth=$(printf '%s' "$p" | tr -cd '/' | wc -c | tr -d ' ')
				printf '%s %s\n' "$depth" "$p"
			done | sort -t' ' -k1,1nr | cut -d' ' -f2-
	)
fi
repos+=("$ROOT")

commit_and_maybe_push() {
	local dir="$1"
	local name
	name="$(basename "$dir")"
	[[ "$dir" != "$ROOT" ]] || name="(superrepo)"

	cd "$dir"

	if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
		cd "$ROOT"
		return 0
	fi

	if ! git symbolic-ref -q HEAD >/dev/null 2>&1; then
		echo "skip $name: detached HEAD ($dir)"
		cd "$ROOT"
		return 0
	fi

	if [[ -z "$(git status --porcelain)" ]]; then
		echo "clean $name"
		cd "$ROOT"
		return 0
	fi

	echo ""
	echo "=== $name ==="
	echo "    $dir"

	if [[ "$DRY_RUN" == true ]]; then
		git status -sb
		cd "$ROOT"
		return 0
	fi

	git add -A
	if git diff --cached --quiet; then
		echo "    (nothing staged after add -A)"
		cd "$ROOT"
		return 0
	fi

	git commit -m "$MESSAGE"

	if [[ "$NO_PUSH" == true ]]; then
		echo "    committed (push skipped)"
		cd "$ROOT"
		return 0
	fi

	branch="$(git branch --show-current)"
	if git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
		git push
		echo "    pushed $branch"
	else
		echo "    warn: no upstream for branch '$branch' — committed locally only" >&2
	fi

	cd "$ROOT"
}

echo "root: $ROOT"
echo "message: $MESSAGE"
[[ "$DRY_RUN" == true ]] && echo "(dry run)"
[[ "$NO_PUSH" == true ]] && echo "(no push)"

for dir in "${repos[@]}"; do
	commit_and_maybe_push "$dir"
done

echo ""
echo "done."
