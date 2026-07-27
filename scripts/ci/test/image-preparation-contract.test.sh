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
  'apt-get install -y --no-install-recommends clang lld' \
  'command -v clang' \
  'command -v ld.lld' \
  'CARGO_TARGET_DIR=/workspace/target cargo build -p beskid_cli --release' \
  'BESKID_RUNTIME_PREFIX=/workspace/target/native-runtime-kit' \
  'BESKID_CLI_BIN=/workspace/target/release/beskid_cli' \
  'mkdir -p /workspace/runtime-output' \
  'install -m 0755 /workspace/target/release/beskid_cli /workspace/runtime-output/beskid' \
  'cp -a /workspace/target/native-runtime-kit /workspace/runtime-output/native-runtime-kit' \
  'COPY --from=rust /workspace/runtime-output/beskid /app/site/learn/beskid' \
  'COPY --from=rust /workspace/runtime-output/native-runtime-kit /app/site/learn/native-runtime-kit' \
  'COPY --from=web /app/site/learn/src/data /app/site/learn/src/data' \
  './scripts/stage-native-runtime-kit.sh'; do
  if [[ "${learn}" != *"${requirement}"* ]]; then
    echo "site/learn/Dockerfile is missing required dependency preparation: ${requirement}" >&2
    exit 1
  fi
done

if [[ "${learn}" == *$'RUN cd compiler'* ]]; then
  echo "site/learn/Dockerfile must stage the runtime kit in the cache-mounted compiler build step" >&2
  exit 1
fi

# Learn's HTTP server is deliberately implemented with Bun APIs. A Node/tsx
# runtime can build the assets yet crash before the Compose healthcheck runs.
if [[ "${learn}" != *'FROM oven/bun:1.3.14-alpine'* ]] ||
   [[ "${learn}" != *'CMD ["bun", "run", "server.ts"]'* ]]; then
  echo "site/learn/Dockerfile must run the Bun server with the pinned Bun runtime" >&2
  exit 1
fi
if [[ "${learn}" == *'npm install -g tsx'* ]]; then
  echo "site/learn/Dockerfile must not launch the Bun server through a Node-only tsx runtime" >&2
  exit 1
fi

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

tracker_vite="$(<"${root}/beskid_tracker/vite.config.ts")"
if [[ "${tracker_vite}" != *'nitro({ preset: "node-server" })'* ]] ||
   [[ "${tracker}" != *'FROM node:24-alpine AS runtime'* ]] ||
   [[ "${tracker}" != *'CMD ["node", ".output/server/index.mjs"]'* ]]; then
	echo "beskid_tracker bundle and production image must use the same Node runtime" >&2
	exit 1
fi

reusable_image="$(<"${root}/.github/workflows/reusable-image.yml")"
for requirement in \
	'healthcheck-url:' \
	'healthcheck-env:' \
	'Probe published image health' \
  'docker run -d --rm'; do
  if [[ "${reusable_image}" != *"${requirement}"* ]]; then
    echo "reusable image workflow is missing runtime health contract: ${requirement}" >&2
    exit 1
  fi
done

tracker_image_block="$(sed -n '/^  image-tracker:/,/^  image-nexus:/p' "${root}/.github/workflows/platform-delivery.yml")"
if [[ "${tracker_image_block}" != *'healthcheck-url: /api/health'* ]] ||
   [[ "${tracker_image_block}" != *'AUTH_HUB_PUBLIC_URL=https://auth.invalid'* ]] ||
   [[ "${tracker_image_block}" != *'SESSION_SECRET=0123456789abcdef0123456789abcdef'* ]]; then
  echo "tracker image lane must declare its published-image health endpoint" >&2
  exit 1
fi

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
