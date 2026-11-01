## Why

`beskid check` accepts a function with a valued result whose body can end without a value, for example `i32 Main() { 0; }`. Only a bare `return;` is reported (E1207). `beskid build` then fails in lowering with the internal error E2103. The ICE sweep of the 0.6.7 stability proof found it with the mutation `return 0;` to `0;` in a template `Main`. A user error must be a user diagnostic, and lowering must not receive such a function.

## What Changes

- A function or method whose declared result is not `unit` or `never` SHALL NOT have a reachable end of body. Every path ends in `return <value>;` or in a statement that does not complete normally.
- New code **E1258**, reported at the closing brace of the body, with a related note at the name: "`<name>` returns `<type>`".
- The check is part of the legality gate, so `beskid check`, `beskid build`, `beskid test` and the language server report it, and lowering never sees such a body.
- The rulings for `if` without `else`, `match`, `while (true)`, `break`, `continue`, nested blocks and calls that return `never` are recorded in `design.md`.

## Capabilities

### Modified Capabilities
- `language-meta--evaluation--control-flow`, `compiler--semantic-pipeline--diagnostic-code-registry`.

## Impact

`beskid_queries` legality gate (new `missing_return` fact), `beskid_analysis` diagnostic kinds and registry. Corelib, templates, Book code blocks and beskid-lings solutions are checked under the rule. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. A body that falls off its end was rejected by every build already (E2103); it is now rejected by `beskid check` with E1258. There is no compatibility path.
