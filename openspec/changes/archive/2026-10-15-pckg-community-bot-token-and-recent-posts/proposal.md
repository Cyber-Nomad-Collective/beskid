## Why

NodeBB 4.16 facts verified against its source (see
`docs/research/2026-10-15-nodebb-theming-and-pckg-integration.md`): the
registry must post as a dedicated bot user with a user-bound token, NodeBB
holds a per-user posting lock, and a write can be accepted into the post
queue (HTTP 202) without yielding a topic or post identity. The package page
should also show the newest forum posts without the browser calling NodeBB.

## What Changes

- **MODIFY** the NodeBB discussion requirement: the token variable is
  `PCKG_NODEBB_BOT_TOKEN` (user-bound token of the bot user), bot writes are
  serialized, a 202 answer is treated as not linked and reported as
  `community_sync_failed`, and `GET /api/packages/{name}/community` returns
  the newest posts (author, timestamp, plain-text excerpt, permalink) read
  server-side with a one-minute cache.

## Impact

- `compiler/crates/beskid_pckg_server/src/community.rs`, catalog route,
  `beskid_sites/apps/pckg` community card.
- Compatibility: `PCKG_NODEBB_ADMIN_TOKEN` is renamed; nothing is configured
  against it yet. No legacy URL migration.
