---
title: "Semantic pipeline"
description: Name resolution, typing, conformance, and the legality gate, as memoized queries with stable diagnostic codes.
tableOfContents: true
---

Parsing proves you can spell. The semantic pipeline proves you meant something the language allows.

## Staged rules

Analysis runs as ordered stages, each consuming what the previous one established:

1. module and import resolution (E11xx)
2. type surface: what types and contracts exist, with which members (E12xx, E16xx)
3. typing of bodies, generic specialization, call arity (E12xx, E13xx)
4. conformance: every listed contract satisfied with matching signatures (E16xx)
5. legality: every reached item is well-formed for lowering (E12xx)
6. composition: hosts, scopes, injection (E17xx)

Each stage owns a diagnostic band and does not emit outside it. When you see E1601 you know it came from conformance, and you know which crate to open. The registry of every code is in the standard's [diagnostic code registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/).

## Everything is a query

The stages are not passes over a mutable tree. They are Salsa queries in `beskid_queries`, memoized on their inputs. "Does `TcpStream` conform to `Writer`" is computed once and cached until a file that feeds it changes. The language server benefits most: a keystroke in one function invalidates that function's queries and nothing else, and the rest of the project's diagnostics come back from cache.

It also means there is exactly one answer to every semantic question. The CLI, the LSP, and the lowering all ask the same database. There is no per-request rebuild of a semantic model and no second implementation for the editor to drift from.

## The legality gate

The last semantic stage before lowering checks only what the target reaches from its entry. This replaced a walk over every root that specialized every generic whether or not anything used it, and it is why analysis of a large workspace is proportional to the target and not to the repository.

The gate is strict about what it does check. Unresolved imports are E1105 and stop the build; the old behavior of proceeding with a missing module and reporting fifty E1101s downstream is gone. Unknown types are E1201 at the reference. Arity mismatches are E1204 at the call. Non-exhaustive `match` fails here too.

## Mods in the middle

When the graph contains `type: Mod` packages, `generate` runs after parse and `analyze` and `rewrite` run after the semantic stages, on the merged program. A mod's analyzer sees the same typed facts the compiler sees, through the SDK's query facade. A rewrite the host cannot apply fails closed in the E18xx band. Chapter 15.

## `beskid analyze`

Runs the whole semantic pipeline and prints diagnostics without lowering anything. It is the CI step for "does this compile" that does not need a linker, and it is what the language server does on your behalf continuously.

Rule contracts: [rules pipeline](/platform-spec/compiler/semantic-pipeline/rules-pipeline-contract/). Reference: [semantic rules](/book/reference/analysis/semantic-rules/).
