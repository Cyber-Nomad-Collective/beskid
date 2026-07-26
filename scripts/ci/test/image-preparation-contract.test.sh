#!/usr/bin/env bash
# Contract: every Node image receives the exact local graph selected by its
# frozen lockfile. Keep this structural test independent from a Docker daemon.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"

for dockerfile in site/website/Dockerfile site/auth/Dockerfile site/platform-spec/Dockerfile; do
  content="$(<"${root}/${dockerfile}")"
  for requirement in \
    'COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./' \
    'COPY site/auth/package.json ./site/auth/package.json' \
    'COPY site/website/package.json ./site/website/package.json' \
    'COPY site/platform-spec/package.json ./site/platform-spec/package.json' \
    'COPY site/learn/package.json ./site/learn/package.json' \
    'COPY beskid_web_common ./beskid_web_common' \
    'pnpm install --frozen-lockfile'; do
    if [[ "${content}" != *"${requirement}"* ]]; then
      echo "${dockerfile} is missing required root-lock preparation: ${requirement}" >&2
      exit 1
    fi
  done
done

# Root Docker contexts intentionally omit generated dist directories. Consumers
# of shared packages that export compiled entries must recreate those entries
# after their frozen install rather than relying on a developer's local output.
for dockerfile in site/auth/Dockerfile site/platform-spec/Dockerfile; do
  content="$(<"${root}/${dockerfile}")"
  for requirement in \
    'pnpm --filter @beskid/auth-client build' \
    'pnpm --filter @cyber-nomad-collective/beskid-server-observability build'; do
    if [[ "${content}" != *"${requirement}"* ]]; then
      echo "${dockerfile} must rebuild compiled shared package exports after frozen install" >&2
      exit 1
    fi
  done
done

learn="$(<"${root}/site/learn/Dockerfile")"
for requirement in \
  'COPY site/learn/package.json site/learn/pnpm-lock.yaml ./site/learn/' \
  'COPY beskid_web_common ./beskid_web_common' \
  'pnpm --dir site/learn install --frozen-lockfile' \
  'COPY compiler/scripts ./compiler/scripts' \
  './scripts/stage-native-runtime-kit.sh'; do
  if [[ "${learn}" != *"${requirement}"* ]]; then
    echo "site/learn/Dockerfile is missing required dependency preparation: ${requirement}" >&2
    exit 1
  fi
done

learn_lane="$(sed -n '/^  image-learn:/,/^  image-platform-spec:/p' "${root}/.github/workflows/platform-delivery.yml")"
if [[ "${learn_lane}" != *'submodules: compiler beskid_bsol beskid_web_common'* ]]; then
  echo "image-learn must initialize the shared UI source required by its local lockfile" >&2
  exit 1
fi

tracker_ignore="$(<"${root}/beskid_tracker/.dockerignore")"
if [[ "${tracker_ignore}" == *$'\npnpm-lock.yaml'* || "${tracker_ignore}" == pnpm-lock.yaml* ]]; then
  echo "beskid_tracker/.dockerignore excludes the lockfile required by its Dockerfile" >&2
  exit 1
fi

tracker="$(<"${root}/beskid_tracker/Dockerfile")"
for requirement in \
  'apk add --no-cache bash' \
  'COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./' \
  'COPY --from=web_common . /app/beskid_web_common' \
  'pnpm install --frozen-lockfile'; do
  if [[ "${tracker}" != *"${requirement}"* ]]; then
    echo "beskid_tracker/Dockerfile is missing required named-context preparation: ${requirement}" >&2
    exit 1
  fi
done

nexus="$(<"${root}/beskid_nexus/Dockerfile")"
for requirement in \
  'bun@1.3.14' \
  'COPY --from=web_common package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json /src/beskid_web_common/' \
  'COPY --from=web_common packages /src/beskid_web_common/packages' \
  'pnpm install --dir /src/beskid_web_common --frozen-lockfile' \
  'pnpm --dir gitnexus install --frozen-lockfile'; do
  if [[ "${nexus}" != *"${requirement}"* ]]; then
    echo "beskid_nexus/Dockerfile is missing required named-context preparation: ${requirement}" >&2
    exit 1
  fi
done

pckg="$(<"${root}/pckg/Dockerfile")"
for requirement in \
  'COPY beskid_web_common ./beskid_web_common' \
  'pnpm install --dir /src/beskid_web_common --frozen-lockfile' \
  'pnpm install --dir /src/pckg/web --frozen-lockfile'; do
  if [[ "${pckg}" != *"${requirement}"* ]]; then
    echo "pckg/Dockerfile is missing required root-context preparation: ${requirement}" >&2
    exit 1
  fi
done

for manifest in site/auth/package.json site/platform-spec/package.json beskid_tracker/package.json beskid_nexus/gitnexus/package.json; do
  source='../../beskid_web_common/packages/beskid-auth-client'
  if [[ "${manifest}" == beskid_tracker/* ]]; then
    source='../beskid_web_common/packages/beskid-auth-client'
  fi
  node -e '
    const fs = require("fs");
    const manifest = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const source = manifest.dependencies?.["@beskid/auth-client"];
    if (source !== "file:" + process.argv[2]) {
      throw new Error(`${process.argv[1]} must alias @beskid/auth-client to ${process.argv[2]}`);
    }
  ' "${root}/${manifest}" "${source}"
done

node -e '
  const fs = require("fs");
  const packageJson = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  if (packageJson.name !== "@beskid/auth-client") {
    throw new Error("beskid-auth-client package name is not canonical");
  }
' "${root}/beskid_web_common/packages/beskid-auth-client/package.json"

echo "image preparation contract OK"
