## 1. Spec
- [x] 1.1 Library output item selection (SDK callbacks and `Core.Args`).
- [x] 1.2 Default event capacity and the bare raise.

## 2. Implementation
- [x] 2.1 Library emission leaves out items that need a native Mod or an executable (compiler `v067/prooffix`).
- [x] 2.2 Default event capacity 16 in the event layout fact; the legality gate accepts the bare raise.
- [x] 2.3 Corelib gate builds every Corelib package standalone (root `v067/root`).

## 3. Tests
- [x] 3.1 `beskid_cli` `corelib_package_builds`, `library_target`.
- [x] 3.2 `beskid_codegen` `isle_adapter::events`, `beskid_e2e_tests` `event_without_capacity_raised_by_bare_name_reaches_its_handler`.
