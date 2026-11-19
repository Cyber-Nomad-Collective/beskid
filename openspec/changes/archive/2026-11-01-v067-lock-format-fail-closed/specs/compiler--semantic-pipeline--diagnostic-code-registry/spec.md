## MODIFIED Requirements

### Requirement: Corelib seal and retired lock codes
The code **E3032** SHALL identify a Corelib bundle whose content does not match its fingerprint. The code **E3025** SHALL identify a `Project.lock` file whose first line is not `# Project.lock v3`. The message of **E3025** SHALL name the lock file and SHALL tell the user to delete the file and run `beskid dev project lock` to write a new one. The code **E3024** is retired: the compiler SHALL NOT emit it, and the registry SHALL NOT give it a new meaning.

#### Scenario: Codes are stable
- **GIVEN** the registry page
- **WHEN** a tool looks up E3025 and E3032
- **THEN** each code has the meaning listed in this requirement

#### Scenario: Retired code
- **GIVEN** the registry
- **WHEN** a tool looks up E3024
- **THEN** the registry has no entry for it
