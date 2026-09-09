import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Can I disable corelib for a micro-benchmark?

No. Host projects always load corelib. Isolate benchmarks in `Mod` or non-host tooling paths that do not claim to be full language hosts.

## `Std` not found despite submodule checkout

Initialize `compiler/corelib` submodule and set `BESKID_CORELIB_ROOT` to the directory containing `beskid_corelib/Project.proj`.

## Duplicate corelib in graph

Usually caused by both implicit injection and an explicit `Std` path to a different tree. Align paths to one aggregate root.

## LSP missing prelude types

Focused project must be a host under the same corelib root the CLI uses. Rescan workspace after changing `BESKID_CORELIB_ROOT`.

## Mod project pulls corelib twice

Mods depend on host graphs; they should not redeclare aggregate corelib unless packaging tests require it—follow **[Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)** `Mod` rules.
