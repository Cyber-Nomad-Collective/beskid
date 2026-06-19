#!/usr/bin/env bash
# Build the gate report (markdown + consolidated JUnit XML) from per-gate
# JUnit files produced by the gate harness.
#
# Pure bash + coreutils — no node, no jq. Must run on a clean runner that may
# not have done 'bun install' yet (a failed install is exactly when we need it).
#
# Usage: build-gate-report.sh <junit-in-dir> <out-dir>
set -euo pipefail

IN="${1:?usage: build-gate-report.sh <junit-in-dir> <out-dir>}"
OUT="${2:?usage: build-gate-report.sh <junit-in-dir> <out-dir>}"
mkdir -p "${OUT}"

shopt -s nullglob
xmls=("${IN}"/*.xml)
if [[ ${#xmls[@]} -eq 0 ]]; then
  echo "build-gate-report: no JUnit XML found in ${IN}" >&2
  # Still emit an empty report so downstream upload-artifact has something.
  : > "${OUT}/gate-report.md"
  cat > "${OUT}/gate-report.junit.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<testsuites><testsuite name="empty" tests="0" failures="0"></testsuite></testsuites>
EOF
  exit 0
fi

# --- Consolidated JUnit: concatenate testsuite blocks into one document. ---
{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<testsuites>'
  for f in "${xmls[@]}"; do
    sed -n '/<testsuite/,/<\/testsuite>/p' "$f"
  done
  echo '</testsuites>'
} > "${OUT}/gate-report.junit.xml"

# --- Markdown report: one section per gate, tables of steps. ---
{
  echo "# Gate report"
  echo
  total_pass=0
  total_fail=0
  for f in "${xmls[@]}"; do
    suite_name="$(grep -o '<testsuite name="[^"]*"' "$f" | head -1 | sed 's/.*name="//;s/"//')"
    [[ -n "$suite_name" ]] || suite_name="$(basename "${f%.xml}")"
    tests="$(grep -o '<testsuite[^>]* tests="[0-9]*"' "$f" | head -1 | grep -o 'tests="[0-9]*"' | grep -o '[0-9]*')"
    fails="$(grep -o '<testsuite[^>]* failures="[0-9]*"' "$f" | head -1 | grep -o 'failures="[0-9]*"' | grep -o '[0-9]*')"
    tests="${tests:-0}"; fails="${fails:-0}"
    passes=$((tests - fails))
    total_pass=$((total_pass + passes))
    total_fail=$((total_fail + fails))
    badge="PASS"
    [[ "$fails" -gt 0 ]] && badge="FAIL"
    echo "## ${suite_name} — ${badge}"
    echo
    echo "| step | result |"
    echo "|---|---|"
    # Iterate <testcase> blocks. A testcase may span multiple lines (failure
    # CDATA on following lines), so track state across lines rather than
    # checking each line in isolation. (No `local` — this is top-level, and
    # bash 3.2 disallows local outside functions.)
    in_tc=0; tc_name=""; tc_failed=0
    while IFS= read -r line; do
      if [[ "$in_tc" -eq 1 && "$line" == *"</testcase>"* ]]; then
        # Close out the current testcase.
        if [[ "$tc_failed" -eq 1 ]]; then
          echo "| ${tc_name} | FAIL |"
        else
          echo "| ${tc_name} | PASS |"
        fi
        in_tc=0; tc_failed=0
        continue
      fi
      if echo "$line" | grep -q '<testcase'; then
        tc_name="$(echo "$line" | grep -o 'name="[^"]*"' | head -1 | sed 's/name="//;s/"//')"
        # A self-closing testcase (ends with />) is a pass with no body.
        if echo "$line" | grep -q '</testcase>'; then
          echo "| ${tc_name} | PASS |"
          in_tc=0; tc_failed=0
          continue
        fi
        # Single-line testcase with inline failure: <testcase ...><failure .../>...</testcase>
        if echo "$line" | grep -q '<failure'; then
          tc_failed=1
        fi
        if echo "$line" | grep -q '</testcase>'; then
          if [[ "$tc_failed" -eq 1 ]]; then
            echo "| ${tc_name} | FAIL |"
          else
            echo "| ${tc_name} | PASS |"
          fi
          in_tc=0; tc_failed=0
        else
          in_tc=1
        fi
        continue
      fi
      # Inside a multi-line testcase: a <failure> line marks it failed.
      if [[ "$in_tc" -eq 1 ]] && echo "$line" | grep -q '<failure'; then
        tc_failed=1
      fi
    done < <(grep -E '<testcase|</testcase>|<failure' "$f")
    echo
    # If any failures, show the captured log fragment.
    if [[ "$fails" -gt 0 ]] && grep -q '<failure' "$f"; then
      echo "<details><summary>Failure log fragments</summary>"
      echo
      awk '/<failure/ {inf=1} inf {print} /]]><\/failure>/ {inf=0}' "$f" \
        | sed 's/<[^>]*>//g' \
        | sed 's/^/    /'
      echo
      echo "</details>"
      echo
    fi
  done
  echo "---"
  echo
  echo "**Total:** ${total_pass} passed, ${total_fail} failed"
} > "${OUT}/gate-report.md"

echo "build-gate-report: wrote ${OUT}/gate-report.md and ${OUT}/gate-report.junit.xml"
