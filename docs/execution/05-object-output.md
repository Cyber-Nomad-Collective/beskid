---
description: AOT output via ObjectModule
---

# AOT output via beskid_aot

## Purpose
Emit object files for ahead-of-time compilation and link them into standalone executables or libraries using a system linker.

## Architecture: The `beskid_aot` crate
AOT compilation is delegated to a dedicated crate, `beskid_aot`. The CLI uses this crate to perform the following steps:

1. **Object File Emission (`cranelift-object`)**:
   - `BeskidObjectModule` (mirroring `BeskidJitModule`) consumes a `CodegenArtifact`.
   - Uses `ObjectBuilder::new(isa, name, libcall_names)` and `ObjectModule`.
   - Emits an unlinked native object file (`.o` / `.obj`).

2. **Runtime Compilation / Selection**:
   - `RuntimeStrategy::BuildOnTheFly` materializes a runtime bridge crate in a cache-keyed directory and reuses prior artifacts when the cache key matches `(target, profile, ABI version)`.
   - `RuntimeStrategy::UsePrebuilt` accepts a runtime archive plus explicit ABI version metadata and validates ABI compatibility before linking.
   - Runtime archive inspection verifies required ABI symbols are present.
   - *Note:* Builtin runtime functions are exported as stable `#[unsafe(no_mangle)] pub extern "C"` symbols.

3. **System Linking (`cc` crate)**:
   - `beskid_aot` uses the Rust `cc` crate to dynamically discover the system's C compiler (`gcc`, `clang`, `cl.exe`).
   - It invokes the C compiler to link the emitted object file with the selected runtime static archive.
   - **Executables**: currently require `entrypoint = main`.
   - **Shared libraries**: apply export policy using platform-aware linker flags.
   - **Static libraries**: compose runtime archive + module object through an archive merge strategy (`ar -M` + `ranlib` on unix toolchains).

4. **CLI Integration (`beskid build`)**:
   - `pekan_cli` exposes AOT compilation through `beskid build`.
   - Supports output kind, profile, target triple, explicit export symbols, runtime strategy selection, and linker verbosity.

5. **Diagnostics**:
   - AOT pipeline emits stable `E40xx` diagnostics for ISA init, runtime selection/build, ABI mismatches, linker strategy support, and IO/request errors.

## Key APIs
- `ObjectModule::new(builder)`
- `ObjectModule::finish()` -> `ObjectProduct`
- `cc::Build::new().get_compiler()`

Reference: https://docs.rs/cranelift-object/latest/cranelift_object/struct.ObjectModule.html

## Notes
- Shares the same `Module` trait with JIT. Keep frontend code identical between JIT and AOT.
- AOT output must include type descriptor data objects just like JIT.
