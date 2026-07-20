# syntax=docker/dockerfile:1.7
FROM oven/bun:1.3.14 AS build

# Astro 6 requires Node ≥22.12 (match .github/workflows/docs-site.yml).
# Bun is pinned to the repo-wide version (packageManager + setup-beskid-web:
# 1.3.14) for reproducible installs. oven/bun:latest previously drifted onto a
# Bun release that hit a scoped GitHub Packages install-cache regression.
RUN apt-get update \
  && apt-get install -y ca-certificates curl gnupg \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y nodejs git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all source first so workspace file: links resolve correctly.
# The monorepo uses file: and workspace: dependencies that require source
# present for Bun to set up proper symlinks and sub-path exports.
COPY package.json bun.lock .npmrc ./
COPY beskid_web_common ./beskid_web_common
COPY site/website ./site/website
COPY site/platform-spec ./site/platform-spec
COPY openspec ./openspec
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}
# Isolate and persist the Bun install cache in a stable path. The BuildKit cache
# mount keeps package downloads across builds (efficiency) and gives Bun a
# writable cache root, avoiding the scoped-registry "failed opening
# cache/package/version dir" ENOENT seen with the empty default cache.
ENV BUN_INSTALL_CACHE_DIR=/bun-cache
RUN --mount=type=cache,target=/bun-cache bun install --frozen-lockfile

# Book link rewrite needs a non-empty OpenSpec catalog at build time.
RUN test -f openspec/catalog.json \
  && bun -e 'const c=await Bun.file("openspec/catalog.json").json(); if(!Array.isArray(c.entries)||c.entries.length===0){console.error("openspec/catalog.json missing or empty; website image build requires catalog entries"); process.exit(1)}'
ENV BESKID_REQUIRE_OPENSPEC_CATALOG=1
ENV NODE_ENV=production
RUN bun run --cwd site/website build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/site/website/dist /usr/share/nginx/html
COPY site/website/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
