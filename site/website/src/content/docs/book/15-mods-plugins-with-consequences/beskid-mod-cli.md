---
title: "beskid mod CLI"
description: Build Mod projects, produce AOT artifacts, and wire them into consumer compiles.
tableOfContents: true
---

Mods ship like other Beskid packages (manifest, graph, lockfile). What a consumer loads is a **native artifact** built for its host target.

## Workflow sketch

1. Create or open a **`type: Mod`** project ([Project manifest](/docs/standard/capabilities/tooling--manifests-and-lockfiles--project-manifest-contract/)).
2. Implement public types satisfying SDK contracts (`Collector`, `Generator`, …).
3. Add the Mod package to the **dependencies** of the app or library that should use it. Only those packages activate it ([which Mods run](/book/15-mods-plugins-with-consequences/what-is-a-mod/)).
4. Run `beskid check`, `build`, `run`, or `test` as usual. The CLI builds a missing or stale artifact for each active Mod on demand. Run **`beskid dev mod rebuild`** to build one explicitly, for example in CI.

See the [`beskid dev mod` command reference](/book/reference/cli/commands/mod/) for project, target, lockfile, clean, and progress flags.

## Artifacts

Normative contract: [AOT artifact contract](/docs/standard/capabilities/compiler--compiler-mods--mod-host-bridge/).

A Mod artifact is an executable shared library plus `mod.descriptor.json`, published under `.beskid/obj/mods/<package>/` in the Mod project. The 0.6 host accepts descriptor schema **V3** with Mod host ABI **V2** and nothing else; an older artifact fails with "rebuild the Mod". The descriptor binds the artifact to its target, compiler version, and the exact digest of the compiler executable that built it, and that executable is the one that runs the Mod.

An artifact is reused only when its whole key is current: compiler identity, profile, target, sources, manifest and lock evidence, and the source identities of its dependencies. Anything stale is rebuilt by the CLI.

## Prebuilt Mods and the editor

The toolchain ships prebuilt artifacts for the Corelib Mods with its Corelib bundle, so the Serialization Mod does not need a build on first use. The language server never builds Mods. It reuses an artifact that the CLI cached or that the toolchain shipped, and only when the full key check passes. When no current artifact exists, it reports the exact command that produces one instead of skipping the Mod silently.

The language server uses the `beskid` CLI installed next to it as the Mod host. An editor or test harness can choose another one with the `initializationOptions.modHost` option (`path`, `runtimePrefix`, `runtimeProfile`), in the spirit of rust-analyzer's `procMacro.server`. An invalid value fails `initialize`; there is no fallback to the installed host. A project preparation failure shows up as a `project-preparation` error diagnostic.

Missing or stale artifact → fail closed, never "skip mod silently."

## Testing mods

- Unit-test Beskid logic in `test` items where possible.
- Platform behavior locks live in focused `beskid_tests_*` crates with spec updates ([Conformance](/docs/standard/capabilities/taxonomy--compiler--conformance/)).

## Next

[Pipeline phases](/book/15-mods-plugins-with-consequences/pipeline-phases/)
