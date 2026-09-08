# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS build

# git resolves pnpm git dependencies; Python and the compiler toolchain build
# the native packages selected by the root frozen lockfile.
RUN apk add --no-cache git python3 make g++
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@10.17.1 --activate

WORKDIR /app

ARG BESKID_RELEASE_CHANNEL=stable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY site/auth/package.json ./site/auth/package.json
COPY site/website/package.json ./site/website/package.json
COPY site/learn/package.json ./site/learn/package.json
# Lockfile carries file: links into beskid_web_common packages, so the
# submodule package.json files must exist before the frozen install.
COPY beskid_web_common ./beskid_web_common
RUN pnpm install --frozen-lockfile

COPY site/website ./site/website
COPY openspec ./openspec

RUN test -f openspec/catalog.json \
  && node -e 'const c=JSON.parse(require("fs").readFileSync("openspec/catalog.json","utf-8")); if(!Array.isArray(c.entries)||c.entries.length===0){console.error("openspec/catalog.json missing or empty; website image build requires catalog entries"); process.exit(1)}'
ENV BESKID_REQUIRE_OPENSPEC_CATALOG=1
ENV NODE_ENV=production
# The filtered build runs from /app, so bundled Astro modules cannot infer the
# website root from process.cwd(). Keep checked-in release metadata available
# to the prerendered downloads page instead of silently rendering its fallback.
ENV BESKID_WEBSITE_ROOT=/app/site/website
ENV BESKID_RELEASE_CHANNEL=${BESKID_RELEASE_CHANNEL}
RUN pnpm --dir site/website sync:release-version
RUN pnpm --filter beskid-website build

FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.licenses="AGPL-3.0-only AND CC-BY-4.0" \
  org.opencontainers.image.source="https://github.com/Cyber-Nomad-Collective/beskid"

COPY --from=build /app/site/website/dist /usr/share/nginx/html
COPY site/website/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY LICENSES/AGPL-3.0-only.txt /usr/share/licenses/beskid/AGPL-3.0-only.txt
COPY LICENSES/CC-BY-4.0.txt /usr/share/licenses/beskid/CC-BY-4.0.txt
COPY NOTICE /usr/share/licenses/beskid/NOTICE

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
