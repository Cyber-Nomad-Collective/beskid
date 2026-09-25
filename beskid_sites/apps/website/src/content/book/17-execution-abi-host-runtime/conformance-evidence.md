---
title: "Conformance evidence"
description: How platform-spec feature claims connect to tests in the compiler workspace, and the loop for turning a claim into a fixed bug.
tableOfContents: true
---

Platform-spec features cite verification anchors: conformance tests, crate paths, diagnostic codes. [Conformance](/platform-spec/compiler/conformance/) documents how that evidence is expected to track the standard's features, which in practice means a spec claim without a linked test is a claim nobody has checked yet.

The practical loop for contributors is to read the standard's feature page, find the tests it lists in `beskid_tests` or `beskid_e2e_tests`, and make the test fail before touching Rust. Spec-first does not mean test-optional; it means the test that proves the spec was violated exists before the fix does.
