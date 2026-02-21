---
description: Runtime and ABI design
---

# Runtime and ABI design

## Purpose
Define how values are represented and how functions exchange values between Pecan and Cranelift.

## Core decisions
- **Calling convention**: use Cranelift default for target ISA.
- **Value types**: map to Cranelift types (`i64`, `f64`, `b1`, `ptr`).
- **Aggregate types**: pass by pointer (no runtime handles).

## ABI rules
- Decide struct layout and alignment.
- **Strings**: `{ptr, len}`.
- **Arrays**: `{ptr, len, cap}`.
- Define error signaling (return codes, tagged results, or runtime traps).

## References
- Module signatures: https://docs.rs/cranelift-module/latest/cranelift_module/trait.Module.html
- System V ABI (for reference): https://wiki.osdev.org/System_V_ABI
- x86 calling conventions: https://en.wikipedia.org/wiki/X86_calling_conventions
