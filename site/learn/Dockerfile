# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS web

WORKDIR /app

RUN apk add --no-cache git

COPY .npmrc ./
COPY site/learn/package.json site/learn/pnpm-lock.yaml ./site/learn/
# site/learn has its own lockfile, but its UI dependency is a local source.
COPY beskid_web_common ./beskid_web_common
RUN npm install -g pnpm@10.17.1
RUN pnpm --dir site/learn install --frozen-lockfile

COPY site/learn/ ./site/learn/
RUN pnpm --dir site/learn run build

# wasmtime 41.x in the compiler lockfile requires rustc >= 1.90.
FROM rust:1.90 AS rust
WORKDIR /workspace

# Canonical ABI-v5 runtime-kit staging compiles native context, TLS, and host shims with clang.
RUN apt-get update \
  && apt-get install -y --no-install-recommends clang lld \
  && rm -rf /var/lib/apt/lists/*

COPY compiler/Cargo.toml compiler/Cargo.lock ./compiler/
# beskid_abi's build script reads the runtime manifest at the compiler root.
COPY compiler/runtime_manifest.bsol ./compiler/runtime_manifest.bsol
# beskid_abi embeds corelib foundation sources via include_str!.
COPY compiler/corelib ./compiler/corelib
# beskid_abi also embeds the canonical Beskid runtime bootstrap source.
COPY compiler/runtime ./compiler/runtime
COPY compiler/crates ./compiler/crates
COPY compiler/scripts ./compiler/scripts
COPY compiler/vendor ./compiler/vendor
COPY beskid_bsol ./beskid_bsol

RUN --mount=type=cache,target=/usr/local/cargo/registry \
  --mount=type=cache,target=/workspace/target \
  set -e \
  && command -v clang \
  && command -v ld.lld \
  && mkdir -p /workspace/runtime-output \
  && cd compiler \
  && CARGO_TARGET_DIR=/workspace/target cargo build -p beskid_cli --release \
  && BESKID_RUNTIME_PREFIX=/workspace/target/native-runtime-kit \
  BESKID_RUNTIME_KIT_PROFILE=debug \
  BESKID_CLI_BIN=/workspace/target/release/beskid_cli \
  ./scripts/stage-native-runtime-kit.sh \
  && install -m 0755 /workspace/target/release/beskid_cli /workspace/runtime-output/beskid \
  && test -x /workspace/runtime-output/beskid || (echo "beskid binary missing after install" >&2 && exit 1) \
  && cp -a /workspace/target/native-runtime-kit /workspace/runtime-output/native-runtime-kit

# The production server is a Bun program (`Bun.serve` / `Bun.file`). Keep the
# runtime separate from the Node build stage and pin it to the project Bun
# release so the container starts with the APIs server.ts requires.
FROM oven/bun:1.3.14-alpine
RUN apk add --no-cache wget
WORKDIR /app/site/learn

COPY --from=web /app/.npmrc /app/.npmrc
COPY --from=web /app/site/learn/dist /app/site/learn/dist
COPY --from=web /app/site/learn/server.ts /app/site/learn/server.ts
COPY --from=web /app/site/learn/src/data /app/site/learn/src/data
COPY --from=web /app/site/learn/src/lib/server-routing.ts /app/site/learn/src/lib/server-routing.ts
COPY --from=web /app/site/learn/package.json /app/site/learn/package.json
COPY --from=rust /workspace/runtime-output/beskid /app/site/learn/beskid
COPY --from=rust /workspace/runtime-output/native-runtime-kit /app/site/learn/native-runtime-kit

ENV NODE_ENV=production
ENV PORT=80
ENV BESKID_BINARY=/app/site/learn/beskid
ENV BESKID_RUNTIME_PREFIX=/app/site/learn/native-runtime-kit
ENV BESKID_COMMAND_TIMEOUT_MS=25000
EXPOSE 80

CMD ["bun", "run", "server.ts"]
