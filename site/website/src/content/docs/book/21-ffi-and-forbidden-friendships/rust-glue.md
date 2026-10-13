---
title: "Rust Glue"
description: Call ordinary Rust code from Beskid through generated, checked C ABI adapters, in process.
tableOfContents: true
---

The previous pages told you to put a C shim in front of any Rust you want to call. Rust Glue writes that shim for you. You declare the boundary in Beskid, point the manifest at a directory of ordinary Rust, and `beskid build --backend glue-rust` generates the adapters, builds the Rust with Cargo, and links everything into shared libraries that call each other through a checked C ABI.

This is the 0.6.0 Rust Glue path. It runs in process: there is no helper process and no message protocol between Beskid and Rust. The requirements are proposed in the OpenSpec change `v06-rust-glue-integration`, which is part of the 0.6.0 release qualification. Read the change for the exact rules; this page shows the shape.

## The three pieces

**A manifest `glue` block** names the foreign library and the directory that holds its Rust source:

```text
glue "glue_manual" {
    backend = rust
    path = "rust"
}

target "ManualOwned" {
    kind = Lib
}
```

The directory must contain `implementation.rs` and nothing but regular `.rs` files. Anything else, a symbolic link included, is rejected rather than skipped. A .NET owner backend is not available in 0.6.

**An `[Extern]` contract** declares the functions in Beskid terms, against the library the `glue` block names:

```beskid
[Extern(Abi:"C", Library:"glue_manual")]
pub contract Foreign {
    i32 glue_i32(i32 value);
    f64 glue_f64(f64 value);
    char glue_char(char value);
    [RustOwner(Fallible:true)]
    string glue_utf8(string value);
    [RustOwner(Fallible:true)]
    u8[] glue_bytes(u8[] value);
}
```

**Plain Rust** implements them. No `extern "C"`, no `#[no_mangle]`, no raw pointers:

```rust
pub fn glue_i32(value: i32) -> i32 {
    value
}

pub fn glue_utf8(value: &str) -> Result<String, i32> {
    Ok(value.to_string())
}
```

The generated producer supplies the checked C exports around them.

## What can cross

The 0.6.0 matrix covers every fixed-width integer (`i8` to `u64`), `f32` and `f64`, `bool`, `char` as a Unicode scalar, UTF-8 `string`, `u8[]` byte buffers, `unit`, `word` for target-sized values, and checked opaque handles. Records by value, callbacks, enums, and Glue-driven exports are not in 0.6.0; they are proposed for 0.6.1 in `v061-glue-extensions`. An unsupported form fails before anything is generated.

## Opaque handles

A Rust value that Beskid holds but never looks inside gets a branded handle type:

```beskid
[GlueHandle(Library:"glue_manual", Nullable:false)]
[RustOwner(Path:"implementation::ManualOwned")]
pub type ManualOpaque<T> { u64 token, }
```

`[GlueHandle]` brands the type for one Glue library; a nominal type that crosses the boundary needs exactly one such brand. `[RustOwner(Path: ...)]` names the Rust type that owns the value.

## When Rust fails

A Rust function that can fail returns `Result<T, i32>` and its Beskid declaration carries `[RustOwner(Fallible:true)]`. The failure status is not silently turned into a value. A fallible call inside a Glue export ends that export, and the export's checked invocation returns the status to its caller. A fallible call made outside that checked scope traps instead.

## Building

```bash
beskid build --backend glue-rust \
  --rust-toolchain /path/to/rust/toolchain \
  --linker /path/to/linker
```

The backend builds a `Lib` target as one shared Glue consumer plus one Rust owner image for each `glue` block that a binding uses. The tools come only from the command line: `--rust-toolchain <PREFIX>`, or `--cargo` together with `--rustc`, plus `--linker`, which is required. `CARGO`, `RUSTC`, and `PATH` are not read. Every rejection happens before Cargo, rustc, or the linker runs, and the images are published together, so a failed rebuild leaves the previous ones in place. A plain `beskid build` never needs Rust.

Full flags: [`beskid build`](/book/reference/cli/commands/build/).

## What this is not

- **Not a stdio bridge.** Earlier Glue designs described a protocol over a child process's standard streams. Its types still exist in `corelib_glue` as a provisional, separately tracked capability (`v06-glue-stdio-bridge-provisional`). Nothing in the 0.6.0 Rust Glue path uses it, and it has no 0.6.0 delivery obligation.
- **Not the old scaffold.** The 0.4 `[Glue]`, `[GlueImport]`, and `[GlueExport]` attributes and the Glue Mod contracts are deleted.
- **Not .NET.** .NET Glue is unavailable until it is separately qualified.
- **Not the Rust ABI profile.** That profile is the runtime's own boundary. Your Rust goes through Glue or a hand-written C shim.

## Next

[22. So you want to contribute](/book/22-so-you-want-to-contribute/)

## Hub

[21. FFI](/book/21-ffi-and-forbidden-friendships/)
