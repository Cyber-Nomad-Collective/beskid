#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
workflow_dir="${ROOT}/.woodpecker"
compose="${ROOT}/deploy/woodpecker/compose.yml"
env_example="${ROOT}/deploy/woodpecker/.env.example"

test -d "${workflow_dir}"
test ! -e "${workflow_dir}/standard.yml"

for name in linux macos windows; do
  file="${workflow_dir}/${name}.yml"
  test -f "${file}"
  grep -Fq 'woodpecker-build-platform.sh' "${file}"
  grep -Fq 'recursive: false' "${file}"
done

grep -Fq 'platform: linux/amd64' "${workflow_dir}/linux.yml"
grep -Fq 'backend: docker' "${workflow_dir}/linux.yml"
grep -Fq 'role: beskid-linux' "${workflow_dir}/linux.yml"
grep -Fq 'event: [push, tag]' "${workflow_dir}/linux.yml"
if grep -Fq 'pull_request' "${workflow_dir}/linux.yml"; then
  echo 'Linux workflow must not expose its durable host bind to pull requests' >&2
  exit 1
fi
grep -Fq 'platform: darwin/arm64' "${workflow_dir}/macos.yml"
grep -Fq 'backend: local' "${workflow_dir}/macos.yml"
grep -Fq 'role: beskid-macos' "${workflow_dir}/macos.yml"
grep -Fq 'image: plugin-git' "${workflow_dir}/macos.yml"
grep -Fq 'platform: windows/amd64' "${workflow_dir}/windows.yml"
grep -Fq 'backend: local' "${workflow_dir}/windows.yml"
grep -Fq 'role: beskid-windows' "${workflow_dir}/windows.yml"
grep -Fq 'image: plugin-git' "${workflow_dir}/windows.yml"

for file in "${workflow_dir}/macos.yml" "${workflow_dir}/windows.yml"; do
  grep -Fq 'event: tag' "${file}"
  grep -Fq 'ref: refs/tags/v*' "${file}"
  grep -Fq 'event: manual' "${file}"
  grep -Fq 'BESKID_TASK == "build"' "${file}"
done

for file in "${workflow_dir}/linux.yml" "${workflow_dir}/macos.yml" "${workflow_dir}/windows.yml"; do
  grep -Fq 'woodpecker-package-platform.mjs' "${file}"
  grep -Fq 'package-result.json' "${file}"
  ! grep -Fq 'BESKID_RELEASE_EVIDENCE_DIR' "${file}"
  ! grep -Fq 'output}/package' "${file}"
done
grep -Fq 'BESKID_TASK == "build" || BESKID_TASK == "validate"' "${workflow_dir}/linux.yml"

# Open VSX is a protected, explicit publisher. The workflow must not inherit
# credentials into an ordinary validation or native-build lane.
open_vsx_workflow="${workflow_dir}/open-vsx.yml"
test -f "${open_vsx_workflow}"
grep -Fq 'BESKID_TASK == "open-vsx-publish"' "${open_vsx_workflow}"
grep -Fq 'role: beskid-linux' "${open_vsx_workflow}"
grep -Fq 'event: manual' "${open_vsx_workflow}"
grep -Fq 'branch: main' "${open_vsx_workflow}"
grep -Fq 'from_secret: open_vsx_token' "${open_vsx_workflow}"
grep -Fq 'BESKID_OPEN_VSX_PUBLISH: "1"' "${open_vsx_workflow}"
grep -Fq 'init-submodules.sh compiler beskid_bsol beskid_vscode' "${open_vsx_workflow}"
grep -Fq 'open-vsx-publish.sh linux-x64 beskid_lsp' "${open_vsx_workflow}"
grep -Fq 'BESKID_RELEASE_VERSION:?set stable version' "${open_vsx_workflow}"
grep -Fq 'nodejs' "${open_vsx_workflow}"
grep -Fq '"$${bun_archive}"' "${open_vsx_workflow}"
! grep -Fq '"${bun_archive}"' "${open_vsx_workflow}"

# This contract owns only native build and standard validation lanes. Editor,
# security and protected publishing lanes have separate policy contracts;
# adding them must not grant publication authority to these four workflows.
if grep -iqE 'from_secret|GH_TOKEN|S3|rclone' "${workflow_dir}/linux.yml" "${workflow_dir}/macos.yml" "${workflow_dir}/windows.yml"; then
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
