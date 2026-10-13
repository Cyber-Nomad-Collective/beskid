## ADDED Requirements

### Requirement: Expanded-AST semantic and legality authority
The frontend MUST compute normalization intent, resolution, typing, control flow, casts, captures, and legality as Salsa facts keyed by `AstNodeKey { unit, generation, node }`; stale or foreign keys MUST return no fact.

#### Scenario: Stale generation lookup
- **GIVEN** a syntax key from a superseded source generation
- **WHEN** any semantic or legality query resolves it
- **THEN** the query returns an explicit stale-generation error and no guessed fact

## REMOVED Requirements

### Requirement: Primary contract for HIR normalization and legality: Decision [D-COMP-FRONT-0009]
**Reason**: HIR is removed as a semantic representation and normalization authority.
**Migration**: Use expanded-AST syntax shape plus generation-safe Salsa semantic and legality facts.
