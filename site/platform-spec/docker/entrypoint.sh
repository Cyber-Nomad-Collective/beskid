#!/bin/sh
# Platform-spec container entrypoint.
#
# Seeds the runtime stores from the baked static OpenSpec workspace before
# starting the server. Seeding is an idempotent upsert (SQLite always, Memgraph
# when MEMGRAPH_URI is set), so it runs safely on every start/redeploy and
# converges the stores to the image's OpenSpec revision. A seed failure is
# non-fatal: the reader still serves spec content from the baked static seed.
set -eu

echo "[entrypoint] seeding platform-spec stores from baked OpenSpec workspace"
if [ -n "${MEMGRAPH_URI:-}" ]; then
	bun run .output/seed.mjs --stores --graph ||
		echo "[entrypoint] store seed reported an error; continuing with the static seed"
else
	bun run .output/seed.mjs --stores ||
		echo "[entrypoint] store seed reported an error; continuing with the static seed"
fi

echo "[entrypoint] starting platform-spec server"
exec bun run .output/server/index.mjs
