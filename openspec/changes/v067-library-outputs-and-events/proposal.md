## Why

The 0.6.7 stability proof built every Corelib package with `beskid build` in its own directory. Three builds stopped with an internal compiler error. The compiler SDK package failed because its library output contained host-callback wrappers that run only inside a native Mod. Foundation and Console then failed because their library outputs contained items that read `Core.Args`. The proof also found two event defects: an event declared without a capacity did not lower, and the bare raise `Changed();` that the events specification shows was rejected with **E1101**.

## What Changes

- A library output contains only the items that it can execute. An item of the library's own units that reaches a compiler SDK host callback or `Core.Args` is not in the output, unless it is an `[Export]` item. An `[Export]` item that reaches one still fails the build.
- An event declared without a capacity has the default capacity 16.
- In a method of the type that declares an event, the bare name raises the event: `Changed(value);` is the same as `this.Changed(value);`.

## Capabilities

### Modified Capabilities
- `core-library--foundation-and-primitives--core-args`.
- `compiler--build-pipeline--backends-jit-aot`.
- `language-meta--evaluation--events`.

## Impact

Library emission in `beskid_codegen` (`lower_prepared_syntax_library`), event facts in `beskid_queries` (default capacity, bare raise in the legality gate), the Corelib gate (`scripts/ci/corelib-package-builds.sh` builds every Corelib package). Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. A library build that failed before can now succeed. A program that was rejected before (an event without a capacity, a bare raise) is now accepted. No accepted program changes meaning.
