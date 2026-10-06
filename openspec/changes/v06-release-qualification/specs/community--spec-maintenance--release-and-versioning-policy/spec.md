## ADDED Requirements

### Requirement: Bounded source-coherent release loop
The beskid 0.6.0 release program SHALL reconcile published source, accepted main and recoverable drafts once before assigning implementation obligations. It SHALL progress through baseline reconciliation, normative scope freeze, complete implementation, candidate source freeze, native and installed qualification, reviewed manual publication, public readback and delivery closure. Each failed gate SHALL produce a recorded blocker with reproduction evidence, affected requirements, selected researched remedy and the next affected gate. Unchanged successful evidence SHALL be reused only when all declared consumed inputs remain unchanged; a new source identity SHALL still have a coherent complete candidate packet. A human administration dependency SHALL record the exact required action and verification condition rather than repeatedly running an unchanged failing gate. Required scope SHALL NOT be reduced to make the release green.

#### Scenario: A known unchanged failure does not restart the program
- **GIVEN** a failed Windows case has retained evidence and a diagnosed remedy
- **WHEN** no consumed input or relevant external state has changed
- **THEN** the program retains that blocker and does not restart unrelated green phases or claim the case passed

#### Scenario: A blocker remedy changes source
- **GIVEN** a researched fix changes a candidate's runtime or harness
- **WHEN** qualification resumes
- **THEN** affected evidence is regenerated and the aggregate rejects mixed candidate identities

### Requirement: Qualified immutable publication and readback
Stable 0.6.0 publication SHALL occur only after the complete candidate packet passes its required gates and records completed review. The established manual publisher SHALL use an immutable clean source identity and exact reviewed artifact bytes; credential-free build services SHALL NOT acquire publication credentials. Before candidate freeze, the program SHALL record required existing delivery channels and their acceptance conditions. The record SHALL include immutable CLI and LSP releases, complete Linux, Windows and macOS bundles and platform packages, Homebrew, public first-party package and template consumption, and public documentation. Each configured editor marketplace's submission and acceptance state SHALL be recorded independently from downloadable artifact availability. Exact existing remote bytes SHALL be idempotent; unequal bytes or uncertain remote identity SHALL fail closed without overwrite. Public readback SHALL verify immutable tags, downloaded artifact digests and fresh installed-consumer journeys before claiming availability. Waivers from earlier releases SHALL NOT automatically qualify a new candidate.

#### Scenario: A prior installer waiver does not transfer
- **GIVEN** 0.5.2 recorded an exact-artifact installer waiver
- **WHEN** a different 0.6 installer is qualified
- **THEN** the earlier waiver provides no passing evidence for the new installer

#### Scenario: Partial publication is resumed precisely
- **GIVEN** some required remote assets exist with exact reviewed bytes and others are absent
- **WHEN** the publisher resumes with the same qualified intent
- **THEN** it verifies all existing identities and publishes only absent approved assets without replacing or retagging published artifacts

#### Scenario: Downloadability is distinguished from marketplace acceptance
- **GIVEN** an editor extension is downloadable but its marketplace has not accepted the submitted version
- **WHEN** release availability is reported
- **THEN** those states are reported separately and acceptance is not claimed from the download alone

### Requirement: Evidence-backed delivery closure
Release closure SHALL reconcile revisioned OpenSpec requirement links and retained conformance/publication evidence into Tracker SQLite without overwriting independent delivery work. Seeds, task checkmarks, issue titles and unexecuted plans SHALL NOT prove delivery. Every required 0.6 obligation SHALL have verified completed evidence before the release goal or umbrella is closed. Deferred .NET stretch items SHALL remain explicitly separate from required Rust delivery.

#### Scenario: A seed file is not live delivery
- **GIVEN** a 0.6 seed bundle exists but no successful reconciliation or delivery evidence is retained
- **WHEN** closure is audited
- **THEN** Tracker import and delivery remain unproven

#### Scenario: Required work is incomplete
- **GIVEN** one native BSOL or Rust Glue requirement has no passing required-target evidence
- **WHEN** the release umbrella is audited
- **THEN** it remains open with that obligation retained
