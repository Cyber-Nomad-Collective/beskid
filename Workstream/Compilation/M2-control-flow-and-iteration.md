# M2: Control flow and iteration

Goals
- Implement for-in lowering (iterator Next() -> Option<T>) with range fast-path

Tasks
- Type analysis: mark call sites with CallLoweringKind for iterator vs range
- Codegen: loop lowering to Next() calls and termination on None
- Range fast-path numeric loop; parity with while/if blocks and break/continue

Exit criteria
- Examples with for-in and range compile and run, incl. break/continue

