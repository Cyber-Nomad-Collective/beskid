## ADDED Requirements

### Requirement: Contract values at an isolate crossing
A contract type SHALL have the transfer class Moved. A contract value SHALL be a managed record that holds the implementing value and the implementation table. The crossing rules of the requirement "Move applies at isolate crossings" SHALL apply to a contract value that crosses, and they SHALL apply to the value it holds. On a crossing the record SHALL be copied into the destination heap with the graph it holds. An immutable Shared implementing object SHALL be shared by reference, and the implementation table SHALL be static data that is valid in every isolate. Hence `Port<C>` SHALL be well typed for every contract `C`.

#### Scenario: Send a contract value
- **GIVEN** `out.Send(move shape)` where `shape` is a contract value that is a unique local
- **WHEN** the code is checked
- **THEN** no diagnostic is reported and a read of `shape` after the send is **E1234**
