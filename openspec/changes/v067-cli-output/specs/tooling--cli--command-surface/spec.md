## ADDED Requirements

### Requirement: Output levels and progress
By default a command SHALL write warnings and errors and SHALL NOT write information messages. The option `-v` SHALL add information messages. The option `-q` SHALL limit the output to errors and the final results of the command. The option `--plain` SHALL remove colour and animation and SHALL NOT change which messages appear. A command SHALL show progress only when standard error is a TTY, and only for a step that lasts more than about one second. A command SHALL write log messages to standard error, or to the file named by `--log-file` or by the environment variable `BESKID_LOG`. A command SHALL NOT write log messages to standard output.

#### Scenario: Default level
- **GIVEN** a build that emits information messages and one warning
- **WHEN** the user runs `beskid build`
- **THEN** the output shows the warning and no information message

#### Scenario: Plain keeps the level
- **GIVEN** the same build
- **WHEN** the user runs `beskid build --plain`
- **THEN** the output shows the same messages as without `--plain`, without colour or animation

#### Scenario: Quiet
- **GIVEN** a build that emits a warning and ends with success
- **WHEN** the user runs `beskid build -q`
- **THEN** the output shows the final result and no warning

#### Scenario: No progress when redirected
- **GIVEN** standard error is a file
- **WHEN** a step lasts several seconds
- **THEN** no progress output is written

### Requirement: Closed output pipe
When the reader of standard output or standard error closes the pipe (EPIPE), the command SHALL stop writing and SHALL end without an error message and without an abnormal signal exit.

#### Scenario: Pipe to head
- **GIVEN** a command with long output
- **WHEN** the user runs `beskid tree | head -n 1`
- **THEN** the command ends without a signal and prints no error
