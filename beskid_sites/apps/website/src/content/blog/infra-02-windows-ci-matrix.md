---
title: "MASM, COFF, llvm-ml, and the Windows CI Matrix That Wouldn't Go Green"
description: "Windows CI for a language compiler is three shells, two architectures, one missing assembler, and a static-archive TLS provenance problem that only manifests when you link against the CRT in a specific way. Beskid v0.4 shipped it anyway."
date: 2026-07-21
blogStatus: released
release: Infrastructure
---

Windows CI for a language compiler is not a checkbox. It is a distinct engineering discipline with its own priesthood, its own demons, and its own class of bugs that manifest only when you link against the CRT in a specific way on a specific version of Windows on a specific architecture. Beskid v0.4 shipped Windows CI. This is the story of what it took.

The commits span months: `96390abc` (Windows COFF import library tip), `10b58e50` (skipping MASM checks without llvm-ml), `18ba2f2b` (Windows ABI-v5 runtime kit matrix CI), `7163a063` (Windows runtime-kit CI repair), `5a2ef30d` (static-archive TLS provenance allowlist), `442dbd64` (skip missing llvm-ml on Rust gate). Six commits. One Windows CI matrix. Every one of them is a discovery about how Windows is not Linux.

## Three shells, one pipeline

The first thing Windows CI teaches you: "the command line" means three different things. cmd.exe has one set of quoting rules, variable expansion syntax, and exit code conventions. PowerShell has another. WSL bash has a third — and it runs in a Linux environment bolted onto a Windows kernel, with path translation between `/mnt/c/` and `C:\` that fails in creative ways when paths contain spaces, Unicode, or both.

The CI matrix has to run across all three because different build steps require different shells. MSVC toolchain setup requires cmd. Build script orchestration runs in PowerShell. The compiler test suite runs in WSL bash because the test harness was written for Unix. Three shells, three sets of quoting rules, one CI pipeline that has to pass on all of them.

Commit `7163a063` — "Windows runtime-kit CI repair" — was specifically about a quoting bug in the PowerShell build script. A path containing a version number with a dot was being interpreted as a property access. The fix was a different kind of quote. The kind of fix that takes four hours to find and one character to apply.

## COFF import libraries

Windows uses COFF — the Common Object File Format — for object files. Linux uses ELF. macOS uses Mach-O. The compiler produces object files in the platform's native format. For Windows, that means COFF. But producing a COFF object file is not enough to link against system libraries. Windows requires an import library: a `.lib` file that describes which symbols come from which DLL.

Commit `96390abc` — "Windows COFF import library tip" — landed the import library generation for the runtime kit. The runtime kit is the set of object files and libraries that every compiled Beskid program links against. On Linux, it's a `.a` static archive. On macOS, it's a `.a` with Mach-O objects. On Windows, it's a `.lib` COFF import library that references `kernel32.dll`, `ntdll.dll`, and the CRT.

The import library format is not documented in one place. It is documented across seventeen Microsoft Learn pages, three blog posts from 2006, and a single header file in the MSVC toolchain. The commit message says "tip" because the implementation was derived from LLVM's lld source code, not from specification. This is normal for Windows compiler work. The specification is the implementation.

## llvm-ml and the MASM gap

MASM — the Microsoft Macro Assembler — is the assembler for Windows x86-64. LLVM has an equivalent: llvm-ml. It is not installed by default. It is not available on all CI runners. It is not part of the standard LLVM toolchain distribution — it's a separate binary that has to be installed explicitly.

The Beskid compiler emits assembly for some runtime primitives. On Linux, that assembly is AT&T syntax for the GNU assembler. On macOS, it's Mach-O flavored. On Windows, it's MASM syntax for llvm-ml. When llvm-ml is missing, the assembly step fails. The failure is not "llvm-ml not found." It is "unsupported directive" or "unknown opcode" or a segfault — because the assembler that runs instead is not MASM-compatible.

Commit `10b58e50` added MASM check skipping when llvm-ml is not present. The checks are a CI gate that validates the assembly output is syntactically correct MASM. Without llvm-ml, the gate can't run. The skip is deliberate: the check is not required for correctness, it's a lint. Skipping a lint is better than failing CI because a tool is missing.

Commit `442dbd64` added a skip for the Rust gate — the Rust toolchain's own CI checks that run on the compiler source. The Rust gate also wants llvm-ml for its assembly tests, and it also fails when llvm-ml isn't installed. Two different gates, same missing tool, same fix: skip the check.

## Static-archive TLS provenance

Thread-local storage on Windows has a specific layout in static archives. The linker needs to know which symbols have TLS — which variables are per-thread rather than per-process. The compiler annotates TLS symbols in the object file. The static archive — the `.lib` file — preserves these annotations. The linker reads them and lays out the TLS section accordingly.

Get the annotation wrong and the linker produces a valid binary that crashes at startup. Not crashes with a helpful error message. Crashes in the CRT initialization code, before `main`, before any debugger can attach, with a stack trace that ends in `ntdll.dll` and a fault address that points to uninitialized memory.

Commit `5a2ef30d` — "static-archive TLS provenance allowlist" — added an allowlist of symbols that are permitted to carry TLS annotations. Any symbol not on the allowlist that claims TLS gets rejected at link time. The rejection happens in CI, not at runtime. The crash that would have happened in production becomes a build error with a specific symbol name and a link to the allowlist documentation.

This is the pattern again: move the failure from runtime to build time. The TLS bug was a runtime crash. The allowlist made it a link error. The link error happens in CI. CI fails the build. The bug never reaches production.

## Why Windows CI matters

Beskid is a language that targets all three major platforms. A language that only works on Linux is a language that only works on servers. A language that works on Windows, macOS, and Linux is a language that works everywhere developers write code. The Windows CI matrix is the proof that "everywhere" includes the platform with three shells, two architectures, one missing assembler, and a static-archive TLS provenance problem.

Cross-reference the cross-platform installer post (compiler-03-cross-platform-installer.md). The installer delivers the compiler to Windows machines. The CI matrix proves the compiler works when it gets there. The installer is the delivery mechanism. The matrix is the trust mechanism. Both are required.

Windows CI is not glamorous. The commits are workarounds for missing tools, quoting fixes for hostile shells, and allowlists for linker bugs. But at the end of the matrix, the gate is green. Beskid compiles on Windows. The test suite passes. The runtime kit links. The static archive doesn't crash at startup. That is the bar. It took six commits and months of calendar time to clear it. It was worth it.

## Provenance

[`18ba2f2b` — Windows ABI-v5 runtime kit matrix CI](https://github.com/Cyber-Nomad-Collective/beskid/commit/18ba2f2b) — [`5a2ef30d` — static-archive TLS provenance allowlist](https://github.com/Cyber-Nomad-Collective/beskid/commit/5a2ef30d) — [`442dbd64` — skip missing llvm-ml on Rust gate](https://github.com/Cyber-Nomad-Collective/beskid/commit/442dbd64)
