---
title: "07. Documentation comments"
description: Writing /// documentation with @ tags and @ref cross-references.
---

Documentation lives next to declarations in **`///` line comments** only. A doc run can be attached to top-level declarations and nested members (fields, variants, contract members, methods, parameters, and test-body statements). Write Markdown in the body, and use **`@param`**, **`@returns`**, **`@remarks`**, etc. for structured sections.

Cross-reference another symbol with **`@ref(Fully.Qualified.Name)`** so the compiler can validate the target.

See the [documentation comments spec](/platform-spec/language-meta/surface-syntax/documentation-comments/) for normative rules.
