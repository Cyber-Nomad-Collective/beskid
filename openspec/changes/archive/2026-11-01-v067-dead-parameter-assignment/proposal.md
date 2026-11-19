## Why

On the 0.6.7 preview.8 toolchain, `unit AssignWhole(mut Size s) { s = Size { columns: 80, rows: 24, }; }` compiles, and the caller's `s` keeps its old value. An assignment to a field of the same parameter (`s.columns = 80;`) does change the caller's object. The standard says that parameters pass by value, so the whole assignment changes only the callee's binding. The compiler accepts it without a diagnostic, so the assignment is a silent no-op. Corelib had this defect: `Platform.Terminal.PollResize` assigned `lastSize = now;`, and `Console.RunTick` sent the same `Resize` message on every tick after the first resize.

## What Changes

- The by-value rule for `mut` parameters is stated as a requirement: an assignment to the parameter itself changes only the callee's binding, and an assignment through the parameter to a field or element writes the object or array that the caller also references.
- New code **E1259**: an assignment to a `mut` parameter that no later read of the parameter can observe is an error. The check is a backward liveness analysis over the body.
- The check is part of the legality gate, so `beskid check`, `beskid build`, `beskid test` and the language server report it, and lowering never sees such a body.
- Corelib: `PollResize` copies the new size into the fields of `lastSize`.

## Capabilities

### Modified Capabilities
- `language-meta--memory-model--memory-and-references`, `compiler--semantic-pipeline--diagnostic-code-registry`.

## Impact

`beskid_queries` legality gate (new `dead_parameter_assignments` fact), `beskid_analysis` diagnostic kinds and registry, Corelib `console` package. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. A body with a dead assignment to a parameter did nothing observable with the assignment; it is now rejected with E1259. To keep the effect, return the new value, or assign the fields of the caller's object. There is no compatibility path and no `ref` parameter modifier.
