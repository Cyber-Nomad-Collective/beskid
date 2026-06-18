#!/usr/bin/env bash
# Resolve the rolling CLI/LSP semver for a release build.
#
# Ported from the Dagger function resolveCliVersion() / computeCliVersion() in
# beskid_infra/dagger/src/compiler-release.ts (itself a port of the former
# compiler/ci/version.py). On a semver tag, the tag wins; on main, the version
# is MAJOR.MINOR.(PATCH + commits-since-last-semver-tag), or
# MAJOR.MINOR.(PATCH + run-number) when no tag exists yet.
#
# Usage: compute-cli-version.sh
# Env: GITHUB_REF, GITHUB_REF_NAME, GITHUB_EVENT_NAME, GITHUB_RUN_NUMBER
# Prints the version string to stdout.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

github_ref="${GITHUB_REF:-}"
github_ref_name="${GITHUB_REF_NAME:-}"
github_event_name="${GITHUB_EVENT_NAME:-}"
github_run_number="${GITHUB_RUN_NUMBER:-}"

# Tag ref: tag wins (must be semver).
if [[ "$github_ref" == refs/tags/* ]]; then
  tag="${github_ref_name#v}"
  if [[ ! "$tag" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
    echo "Tag ${github_ref_name} is not semver (expected vMAJOR.MINOR.PATCH)" >&2
    exit 1
  fi
  printf '%s' "$tag"
  exit 0
fi

if [[ -n "$github_ref" && "$github_ref" != "refs/heads/main" ]]; then
  echo "Unexpected GITHUB_REF for version resolution: ${github_ref}" >&2
  exit 1
fi

CARGO_TOML="${ROOT}/compiler/crates/beskid_cli/Cargo.toml"
[[ -f "$CARGO_TOML" ]] || { echo "Missing ${CARGO_TOML}" >&2; exit 1; }

# Base version from the CLI Cargo.toml.
base="$(awk -F'"' '/^version[[:space:]]*=/{print $2; exit}' "$CARGO_TOML")"
if [[ ! "$base" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  echo "invalid semver in ${CARGO_TOML}: ${base}" >&2
  exit 1
fi
major="${BASH_REMATCH[1]}"; minor="${BASH_REMATCH[2]}"; patch="${BASH_REMATCH[3]}"

# Latest semver tag in the compiler submodule, if any.
cd "${ROOT}/compiler"
latest_tag="$(git describe --tags --abbrev=0 --match 'v[0-9]*.[0-9]*.[0-9]*' 2>/dev/null || true)"
if [[ -n "$latest_tag" ]]; then
  if [[ ! "$latest_tag" =~ ^v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
    echo "Latest tag ${latest_tag} is not semver" >&2
    exit 1
  fi
  t_major="${BASH_REMATCH[1]}"; t_minor="${BASH_REMATCH[2]}"; t_patch="${BASH_REMATCH[3]}"
  commits_since="$(git rev-list --count "${latest_tag}..HEAD")"
  if [[ "$commits_since" -le 0 ]]; then
    printf '%s.%s.%s' "$t_major" "$t_minor" "$t_patch"
  else
    printf '%s.%s.%s' "$t_major" "$t_minor" "$((t_patch + commits_since))"
  fi
  exit 0
fi

# No tag yet: bump by run number.
if [[ "$github_run_number" =~ ^[0-9]+$ ]]; then
  printf '%s.%s.%s' "$major" "$minor" "$((patch + github_run_number))"
  exit 0
fi

printf '%s' "$base"
