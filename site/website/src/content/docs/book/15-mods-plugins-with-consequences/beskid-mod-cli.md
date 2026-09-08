---
title: "beskid mod CLI"
description: Build Mod projects, produce AOT artifacts, and wire them into consumer compiles.
tableOfContents: true
---

Mods ship like other Beskid packages—manifest, graph, lockfile—but consumers only load them if **AOT output exists** for the active target.

## Workflow sketch

1. Create or open a **`type: Mod`** project ([Project manifest](/docs/standard/tooling/manifests-and-lockfiles/project-manifest-contract/)).
2. Implement public types satisfying SDK contracts (`Collector`, `Generator`, …).
3. Run **`beskid mod rebuild`** for the target triple that downstream compiles need.
4. Add the mod package to app/lib **dependencies**; host discovers exports at `mod.load`.

See the [`beskid mod` command reference](/book/reference/cli/commands/mod/) for project, target, lockfile, clean, and progress flags.

## Artifacts

Normative contract: [AOT artifact contract](/docs/standard/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract/).

Expect:

- Native object for the triple
- `mod.descriptor.json` (or equivalent export table) listing contract entrypoints

Missing artifact for the requested triple → fail closed, not "skip mod silently."

## Testing mods

- Unit-test Beskid logic in `test` items where possible.
- Platform behavior locks live in focused `beskid_tests_*` crates with spec updates ([Conformance](/docs/standard/compiler/conformance/)).

## Next

[Pipeline phases](/book/15-mods-plugins-with-consequences/pipeline-phases/)
