---
title: "beskid mod CLI"
description: Build Mod projects, produce AOT artifacts, and wire them into consumer compiles.
tableOfContents: true
---

Mods ship like other Beskid packages—manifest, graph, lockfile—but consumers only load them if **AOT output exists** for the active target.

## Workflow sketch

1. Create or open a **`type: Mod`** project ([Project manifest](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)).
2. Implement public types satisfying SDK contracts (`Collector`, `Generator`, …).
3. **`beskid build`** the mod for the target triple you need in downstream compiles.
4. Add the mod package to app/lib **dependencies**; host discovers exports at `mod.load`.

CLI details evolve—cross-check [CLI command reference](/book/reference/cli/command-reference/) and [build](/book/reference/cli/commands/build/) for flags your workspace supports.

## Artifacts

Normative contract: [AOT artifact contract](/platform-spec/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract/).

Expect:

- Native object for the triple
- `mod.descriptor.json` (or equivalent export table) listing contract entrypoints

Missing artifact for the requested triple → fail closed, not "skip mod silently."

## Testing mods

- Unit-test Beskid logic in `test` items where possible.
- Platform behavior locks live in `beskid_tests` with spec updates ([Conformance](/platform-spec/compiler/conformance/)).

## Next

[Pipeline phases](/book/15-mods-plugins-with-consequences/pipeline-phases/)
