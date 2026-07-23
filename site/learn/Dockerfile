# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS web

WORKDIR /app

RUN apk add --no-cache git

COPY site/learn/package.json site/learn/pnpm-lock.yaml site/learn/.npmrc ./site/learn/
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g corepack@latest \
  && corepack enable \
  && corepack prepare pnpm@10.17.1 --activate \
  && mkdir -p /pnpm/store
RUN --mount=type=cache,target=/pnpm/store pnpm --dir site/learn install --frozen-lockfile

COPY site/learn/ ./site/learn/
RUN pnpm --dir site/learn run build

# wasmtime 41.x in the compiler lockfile requires rustc >= 1.90.
FROM rust:1.90 AS rust
WORKDIR /workspace

COPY compiler/Cargo.toml compiler/Cargo.lock ./compiler/
# beskid_abi's build script reads the runtime manifest at the compiler root.
COPY compiler/runtime_manifest.bsol ./compiler/runtime_manifest.bsol
# beskid_abi embeds corelib foundation sources via include_str!.
COPY compiler/corelib ./compiler/corelib
# beskid_abi also embeds the canonical Beskid runtime bootstrap source.
COPY compiler/runtime ./compiler/runtime
COPY compiler/crates ./compiler/crates
COPY compiler/vendor ./compiler/vendor
COPY beskid_bsol ./beskid_bsol

RUN --mount=type=cache,target=/usr/local/cargo/registry \
  --mount=type=cache,target=/workspace/target \
  cd compiler && cargo build -p beskid_cli --release
RUN cd compiler \
  && BESKID_RUNTIME_PREFIX=/workspace/compiler/target/native-runtime-kit \
  BESKID_RUNTIME_KIT_PROFILE=debug \
  BESKID_CLI_BIN=/workspace/compiler/target/release/beskid \
  ./scripts/stage-native-runtime-kit.sh

FROM node:24-alpine
RUN npm install -g corepack@latest \
  && corepack enable && corepack prepare pnpm@10.17.1 --activate \
  && apk add --no-cache wget \
  && npm install -g tsx
WORKDIR /app/site/learn

COPY --from=web /app/site/learn/dist /app/site/learn/dist
COPY --from=web /app/site/learn/server.ts /app/site/learn/server.ts
COPY --from=web /app/site/learn/package.json /app/site/learn/package.json
COPY --from=web /app/site/learn/.npmrc /app/site/learn/.npmrc
COPY --from=rust /workspace/compiler/target/release/beskid /app/site/learn/beskid
COPY --from=rust /workspace/compiler/target/native-runtime-kit /app/site/learn/native-runtime-kit

ENV NODE_ENV=production
ENV PORT=80
ENV BESKID_BINARY=/app/site/learn/beskid
ENV BESKID_RUNTIME_PREFIX=/app/site/learn/native-runtime-kit
ENV BESKID_COMMAND_TIMEOUT_MS=25000
EXPOSE 80

CMD ["pnpm", "exec", "tsx", "server.ts"]
