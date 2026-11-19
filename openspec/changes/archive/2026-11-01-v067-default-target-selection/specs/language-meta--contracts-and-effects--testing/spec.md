## ADDED Requirements

### Requirement: Default test targets
When `beskid test` resolves a host project manifest and the command has no `--target`, the command SHALL run every target of `kind = Test`, in manifest order, in one run. When the manifest declares no Test target, the command SHALL run the Lib target. When the manifest declares no Test target and two or more Lib targets, the command SHALL fail with an error that names the Lib targets and says to pass `--target <name>`. When the manifest declares neither a Test target nor a Lib target, the command SHALL run no tests, as for an App-only project.

When the command runs two or more targets, it SHALL report each target and then a combined summary of all targets. A target that fails to compile SHALL be reported as a failed target, and the command SHALL continue with the next target. The command SHALL exit with a nonzero status when one or more targets fail. With `--json`, the command SHALL write one `result` record with one entry for each target and a combined summary.

#### Scenario: A library with a Test target
- **GIVEN** a manifest that declares `target "lib" { kind = Lib }` and then `target "tests" { kind = Test }`, and `tests` declares one passing `test` item
- **WHEN** `beskid test` runs without `--target`
- **THEN** the command runs the `tests` target, reports one passed test and exits with status 0

#### Scenario: Two Test targets
- **GIVEN** a manifest that declares the Test targets `unit` and `more`, in that order, and one test of `more` fails
- **WHEN** `beskid test` runs without `--target`
- **THEN** the command runs `unit` and then `more`, reports a combined summary with one failed target and exits with a nonzero status

#### Scenario: No Test target
- **GIVEN** a manifest that declares an App target and a Lib target that declares a `test` item
- **WHEN** `beskid test` runs without `--target`
- **THEN** the command runs the tests of the Lib target
