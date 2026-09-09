import SpecAdrChrome from '@beskid/beskid-ui/platform-spec/SpecAdrChrome.astro';

<SpecAdrChrome />

## Context

This feature hub explains how the compiler discovers `Project.proj`, builds a project graph, and hands resolved workspace inputs to compile and dependency commands. **`Mod`** projects are included in the graph like other project kinds; after resolution, the **mod host** registers them for **event-driven** orchestration per **[Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/)** and **[Compiler Mods](/platform-spec/compiler/compiler-mods/)**.

## Decision

The reference compiler **must** implement Workspace resolution contract as documented in this feature hub and its article bundle.

## Consequences

Changes require hub/ADR updates and verification anchor extensions.

## Verification anchors

- `compiler/crates/beskid_analysis/`
