# syntax=docker/dockerfile:1.7
FROM oven/bun:1.3.14 AS web

WORKDIR /app

RUN apt-get update \
  && apt-get install -y ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

COPY site/learn/package.json site/learn/pnpm-lock.yaml site/learn/.npmrc ./site/learn/
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable \
  && corepack prepare pnpm@10.14.0 --activate \
  && mkdir -p /pnpm/store
RUN --mount=type=cache,target=/pnpm/store pnpm --dir site/learn install --frozen-lockfile

COPY site/learn/ ./site/learn/
RUN pnpm --dir site/learn run build

FROM rust:1.88 AS rust
WORKDIR /workspace

COPY compiler/Cargo.toml compiler/Cargo.lock ./compiler/
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

FROM oven/bun:1.3.14
RUN apt-get update \
  && apt-get install -y --no-install-recommends wget \
  && rm -rf /var/lib/apt/lists/*
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

CMD ["bun", "run", "server.ts"]
