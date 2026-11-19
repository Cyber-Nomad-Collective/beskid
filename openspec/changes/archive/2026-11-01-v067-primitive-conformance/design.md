# Design: primitive conformance (0.6.7)

A bound `T: C` is satisfied by a primitive `P` when one conforming `impl P : C` exists in the compilation. Dispatch is static: one specialization per primitive, with the value as receiver, passed by value. Direct calls on a primitive value with a conforming implementation (`n.Format()`, `3.Format()`) use static dispatch. A contract-typed parameter, field or element may receive a primitive with an `impl`; that is specified by `v067-contract-dispatch`.

## Archive notes

The new capability `core-library--text-and-parsing--formatting` needs a Purpose header at archive time, because `validate-standard` fails on a TBD Purpose: "This specification defines the Formatting contract of Corelib and its implementations for primitive types."
