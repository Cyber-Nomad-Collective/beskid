# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the Beskid shell-template TanStack Start app.
# Mirrors the site/* Nitro `node-server` containerization pattern, simplified
# for the standalone `beskid_sites` pnpm workspace (no GitHub Packages auth,
# the shared lib is a workspace `workspace:*` link).

FROM node:24-alpine AS build

RUN apk add --no-cache git python3 make g++ bash
RUN npm install -g pnpm@10.17.1

WORKDIR /app

# Workspace root + lockfile first for a frozen, cached install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
# Shared library + this app (the only consumer in this image).
COPY packages/beskid-ui-react ./packages/beskid-ui-react
COPY packages/shell-core ./packages/shell-core
COPY apps/shell-template ./apps/shell-template

RUN pnpm install --frozen-lockfile --filter beskid-shell-template...

WORKDIR /app/apps/shell-template

ENV SKIP_ENV_VALIDATION=1
RUN pnpm exec vite build

FROM node:24-alpine AS runtime

RUN apk add --no-cache wget

WORKDIR /app/apps/shell-template

ENV NODE_ENV=production
ENV PORT=8499

COPY --from=build /app/apps/shell-template/node_modules ./node_modules
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/shell-template/package.json ./package.json
COPY --from=build /app/apps/shell-template/.output ./.output

EXPOSE 8499

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8499/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
