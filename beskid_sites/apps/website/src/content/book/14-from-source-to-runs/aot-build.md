---
title: "AOT build"
description: Object emission, the runtime kit, the lifecycle host, and the link step that produces something you can ship.
tableOfContents: true
---

```bash
beskid build --project ./MyApp.bproj --target App
beskid build --project ./MyApp.bproj --target App --kind static --output libmyapp.a
beskid build --project ./Lib.bproj --target Core --target-triple x86_64-unknown-linux-gnu
```

`beskid_aot` takes the same `CodegenInput` the engine would, has Cranelift emit an object file, and links it against the runtime kit for the target triple. The default output kind follows the target: an executable for `App` and `Test`, a shared library for `Lib`. `--kind` overrides it with `exe`, `shared`, `static`, or `object`; `--release` selects the optimized profile; `--target-triple` cross-compiles; and `--verbose-link` prints the linker invocation when you need to know what actually ran.

## Runtime kits

Generated code calls into `beskid_runtime` for the collector, fibers, syscalls, and panics. That runtime is not compiled into your object; it ships as a prebuilt kit per target and profile, installed with `beskid runtime-kit`. A kit is discovered at an exact installed prefix, validated against the ABI version the compiler expects, and rejected if it is missing, mismatched, or altered. There is no "found a runtime somewhere on the path, hope it is compatible". Mismatch is a build error with both versions in it.

## The lifecycle host

Every native executable starts through one lifecycle host. On Windows that is the CRT's `main` or `wmain`; elsewhere the platform entry. The host initializes the runtime, the collector, and the scheduler, then calls `beskid_program_main`, which is your `Main`. When `Main` returns, the host joins every fiber that was not detached, runs shutdown, and returns the exit code. You do not write any of that and you cannot skip it, which is why a Beskid binary's startup is the same on every platform the kit supports.

## Mods are AOT artifacts

A `type: Mod` package is built by `beskid_aot` into a native object plus a descriptor, keyed by target triple and a cache key. The compiler loads that artifact into the host when it compiles a project that depends on the mod. There is no interpreted mod path, so a mod cannot behave differently under the language server than under the build. Chapter 15.

## Linking policy

`--prefer-static` and `--prefer-dynamic` express a preference for how foreign libraries from the manifest's `link` metadata are resolved. `--export` names symbols a shared or static library must expose, which is what chapter 21 uses when native code hosts Beskid instead of the other way round.

Contracts: [backends](/platform-spec/compiler/build-pipeline/backends-jit-aot/), [AOT artifact contract](/platform-spec/compiler/compiler-mods/mod-host-bridge/aot-artifact-contract/), [ABI versioning](/platform-spec/execution/abi-and-host/abi-versioning-and-compatibility/).
