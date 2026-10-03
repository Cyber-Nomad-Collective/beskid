## ADDED Requirements

### Requirement: Linux package derivative provenance
A Linux package derivative SHALL bind one immutable native release identity (version, native superrepository commit, compiler commit, Linux target, bundle name and SHA-256, and SHA-256 values for `release-state.json` and `validated-evidence.json`) to one separately named distribution recipe commit and one regular-file DEB artifact and SHA-256. It SHALL retain machine-verifiable fresh-environment qualification evidence for an expected old-package RED and corrected-package GREEN. The GREEN SHALL prove `apt-get --no-install-recommends` installs `clang`, `cc`, `ar`, and `ranlib`; libc-header C compilation, linking, and execution; and `/usr/bin/beskid analyze`, `build --locked`, and `run --locked` against an explicit `Smoke.bproj`, with the lockfile unchanged.

The native release record is immutable. A correction SHALL be represented only by a uniquely named append-only public JSON record and the absent DEB asset. It SHALL NOT alter native state, native evidence, native assets, rolling tags, or claim Windows or macOS qualification. It SHALL NOT synthesize or accept `package-result.json` as evidence for this lane.

Publication SHALL preflight the immutable `cli-v<version>` tag and permit only the DEB and correction-record names declared by the finite correction intent. An existing asset with unequal bytes or an existing correction record with unequal bytes is a hard error before any write; exact existing bytes are an idempotent success. A partial attempt with only the exact DEB present SHALL revalidate it and upload only the missing record.

**Stable ID:** `BSP-REQ-LINUX-PACKAGE-DERIVATIVE-PROVENANCE`

#### Scenario: Accepted focused recipe produces the exact correction record
- **GIVEN** an immutable native aggregate, a clean detached distribution checkout at the reviewed recipe commit, a regular-file DEB, and complete RED/GREEN evidence matching a finite correction intent
- **WHEN** the derivative verifier creates its output
- **THEN** it writes only the exact append-only correction record and its required publication inputs, without changing native release records or producing `package-result.json`

#### Scenario: Drift and unsafe inputs are rejected
- **GIVEN** native source, compiler, bundle, state, evidence, recipe, DEB, or qualification evidence differs from the finite intent, or any consumed file is a symlink
- **WHEN** qualification is attempted
- **THEN** it fails before correction output or publication

#### Scenario: Immutable publication resumes only a verified partial attempt
- **GIVEN** `cli-v<version>` exists and the exact DEB is present but the correction record is absent
- **WHEN** the external publisher reruns with the same verified local inputs
- **THEN** it uploads only the missing record and does not create, edit, replace, or retag a release
