## REMOVED Requirements

### Requirement: Extern allow/deny enforcement for imported libraries
**Reason**: The environment variables `BESKID_EXTERN_ALLOW` and `BESKID_EXTERN_DENY` were implemented only inside the engine feature `extern_dlopen`, which is removed. No link driver or run driver ever read them, so the requirement described no behavior.
**Migration**: None. No users exist.

## ADDED Requirements

### Requirement: Imported libraries are checked at link time
`beskid import lib` SHALL only write link metadata into the manifest; it SHALL NOT load the library. A library that the command records in `project.link` SHALL be the only library that satisfies a required extern of that name at AOT link time. A required extern whose library is not recorded SHALL fail with **E4050** before linking. The command SHALL fail with a structured error for an unknown provider or an unknown logical name, and SHALL NOT change the manifest in that case.

#### Scenario: Unknown logical name
- **GIVEN** a logical library name that the selected provider does not know
- **WHEN** the user runs `beskid import lib <logical>`
- **THEN** the command fails with a structured error and the manifest is unchanged

#### Scenario: Library not imported
- **GIVEN** a required extern whose library is not in `project.link`
- **WHEN** the project is built with AOT
- **THEN** the build fails with **E4050**
