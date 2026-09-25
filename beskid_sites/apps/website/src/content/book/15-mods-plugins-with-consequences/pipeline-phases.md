---
title: "Pipeline phases"
description: Where mod.collect through mod.rewrite sit relative to parse and lowering, and the beskid_analysis::mod_host modules that run them.
tableOfContents: true
---

Mods insert between parse and lowering: after you have syntax, before Cranelift gets involved.

```text
mod.collect ──► mod.generate ──► mod.analyze ──► mod.rewrite ──► semantic rules ──► codegen.lower
```

Inside `beskid_analysis::mod_host`, that chain is five phases. Discovery and load find the AOT artifacts and build the schedule. Collect narrows work per mod instance. Generate, merge, and reparse resolve typed AST contributions. Analyze runs analyzers on the merged snapshot. Rewrite applies whatever the analyzers registered. Map: [Mod host bridge flow](/platform-spec/compiler/compiler-mods/mod-host-bridge/flow-and-algorithm/), [crate-to-spec anchors](/platform-spec/compiler/implementation-map/crate-to-spec-anchors/).

## Phase IDs are shared, not improvised

`beskid_pipeline` gives every stage, mod phases included, a phase ID shared across the CLI, analysis, and codegen services. Log against that ID rather than inventing a string in whichever crate you happen to be editing. See [pipeline composition](/platform-spec/compiler/pipeline-composition/) and [stage ordering](/platform-spec/compiler/build-pipeline/stage-ordering/).

## Dependency injection stops at the host boundary

The Rust host's DI container is wired at compile time and is read-only to mods and the SDK. A mod cannot register a service into it; anything a mod needs comes in through the request types the SDK contracts already take.

Debugging the surrounding pipeline, resolution through codegen, is chapter 14's job; this page is only about the phases mods add to it.
