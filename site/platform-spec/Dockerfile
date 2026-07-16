FROM oven/bun:latest AS build

WORKDIR /app

# Platform Spec is a root Bun workspace. Its lockfile lives at the repository
# root, so install from that authority rather than referring to a nonexistent
# per-site lockfile.
COPY package.json bun.lock .npmrc ./
COPY site/platform-spec/package.json ./site/platform-spec/package.json
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}
RUN bun install --frozen-lockfile

COPY site/platform-spec/ ./
COPY openspec /app/openspec

ENV SKIP_ENV_VALIDATION=1
RUN bun run --cwd site/platform-spec build
RUN bun run --cwd site/platform-spec verify:client-bundle

FROM oven/bun:latest AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/site/platform-spec

ENV NODE_ENV=production
ENV PORT=8460
ENV OPENSPEC_ROOT=/app/openspec

COPY --from=build /app/openspec /app/openspec
COPY --from=build /app/site/platform-spec/package.json ./
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/site/platform-spec/node_modules ./node_modules
COPY --from=build /app/site/platform-spec/.output ./.output

EXPOSE 8460

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8460/api/health || exit 1

CMD ["bun", "run", ".output/server/index.mjs"]
