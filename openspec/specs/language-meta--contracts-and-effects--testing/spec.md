<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Testing Specification

## Purpose

This specification defines the language-level test harness, discovery, and assertions. Users rely on these semantics. Corelib testing helpers extend the semantics. The helpers do not redefine them.
## Requirements
### Requirement: Test item syntax
`test Name { body }` MUST declare a test entry point; the identifier is followed directly by the test body block with no parameter list. `meta { key = expr; }` sections MAY attach metadata parsed as `TestMetaSection`. `skip { key = expr; }` sections MUST mark conditional skip predicates. Test bodies MUST contain only statements and meta/skip sections allowed by `TestBodyItem`.

#### Scenario: Valid test declaration
- **GIVEN** a `test Case { meta { timeout = 30; } /* statements */ }` item
- **WHEN** the item is parsed
- **THEN** the compiler accepts it as a test entry point with metadata

### Requirement: Test discovery and execution semantics
`beskid test` MUST discover all `test` items in Test projects matching this syntax. The test runner MUST invoke each discovered test entrypoint in isolation unless `meta` specifies shared fixtures. Failed assertions MUST report as test failures without undefined behavior. Skipped tests MUST NOT count as failures when skip predicates evaluate true. Tests MAY appear in Test project kinds; placement in App/Lib projects SHOULD warn per manifest policy.

#### Scenario: Skip predicate true
- **GIVEN** a test with a `skip` section whose predicate evaluates true
- **WHEN** the test runner executes the suite
- **THEN** the test is reported as skipped and does not count as a failure

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

### Requirement: Generic equality assertions
`Testing.Assert.Equal<T>`, `Testing.Assert.NotEqual<T>` and `Testing.Expect.Equal<T>` SHALL require `T: Formatting`. The failure record SHALL carry `Format()` of the expected and the actual value. The functions `Expect.EqualI64`, `Expect.EqualString` and `Expect.EqualBool` SHALL NOT exist.

#### Scenario: Failure carries both values
- **GIVEN** `Assert.Equal<i64>(3, 4)`
- **WHEN** the assertion fails
- **THEN** the failure record carries "3" and "4"

### Requirement: Qualified test identity and selection
The identity of a test SHALL be its qualified name relative to its source unit: the names of the inline modules that enclose it, outermost first, followed by the test name, joined by `::`. A test at the unit root SHALL have its name alone as identity. Test discovery, the `qualified_name` of each test in the `beskid test` report, and the selection of the test that the runner builds and runs SHALL all use this identity. A selection that names no test SHALL fail the build of the test target. A selection that names more than one test SHALL fail the build of the test target and SHALL NOT select one of them. Two tests with the same name in different inline modules SHALL be distinct tests.

#### Scenario: Nested test runs by its qualified name
- **GIVEN** `mod Topic { test Inner { } }` in a Test target
- **WHEN** `beskid test` runs
- **THEN** the report contains the test `Topic::Inner` with outcome `passed`, and the build reports no missing test

#### Scenario: Failing nested test fails
- **GIVEN** `mod Topic { test Broken { Assert.Fail("x"); } }` in a Test target
- **WHEN** `beskid test` runs
- **THEN** the report contains the test `Topic::Broken` with outcome `failed`, and the command fails

#### Scenario: Same-named tests in two modules
- **GIVEN** `mod Alpha { test Shared { } }`, `mod Beta { test Shared { } }` and `test Shared { }` in one file
- **WHEN** the file is checked and `beskid test` runs
- **THEN** the check reports no duplicate name, and the report contains `Alpha::Shared`, `Beta::Shared` and `Shared`, each with its own outcome

#### Scenario: Bare name does not select a nested test
- **GIVEN** `mod Topic { test Inner { } }` and no test `Inner` at the unit root
- **WHEN** the selection `Inner` is built
- **THEN** the build fails because no test has the identity `Inner`

### Requirement: Test discovery with a separate namespace
`beskid test` SHALL discover every `test` item, including a test that shares its name with a function or type. The test report SHALL identify a test by its module and name.

#### Scenario: Shared name is discovered
- **GIVEN** a function `Parse` and `test Parse { }`
- **WHEN** `beskid test` runs
- **THEN** the test `Parse` runs and appears in the report

### Requirement: Assertion failure reporting
A failed assertion in `Testing.Assert` SHALL end the test as a test failure. It SHALL NOT end the test as a runtime trap. The failure report SHALL name the test, the call site of the `Assert` call (file, line and column), the expected value and the actual value. The report text SHALL have the form `assertion failed: expected <expected>, found <actual>`. A runtime trap during a test body SHALL be reported separately, with the form `test crashed: <reason>`, and SHALL NOT be reported as an assertion failure. Both outcomes SHALL count as failures in the run summary. Language-server and editor integrations SHALL show an assertion failure as an error on the line of the `Assert` call.

#### Scenario: Assertion failure
- **GIVEN** a test whose body calls `Assert.Equal(3, Add(1, 3))`
- **WHEN** the test runs
- **THEN** the runner reports `assertion failed: expected 3, found 4` under the test name, with the location of the `Assert.Equal` call

#### Scenario: Runtime trap
- **GIVEN** a test whose body divides by zero
- **WHEN** the test runs
- **THEN** the runner reports `test crashed:` with the trap reason and does not report an assertion failure

#### Scenario: Failure count
- **GIVEN** one failed assertion and one crashed test
- **WHEN** the run ends
- **THEN** the summary counts two failures

### Requirement: A project without tests passes
`beskid test` without `--target` on a project whose manifest has no `Test` or `Lib` target (for example a project with only an `App` target) SHALL run no tests, SHALL print "No tests found." and SHALL exit with status 0, as it does for a `Lib` target that declares no `test` item. With `--json` the command SHALL write one `result` record with status `success` and a summary with zero tests. `beskid test --target <name>` where `<name>` is not a `Test` or `Lib` target of the manifest SHALL fail with a message that names the target.

#### Scenario: App-only project
- **GIVEN** a project whose manifest declares only `target "app" { kind = App; entry = "Main.bd"; }`
- **WHEN** `beskid test --project <project>` runs
- **THEN** the command prints "No tests found." and exits with status 0

#### Scenario: Selected target that is not a test target
- **GIVEN** the same project
- **WHEN** `beskid test --project <project> --target app` runs
- **THEN** the command fails with "target `app` is not a Test or Lib target"

## Informative Source Provenance

The records below preserve migration history. They are not normative except where text was extracted into a requirement above.

### Source Record: Testing

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/contracts-and-effects/testing/`  
**Source:** `site/spec-content/platform-spec/language-meta/contracts-and-effects/testing/content.md`  
**SHA-256:** `7b3fd1e0ca11898d7ea5047363e052b70d837686dbd7079c9042d599d38b7d95`

<details>
<summary>Migrated source text</summary>

``````markdown
## Normative specification

### Scope

Defines the **`test`** item, discovery metadata, and skip rules for language-level tests. Harness execution is realized by tooling and corelib helpers.

### Syntax

```beskid
test MyCase {
    meta { timeout = 30; }
    // statements
}
```

- **`test Name { body }`** declares a test entry point; the identifier is followed directly by the test body block (no parameter list).
- **`meta { key = expr; }`** sections attach metadata (timeouts, categories) parsed as `TestMetaSection`.
- **`skip { key = expr; }`** sections mark conditional skip predicates.

### Static rules

- Test bodies **must** contain only statements and meta/skip sections allowed by `TestBodyItem`.
- Tests **may** appear in **Test** project kinds; placement in App/Lib projects **should** warn per manifest policy.
- Attributes on tests follow the general attribute rules (**E1508–E1510**).

### Dynamic semantics

- The test runner **must** invoke each discovered test entrypoint in isolation unless `meta` specifies shared fixtures (future).
- Failed assertions **must** report as test failures without undefined behavior.
- Skipped tests **must not** count as failures when skip predicates evaluate true.

### Diagnostics

Attribute and visibility issues use **E15xx**; test-specific codes **may** be added in the registry band reserved for tooling.

### Conformance

`beskid test` (tooling) **must** discover all `test` items in Test projects matching this syntax.

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Testing - Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Testing - Design model](./articles/design-model/)
- [Testing - Examples](./articles/examples/)
- [Testing - FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Testing - Flow and algorithm](./articles/flow-and-algorithm/)
- [Testing - Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Testing - Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/contracts-and-effects/testing/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/language-meta/contracts-and-effects/testing/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `c4349c60c1d5999b4dd56812f07b47474524dec9c0dbd900403939aa3425426e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Hard requirements

- **First-class `test` item** — Tests are module items, not attributes on functions only.
- **Meta/skip blocks** — Structured sections replace ad hoc comment conventions.
- **Test project kind** — Discovery should scope to `Test` projects unless manifest policy allows otherwise.
- **Corelib helpers are additive** — Assertion helpers in corelib must not redefine language-level `test` syntax.

## Diagnostic band E15xx

| Code | Condition |
| --- | --- |
| **E1508** | Duplicate attribute declaration target |
| **E1509** | Unknown attribute declaration target |
| **E1510** | Attribute target not allowed |

## Edge cases

- **Empty test body** — `test Empty { }` is valid; it passes immediately.
- **Multiple meta sections** — Only one `meta` section is parsed per test; duplicates are not supported.
- **Skip predicate failure** — If a skip predicate expression fails to evaluate, the test should be skipped conservatively.
- **Test in Lib project** — May warn depending on manifest policy; does not error.

## Invariants

- Test bodies must contain only statements and meta/skip sections allowed by `TestBodyItem`.
- Attributes on tests follow the general attribute rules.
- `beskid test` must discover all `test` items in matching `Test` projects.
``````

</details>

### Source Record: Testing - Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/contracts-and-effects/testing/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/language-meta/contracts-and-effects/testing/articles/design-model/content.md`  
**SHA-256:** `beca346a4f2f7d71b9d4f7b6e8ddb405c2beed339131d9fa428af6308bd38668`

<details>
<summary>Migrated source text</summary>

``````markdown
## Vocabulary

| Construct | Role |
| --- | --- |
| **`TestDefinition`** | `test Name { body }` item with optional meta/skip |
| **`TestMetaSection`** | `meta { key = expr; }` inside test body |
| **`TestSkipSection`** | `skip { key = expr; }` conditional skip predicates |
| **`TestMetadataEntry`** | Single `name = expr` entry in meta or skip |

## Test architecture

Tests are **first-class module items**, not attributes on functions. The compiler parses them into dedicated AST nodes.

```mermaid
flowchart LR
    parse[parse test item]
    collect[collect test defs]
    discover[discover in Test projects]
    run[test runner invokes]
    parse --> collect --> discover --> run
```

### Subsystem boundaries

| Subsystem | Responsibility | Key file |
| --- | --- | --- |
| Parser | Parse `test`, `meta`, `skip` | `syntax/items/test_definition.rs` |
| AST | Store test structure | `syntax/items/test_definition.rs` |
| Formatter | Emit test items | `format/items/tests_emit.rs` |
| Tooling | Discover and run tests | `beskid test` CLI |

## Test project kind

Tests should appear in `Test` projects. Placement in `App`/`Lib` projects may warn per manifest policy.

## Meta and skip sections

- `meta { timeout = 30; }` attaches metadata parsed as `TestMetaSection`.
- `skip { condition = expr; }` marks conditional skip predicates.
- Both use `TestMetadataEntry` nodes with `Identifier` name and `Expression` value.
``````

</details>

### Source Record: Testing - Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/contracts-and-effects/testing/articles/examples/`  
**Source:** `site/spec-content/platform-spec/language-meta/contracts-and-effects/testing/articles/examples/content.md`  
**SHA-256:** `b9855bc176c02498061e232d0c86bc44064f7ea09dede4c513be093b24fcfd1b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Basic test

```beskid
test AdditionWorks {
    let result = 2 + 2;
    Assert.Equal(4, result);
}
```

## Test with metadata

```beskid
test SlowDatabaseQuery {
    meta { timeout = 30; }
    let rows = Database.Query("SELECT * FROM users");
    Assert.GreaterThan(0, rows.Length);
}
```

## Conditional skip

```beskid
test WindowsOnlyFeature {
    skip { platform = "windows"; }
    let handle = WinApi.CreateWindow();
    Assert.NotNull(handle);
}
```

## Multiple tests in one file

```beskid
test EmptyArray {
    let arr = i32[] {};
    Assert.Equal(0, arr.Length);
}

test ArrayAppend {
    let arr = i32[] { 1, 2 };
    // arr.Append(3);
    // Assert.Equal(3, arr.Length);
}
```
``````

</details>

### Source Record: Testing - FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/contracts-and-effects/testing/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/language-meta/contracts-and-effects/testing/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `0859aa4e3f442e961b578e93590803d50c6e24631f5a6319e3640f0dfbba0714`

<details>
<summary>Migrated source text</summary>

``````markdown
## Locked decisions

| Decision | ID | Summary |
| --- | --- | --- |
| First-class `test` item | D-LM-TST-001 | Tests are module items |
| Meta/skip blocks | D-LM-TST-002 | Structured sections replace comments |
| Test project kind | D-LM-TST-003 | Discovery scopes to `Test` projects |
| Corelib helpers additive | D-LM-TST-004 | Corelib does not redefine `test` syntax |

## FAQ

### Can I put tests in a Lib project?

It may warn depending on manifest policy. Use a `Test` project for dedicated test code.

### What assertion library should I use?

Corelib provides assertion helpers. The language-level `test` syntax is independent of any specific assertion library.

### How do I skip a test conditionally?

Use the `skip` section with a predicate expression:
```beskid
test WindowsOnly {
    skip { platform = "windows"; }
    // ...
}
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Test not discovered | Project kind is not `Test` |
| **E1508–E1510** | Invalid attribute on test item |
| Skip not working | Predicate expression evaluation failure |
``````

</details>

### Source Record: Testing - Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/contracts-and-effects/testing/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/language-meta/contracts-and-effects/testing/articles/flow-and-algorithm/content.md`  
**SHA-256:** `89849d3226d16c2fb739e45db51996baead77f9afc5ba7806818fb6036193351`

<details>
<summary>Migrated source text</summary>

``````markdown
## Compile pipeline placement

```mermaid
flowchart LR
    parse[parse]
    collect[collect test items]
    semantic[semantic analysis]
    discover[discover tests]
    run[run tests]
    parse --> collect --> semantic --> discover --> run
```

## Test parsing algorithm (normative)

1. **Parse test item** — `test Name { body }` becomes `TestDefinition` with `name`, `meta`, `skip`, and `statements`.
2. **Parse meta section** — `meta { timeout = 30; }` becomes `TestMetaSection` with `TestMetadataEntry` items.
3. **Parse skip section** — `skip { condition = expr; }` becomes `TestSkipSection` with `TestMetadataEntry` items.
4. **Parse body statements** — Remaining items in the test body are parsed as `Statement` nodes with optional leading docs.
5. **Collect definitions** — `TestDefinition` nodes are collected alongside other items in the module.

## Discovery algorithm

1. **Filter by project kind** — `beskid test` scopes discovery to `Test` projects unless manifest policy allows otherwise.
2. **Walk module items** — Collect all `TestDefinition` nodes from parsed programs.
3. **Evaluate skip predicates** — For each test with a `skip` section, evaluate the predicate expression. If true, skip the test.
4. **Invoke in isolation** — The test runner invokes each discovered test entrypoint in isolation unless `meta` specifies shared fixtures (future).

## Execution model

- Failed assertions report as test failures without undefined behavior.
- Skipped tests do not count as failures when skip predicates evaluate true.
- Corelib testing helpers extend but do not redefine language-level `test` syntax.
``````

</details>

### Source Record: Testing - Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/contracts-and-effects/testing/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/language-meta/contracts-and-effects/testing/articles/verification-and-traceability/content.md`  
**SHA-256:** `cc9935b46fc829fb13d650e40027db05703a02743afdd552ae0712c82050bc76`

<details>
<summary>Migrated source text</summary>

``````markdown
## Verification matrix

| Scenario | Expected evidence |
| --- | --- |
| `test` item parsing | AST round-trip preserves structure |
| `meta` section | Parsed as `TestMetaSection` |
| `skip` section | Parsed as `TestSkipSection` |
| Test discovery | `beskid test` finds all tests in Test project |
| Skip predicate true | Test skipped; not counted as failure |

## Implementation checklist

- [x] Grammar: `test`, `meta`, `skip`
- [x] AST: `TestDefinition`, `TestMetaSection`, `TestSkipSection`, `TestMetadataEntry`
- [x] Parser: `beskid.pest` productions for test items
- [x] Formatter: `tests_emit.rs` for pretty-printing tests
- [x] Diagnostics: **E1508–E1510** for attribute issues
- [ ] Test runner integration with `beskid test`
- [ ] Skip predicate evaluation at runtime
- [ ] Timeout enforcement from `meta`

## Test locations

- `compiler/crates/beskid_analysis/src/syntax/items/test_definition.rs` — parser tests
- `compiler/crates/beskid_analysis/src/format/items/tests_emit.rs` — formatter tests
- `compiler/crates/beskid_tests` — integration tests for test syntax
``````

</details>
