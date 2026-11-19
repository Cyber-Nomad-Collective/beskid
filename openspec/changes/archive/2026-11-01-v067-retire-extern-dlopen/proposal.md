## Why

The `extern_dlopen` engine feature, its resolver, its caches and the `BESKID_EXTERN_ALLOW` and `BESKID_EXTERN_DENY` allow and deny lists were removed from the compiler in 0.6.7. No lane enabled the feature, and the lists existed only inside it. Normative text still requires the feature to stay off (RFF-006), lists it in the extern-dispatch decision table, requires the lists for imported libraries, and anchors the backends to it. The specification must describe what exists.

## What Changes

- **BREAKING** The engine feature `extern_dlopen` is retired. Rule RFF-006 is replaced by a statement that the engine has no Cargo feature that changes extern resolution.
- **BREAKING** The environment variables `BESKID_EXTERN_ALLOW` and `BESKID_EXTERN_DENY` are retired. No component reads them. The requirement "Extern allow/deny enforcement for imported libraries" is removed.
- The decision D-EXEC-ABI-0005 lists the two extern tracks that exist: link-time (AOT) and JIT symbol resolution. The row for dynamic `extern_dlopen` is removed.
- New requirements state what the remaining extern paths do and how each fails closed: JIT resolution of a declared symbol (loaded symbols first, then the declared library), and the AOT check that every required extern library is linked.
- The decision D-LMETA-CABI-0003 no longer points to a dynamic resolution profile appendix, which does not describe any code.
- Informative text in the affected specifications is aligned with the above.

## Capabilities

### Modified Capabilities
- `execution--abi-and-host--extern-dispatch-and-policy`, `execution--runtime--runtime-feature-flags`, `compiler--build-pipeline--backends-jit-aot`, `tooling--foreign-library-import--cli-import-lib-command`, `language-meta--interop--c-abi-profile`.

## Impact

`beskid_engine` (already done on slice tc-legacy), the specifications named above, and the Book and Docs (no public mention found). Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. There is no migration path and no migration guide. The removed variables had no effect in any shipped lane.
