## ADDED Requirements

### Requirement: ConsoleHost base host
Corelib SHALL provide `Console.Hosting.ConsoleHost`, a host that an application host can inherit with `host App() : ConsoleHost`. It SHALL register one global `single` service of type `CommandLine`. `ConsoleHost` SHALL NOT run a loop: after the `startup` hooks, the program SHALL continue after `launch`. The application SHALL import `Console.Hosting` so that the unit is part of the assembly.

#### Scenario: Inherit the console host
- **GIVEN** `use Console.Hosting;` and `host App() : ConsoleHost { }`
- **WHEN** a service declares `inject CommandLine commandLine;`
- **THEN** the container supplies the `CommandLine` of the process

### Requirement: CommandLine service
`CommandLine` SHALL provide `All()` (all arguments, the program name first), `Arguments()` (the arguments after the program name), `Count()` (the number of arguments after the program name, 0 when there are none) and `Exit(i32)`. `Exit` SHALL end the program at once with the given code as exit status. It SHALL NOT run `dispose` hooks, because it calls `Process.Exit`.

#### Scenario: Count the arguments
- **GIVEN** the program started as `app one two`
- **WHEN** `commandLine.Count()` is called
- **THEN** the result is 2, and `All()` has three entries with the program name first
