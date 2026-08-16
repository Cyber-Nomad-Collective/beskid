## ADDED Requirements

### Requirement: Descriptive prose conforms to ASD-STE100
All descriptive prose in OpenSpec specs SHALL conform to the ASD-STE100 Simplified Technical English writing rules, Issue 9, January 2025. The descriptive prose SHALL use short sentences, active voice, simple vocabulary, present tense, and proper articles. Each word SHALL have one meaning and one part of speech.

#### Scenario: A spec contains descriptive prose
- **GIVEN** an OpenSpec spec has a `## Purpose` section or an explanatory paragraph
- **WHEN** the spec is authored or edited
- **THEN** the descriptive prose conforms to the ASD-STE100 writing rules

#### Scenario: A spec uses a synonym for an approved word
- **GIVEN** an OpenSpec spec uses a word that has an approved ASD-STE100 alternative
- **WHEN** the spec is authored or edited
- **THEN** the prose uses the approved ASD-STE100 word instead of the synonym

### Requirement: Requirement statements keep the SHALL/MUST form
Requirement statements in OpenSpec specs SHALL use the `SHALL` or `MUST` keyword with a simple sentence structure. The requirement statements are exempt from the ASD-STE100 controlled dictionary. The requirement statements SHALL NOT be rewritten as descriptive prose.

#### Scenario: A requirement statement is authored
- **GIVEN** an OpenSpec spec defines a normative requirement
- **WHEN** the requirement is authored
- **THEN** the requirement statement uses `SHALL` or `MUST` with a simple sentence structure

#### Scenario: A requirement statement is converted to prose
- **GIVEN** an OpenSpec spec has a requirement statement
- **WHEN** the spec is edited for STE compliance
- **THEN** the requirement statement keeps the `SHALL` or `MUST` form and is not rewritten as descriptive prose

### Requirement: Scenario statements keep the GIVEN/WHEN/THEN form
Scenario statements in OpenSpec specs SHALL keep the `GIVEN`/`WHEN`/`THEN` form with optional `AND` bullets. The scenario statements are exempt from the ASD-STE100 controlled dictionary.

#### Scenario: A scenario statement is authored
- **GIVEN** an OpenSpec spec defines a scenario for a requirement
- **WHEN** the scenario is authored
- **THEN** the scenario uses the `GIVEN`/`WHEN`/`THEN` form

#### Scenario: A scenario statement is converted to prose
- **GIVEN** an OpenSpec spec has a scenario statement
- **WHEN** the spec is edited for STE compliance
- **THEN** the scenario keeps the `GIVEN`/`WHEN`/`THEN` form and is not rewritten as descriptive prose

### Requirement: Beskid technical vocabulary is permitted
The ASD-STE100 controlled dictionary SHALL permit Beskid technical nouns and verbs as subject-specific terms. The permitted terms include at minimum: fiber, spawn, lowering, codegen, corelib, runtime, ABI, CLIF, ISLE, pest, salsa, abfall, Cranelift, HIR, AST, LSP, JIT, AOT, GC, and Mod. Additional Beskid-specific terms are permitted when the spec defines them.

#### Scenario: A spec uses a Beskid technical term
- **GIVEN** an OpenSpec spec uses a Beskid technical noun or verb
- **WHEN** the spec is authored or edited
- **THEN** the term is permitted as a subject-specific term under ASD-STE100

#### Scenario: A spec defines a new technical term
- **GIVEN** an OpenSpec spec introduces a new Beskid-specific term
- **WHEN** the spec is authored
- **THEN** the spec defines the term and uses it consistently

### Requirement: Code examples and source provenance are exempt
Code examples, source provenance sections (`## Informative Source Provenance`), migrated source text in `<details>` blocks, and auto-generated sections (`## Decisions`, `## Articles`) SHALL be exempt from the ASD-STE100 writing rules. These sections SHALL NOT be rewritten for STE compliance.

#### Scenario: A code example is present
- **GIVEN** an OpenSpec spec contains a code example
- **WHEN** the spec is edited for STE compliance
- **THEN** the code example keeps its original form

#### Scenario: A source provenance section is present
- **GIVEN** an OpenSpec spec contains an `## Informative Source Provenance` section or a `<details>` block
- **WHEN** the spec is edited for STE compliance
- **THEN** the section keeps its original form and is not rewritten

### Requirement: The STE standard is referenced as ASD-STE100 Issue 9
OpenSpec specs that reference the Simplified Technical English standard SHALL reference it as ASD-STE100, Issue 9, January 2025. The reference SHALL point at `https://asd-ste100.org/`.

#### Scenario: A spec references the STE standard
- **GIVEN** an OpenSpec spec references the Simplified Technical English standard
- **WHEN** the reference is authored
- **THEN** the reference names ASD-STE100, Issue 9, January 2025, and points at `https://asd-ste100.org/`

#### Scenario: A spec references an older STE issue
- **GIVEN** an OpenSpec spec references an older issue of ASD-STE100
- **WHEN** the spec is edited
- **THEN** the reference is updated to Issue 9, January 2025

### Requirement: A validation step checks STE compliance before acceptance
A validation step SHALL check the STE compliance of the descriptive prose before a spec change is accepted. The validation step SHALL run as part of the OpenSpec change validation. The validation step SHALL report the specs that do not conform to the ASD-STE100 writing rules.

#### Scenario: A spec change is submitted for validation
- **GIVEN** an OpenSpec change edits the descriptive prose of a spec
- **WHEN** the change is validated
- **THEN** the validation step checks the STE compliance of the descriptive prose

#### Scenario: A spec change fails the STE compliance check
- **GIVEN** an OpenSpec change contains descriptive prose that does not conform to the ASD-STE100 writing rules
- **WHEN** the validation step runs
- **THEN** the validation step reports the non-conforming specs and the change is not accepted
