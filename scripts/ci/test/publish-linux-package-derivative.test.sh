#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; SCRIPT="$ROOT/scripts/ci/publish-linux-package-derivative.sh"; TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin" "$TMP/out" "$TMP/remote"
hash="$(printf 'deb\n' | shasum -a 256 | awk '{print $1}')"
cat >"$TMP/intent.json" <<JSON
{"schema_version":1,"kind":"linux-package-derivative-correction","version":"1.2.3","platform":"linux","target":"x86_64-unknown-linux-gnu","native":{"compiler_commit":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},"recipe":{},"artifact":{"name":"beskid-1.2.3-amd64.deb","sha256":"$hash"},"record":{"name":"beskid-1.2.3-amd64.deb.correction-v1.json"},"qualification":{}}
JSON
printf 'deb\n' >"$TMP/out/beskid-1.2.3-amd64.deb"; cp "$TMP/intent.json" "$TMP/out/correction-intent.json"
node - "$TMP/intent.json" >"$TMP/out/beskid-1.2.3-amd64.deb.correction-v1.json" <<'NODE'
const fs=require('fs'),x=JSON.parse(fs.readFileSync(process.argv[2]));console.log(JSON.stringify({schema_version:1,kind:x.kind,version:x.version,platform:x.platform,native:x.native,recipe:x.recipe,artifact:x.artifact,qualification:x.qualification}));
NODE
cat >"$TMP/bin/gh" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$GH_LOG"
if [[ "$1 $2" == 'release view' ]];then [[ "${GH_EXISTS:-1}" == 1 ]]||exit 1;printf '{"targetCommitish":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","assets":[]}\n';exit 0;fi
if [[ "$1 $2" == 'release download' ]];then for x in "$@";do [[ "${prev:-}" == --pattern ]]&&name="$x";[[ "${prev:-}" == --dir ]]&&dir="$x";prev="$x";done;[[ -f "$GH_REMOTE/$name" ]]||exit 1;cp "$GH_REMOTE/$name" "$dir/$name";exit 0;fi
if [[ "$1 $2" == 'release upload' ]];then cp "$4" "$GH_REMOTE/$(basename "$4")";exit 0;fi
exit 1
EOF
chmod +x "$TMP/bin/gh"
if GH_LOG="$TMP/log" GH_REMOTE="$TMP/remote" GH_DIR="$TMP/tmp" GH_EXISTS=0 PATH="$TMP/bin:$PATH" bash "$SCRIPT" "$TMP/intent.json" "$TMP/out";then exit 1;fi
: >"$TMP/log"; GH_LOG="$TMP/log" GH_REMOTE="$TMP/remote" GH_DIR="$TMP/tmp" PATH="$TMP/bin:$PATH" bash "$SCRIPT" "$TMP/intent.json" "$TMP/out"
grep -Fq 'release upload cli-v1.2.3' "$TMP/log"; [[ -f "$TMP/remote/beskid-1.2.3-amd64.deb.correction-v1.json" ]]
: >"$TMP/log"; GH_LOG="$TMP/log" GH_REMOTE="$TMP/remote" GH_DIR="$TMP/tmp" PATH="$TMP/bin:$PATH" bash "$SCRIPT" "$TMP/intent.json" "$TMP/out"
! grep -Fq 'release upload' "$TMP/log"
