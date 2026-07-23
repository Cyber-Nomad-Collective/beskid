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
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copy all source first so file/workspace links resolve correctly.
# The monorepo uses local packages that need source present for install-time
# symlinks and sub-path export resolution.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY beskid_web_common ./beskid_web_common
COPY site/website ./site/website
COPY site/platform-spec ./site/platform-spec
COPY openspec ./openspec
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}
# Isolate and persist the pnpm store in a stable path.
RUN --mount=type=cache,id=pnpm-site-website,target=/pnpm/store \
  pnpm config set store-dir /pnpm/store \
  && pnpm install --frozen-lockfile

# Book link rewrite needs a non-empty OpenSpec catalog at build time.
RUN test -f openspec/catalog.json \
  && bun -e 'const c=await Bun.file("openspec/catalog.json").json(); if(!Array.isArray(c.entries)||c.entries.length===0){console.error("openspec/catalog.json missing or empty; website image build requires catalog entries"); process.exit(1)}'
ENV BESKID_REQUIRE_OPENSPEC_CATALOG=1
ENV NODE_ENV=production
RUN pnpm --dir site/website run build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/site/website/dist /usr/share/nginx/html
COPY site/website/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
