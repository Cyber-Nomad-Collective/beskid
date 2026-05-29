FROM oven/bun:latest AS build

WORKDIR /app/site/auth

COPY site/auth/package.json site/auth/bun.lock site/auth/.npmrc ./
COPY beskid_web_common/packages/beskid-server-observability /app/beskid_web_common/packages/beskid-server-observability
ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}
RUN bun install --frozen-lockfile

COPY site/auth/ ./

ENV SKIP_ENV_VALIDATION=1
RUN bun run build
RUN bun run verify:client-bundle

FROM oven/bun:latest AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/site/auth

ENV NODE_ENV=production
ENV PORT=8090

COPY --from=build /app/site/auth/package.json /app/site/auth/bun.lock ./
COPY --from=build /app/site/auth/node_modules ./node_modules
COPY --from=build /app/site/auth/.output ./.output

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8090/api/v1/health || exit 1

CMD ["bun", "run", "start"]
