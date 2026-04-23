---
title: "07. Documentation comments"
description: Writing /// documentation with @ tags and @ref cross-references.
---

Documentation lives next to declarations in **`///` line comments** only. Write Markdown in the body, and use **`@param`**, **`@returns`**, **`@remarks`**, etc. for structured sections.

Cross-reference another symbol with **`@ref(Fully.Qualified.Name)`** so the compiler can validate the target.

See the [documentation comments spec](../spec/documentation-comments) for normative rules.
