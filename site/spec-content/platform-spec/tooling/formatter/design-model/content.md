---
title: Formatter design model
description: Emit/EmitCtx/Emitter architecture, policy split, and the layout
  invariants the formatter exposes.
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

This article documents the **internal architecture** of the Beskid formatter — how the `Emit`/`EmitCtx`/`Emitter` triad and the policy module cooperate to project a parsed AST back into canonical source. It is informative-with-normative-claims: the **shape of the architecture** is normative for anyone modifying the formatter; the **fine-grained module decomposition** is informative.

The article does **not** redefine the formatter contract (covered by the parent **[hub](/platform-spec/tooling/formatter/)**) and does **not** prescribe any consumer-facing knob: there are none.

## Canonical references

- **[Formatter](/platform-spec/tooling/formatter/)** — parent feature hub with the normative contract.
- **[Beskid CLI](/platform-spec/tooling/cli/)** — the `beskid format` / `fmt` host.
- **`compiler/crates/beskid_analysis/src/format/`** — the reference implementation.

## Architecture overview

The formatter splits into three concerns:

| Concern | Type | Module | Responsibility |
| --- | --- | --- | --- |
| **Trait surface** | `trait Emit` | `format/emit.rs` | Defines the per-construct `emit(&self, w, cx)` contract. |
| **Context** | `struct EmitCtx` | `format/emit.rs` | Carries indent depth + the policy toggles in scope for the current emission. |
| **Driver** | `struct Emitter` | `format/emit.rs` | Stateless dispatcher; constructs the buffer, calls into the AST, returns `Result<String, EmitError>`. |
| **Policy** | free functions | `format/policy.rs` | Encodes blank-line, between-member, and between-block-item rules so the AST-side `Emit` impls remain readable. |
| **Per-construct impls** | `Emit` implementations | `format/items/`, `expressions_emit.rs`, `statements_emit.rs`, `types_emit.rs` | Project each AST node into the writer in a way that satisfies the layout policy. |

Module decomposition follows the user-rule "one primary concern per file" and treats `mod.rs` as exports-only.

## Emit contract

```rust
pub trait Emit {
    fn emit<W: Write>(&self, w: &mut W, cx: &mut EmitCtx) -> Result<(), EmitError>;
}
```

Implementations **must**:

1. **Be local** — emit only the textual representation of the node, never of sibling or parent nodes.
2. **Be deterministic** — never observe wall-clock time, environment variables, or randomness.
3. **Be reentrant** — child emits use the same `&mut EmitCtx`; they **must** restore any context they mutate (indent depth, policy toggles) before returning, except for `push_indent`/`pop_indent` pairs that bracket a nested scope.
4. **Use `EmitCtx` helpers** (`write_indent`, `nl`, `ln`, `space`, `token`, `open_brace`, `close_brace`) rather than writing raw `\n`/`'    '` characters, so layout policy changes localize to `EmitCtx`.

## EmitCtx invariants

- `indent: usize` — current indent depth in **units**, where one unit is four spaces. `push_indent` adds one; `pop_indent` saturates at zero.
- `policy_blank_line_between_members: bool` — when true (the default), `between_members` emits one blank line.
- `open_brace` / `close_brace` are the **only** sanctioned way to emit braces; they handle the indent push/pop for the block body.

A trait implementation that bypasses these helpers (for example, writing `\n  ` directly) is a defect; it breaks the contract that policy changes live in one place.

## Policy split

The blank-line and spacing policy lives in `format/policy.rs`:

- **`between_top_level_declarations`** — one newline between top-level items (the default `cx.nl(w)`).
- **`between_members`** — one newline between members of a container (struct fields, enum cases, type method blocks, etc.); skipped when `policy_blank_line_between_members` is false.
- **`between_block_items`** — extra blank between a block-like statement (`if`, `while`, `for`) and a following `let`, to keep introductions visually separated.

Adding a new normative rule **must** be done by extending `policy.rs` rather than scattering `\n` writes across `items/`. Re-running the existing test fixtures after a policy change **must** continue to pass; if the policy intentionally changes byte output, the fixtures **must** be regenerated in the same change set.

## Driver

`Emitter` is a zero-sized type with a single method:

```rust
impl Emitter {
    pub fn write<T: Emit>(&self, item: &T) -> Result<String, EmitError>;
}
```

`format_program(&Spanned<Program>)` is the user-facing entry point; it constructs an `Emitter` plus a fresh `EmitCtx` and dispatches into the AST. There are no caches, no concurrency primitives, and no I/O on the driver side.

## Error model

Any `std::fmt::Error` returned by an underlying writer is wrapped as `EmitError` (the formatter never panics on layout failures). The CLI converts `EmitError` to a Miette diagnostic via `emit_error_semantic_diagnostic`, which constructs a single-character span at the start of the source so the user can locate the problem in their editor.

The formatter **must** propagate parse errors verbatim from the caller (the CLI surfaces them through the existing parser diagnostics) and **must not** attempt partial formatting of a failed parse.

## File-system side effects (CLI layer)

The CLI layer in `compiler/crates/beskid_cli/src/commands/format.rs` is the **only** place the formatter performs I/O. Its responsibilities:

1. **Discover** `.bd` files: a single file, a single tree (with the `.git`/`target`/etc. ignore set), or stdin (not yet — currently rejected).
2. **Parse** each discovered file via `services::parse_program_with_source_name`.
3. **Format** via `format_program`.
4. **Dispatch** based on flags:
   - No flags: stdout (single file only).
   - `--output`: stdout-equivalent into a single output file.
   - `--write`: in-place rewrite.
   - `--check`: bail non-zero on the first mismatch with a `not formatted:` message.

The CLI **must not** attempt to recover from a parse error by skipping the file; CI behaviors that need partial coverage **must** drive the formatter on a curated file list rather than tolerate parse failures.

## Verification and maintenance notes

- **Idempotency** — the canonical test is to run `format_program(parse(format_program(parse(s))))` and assert byte equality with `format_program(parse(s))`. This **must** be exercised in `beskid_analysis` unit tests.
- **Policy regressions** — any change to `policy.rs` **must** be accompanied by an ADR (or an existing ADR update) and a refresh of fixture outputs.
- **Drift detection** — CI **should** run `beskid format --check` against a known-formatted source tree (Beskid's own corelib and book code samples) to catch regressions early.

## Related topics

- **[Formatter](/platform-spec/tooling/formatter/)** — parent feature hub.
- **[Verification and traceability](./verification-and-traceability/)** — concrete test paths.
- **[Canonical pretty-printer ADR](./adr/0001-canonical-pretty-printer/)** — rationale for the no-knobs policy.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
