# verify-all-on-main (2026-05-24)

Evidence from local verification after compiler `5e91147` and superrepo `8cffb33`.

## Aggregate

| Command | Result |
| --- | --- |
| `cd site/website && bun run verify:trudoc -- --preset ci --strict` | pass |
| `cd compiler && cargo check --workspace` | pass |
| `cd compiler && cargo test -p beskid_tests --lib -- --test-threads=1` | **775 pass**, 2 ignored |

## export-ffi-link-time

| Command | Result |
| --- | --- |
| `cargo test -p beskid_tests interop:: -- --test-threads=1` | 8 pass |
| `ffi_v03_link_time.rs` | no `#[ignore]`; Linux-only tests in CI |

## codegen-coverage-dynamic-types

| Command | Result |
| --- | --- |
| `cargo test -p beskid_codegen dynamic -- --test-threads=1` | 4 pass |
| `cargo test -p beskid_tests codegen::dynamic_types -- --test-threads=1` | 9 pass |
| `cargo test -p beskid_tests runtime::dynamic -- --test-threads=1` | 4 pass |
| `dynamic-types-and-mapping.mdx` | `status: Standard`, `lastReviewed: 2026-05-23` |

## Prior CI fixes (still valid)

- Docs site MDX formatter table: green on prior push
- JIT composition symbols: prior push
- Corelib prelude / Output API: prior push + corelib submodule

## Coolify

MCP `deploy` for beskid site blocked (missing deploy permission / server unreachable in prior attempt). Redeploy manually after GitHub Actions green.
