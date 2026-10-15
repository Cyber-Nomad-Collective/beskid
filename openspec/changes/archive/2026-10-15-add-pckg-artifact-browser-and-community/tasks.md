## 1. Registry

- [x] 1.1 Index every validated artifact entry; list visible files and read one file with text / binary / too-large outcomes (`beskid_pckg_artifacts::ArtifactBrowser`).
- [x] 1.2 Serve `GET .../versions/{version}/files` and `GET .../files/content?path=`; hidden, traversal and unknown paths answer not-found.
- [x] 1.3 Serve `api.json` through `GET .../docs/structured` as `api`; drop `metadata`.
- [x] 1.4 Persist the NodeBB category identity (`0012_add_package_community`) and expose it on package summaries as `community`.
- [x] 1.5 Create the category on public package creation, never fail creation on NodeBB errors, record failures in the activity log.
- [x] 1.6 Serve `GET /api/packages/{name}/community` with live counters and `POST /api/admin/community/reconcile` for administrators.
- [x] 1.7 Fail closed on partial `PCKG_NODEBB_*` / `PCKG_COMMUNITY_URL` configuration.

## 2. Website

- [x] 2.1 `/packages/$name/files` with the shared explorer tree and a Markdown / highlighted / plain / guarded viewer.
- [x] 2.2 `/docs/$package` renders `api.json` as a reference layout with README and guide tabs.
- [x] 2.3 Package page uses the registry-owned community link and counters.

## 3. Verification

- [x] 3.1 `cargo test -p beskid_pckg_server -p beskid_pckg_artifacts -p beskid_pckg_store`
- [x] 3.2 `pnpm run test`, `pnpm run typecheck`, `pnpm run build` in `beskid_sites/apps/pckg`
