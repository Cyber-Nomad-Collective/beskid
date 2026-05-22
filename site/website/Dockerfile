FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/beskid-docs-ui/package.json packages/beskid-docs-ui/package.json
COPY packages/trudoc/package.json packages/trudoc/package.json
COPY site/website/package.json site/website/package.json
RUN bun install --frozen-lockfile

COPY . .

RUN bun run --cwd site/website build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/site/website/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
