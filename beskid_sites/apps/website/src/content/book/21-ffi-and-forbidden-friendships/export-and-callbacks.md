---
title: "Export and callbacks"
description: Export attributes and callback registration for native hosts.
tableOfContents: true
---

Hosting Beskid from outside uses [Export and callbacks](/platform-spec/language-meta/interop/export-and-callbacks/)—export attributes, callback registration, and call shapes that must not alias runtime builtins.

If your diagram has arrows from JavaScript to fibers to C# to Beskid, stop and draw a simpler diagram.

## Design one boundary at a time

Write down which side owns startup, which side invokes the callback, and what data crosses each call. Then verify that shape against the [export and callbacks standard](/platform-spec/language-meta/interop/export-and-callbacks/) and the [execution ABI and host domain](/platform-spec/execution/abi-and-host/). Keeping the boundary small makes ownership and failure handling reviewable.

## Hub

[21. FFI](/book/21-ffi-and-forbidden-friendships/)
