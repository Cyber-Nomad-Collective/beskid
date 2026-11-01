## Why

The Beskid 0.5.4 compiler work (compiler commits `f857c827` through
`648d5e2a`, merged as `ff0b8545`) changed observable language behavior
without an OpenSpec delta. Programs that failed to compile now compile, and
some runtime results changed: string interpolation of `bool`, `f64`, and the
minimum `i64`; empty concatenation; string ordering; `f64` to integer
conversions; fully qualified module paths; `bulk` parameters; contract
methods on `where`-bounded generic receivers; and several member-access
fixes. The project rule is that observable behavior is specified in OpenSpec
in the same change set. This change states that behavior after the fact, so
the standard matches the reference compiler again.

## What Changes

- **ADD** to `language-meta--surface-syntax--lexical-and-syntax`: the text an
  interpolation operand produces for each admitted type, including the
  shortest round-trip `f64` digits and their ECMAScript layout.
- **ADD** to `language-meta--type-system--types`: empty string concatenation,
  ordinal string ordering, saturating `f64` to integer conversions, `bulk`
  parameters, and field access on call results and nested receivers.
- **ADD** to `language-meta--type-system--type-inference`: generic inference
  from `bulk` arguments, locals annotated with a type parameter, and
  contextual enum constructors in method arguments.
- **ADD** to `language-meta--program-structure--name-resolution`: fully
  qualified module paths resolve without `use`, and parameters and locals
  shadow method-owned fields.
- **ADD** to `language-meta--type-system--method-dispatch`: `this.Method()`
  sibling calls.
- **ADD** to `language-meta--contracts-and-effects--contracts`: bound
  selection and per-specialization dispatch for contract methods on
  `where`-bounded generic receivers.
- **ADD** to `language-meta--memory-model--memory-and-references`: array
  literal elements may be any expression of the element type.

Left out on purpose: the Rust toolchain pin and clippy allowance (build only),
the chained-projection visibility restore in `c8bdc7f0` (it returns to the
behavior before `8223acd3`, so there is no net change), and the corelib
`Time.bd` pin `493772ac` (a corelib fix to `ToUtcDateTime` and
`I64ToDecimal`, not a language rule).

## Impact

- Compatibility: additive. Every requirement states behavior that 0.5.4
  already ships. Programs that compiled before keep their meaning, except
  that interpolating a `bool` now gives `true` or `false` instead of `1` or
  `0`, and interpolating the minimum `i64` gives its full digits instead of
  `-`. A bare name inside a method that matches both a parameter or local and
  a field now reads the parameter or local instead of the field. These are
  defect fixes, not migrations.
- The pending change `extend-contract-system-generic-and-self` already adds
  `Bounded generic method availability`. This change does not restate it; it
  adds the rule for several bounds and per-specialization dispatch. Archive
  that change first.
- Migration: none. No legacy URLs move; no `/platform-spec/` route changes.
- Reversion: removing this change leaves the reference compiler ahead of the
  standard again; reverting the compiler behavior requires reverting the
  listed compiler commits and this change together.
