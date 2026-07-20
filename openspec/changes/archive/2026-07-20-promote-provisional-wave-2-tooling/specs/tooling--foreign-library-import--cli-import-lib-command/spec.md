## ADDED Requirements

### Requirement: Import lib command responsibilities
`beskid import lib <logical> [options]` (or an implementation alias such as `beskid link import`) MUST accept a logical library string matching or intended for `Extern` `Library` fields, select an `ExternalLibrary` provider for the current host (default `c-posix` on tier-1), emit or update `project.link` manifest entries, and print resolved linker args and search paths without requiring authors to hand-edit `-l` flags.

#### Scenario: Resolve and merge link entry
- **GIVEN** a project with a writable `Project.proj` and a known logical library name for the `c-posix` provider
- **WHEN** the user runs `beskid import lib <logical>` against that project
- **THEN** the command updates `project.link` entries and prints resolved linker args and search paths

### Requirement: Import lib options minimum
The command SHALL support `--provider <id>` to choose an `ExternalLibrary` implementation, `--dry-run` to show resolution without writing the manifest, and `--project <path>` to target a `Project.proj` (default: cwd discovery).

#### Scenario: Dry-run does not write manifest
- **GIVEN** a project whose `Project.proj` link section is unchanged on disk
- **WHEN** the user runs `beskid import lib <logical> --dry-run`
- **THEN** resolution output is printed and the manifest file is not modified

### Requirement: Extern allow/deny enforcement for imported libraries
Imported libraries MUST be subject to `BESKID_EXTERN_ALLOW` / `BESKID_EXTERN_DENY` at link/run drivers when those variables are set.

#### Scenario: Denied library blocked at link driver
- **GIVEN** `BESKID_EXTERN_DENY` includes a logical library previously imported into `project.link`
- **WHEN** a link or run driver evaluates extern libraries
- **THEN** that library is rejected according to the deny list

## REMOVED Requirements

### Requirement: beskid import lib command conformance status
**Reason**: Replaced by explicit behavioral requirements extracted from migrated source.
**Migration**: Cite the ADDED requirements above.
