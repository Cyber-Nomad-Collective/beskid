## ADDED Requirements

### Requirement: Strict registry coordinates and stable addition
Requested exact coordinates SHALL resolve only to that non-yanked version; missing/yanked requests, unknown aliases, malformed responses and unavailable required artifacts SHALL fail without substitution or warning-only executable success. Diagnostics SHALL identify package, requested version and registry with credential-free recovery guidance. Bare add SHALL select the greatest non-yanked stable semantic version by semantic-version precedence; stable SHALL have no prerelease component. Equal-precedence build-metadata variants SHALL use lexicographically greatest full version text as deterministic tie-break. Response order SHALL NOT affect selection. Malformed version data SHALL fail; no eligible stable version SHALL produce explicit-version guidance. Selected intent SHALL be exact and SHALL NOT introduce range solving.

#### Scenario: DEP06-02 Exact request
- **GIVEN** requested version absent while another active version exists
- **WHEN** add or required resolution runs
- **THEN** it fails without substitution and mutation preserves original manifest/lock

#### Scenario: DEP06-02 Required unavailable
- **GIVEN** unlocked required package and malformed response or registry 503
- **WHEN** add/build attempts resolution
- **THEN** it fails rather than reporting successful unresolved warning

#### Scenario: DEP06-02 Stable policy
- **GIVEN** stable 1.0.0 and 2.0.0 plus 3.0.0-rc.1 in arbitrary response order
- **WHEN** bare add selects intent
- **THEN** it records exact 2.0.0 independent of response order

