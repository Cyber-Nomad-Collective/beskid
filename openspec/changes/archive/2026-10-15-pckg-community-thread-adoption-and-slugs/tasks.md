## 1. Registry

- [x] 1.1 Slug charset: ASCII alphanumerics and `- . _ ~ /`; length and positive id checks kept (store test).
- [x] 1.2 Adopt-before-create under the write mutex: bot uid from `GET /api/self`, category scan via `GET /api/category/{cid}?page=N`, adopt the first topic with matching title and bot uid; otherwise create (HTTP tests with a fake NodeBB: dotted slug persists, bot thread adopted across pages, same-titled human thread not adopted, orphan adopted by reconcile).

## 2. Verification

- [x] 2.1 cargo test / clippy -D warnings for the pckg crates.
