---
title: "Doc and api.json"
description: The compiler generates the API reference from the code. api.json is the contract the registry and the docs site consume, and nobody hand-edits it.
tableOfContents: true
---

```bash
beskid doc --project ./MyLib.bproj --target Core
```

`beskid doc` walks the resolved program and emits two things under `.beskid/docs/`: Markdown a human can read, and `api.json`, a structured description of every public symbol with its signature, its members, the type references it makes, and the documentation attached to it.

The JSON is compiler-derived. Signatures come from the semantic pipeline, `typeRef` links come from name resolution, and the member hierarchy comes from the syntax tree. The `///` comments provide the prose and nothing else. A symbol with no comment is still in the file with its full signature, because the API graph is a fact about the code and the prose is commentary on it.

## What the registry does with it

`beskid pckg pack` for a library runs `doc` automatically and ships `.beskid/docs/` inside the `.bpk` artifact. The pckg server indexes `api.json` on ingest and renders the package page from it. A package page that looks empty means the package has no `pub` symbols, not that someone forgot to write a YAML file describing the ones it has.

That is the difference from a docs site built from a separate source. There is no `docs/api/` tree to fall behind the code, no annotation processor pretending to be a second compiler, no DocFX configuration. The package is the documentation input.

## Writing for it

- Put `///` on every `pub` declaration you would want a stranger to use. One sentence of purpose, then the non-obvious precondition or consequence.
- Use `@arg` on callable parameters, and only there. A field is not an argument.
- Use `@ref(Qualified.Name)` for cross-links. The compiler validates the target exists, so a reference to a renamed type is a doc error at build time, not a dead link discovered by a user.
- `@tier(standard)` and `@variant(Name)` are how the corelib annotates stability tiers and enum variants. Chapter 20 has the full directive list.

The corelib's own reference is generated this way from the same sources you can read under `packages/`. What you see on the package page is what `beskid doc` produced from `Core/IO/IO.bd`, with no editorial layer in between.

Contracts: [api.json](/platform-spec/tooling/cli/api-json-contract/), [documentation comments](/platform-spec/language-meta/surface-syntax/documentation-comments/). Command reference: [beskid doc](/book/reference/cli/commands/doc/), [beskid pckg](/book/reference/cli/commands/pckg/).
