---
title: "Formatter development (Emit)"
description: "How the Beskid pretty-printer works: Emit, EmitCtx, modules, and extending the formatter."
---

The formatter lives in the **`beskid_analysis`** crate under `src/format/`. It is an **opinionated pretty-printer**: it walks the **concrete syntax AST** after a successful parse and writes canonical text. It does **not** round-trip arbitrary whitespace or comments (except structured **`///`** leading documentation carried on the AST).

For a concise rules summary and coverage matrix, see the compiler tree doc at `compiler/docs/formatter.md` in the repository.

## Mental model

1. **Parse** → `Spanned<Program>` (or nested nodes).
2. **Emit** → each node implements `Emit::emit` and writes tokens and layout into a `fmt::Write` target (usually a `String`).
3. **`EmitCtx`** carries **indent depth** and **spacing policy** so nested structures share one layout discipline.

The public entry point for a whole file is:

```rust
beskid_analysis::format::format_program(&Spanned<Program>) -> Result<String, EmitError>
```

Internally that constructs an `Emitter`, a fresh `EmitCtx`, and calls `emit` on `program.node` (the inner `Program`).

## The `Emit` trait

Defined in `format/emit.rs`:

```rust
pub trait Emit {
    fn emit<W: Write>(&self, w: &mut W, cx: &mut EmitCtx) -> Result<(), EmitError>;
}
```

**Contract**

- **`w`** — append-only sink; implementations compose smaller `emit` calls on child nodes instead of building intermediate strings (avoids quadratic concat patterns).
- **`cx`** — mutable context; indent is pushed/popped around braced regions; policy helpers insert blank lines where the style guide requires.
- **Return value** — `Ok(())` on success; `EmitError` wraps `fmt::Error` from the writer (typically only on OOM-style writer failures).

Implement `Emit` for AST types (and sometimes for `Spanned<T>` wrappers) so the tree formats itself **structurally**: `Program` loops items and delegates to `Node`; `Node` matches on item kind; expressions delegate to subexpressions.

## `EmitCtx`: indentation and layout helpers

`EmitCtx` (same file) tracks:

- **`indent: usize`** — logical nesting level; `write_indent` writes four spaces per level.
- **`policy_blank_line_between_members`** — toggles extra newline policy between type/enum/contract members (tests may disable for tighter snapshots).

Common helpers used everywhere:

| Method | Role |
| --- | --- |
| `nl` / `ln` | Newline; `ln` also indents the new line |
| `space` / `token` | Single space or a keyword/punctuation literal |
| `open_brace` / `close_brace` | **Allman-style** bracing: `{` on its own line after increasing indent; `}` outdented to the enclosing block |
| `between_top_level_declarations` | Blank line policy between file-level items |
| `between_members` | Blank line policy inside aggregate bodies |
| `between_block_items` | Statement-block spacing (e.g. control flow followed by `let`) |

Policy bodies live in `format/policy.rs` so spacing rules stay centralized.

## Module layout (`src/format/`)

| Path | Responsibility |
| --- | --- |
| `emit.rs` | `Emit`, `EmitCtx`, `EmitError`, `Emitter`, `format_program`, `Block` / `Spanned<Block>` emission |
| `policy.rs` | Blank-line decisions |
| `expressions_emit.rs` | `Expression` and related expression shapes |
| `statements_emit.rs` | Statements; **parenthesized** `if` / `while` conditions |
| `types_emit.rs` | Types, paths, parameters, fields |
| `items/` | Top-level and member items split by file (`root_emit`, `declarations_emit`, `functions_emit`, `attributes_emit`, `helpers`) |

`format/mod.rs` re-exports the public surface: `Emit`, `EmitCtx`, `EmitError`, `Emitter`, `format_program`.

## Adding a new syntax node to the formatter

1. **Parse / AST** — ensure the node exists on the concrete AST used by analysis.
2. **`Emit` impl** — add `fn emit` in the most natural module (`expressions_emit.rs` vs `statements_emit.rs` vs `items/…`).
3. **Delegate** — prefer `child.emit(w, cx)?` over duplicating indent logic.
4. **Policy** — if the node introduces new vertical spacing needs, extend `policy.rs` and thread through `EmitCtx` rather than hard-coding double newlines at call sites.
5. **Tests** — add `*.input.bd` / `*.expected.bd` under `beskid_tests/fixtures/format/` (any subdirectory; the harness walks recursively), then run `python3 scripts/bless_format_fixtures.py` from the `compiler/` tree after `cargo build -p beskid_cli`. See the compiler repo’s `docs/formatter-test-matrix.md` for the coverage checklist.

## Idempotence and grouped expressions

The formatter aims for **idempotence**: `format(parse(format(parse(x))))` should stabilize. Concrete example: `if` and `while` headers emit a **parenthesized** condition for a C#-like look. If the condition is already a **grouped** expression (`( … )` in the AST), the emitter must **not** add another pair of parentheses or the tree would grow on each pass.

That logic lives in `emit_parenthesized_condition` in `statements_emit.rs`: grouped conditions delegate to `condition.emit` only; other shapes wrap with literal `(` `)`.

Use the same pattern whenever syntax allows redundant grouping that your emitter might re-introduce.

## CLI and LSP

- **CLI**: [`beskid format`](/guides/cli/commands/format/) reads a file or directory, parses, runs `format_program`, then writes stdout, `--output`, `--write`, or validates with `--check`.
- **LSP**: the formatting handler calls the same `format_program` on the parsed buffer; range formatting currently replaces the **full document** (see [LSP architecture](/guides/lsp/architecture-and-protocol-spec/)).

Both paths require a **successful parse**; there is no best-effort partial format on parse errors.

## Regression testing (compiler repo)

- **Matrix**: [`compiler/docs/formatter-test-matrix.md`](https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/main/docs/formatter-test-matrix.md) (paths refer to the `beskid_compiler` repository layout).
- **CI**: `nox -s format_regression` and `beskid format --check` on the fixture tree; LSP unit tests `include_str!` the `docs_and_control` fixture to assert the handler matches `format_program`.
- **Corelib (optional)**: `BESKID_FORMAT_CORPUS=1` with `nox -s format_corpus_corelib` runs `scripts/format_corpus_check.py`.
