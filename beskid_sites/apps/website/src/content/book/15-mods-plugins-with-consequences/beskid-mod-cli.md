---
title: "beskid mod CLI"
description: beskid mod rebuild and beskid mod clean manage the cached AOT artifact for a Mod project; consumers pick it up automatically at mod.load.
tableOfContents: true
---

A mod ships like any other Beskid package: manifest, dependency graph, lockfile. What is different is that a consumer only loads it if an AOT artifact exists for the active target triple, and that artifact lives in its own cache, separate from the package's ordinary build output.

## Building the artifact

```bash
beskid mod rebuild ./MyMod.bproj
beskid mod rebuild ./MyMod.bproj --target-triple x86_64-unknown-linux-gnu
beskid mod rebuild ./MyMod.bproj --clean
```

`beskid mod rebuild` compiles a `type: Mod` project and writes the cache entry for the resolved target triple. `--clean` removes the existing cached artifact first instead of trusting the cache key; `--target-triple` cross-builds for a triple other than the host's; `--frozen` and `--locked` carry the same lockfile discipline `beskid build` has. `beskid mod clean` removes the cached artifacts for a project without rebuilding, which is the thing to run when you suspect a stale cache rather than a real compile error.

## Wiring a mod into a consumer

1. Implement the SDK contracts, `Collector`, `Generator`, and the rest, in a `type: Mod` project ([project manifest](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)).
2. Run `beskid mod rebuild` for each target triple a consumer needs.
3. Add the mod package to the consumer as an ordinary dependency. The host discovers its exports itself at `mod.load`; there is no manual "register this mod" step on the consumer's side.

A missing artifact for the requested triple is a fail-closed build error, not a silently skipped mod.

## Testing mods

Beskid-side logic in a mod project is testable with ordinary `test` items, the same as any other package (chapter 08). Platform behavior locks, the guarantees a mod author can rely on the host to keep, live in `beskid_tests` and travel with spec updates under [Conformance](/platform-spec/compiler/conformance/).
