import SpecArticleChrome from '@beskid/beskid-ui/platform-spec/SpecArticleChrome.astro';

<SpecArticleChrome />

## Callback type-shape

A **callback** is a **function pointer** plus optional **userdata** (`i64` opaque address in v0.3.0) passed to foreign code. The pointed-to function **must** use **`Export`** or a **trampoline symbol** documented in **[callback registration](/platform-spec/language-meta/interop/export-and-callbacks/callback-registration/)**.

Allowed callback signatures use the same primitive and interop-view types as import methods.

## Re-entrancy

When foreign code invokes a Beskid export or registered callback:

1. The runtime **must** enter a documented runtime scope (TLS heap/root/session).
2. Allocation on the Beskid side **must** follow normal GC rules.
3. Panics **must** map to **trap/abort across the boundary** in v0.3 Standard unless a profile documents **`C-unwind`** for a specific runtime entrypoint.

Foreign threads invoking Beskid without a host contract are **Proposed** (v0.3.2+).

## Import side: function-pointer parameters

`Extern` contract methods **may** declare parameters whose type is a **function type** with `Export` ABI in v0.3.0 when the parameter list uses only permitted FFI types. The compiler **must** verify that the referenced export exists or will be generated.

## Tables vs single callbacks

Hosts may register **multiple callbacks** through a versioned **registration table** (see export feature). **Interop.Contracts** only requires that each slot normalize to a flat call shape and stable symbol or trampoline identity.
