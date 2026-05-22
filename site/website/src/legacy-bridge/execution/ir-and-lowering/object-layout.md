---
title: "Runtime object layout"
description: Runtime object layout
---

> **Non-normative (legacy bridge).** This page is transitional documentation from the pre-`platform-spec` tree. **Canonical** execution contracts: [/platform-spec/execution/](/platform-spec/execution/). Full path mapping: [/platform-spec/legacy-spec-mapping/](/platform-spec/legacy-spec-mapping/).

## Heap object header
- Word 0: type descriptor pointer.
- Optional: object size for debugging/profiling.

## Type descriptor
- Size, alignment.
- Pointer bitmap/offset list for GC scanning.

## String
- `{ptr, len}` where `ptr` points to UTF-8 bytes.

## Array
- `{ptr, len, cap}` where `ptr` points to contiguous elements.
- Element layout comes from type descriptor.

## Struct
- Heap-allocated with header + fields.
- Field offsets follow alignment rules.
