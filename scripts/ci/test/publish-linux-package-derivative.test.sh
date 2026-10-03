#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SCRIPT="$ROOT/scripts/ci/publish-linux-package-derivative.sh"
TMP_BASE="$(realpath "${TMPDIR:-/tmp}")"
TMP="$(mktemp -d "$TMP_BASE/beskid-deb-publisher-test.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin" "$TMP/remote"
mkdir -p "$TMP/expected"

node --input-type=module - "$TMP" "$ROOT" <<'NODE'
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { createDerivativeFixture } from "./scripts/ci/test/linux-package-derivative-fixture.mjs";
const [root, repo] = process.argv.slice(2);
const fixtureRoot = join(root, "fixture"); mkdirSync(fixtureRoot);
const value = createDerivativeFixture(fixtureRoot);
const output = join(root, "out");
const result = spawnSync(process.execPath, [join(repo, "scripts/ci/verify-linux-package-derivative.mjs"), value.intentPath, value.native, value.recipe, value.qualified, output], { encoding: "utf8" });
assert.equal(result.status, 0, result.stderr);
NODE

INTENT="$TMP/fixture/intent.json"
OUTPUT="$TMP/out"
DEB=beskid-1.2.3-amd64.deb
RECORD="$DEB.correction-v1.json"
cp "$OUTPUT/$DEB" "$TMP/expected/$DEB"
cp "$OUTPUT/$RECORD" "$TMP/expected/$RECORD"
HELD_INTENT="$TMP/held-intent.json"
node - "$INTENT" "$HELD_INTENT" <<'NODE'
const fs=require("fs"),intent=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
intent.version="0.5.1";
intent.native.compiler_commit="1bd7bdee81d59ef14339e6a6c2ce18eb36585238";
intent.native.bundle.name="beskid-0.5.1-x86_64-unknown-linux-gnu.tar.gz";
intent.artifact.name="beskid-0.5.1-amd64.deb";
intent.record.name="beskid-0.5.1-amd64.deb.correction-v1.json";
fs.writeFileSync(process.argv[3],JSON.stringify(intent,null,2)+"\n");
NODE

cat >"$TMP/bin/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >>"$GH_LOG"
if [[ "$1" == api ]]; then
  if [[ -n "${GH_MUTATE_ORIGINAL:-}" && ! -e "$GH_REMOTE/.mutated-original" ]]; then
    printf 'changed after local validation\n' >"$GH_ORIGINAL/$GH_MUTATE_ORIGINAL"
    touch "$GH_REMOTE/.mutated-original"
  fi
  [[ "${GH_TAG_EXISTS:-1}" == 1 ]] || exit 1
  if [[ "$2" == */git/ref/tags/* ]]; then
    if [[ "${GH_ANNOTATED_TAG:-0}" == 1 ]]; then printf '{"object":{"type":"tag","sha":"cccccccccccccccccccccccccccccccccccccccc"}}\n'
    else printf '{"object":{"type":"commit","sha":"%s"}}\n' "${GH_TAG_SHA:-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb}"; fi
    exit 0
  fi
  if [[ "$2" == */git/tags/cccccccccccccccccccccccccccccccccccccccc ]]; then
    printf '{"object":{"type":"commit","sha":"%s"}}\n' "${GH_TAG_SHA:-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb}"
    exit 0
  fi
  exit 1
fi
if [[ "$1 $2" == "release view" ]]; then
  [[ "${GH_RELEASE_EXISTS:-1}" == 1 ]] || exit 1
  [[ ! -f "$GH_REMOTE/.view-fails" ]] || exit 1
  node - "$GH_REMOTE" "${GH_DUPLICATE_NAME:-}" <<'NODE'
const fs=require("fs"),dir=process.argv[2],duplicate=process.argv[3];
const assets=fs.readdirSync(dir).filter(name=>!name.startsWith(".")).map(name=>({name}));
if(duplicate)assets.push({name:duplicate});
process.stdout.write(JSON.stringify({assets})+"\n");
NODE
  exit 0
fi
if [[ "$1 $2" == "release download" ]]; then
  name= dir= previous=
  for argument in "$@"; do
    [[ "$previous" != --pattern ]] || name="$argument"
    [[ "$previous" != --dir ]] || dir="$argument"
    previous="$argument"
  done
  [[ -n "$name" && -n "$dir" && -f "$GH_REMOTE/$name" ]] || exit 1
  cp "$GH_REMOTE/$name" "$dir/$name"
  exit 0
fi
if [[ "$1 $2" == "release upload" ]]; then
  source="$4"; name="$(basename "$source")"; mode="${GH_UPLOAD_MODE:-normal}"
  if [[ "$mode" == "fail-before:$name" ]]; then exit 1; fi
  cp "$source" "$GH_REMOTE/$name"
  if [[ "$mode" == "fail-after:$name" ]]; then exit 1; fi
  if [[ "$mode" == "uncertain-after:$name" ]]; then touch "$GH_REMOTE/.view-fails"; exit 1; fi
  exit 0
fi
exit 1
EOF
chmod +x "$TMP/bin/gh"

run_publisher() {
  GH_TOKEN=test-token GH_LOG="$TMP/gh.log" GH_REMOTE="$TMP/remote" GH_ORIGINAL="$OUTPUT" \
    GH_MUTATE_ORIGINAL="${GH_MUTATE_ORIGINAL:-}" PATH="$TMP/bin:$PATH" \
    bash "$SCRIPT" "$INTENT" "$OUTPUT"
}
expect_failure() {
  if run_publisher >"$TMP/stdout" 2>"$TMP/stderr"; then
    echo "publisher unexpectedly succeeded" >&2
    exit 1
  fi
}
reset_remote() { rm -rf "$TMP/remote"; mkdir -p "$TMP/remote"; : >"$TMP/gh.log"; }
assert_no_write() { ! grep -Fq 'release upload' "$TMP/gh.log"; }
assert_uploaded() { grep -F 'release upload cli-v1.2.3 ' "$TMP/gh.log" | grep -Fq "/$1 --repo Cyber-Nomad-Collective/beskid_compiler"; }
assert_safe_transport() {
  ! grep -Eq -- '--clobber|release (create|edit|delete)|cli-(stable|nightly)|homebrew|brew' "$TMP/gh.log"
}

# The shared repository publication-hold policy is evaluated before transport.
reset_remote
if GH_TOKEN=test-token GH_LOG="$TMP/gh.log" GH_REMOTE="$TMP/remote" GH_ORIGINAL="$OUTPUT" PATH="$TMP/bin:$PATH" \
  bash "$SCRIPT" "$HELD_INTENT" "$OUTPUT" >"$TMP/stdout" 2>"$TMP/stderr"; then exit 1; fi
grep -Fqi 'publication hold' "$TMP/stderr"
assert_no_write
[[ ! -s "$TMP/gh.log" ]]

# Missing release and wrong tag target fail before any write.
reset_remote
if GH_RELEASE_EXISTS=0 run_publisher >"$TMP/stdout" 2>"$TMP/stderr"; then exit 1; fi
assert_no_write
reset_remote
if GH_TAG_SHA=dddddddddddddddddddddddddddddddddddddddd run_publisher >"$TMP/stdout" 2>"$TMP/stderr"; then exit 1; fi
assert_no_write

# Both absent uploads exactly the two finite-intent assets and nothing else.
reset_remote
run_publisher
cmp -s "$OUTPUT/$DEB" "$TMP/remote/$DEB"
cmp -s "$OUTPUT/$RECORD" "$TMP/remote/$RECORD"
[[ "$(grep -c 'release upload' "$TMP/gh.log")" == 2 ]]
assert_safe_transport

# Publication reads only a private, validated snapshot. Mutation of the
# operator's original output after the first remote call cannot change either
# uploaded asset or become the comparison authority.
reset_remote
GH_MUTATE_ORIGINAL="$DEB" run_publisher
cmp -s "$TMP/expected/$DEB" "$TMP/remote/$DEB"
cmp -s "$TMP/expected/$RECORD" "$TMP/remote/$RECORD"
! cmp -s "$OUTPUT/$DEB" "$TMP/remote/$DEB"
cp "$TMP/expected/$DEB" "$OUTPUT/$DEB"
chmod 600 "$OUTPUT/$DEB"

# Exact both-present bytes are idempotent and are downloaded before no-op success.
: >"$TMP/gh.log"
run_publisher
assert_no_write
grep -Fq "release download cli-v1.2.3" "$TMP/gh.log"

# Either individual asset may be the only missing asset.
reset_remote
cp "$OUTPUT/$RECORD" "$TMP/remote/$RECORD"
run_publisher
[[ "$(grep -c 'release upload' "$TMP/gh.log")" == 1 ]]
assert_uploaded "$DEB"
reset_remote
cp "$OUTPUT/$DEB" "$TMP/remote/$DEB"
run_publisher
[[ "$(grep -c 'release upload' "$TMP/gh.log")" == 1 ]]
assert_uploaded "$RECORD"

# A mismatch in either name, including the second record while the DEB is absent,
# prevents every write.
reset_remote
printf 'wrong\n' >"$TMP/remote/$DEB"
expect_failure
assert_no_write
reset_remote
printf 'wrong\n' >"$TMP/remote/$RECORD"
expect_failure
assert_no_write

# Duplicate remote names are ambiguous and fail closed.
reset_remote
if GH_DUPLICATE_NAME="$DEB" run_publisher >"$TMP/stdout" 2>"$TMP/stderr"; then exit 1; fi
assert_no_write

# A failed upload is re-queried. If the remote now has exact bytes, continue;
# if it is still absent, stop without a blind retry.
reset_remote
GH_UPLOAD_MODE="fail-after:$DEB" run_publisher
cmp -s "$OUTPUT/$DEB" "$TMP/remote/$DEB"
cmp -s "$OUTPUT/$RECORD" "$TMP/remote/$RECORD"
[[ "$(grep -c "release upload cli-v1.2.3 .*\/$DEB" "$TMP/gh.log")" == 1 ]]
reset_remote
if GH_UPLOAD_MODE="fail-before:$RECORD" run_publisher >"$TMP/stdout" 2>"$TMP/stderr"; then exit 1; fi
cmp -s "$OUTPUT/$DEB" "$TMP/remote/$DEB"
[[ ! -e "$TMP/remote/$RECORD" ]]
[[ "$(grep -c "release upload cli-v1.2.3 .*\/$RECORD" "$TMP/gh.log")" == 1 ]]

# Retrying a verified partial attempt downloads the exact DEB and uploads only
# the missing record.
: >"$TMP/gh.log"
run_publisher
grep -Fq "release download cli-v1.2.3 --repo Cyber-Nomad-Collective/beskid_compiler --pattern $DEB" "$TMP/gh.log"
[[ "$(grep -c 'release upload' "$TMP/gh.log")" == 1 ]]
assert_uploaded "$RECORD"

# Network/auth uncertainty during the post-upload re-query stops the sequence.
reset_remote
if GH_UPLOAD_MODE="uncertain-after:$DEB" run_publisher >"$TMP/stdout" 2>"$TMP/stderr"; then exit 1; fi
[[ -f "$TMP/remote/$DEB" && ! -e "$TMP/remote/$RECORD" ]]
[[ "$(grep -c 'release upload' "$TMP/gh.log")" == 1 ]]

# Annotated immutable tags are peeled to the reviewed compiler commit.
reset_remote
GH_ANNOTATED_TAG=1 run_publisher
grep -Fq '/git/tags/cccccccccccccccccccccccccccccccccccccccc' "$TMP/gh.log"

# Local unexpected inventory and absent explicit child token fail before gh.
printf 'unexpected\n' >"$OUTPUT/package-result.json"
: >"$TMP/gh.log"
expect_failure
assert_no_write
[[ ! -s "$TMP/gh.log" ]]
rm "$OUTPUT/package-result.json"
: >"$TMP/gh.log"
if GH_LOG="$TMP/gh.log" GH_REMOTE="$TMP/remote" PATH="$TMP/bin:$PATH" bash "$SCRIPT" "$INTENT" "$OUTPUT" >"$TMP/stdout" 2>"$TMP/stderr"; then exit 1; fi
[[ ! -s "$TMP/gh.log" ]]

echo "Linux package derivative publisher tests passed"
