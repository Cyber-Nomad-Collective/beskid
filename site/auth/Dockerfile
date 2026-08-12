# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS build

# git for pnpm git deps; python3/make/g++ for better-sqlite3 native build on alpine
RUN apk add --no-cache git python3 make g++ bash
RUN npm install -g pnpm@10.17.1

WORKDIR /app

ARG BESKID_RELEASE_CHANNEL=stable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# The root lockfile covers every site importer. Mirror the proven website
# preparation graph so a frozen install never observes a partial workspace.
COPY site/auth/package.json ./site/auth/package.json
COPY site/website/package.json ./site/website/package.json
COPY site/platform-spec/package.json ./site/platform-spec/package.json
COPY site/learn/package.json ./site/learn/package.json
COPY beskid_web_common ./beskid_web_common

RUN pnpm install --frozen-lockfile --filter beskid-auth...
# `dist` is deliberately excluded from the Docker context. Build every shared
# package with a compiled export after the frozen install, before Vite resolves
# the file-linked auth-client and server-observability packages.
RUN pnpm --filter @beskid/auth-client build \
  && pnpm --filter @cyber-nomad-collective/beskid-server-observability build

COPY site/auth/ ./site/auth/

WORKDIR /app/site/auth

ENV SKIP_ENV_VALIDATION=1
ENV BESKID_RELEASE_CHANNEL=${BESKID_RELEASE_CHANNEL}
RUN pnpm exec vite build && bash scripts/sync-root-stylesheet.sh
RUN pnpm --filter beskid-auth verify:client-bundle

FROM node:24-alpine AS runtime

ARG BESKID_RELEASE_CHANNEL=stable

RUN apk add --no-cache wget

WORKDIR /app/site/auth

ENV NODE_ENV=production
ENV PORT=8090

COPY --from=build /app/site/auth/node_modules ./node_modules
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/site/auth/package.json ./package.json
COPY --from=build /app/site/auth/.output ./.output

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8090/api/v1/health || exit 1

CMD ["node", ".output/server/index.mjs"]
