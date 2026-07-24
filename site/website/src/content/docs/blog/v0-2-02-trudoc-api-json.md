---
title: "trudoc and the api.json Contract: Make the Compiler the Authority"
description: "Documentation rots because humans maintain it. trudoc reads api.json from the compiler. One chain of truth: compiler semantic facts → api.json → trudoc → platform spec → website. Beskid v0.2 discovered that docs are compiler artifacts."
date: 2026-05-08
blogStatus: released
release: v0.2
---

Documentation rots. It rots when the compiler changes and nobody updates the docs. It rots when someone writes a tutorial referencing an API that was renamed six months ago. It rots because humans maintain it, and humans are bad at maintenance.

Beskid v0.2 stopped pretending docs were "just markdown." trudoc made the compiler the documentation authority.

## The problem

In most language projects, package documentation is whatever the author wrote. The author writes doc comments. Those comments become rendered pages. If the author gets the signature wrong, or forgets to update it, or leaves a parameter undocumented — the docs are wrong, and nobody notices until someone trusts them and gets a diagnostic they cannot explain.

The root cause is simple: the author is not the authority on what the code does. The **compiler** is. It knows every type, every signature, every member, every link between them. But in a traditional docs pipeline, the compiler's knowledge is thrown away after typechecking. The human starts over from scratch.

## The contract: api.json

v0.2 introduced hierarchical api.json as a documentation contract between the compiler and the package registry:

- **Types.** Every type the compiler knows about, with its full path and kind.
- **Members.** Every field, method, and associated item, with signatures.
- **Signatures.** Parameter names, types, return types — machine-readable, not prose.
- **Links.** Cross-references between types, members, and packages — all resolved by the compiler.

This is not a new idea. Rust has rustdoc JSON. TypeScript has declaration files. But Beskid made the contract **normative**: if the api.json says a function takes three parameters, the platform spec page for that function will say it takes three parameters. No human editor can override it. The compiler is the authority.

## One chain of truth

The pipeline is linear:

1. **Compiler** emits semantic facts into api.json.
2. **trudoc** reads api.json and produces structured documentation.
3. **Platform spec** reads trudoc and renders normative pages.
4. **Website** builds from the platform spec.

There is one chain of truth, and it starts with the compiler. If the docs are wrong, the compiler is wrong — and the compiler is much easier to test than a wiki page.

## From trust to verify

The old model was **trust**: trust that the author wrote the correct signature. Trust that the signature did not change. Trust that every parameter is documented.

The trudoc model is **verify**: the compiler emits what it knows. trudoc renders what the compiler says. The pipeline either succeeds or fails at build time. There is no "the docs might be stale." There is "the build passed, so the docs match the compiler."

This is the pattern Beskid keeps rediscovering: if you want something that does not rot, make the compiler the authority. The compiler already knows everything. Asking it is cheaper than maintaining parallel documentation by hand.

Read [Doc comments that are not lies](/book/14-from-source-to-runs/) and [From source to runs](/book/14-from-source-to-runs/) in the Book for the full pipeline story.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.2/version.json) - [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.2/article.md) - [delivery cutoff](https://github.com/Cyber-Nomad-Collective/beskid/commit/f57377a)
