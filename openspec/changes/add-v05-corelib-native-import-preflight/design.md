## Context

`CorelibService` is an opaque compiler-owned fact with an exact logical source
path, service declaration name, and native adapter. A separate capability
proves that the assembled unit is the checked-in Corelib source. ABI-v5
generates one target binding per Corelib service from `runtime_manifest.bsol`.
The former module-emission map collapsed the service fact to an adapter string
before validating the relationship among these records.

## Decision

One `Corelib native import preflight` module owns the complete admission rule.
It accepts an already source-authorized Corelib service fact plus the selected
ABI-v5 manifest and returns the only permitted native ABI shape. Its interface
is deliberately small: codegen receives either the exact adapter or a typed
failure; no caller receives an editable manifest row or an inferred fallback.

The preflight must verify all of the following before module lowering adds the
adapter to `ExternImport`:

1. The supplied declaration resolves through the exact source-scoped Corelib
   capability, including its logical source path.
2. The supplied target manifest is valid and byte-for-byte the canonical
   ABI-v5 contract for that selected target.
3. The manifest-generated table has one and only one row for each supported
   target for the service name.
4. Every row names the exact adapter and target implementation recorded by the
   Corelib declaration, and every row has the same parameter/result shape.
5. The selected target has exactly one of those rows.

The narrow target-independent source-builtin class is generated separately
because it has no target-specific implementation row. It must have exactly one
generated declaration with the same source name, adapter, and shape; canonical
manifest equality establishes that this declaration applies unchanged to every
supported target. It is not an alias or a fallback.

No user-visible type, exception, or native status value crosses this seam. A
failure is a compiler diagnostic, not a Corelib fallback. `Network/Internal.bd`
is one ordinary source-authorized caller of the rule; it does not receive a
special import path.

## Rejected alternatives

- Validate only the adapter string. This loses source ownership and permits a
  copied or mismatched declaration to reach native linkage.
- Make Networking its own import validator. That duplicates target policy and
  would let future Corelib services drift.
- Reuse user `Extern` validation. User FFI requires a C ABI and library
  authority; Corelib runtime services require manifest authority and must not
  be resolved from a foreign library.
- Begin Glue generation. Glue is a v0.6 concern and is neither required nor
  authorized by this preflight.

## Verification

Compiler tests cover every source-authorized service on every supported target,
unknown source and adapter mismatches, and the complete Networking service
family. The final all-surface verification wave regenerates ABI-v5 artifacts
from `runtime_manifest.bsol`, then runs compiler tests, Beskid tests, analysis,
run, and build. No generated contract file is hand-edited.
