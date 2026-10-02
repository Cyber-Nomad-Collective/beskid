# Qualified package publisher

This is a root-only publishing follow-up. Native 0.5.1 artifacts retain source
commit `f064de92777d36c249424a18f92c91abd6f3e248` and compiler commit
`1bd7bdee81d59ef14339e6a6c2ce18eb36585238`; this change does not rebuild or
relabel them.

The protected manual job downloads the exact Linux bundle from the immutable
`v<version>` release, requires its GitHub SHA-256 digest, and uses the clean,
gitlink-pinned distribution extractor. No existing prefix is overwritten.

The shell publisher requires `BESKID_TOOLCHAIN_PREFIX`. It derives `bin/beskid`,
the marker-bearing `beskid_corelib`, and the runtime prefix from that directory.
It checks the native debug/release kit layout, exact version, and installed
Corelib bytes against the checkout's embedded source selection. Conflicting
execution-root overrides fail closed; raw CLI and local Cargo fallbacks are
removed. The Node pack runner and generated-template quality gate are unchanged.

For local validation with an already qualified bundle:

```sh
BESKID_TOOLCHAIN_PREFIX=/absolute/path/to/bundle \
  bash scripts/ci/corelib-publish.sh patch --dry-run
```

Behavioral fixtures exercise the real wrapper and safe extractor with a
synthetic CLI and offline GitHub transport. They cover execution-root handoff,
raw CLI rejection, missing kits, source mismatch, conflicting overrides,
malformed version files, missing/wrong digests, and linked archive entries.
The frozen macOS bundle additionally passes real wrapper preflight; that
bounded receipt is separate from the full 17-artifact runner dry-run.
