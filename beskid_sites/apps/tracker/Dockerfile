# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the Beskid tracker TanStack Start app.
# Mirrors the shell-template containerization pattern, simplified for the
# standalone `beskid_sites` pnpm workspace (no GitHub Packages auth, no
# beskid_web_common submodule — the shared lib is a workspace `workspace:^`
# link). SQLite stays the data store; the `tracker-data` volume carries the
# runtime database.

FROM node:24-alpine AS build

RUN apk add --no-cache git python3 make g++ bash
RUN npm install -g pnpm@10.17.1

WORKDIR /app

# Workspace root + lockfile first for a frozen, cached install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
# Shared library + this app (the only consumer in this image).
COPY packages/beskid-ui-react ./packages/beskid-ui-react
COPY packages/shell-core ./packages/shell-core
COPY apps/tracker ./apps/tracker

RUN pnpm install --frozen-lockfile --filter beskid-tracker...

WORKDIR /app/apps/tracker

ENV SKIP_ENV_VALIDATION=1
RUN pnpm exec vite build

FROM node:24-alpine AS runtime

RUN apk add --no-cache wget

WORKDIR /app/apps/tracker

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/apps/tracker/node_modules ./node_modules
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/tracker/package.json ./package.json
COPY --from=build /app/apps/tracker/.output ./.output
COPY --from=build /app/apps/tracker/data ./data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
