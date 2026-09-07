# syntax=docker/dockerfile:1.7
#
# Build context: the `beskid_sites/` standalone workspace root.
#   docker build -t beskid-platform-spec -f apps/platform-spec/Dockerfile <beskid_sites-root>
#
# The `openspec/` tree (required by `seed:static`) must be present in the
# build context. CI is responsible for copying/mounting it (e.g. from the
# superrepo root) before `docker build` — see MIGRATION-NOTES.md.
FROM node:24-bookworm AS build

WORKDIR /app
ARG BESKID_RELEASE_CHANNEL=stable
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@10.17.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY packages/beskid-ui-react ./packages/beskid-ui-react
COPY packages/shell-core ./packages/shell-core
COPY apps/platform-spec/package.json ./apps/platform-spec/package.json

RUN pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

# The shared UI lib is a workspace:^ link that ships TS source; the app's
# vite config keeps it in `ssr.noExternal`, so it is compiled inline during
# the app build (no separate lib build step needed).

COPY apps/platform-spec ./apps/platform-spec
COPY openspec ./openspec

RUN test -f /app/openspec/catalog.json \
	&& node -e 'const fs=require("fs"); const c=JSON.parse(fs.readFileSync("/app/openspec/catalog.json","utf8")); if(!Array.isArray(c.entries)||c.entries.length===0){console.error("/app/openspec/catalog.json missing or empty"); process.exit(1)}'

ENV SKIP_ENV_VALIDATION=1
ENV OPENSPEC_ROOT=/app/openspec
RUN pnpm --dir apps/platform-spec run build
RUN pnpm --dir apps/platform-spec run verify:client-bundle

FROM node:24-bookworm-slim AS runtime

ARG BESKID_RELEASE_CHANNEL=stable

RUN apt-get update \
	&& apt-get install -y --no-install-recommends wget ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app/apps/platform-spec

ENV NODE_ENV=production
ENV PORT=8460
ENV OPENSPEC_ROOT=/app/openspec
ENV BESKID_RELEASE_CHANNEL=${BESKID_RELEASE_CHANNEL}

COPY --from=build /app/openspec /app/openspec
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/platform-spec/package.json ./
COPY --from=build /app/apps/platform-spec/node_modules ./node_modules
COPY --from=build /app/apps/platform-spec/.output ./.output
COPY --from=build /app/apps/platform-spec/seed ./seed
COPY --from=build /app/apps/platform-spec/docker/entrypoint.sh /usr/local/bin/platform-spec-entrypoint
RUN chmod +x /usr/local/bin/platform-spec-entrypoint

EXPOSE 8460

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
	CMD wget -q --spider http://127.0.0.1:8460/api/health \
	&& wget -q --spider http://127.0.0.1:8460/platform-spec || exit 1

CMD ["platform-spec-entrypoint"]
