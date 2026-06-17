---
title: Formatter verification and traceability
description: Concrete tests, CI hooks, and code anchors that demonstrate
  formatter contract conformance.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-23
---

## Purpose and scope

This article enumerates the **concrete artifacts that demonstrate formatter conformance** — test paths, CI commands, code anchors — so that anyone modifying `beskid_analysis::format` or `beskid_cli::commands::format` can verify they have not regressed the parent **[hub](/platform-spec/tooling/formatter/)** contract.

It complements the **[design model](../design-model/)** which explains *how* the formatter is built; this article focuses on *how it is verified*.

## Canonical references

- **[Formatter](/platform-spec/tooling/formatter/)** — feature hub with the normative contract.
- **[Design model](../design-model/)** — `Emit`/`EmitCtx`/`Emitter` architecture.
- **`compiler/crates/beskid_analysis/docs/formatter.md`** — implementation-side overview that mirrors the hub.

## Code anchors

| Concern | File or module | What it proves |
| --- | --- | --- |
| Public formatter entry point | `compiler/crates/beskid_analysis/src/format/mod.rs` | `format_program` and `emit_error_semantic_diagnostic` are the only re-exported names; consumers must not depend on per-construct emitters. |
| Layout policy | `compiler/crates/beskid_analysis/src/format/policy.rs` | Blank-line policy, between-members policy, between-block-items policy live in one file (no scatter). |
| Context helpers | `compiler/crates/beskid_analysis/src/format/emit.rs::EmitCtx` | `open_brace`/`close_brace`/`write_indent` are the only sanctioned indent and brace primitives. |
| Per-construct projection | `compiler/crates/beskid_analysis/src/format/items/`, `expressions_emit.rs`, `statements_emit.rs`, `types_emit.rs` | Each AST node has a focused `Emit` impl; mod.rs is exports-only. |
| CLI surface | `compiler/crates/beskid_cli/src/commands/format.rs` | `beskid format` / `fmt` with `--write`, `--check`, `--output`, single-file stdout default. |

## Required automated checks

The following commands **must** pass before any change to the formatter is merged:

1. **Crate compile + unit tests:**
   ```bash
   cd compiler && cargo test -p beskid_analysis format::
   ```
2. **CLI compile + filter-named tests:**
   ```bash
   cd compiler && cargo test -p beskid_cli format
   ```
   The filter currently matches no test names, so this acts as a compile gate; future format-specific CLI tests **must** match this filter so they run automatically.
3. **Strict platform-spec verification (covers this hub + the parent feature):**
   ```bash
   cd site/website && bun run verify:trudoc -- --preset ci
   ```

## Idempotency and round-trip guarantees

The formatter contract requires:

```text
format_program(parse(format_program(parse(s)))) == format_program(parse(s))
```

This **must** be enforced by at least one test in `beskid_analysis` that feeds a curated representative source corpus (functions, types, attributes, tests, control flow, generics) and asserts the equality after two formatter passes.

Any change to `format/policy.rs` or `format/emit.rs::EmitCtx` **must** be accompanied by a test run that demonstrates the idempotency property still holds after fixtures are regenerated.

## CI hooks

- **PR drift check** — the Beskid CI pipeline **must** include a `beskid format --check` step against the workspace source tree. A drift hit **must** fail the PR.
- **Spec verification** — the `verify:trudoc -- --preset ci` step covers PSC003 (Standard feature hubs require ## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->

No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->) and PSC006 (ADR pages require ## Context / ## Decision). This hub satisfies both via the embedded Decisions section and the ADR bundle under `adr/`.

## Drift detection between hub and code

| Owner | What changes here | Mirror |
| --- | --- | --- |
| Formatter feature hub (`tooling/formatter/index.mdx`) | Normative contract, layout policy, ADR list. | `compiler/crates/beskid_analysis/docs/formatter.md` — implementation overview kept in sync. |
| `policy.rs` | Blank-line / between-member / between-block-items policy. | Update **Layout policy** section on the hub. |
| `EmitCtx` helpers | Indent unit, brace primitives. | Update **Layout policy** section on the hub. |
| `beskid format` CLI flags | Flag set, file-scan ignore list. | Update **Inputs and outputs** section on the hub. |

Discrepancies between this article and the implementation are defects: report them as PRs that update both files in the same change set.

## Related topics

- **[Formatter](/platform-spec/tooling/formatter/)**
- **[Design model](../design-model/)**
- **[Canonical pretty-printer ADR](./adr/0001-canonical-pretty-printer/)**

## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
