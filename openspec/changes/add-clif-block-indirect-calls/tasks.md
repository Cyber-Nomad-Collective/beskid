## 1. Validate

- [ ] 1.1 Confirm the stated CLIF block surface against the reference compiler
  and its tests; record any divergence as a defect before adding syntax.
- [ ] 1.2 Identify runtime call sites with fixed-signature code addresses that
  will use `call_indirect` (scheduler entry points, trampolines).

## 2. Introduce

- [ ] 2.1 Parse `call_indirect %callee(%a, ...) -> <type>` and the result-less
  form in the CLIF surface module; type-check operands against declared
  parameter types.
- [ ] 2.2 Lower the statement to a Cranelift `call_indirect` with a signature
  built from argument value types and the declared result type.
- [ ] 2.3 Reject the statement outside runtime and Corelib source authority,
  and reject `payload`-derived callee or argument values.

## 3. Migrate

- [ ] 3.1 Optionally move runtime code that reaches fixed-signature code
  addresses through compiler intrinsics to `call_indirect`, one call site per
  change, each with its own tests.

## 4. Delete

- [ ] 4.1 Remove any intrinsic made redundant by a migrated call site; keep one
  implementation path per construct.

## 5. Verify

- [ ] 5.1 Surface, checker, and lowering tests for accepted forms, each
  rejection, and a JIT run that calls a known function through its address.
- [ ] 5.2 Confirm lambda behavior is unchanged and still specified only by
  `language-meta--evaluation--lambdas-and-closures`.
