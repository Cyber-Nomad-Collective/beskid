# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the Beskid Nexus (gitnexus-web) Vite SPA.
# Builds static files, serves with nginx.

FROM node:24-alpine AS build

RUN apk add --no-cache git python3 make g++ bash
RUN npm install -g pnpm@10.17.1

WORKDIR /app

# Workspace root + lockfile first for a frozen, cached install.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
# Shared libraries + this app.
COPY packages/beskid-ui-react ./packages/beskid-ui-react
COPY packages/shell-core ./packages/shell-core
COPY packages/gitnexus-shared ./packages/gitnexus-shared
COPY apps/nexus ./apps/nexus

RUN pnpm install --frozen-lockfile --filter beskid-nexus...

WORKDIR /app/apps/nexus

ENV SKIP_ENV_VALIDATION=1
RUN pnpm exec vite build

FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache wget

COPY --from=build /app/apps/nexus/dist /usr/share/nginx/html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /api/health {
        return 200 '{"ok":true,"service":"beskid-nexus"}';
        add_header Content-Type application/json;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/api/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
