#!/usr/bin/env bash
# Render compiler release notes from the machine-readable release state.
# Usage: render-compiler-release-notes.sh <release-state.json> <stream>
set -euo pipefail

state="${1:?release state path}"
stream="${2:?stream}"
jq -e '.schema_version == 1 and .publishable == true' "${state}" >/dev/null

channel="$(jq -r '.channel' "${state}")"
version="$(jq -r '.version' "${state}")"
stream_upper="$(printf '%s' "${stream}" | tr '[:lower:]' '[:upper:]')"

print_list() {
  local expression="$1"
  if [[ "$(jq "${expression} | length" "${state}")" -eq 0 ]]; then
    printf '%s\n' '- None'
  else
    jq -r "${expression}[] | \"- \\(.)\"" "${state}"
  fi
}

cat <<EOF
# Beskid ${stream_upper} ${version}

## Channel

- ${channel}

## Available artifacts

EOF
print_list '.available_artifacts'
cat <<'EOF'

## Missing artifacts

EOF
print_list '.missing_artifacts'
cat <<'EOF'

## Successful tests

EOF
print_list '.tests.successful'
cat <<'EOF'

## Failed tests

EOF
print_list '.tests.failed'
cat <<'EOF'

## Failure diagnostics

EOF
if [[ "$(jq '.diagnostics | length' "${state}")" -eq 0 ]]; then
  printf '%s\n' '- None'
else
  jq -r '.diagnostics[] |
    (if (.log_path | startswith("http://") or startswith("https://"))
     then "[GitHub Actions log](\(.log_path))"
     else "`\(.log_path)`" end) as $log |
    "- `\(.identifier)` — \(.location.file):\(.location.line):\(.location.column) — \(.reason) (log: \($log))"' "${state}"
fi
cat <<EOF

## Commit provenance

- Compiler: \`$(jq -r '.provenance.compiler_commit' "${state}")\`
- Superrepo: \`$(jq -r '.provenance.superrepo_commit' "${state}")\`
EOF
