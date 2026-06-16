---
title: Method dispatch - FAQ and troubleshooting
description: Common issues, troubleshooting, and locked decisions for Beskid
  method dispatch.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

## Locked decisions

| Decision | ID | Summary |
| --- | --- | --- |
| Static dispatch default | D-LM-DISP-001 | Compile-time member selection; no vtables in v0.1 |
| extend over impl | D-LM-DISP-002 | `extend type` is normative; `impl` parse-compatible |
| Receiver static type | D-LM-DISP-003 | Dispatch keys off static type, not runtime tags |
| No `null` receiver | D-LM-DISP-004 | Use `Option<T>` and `match` for absent values |

## FAQ

### Why no virtual dispatch in v0.1?

Static dispatch keeps the compiler and runtime simple. Dynamic polymorphism may be added in a future version with an explicit opt-in mechanism.

### Can I call a private method from `extend type`?

No. `extend type` may access public members only. `ExtendTypePrivateMemberAccess` (**E1511**) enforces this.

### What happens with method name collisions?

If two `extend type` blocks on the same type define the same method name, the compiler emits an ambiguity error.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| **E1101** | Method name typo or missing import |
| **E1107** | Accessing a private method from another module |
| **E1204** | Wrong number of arguments |
| **E1205** | Argument type does not match parameter |
| **E1511** | `extend type` accessing private member |
