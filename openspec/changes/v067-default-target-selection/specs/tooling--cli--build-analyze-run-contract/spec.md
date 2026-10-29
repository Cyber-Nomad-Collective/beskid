## ADDED Requirements

### Requirement: Default target of build and run
When `beskid build` or `beskid run` resolves a host project manifest and the command has no `--target` and no source-file input, the command SHALL select the target by kind. The order of the target blocks in the manifest SHALL NOT change the selection. Neither command SHALL select a target of `kind = Test`.

- `beskid run` SHALL select the App target.
- `beskid build` SHALL select the App target. When the manifest declares no App target, `beskid build` SHALL select the Lib target.

When the manifest declares two or more targets of the kind that the command selects, the command SHALL fail before it resolves dependencies. The error SHALL name each of those targets with its kind and SHALL tell the user to pass `--target <name>`. When the manifest declares no target of a kind that the command can select, the command SHALL fail with an error that names the targets of the manifest and tells the user to pass `--target <name>`. The command MUST NOT fall back to another target. `--target <name>` SHALL select the named target as before, also a Test target.

#### Scenario: A library with a Test target builds the library
- **GIVEN** a manifest that declares `target "lib" { kind = Lib }` and then `target "tests" { kind = Test }`
- **WHEN** `beskid build` runs in the project directory
- **THEN** the command builds the `lib` target as a shared library and does not report a missing `Main`

#### Scenario: An application with Lib and Test targets
- **GIVEN** a manifest that declares a Test target, an App target `app` and a Lib target, in that order
- **WHEN** `beskid run` and `beskid build` run without `--target`
- **THEN** both commands use the `app` target

#### Scenario: Two App targets
- **GIVEN** a manifest that declares `target "one" { kind = App }` and `target "two" { kind = App }`
- **WHEN** `beskid build` or `beskid run` runs without `--target`
- **THEN** the command fails with an error that names `one` and `two` and says to pass `--target <name>`

#### Scenario: Only a Test target
- **GIVEN** a manifest that declares only `target "tests" { kind = Test }`
- **WHEN** `beskid build` runs without `--target`
- **THEN** the command fails with an error that names `tests` and says to pass `--target <name>`
