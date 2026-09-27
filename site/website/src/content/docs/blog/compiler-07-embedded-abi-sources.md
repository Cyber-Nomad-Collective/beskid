---
title: "The Binary That Only Worked on the Machine That Built It"
description: "beskid_aot resolved its native ABI assembly with CARGO_MANIFEST_DIR and read the files off disk at runtime. That path only existed on the CI runner that produced the binary, so a downloaded release could not build a native host anywhere else. The fix embeds the sources."
date: 2026-09-24
blogStatus: released
release: Compiler
cover:
  src: "/blog-covers/compiler-07-embedded-abi-sources.jpg"
  alt: "A marionette theatre with puppets suspended and controlled by strings from above."
  sourceHref: "https://commons.wikimedia.org/wiki/File:Marionette_Theatre.jpg"
  sourceLabel: "Alessandroga80, CC BY-SA 3.0"
---

Here is a sentence I did not enjoy writing in a bug report: the compiler we ship works, as long as you run it from the exact directory it was compiled in, on the exact machine that compiled it, with the exact checkout still sitting there. Otherwise it fails trying to open a file that was never going to exist on your computer in the first place.

That is not a compiler. That is a very elaborate way of saying "works on my machine" with extra steps and a release page.

## Where the path came from

`beskid_aot` links native platform objects: context-switching assembly, TLS setup, the executable bootstrap shim. To compile those with clang, llvm-ml, or cl, the AOT backend needs the actual `.S`/`.asm`/`.c` files on disk, not just their contents in memory. The old code found them like this, in `crates/beskid_aot/src/api/platform_objects.rs`:

```rust
let assembly_root =
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../beskid_abi/assembly").join(target.triple.as_str());
```

`env!("CARGO_MANIFEST_DIR")` is a compile-time macro. It does not resolve when the binary runs: it resolves once, when `rustc` builds the crate, to whatever absolute path the source tree happened to occupy on that machine. Then it gets baked into the binary as a string constant, forever, like a tattoo from when you thought "CI runner filesystem layout" was a permanent life choice.

On the CI runner that built the release, `CARGO_MANIFEST_DIR` pointed at something like `/root/actions-runner/_work/beskid_compiler/beskid_compiler/crates/beskid_abi`. That directory existed, because the runner had just checked out the repo there to build the thing. So the binary worked. It always works on the machine that built it, and that's the whole trap. Download that same binary to your laptop, where no such path exists, and `runtime-kit build-native-host` (and native executable bootstrap compilation generally) goes looking for a directory that was never yours to have.

## Why nobody caught it sooner

Every CI run builds and tests the compiler from a fresh checkout in a fresh location, then immediately uses that same binary, in that same location, to run the test suite. The bug is invisible under those conditions by construction: it's a bug about *portability*, and CI never asks the binary to travel anywhere. It builds in place and runs in place, which is exactly the one scenario where a baked-in absolute path is indistinguishable from a correct one.

The only way to see it is to do the thing an actual user does: download a released binary and run it somewhere else. Which, in fairness, is the entire premise of shipping a compiler.

## The fix nobody had to invent

`beskid_abi` already had a pattern for exactly this problem, because it hit it before: the Beskid runtime bootstrap sources are embedded into the binary with `include_str!` instead of read off disk, for `runtime_source`. `include_str!` also runs at compile time, but instead of capturing a path, it captures the *file contents* into the binary itself. No path survives into the compiled artifact at all, so there's nothing left to be stale.

`crates/beskid_abi/src/assembly_sources.rs` applies the same treatment to the ABI-v5 assembly and C sources:

```rust
const FILES: &[EmbeddedFile] = &[
    EmbeddedFile {
        relative_path: "include/beskid_runtime_abi_v5.h",
        contents: include_str!("../include/beskid_runtime_abi_v5.h"),
    },
    EmbeddedFile {
        relative_path: "assembly/x86_64-unknown-linux-gnu/context.S",
        contents: include_str!("../assembly/x86_64-unknown-linux-gnu/context.S"),
    },
    // ...
];
```

But clang and cl still need real files with real paths, because they are, reasonably, not in the business of compiling strings held in someone else's process memory. So `assembly_sources::stage_into` writes the embedded contents back out to disk, into a directory the caller controls, right before invoking the compiler, preserving the original `assembly/` and `include/` layout so the sources' own `#include` lines keep resolving relative to each other. `platform_objects.rs` now calls `stage_into(output_dir)` instead of reaching for `CARGO_MANIFEST_DIR`, in all three call sites that used to do this: context assembly, platform objects, and the executable bootstrap.

The binary now carries its own dependencies. It doesn't need to remember where it grew up.

## The test that had to change to prove it

One existing test built a Windows executable-bootstrap command with a *relative* output path, `Path::new("build")`, which happened to work because it never touched a real assembly directory, it just built a `Command` and asserted on its arguments. Once `stage_into` actually writes files, a relative path resolves against the test process's working directory, which isn't guaranteed to be writable, or even the same directory twice. The fix swapped it for a `tempfile::tempdir()`:

```rust
let scratch = tempfile::tempdir().expect("scratch dir");
let (command, _) =
    executable_bootstrap_command("x86_64-pc-windows-msvc", None, scratch.path(), "app", false)
        .expect("Windows bootstrap command");
```

Small change, but it's the kind of small change that tells you the fix is real: the test broke because staging now actually happens, not because someone edited an assertion to match new output.

The right verification for this exact bug: build the CLI, hide `crates/beskid_abi/assembly` from disk entirely, then run `beskid runtime-kit build-native-host` from a directory that has nothing to do with the source checkout. If the old bug were still there, that command would fail immediately, looking for a path that no longer exists. It didn't fail. The binary carried what it needed.

## The boring fixes that rode along

Two adjacent problems got cleaned up in the same window, neither glamorous, both the kind of thing that quietly wastes a new contributor's afternoon. `beskid_abi/build.rs` now checks that the `corelib` submodule is actually initialized before doing anything else, and panics with `"compiler/corelib is missing; run \`git submodule update --init corelib\` from the compiler directory"` instead of failing three layers deeper with a generic file-not-found. Fail closed, but say what to type next. And `rust-toolchain.toml` now pins the workspace to Rust `stable` with `rust-version = "1.96"` in `Cargo.toml`, with a README note explaining why a Homebrew `rustc` ahead of `~/.cargo/bin` on `PATH` produces a mystifying `linker \`rust-lld\` not found` instead of a helpful error.

Neither of those is the headline bug. Both are the same species of bug: something true about one specific machine, quietly assumed to be true everywhere.

## The actual lesson

`env!("CARGO_MANIFEST_DIR")` is a fine tool for finding files that ship with the crate at build time and get compiled into it, which is exactly what `include_str!` and friends are for. It is not a fine tool for finding files you intend to read *later*, at runtime, on a machine you have not met yet. The distinction sounds obvious written down. It was not obvious staring at working code that had passed every CI run since it was written, because "passed CI" and "works when you download it" are different claims, and only one of them was being tested.

If you've shipped a released binary anytime recently and it does something with `runtime-kit build-native-host`, the released `beskid` CLI now carries its own native sources with it, and it stopped assuming your filesystem matches ours.
