## Why

ABI-v5 already records a target CRT startup symbol (`main` on Linux and
macOS, `wmain` on Windows) and the private `beskid_program_main` program
boundary. AOT entry selection still admits a custom `Start` name, however,
which can be misread as a language-level alternative to logical `Main` or as
permission for generated code to own a native startup symbol. That ambiguity
can collide with the CRT and blur the boundary between an application entry
and a user-requested public export.

## What Changes

- **MODIFY** `compiler--build-pipeline--backends-jit-aot` to make an AOT
  executable map its selected logical Beskid application function to exactly
  the private host boundary `beskid_program_main`.
- Require each validated ABI-v5 target adapter to own native CRT startup:
  `main` on Linux and macOS, and `wmain` on Windows. Generated application
  code MUST NOT define either startup symbol.
- Preserve explicit user exports under the public export policy. Selecting an
  application entry does not itself create a public export and does not
  rewrite, suppress, or reserve an explicitly requested export.
- Define fail-closed rejection for an adapter whose declared program-entry
  alias is not exactly `beskid_program_main`.
- Retain `Start` only as an explicit compiler AOT API request value. It is not
  a language default, a source-language alias for `Main`, or a native entry
  symbol.

## Impact

This is a normative ABI-v5/AOT contract change. Follow-on implementation
touches manifest validation, AOT entry adaptation, native runtime-kit startup
objects, symbol-inventory verification, and executable/link-time tests. JIT
and library/object-only output do not acquire a CRT entrypoint from this
change.
