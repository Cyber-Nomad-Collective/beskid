---
title: Core.Fluent
description: Self-returning step contracts and generated fluent facades for corelib types.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-10
---

<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Fluent` defines the **step-contract** pattern for chainable corelib APIs: a `pub contract XxxStep` whose chain methods return `XxxStep`, plus at least one **terminal** method that produces a final value (`string`, `T`, `IntoPrefix`, etc.). Wrapper types are **attribute-authored** via **`Beskid.Fluent`** (`[FluentStep]`, `[FluentChain]`, `[FluentTerminal]`); the `Beskid.Fluent` compiler mod collects annotated types and emits step contracts through **`Beskid.Compiler.Emitter`**. Optional on-disk materialization is compiler-owned on Collector target fingerprint miss—there is no `beskid mod generate` CLI.
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
| Rule | Detail |
| --- | --- |
| Step contract | `pub contract {Name}Step` — intermediate methods return `{Name}Step` |
| Terminal | At least one method returns a non-step type (for example `IntoList()`, `ApplyTo(string)`) |
| Reference | Hand-written reference: `Ansi.AnsiStyleStep` in `corelib_console` |
| Tier | Generated fluent facades are **Supported** (Tier 2) until merge is automatic in the mod harness |
</SpecSection>
