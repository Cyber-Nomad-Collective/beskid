## ADDED Requirements

### Requirement: Contract values at an isolate crossing
The transfer class of a contract type SHALL come from the transfer marker contracts that it embeds, transitively. A contract that embeds no marker SHALL have class Never. A contract that embeds only `Copied`, optionally with `Transferable`, SHALL have class Copied. A contract that embeds any other marker SHALL have class Moved. Every implementing type SHALL satisfy every embedded marker; a conversion of a value whose type does not satisfy them SHALL be **E1206**. Markers SHALL have no implementation tables. A contract value SHALL be a managed record that holds the implementing value and the implementation table. `Port<C>` SHALL be well typed exactly when `C` embeds a marker; otherwise it SHALL be **E1610**. The crossing rules of the requirement "Move applies at isolate crossings" SHALL apply to a contract value that crosses and to the value it holds. On a crossing the record SHALL be copied into the destination heap with the graph it holds. An immutable Shared implementing object SHALL be shared by reference, and the implementation table SHALL be static data that is valid in every isolate. Contract values SHALL require a 64-bit target; on a target with a narrower pointer, narrowing or widening a scalar receiver SHALL fail closed.

#### Scenario: Send a marked contract value
- **GIVEN** `contract Scored : Transferable { i64 Score(); }` with `[Isolated]` implementations and `out.Send(move scored)` where `scored` is a unique local
- **WHEN** the code is checked
- **THEN** no diagnostic is reported and a read of `scored` after the send is **E1234**

#### Scenario: Port of an unmarked contract
- **GIVEN** `contract Greeter { string Greet(); }` and `Port<Greeter> p`
- **WHEN** the code is checked
- **THEN** the compiler SHALL report **E1610**
