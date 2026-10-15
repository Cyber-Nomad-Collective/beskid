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
printf 'echo changed\n' >"$repo/scripts/ci/build-release-artifact.sh"; git -C "$repo" add scripts; gitc commit -qm Q; p_sha="$(git -C "$repo" rev-parse HEAD)"
if repackaged 2>"$tmp/q.err"; then echo 'a repackaging root that changes build inputs was accepted' >&2; exit 1; fi
grep -Fq 'not a packaging-only descendant' "$tmp/q.err"
echo 'woodpecker upload handoff tests: OK'
