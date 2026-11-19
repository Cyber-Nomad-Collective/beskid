# Design: test naming and failure reporting (0.6.7)

## Naming

Tickets 11 rules that a test name is a name like any other. The case profile table gains `test` in the PascalCase group. The code W1637 keeps its number and changes its meaning. The wrong-case doc comment in `Testing.Assert` is fixed in the same slice.

## Failure reporting

The runner distinguishes two outcomes. An assertion failure is raised by `Testing.Assert` through a result path, not a trap. It carries the expected value, the actual value and the call-site span. A trap is any other abnormal end of the test body. The runner prints the first as `assertion failed: expected 3, found 4` under the test name. It prints the second as `test crashed: <reason>`. The editor shows an assertion failure as an error on the assertion line.
