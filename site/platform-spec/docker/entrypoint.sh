#!/bin/sh
# Platform-spec container entrypoint.
#
# Seeds the runtime stores from the baked static OpenSpec workspace before
# starting the server. Seeding is an idempotent upsert (SQLite always, Memgraph
# when MEMGRAPH_URI is set), so it runs safely on every start/redeploy and
# converges the stores to the image's OpenSpec revision. The SQLite store seed
# carries the required schema migrations, so its failure is fatal: we refuse to
# start against an unmigrated/incompatible schema. Graph refresh is optional and
# stays non-fatal.
set -eu

echo "[entrypoint] seeding platform-spec stores from baked OpenSpec workspace"
node .output/seed.mjs --stores
if [ -n "${MEMGRAPH_URI:-}" ]; then
	node .output/seed.mjs --graph ||
		echo "[entrypoint] graph seed reported an error; continuing without graph refresh"
fi

echo "[entrypoint] starting platform-spec server"
exec bun run .output/server/index.mjs
