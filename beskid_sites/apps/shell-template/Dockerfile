# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the Beskid shell-template TanStack Start app.
# Mirrors the site/* Nitro `node-server` containerization pattern, simplified
# for the standalone `beskid_sites` pnpm workspace (no GitHub Packages auth,
# the shared lib is a workspace `workspace:*` link).

FROM node:24-alpine AS build

RUN apk add --no-cache git python3 make g++ bash
RUN npm install -g pnpm@10.17.1

WORKDIR /src

# Workspace root + lockfile first for a frozen, cached install.
COPY beskid_sites/package.json beskid_sites/pnpm-lock.yaml beskid_sites/pnpm-workspace.yaml beskid_sites/.npmrc beskid_sites/tsconfig.base.json ./beskid_sites/
COPY beskid_sites/packages/shell-core ./beskid_sites/packages/shell-core
COPY beskid_sites/apps/shell-template ./beskid_sites/apps/shell-template
COPY beskid_web_common ./beskid_web_common

RUN pnpm --dir /src/beskid_sites install --frozen-lockfile --filter beskid-shell-template...

WORKDIR /src/beskid_sites/apps/shell-template

ENV SKIP_ENV_VALIDATION=1
RUN pnpm exec vite build

FROM node:24-alpine AS runtime

LABEL org.opencontainers.image.licenses="Apache-2.0" \
  org.opencontainers.image.source="https://github.com/Cyber-Nomad-Collective/beskid"

RUN apk add --no-cache wget

WORKDIR /app/apps/shell-template

ENV NODE_ENV=production
ENV PORT=8499

COPY --from=build /src/beskid_sites/apps/shell-template/node_modules ./node_modules
COPY --from=build /src/beskid_sites/node_modules /app/node_modules
COPY --from=build /src/beskid_sites/apps/shell-template/package.json ./package.json
COPY --from=build /src/beskid_sites/apps/shell-template/.output ./.output
COPY LICENSE /usr/share/licenses/beskid/Apache-2.0.txt
COPY NOTICE /usr/share/licenses/beskid/NOTICE

EXPOSE 8499

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8499/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
