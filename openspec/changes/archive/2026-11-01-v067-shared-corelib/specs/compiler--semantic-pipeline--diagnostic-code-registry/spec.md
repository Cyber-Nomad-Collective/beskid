## ADDED Requirements

### Requirement: Corelib seal and retired lock codes
The code **E3032** SHALL identify a Corelib bundle whose content does not match its fingerprint. The code **E3024** SHALL identify a retired lock file that needs an explicit migration.

#### Scenario: Codes are stable
- **GIVEN** the registry page
- **WHEN** a tool looks up E3024 and E3032
- **THEN** each code has the meaning listed in this requirement
