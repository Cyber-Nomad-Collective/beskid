#!/usr/bin/env bash
# Candidate collection: per-platform discovery, pins, missing platforms, mixed pipeline numbers and
# checksum mismatches, against a fake read-only release SFTP account.
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"; runner="$root/scripts/ci/woodpecker-fetch-handoffs.sh"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }
grep -Fq 'role: beskid-release' "$root/.woodpecker/release.yml"
grep -Fq 'woodpecker-fetch-handoffs.sh' "$root/.woodpecker/release.yml"
source=0123456789abcdef0123456789abcdef01234567; other=fedcba9876543210fedcba9876543210fedcba98
compiler=89abcdef0123456789abcdef0123456789abcdef; version=0.6.0
mkdir -p "$tmp/bin"; : >"$tmp/key"; : >"$tmp/known hosts"
cat >"$tmp/bin/sftp" <<'EOF'
#!/usr/bin/env bash
# Fake sftp: the chroot of the release account is $SFTP_REMOTE.
set -euo pipefail
while [[ "$1" != -b ]]; do shift; done
batch="$2"; printf '%s\n' "$*" >>"$SFTP_ARGS"; cat "$batch" >>"$SFTP_LOG"
unquote() { local value="${1#\"}"; printf '%s' "${value%\"}"; }
while IFS= read -r line; do
  echo "sftp> $line"
  case "$line" in
    'ls -1 '*)
      dir="$(unquote "${line#ls -1 }")"
      [[ -d "$SFTP_REMOTE$dir" ]] || { echo "Can't ls: \"$dir\" not found" >&2; exit 1; }
      find "$SFTP_REMOTE$dir" -mindepth 1 -maxdepth 1 -exec basename {} \; | LC_ALL=C sort | sed "s|^|$dir/|"
      ;;
    '-get '*|'get -R '*)
      ignore=false; [[ "$line" == -* ]] && ignore=true
      rest="${line#-get }"; rest="${rest#get -R }"
      remote="$(unquote "${rest%%\" \"*}\"")"; local_path="$(unquote "\"${rest#*\" \"}")"
      if [[ -e "$SFTP_REMOTE$remote" ]]; then
        if [[ -d "$local_path" ]]; then cp -R "$SFTP_REMOTE$remote" "$local_path"; else cp "$SFTP_REMOTE$remote" "$local_path"; fi
      elif [[ "$ignore" == false ]]; then
        echo "File \"$remote\" not found." >&2; exit 1
      fi
      ;;
    *) echo "unsupported fake sftp command: $line" >&2; exit 2 ;;
  esac
done <"$batch"
EOF
chmod +x "$tmp/bin/sftp"

# One uploaded handoff in the remote tree, as woodpecker-upload-handoff.sh writes it.
handoff() {
  local role="$1" run="$2" sha="${3:-$source}" build_version="${4:-$version}" dir
  dir="$tmp/remote/$role/incoming/$run-$sha/$role"
  mkdir -p "$dir"
  printf '%s cli from %s\n' "$role" "$run" >"$dir/beskid-$role"
  printf '{"pipeline":%s}\n' "$run" >"$dir/package-result.json"
  (cd "$dir" && shasum -a 256 beskid-"$role" package-result.json) >"$dir/UPLOAD_SHA256SUMS"
  printf 'role=%s\nsource=%s\ncompiler=%s\nversion=%s\npipeline=%s\n' "$role" "$sha" "$compiler" "$build_version" "$run" >"$dir/UPLOAD_COMPLETE"
}
reset_remote() {
  rm -rf "$tmp/remote" "$tmp"/result*; mkdir -p "$tmp/remote"/{linux,macos,windows}/incoming
  : >"$tmp/log"; : >"$tmp/args"
}
fetch() {
  local destination="$1"; shift
  env PATH="$tmp/bin:$PATH" SFTP_ARGS="$tmp/args" SFTP_LOG="$tmp/log" SFTP_REMOTE="$tmp/remote" \
    BESKID_RELEASE_SSH_KEY="$tmp/key" BESKID_HANDOFF_KNOWN_HOSTS="$tmp/known hosts" "$@" \
    bash ${FETCH_TRACE:-} "$runner" "$source" "$compiler" "$version" "$destination"
}

# Discovery: each platform was built by its own pipelines. The newest complete handoff of the source
# wins; an unfinished upload (no UPLOAD_COMPLETE), another source and another version are skipped.
reset_remote
handoff linux 290; handoff linux 300; handoff linux 310; rm "$tmp/remote/linux/incoming/310-$source/linux/UPLOAD_COMPLETE"
handoff linux 320 "$other"
handoff macos 305
handoff windows 299; handoff windows 330 "$source" 0.6.1
selection="$(fetch "$tmp/result" 2>"$tmp/err")" || { cat "$tmp/err" >&2; fail 'discovery rejected a complete candidate'; }
[[ "$selection" == '300 305 299' ]] || fail "unexpected selection: $selection"
for item in linux:300 macos:305 windows:299; do
  role="${item%%:*}"; run="${item#*:}"
  test -f "$tmp/result/$role/incoming/$run-$source/$role/UPLOAD_COMPLETE" || fail "$role handoff $run was not fetched"
  [[ "$(ls "$tmp/result/$role/incoming")" == "$run-$source" ]] || fail "$role fetched more than the selected handoff"
done
grep -Fq 'skipping incomplete linux handoff from pipeline 310' "$tmp/err" || fail 'unfinished upload was not reported'
grep -Fq 'skipping windows handoff from pipeline 330: it is a 0.6.1 build' "$tmp/err" || fail 'other version was not reported'
! grep -Fq "320-$source" "$tmp/log" || fail 'a handoff of another source was considered'
! grep -Fq "$other" "$tmp/log" || fail 'a handoff of another source was requested'
[[ "$(grep -c '^get -R' "$tmp/log")" == 3 ]] || fail 'more than the three selected handoffs were fetched'
grep -Fq 'UserKnownHostsFile="' "$tmp/args" || fail 'known_hosts path is not quoted for OpenSSH'

# Pins select exactly the named pipelines, even when a newer complete handoff exists.
selection="$(fetch "$tmp/result-pinned" BESKID_LINUX_BUILD=290 BESKID_WINDOWS_BUILD=299 2>/dev/null)" || fail 'pinned collection failed'
[[ "$selection" == '290 305 299' ]] || fail "pins were not honoured: $selection"

# A pin without a handoff, or with only an unfinished upload, fails closed.
if fetch "$tmp/result-absent" BESKID_MACOS_BUILD=999 2>"$tmp/err"; then fail 'pin to an absent build was accepted'; fi
grep -Fq "no macos handoff from pipeline 999 for source $source" "$tmp/err" || fail 'absent pin was not diagnosed'
if fetch "$tmp/result-unfinished" BESKID_LINUX_BUILD=310 2>"$tmp/err"; then fail 'pin to an unfinished upload was accepted'; fi
grep -Fq "no complete linux handoff of $version for source $source" "$tmp/err" || fail 'unfinished pin was not diagnosed'
test ! -e "$tmp/result-absent" -a ! -e "$tmp/result-unfinished" || fail 'a failed collection created its destination'
for pin in 0 abc -1; do
  if fetch "$tmp/result-bad" BESKID_WINDOWS_BUILD="$pin" 2>/dev/null; then fail "invalid pin $pin was accepted"; fi
done

# A platform without any handoff of the source fails closed, before any handoff is fetched.
reset_remote
handoff linux 300; handoff macos 305; handoff windows 400 "$other"
if fetch "$tmp/result" 2>"$tmp/err"; then fail 'collection accepted a missing platform'; fi
grep -Fq "no windows handoff for source $source" "$tmp/err" || fail 'missing platform was not diagnosed'
! grep -q '^get -R' "$tmp/log" || fail 'a handoff was fetched although a platform is missing'
test ! -e "$tmp/result" || fail 'missing platform created the destination'

# A platform whose handoffs are all unfinished fails closed.
reset_remote
handoff linux 300; handoff macos 305; handoff windows 299; rm "$tmp/remote/windows/incoming/299-$source/windows/UPLOAD_COMPLETE"
if fetch "$tmp/result" 2>"$tmp/err"; then fail 'collection accepted an unfinished platform'; fi
grep -Fq "no complete windows handoff of $version for source $source" "$tmp/err" || fail 'unfinished platform was not diagnosed'

# A checksum mismatch in the newest complete handoff fails closed; there is no fallback to an older one.
reset_remote
handoff linux 300; handoff macos 301; handoff macos 305; handoff windows 299
printf 'altered\n' >>"$tmp/remote/macos/incoming/305-$source/macos/beskid-macos"
if fetch "$tmp/result" 2>"$tmp/err"; then fail 'collection accepted a checksum mismatch'; fi
grep -Fq 'handoff checksum mismatch: beskid-macos' "$tmp/err" || fail 'checksum mismatch was not diagnosed'
test ! -e "$tmp/result" || fail 'checksum mismatch created the destination'

# A complete marker that names another source, compiler or pipeline fails closed.
for field in source compiler pipeline; do
  reset_remote
  handoff linux 300; handoff macos 305; handoff windows 299
  marker="$tmp/remote/linux/incoming/300-$source/linux/UPLOAD_COMPLETE"
  case "$field" in
    source) sed -i.bak "s/^source=.*/source=$other/" "$marker" ;;
    compiler) sed -i.bak "s/^compiler=.*/compiler=$other/" "$marker" ;;
    pipeline) sed -i.bak 's/^pipeline=.*/pipeline=301/' "$marker" ;;
  esac
  rm -f "$marker.bak"
  if fetch "$tmp/result" 2>"$tmp/err"; then fail "collection accepted a marker with another $field"; fi
  grep -Fq "linux handoff from pipeline 300 is not a build of source $source" "$tmp/err" || fail "marker $field drift was not diagnosed"
done

# Identity and destination guards.
if bash "$runner" "$source" "$compiler" "$version" 2>/dev/null; then fail 'missing argument was accepted'; fi
if bash "$runner" "${source:0:39}" "$compiler" "$version" "$tmp/bad" 2>/dev/null; then fail 'short source was accepted'; fi
mkdir "$tmp/existing"
if fetch "$tmp/existing" 2>/dev/null; then fail 'fetch accepted an existing destination'; fi
echo 'woodpecker fetch handoffs tests: OK'
