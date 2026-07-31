## Question

Debug and fix the JIT SIGILL abort and the codegen/JIT hang blocking the corelib test suite.

**2026-07-31 update:** SIGILL is resolved (runtime kit staging fixed ABI-v5 kit symbol resolution). New P0: ~80% of targets hang indefinitely during codegen/JIT phase. Two targets pass: SyscallWrite (3/3), SyscallApi (2/2).

## Investigation
