# syntax=docker/dockerfile:1.7
FROM node:24-bookworm AS build

WORKDIR /app
ARG BESKID_RELEASE_CHANNEL=stable
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@10.17.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Keep this root-lock install structurally identical to the website image.
# All site importers and file-linked shared packages must exist before pnpm
# validates the frozen graph.
COPY site/auth/package.json ./site/auth/package.json
COPY site/website/package.json ./site/website/package.json
COPY site/platform-spec/package.json ./site/platform-spec/package.json
COPY site/learn/package.json ./site/learn/package.json
COPY beskid_web_common ./beskid_web_common
COPY openspec ./openspec
COPY site/platform-spec ./site/platform-spec


RUN pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

# `dist` is excluded from the Docker context. Restore the compiled entrypoints
# exported by file-linked shared packages before the Platform Spec build.
RUN pnpm --filter @beskid/auth-client build \
	&& pnpm --filter @cyber-nomad-collective/beskid-server-observability build

RUN test -f /app/openspec/catalog.json \
	&& node -e 'const fs=require("fs"); const c=JSON.parse(fs.readFileSync("/app/openspec/catalog.json","utf8")); if(!Array.isArray(c.entries)||c.entries.length===0){console.error("/app/openspec/catalog.json missing or empty"); process.exit(1)}'

ENV SKIP_ENV_VALIDATION=1
ENV OPENSPEC_ROOT=/app/openspec
RUN pnpm --dir site/platform-spec run build
RUN pnpm --dir site/platform-spec run verify:client-bundle

FROM node:24-bookworm-slim AS runtime

ARG BESKID_RELEASE_CHANNEL=stable

RUN apt-get update \
	&& apt-get install -y --no-install-recommends wget ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app/site/platform-spec

ENV NODE_ENV=production
ENV PORT=8460
ENV OPENSPEC_ROOT=/app/openspec
ENV BESKID_RELEASE_CHANNEL=${BESKID_RELEASE_CHANNEL}

COPY --from=build /app/openspec /app/openspec
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/site/platform-spec/package.json ./
COPY --from=build /app/site/platform-spec/node_modules ./node_modules
COPY --from=build /app/site/platform-spec/.output ./.output
COPY --from=build /app/site/platform-spec/seed ./seed
COPY --from=build /app/site/platform-spec/docker/entrypoint.sh /usr/local/bin/platform-spec-entrypoint
RUN chmod +x /usr/local/bin/platform-spec-entrypoint

EXPOSE 8460

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
	CMD wget -q --spider http://127.0.0.1:8460/api/health || exit 1

CMD ["platform-spec-entrypoint"]
