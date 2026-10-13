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


### Requirement: Transitive registry closure with one version per package
Resolution SHALL include every registry package reachable from the declared dependencies. After it selects a registry package, it SHALL read the dependencies that the verified artifact manifest declares and SHALL resolve each registry dependency with the same pin, cache, selection and workspace override rules as a declared dependency. A registry dependency of a published package SHALL use the registry rules of the consuming workspace; an unknown alias SHALL fail. Each package name SHALL have exactly one coordinate in the resolved graph: all requests for one name SHALL name the same registry and the same requested version text. Different requests SHALL fail without lock, manifest or materialization change, and the diagnostic SHALL name both requesters and both requested coordinates and SHALL recommend a workspace override. Resolution SHALL NOT select two versions of one package and SHALL NOT perform range solving. A requirement cycle among registry packages SHALL fail with a diagnostic that names the cycle. A published package SHALL declare only registry dependencies, except the implicit Corelib `Core` dependency without a path; a path or Git dependency in a downloaded manifest SHALL fail with the package coordinate and dependency name. The lock SHALL record every reachable registry package with its exact version and artifact digest. Ordinary, locked, offline and frozen resolution SHALL replay the transitive pins and verified cached artifacts without a network request when the lock and cache cover the closure. A reachable package without a pin SHALL fail locked and offline resolution with update guidance, and a pin that is not reachable SHALL make the lock stale. A mutation SHALL select a new coordinate for a transitive package only when the package has no pin or its pin no longer matches the request, and SHALL keep every other valid pin.

#### Scenario: DEP06-03 Shared transitive survives removal
- **GIVEN** direct packages Alpha and Beta that both require Shared 1.0.0, and Alpha also requires OnlyAlpha
- **WHEN** the user removes Alpha
- **THEN** the lock keeps Beta and the byte-identical Shared pin and drops Alpha and OnlyAlpha

#### Scenario: DEP06-03 Conflicting transitive requests
- **GIVEN** Alpha 1.0.0 requires Shared 1.0.0 and Beta 1.0.0 requires Shared 2.0.0
- **WHEN** add or update resolves both
- **THEN** it fails, names `Alpha@1.0.0` with `Shared@1.0.0` and `Beta@1.0.0` with `Shared@2.0.0`, and changes no project byte

#### Scenario: DEP06-04 Frozen replay of the closure
- **GIVEN** a lock and a warm verified cache that cover Alpha and its transitive packages
- **WHEN** frozen, offline, locked or ordinary preparation runs
- **THEN** it materializes every locked package with zero registry requests and no lock write
