---
title: "SYM_SYS_PRINT, SYM_SYS_PRINTLN, SYM_STR_LEN: The Builtin Symbols You Never See But Use Every Day"
description: "Beskid's first builtin symbols were print, println, and strlen. They are not functions in the standard library — they are compiler-known symbols that bridge language space and host space. Every builtin since traces back to this pattern."
date: 2026-03-02
blogStatus: released
release: Design
---

Every Beskid program that prints to the terminal calls `SYM_SYS_PRINT`. You have never typed that symbol. You will never see it in a stack trace. The compiler knows it before it parses a single line of your source code, and the interop table knows how to route it to the host OS. The builtin symbol system is the thinnest possible bridge between the language and the machine. This is the story of the first three planks of that bridge.

Commit `47b24dab` landed SYM_SYS_PRINT, SYM_SYS_PRINTLN, and SYM_STR_LEN — the first builtin symbols in the Beskid compiler. The same commit added attribute and lambda expression grammar/HIR support, fixed the INTEROP_DISPATCH_USIZE return type, improved type rendering, and shipped the extern contract validation skip. That is a lot of things in one commit. They were not unrelated. They were the minimum viable surface for builtin symbols to actually work.

## What builtin symbols are

A builtin symbol is a symbol the compiler knows about before parsing any user code. The compiler doesn't resolve `SYM_SYS_PRINT` by walking imports. It doesn't look it up in the standard library. The symbol is hardcoded in the compiler's symbol table at startup, with a full type signature, a calling convention, and a dispatch tag for the interop table.

The type signature: `fn(string) -> void`. The compiler knows this. When your code calls `print("hello")`, the compiler doesn't infer the type of `print` from usage. It already knows — and it checks that you passed a string, not an integer, not a struct, not a closure. The error message if you get it wrong comes from the builtin's known signature, not from type inference.

The dispatch tag: `INTEROP_DISPATCH_PRINT`. The interop table maps dispatch tags to runtime handlers. When the compiled program executes, it doesn't call a function pointer. It calls through the interop dispatch envelope — the runtime looks up `DISPATCH_PRINT` in a table populated at startup by the host OS integration layer. The compiler knows the tag. The runtime knows the handler. The host OS provides the implementation. Three layers, one symbol.

## The three pioneers

SYM_SYS_PRINT: prints a string to stdout, no trailing newline. The simplest possible I/O operation. If this doesn't work, nothing works.

SYM_SYS_PRINTLN: same, with a trailing newline. A separate builtin rather than a parameter on PRINT, because builtins are minimal. A parameter is a design decision. A separate builtin is a catalog entry. Beskid chose the catalog.

SYM_STR_LEN: returns the byte length of a string. Before this, the compiler had no way to ask the runtime how long a string was. String operations in user code required the compiler to know string internals. SYM_STR_LEN made string length a runtime concern, not a compiler concern. The compiler knows the symbol exists and what it returns. The runtime knows how to compute it.

## The return type fix

INTEROP_DISPATCH_USIZE had a bug. It returned i32 instead of i64. On 32-bit platforms, this was correct. On 64-bit platforms — which is every platform Beskid targets — it truncated string lengths to 32 bits. A string longer than 4 GB would report the wrong length. Beskid programs are unlikely to allocate 4 GB strings in 2026. But the bug wasn't about likelihood. It was about the contract: `usize` means the platform's size type. On a 64-bit platform, `usize` is 64 bits. The interop dispatch returned 32 bits. The contract was broken. Nobody noticed until string length operations started returning wrong values in edge-case tests. The fix was one line: `i32` → `i64`. The lesson: interop boundaries are where type system assumptions meet platform reality. Check the widths.

## The extern contract validation skip

Builtins are inherently extern — their implementation lives in the host OS, not in Beskid. Extern functions normally go through contract validation: does the declared signature match the implementation? For builtins, that validation would require the compiler to parse the OS headers — the C runtime, the system call interface, the platform ABI. That is not the compiler's job. Skipping extern contract validation for builtins was the honest choice. The alternative was faking it: writing stub headers that "validate" against declarations the compiler itself wrote. The skip is an admission that the OS is the authority for builtin implementations. The compiler defines the interface. The OS provides the body. The contract between them is tested by actually running the program, not by static analysis of headers the compiler shouldn't need to read.

## The pattern that became the standard

Every builtin added since — channels, fiber operations, FFI dispatch — follows the same pattern: a symbol name in the compiler's pre-populated table, a type signature, a dispatch tag, and an interop envelope. The compiler knows the name before your code runs. The runtime knows the handler before the program starts. The OS provides the implementation it always provided.

Builtins are not a standard library. A standard library is written in the language and compiled with the program. Builtins are written in the host platform's native code and linked at program startup. The distinction matters because it defines who is responsible for correctness. Standard library bugs are language bugs. Builtin bugs are platform integration bugs. The compiler team owns the first. The runtime team owns the second. The boundary between them is the builtin symbol table.

Cross-reference the ABI builtins authority post and Book chapter "FFI and forbidden friendships." The FFI chapter describes the same boundary from the other side: what happens when user code, not the compiler, needs to cross into host space. Builtins are the compiler's own FFI. They follow the same rules because the boundary is the same boundary.

Builtins should be minimal. They should be documented in the spec, not discovered in the compiler source. They should never be invented without a spec change — because every builtin is a permanent API between the compiler and the platform, and permanent APIs accumulate cost forever. SYM_SYS_PRINT, SYM_SYS_PRINTLN, SYM_STR_LEN: three symbols, three spec entries, zero regrets.
