# CYB-130 — CI/CD release-gate parity and evidence drift (2026-07-21)

## Baseline SHAs

| Surface | SHA | Notes |
| --- | --- | --- |
| Superrepo main (pre-land) | `af696b8f` | Includes Coolify UUID lane fallback (#158) |
| Integration PR | [#160](https://github.com/Cyber-Nomad-Collective/beskid/pull/160) @ `84b57a17` | Lockfile pins, Docker web_common, tracker delivery init, Bun cache, deploy UUID fallback |
| `beskid_web_common` | `294b3585` | Frozen lockfile refresh on submodule main |
| `pckg` | `bf664f53` | GitHub Packages `@beskid/*` pins + `@xyflow/react` |
| `beskid_tracker` | `6267ee01` | GitHub Packages `@beskid/*` image pins |
| `beskid_nexus` | `c1a37451` | Vitest exact aliases for `gitnexus-shared` |
| `compiler` | `ed7231f4` | clippy `collapsible_if` in LSP diagnostics |
| `beskid_infra` | `24283c56` | Docs for lane `service_uuid` (infra #5) |

## Defects closed in this sweep

1. **shared-ui-nexus** — `beskid_web_common` frozen lockfile drift (`9fe1030` → `294b3585`).
2. **image-pckg** — Dockerfile/`submodules` missing `beskid_web_common` for `file:` `@beskid/*`.
3. **image-tracker** — named BuildKit context `web_common` + submodule init.
4. **tracker-platform-delivery** — init `beskid_web_common` for tracker/website/openspec; `BUN_INSTALL_CACHE_DIR` for scoped-registry ENOENT.
5. **Coolify promote** — `sync-runtime-env` / `deploy-release-manifest` fall back to lane JSON `service_uuid` when env unset (#158 + #160).
6. **platform-integration false fail** — version contract unsets ambient `GITHUB_RUN_NUMBER`.

## Remaining gaps (honest)

| Gap | Why |
| --- | --- |
| Staging Coolify service | Coolify project Beskid has production env/service only (`s4ir1ovgqtubarqeql3gf3pz`). `coolify-staging.json` has no `service_uuid`; GitHub `staging` env lacks `COOLIFY_SERVICE_UUID`. Auto-promote cannot fully green until a `beskid-platform-staging` service exists and is wired. |
| Full clean-checkout matrix | Long-running `cargo test --workspace` / `just corelib` not re-executed end-to-end in this session; rely on Compiler/Corelib GHA + prior CYB-68/102 evidence once #160 lands. |
| CYB-58 | Intentionally deferred taxonomy hub. |

## Commands (local smoke on PR tip)

```bash
bash scripts/ci/test/run-tracker-platform-delivery-tests.sh
bash scripts/ci/test/run-cicd-foundation-tests.sh   # when submodules present
```

## Related Linear

- CYB-130 (this issue)
- CYB-87 / CYB-11 / CYB-44 (release evidence parents; still open pending broader W7)
