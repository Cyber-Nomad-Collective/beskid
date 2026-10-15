## 1. Registry

- [x] 1.1 Migration `0013_replace_package_community_category_with_topic`; `PackageCommunity { topic_id, topic_slug }`.
- [x] 1.2 Open the thread on public package creation (`POST /api/v3/topics` with cid, title, Markdown content, tags); persist tid + slug; never fail creation; log `community_sync_failed`.
- [x] 1.3 Reply on every created version of a linked public package (`POST /api/v3/topics/{tid}`); never fail the publish; log failures.
- [x] 1.4 `community.{url, topicId, topicSlug}` on summaries; `GET /api/packages/{name}/community` with `replyCount` / `viewCount` from `GET /api/topic/{tid}`.
- [x] 1.5 `POST /api/admin/community/reconcile` opens missing threads, idempotent.
- [x] 1.6 Fail closed on partial `PCKG_NODEBB_API_URL` / `PCKG_NODEBB_ADMIN_TOKEN` / `PCKG_NODEBB_PACKAGES_CID` / `PCKG_COMMUNITY_URL`.

## 2. Website

- [x] 2.1 "Discuss on the forum" link to the thread with "N replies, M views".

## 3. Verification

- [x] 3.1 `cargo test` and `cargo clippy -- -D warnings` for the pckg crates.
- [x] 3.2 `pnpm run test`, `pnpm run typecheck`, `pnpm run build` in `beskid_sites/apps/pckg`.
