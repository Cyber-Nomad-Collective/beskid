FROM oven/bun:1 AS build

# Astro 6 requires Node ≥22.12 (match .github/workflows/docs-site.yml).
RUN apt-get update \
  && apt-get install -y ca-certificates curl gnupg \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/beskid-docs-ui/package.json packages/beskid-docs-ui/package.json
COPY packages/trudoc/package.json packages/trudoc/package.json
COPY site/website/package.json site/website/package.json
RUN bun install --frozen-lockfile

COPY . .

# No .git in build context; skip trudoc CI preset (enforced on GitHub). Book image verify still runs.
ENV BESKID_SKIP_TRUDOC_VERIFY=1

RUN bun run --cwd site/website prebuild \
  && cd site/website && npx --no-install astro build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/site/website/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
