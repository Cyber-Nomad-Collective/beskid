## ADDED Requirements

### Requirement: Unused private items
The compiler SHALL report an unused private item with the warning **W2101**. The code W1504 SHALL NOT be used.

#### Scenario: Unused private item
- **GIVEN** a private function that no item uses
- **WHEN** the module is analyzed
- **THEN** the compiler SHALL report **W2101**
