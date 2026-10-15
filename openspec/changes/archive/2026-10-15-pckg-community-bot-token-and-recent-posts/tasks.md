## 1. Registry

- [x] 1.1 `PCKG_NODEBB_BOT_TOKEN` replaces `PCKG_NODEBB_ADMIN_TOKEN`; still all-or-nothing.
- [x] 1.2 One async mutex around every bot write.
- [x] 1.3 HTTP 202 from a write is `CommunityError::Queued`: no link persisted, `community_sync_failed` recorded, reconcile retries.
- [x] 1.4 `GET /api/packages/{name}/community` adds `recentPosts` (newest 3; author, `postedAtUtc`, excerpt of at most 200 characters with HTML/Markdown stripped, `/post/<pid>` permalink) from `GET /api/topic/{tid}` with a 60 s in-memory cache per topic.

## 2. Website

- [x] 2.1 Recent forum posts rendered under the counters; no browser calls to NodeBB.

## 3. Verification

- [x] 3.1 cargo test / clippy for the pckg crates; pnpm test/typecheck/build for the pckg app.
