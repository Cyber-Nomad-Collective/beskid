---
title: "The Gap Nobody Noticed: When Green CI Gates Lie"
description: "June 2026. A corelib test passed against a Rust handler that was correct by the old spec but wrong by the new one. The CI gate was green. The behavior was silently wrong. This was the moment the Rust-first runtime died."
date: 2026-06-15
blogStatus: released
release: Runtime
---

Some failures are loud. Segfaults, linker errors, crimson CI badges — these announce themselves. The failure that killed the Rust-first runtime was not loud. It was silent. The CI badge was green. The test passed. The behavior was wrong, and nobody noticed.

## What happened

In June 2026, a corelib test exercised a dispatch op — let's call it `bytes_compare`. The spec for `bytes_compare` had changed two weeks earlier: the return value was now a signed comparison result, not an unsigned length. The ABI contract was updated. The manifest was regenerated. The Book chapter had the new signature.

The Rust handler in `beskid_runtime/src/builtins/bytes.rs` was not updated.

The test passed. Of course it passed — the test called the handler, the handler returned a value, the value was a number, the number was in range. The test didn't check whether the number was signed or unsigned. Why would it? The handler was supposed to match the spec. The spec said signed. Ergo, the handler returned signed.

It did not.

## Why it was existential

This was not a bug. Bugs get found, fixed, and mourned at standup. This was a **gap** — a structural property of the architecture, not a mistake in one line of code.

The gap was between "what the spec says" and "what the runtime does." In the Rust-first model, that gap was filled by code review. A human had to notice that the handler's return type didn't match the spec's return type. A human had to look at the generated ABI tables and the hand-written Rust and hold them side-by-side in their head.

Code review does not scale across 34 kernel exports and 77 dispatch ops. It does not scale across spec changes that happen while handlers are being written. It does not scale across platforms where the same handler might compile to different behavior.

The CI gate was green because both sides of the gap were internally consistent. The spec was consistent with itself. The handler was consistent with itself. The test was consistent with both — in the sense that it didn't ask a question either side would answer differently. The green badge was not lying. It was reporting what it could see. It just couldn't see the gap.

## The analogy

Every enterprise architect knows this problem. Somewhere in your organization there is a permissions system — maybe LDAP groups, maybe IAM roles, maybe a spreadsheet in Finance. The system is documented. The documentation is correct. The implementation matches the documentation… as far as anyone has checked.

Then someone leaves the company. Their permissions are not revoked, because the revocation script reads from the HR database and the HR database has a "termination_date" field that payroll set to last Friday but the permissions system reads "employee_status" which still says "active." The gap between what HR says and what IAM says is filled with an ETL job that runs on Tuesdays.

The Rust handlers were that ETL job. They translated the spec into code, manually, and the translation was correct as far as anyone had checked. The Book chapter [Execution: ABI, host, and runtime](/book/17-execution-abi-host-runtime/) draws the domain map: codegen feeds `beskid_abi`, which feeds `beskid_runtime`, which talks to the OS. The Rust handlers sat in `beskid_runtime` as opaque blobs. The compiler could call them. It could not inspect them. The verifier could not check them.

## What died

The Rust-first runtime died that day — not with a crash, but with a concession. If the compiler cannot inspect the handlers, and the verifier cannot check the handlers, then the handlers are correct only because we say they are correct. And "we say so" is not a correctness argument. It is a hope.

The question became: can we make the handlers inspectable? Can we make the verifier check them? Can we close the gap?

The answer arrived a month later: ISLE rules emitting stock Cranelift CLIF.
