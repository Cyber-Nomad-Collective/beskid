FROM oven/bun:latest AS build

WORKDIR /app

# Copy all source so workspace file: links and tsconfig base resolve correctly.
COPY beskid_web_common ./beskid_web_common
COPY site/auth ./site/auth

RUN cd site/auth && bun install

ENV SKIP_ENV_VALIDATION=1
RUN cd site/auth && bun run build

FROM oven/bun:latest AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/site/auth

ENV NODE_ENV=production
ENV PORT=8090

COPY --from=build /app/site/auth/package.json ./
COPY --from=build /app/site/auth/node_modules ./node_modules
COPY --from=build /app/site/auth/.output ./.output

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8090/api/v1/health || exit 1

CMD ["bun", "run", "start"]
