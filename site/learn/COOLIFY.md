# Coolify: Beskid Learn

`learn` runs as the **`learn`** service in the production Coolify compose stack.

## Delivery model

- **GitHub Actions**: `platform-delivery.yml` publishes `ghcr.io/cyber-nomad-collective/beskid-learn`
- **Infra stack**: `beskid_infra/compose/production/docker-compose.yml`
- **Runtime env**: `LEARN_PUBLIC_URL` (defaults to `https://learn.beskid-lang.org`)
- **Domains**: `learn.beskid-lang.org` (production), `stg-learn.beskid-lang.org` (staging)

## Runtime model

- Node/Bun-backed app server that serves the built SPA and exposes `/api/check`.
- The API runs `beskid analyze` against learner code.
- Healthcheck: `wget -q --spider http://127.0.0.1/`

## Local preview

- `cd site/learn`
- `pnpm install`
- `pnpm run dev`

For full compiler checks in the local loop:

- `cd /workspace` (repo root)
- `cargo build -p beskid_cli --release`
- `cd site/learn`
- `BESKID_BINARY=../../compiler/target/release/beskid pnpm run start`

You can also run:

- `cd /workspace && just learn-deps`
- `BESKID_BINARY=compiler/target/release/beskid pnpm run start`

Smoke check after deploy:

1. `curl -I https://learn.beskid-lang.org`
2. `curl -s https://learn.beskid-lang.org/api/health`
3. `curl -s https://learn.beskid-lang.org/api/check -H 'content-type: application/json' -d '{"exerciseId":"06_parser_basics","code":"i32 Main() {\\n  return 42;\\n}","command":"parse"}'`
