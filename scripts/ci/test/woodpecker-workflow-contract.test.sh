#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow_dir="${ROOT}/.woodpecker"
compose="${ROOT}/deploy/woodpecker/compose.yml"
env_example="${ROOT}/deploy/woodpecker/.env.example"

if [[ -d "${workflow_dir}" ]]; then
  workflow_count="$(find "${workflow_dir}" -maxdepth 1 -type f -name '*.yml' -print | wc -l | tr -d ' ')"
else
  workflow_count=0
fi
[[ "${workflow_count}" -eq 3 ]] || {
  echo "expected exactly three Woodpecker workflows, found ${workflow_count}" >&2
  exit 1
}

for name in linux macos windows; do
  file="${workflow_dir}/${name}.yml"
  test -f "${file}"
  grep -Fq 'woodpecker-build-platform.sh' "${file}"
done

grep -Fq 'platform: linux/amd64' "${workflow_dir}/linux.yml"
grep -Fq 'backend: docker' "${workflow_dir}/linux.yml"
grep -Fq 'role: beskid-linux' "${workflow_dir}/linux.yml"
grep -Fq 'event: [push, tag, manual]' "${workflow_dir}/linux.yml"
if grep -Fq 'pull_request' "${workflow_dir}/linux.yml"; then
  echo 'Linux workflow must not expose its durable host bind to pull requests' >&2
  exit 1
fi
grep -Fq 'platform: darwin/arm64' "${workflow_dir}/macos.yml"
grep -Fq 'backend: local' "${workflow_dir}/macos.yml"
grep -Fq 'role: beskid-macos' "${workflow_dir}/macos.yml"
grep -Fq 'platform: windows/amd64' "${workflow_dir}/windows.yml"
grep -Fq 'backend: local' "${workflow_dir}/windows.yml"
grep -Fq 'role: beskid-windows' "${workflow_dir}/windows.yml"

for file in "${workflow_dir}/macos.yml" "${workflow_dir}/windows.yml"; do
  grep -Fq 'event: tag' "${file}"
  grep -Fq 'ref: refs/tags/v*' "${file}"
  grep -Fq 'event: manual' "${file}"
done

if grep -RiqE 'publish|from_secret|GH_TOKEN|S3|rclone' "${workflow_dir}"; then
  echo 'Woodpecker build workflows must not publish or stage artifacts externally' >&2
  exit 1
fi

test -f "${compose}"
test -f "${env_example}"
grep -Fq 'woodpecker-server:v3.18.1@sha256:0b8dbb53d3795f470f524cdb186551f0ad383cc4bd0d299febb7f3d7c6a56771' "${compose}"
grep -Fq 'woodpecker-agent:v3.18.1@sha256:93235c148a9f91aa455bd88dc788a12bed7921499f33fee1124ac50aad7b8e1a' "${compose}"
grep -Fq 'https://ci.beskid-lang.org' "${compose}"
grep -Fq 'https://woodpecker-agent.beskid-lang.org' "${compose}"
grep -Fq 'caddy_1.reverse_proxy.transport.versions: h2c' "${compose}"
grep -Fq 'WOODPECKER_MAX_WORKFLOWS: "1"' "${compose}"
grep -Fq 'WOODPECKER_ADMIN: pmikstacki' "${compose}"
grep -Fq 'WOODPECKER_ORGS: Cyber-Nomad-Collective' "${compose}"
grep -Fq 'WOODPECKER_REPO_OWNERS: Cyber-Nomad-Collective' "${compose}"
grep -Fq 'WOODPECKER_DISABLE_USER_AGENT_REGISTRATION: "true"' "${compose}"
grep -Fq 'WOODPECKER_GITHUB_PUBLIC_ONLY: "true"' "${compose}"
grep -Fq 'WOODPECKER_GRPC_SECRET:' "${compose}"
grep -Fq 'WOODPECKER_AGENT_LABELS: platform=linux/amd64,backend=docker,role=beskid-linux' "${compose}"
grep -Fq '/opt/woodpecker/data:/var/lib/woodpecker' "${compose}"
grep -Fq 'name: coolify' "${compose}"
grep -Fq 'external: true' "${compose}"

if grep -Eq '=.+$' "${env_example}"; then
  echo '.env.example must contain variable names only' >&2
  exit 1
fi

echo 'Woodpecker workflow contract tests OK'
