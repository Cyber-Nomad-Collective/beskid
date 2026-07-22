# Parser Specification

## Purpose

Define the parser as a first-class Compiler Front End feature with one
normative capability and separately catalogued informative documents.

## Requirements

### Requirement: Parser feature authority is explicit

The parser feature SHALL keep its normative obligations in this canonical
feature specification. Articles and decisions associated with the parser MUST
remain informative and MUST NOT redefine parser behavior.

#### Scenario: A parser article explains grammar behavior

- **GIVEN** an article under the parser feature discusses grammar behavior
- **WHEN** the article describes a rule
- **THEN** it links to this feature requirement or another canonical OpenSpec
  requirement instead of creating an independent normative rule

### Requirement: Parser documents retain their feature parent

Every catalogued parser article or decision SHALL declare
`compiler--front-end--parser` as its parent capability.

#### Scenario: A parser decision is catalogued

- **GIVEN** a decision record is added under the parser document path
- **WHEN** the OpenSpec catalog is rebuilt
- **THEN** the catalog records the parser feature as its parent capability
