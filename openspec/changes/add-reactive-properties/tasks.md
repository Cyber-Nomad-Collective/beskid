## First executable example

- [x] Specify the order and terminators of fields, properties and inline methods in a type body on the 0.6.7 RC4 baseline.
- [x] Parse and format automatic properties with literal defaults and expression-bodied read-only getters. Preserve member order in formatted source.
- [x] Run the mixed Count / Double project through CLI check, run and a separately built native executable. Verify that reading the default, overriding it at construction and subsequent assignment use the expected values.
- [x] Compare the equivalent automatic property and ordinary field in AOT output for a single target and configuration, including layout and the emitted instruction sequence.
- [x] Exercise the VS Code extension with the native language server: navigate to both declarations, complete the properties after a dot and diagnose an invalid assignment until it is repaired.

## Executable get/set blocks

- [x] Specify accessor order, automatic and custom forms, backing storage, assignment results and construction in the normative delta.
- [x] Run the clamping Count setter and derived Double through CLI and native output, including negative and positive writes.
- [x] Exercise custom reads and writes during a compound assignment. Check evaluation counts and direct construction in native output.
- [x] Compare the layout and instructions of an automatic get/set block with the equivalent ordinary field.
- [x] Verify contextual completion, backing-field navigation and unavailable-accessor diagnostics in VS Code.
- [x] Specialize custom accessor bodies on generic owners. Run Box<i32> and Box<string> through a generic caller and native execution, and verify property types and navigation in VS Code.

## 1. Validate

- [ ] Reconcile this delta with 0.6.7 grammar, RC4 runtime contract dispatch, contract conformance and reachability authorities; inventory affected reserved identifiers and existing conformance tests.
- [ ] Resolve every pending release decision in design.md and add precise normative requirements and scenarios before implementing the affected behavior.
- [ ] Record baseline field CLIF, object layouts, allocation counts and GC behavior for a pinned compiler, target and build configuration.

## 2. Introduce

- [ ] Implement parsing, typed property/accessor facts, construction and diagnostic rules; keep plain fields distinct.
- [ ] Integrate property requirements with existing contract conformance and support runtime contract-value access and conservative observation across possible conformers.
- [ ] Implement reachable observation analysis, equality and `always`, synchronous notification, and supported derived dependency handling.
- [ ] Implement shared observer storage and GC descriptors/barriers, and update formatter, reflection and editor tooling from the same semantic facts.

## 3. Migrate

- [ ] Update relevant existing capability specifications, examples and documentation; document source and foreign-boundary migration after the boundary decision.
- [ ] Resolve any affected existing identifiers explicitly; do not silently reinterpret fields as properties.

## 4. Delete

- [ ] Remove any temporary experimental lowering or duplicated property/conformance path introduced during implementation; retain one semantic and lowering path.

## 5. Verify

- [ ] Add parse, type, construction, access, contract, diagnostics and tooling conformance tests, including negative cases.
- [ ] Exercise auto and custom setters, normalization before equality, equal values, `always`, initialization and ordered same-fiber notifications; cover multiple stores according to the final decision.
- [ ] Exercise runtime contract-valued observation with multiple possible conformers, reachable derived dependencies and unresolved/opaque cases; prove no target is incorrectly unobserved.
- [ ] Compare normalized generated CLIF and layouts for equivalent unobserved automatic properties and fields on the same pinned configuration. Assert identical load/store operations and layout and zero observer allocation, lookup, equality or notification branches.
- [ ] Assert exactly one pointer-sized shared handle for an observed type with multiple observed properties, no per-instance subscription allocation before first subscription, and account separately for derived cache storage.
- [ ] Run GC stress tests across collections with live observed objects, callbacks and captured references, plus reclamation tests under the chosen lifetime contract; assert no lost live references or retained unreachable subscriptions.
- [ ] Run the applicable OpenSpec validation, compiler, runtime, corelib and tooling suites; record source revision, target, dependencies and commands with results.
