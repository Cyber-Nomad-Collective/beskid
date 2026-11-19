## MODIFIED Requirements

### Requirement: Scheduler and stack defaults: Decision [D-CORE-CONC-0008]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Setting | Default |
> | --- | --- |
> | `ProcessorCount` | `1`: the scheduler belongs to an isolate and runs one mutator, and `ProcessorCount()` counts the mutators of the calling isolate. `HostProcessorCount()` reports the logical processors of the host. `SetProcessorCount` does nothing |
> | Stacks | 64 KiB initial, 8 MiB max |
> | Arena | Phase A: **one process arena**; pool threads run Beskid mutator code under scheduler rules |

**Stable ID:** `BSP-REQ-765789E63BF5`  
**Legacy source:** `site/spec-content/platform-spec/core-library/concurrency/concurrency-package/adr/0008-scheduler-defaults/content.md`  
**Source SHA-256:** `86c47eab05ec76895b7cc0bae9b2e31fd39b5fe444369dc7dff190f92bca685c`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied
