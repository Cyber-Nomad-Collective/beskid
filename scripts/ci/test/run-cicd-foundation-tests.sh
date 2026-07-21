#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

for script in \
  build-release-manifest.sh \
  validate-release-manifest.sh \
  render-release-compose.sh \
  deploy-release-manifest.sh \
  post-deploy-smoke.sh \
  sign-image.sh \
  prepare-secure-dockerfile.sh \
  sync-runtime-env.sh \
  validate-promotion-source.sh; do
  bash -n "${root}/scripts/ci/${script}"
done

"${root}/scripts/ci/test/run-distribute-workflow-contract-tests.sh"
bash "${root}/scripts/ci/test/delivery-contract.test.sh"
bash "${root}/scripts/ci/test/shared-ui-nexus-gate-contract.test.sh"

# CoreLib workspace member aliases intentionally differ from registry package
# names; the quality gate must validate each member's package declaration.
CORELIB_QUALITY_ONLY=1 "${root}/scripts/ci/corelib-gate.sh"
bash "${root}/scripts/ci/test/corelib-gate-report.test.sh"
bash "${root}/scripts/ci/test/corelib-workflow-report-contract.test.sh"

mkdir -p "${tmp}/records" "${tmp}/bin"
cat >"${tmp}/records/site.json" <<'JSON'
{"name":"beskid-site","repository":"ghcr.io/cyber-nomad-collective/beskid-site","digest":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","sbom":true,"provenance":true,"vulnerabilities":"passed","signed":true}
JSON
cat >"${tmp}/records/platform-spec-image.json" <<'JSON'
{"name":"beskid-platform-spec","repository":"ghcr.io/cyber-nomad-collective/beskid-platform-spec","digest":"sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","sbom":true,"provenance":true,"vulnerabilities":"passed","signed":true}
JSON
cat >"${tmp}/compose.yml" <<'YAML'
name: beskid-platform-production
services:
  site:
    image: ghcr.io/cyber-nomad-collective/beskid-site:${BESKID_RELEASE_TAG:?immutable manifest required}
  platform-spec:
    image: ghcr.io/cyber-nomad-collective/beskid-platform-spec:${BESKID_RELEASE_TAG:?immutable manifest required}
  postgres:
    image: postgres:16
YAML

export GITHUB_REPOSITORY=Cyber-Nomad-Collective/beskid
export GITHUB_SHA=0123456789abcdef0123456789abcdef01234567
export GITHUB_RUN_ID=123
export GITHUB_RUN_ATTEMPT=1
export GITHUB_WORKFLOW_REF=local-test
"${root}/scripts/ci/build-release-manifest.sh" "${tmp}/records" "${tmp}/release.json"
"${root}/scripts/ci/render-release-compose.sh" "${tmp}/release.json" "${tmp}/compose.yml" "${tmp}/rendered.yml"
rg -q 'beskid-site@sha256:a{64}' "${tmp}/rendered.yml"
rg -q 'beskid-platform-spec@sha256:b{64}' "${tmp}/rendered.yml"
rg -q 'image: postgres:16' "${tmp}/rendered.yml"

for dockerfile in \
  site/website/Dockerfile \
  site/auth/Dockerfile \
  site/platform-spec/Dockerfile \
  beskid_tracker/Dockerfile \
  beskid_nexus/Dockerfile; do
  secure="${tmp}/$(echo "${dockerfile}" | tr / -)"
  "${root}/scripts/ci/prepare-secure-dockerfile.sh" "${root}/${dockerfile}" "${secure}"
  if rg -q 'ARG[[:space:]]+NODE_AUTH_TOKEN|ENV[[:space:]]+NODE_AUTH_TOKEN' "${secure}"; then
    echo "package token declaration remains in ${secure}" >&2
    exit 1
  fi
  rg -q 'mount=type=secret,id=NODE_AUTH_TOKEN' "${secure}"
done

# Nexus keeps its service directory as the primary Docker context while the
# centralized image workflow supplies the canonical standard as an explicit,
# read-only named BuildKit context.
rg -Fq 'build-contexts:' "${root}/.github/workflows/reusable-image.yml"
rg -Fq 'build-contexts: ${{ inputs.build-contexts }}' "${root}/.github/workflows/reusable-image.yml"
rg -Fq 'openspec=./openspec' "${root}/.github/workflows/platform-delivery.yml"
rg -Fq "apply: \${{ github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && inputs.apply-staging) }}" "${root}/.github/workflows/platform-delivery.yml"
rg -Fq 'submodules: beskid_web_common beskid_tracker beskid_nexus compiler' "${root}/.github/workflows/platform-delivery.yml"
if rg -Fq "github.event_name == 'push' || inputs." "${root}/.github/workflows/platform-delivery.yml"; then
  echo "platform delivery must guard workflow_dispatch inputs outside dispatch events" >&2
  exit 1
fi
pckg_image_block="$(sed -n '/^  image-pckg:/,/^  manifest:/p' "${root}/.github/workflows/platform-delivery.yml")"
for required in \
  'context: .' \
  'submodules: pckg beskid_web_common' \
  'node-auth: true' \
  'NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN || github.token }}'; do
  if [[ "${pckg_image_block}" != *"${required}"* ]]; then
    echo "pckg image workflow is missing required contract: ${required}" >&2
    exit 1
  fi
done
tracker_image_block="$(sed -n '/^  image-tracker:/,/^  image-nexus:/p' "${root}/.github/workflows/platform-delivery.yml")"
for required in \
  'web_common=./beskid_web_common' \
  'submodules: beskid_tracker beskid_web_common'; do
  if [[ "${tracker_image_block}" != *"${required}"* ]]; then
    echo "tracker image workflow is missing required contract: ${required}" >&2
    exit 1
  fi
done
if ! rg -Fq 'bun install --cwd=/src/beskid_web_common --frozen-lockfile' "${root}/pckg/Dockerfile"; then
  echo "pckg Dockerfile must frozen-install beskid_web_common before pckg/web" >&2
  exit 1
fi
if ! rg -Fq 'COPY --from=web_common' "${root}/beskid_tracker/Dockerfile"; then
  echo "tracker Dockerfile must consume the web_common BuildKit context before bun install" >&2
  exit 1
fi
rg -Fq 'NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN || github.token }}' "${root}/.github/workflows/reusable-quality.yml"
if [[ "${pckg_image_block}" == *'optional: true'* ]]; then
  echo "pckg image lane must be a hard gate (optional: true is forbidden)" >&2
  exit 1
fi
rg -Fq 'submodule update --init --recursive --depth 1' "${root}/scripts/ci/init-submodules.sh"
rg -Fq 'COPY --from=openspec catalog.json /app/openspec/catalog.json' "${root}/beskid_nexus/Dockerfile"
rg -Fq 'NEXUS_OPEN_SPEC_CATALOG=/app/openspec/catalog.json' "${root}/beskid_nexus/Dockerfile"
rg -Fq 'openspec: ${NEXUS_OPEN_SPEC_CONTEXT:-../openspec}' "${root}/beskid_nexus/docker-compose.yml"
rg -Fq 'openspec: ${NEXUS_OPEN_SPEC_CONTEXT:-../../openspec}' "${root}/beskid_nexus/infra/docker-compose.yml"
rg -Fq 'NEXUS_OPEN_SPEC_CATALOG: ${NEXUS_OPEN_SPEC_CATALOG:-/app/openspec/catalog.json}' "${root}/beskid_nexus/docker-compose.coolify.yml"

jq '.images[0].digest = "latest"' "${tmp}/release.json" >"${tmp}/invalid.json"
if "${root}/scripts/ci/validate-release-manifest.sh" "${tmp}/invalid.json" >/dev/null 2>&1; then
  echo "invalid mutable manifest unexpectedly passed" >&2
  exit 1
fi

cat >"${tmp}/workflow-run.json" <<'JSON'
{"id":123,"conclusion":"success","head_branch":"main","path":".github/workflows/platform-delivery.yml"}
JSON
"${root}/scripts/ci/validate-promotion-source.sh" "${tmp}/workflow-run.json" "${tmp}/release.json"
jq '.head_branch = "feature"' "${tmp}/workflow-run.json" >"${tmp}/invalid-run.json"
if "${root}/scripts/ci/validate-promotion-source.sh" "${tmp}/invalid-run.json" "${tmp}/release.json" >/dev/null 2>&1; then
  echo "non-main production source unexpectedly passed" >&2
  exit 1
fi

cat >"${tmp}/lane.json" <<'JSON'
{"openbao_services":["auth"],"compose_profiles":"tracker","static_env":{"STATIC_VALUE":"staging"}}
JSON
export MOCK_SYNC_BODY="${tmp}/sync-body.json"
cat >"${tmp}/bin/curl" <<'SH'
#!/usr/bin/env bash
url=''
body=''
previous=''
for argument in "$@"; do
  if [[ "${previous}" == -d ]]; then body="${argument}"; fi
  if [[ "${argument}" == https://* ]]; then url="${argument}"; fi
  previous="${argument}"
done
case "${url}" in
  https://bao.invalid/*)
    echo '{"data":{"data":{"SESSION_SECRET":"secret-value"}}}'
    ;;
  https://coolify.invalid/*/envs/bulk)
    printf '%s' "${body}" >"${MOCK_SYNC_BODY}"
    echo '{}'
    ;;
  *)
    echo "unexpected sync URL: ${url}" >&2
    exit 2
    ;;
esac
SH
chmod +x "${tmp}/bin/curl"
PATH="${tmp}/bin:${PATH}" \
  TRACEPARENT=00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01 \
  BESKID_RELEASE_MANIFEST_SHA256=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc \
  OPENBAO_ADDR=https://bao.invalid OPENBAO_TOKEN=test \
  COOLIFY_ENDPOINT=https://coolify.invalid COOLIFY_API_TOKEN=test COOLIFY_SERVICE_UUID=test \
  "${root}/scripts/ci/sync-runtime-env.sh" staging "${tmp}/lane.json"
jq -e '
  ([.data[] | select(.key == "SESSION_SECRET" and .value == "secret-value")] | length == 1) and
  ([.data[] | select(.key == "STATIC_VALUE" and .value == "staging")] | length == 1) and
  ([.data[] | select(.key == "COMPOSE_PROFILES" and .value == "tracker")] | length == 1) and
  ([.data[] | select(.key == "BESKID_RELEASE_MANIFEST_SHA256" and (.value | length) == 64)] | length == 1) and
  ([.data[] | select(.key == "BESKID_DEPLOYMENT_TRACEPARENT" and (.value | startswith("00-")))] | length == 1)
' "${MOCK_SYNC_BODY}" >/dev/null

# COOLIFY_SERVICE_UUID may come from lane config service_uuid when unset.
cat >"${tmp}/lane-uuid.json" <<'JSON'
{"service_uuid":"from-lane-config","openbao_services":["auth"],"static_env":{}}
JSON
export MOCK_SYNC_URL="${tmp}/sync-url.txt"
cat >"${tmp}/bin/curl" <<'SH'
#!/usr/bin/env bash
url=''
previous=''
for argument in "$@"; do
  if [[ "${argument}" == https://* ]]; then url="${argument}"; fi
  previous="${argument}"
done
case "${url}" in
  https://bao.invalid/*)
    echo '{"data":{"data":{"SESSION_SECRET":"secret-value"}}}'
    ;;
  https://coolify.invalid/*/envs/bulk)
    printf '%s' "${url}" >"${MOCK_SYNC_URL}"
    echo '{}'
    ;;
  *)
    echo "unexpected sync URL: ${url}" >&2
    exit 2
    ;;
esac
SH
chmod +x "${tmp}/bin/curl"
PATH="${tmp}/bin:${PATH}"   OPENBAO_ADDR=https://bao.invalid OPENBAO_TOKEN=test   COOLIFY_ENDPOINT=https://coolify.invalid COOLIFY_API_TOKEN=test   env -u COOLIFY_SERVICE_UUID   "${root}/scripts/ci/sync-runtime-env.sh" staging "${tmp}/lane-uuid.json"
grep -Fq '/services/from-lane-config/envs/bulk' "${MOCK_SYNC_URL}"

cat >"${tmp}/bin/docker" <<'SH'
#!/usr/bin/env bash
[[ "$1" == compose ]] || exit 2
exit 0
SH
chmod +x "${tmp}/bin/docker"
PATH="${tmp}/bin:${PATH}" "${root}/scripts/ci/deploy-release-manifest.sh" \
  --lane staging --manifest "${tmp}/release.json" --compose "${tmp}/compose.yml"

export MOCK_COOLIFY_STATE="${tmp}/coolify-state"
mkdir -p "${MOCK_COOLIFY_STATE}"
cat >"${tmp}/bin/curl" <<'SH'
#!/usr/bin/env bash
method=GET
url=''
previous=''
for argument in "$@"; do
  if [[ "${previous}" == -X ]]; then method="${argument}"; fi
  if [[ "${argument}" == https://coolify.invalid/* ]]; then url="${argument}"; fi
  previous="${argument}"
done
case "${method}:${url}" in
  GET:*/services/test)
    echo '{"docker_compose_raw":"bmFtZTogb2xkCg=="}'
    ;;
  PATCH:*/services/test)
    echo '{}'
    ;;
  GET:*/deploy\?*)
    if [[ ! -f "${MOCK_COOLIFY_STATE}/trigger-failed" ]]; then
      touch "${MOCK_COOLIFY_STATE}/trigger-failed"
      echo 'simulated deployment trigger failure' >&2
      exit 22
    fi
    echo '{"deployment_uuid":"rollback-1"}'
    ;;
  GET:*/deployments/rollback-1)
    touch "${MOCK_COOLIFY_STATE}/rollback-complete"
    echo '{"status":"finished"}'
    ;;
  *)
    echo "unexpected mock Coolify call: ${method} ${url}" >&2
    exit 2
    ;;
esac
SH
chmod +x "${tmp}/bin/curl"
if PATH="${tmp}/bin:${PATH}" \
  COOLIFY_ENDPOINT=https://coolify.invalid \
  COOLIFY_API_TOKEN=test \
  COOLIFY_SERVICE_UUID=test \
  "${root}/scripts/ci/deploy-release-manifest.sh" --apply \
    --lane staging --manifest "${tmp}/release.json" --compose "${tmp}/compose.yml" >/dev/null 2>&1; then
  echo "failed Coolify API unexpectedly produced a successful deployment" >&2
  exit 1
fi
[[ -f "${MOCK_COOLIFY_STATE}/rollback-complete" ]] || {
  echo "failed deployment did not complete rollback" >&2
  exit 1
}

echo "CI/CD foundation tests OK"
