## MODIFIED Requirements

### Requirement: ABI-v5 native executable entrypoint ownership

For ABI-v5 AOT **executable** output, the compiler SHALL select one logical
Beskid application function and expose it to the validated target runtime kit
only as the private symbol `beskid_program_main`. The language default for the
logical application function SHALL remain `Main`.

The selected runtime-kit entry adapter SHALL own the target CRT startup symbol:
`main` for `x86_64-unknown-linux-gnu` and `aarch64-apple-darwin`, and `wmain`
for `x86_64-pc-windows-msvc`. Generated Beskid application objects MUST NOT
define `main` or `wmain`. The adapter SHALL initialize its required native
state and then invoke `beskid_program_main`.

The selected adapter's declared program-entry alias MUST be exactly
`beskid_program_main`. If it is absent or differs, the compiler MUST reject
the executable request before object publication or native linking. It MUST
NOT infer a target convention, emit a fallback startup symbol, or substitute
another alias.

#### Scenario: Logical Main reaches CRT-owned startup through the private boundary

- **GIVEN** an ABI-v5 Linux x86-64 executable request with no explicit logical
  entry and a validated adapter declaring `main` and `beskid_program_main`
- **WHEN** the compiler produces executable AOT output for a program containing
  `Main`
- **THEN** the generated application object defines the private
  `beskid_program_main` boundary for `Main`
- **AND** the application object does not define `main` or `wmain`
- **AND** the runtime kit supplies `main` and invokes the private boundary

#### Scenario: Windows CRT ownership uses wmain

- **GIVEN** an ABI-v5 Windows x86-64 executable request and a validated adapter
  declaring `wmain` and `beskid_program_main`
- **WHEN** the compiler produces executable AOT output
- **THEN** the generated application object does not define `main` or `wmain`
- **AND** the runtime kit supplies `wmain` and invokes `beskid_program_main`

#### Scenario: Incompatible program-entry alias fails closed

- **GIVEN** an executable adapter whose declared program-entry alias is
  `Start`, `Main`, or any value other than `beskid_program_main`
- **WHEN** the compiler selects that adapter for executable AOT output
- **THEN** compilation fails before object publication or native linking with
  an incompatible ABI-v5 executable-entry diagnostic
- **AND** the compiler emits neither a native startup symbol nor an alias
  fallback

### Requirement: Explicit AOT Start selection is not a language default

The compiler AOT API MAY accept an explicit request that selects a logical function named `Start`. That request SHALL apply only to that AOT compilation;
it MUST NOT create a language-level `Start` alias, change the language default
from `Main`, alter JIT entry selection, or request a native linker symbol named
`Start`. The selected `Start` function SHALL still be reached through the
private `beskid_program_main` boundary.

If an explicitly requested entry function is missing, invalid for the selected
output, or incompatible with the ABI-v5 adapter, the compiler MUST fail the
request. It MUST NOT silently select `Main` or another function.

#### Scenario: Explicit AOT Start selection remains private

- **GIVEN** an executable AOT request explicitly selecting `Start` and a
  program with a valid logical function named `Start`
- **WHEN** the compiler produces output with a validated ABI-v5 adapter
- **THEN** `Start` is the selected logical application function for that output
- **AND** the generated application object exposes it only through
  `beskid_program_main`
- **AND** `Start` is not emitted as a CRT startup symbol or an implicit public
  export

#### Scenario: Missing explicit Start does not fall back to Main

- **GIVEN** an executable AOT request explicitly selecting `Start`
- **AND** the program contains `Main` but no valid `Start`
- **WHEN** the compiler resolves the requested entry
- **THEN** compilation fails with a missing or invalid requested-entry
  diagnostic
- **AND** the compiler does not select `Main`

### Requirement: Application entry adaptation is distinct from public exports

Selecting a logical application function for executable AOT output MUST NOT by
itself create a public user export. Explicit `[Export]` functions SHALL remain
governed by the public export policy, including its placement, ABI, signature,
linkage, and symbol-collision requirements. The compiler MUST NOT use the
public export table to publish, discover, or replace the private
`beskid_program_main` boundary.

#### Scenario: Explicit public export coexists with the private application boundary

- **GIVEN** an executable AOT program whose logical `Main` is selected and
  whose separate `pub` function has a valid explicit `[Export]` declaration
- **WHEN** the compiler emits the executable application object
- **THEN** the explicit export is emitted only according to the public export
  policy
- **AND** the logical application entry is represented by the private
  `beskid_program_main` boundary
- **AND** neither selection changes the other function's linkage or symbol
  policy
