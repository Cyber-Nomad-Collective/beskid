## Context

CLIF blocks are parsed by one surface module (`crates/beskid_analysis/src/clif_surface.rs`,
informative) shared by the type checker, which reports diagnostics against
declared parameter types, and ISLE lowering, which parses the instruction lines
with `cranelift-reader` and copies them into the enclosing function. Named
calls are resolved during lowering, where symbols are known. Event handlers and
the fiber scheduler already emit `call_indirect` from compiler code
(`crates/beskid_isle/src/context/events.rs`, scheduler trampolines,
informative).

## Decisions

- **Signature from the statement, not from a declaration.** The CLIF signature
  is built from the CLIF types of the argument values and the declared result
  type, with the target's default calling convention, exactly as for
  `call @symbol(...)`. There is no separate signature syntax: one statement
  form, one path through the surface parser and lowering.
- **Callee is a `pointer` value.** `%callee` must be a parameter of type
  `pointer`, or a block-local value computed from such parameters by the
  admitted integer opcodes. CLIF blocks still cannot load from arbitrary
  addresses (memory access stays limited to `payload` addresses), so a code
  address reaches a block only as an argument. The caller is responsible for
  the address naming code with exactly the stated signature, as it is already
  responsible for keeping memory accesses in bounds.
- **Source authority.** Only compiler-embedded runtime and Corelib sources may
  use `call_indirect`, using the same per-file source authority that grants
  Corelib native services. User source gets a diagnostic, which keeps the
  unchecked-signature risk inside reviewed code.
- **No closures.** The statement passes no environment implicitly and has no
  generic form. Function values keep their own representation and lowering.

## Rejected alternatives

- A `func_addr` opcode plus `call_indirect` in user code: it would expose an
  unchecked function-pointer surface to every program, and it still could not
  express generic or capturing calls.
- Implementing lambdas on top of CLIF blocks: creation (lifting, captures,
  environment pointer maps) happens during compilation of the lambda
  expression, and generic invocation needs a signature per specialization;
  neither fits a monomorphic CLIF text block.

## Observability, security, rollback

- Diagnostics name the statement, the offending operand, and the source
  authority that was missing.
- Security: the restriction to runtime and Corelib sources is the security
  boundary; no user-visible capability is added.
- Rollback: delete the statement from the parser and lowering; the capability
  text for the existing surface stays valid.
- Source of truth: this capability; the surface module and tests are
  conformance anchors only.
