---
title: "Bsol — structured config without YAML trauma"
description: The meta-language behind .bproj manifests, schema profiles, and why it feels like HCL until the compiler gets honest.
tableOfContents: true
---

Every toolchain eventually invents a **config dialect**. Beskid's is **Bsol** (Beskid Structured Object Language). If you have touched Terraform, you already know the shape: blocks, labels, `key = value`, bracket lists. If you have touched YAML, you already know why we did not use it for manifests.

This page is **informative**. Exact grammar and profile rules live in the [Bsol platform spec](/platform-spec/tooling/manifests-and-lockfiles/bsol/).

## What Bsol is (and is not)

Bsol is **not** Beskid program syntax. Your `.bd` files still go through the normal surface parser, semantic rules, HIR, codegen—the full [analysis stack](/book/14-from-source-to-runs/semantic-pipeline/).

Bsol is the **meta-language** for files the compiler reads before it touches your source tree:

| File | Profile | Becomes |
| --- | --- | --- |
| `MyApp.bproj` | `project.v1` | `ProjectManifest` + resolver graph |
| `workspace.bws` / `workspace.proj` | `workspace.v1` | `WorkspaceManifest` |
| `runtime_manifest.bsol` | `runtime.v1` | ABI tables and dispatch registries |

Same surface grammar. Different **schema profile**. Same pipeline shape.

## HCL-shaped, analysis-shaped

HashiCorp Configuration Language (HCL) popularized a useful pattern:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-123"
  instance_type = "t3.micro"
}
```

Bsol uses the same **mental model**—block kind, optional label, body of assignments—without pretending to be Terraform:

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

The similarity is intentional. The divergence is **where validation lives**.

| Stage | HCL-ish tools (typical) | Beskid Bsol stack |
| --- | --- | --- |
| Lex / parse | Custom parser per product | One `bsol.pest` grammar → `BsolDocument` |
| Structure | Schema baked into parser | **Schema profiles** (`project.v1`, …) |
| Semantics | Provider / app logic | `beskid_analysis::projects` lowering + E18xx contract band |
| IDE | Often string heuristics | LSP walks **span-backed AST** from `parse_bsol_document` |

HCL separates syntax from provider semantics across many tools. Beskid separates syntax from manifest semantics across **one crate** (`beskid_bsol`) and **downstream lowering**—the same split you see between parse and semantic analysis for `.bd`, just on a smaller document.

```mermaid
flowchart LR
  subgraph bsol [beskid_bsol]
    pest[bsol.pest]
    ast[BsolDocument]
    prof[Schema profile]
    val[validate]
    pest --> ast --> val
    prof --> val
  end
  subgraph analysis [beskid_analysis projects stack]
    lower[parser.rs lowering]
    model[ProjectManifest]
    graph[Resolver / lockfile]
    val --> lower --> model --> graph
  end
  subgraph bd [Beskid .bd stack — same spine idea]
    parse[Parse Program]
    sem[Semantic rules]
    ir[HIR / codegen]
    parse --> sem --> ir
  end
```

Both paths share the platform rule: **one spine, no shadow parsers**. Manifest files are not special-cased with ad hoc regex in the LSP; they go through Bsol first, then contract validation—mirroring how `.bd` goes through parse, then semantic rules.

## Generic blocks, declared rules

Older manifest parsers hard-coded block kinds in the grammar (`target`, `dependency`, …). Bsol widened the grammar to **any** `ident { ... }` block and moved legality into profiles:

- **Grammar** answers: is this text structurally a Bsol document?
- **Profile** answers: which blocks and fields are legal for *this* file type?
- **Lowering** answers: what does it *mean* for builds and locks?

That three-layer split matches how the rest of the compiler treats syntax vs semantics—Bsol is the config-side version of "parse succeeds, semantic pass may still fail."

## `@schemaless` — when you need a raw `{ ... }` pocket

Most blocks are structured. Occasionally a profile needs an **opaque body**—content the parser does not interpret as assignments (embedded snippets, foreign syntax, migration shims).

Mark the block with **`@schemaless`** before `{`:

```bsol
patch @schemaless {
  # anything between the braces is captured verbatim
  keep = "this { nested } text"
  not parsed as bsol
}
```

The profile rule must opt in with `schemaless = true`. Parser stores the inner text in `schemaless_body`; validation skips field rules; downstream code decides what to do with the raw string.

Structured blocks and schemaless blocks can coexist in one document—same as mixing strict types and `extern` escape hatches in the main language, but for config.

## Where to read next

| Topic | Link |
| --- | --- |
| Writing your first manifest | [Project manifest](/book/03-project-proj-or-it-didnt-happen/project-manifest/) |
| Workspace files | [Workspace manifest](/book/06-monorepo-as-coping-mechanism/workspace-manifest/) |
| Normative grammar + AST | [Bsol design model](/platform-spec/tooling/manifests-and-lockfiles/bsol/design-model/) |
| Runtime ABI manifest | [Runtime manifest profile](/platform-spec/tooling/manifests-and-lockfiles/bsol/runtime-manifest-profile/) |
| Full analysis pipeline | [From source to something that runs](/book/14-from-source-to-runs/) |

## Previous

[Tree and resolution](/book/03-project-proj-or-it-didnt-happen/tree-and-resolution/)

## Next

[04. Where does this file even go?](/book/04-where-does-this-file-go/)
