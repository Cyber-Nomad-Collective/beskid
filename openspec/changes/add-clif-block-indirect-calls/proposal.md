## Why

`clif { ... }` blocks let Beskid source state a single straight-line Cranelift
basic block. They shipped in the compiler without a normative capability, and
they can call only named native symbols (`call @symbol(...)`): a kit platform
import or a C-ABI `[Extern]` contract method. Runtime code written in Beskid
sometimes holds a code address with a fixed, known signature, for example a
scheduler entry point or a trampoline target, and today it cannot call that
address from Beskid at all.

A `call_indirect` statement for CLIF blocks closes that gap for fixed
signatures. It is deliberately small: it does **not** provide lambdas or
function values. Lambdas need compiler work regardless (typing function
values, lifting lambda bodies, allocating and tracing capture environments,
and specializing generic higher-order calls), because a CLIF block is
monomorphic CLIF text and cannot express a call whose signature depends on
type parameters.

## What Changes

- **ADD** capability `language-meta--interop--clif-blocks`, stating the CLIF
  block surface the reference compiler already implements (contexts, operand
  naming, admitted opcodes, `payload`/`length`, named native calls, memory
  rules), so later changes have a normative base.
- **ADD** an indirect-call statement:
  `%r = call_indirect %callee(%a, ...) -> <type>` and the result-less
  `call_indirect %callee(%a, ...)`, where `%callee` is a `pointer` value and
  the signature is fixed by the argument value types and the declared result
  type.
- Restrict `call_indirect` to sources with runtime or Corelib source
  authority, and forbid `payload`-derived addresses as callee or argument.
- State that `call_indirect` is not a function-value or closure mechanism;
  lambdas remain specified by `language-meta--evaluation--lambdas-and-closures`.

## Impact

- Compatibility: additive. Existing CLIF blocks keep their meaning; the new
  statement is rejected in user source, so user programs cannot depend on it.
- Migration: none. Runtime code that reaches code addresses through Rust-side
  helpers or compiler intrinsics may move to `call_indirect` later; this change
  does not require it.
- Reversion: remove the statement from the CLIF surface parser and lowering;
  no data or ABI format changes.
- No legacy URLs move.
