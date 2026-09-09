import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Shim pattern

Any future **Rust-native** user interop would introduce **thin shim symbols** with stable C names that delegate to Rust `extern "Rust"` or crate-specific metadata. **Interop.Contracts** normalization would run **before** shim emission so that profiles remain composable.

## Compatibility bands

The platform can evolve:

1. **Band A** — C-profile user `Extern` and the v3 **kernel export set** plus dispatch envelope layout (today’s supported story).
2. **Band B** — manifest-driven handler registration and `[Runtime]`-attributed corelib shims; soft ops route through `interop_dispatch_*` rather than direct linker symbols ([runtime manifest](/platform-spec/language-meta/interop/rust-abi-profile/runtime-manifest/)).

Upgrades **must** preserve Band A artifacts unless accompanied by a major ABI version policy change documented under **[conformance and versioning](/platform-spec/language-meta/interop/interop-contracts/conformance-and-versioning/)**.
