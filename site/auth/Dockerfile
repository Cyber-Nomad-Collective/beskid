FROM oven/bun:latest AS build

WORKDIR /app/site/auth

COPY site/auth/package.json ./
COPY beskid_web_common/packages/beskid-auth-client/package.json /app/beskid_web_common/packages/beskid-auth-client/
COPY beskid_web_common/packages/beskid-ui-react/package.json /app/beskid_web_common/packages/beskid-ui-react/

RUN bun install

COPY site/auth/ ./
COPY beskid_web_common/packages/beskid-auth-client/ /app/beskid_web_common/packages/beskid-auth-client/
COPY beskid_web_common/packages/beskid-ui-react/ /app/beskid_web_common/packages/beskid-ui-react/

ENV SKIP_ENV_VALIDATION=1
RUN bun run build

FROM oven/bun:latest AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/site/auth

ENV NODE_ENV=production
ENV PORT=8090

COPY --from=build /app/site/auth/package.json ./
COPY --from=build /app/site/auth/node_modules ./node_modules
COPY --from=build /app/site/auth/dist ./dist

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8090/api/v1/health || exit 1

CMD ["bun", "run", "start"]
