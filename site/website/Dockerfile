FROM oven/bun:1 AS build

WORKDIR /app/site/website

COPY website/package.json website/bun.lock ./
RUN bun install --frozen-lockfile

COPY website /app/site/website

RUN bun run build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/site/website/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
