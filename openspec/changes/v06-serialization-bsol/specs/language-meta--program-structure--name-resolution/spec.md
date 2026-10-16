## ADDED Requirements

### Requirement: Local nominal type precedence over imported types
For an unqualified nominal type reference, a unique matching declaration in the current source unit SHALL take precedence over public types introduced by module imports. Qualified references SHALL retain the identity of the explicitly selected module. When no matching local declaration exists, multiple distinct matching imported declarations SHALL remain ambiguous; resolution SHALL NOT choose an arbitrary import. Generation-bound semantic legality and layout queries SHALL use the same precedence.

#### Scenario: Local policy type shares an imported name
- **GIVEN** Schema declares `PatternLimits` and imports Bounded, which exports a distinct `PatternLimits`
- **WHEN** a Schema function parameter names unqualified `PatternLimits`
- **THEN** it resolves to Schema's declaration
- **AND** `Bounded.PatternLimits` resolves to Bounded's declaration

#### Scenario: Conflicting imports have no local declaration
- **GIVEN** two imported modules export distinct types with the same name and the current unit has no matching declaration
- **WHEN** an unqualified type reference uses that name
- **THEN** resolution rejects the ambiguity rather than selecting either imported declaration
