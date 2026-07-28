#!/usr/bin/env bash
# Ensure every platform website either owns its visual shell or explicitly
# loads the shared stylesheet required by the components it renders.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
# shellcheck source=lib/assert.sh
source "${root}/scripts/ci/test/lib/assert.sh"

pckg_commit="$(git -C "${root}" ls-files -s -- pckg | awk '{print $2}')"
pckg_web_styles="$(git -C "${root}/pckg" show "${pckg_commit}:web/src/styles.css")"

assert_contains "$(cat "${root}/site/platform-spec/src/styles.css")" \
  '@source "../node_modules/@beskid/ui-react/src"' \
  "Platform Spec scans shared React component utilities"
assert_contains "$(cat "${root}/site/platform-spec/src/styles.css")" \
  '@import "@beskid/ui-react/styles/shadcn-entry.css"' \
  "Platform Spec loads shared sidebar tokens"
assert_contains "$(cat "${root}/site/platform-spec/src/styles.css")" \
  '@import "@beskid/beskid-ui/styles/hub.css"' \
  "Platform Spec loads the service hub stylesheet"

for consumer in beskid_tracker/src/styles.css beskid_nexus/gitnexus-web/src/styles.css; do
  assert_contains "$(cat "${root}/${consumer}")" \
    'styles/shadcn-entry.css' \
    "${consumer} loads shared sidebar tokens"
  assert_contains "$(cat "${root}/${consumer}")" \
    'styles/hub.css' \
    "${consumer} loads the service hub stylesheet"
done

assert_contains "${pckg_web_styles}" \
  '@source "../node_modules/@beskid/ui-react/src"' \
  "pckg web client scans shared React component utilities"
assert_contains "${pckg_web_styles}" \
  'styles/shadcn-entry.css' \
  "pckg web client loads shared component tokens"
assert_contains "${pckg_web_styles}" \
  'styles/hub.css' \
  "pckg web client loads the service hub stylesheet"
assert_contains "$(cat "${root}/pckg/src/Server/wwwroot/beskid-hub.css")" \
  '.beskid-hub__tile' \
  "pckg server serves hub tile styling"
assert_contains "$(cat "${root}/site/website/astro.config.mjs")" \
  'docsShellCustomCss' \
  "website loads the shared documentation shell"
assert_contains "$(cat "${root}/beskid_web_common/packages/beskid-ui/shell-css.mjs")" \
  "src/styles/hub.css" \
  "shared documentation shell includes the hub stylesheet"
assert_contains "$(cat "${root}/site/learn/src/styles.css")" \
  '@import "tailwindcss"' \
  "Learn enables the shared component utility compiler"
assert_contains "$(cat "${root}/site/learn/src/styles.css")" \
  '@source "../node_modules/@beskid/ui-react/src"' \
  "Learn scans shared React component utilities"
assert_contains "$(cat "${root}/site/learn/src/styles.css")" \
  'styles/shadcn-entry.css' \
  "Learn loads shared component tokens"
assert_contains "$(cat "${root}/site/learn/vite.config.ts")" \
  '@tailwindcss/vite' \
  "Learn compiles shared component utilities"
assert_contains "$(cat "${root}/site/learn/vite.config.ts")" \
  '"@beskid/material-theme"' \
  "Learn resolves the shared component theme"
assert_contains "$(cat "${root}/site/learn/index.html")" \
  'data-theme="dark"' \
  "Learn applies its shared component theme"

finish_tests
