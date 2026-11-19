## ADDED Requirements

### Requirement: Check all workspace members
`beskid check --project <workspace-or-directory> --all-members` SHALL check every member and every target in one process. The members SHALL share the Corelib and the memoized units. Failures SHALL be aggregated and reported as "N of M workspace members failed". The option SHALL be rejected together with an input file, `--target` or `--workspace-member`.

#### Scenario: One failing member
- **GIVEN** a workspace of six members of which one has an error
- **WHEN** the user runs `beskid check --project ws.bws --all-members`
- **THEN** all members are checked and the command reports "1 of 6 workspace members failed"
