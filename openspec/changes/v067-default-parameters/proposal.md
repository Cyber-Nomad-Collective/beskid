## Why

Helpers such as `Assert.Equal` need an optional message, and callers should not pass the file, line and column by hand. Overloads are not part of the language. The owner ruled for C#-style default parameter values.

## What Changes

- A parameter may declare `= <constant>`. Optional parameters follow required ones. Calls fill omitted trailing arguments at the call site.
- Caller-information parameters are ordinary optional parameters with an attribute.
- Defaults apply to top-level functions, methods, contract methods, inline-module functions and host, scope and hook parameters. A contract declares the defaults of its methods.
- Diagnostics E1251–E1256 and the arity wording "expected 2–3 arguments, got 1".

## Capabilities

### Modified Capabilities
- `language-meta--surface-syntax--lexical-and-syntax`, `language-meta--type-system--types`, `language-meta--contracts-and-effects--contracts`, `compiler--semantic-pipeline--diagnostic-code-registry`.

## Impact

Grammar, parser, formatter, call checking, Corelib `Testing`, SDK regeneration. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. There is no compatibility path.
