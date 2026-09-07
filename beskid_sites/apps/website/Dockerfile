# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the Beskid website TanStack Start app.
# Mirrors the shell-template Nitro `node-server` containerization pattern.

FROM node:24-alpine AS build

RUN apk add --no-cache git python3 make g++ bash
RUN npm install -g pnpm@10.17.1

WORKDIR /src

# Workspace root + lockfile first for a frozen, cached install.
COPY beskid_sites/package.json beskid_sites/pnpm-lock.yaml beskid_sites/pnpm-workspace.yaml beskid_sites/.npmrc beskid_sites/tsconfig.base.json ./beskid_sites/
COPY beskid_sites/packages/shell-core ./beskid_sites/packages/shell-core
COPY beskid_sites/apps/website ./beskid_sites/apps/website
COPY beskid_web_common ./beskid_web_common

RUN pnpm --dir /src/beskid_sites install --frozen-lockfile --filter beskid-website...

WORKDIR /src/beskid_sites/apps/website

ENV SKIP_ENV_VALIDATION=1
RUN pnpm exec vite build

# Nitro's SSR build emits its own CSS asset under `node_modules/.nitro/...` with
# a content hash that can diverge from the client build's `.output/public/assets/`
# CSS. The production `node-server` preset only serves from `.output/public/`, so
# an SSR router that references the Nitro-only CSS hash 404s and the initial
# server-rendered HTML loads no stylesheet (unstyled navbar). Patch every SSR
# server bundle to reference the client CSS hash that actually ships.
RUN SSR_CSS=$(basename /src/beskid_sites/apps/website/node_modules/.nitro/vite/services/ssr/assets/styles-*.css) \
    && CLIENT_CSS=$(basename /src/beskid_sites/apps/website/.output/public/assets/styles-*.css) \
    && echo "SSR CSS: $SSR_CSS  CLIENT CSS: $CLIENT_CSS" \
    && if [ "$SSR_CSS" != "$CLIENT_CSS" ]; then \
         find /src/beskid_sites/apps/website/.output/server -type f -exec sed -i "s/$SSR_CSS/$CLIENT_CSS/g" {} +; \
         echo "patched SSR bundles: $SSR_CSS -> $CLIENT_CSS"; \
       else \
         echo "SSR and client CSS hashes match — no patch needed"; \
       fi

FROM node:24-alpine AS runtime

RUN apk add --no-cache wget

WORKDIR /app/apps/website

ENV NODE_ENV=production
ENV PORT=80

COPY --from=build /src/beskid_sites/apps/website/node_modules ./node_modules
COPY --from=build /src/beskid_sites/node_modules /app/node_modules
COPY --from=build /src/beskid_sites/apps/website/package.json ./package.json
COPY --from=build /src/beskid_sites/apps/website/.output ./.output

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:80/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
