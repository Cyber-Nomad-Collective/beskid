## ADDED Requirements

### Requirement: ConsoleHost base host
Corelib SHALL provide `Console.Hosting.ConsoleHost`, a host that an application host can inherit with `host App() : ConsoleHost`. It SHALL register one global `single` service of type `CommandLine`. `ConsoleHost` SHALL NOT run a loop: after the `startup` hooks, the program SHALL continue after `launch`. The application SHALL import `Console.Hosting` so that the unit is part of the assembly.

#### Scenario: Inherit the console host
- **GIVEN** `use Console.Hosting;` and `host App() : ConsoleHost { }`
- **WHEN** a service declares `inject CommandLine commandLine;`
- **THEN** the container supplies the `CommandLine` of the process

### Requirement: CommandLine service
`CommandLine` SHALL provide `All()` (all arguments), `Arguments()` (the arguments after the program name), `Count()` and `Exit(i32)`. `Exit` SHALL end the process with the given code after the dispose hooks have run.

#### Scenario: Count the arguments
- **GIVEN** the program started as `app one two`
- **WHEN** `commandLine.Count()` is called
- **THEN** the result equals the number of arguments of `All()`
