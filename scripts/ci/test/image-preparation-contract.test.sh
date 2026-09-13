#!/usr/bin/env bash
# Contract: every Node image receives the exact local graph selected by its
# frozen lockfile. Keep this structural test independent from a Docker daemon.
set -euo pipefail

root="$(cd "$(dirname "$0")/../../.." && pwd)"

for dockerfile in site/website/Dockerfile site/auth/Dockerfile; do
  content="$(<"${root}/${dockerfile}")"
  for requirement in \
    'COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./' \
    'COPY site/auth/package.json ./site/auth/package.json' \
    'COPY site/website/package.json ./site/website/package.json' \
    'COPY site/learn/package.json ./site/learn/package.json' \
    'COPY beskid_web_common ./beskid_web_common' \
    'pnpm install --frozen-lockfile'; do
    if [[ "${content}" != *"${requirement}"* ]]; then
      echo "${dockerfile} is missing required root-lock preparation: ${requirement}" >&2
      exit 1
    fi
  done
done

# The root workspace includes native lifecycle packages. Every Alpine Node
# build stage which performs that frozen install must provide node-gyp's
# compiler toolchain, just as the Auth image already does.
for dockerfile in site/website/Dockerfile site/learn/Dockerfile; do
  content="$(<"${root}/${dockerfile}")"
  if [[ "${content}" != *'apk add --no-cache git python3 make g++'* ]]; then
    echo "${dockerfile} must install the Alpine node-gyp toolchain before the root frozen install" >&2
    exit 1
  fi
done

# Root Docker contexts intentionally omit generated dist directories. Consumers
# of shared packages that export compiled entries must recreate those entries
# after their frozen install rather than relying on a developer's local output.
for dockerfile in site/auth/Dockerfile; do
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
  'COPY site/learn/package.json ./site/learn/package.json' \
  'COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./' \
  'COPY beskid_web_common ./beskid_web_common' \
  'pnpm install --frozen-lockfile --filter beskid-learn...' \
  'COPY compiler/scripts ./compiler/scripts' \
  'apt-get install -y --no-install-recommends clang lld mold' \
  'command -v clang' \
  'command -v ld.lld' \
  'command -v mold' \
  'mold --version' \
  'COPY compiler/.cargo ./compiler/.cargo' \
  'CARGO_TARGET_DIR=/workspace/target cargo build -p beskid_cli --release' \
  'CARGO_TARGET_DIR=/workspace/target cargo build -p beskid_lsp --release' \
  'BESKID_CORELIB_ROOT=/workspace/runtime-output/beskid_corelib' \
  '/workspace/runtime-output/beskid --version' \
  'test -f /workspace/runtime-output/beskid_corelib/beskid_corelib/corelib.bproj' \
  'BESKID_RUNTIME_PREFIX=/workspace/target/native-runtime-kit' \
  'BESKID_CLI_BIN=/workspace/target/release/beskid_cli' \
  'mkdir -p /workspace/runtime-output' \
  'install -m 0755 /workspace/target/release/beskid_cli /workspace/runtime-output/beskid' \
  'install -m 0755 /workspace/target/release/beskid_lsp /workspace/runtime-output/beskid_lsp' \
  'cp -a /workspace/target/native-runtime-kit /workspace/runtime-output/native-runtime-kit' \
  'COPY --from=rust /workspace/runtime-output/beskid /app/site/learn/beskid' \
  'COPY --from=rust /workspace/runtime-output/beskid_lsp /app/site/learn/beskid_lsp' \
  'COPY --from=rust /workspace/runtime-output/beskid_corelib /app/site/learn/beskid_corelib' \
  'COPY --from=rust /workspace/runtime-output/native-runtime-kit /app/site/learn/native-runtime-kit' \
  'COPY --from=web /app/site/learn/src/data /app/site/learn/src/data' \
  'COPY --from=web /app/site/learn/src/lib/playground.ts /app/site/learn/src/lib/playground.ts' \
  'COPY --from=web /app/site/learn/src/server /app/site/learn/src/server' \
  './scripts/stage-native-runtime-kit.sh'; do
  if [[ "${learn}" != *"${requirement}"* ]]; then
    echo "site/learn/Dockerfile is missing required dependency preparation: ${requirement}" >&2
    exit 1
  fi
done

if [[ "${learn}" != *'ENV BESKID_LSP_BINARY=/app/site/learn/beskid_lsp'* ]]; then
  echo "site/learn/Dockerfile must configure the bundled compiler language server" >&2
  exit 1
fi
if [[ "${learn}" != *'ENV BESKID_CORELIB_ROOT=/app/site/learn/beskid_corelib'* ]]; then
  echo "site/learn/Dockerfile must use the corelib bundled with its compiler build" >&2
  exit 1
fi

if [[ "${learn}" == *$'RUN cd compiler'* ]]; then
  echo "site/learn/Dockerfile must stage the runtime kit in the cache-mounted compiler build step" >&2
  exit 1
fi

# Learn's HTTP server is deliberately implemented with Bun APIs. The compiler
# is built in Debian Rust, so its runtime must also provide glibc rather than
# Alpine's musl loader; otherwise the binary exists but cannot execute.
if [[ "${learn}" != *'FROM oven/bun:1.3.14'* ]] ||
   [[ "${learn}" == *'FROM oven/bun:1.3.14-alpine'* ]] ||
   [[ "${learn}" != *'apt-get install -y --no-install-recommends wget'* ]] ||
   [[ "${learn}" != *'CMD ["bun", "run", "server.ts"]'* ]]; then
  echo "site/learn/Dockerfile must run the bundled glibc compiler with the pinned Bun runtime" >&2
  exit 1
fi
if [[ "${learn}" == *'npm install -g tsx'* ]]; then
  echo "site/learn/Dockerfile must not launch the Bun server through a Node-only tsx runtime" >&2
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
  'COPY beskid_bsol ./beskid_bsol' \
  'pnpm install --dir /src/beskid_web_common --frozen-lockfile' \
  'pnpm install --dir /src/pckg/web --frozen-lockfile' \
  'COPY compiler ./compiler' \
  'cargo build --release -p beskid_pckg_server' \
  'PCKG_ARTIFACT_ROOT=/app/packages' \
  '/health/ready'; do
  if [[ "${pckg}" != *"${requirement}"* ]]; then
    echo "pckg/Dockerfile is missing required Rust fresh-store preparation: ${requirement}" >&2
    exit 1
  fi
done

# Nexus authenticates through the Authentik proxy and deliberately has no
# application-level auth client dependency. Keep this contract to the two
# applications that still bundle that shared package.
for manifest in site/auth/package.json beskid_tracker/package.json; do
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
