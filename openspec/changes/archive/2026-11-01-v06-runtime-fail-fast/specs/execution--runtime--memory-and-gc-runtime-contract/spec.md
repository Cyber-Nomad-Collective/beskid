## ADDED Requirements

### Requirement: Fail fast on a dead managed operand
A runtime service that receives a non-null managed reference SHALL check that the reference resolves to a live managed object on the current heap before it uses the operand. When the reference does not resolve to a live managed object (a freed object, or an address that the heap did not allocate), the service SHALL call the runtime trap with code 6 (`invalid_or_stale_handle`) and a message of the form `<service>: managed operand is not live (use after collection)`; a service that takes a string operand SHALL write `managed string operand` in place of `managed operand`. The service SHALL NOT return a substitute value for that operand: not null, not an empty string, not zero, and not a failure status. The trap host SHALL print `beskid runtime trap v5: invalid_or_stale_handle (6): <message>` and exit with status 101.

The rule SHALL apply at minimum to `str_len`, `str_eq`, `str_cmp`, `str_concat`, `str_slice`, the adoption of a read text into the caller's string record by `beskid_rt_v5_fs_read_text`, `gc_root_handle`, `beskid_rt_v5_gc_try_root_handle`, and `beskid_rt_v5_abi_value_initialize`. A null reference is not a dead operand, and each service SHALL keep its documented null behavior. A handle admission that fails because a checked scope recorded a failure, or because the handle stack cannot grow inside a checked scope, SHALL remain a recorded checked failure. The check SHALL NOT allocate and SHALL NOT start a collection, so a service that cannot reach a collection stays one that cannot reach a collection. A live managed string, which includes every string literal and every `Core.Args` value, SHALL pass the check.

#### Scenario: Concatenation with a collected string operand traps
- **GIVEN** a string that `str_new` allocated and that nothing roots, and a collection that freed it
- **WHEN** `str_concat` receives it as an operand
- **THEN** the process exits with status 101, was not terminated by a signal, its standard error contains `invalid_or_stale_handle (6): str_concat: managed string operand is not live (use after collection)`, and `str_concat` did not return

#### Scenario: Reading services trap and do not read freed memory
- **GIVEN** a collected string as in the previous scenario
- **WHEN** `str_len`, `str_eq`, `str_cmp` or `str_slice` receives it
- **THEN** the process exits with status 101 and the diagnostic names that service

#### Scenario: Root handle of a freed object traps
- **GIVEN** a managed object that a collection freed
- **WHEN** `gc_root_handle` or `beskid_rt_v5_gc_try_root_handle` receives it
- **THEN** the process exits with status 101 with a diagnostic that names the service, and the service does not return 0

#### Scenario: Boxing a freed payload traps
- **GIVEN** a vacant value slot and a managed payload that a collection freed
- **WHEN** `beskid_rt_v5_abi_value_initialize` receives the payload
- **THEN** the process exits with status 101 with a diagnostic that names `abi_value_initialize`, and the call does not return false

#### Scenario: Live operands keep working
- **GIVEN** strings that a root handle keeps live across a collection
- **WHEN** `str_concat`, `str_slice`, `str_len`, `str_eq` and `str_cmp` receive them
- **THEN** each service returns its ordinary result and the process does not trap
