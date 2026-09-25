---
title: "Bsol: structured config without YAML trauma"
description: The meta-language behind .bproj and .bws files, why it is parsed like a language, and what @schemaless is for.
tableOfContents: true
---

Every toolchain eventually invents a config dialect. Most of them do it by accident, one regex at a time, until the config parser is the least tested and most load-bearing code in the product. Beskid's is called Bsol, Beskid Structured Object Language, and it was written on purpose.

```bsol
MyApp {
  name    = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind  = App
  entry = "Main.bd"
}
```

Block kind, optional label, a body of `key = value` pairs, nested blocks, bracket lists. If that looks like HCL, good. HCL got the shape right and there is no prize for a novel config syntax. The differences are underneath.

## One grammar, several profiles

Bsol is not the Beskid language. Your `.bd` files go through the language parser and the semantic pipeline in chapter 14. Bsol is the language for the files the compiler reads before it looks at any source:

| File | Profile |
| --- | --- |
| `<name>.bproj` | `project.v1` |
| `<name>.bws` | `workspace.v1` |
| runtime manifest | `runtime.v1` |

The grammar is one `bsol.pest` file. It accepts any `ident { ... }` block, so the parser does not know what a `target` is. A schema profile knows. `project.v1` says which block kinds are legal, which fields they take, and which are required. Lowering into a `ProjectManifest` and the resolver graph happens after the profile has validated the document.

That three-layer split, grammar then profile then lowering, is the same split the language uses: parse succeeds, semantic pass may still fail, and the failure names the rule. Bsol is the config-side copy of that discipline. It is also why the language server can highlight and validate a manifest from a real span-backed tree instead of string heuristics: manifests and workspaces go through `parse_bsol_document`, then contract validation, and the LSP reads the same result the CLI does.

## The validation you get for free

Because profiles are data rather than parser branches, two commands exist that most build tools cannot offer:

```bash
beskid validate-bsol MyApp.bproj
beskid migrate-bsol  MyApp.bproj
```

`validate-bsol` checks a document against its profile without resolving anything. `migrate-bsol` rewrites a document from an older profile version to the current one, which is how the toolchain can retire a field without a blog post asking everyone to hand-edit their manifests.

## `@schemaless`

Occasionally a profile needs a block whose body is not assignments: an embedded foreign snippet, a migration shim, a payload that some later tool interprets. Mark it and the parser keeps the text verbatim.

```bsol
patch @schemaless {
  keep = "this { nested } text"
  not parsed as bsol
}
```

The profile has to opt in with `schemaless = true` for that block kind. Validation skips field rules for it, the body lands in `schemaless_body` as a string, and whatever consumes it takes responsibility. Structured and schemaless blocks coexist in one file. This is the config equivalent of an `extern` boundary: an explicit, marked place where the type system stops, instead of an unmarked place where it quietly gave up.

The normative grammar and profile rules are in the [Bsol design model](/platform-spec/tooling/manifests-and-lockfiles/bsol/design-model/). Workspace files get their own treatment in [chapter 06](/book/06-monorepo-as-coping-mechanism/workspace-manifest/).
