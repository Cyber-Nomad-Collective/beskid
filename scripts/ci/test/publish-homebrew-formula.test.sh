#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
script="$root/scripts/ci/publish-homebrew-formula.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

formula="$tmp/beskid.rb"
cat >"$formula" <<'RUBY'
class Beskid < Formula
  url "https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/v0.4.745/beskid-aarch64-apple-darwin.tar.gz"
  version "0.4.745"
end
RUBY
mkdir -p "$tmp/bin"
cat >"$tmp/bin/gh" <<'GH'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$GH_LOG"
if [[ "$*" == *'contents/Formula/beskid.rb --jq .sha'* ]]; then
  printf '%s\n' "existing-sha"
fi
GH
chmod +x "$tmp/bin/gh"

GH_LOG="$tmp/gh.log" GH_TOKEN=test PATH="$tmp/bin:$PATH" \
  bash "$script" "$formula" 0.4.745

grep -Fq 'repos/Cyber-Nomad-Collective/beskid_homebrew/contents/Formula/beskid.rb' "$tmp/gh.log"
grep -Fq 'message=release(brew): Beskid 0.4.745' "$tmp/gh.log"
grep -Fq 'sha=existing-sha' "$tmp/gh.log"

echo 'publish Homebrew formula tests OK'
