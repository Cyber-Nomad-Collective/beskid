FROM oven/bun:latest AS build

# Astro 6 requires Node ≥22.12 (match .github/workflows/docs-site.yml).
# Bun version tracks oven/bun:latest; local/CI use packageManager + setup-beskid-web (currently 1.3.14).
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
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}
RUN bun install --frozen-lockfile

# .git is included in build context for platform-spec git-meta generation during prebuild.
ENV BESKID_SKIP_TRUDOC_VERIFY=1

RUN bun run --cwd site/website prebuild \
  && cd site/website && npx --no-install astro build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/site/website/dist /usr/share/nginx/html
COPY site/website/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
