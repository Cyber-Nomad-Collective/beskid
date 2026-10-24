## Why

A string literal supports only `\"`, `\\` and `\${`. Programs cannot write a newline, a tab or a Unicode scalar value as an escape. The beskid-lings course needs them. Specification comes first (MAP triage, 2026-10-24).

## What Changes

- String literals accept `\n`, `\t`, `\r`, `\0` and `\u{...}`.
- Any other escape is an error: E0109 for an unknown escape, E0110 for an invalid `\u{...}` value.
- The compound assignment operators `*=`, `/=` and `%=` join `+=` and `-=`.

## Capabilities

### Modified Capabilities
- `language-meta--surface-syntax--lexical-and-syntax`.

## Impact

Grammar `beskid.pest`, string literal decoding, formatter (escapes stay as written), tree-sitter and editor grammars. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Source that used a backslash followed by `n`, `t`, `r`, `0` or `u` was an invalid escape before this change, so no accepted program changes meaning.
