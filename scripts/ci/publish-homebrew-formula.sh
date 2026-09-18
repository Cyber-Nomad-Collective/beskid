#!/usr/bin/env bash
# Publish the rendered global-version formula to the Beskid Homebrew tap.
set -euo pipefail

[[ "$#" == 2 ]] || { echo 'usage: publish-homebrew-formula.sh <formula> <version>' >&2; exit 2; }
formula="$1"
version="$2"
repo='Cyber-Nomad-Collective/beskid_homebrew'
path='Formula/beskid.rb'

[[ -f "$formula" ]] || { echo "missing formula: $formula" >&2; exit 1; }
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo 'stable version must be X.Y.Z' >&2; exit 2; }
: "${GH_TOKEN:?GH_TOKEN must be exported for Homebrew publication}"
grep -Fq "/v${version}/" "$formula" || { echo 'formula does not reference the immutable bundle release' >&2; exit 1; }
grep -Fq "version \"${version}\"" "$formula" || { echo 'formula version does not match the release' >&2; exit 1; }

content="$(base64 <"$formula" | tr -d '\n')"
current_sha="$(gh api "repos/${repo}/contents/${path}" --jq .sha 2>/dev/null || true)"
args=(api --method PUT "repos/${repo}/contents/${path}" -f "message=release(brew): Beskid ${version}" -f "content=${content}")
[[ -z "$current_sha" ]] || args+=(-f "sha=${current_sha}")
gh "${args[@]}" >/dev/null
echo "Homebrew formula published: ${repo}/${path} (${version})"
