---
description: Testing and CLIF reader
---

# Testing and CLIF reader

## Purpose
Use Cranelift's CLIF reader to parse and compare generated CLIF for tests.

## Key APIs
- `parse_functions(text)` to parse a CLIF file into `Function` values.
- `parse_test(text, options)` for test files with run commands.

Reference: https://docs.rs/cranelift-reader/latest/cranelift_reader/fn.parse_functions.html

## Suggested test strategy
- Serialize generated CLIF and compare to golden files.
- Use small unit tests per HIR lowering rule.
- Include runtime builtins in module so signatures match.
- Add JIT smoke tests for arena mutation scoping and dynamic root survival.
