## ADDED Requirements

### Requirement: Canonical negotiated project operations
Editor project commands SHALL negotiate canonical CLI capabilities and invoke canonical routes with explicit project context. Unsupported CLI capabilities SHALL produce upgrade guidance without fallback to retired commands. Dependency operations SHALL use the shared transaction/resolver authority; changing focused project SHALL retain existing configuration-without-restart behavior.

#### Scenario: CLI06-05 Focused dependency mutation
- **GIVEN** a focused workspace member and compatible CLI
- **WHEN** editor adds a dependency
- **THEN** it targets that member using canonical add and shared transaction

#### Scenario: CLI06-05 Incompatible tool
- **GIVEN** CLI lacks required canonical command
- **WHEN** editor attempts project operation
- **THEN** it reports upgrade guidance without invoking an old spelling

