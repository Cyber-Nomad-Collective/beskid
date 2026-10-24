## ADDED Requirements

### Requirement: ConsoleHost base host
Corelib SHALL provide `Console.Hosting.ConsoleHost`, a host that an application host can inherit with `host App() : ConsoleHost`. It SHALL register one global `single` service of type `CommandLine`. `ConsoleHost` SHALL NOT run a loop: after the `startup` hooks, the program SHALL continue after `launch`. The application SHALL import `Console.Hosting` so that the unit is part of the assembly.

#### Scenario: Inherit the console host
- **GIVEN** `use Console.Hosting;` and `host App() : ConsoleHost { }`
- **WHEN** a service declares `inject CommandLine commandLine;`
- **THEN** the container supplies the `CommandLine` of the process

### Requirement: CommandLine service
`CommandLine` SHALL provide `All()` (all arguments, the program name first), `Arguments()` (the arguments after the program name), `Count()` (the number of arguments after the program name, 0 when there are none) and `Exit(i32)`. `Exit` SHALL end the program through the host. It SHALL run the `dispose` hooks of every active scope, innermost first, then the global `dispose` hooks, and then SHALL exit with the given code as exit status. It SHALL run the `dispose` hooks of a scope only for an activation whose `init` completed, and the global `dispose` hooks once the container is active. A `dispose` hook that calls `Exit` SHALL NOT run again. `Process.Exit` SHALL stay the immediate exit that runs no hooks.

#### Scenario: Count the arguments
- **GIVEN** the program started as `app one two`
- **WHEN** `commandLine.Count()` is called
- **THEN** the result is 2, and `All()` has three entries with the program name first

#### Scenario: Exit runs dispose hooks
- **GIVEN** a host with a global `dispose` hook and a scope `dispose` hook, and `commandLine.Exit(3)` called inside the scope
- **WHEN** `Exit` runs
- **THEN** the scope `dispose` runs, then the global `dispose`, and the process exits with code 3

#### Scenario: Process.Exit runs no hooks
- **GIVEN** the same host and `Process.Exit(3)` called inside the scope
- **WHEN** `Process.Exit` runs
- **THEN** no `dispose` hook runs and the process exits with code 3
