## ADDED Requirements

### Requirement: Canonical child process syscall ownership
Child process spawn/pipe/read/write/wait/terminate/reap effects SHALL enter the canonical host syscall/ABI manifest and existing runtime lifetime/wait machinery with explicit descriptor/handle ownership and per-target implementations. Beskid process control SHALL NOT create an independent scheduler, runtime dispatch table or unmanaged alternate host bridge. Export scopes SHALL retain GC roots and release them on completion/failure/cancellation. New exported signatures or layout changes SHALL obey runtime ABI/versioned kit discovery and compatibility gates.

#### Scenario: Three native host lifecycle
- **GIVEN** a child pipe/wait/terminate lifecycle on each required native target
- **WHEN** runtime operations execute
- **THEN** the canonical entries and ownership rules release all resources and existing IO/fiber gates remain satisfied

#### Scenario: Export forced collection
- **GIVEN** a Beskid export allocates while borrowed payload roots are active
- **WHEN** forced collection and subsequent completion/close occur
- **THEN** live values remain valid and roots are released after terminal settlement

### Requirement: Canonical Glue owner issuer and registry V3
The runtime SHALL provide manifest-owned `uint64_t beskid_glue_v1_next_identity(void)` through exactly one canonical shared-runtime provider for the process lifetime. The issuer SHALL use atomic checked monotonic u64 allocation, issue only nonzero identities, never reset on library/session/heap/runtime shutdown or reinitialization, and fail closed permanently on exhaustion. RuntimeState SHALL remain 64 bytes, HeapState 328 bytes and the GC descriptor 40 bytes. The callback registry SHALL migrate atomically to version V3, preserving its base 1056 bytes, the Dynamic root handle at 1056 and adding the Glue owner-record root handle at 1064, total 1072 bytes. Startup, replacement, rollback and shutdown SHALL preserve or release these named roots through the canonical GC handle lifecycle, releasing roots before HandlesClear. The registry SHALL remain addressed through runtime callback slot 24.
Glue owner records SHALL use canonical generated typed shape/descriptor authority. Their next-record and managed payload references SHALL be traced; foreign allocation addresses SHALL remain nontraced scalar transport fields. Their checked provenance SHALL bind token, library, session, shape and generation. Static duplicate issuer copies or user-library counters SHALL be rejected by the Glue profile. The host and all participating libraries SHALL link the same canonical shared provider and record its actual source/tool/artifact closure.

#### Scenario: Two libraries share the canonical issuer
- **GIVEN** two separately built Glue libraries dynamically bound to one canonical runtime
- **WHEN** they allocate owner records concurrently and one library receives the other's token
- **THEN** allocation identities are nonzero and unique and the foreign-library token is rejected before release or dispatch (R4-OWN-03)

#### Scenario: Heap lifecycle cannot resurrect a token
- **GIVEN** two fresh RuntimeStates and a subsequent shutdown and reinitialization whose GC slot/generation numbers may coincide
- **WHEN** a token from a prior or foreign heap is checked
- **THEN** canonical issuer and record provenance reject it without touching the current live allocation (R4-OWN-03)

#### Scenario: Exhausted issuer cannot wrap
- **GIVEN** a bounded native test initializes the issuer at its final allocation boundary
- **WHEN** concurrent allocation reaches exhaustion
- **THEN** no zero identity is published as success, no identity repeats, and later calls remain fail closed

### Requirement: Installed Glue shared provider identity
The implementation SHALL distinguish ordinary canonical static runtime linkage from the required Glue shared-provider V1 profile. Glue resolution SHALL require a bounded, regular `glue-provider-v1.json` file published atomically with the kit. The packet SHALL contain schema and issuer version 1, exact target/profile, canonical runtime layout/source digests, the independently compiler-embedded issuer C/header closure digest, the validated shared payload and Windows import payload identities, and ordered actual compiler/linker executable and version-output digests. Installed consumers SHALL NOT require build-host tool paths. The producer SHALL capture the actual tools used and reject a missing or changed tool; release qualification SHALL independently pin the source/tool/provider packet and inspect actual binary dynamic dependencies. Self-consistent packet rehashing SHALL NOT substitute for qualification authority.

#### Scenario: Required shared profile cannot use a static archive
- **GIVEN** an otherwise valid ABI-v5 kit with a static archive but absent or mismatched Glue V1 sidecar
- **WHEN** a prepared Glue artifact requests the shared-provider profile
- **THEN** resolution SHALL fail before foreign effects and SHALL NOT select the static archive or ambient library.

#### Scenario: Shared payload ownership is exact
- **GIVEN** a sidecar whose provider source, target, profile, shared payload, or Windows import payload differs from the validated canonical kit
- **WHEN** installed Glue resolution validates the packet
- **THEN** it SHALL reject the packet even if its internal digests were recomputed consistently.

#### Scenario: Build tools are provenance, not installation dependencies
- **GIVEN** a canonical provider built using retained actual compiler/linker receipts
- **WHEN** the kit is installed on a machine without the build-host executable paths
- **THEN** profile resolution SHALL validate retained tool identities without trying to execute those build-host paths, while qualification SHALL compare them against its independently frozen build packet.

### Requirement: Relocatable canonical shared provider identity
The canonical shared-provider producer SHALL assign its loader identity at link time. Mach-O SHALL use `@rpath/<canonical dylib basename>`, ELF SHALL use a basename-only `DT_SONAME`, and PE/COFF SHALL retain the canonical DLL basename in import-library identity. No published provider identity SHALL refer to a disposable build directory. Provider hashes and packets SHALL describe these linked bytes; post-publication binary patching SHALL NOT establish canonical identity.

#### Scenario: Installed provider survives staging cleanup
- **GIVEN** a provider built in an owned temporary staging directory and atomically installed with its packet
- **WHEN** staging is removed and an actual foreign caller links and loads the installed shared image
- **THEN** the loader SHALL resolve the canonical installed provider through its target loader search mechanism without requesting the deleted staging pathname.
