#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"; runner="$root/scripts/ci/woodpecker-upload-handoff.sh"; tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
source="$(git -C "$root" rev-parse HEAD)"; compiler="$(git -C "$root" rev-parse HEAD:compiler)"; mkdir -p "$tmp/out" "$tmp/bin"; printf binary >"$tmp/out/beskid-linux-amd64"; printf installer >"$tmp/out/beskid-setup.sh"; : >"$tmp/ssh"; : >"$tmp/known"
cat >"$tmp/bin/sftp" <<'EOF'
#!/usr/bin/env bash
while [[ "$1" != -b ]]; do shift; done
cat "$2" >"$SFTP_LOG"; printf '%s\n' "$*" >"$SFTP_ARGS"; mkdir -p "$SFTP_CAPTURE"
while IFS= read -r line; do
  [[ "$line" == put* ]] || continue
  source=${line#put \"}; source=${source%%\"*}; cp "$source" "$SFTP_CAPTURE/$(basename "$source")"
done <"$2"
EOF
chmod +x "$tmp/bin/sftp"
run() { PATH="$tmp/bin:$PATH" SFTP_LOG="$tmp/batch" SFTP_ARGS="$tmp/args" SFTP_CAPTURE="$tmp/capture" BESKID_HANDOFF_SSH_KEY="$tmp/ssh" BESKID_HANDOFF_KNOWN_HOSTS="$tmp/known" CI_PIPELINE_EVENT=manual CI_PIPELINE_NUMBER=9 CI_COMMIT_SHA="$source" "$runner" linux "$tmp/out" "$source" "$compiler" 0.4.0 9; }
if "$runner" linux "$tmp/out" "$source" "$compiler" 0.4.0 9; then exit 1; fi
run
grep -Fq 'UPLOAD_SHA256SUMS' "$tmp/batch"; tail -1 "$tmp/batch" | grep -Fq UPLOAD_COMPLETE; grep -Fq 'beskid-linux@bdziam.dev' "$tmp/args"; if grep -Fq HANDOFF_SIGNING "$root/scripts/ci/woodpecker-upload-handoff.sh"; then exit 1; fi
expected="$(printf binary | sha256sum | awk '{print $1}')"; grep -Fq "$expected" <(sha256sum "$tmp/out/beskid-linux-amd64")
if grep -Fq UPLOAD_SHA256SUMS "$tmp/capture/UPLOAD_SHA256SUMS"; then exit 1; fi; (cd "$tmp/capture" && sha256sum -c UPLOAD_SHA256SUMS); grep -Eq '^[a-f0-9]{64}  [^/]+$' "$tmp/capture/UPLOAD_SHA256SUMS"
touch "$tmp/out/unsafe name"
if run; then echo 'unsafe SFTP artifact name unexpectedly accepted' >&2; exit 1; fi
rm "$tmp/out/unsafe name"
ln -s /etc/passwd "$tmp/out/evil"; if run; then exit 1; fi
rm "$tmp/out/evil"

# Repackaged handoff: the build identity (source C, build pipeline 335) with packaged_by naming the
# repackaging pipeline 340 and its root commit P, a packaging-only descendant of C.
repo="$tmp/repo"; git init -q "$repo"; mkdir -p "$repo/scripts/ci"
cp "$runner" "$root/scripts/ci/release-user-observation.mjs" "$root/scripts/ci/release-version.mjs" "$repo/scripts/ci/"
printf '{"cases":[]}\n' >"$repo/scripts/ci/release-cases-v06.json"
git -C "$repo" add scripts
for link in compiler:1 beskid_bsol:2 beskid_distrib:3; do git -C "$repo" update-index --add --cacheinfo "160000,$(printf "%040d" "${link#*:}"),${link%%:*}"; done
gitc() { git -C "$repo" -c user.name=t -c user.email=t@example.invalid "$@"; }
gitc commit -qm C; c_sha="$(git -C "$repo" rev-parse HEAD)"; c_compiler="$(printf '%040d' 1)"
printf '// prune caches\n' >"$repo/scripts/ci/woodpecker-package-platform.mjs"; git -C "$repo" add scripts
git -C "$repo" update-index --cacheinfo "160000,$(printf '%040d' 4),beskid_distrib"; gitc commit -qm P; p_sha="$(git -C "$repo" rev-parse HEAD)"
rm -rf "$tmp/capture"
repackaged() { (cd "$repo" && PATH="$tmp/bin:$PATH" SFTP_LOG="$tmp/batch" SFTP_ARGS="$tmp/args" SFTP_CAPTURE="$tmp/capture" BESKID_HANDOFF_SSH_KEY="$tmp/ssh" BESKID_HANDOFF_KNOWN_HOSTS="$tmp/known" CI_PIPELINE_EVENT=manual CI_PIPELINE_NUMBER="${1:-340}" CI_COMMIT_SHA="$p_sha" bash scripts/ci/woodpecker-upload-handoff.sh windows "$tmp/out" "$c_sha" "$c_compiler" 0.6.0 335 --repackaged-by 340); }
repackaged
grep -Fq "/incoming/335-${c_sha}/windows" "$tmp/batch" || { echo 'repackaged handoff is not keyed to the build pipeline and source' >&2; exit 1; }
printf 'role=windows\nsource=%s\ncompiler=%s\nversion=0.6.0\npipeline=335\npackaged_by=340\npackaged_by_commit=%s\n' "$c_sha" "$c_compiler" "$p_sha" | cmp -s - "$tmp/capture/UPLOAD_COMPLETE" || { echo 'repackaged UPLOAD_COMPLETE identity is wrong' >&2; cat "$tmp/capture/UPLOAD_COMPLETE" >&2; exit 1; }
node "$root/scripts/ci/woodpecker-handoff.mjs" marker "$tmp/capture/UPLOAD_COMPLETE" >/dev/null
if repackaged 341 2>/dev/null; then echo 'a repackaged handoff from another pipeline was accepted' >&2; exit 1; fi
if (cd "$repo" && PATH="$tmp/bin:$PATH" SFTP_LOG="$tmp/batch" SFTP_ARGS="$tmp/args" SFTP_CAPTURE="$tmp/capture" BESKID_HANDOFF_SSH_KEY="$tmp/ssh" BESKID_HANDOFF_KNOWN_HOSTS="$tmp/known" CI_PIPELINE_EVENT=manual CI_PIPELINE_NUMBER=335 CI_COMMIT_SHA="$p_sha" bash scripts/ci/woodpecker-upload-handoff.sh windows "$tmp/out" "$c_sha" "$c_compiler" 0.6.0 335 --repackaged-by 335) 2>/dev/null; then
  echo 'a pipeline repackaging itself was accepted' >&2; exit 1
fi
# Superseding repackage: build 335 is currently packaged by 340 (`/incoming/335-C/windows`). Pipeline
# 360 supersedes it only when --supersedes names 340, uploads to the new entry 335-C@360 and leaves
# the 340 handoff untouched.
cp "$root/scripts/ci/woodpecker-handoff.mjs" "$repo/scripts/ci/"; git -C "$repo" add scripts; gitc commit -qm P2; p_sha="$(git -C "$repo" rev-parse HEAD)"
mkdir -p "$tmp/remote-bin"
cat >"$tmp/remote-bin/sftp" <<'SFTP'
#!/usr/bin/env bash
# Fake role-account sftp over $SFTP_REMOTE (the chroot), failing a batch on its first failed command.
set -euo pipefail
while [[ "$1" != -b ]]; do shift; done
cat "$2" >>"$SFTP_LOG"
unquote() { local value="${1#\"}"; printf '%s' "${value%\"}"; }
while IFS= read -r line; do
  echo "sftp> $line"
  case "$line" in
    'ls -1 '*) dir="$(unquote "${line#ls -1 }")"; find "$SFTP_REMOTE$dir" -mindepth 1 -maxdepth 1 -exec basename {} \; | LC_ALL=C sort | sed "s|^|$dir/|" ;;
    '-get '*) rest="${line#-get }"; remote="$(unquote "${rest%%\" \"*}\"")"; local_path="$(unquote "\"${rest#*\" \"}")"
      [[ ! -f "$SFTP_REMOTE$remote" ]] || cp "$SFTP_REMOTE$remote" "$local_path" ;;
    'mkdir '*) dir="$(unquote "${line#mkdir }")"; mkdir "$SFTP_REMOTE$dir" ;;
    'put '*) rest="${line#put }"; from="$(unquote "${rest%%\" \"*}\"")"; to="$(unquote "\"${rest#*\" \"}")"; cp "$from" "$SFTP_REMOTE$to" ;;
    *) echo "unsupported fake sftp command: $line" >&2; exit 2 ;;
  esac
done <"$2"
SFTP
chmod +x "$tmp/remote-bin/sftp"
current_commit="$(printf '%040d' 340)"
seed_remote() {
  rm -rf "$tmp/remote"; mkdir -p "$tmp/remote/incoming/335-${c_sha}/windows"
  local dir="$tmp/remote/incoming/335-${c_sha}/windows"
  printf 'installer from 340\n' >"$dir/beskid-0.6.0-windows-amd64.msi"
  (cd "$dir" && sha256sum beskid-0.6.0-windows-amd64.msi) >"$dir/UPLOAD_SHA256SUMS"
  printf 'role=windows\nsource=%s\ncompiler=%s\nversion=0.6.0\npipeline=335\npackaged_by=340\npackaged_by_commit=%s\n' "$c_sha" "$c_compiler" "$current_commit" >"$dir/UPLOAD_COMPLETE"
}
superseding_upload() {
  local out="$1"; shift
  (cd "$repo" && PATH="$tmp/remote-bin:$PATH" SFTP_LOG="$tmp/remote-batch" SFTP_REMOTE="$tmp/remote" BESKID_HANDOFF_SSH_KEY="$tmp/ssh" BESKID_HANDOFF_KNOWN_HOSTS="$tmp/known" \
    CI_PIPELINE_EVENT=manual CI_PIPELINE_NUMBER=360 CI_COMMIT_SHA="$p_sha" bash scripts/ci/woodpecker-upload-handoff.sh windows "$out" "$c_sha" "$c_compiler" 0.6.0 335 --repackaged-by 360 "$@")
}
remote_sum() { (cd "$tmp/remote/incoming/335-${c_sha}/windows" && cat ./* | sha256sum); }
super_out="$tmp/super-out"; mkdir -p "$super_out"; printf 'installer from 360\n' >"$super_out/beskid-0.6.0-windows-amd64.msi"
printf '{"kind":"beskid-repackage","supersedes":{"pipeline":340,"superrepo_commit":"%s","distrib_commit":"%s"}}\n' "$current_commit" "$(printf '%040d' 3)" >"$super_out/repackage-provenance.json"
seed_remote; old_sum="$(remote_sum)"
superseding_upload "$super_out" --supersedes 340 >/dev/null || { echo 'a superseding repackage naming the current packaging was rejected' >&2; exit 1; }
new_dir="$tmp/remote/incoming/335-${c_sha}@360/windows"
grep -Fq 'installer from 360' "$new_dir/beskid-0.6.0-windows-amd64.msi" || { echo 'the superseding handoff was not uploaded to 335-C@360' >&2; exit 1; }
printf 'role=windows\nsource=%s\ncompiler=%s\nversion=0.6.0\npipeline=335\npackaged_by=360\npackaged_by_commit=%s\nsupersedes=340\nsupersedes_commit=%s\n' "$c_sha" "$c_compiler" "$p_sha" "$current_commit" | cmp -s - "$new_dir/UPLOAD_COMPLETE" || { echo 'superseding UPLOAD_COMPLETE identity is wrong' >&2; cat "$new_dir/UPLOAD_COMPLETE" >&2; exit 1; }
node "$root/scripts/ci/woodpecker-handoff.mjs" marker "$new_dir/UPLOAD_COMPLETE" >/dev/null
[[ "$(remote_sum)" == "$old_sum" ]] || { echo 'the superseded handoff was modified' >&2; exit 1; }
if grep -q "^put .*\"/incoming/335-${c_sha}/windows/" "$tmp/remote-batch"; then echo 'the superseding upload wrote into the superseded handoff' >&2; exit 1; fi
# The same superseding entry is never written twice.
if superseding_upload "$super_out" --supersedes 340 2>"$tmp/s.err"; then echo 'an existing superseding entry was overwritten' >&2; exit 1; fi
grep -Fq "handoff 335-${c_sha}@360 already exists" "$tmp/s.err"
# --supersedes must name the current packaging; a stale or wrong one, or a missing handoff, fails closed.
seed_remote
if superseding_upload "$super_out" --supersedes 334 2>/dev/null; then echo 'a supersede of a packaging older than the build was accepted' >&2; exit 1; fi
if superseding_upload "$super_out" --supersedes 350 2>"$tmp/s.err"; then echo 'a supersede of a packaging that is not current was accepted' >&2; exit 1; fi
grep -Fq -- '--supersedes 350 does not name the current windows handoff of build 335, packaged by pipeline 340' "$tmp/s.err"
test ! -e "$tmp/remote/incoming/335-${c_sha}@360" || { echo 'a rejected supersede created its handoff' >&2; exit 1; }
rm -rf "$tmp/remote"; mkdir -p "$tmp/remote/incoming"
if superseding_upload "$super_out" --supersedes 340 2>"$tmp/s.err"; then echo 'a supersede without a current handoff was accepted' >&2; exit 1; fi
grep -Fq 'build 335 has no complete windows handoff to supersede' "$tmp/s.err"
# The repackage provenance must name the same superseded packaging.
seed_remote
printf '{"kind":"beskid-repackage","supersedes":{"pipeline":340,"superrepo_commit":"%s"}}\n' "$(printf '%040d' 9)" >"$super_out/repackage-provenance.json"
if superseding_upload "$super_out" --supersedes 340 2>"$tmp/s.err"; then echo 'a provenance naming another superseded packaging was accepted' >&2; exit 1; fi
grep -Fq 'repackage provenance does not supersede packaging 340' "$tmp/s.err"
# Without --supersedes, an existing handoff of the build is never overwritten: its mkdir fails.
seed_remote
if superseding_upload "$super_out" 2>/dev/null; then echo 'a second repackage without --supersedes overwrote the current handoff' >&2; exit 1; fi
[[ "$(remote_sum)" == "$old_sum" ]] || { echo 'the current handoff was modified' >&2; exit 1; }

printf 'echo changed\n' >"$repo/scripts/ci/build-release-artifact.sh"; git -C "$repo" add scripts; gitc commit -qm Q; p_sha="$(git -C "$repo" rev-parse HEAD)"
if repackaged 2>"$tmp/q.err"; then echo 'a repackaging root that changes build inputs was accepted' >&2; exit 1; fi
grep -Fq 'not a packaging-only descendant' "$tmp/q.err"
echo 'woodpecker upload handoff tests: OK'
