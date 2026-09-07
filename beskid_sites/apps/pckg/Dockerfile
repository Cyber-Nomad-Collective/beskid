# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the Beskid pckg TanStack Start app.
# Mirrors the shell-template Nitro `node-server` containerization pattern.
# The Nitro app runs on port 8082 internally and proxies API calls to the
# pckg .NET backend (PCKG_API_BASE_URL).

FROM node:24-alpine AS build

RUN apk add --no-cache git python3 make g++ bash
RUN npm install -g pnpm@10.17.1

WORKDIR /app

# Workspace root + lockfile first for a frozen, cached install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
# Shared libraries + this app.
COPY packages/beskid-ui-react ./packages/beskid-ui-react
COPY packages/shell-core ./packages/shell-core
COPY apps/pckg ./apps/pckg

RUN pnpm install --frozen-lockfile --filter beskid-pckg...

WORKDIR /app/apps/pckg

ENV SKIP_ENV_VALIDATION=1
RUN pnpm exec vite build

# Nitro's SSR build emits its own CSS asset under `node_modules/.nitro/...` with
# a content hash that can diverge from the client build's `.output/public/assets/`
# CSS. The production `node-server` preset only serves from `.output/public/`, so
# an SSR router that references the Nitro-only CSS hash 404s and the initial
# server-rendered HTML loads no stylesheet. Patch every SSR server bundle to
# reference the client CSS hash that actually ships. (Same fix as the website
# Dockerfile; no-op when the hashes already match.)
RUN SSR_CSS=$(basename /app/apps/pckg/node_modules/.nitro/vite/services/ssr/assets/styles-*.css) \
    && CLIENT_CSS=$(basename /app/apps/pckg/.output/public/assets/styles-*.css) \
    && echo "SSR CSS: $SSR_CSS  CLIENT CSS: $CLIENT_CSS" \
    && if [ "$SSR_CSS" != "$CLIENT_CSS" ]; then \
         find /app/apps/pckg/.output/server -type f -exec sed -i "s/$SSR_CSS/$CLIENT_CSS/g" {} +; \
         echo "patched SSR bundles: $SSR_CSS -> $CLIENT_CSS"; \
       else \
         echo "SSR and client CSS hashes match — no patch needed"; \
       fi

FROM node:24-alpine AS runtime

RUN apk add --no-cache wget

WORKDIR /app/apps/pckg

ENV NODE_ENV=production
ENV PORT=8082

COPY --from=build /app/apps/pckg/node_modules ./node_modules
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/pckg/package.json ./package.json
COPY --from=build /app/apps/pckg/.output ./.output

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8082/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
