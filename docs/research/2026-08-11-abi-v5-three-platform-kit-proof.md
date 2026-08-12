# Decisive three-platform ABI-v5 runtime-kit proof

Date: 2026-08-11

Wayfinder question: [Define the decisive three-platform ABI-v5 kit proof](https://linear.app/cybernomad-it/issue/CYB-192/define-the-decisive-three-platform-abi-v5-kit-proof)

Repository baseline: beskid `0733294b3f07269182b38e610bf4646889ce61c1`; compiler `8bbdb593208bfd5e8ecb7df04aba07ddbc50b498`

## Decision

The 0.4 kit proof is one fresh, non-simulated workflow execution for one exact root/compiler revision in which the native Linux x86-64, macOS arm64, and Windows x86-64 jobs all pass. Each runner must atomically build the debug and release kits into a previously empty installed prefix. Each of the resulting six target/profile kits must independently prove both its static and shared artifact, yielding twelve independently audited artifact cells. A result from another revision, another target, the other profile, or the other linkage cannot fill a failed or missing cell.

For every target/profile kit, the native run must retain:

1. exact root and compiler commit SHAs, native runner OS/architecture, tool versions, and the empty prefix path;
2. `abi.json`, the static artifact, the shared artifact, and on Windows the COFF import library;
3. separate raw `static.symbols` and `shared.symbols` reports generated from those exact staged bytes;
4. a machine-readable result recording metadata validation, each artifact hash, the verifier policy and result for each symbol report, and each execution smoke result;
5. the complete installed target subtree as a CI artifact and the unabridged native job log.

Static inspection, hermetic fixtures, cross-target layout tests, simulated symbol lists, locally cached kits, and a green artifact from a different run are implementation evidence only. They cannot close a native cell or the three-platform proof.

## Exact proof matrix

There are six kits and twelve linkage cells:

| Native runner | Target | Profile | Static cell | Shared cell | Extra target artifact |
| --- | --- | --- | --- | --- | --- |
| Linux x86-64 | `x86_64-unknown-linux-gnu` | debug | `static/libbeskid_runtime.a` | `shared/libbeskid_runtime.so` | none |
| Linux x86-64 | `x86_64-unknown-linux-gnu` | release | `static/libbeskid_runtime.a` | `shared/libbeskid_runtime.so` | none |
| macOS arm64 | `aarch64-apple-darwin` | debug | `static/libbeskid_runtime.a` | `shared/libbeskid_runtime.dylib` | none |
| macOS arm64 | `aarch64-apple-darwin` | release | `static/libbeskid_runtime.a` | `shared/libbeskid_runtime.dylib` | none |
| Windows x86-64 | `x86_64-pc-windows-msvc` | debug | `static/beskid_runtime.lib` | `shared/beskid_runtime.dll` | `shared/beskid_runtime_import.lib` |
| Windows x86-64 | `x86_64-pc-windows-msvc` | release | `static/beskid_runtime.lib` | `shared/beskid_runtime.dll` | `shared/beskid_runtime_import.lib` |

The target set, calling conventions, object formats, and symbol-prefix rules come from [`compiler/runtime_manifest.bsol`](../../compiler/runtime_manifest.bsol), lines 1-38. The installed layout and the native filenames are selected by [`stage-native-runtime-kit-matrix.sh`](../../compiler/scripts/stage-native-runtime-kit-matrix.sh), lines 12-35 and 100-129. Windows is not complete without both profile-specific import libraries; the matrix script fails closed when either is absent (lines 118-128), and runtime-kit metadata requires the target-specific artifact set ([`validation.rs`](../../compiler/crates/beskid_abi/src/runtime_kit/validation.rs), lines 43-51).

## Per-kit metadata and hash policy

Each of the six `abi.json` files must pass the canonical runtime-kit resolver from its installed coordinate `lib/beskid-runtime/abi-5/<target>/<profile>`:

- schema version is current and ABI version is exactly 5;
- requested target and profile exactly equal the metadata target and profile;
- the embedded ABI contract exactly equals the manifest-derived canonical contract for that target;
- `layout_hash`, canonical runtime `source_hash`, audit hashes, import/export allowlists, and loader-required exports agree;
- artifact paths exactly match the target layout and are portable relative paths;
- every listed artifact is a regular file and its SHA-256 equals the metadata hash;
- Windows metadata contains and hashes the import library; non-Windows metadata does not invent one.

These checks are implemented by [`RuntimeKitMetadata::validate`](../../compiler/crates/beskid_abi/src/runtime_kit/validation.rs), lines 17-74, and [`resolve_installed_runtime_kit`](../../compiler/crates/beskid_abi/src/runtime_kit/resolution.rs), lines 10-63. Publication hashes source bytes, copies into a staging coordinate, rechecks copied bytes, writes canonical metadata, renames atomically, and resolves the published kit again ([`build.rs`](../../compiler/crates/beskid_abi/src/runtime_kit/build.rs), lines 16-92 and 95-120). The matrix refuses partial or duplicate profiles and validates all four provenance reports before publishing either profile ([`matrix.rs`](../../compiler/crates/beskid_tools/src/toolchain/runtime_kit/matrix.rs), lines 12-46 and 52-90).

Required negative evidence must demonstrate fail-closed behavior for, at minimum, wrong target, wrong profile, wrong ABI/schema, missing artifact, non-regular artifact, path substitution, static/shared/import-library hash tampering, noncanonical contract, layout/source/audit mismatch, duplicate allowlist entries, missing required export in any one cell, unexpected definition/import, and forbidden Rust/host/bridge/fallback provenance. Failure must leave no partially published target subtree.

## Independent verifier policies

Every profile produces two reports from the exact bytes that will be published. Reports must never be concatenated across linkage or profile. The current native driver has the correct four-way split (`debug-static`, `debug-shared`, `release-static`, `release-shared`) at [`stage-native-runtime-kit-matrix.sh`](../../compiler/scripts/stage-native-runtime-kit-matrix.sh), lines 67-115, and the builder routes the two artifact kinds to distinct policies in [`verification.rs`](../../compiler/crates/beskid_tools/src/toolchain/runtime_kit/verification.rs), lines 11-30.

### Static archive policy

- Inspect the archive's externally visible definitions independently.
- Require every manifest-derived loader export in that archive.
- Permit only manifest-derived definitions, including target-owned Core.Args bindings/adapters.
- Reject forbidden Rust, host, bridge, fallback, panic, unwind, allocation, or other forbidden symbol families.
- Audit undefined symbols as archive references, not as a linked-image boundary. The canonical static policy permits the target's manifest-derived imports and, only for Linux's unlinked `platform_tls.o`, the exact additional `__tls_get_addr` reference.

The canonical policy is [`RuntimeProvenanceAudit::verify_static_archive`](../../compiler/crates/beskid_abi/src/runtime_provenance.rs), lines 103-114. The older Linux helper deliberately omits archive undefined-symbol collection because an archive is not a final linked image ([`verify-native-runtime-kit-linux.sh`](../../compiler/scripts/verify-native-runtime-kit-linux.sh), lines 71-97); the decisive matrix proof must use the canonical per-artifact matrix policy and then use AOT link-and-execute as the final static boundary.

### Shared library policy

- Inspect the shared image's externally visible definitions and linked undefined imports independently.
- Require every manifest-derived loader export and reject any extra definition outside the manifest-derived target policy.
- Permit only manifest-derived target imports plus documented dynamic-loader imports.
- On Linux, the only additional loader/toolchain imports are `_ITM_deregisterTMCloneTable`, `_ITM_registerTMCloneTable`, `__cxa_finalize`, `__gmon_start__`, and `__tls_get_addr`; macOS and Windows receive no analogous blanket exception.
- Reject every forbidden provenance family.

This is [`RuntimeProvenanceAudit::verify_shared`](../../compiler/crates/beskid_abi/src/runtime_provenance.rs), lines 14-23 and 92-101. Target mismatch, missing required exports, unapproved definitions/imports, and forbidden families fail the common policy (lines 116-147). Mach-O's leading underscore is normalized only at the platform extraction boundary before policy evaluation ([`stage-native-runtime-kit-matrix.sh`](../../compiler/scripts/stage-native-runtime-kit-matrix.sh), lines 80-94).

The Windows import library is not a substitute for DLL verification. It must be present and hash-valid, and a native consumer must successfully link through it to the independently verified DLL.

## Native execution evidence

After publication, each native runner must execute against only the fresh installed prefix—never a source-tree library, process-linked compatibility runtime, cached prefix, or fallback:

| Consumer proof | debug | release | Artifact boundary proved |
| --- | --- | --- | --- |
| Engine JIT canonical entrypoint | required | required | exact validated shared library loads and executes |
| AOT canonical program link and execute | required | required | exact validated static archive links into a real executable and executes |
| REPL snippet evaluation | required | required | public REPL path executes through the exact shared kit |
| public `beskid run` | required | not currently addressable | public CLI path executes through the production debug kit |

The driver already invokes JIT, AOT link-and-execute, and REPL once per profile, then invokes public `beskid run` with the debug profile ([`stage-native-runtime-kit-matrix.sh`](../../compiler/scripts/stage-native-runtime-kit-matrix.sh), lines 133-150). Debug-only `beskid run` is deliberate because the public command currently has one production profile. Release is nevertheless covered by the lower-level Engine JIT, AOT, and REPL production consumers. If 0.4 changes the public command to expose a release profile, the decisive gate must add release `beskid run`; a simulated release flag is not evidence.

The single source must exercise a canonical runtime entrypoint and terminate successfully. AOT proof must link and run the executable, not merely resolve or inspect the archive. JIT/REPL/run proof must resolve symbols only from the selected exact kit. Every smoke result is per target/profile; no Linux execution may stand in for Darwin or Windows execution.

## CI aggregation rule

The root workflow defines native jobs for Windows, Linux, and macOS, each using the same matrix driver and uploading its installed target subtree ([`.github/workflows/compiler.yml`](../../.github/workflows/compiler.yml), lines 75-204). The release decision consumes only one workflow run where:

- the prerequisite Rust gate and all three native kit jobs are green at the same root SHA;
- each job records the same checked-out compiler submodule SHA;
- no native job is skipped, cancelled, retried to mask a failure, or replaced with local/simulated evidence;
- all six `abi.json` files, twelve runtime artifacts, two Windows import libraries, twelve raw symbol reports, six per-kit result records, and native logs remain downloadable;
- the result records agree with the uploaded artifact hashes.

The workflow should publish the symbol reports and result records alongside the installed subtree. The current driver keeps reports under a temporary directory removed on exit (lines 49-50 and 67-73), so a future green job without preserved reports would show that the verifier ran but would not provide the complete auditable evidence defined here.

## Evidence available now

The current tree provides implementation and contract evidence, not release proof:

- `runtime_manifest.bsol` names the three supported targets and is the stated sole ABI authority.
- The matrix driver creates separate per-profile/per-linkage symbol reports, requires both profiles and the Windows import libraries, publishes through one empty prefix, and invokes JIT, real AOT link-and-execute, REPL, and debug public run.
- The matrix builder applies static and shared verifier policies independently and atomically rejects the whole target matrix if one report fails.
- Hermetic regressions include rejection when a required export is missing from only one artifact ([`runtime_kit/tests.rs`](../../compiler/crates/beskid_tools/src/toolchain/runtime_kit/tests.rs), lines 237-295), exact debug/release cardinality, and no partial publication (lines 338-404).
- On 2026-08-11, `bash -n` passed for the native matrix, Linux verifier, and matrix regression scripts, and `bash compiler/scripts/test-stage-native-runtime-kit-matrix.sh` passed on this macOS host. That shell test uses fake Cargo and `llvm-nm`; it proves wiring, not native binaries.
- The current proposed OpenSpec delta requires native debug/release kits on all three targets, validated static and shared artifacts, empty-prefix JIT/AOT smokes, hash/layout/allowlist and target-import audits, and forbidden provenance scans ([runtime-contract conformance delta](../../openspec/changes/complete-v0-4-corelib-runtime-contracts/specs/compiler--conformance--test-harnesses-and-fixtures/spec.md), lines 27-32 and 55-61). Because it remains under `openspec/changes`, it is a pending 0.4 obligation until reconciled into the effective standard; it must not be represented as already released normative evidence.
- [Correct per-artifact runtime-kit verification and native smokes](https://linear.app/cybernomad-it/issue/CYB-182/v04-correct-per-artifact-runtime-kit-verification-and-native-smokes) records that the split policies and cross-host consumers are implemented and hermetic shell tests are green, while focused Rust and native three-host builds remain pending.

## Evidence only native runners can supply

No current release proof exists. The latest `main` [Compiler workflow run](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/31339373142) for root `0733294b` failed the Rust gate; Linux, macOS, and Windows ABI-v5 matrix jobs were all skipped. The latest issue evidence in [Validate canonical runtime-kit target/profile matrix](https://linear.app/cybernomad-it/issue/CYB-83/w55a-validate-canonical-runtime-kit-targetprofile-matrix) says the last retained native attempt failed all three targets and no later fixes have a successful native rerun. [macOS runtime kits](https://linear.app/cybernomad-it/issue/CYB-170/w515-macos-arm64-debugrelease-runtime-kits) and [Windows runtime kits](https://linear.app/cybernomad-it/issue/CYB-171/w516-windows-x86-64-debugrelease-runtime-kits) likewise record no fresh green platform matrix.

Only matching native runners can now supply:

- real ELF, Mach-O, and PE/COFF bytes for all twelve cells and the two Windows import libraries;
- real symbol extraction against each artifact and platform loader/import behavior;
- independent pass results for all metadata, hash, export/import, and provenance policies;
- debug/release JIT, AOT link-and-execute, and REPL execution, plus debug public run, on each native OS/architecture;
- one same-revision three-job green aggregate with preserved artifacts and logs.

Until that exists, “Linux done,” a locally present Darwin release kit, cross-target layout tests, and static source inspection are historical or implementation facts only.

## Canonical issue disposition

Preserve one owner per construct and eliminate the duplicate platform/smoke shapes:

| Issue | Disposition | Canonical responsibility |
| --- | --- | --- |
| [Correct per-artifact runtime-kit verification and native smokes](https://linear.app/cybernomad-it/issue/CYB-182/v04-correct-per-artifact-runtime-kit-verification-and-native-smokes) | **Keep** | Implement/fix the shared per-artifact verifier, evidence retention, consumer smokes, and obtain the fresh three-native-runner result, including invalidated Linux evidence. |
| [macOS arm64 debug/release runtime kits](https://linear.app/cybernomad-it/issue/CYB-33/w56-macos-arm64-debugrelease-runtime-kits) | **Keep** | Canonical macOS platform kit/adapter/packaging issue; consume CYB-182's shared gate. Update its stale command text rather than create another implementation path. |
| [Windows x86-64 debug/release runtime kits](https://linear.app/cybernomad-it/issue/CYB-34/w57-windows-x86-64-debugrelease-runtime-kits) | **Keep** | Canonical Windows platform kit/adapter/import-library/packaging issue; consume CYB-182's shared gate. Update its stale command text rather than create another implementation path. |
| [Validate canonical runtime-kit target/profile matrix](https://linear.app/cybernomad-it/issue/CYB-83/w55a-validate-canonical-runtime-kit-targetprofile-matrix) | **Keep, narrow to sign-off** | Aggregate the same-revision six-kit/twelve-cell evidence after CYB-182, macOS, and Windows are green; do not own another verifier or platform implementation. |
| [W5.15 macOS arm64 debug/release runtime kits](https://linear.app/cybernomad-it/issue/CYB-170/w515-macos-arm64-debugrelease-runtime-kits) | **Close as duplicate of macOS arm64 debug/release runtime kits** | Its build/package/hash/smoke/provenance scope is wholly contained by CYB-33 plus the shared CYB-182 gate. |
| [W5.16 Windows x86-64 debug/release runtime kits](https://linear.app/cybernomad-it/issue/CYB-171/w516-windows-x86-64-debugrelease-runtime-kits) | **Close as duplicate of Windows x86-64 debug/release runtime kits** | Its build/package/hash/smoke/provenance scope is wholly contained by CYB-34 plus the shared CYB-182 gate. |
| [Runtime: macOS arm64 empty-prefix JIT+AOT smoke](https://linear.app/cybernomad-it/issue/CYB-175/w523-runtime-macos-arm64-empty-prefix-jitaot-smoke) | **Close as duplicate/subset of macOS arm64 debug/release runtime kits** | Native smokes are acceptance evidence of CYB-33 through CYB-182, not a separate platform implementation. |
| [Runtime: Windows x86-64 empty-prefix JIT+AOT smoke](https://linear.app/cybernomad-it/issue/CYB-176/w524-runtime-windows-x86-64-empty-prefix-jitaot-smoke) | **Close as duplicate/subset of Windows x86-64 debug/release runtime kits** | Native smokes are acceptance evidence of CYB-34 through CYB-182, not a separate platform implementation. |

Do not treat the previous Done state of Linux kit work as a surviving green proof: CYB-182 explicitly owns the fresh Linux rerun after the verifier defect. CYB-83 closes only after the new same-revision native aggregate exists.

## Handoff sequence

1. Finish CYB-182's focused Rust verification and persist the twelve symbol reports plus six result records.
2. Make the prerequisite Rust gate green so all native jobs actually run.
3. Run the three native jobs at one root/compiler revision; repair failures without weakening policy or mixing evidence across runs.
4. Close CYB-33 and CYB-34 only from their matching native artifact evidence; close the four duplicate/subset issues with links to their canonical issue.
5. Have CYB-83 validate the complete same-revision evidence bundle and record the aggregate sign-off.
6. Reconcile the accepted requirement into the effective OpenSpec/catalog/documentation/changelog before the 0.4 release-candidate sign-off.
