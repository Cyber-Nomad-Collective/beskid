## Why

Test names use snake_case, but every other name in Beskid uses PascalCase or lowerCamelCase. A failed assertion also surfaces as a runtime trap, so the report does not show the expected and actual value. Evidence: wayfinder tickets 10 and 11 of the 0.6.7 map.

## What Changes

- Test names use PascalCase. W1637 reports a test name that is not PascalCase. Corelib and fixture tests are renamed in the same release.
- A failed assertion is a test failure that reports the expected and actual value at the `Assert` call site. A runtime trap during a test is reported separately as "test crashed".

## Capabilities

### Modified Capabilities
- `language-meta--program-structure--code-style-and-naming`, `language-meta--contracts-and-effects--testing`, `compiler--semantic-pipeline--diagnostic-code-registry`.

## Impact

Naming style check, test runner, `Testing.Assert`, Corelib and fixture tests. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Snake_case test names produce W1637 after this change. There is no compatibility path.
