## ADDED Requirements

### Requirement: Target CPU baseline
The compiler SHALL build every Cranelift target ISA from one baseline for each target. AOT object emission, the JIT and the compiler tests SHALL use the same baseline for a target. For `x86_64-unknown-linux-gnu` and `x86_64-pc-windows-msvc` the baseline SHALL be the x86-64-v2 microarchitecture level of the x86-64 psABI: SSE3, SSSE3, SSE4.1, SSE4.2, POPCNT, CMPXCHG16B and LAHF-SAHF. For `aarch64-apple-darwin` the baseline SHALL be Armv8.0-A with no optional extension. The compiler SHALL NOT enable a CPU feature above the baseline, also when the host CPU has the feature. A program built for an x86_64 target SHALL require a CPU with x86-64-v2.

#### Scenario: Cross build uses the baseline
- **GIVEN** a host with an x86-64-v4 CPU
- **WHEN** the user builds a program for `x86_64-unknown-linux-gnu`
- **THEN** the object uses no instruction above x86-64-v2

#### Scenario: JIT and AOT agree
- **GIVEN** one program
- **WHEN** the JIT and an AOT build for the host target compile it
- **THEN** both use the same target baseline

### Requirement: JIT host CPU check
Before the JIT generates code, it SHALL check that the host CPU has every feature of the host target baseline. If a feature is missing, the JIT SHALL stop with an error that names the baseline and each missing feature, and SHALL NOT run code.

#### Scenario: Old CPU
- **GIVEN** an x86_64 host without SSE4.2
- **WHEN** the user runs a program with the JIT
- **THEN** the run stops with an error that names x86-64-v2 and SSE4.2

### Requirement: No Cranelift runtime helpers
Generated machine code SHALL NOT call a Cranelift runtime helper (a symbol whose name starts with `__cranelift_`), because no runtime kit defines one. If the compilation of a function produces such a call, the AOT build SHALL stop with code **E4004** before the link step. The message SHALL name the function, the helper symbol and the target. The JIT SHALL stop with the same message before it runs code.

#### Scenario: Vector shuffle on x86_64
- **GIVEN** a program that uses the Corelib AES or ChaCha20 code
- **WHEN** the user builds it for `x86_64-unknown-linux-gnu`
- **THEN** the object has no undefined `__cranelift_` symbol, and the program links and runs

#### Scenario: Helper call is a compile error
- **GIVEN** a function whose compiled code calls `__cranelift_x86_pshufb`
- **WHEN** the AOT build compiles it
- **THEN** the build stops with E4004 that names the function and `__cranelift_x86_pshufb`, and the link step does not start
