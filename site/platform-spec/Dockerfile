FROM oven/bun:latest AS build

WORKDIR /app

# spec-cli + spec-core for container tooling
COPY beskid_web_common/packages/spec-cli/package.json beskid_web_common/packages/spec-cli/
COPY beskid_web_common/packages/spec-core/package.json beskid_web_common/packages/spec-core/
COPY beskid_web_common/packages/trudoc/package.json beskid_web_common/packages/trudoc/

WORKDIR /app/site/platform-spec

COPY site/platform-spec/package.json site/platform-spec/bun.lock site/platform-spec/.npmrc ./
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}
RUN bun install --frozen-lockfile

COPY beskid_web_common/packages/spec-cli /app/beskid_web_common/packages/spec-cli
COPY beskid_web_common/packages/spec-core /app/beskid_web_common/packages/spec-core
COPY beskid_web_common/packages/trudoc /app/beskid_web_common/packages/trudoc
COPY site/platform-spec/ ./

# Normative JSON workspace (submodule) + legacy MDX seed source
COPY site/spec-content /app/site/spec-content
COPY site/website/src/content/docs/platform-spec /app/site/platform-spec/seed-source/platform-spec

ENV SKIP_ENV_VALIDATION=1
RUN bun run build
RUN bun run verify:client-bundle

FROM oven/bun:latest AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/site/platform-spec

ENV NODE_ENV=production
ENV PORT=8460
ENV SPEC_WORKSPACE_DIR=/app/site/spec-content
ENV PLATFORM_SPEC_SEED_FROM=/app/site/platform-spec/seed-source/platform-spec

COPY --from=build /app/beskid_web_common/packages/spec-cli /app/beskid_web_common/packages/spec-cli
COPY --from=build /app/beskid_web_common/packages/spec-core /app/beskid_web_common/packages/spec-core
COPY --from=build /app/beskid_web_common/packages/trudoc /app/beskid_web_common/packages/trudoc
COPY --from=build /app/site/spec-content /app/site/spec-content
COPY --from=build /app/site/platform-spec/package.json /app/site/platform-spec/bun.lock ./
COPY --from=build /app/site/platform-spec/node_modules ./node_modules
COPY --from=build /app/site/platform-spec/.output ./.output
COPY --from=build /app/site/platform-spec/scripts ./scripts
COPY --from=build /app/site/platform-spec/seed-source ./seed-source

EXPOSE 8460

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8460/api/health || exit 1

CMD ["bun", "run", "scripts/docker-entrypoint.ts"]
