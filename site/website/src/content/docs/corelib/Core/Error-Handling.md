---
title: "Core.ErrorHandling"
---


## Purpose
Define common error-shaping rules and diagnostics contracts.

## Contract
- Domain modules define focused error enums (`IoError`, `FsError`, `ParseError`, ...).
- Error payloads should be explicit and minimal.
- Avoid string-only error channels for structured failures.

## Guidelines
- Prefer additive enum evolution.
- Preserve source-local diagnostics where possible.
- Keep error naming consistent and descriptive.
