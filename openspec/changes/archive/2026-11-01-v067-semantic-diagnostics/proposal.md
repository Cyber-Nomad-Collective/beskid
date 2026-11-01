## Why

Internal compiler errors still surface as unrelated codes or as raw panics. An assignment to an immutable binding is reported once per assignment. A mismatch between `Result` and its payload suggests a cast. The unused-item warning has a code that the new registry layout retires. Evidence: slice sem of the 0.6.7 program (`v067-sem-progress.md`) and wayfinder tickets 01 and 18.

## What Changes

- Register the internal-error floor E2101–E2105 with one message shape.
- Register E1512 for `[CopyOnAssign]` without a valid `Copy` method.
- W2101 replaces W1504 for an unused private item.
- E1214 is reported once per binding, with grouped related locations and a fix.
- A mismatch of `Result` or `Option` gets help that suggests `?` or `match`, not a cast.
- The generic runtime trap is named `panic`.

## Capabilities

### Modified Capabilities
- `compiler--semantic-pipeline--diagnostic-code-registry`, `language-meta--program-structure--modules-and-visibility`, `compiler--codegen-and-ir--lowering-contract`, `language-meta--memory-model--memory-and-references`, `language-meta--type-system--types`.

## Impact

`beskid_queries` legality, `beskid_analysis` diagnostic kinds, AOT error mapping, runtime manifest trap table (generated ABI files and runtime kits are regenerated). Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. The code W1504 is retired. The trap name `isle_invariant` is removed. There is no compatibility path.
