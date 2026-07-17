---
title: "ISLE-native runtime migration: approved C1 design"
description: "An in-progress, constrained design for primitive runtime handlers using stock Cranelift CLIF."
date: 2026-07-11
blogStatus: in-progress
release: Runtime migration
---

This migration is an **approved design**, not a completed runtime rewrite. Its first milestone is C1: a small primitive-handler vertical that can register language-owned handlers while preserving the existing runtime manifest authority chain.

The proposed boundary uses ISLE to emit verifiable, stock Cranelift CLIF for a minimal primitive catalog. General HIR-to-CLIF lowering remains hand-written Rust. C1 is limited to primitive-handler work such as byte comparison and string equality; Rust fallbacks remain available during the staged rollout.

The design explicitly excludes replacing general expression lowering, porting frozen kernel exports, and porting fibers, channels, GC, composition, syscalls, or host-owned operations in this milestone. It also does not claim self-hosted handler compilation or a Rust-free toolchain.

The rollout principles are intentionally narrow: keep CLI, editor, and runtime versions aligned; rebuild artifacts after changing the contract; and expect version mismatches to be rejected. The relevant normative anchors remain the Platform Spec's [ABI and host material](/platform-spec/execution/abi-and-host/) and [runtime registration authority](/platform-spec/core-library/compiler-integration/corelib-injection-and-resolution/adr/0010-runtime-registration-authority/).

## Provenance

[Approved ISLE runtime-port design](https://github.com/Cyber-Nomad-Collective/beskid/blob/main/docs/superpowers/specs/2026-07-11-isle-runtime-port-design.md) · [ABI builtins authority](/platform-spec/execution/abi-and-host/builtins-and-symbols/adr/0003-builtin-specs-sole-clif-source/) · [runtime registration authority](/platform-spec/core-library/compiler-integration/corelib-injection-and-resolution/adr/0010-runtime-registration-authority/)
