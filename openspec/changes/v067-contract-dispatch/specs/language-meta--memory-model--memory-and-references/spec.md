## ADDED Requirements

### Requirement: Contract values at an isolate crossing
A contract value SHALL be of Moved class. The crossing rules of the requirement "Move applies at isolate crossings" SHALL apply to a contract value that crosses, and they SHALL apply to the value it holds. A held value of Shared class SHALL stay shared across the crossing.

#### Scenario: Send a contract value
- **GIVEN** `out.Send(move shape)` where `shape` is a contract value that is a unique local
- **WHEN** the code is checked
- **THEN** no diagnostic is reported and a read of `shape` after the send is **E1234**
