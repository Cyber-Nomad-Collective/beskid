# syntax=docker/dockerfile:1.7
FROM node:22.12.0-alpine AS build

RUN apk add --no-cache git
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY site/auth/package.json ./site/auth/package.json
COPY site/website/package.json ./site/website/package.json
COPY site/platform-spec/package.json ./site/platform-spec/package.json
COPY site/learn/package.json ./site/learn/package.json
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY beskid_web_common ./beskid_web_common
COPY site/website ./site/website
COPY site/platform-spec ./site/platform-spec
COPY openspec ./openspec

RUN test -f openspec/catalog.json \
  && node -e 'const c=JSON.parse(require("fs").readFileSync("openspec/catalog.json","utf-8")); if(!Array.isArray(c.entries)||c.entries.length===0){console.error("openspec/catalog.json missing or empty; website image build requires catalog entries"); process.exit(1)}'
ENV BESKID_REQUIRE_OPENSPEC_CATALOG=1
ENV NODE_ENV=production
RUN pnpm --filter beskid-website build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/site/website/dist /usr/share/nginx/html
COPY site/website/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
