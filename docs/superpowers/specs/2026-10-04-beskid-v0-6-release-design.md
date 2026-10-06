# beskid 0.6.0: stability, everyday tooling, native BSOL and Rust Glue

Date: 2026-10-04. Status: release scope accepted by the user for realization and
publication. Normative OpenSpec changes and implementation evidence remain to be
completed. No builds or release gates were run during the initial research.
Existing user changes were preserved.

## Standing execution authorization

On 2026-10-04 the user requested an active goal to realize the full 0.6 scope and
publish the release. The user subsequently added: "I authorize all research based
recommendations for blockers."

This authorizes researching blockers, choosing evidence-backed remedies, and
carrying them through implementation, verification and release integration without
repeated design/plan approval requests. Record the blocker, primary-source or
reproduction evidence, alternatives, selected remedy, affected obligations and
verification result in the release decision ledger. Preserve the full required
scope; a recommendation cannot silently redefine completion around a subset.
Publication is authorized after the source-bound acceptance gates pass. Preserve
unrelated user changes and the shared privacy rules for credentials.

On 2026-10-04 the user also instructed: "Set in the goal to ignore gitnexus."
For this release goal, do not invoke GitNexus or require its impact/detect-changes
gates. Use authoritative current source, direct caller/reference searches, diffs,
compiler diagnostics and executable tests for navigation and impact assessment.
This goal-specific instruction supersedes repository GitNexus requirements.

On 2026-10-04 the user additionally instructed: "Complete remaining implementation
to fully cover implementation surface, then fix all bugs. Add this to the goal."
Prioritize completing every required implementation surface and integrating its
end-to-end paths, then perform a comprehensive bug-fixing and stabilization pass
across the full release scope. Continue prerequisite regression checks and fixes
where they unblock implementation; do not let repeated narrow verification loops
replace completing the missing surfaces. Publication still requires all required
feature, platform, installed-consumer and source-bound artifact gates to pass,
with every known release-blocking bug resolved and evidence recorded.

On 2026-10-05 the user instructed: "Apply recommendations on web to all decisions
and update the goal to mention to resolve all blockers similarly." Every open
decision and every blocker in this release, current and future, is resolved the
same way: research the question against primary web sources (official language,
tool, platform and standards documentation), select the remedy those sources
support, apply it, and verify it with an executable gate. Record each one in
`docs/reports/2026-10-05-v06-blocker-web-solutions.md` (documented facts with
links, beskid inference and remedy, gate) and in the decision ledger. Do not stop
to ask for a choice between options when primary sources settle it. Escalate only
when sources conflict, when no primary source covers the question, or when the
remedy needs a push, merge, publication, credential change or external service
change. The full required scope and the fail-closed rules above still hold. A web
recommendation cannot weaken a provenance, identity or integrity check below what
the evidence supports.

## Release intent and decisions

Make beskid dependable from installation through a useful project. Keep ordinary
development commands discoverable; put compiler inspection and maintenance under
`dev`. Deliver BSOL implemented in Beskid corelib through reusable serialization,
and turn the existing Glue contracts into a working Rust integration.

The user confirmed during this discussion:

- Rust Glue is required for 0.6.0; .NET is stretch.
- Native BSOL includes parser, writer, schema validation, and typed
  serialization/deserialization through shared serialization metadata.

Recommended release rule: stability and these two end-to-end capabilities define
the release. Additional language features need a demonstrated dependency on them
or a reproduced correctness defect. Avoid unrelated compiler restructuring,
new deployment systems, new package channels, and protocol expansion.

## Evidence and baseline: reconcile before assigning work

The inspected local root is `50bcaa3346413edd2cdae04ef3e8d270a6f36557`, compiler
`887669f55ceee4db8c511be323e048e24ac42292`, corelib
`3f2ab816e5444f5ab7bae3f78ad7dd58d12fdeee`. Its gitlinks match these commits;
corelib has untracked user files. This is an inspection baseline, not the released
baseline. GitNexus compiler results reported 113 commits behind; source inspection
was used to verify findings. Do not infer completeness from graph omissions.

The public [0.5.2 CLI release](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-v0.5.2)
identifies compiler `95c203ff12639b25e2c67b08da531e3715fef4c2` and native root
`2de50cdaef9b1f34e0b246eadad70a17fd43f6d8`. It records native qualification,
an exact-artifact Windows installer waiver, corrected DEB qualification, and an
unsigned macOS DMG. It distinguishes downloadable editor artifacts from accepted
marketplace targets. Those are different delivery states.

Before creating implementation tasks, reconcile released source, current main,
and unintegrated work once. Record each item as shipped, still reproducible,
useful draft, superseded, or outside 0.6. Existing issue titles, task checkmarks,
and old failed runs do not establish current defects.

### Current capability findings

Execution reconciliation (2026-10-04): the isolated release checkout is root
`f67ae4f263fe35d17f2caafce6269eb284027fb0`, compiler
`95c203ff12639b25e2c67b08da531e3715fef4c2`, corelib
`7e3da7ee5dc3efc73f3ff5b49eb2ef8730d7a109`. The original checkout is preserved.
The historical dependency defect below is already corrected in this compiler:
requested-version selection fails closed and artifact/tree integrity is validated.
Protect these guarantees with regression tests; do not assign them as missing
implementation. Direct add/remove, atomic intent/lock updates, and selective
dependency UX remain required. The released dispatcher has removed `hi`.
Native generator materialization and child-process pipes/wait remain prerequisites
for serialization and stdio Glue respectively. See the
[decision ledger](../../reports/2026-10-04-v06-decisions.md).

| Area | Verified state | What 0.6 needs |
|---|---|---|
| CLI | Local [root dispatcher](../../../compiler/crates/beskid_cli/src/cli/app.rs) advertises ordinary and inspection commands together. [Dev grouping](../../../compiler/crates/beskid_cli/src/cli/dev.rs) duplicates format, test and dependency operations. No direct dependency add/remove surface was found. | A user-task command map, transactional dependency editing, accurate help and synchronized consumers. See the [CLI research](../../research/2026-10-04-v06-cli-ergonomics-research.md), including its distinction between local and shipped sources. |
| Dependency correctness | Local [registry selection](../../../compiler/crates/beskid_analysis/src/projects/workflow/registry.rs) falls back from an unavailable requested version to the first active version. Its lock entry records no artifact digest. | Fail-closed coordinate selection and integrity-bound materialization before closing ergonomic dependency workflows. Reproduce on the accepted release baseline before assigning a regression fix. |
| Glue phase | [Local phase](../../../compiler/crates/beskid_analysis/src/mod_host/glue.rs) observes registrations/annotations and returns the input unchanged. The [released phase](https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/95c203ff12639b25e2c67b08da531e3715fef4c2/crates/beskid_analysis/src/mod_host/glue.rs) has the same scaffold. | Invoked contracts with deterministic validated outputs and terminal error propagation. |
| Source backends | [Released backend](https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/95c203ff12639b25e2c67b08da531e3715fef4c2/crates/beskid_codegen/src/backend.rs) rejects Rust and .NET. | Rust generate/build/link/call lifecycle, not only emitted text. |
| Recoverable Glue work | `/Users/mikserek/.codex/worktrees/glue-v05-conformance/beskid` contains a committed proposal plus dirty compiler/spec work: binding identity, Rust source plus manifest, C ABI typedef evidence and CLI/backend plumbing. Its contract only admits fixed-width integers and normalized Bool; it rejects exports, strings, floats, handles and other forms. | Review/rebase the useful seam once; supersede the historical 0.5 scope. Do not restart this work or mistake it for complete Glue. |
| Interop | [Interop.Contracts](../../../compiler/crates/beskid_abi/src/interop.rs) owns type, call and ownership shape vocabulary. [Tool probe](../../../compiler/crates/beskid_abi/src/toolchain.rs) provides structural discovery with absent version/target/hash observations. [GlueTag](../../../compiler/corelib/packages/glue/src/Core/Glue/GlueTag.bd) exposes an integer handle. | Preserve one boundary model, validate actual tools, and make tag lifetime/identity explicit. |
| Dynamic | The [released runtime](https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/95c203ff12639b25e2c67b08da531e3715fef4c2/runtime/beskid/src/Runtime/Dynamic/Dynamic.bd) initializes the shape word to zero. Both mapping functions return the cell's original payload and ignore `mapping`. Cell allocation supplies a null descriptor. | Real shape registration, checked conversion/mapping and GC/lifetime evidence. These functions do not prove generic serialization. A GC defect is a hypothesis to test, not a conclusion from these lines alone. |
| Serialization | The [normative package split](../../../openspec/specs/language-meta--metaprogramming--serialization/spec.md) assigns `[Serialize]` to Serialization Mod, common metadata to Serialization library, and formats to adapters. No corresponding general serialization/BSOL corelib package was found in the inspected package inventory. | Implement the split through the current typed syntax/query/ISLE architecture. Reconcile the [old dynamic contract](../../../openspec/specs/compiler--codegen-and-ir--dynamic-types-and-mapping/spec.md), which still cites retired Rust/HIR implementation paths. |
| BSOL | [Standalone Rust implementation](../../../beskid_bsol/README.md) separates syntax, schema, analysis and bridge. Its [AST](../../../beskid_bsol/crates/bsol-syntax/src/ast.rs) preserves blocks, labels, attributes, references, lists, maps and spans. | Equivalent language behavior in Beskid corelib, including the actual v1/v2/profile surface; a JSON-like map reader is insufficient. |

## Scope and acceptance owners

Use one release umbrella in Tracker SQLite, with these proposed workstreams.
Names below are planning labels, not existing task IDs or accepted changes.

| Workstream | 0.6.0 obligation | Completion evidence |
|---|---|---|
| R0 Baseline and regressions | Reconcile source identities, old tasks and useful drafts; inventory reproducible defects; establish bounded harnesses. | One disposition per old item; exact baseline; executable failing reproductions for accepted defects. |
| R1 Everyday CLI | Task-oriented root surface, dependency management, helpful diagnostics, predictable scripts and clean migration. | Installed beginner workflow on all three native targets; root/dev help; updated editor, docs, templates and scripts. |
| R2 Serialization and dynamic | Shared metadata/eligibility, generated typed adapters, safe dynamic values and checked mappings. | Analysis and generation fixtures plus native execution under forced GC, generic specialization, malformed data and allocation failure. |
| R3 Native BSOL | Corelib parser, writer, schema validation, typed read/write; reference/import behavior and limits. | Shared positive/negative corpus, Rust/Beskid parity, schema self-validation, native typed round trips and public package consumption. |
| R4 Rust Glue | Manual boundary basis, deterministic generator, tool validation, generated artifact closure, runtime call/lifetime path. | Manual and generated equivalent fixtures compile/link/execute on Linux x64, macOS arm64 and Windows x64; failure/cleanup tests. |
| R5 Release acceptance | Source-bound behavior and install journeys, immutable candidate artifacts, publication/readback and accurate availability. | All required cells pass for the frozen candidate; explicit per-channel status; final Tracker/catalog evidence. |

.NET, broad reflection, arbitrary object graph serialization, callbacks/variadics,
additional architectures and new package-manager channels are stretch or later
work. Unsupported forms fail before generation; no silent compatibility routes.
Do not copy every deferred 0.5 item into 0.6: recheck it against shipped 0.5.2.
In particular, September deadline deferral notes are historical until reconciled
with subsequent implementation and release records.

## CLI design

Recommended root surface, to be frozen after reviewing the CLI research:

```text
beskid new <name> [--template <template>]
beskid check [path]
beskid build [path]
beskid run [path] -- <program-arguments>
beskid test [path]
beskid fmt [path] [--check]
beskid add <package>[@<version>] [--project <manifest>]
beskid remove <package> [--project <manifest>]
beskid update <package> [--version <version>] [--dry-run]
beskid update --all [--dry-run]
beskid doc [path]
beskid package <search|info|pack|publish|login|logout>
beskid toolchain <status|update>
beskid doctor
beskid dev <inspection-or-maintenance-command>
```

This is proposed syntax, not runnable documentation for 0.5.2. Example package
names/version flags must come from real registry fixtures before docs ship.
`new --list`/`new --help` expose templates; the default template is bundled and
usable offline. An `init` synonym is unnecessary
unless current-directory creation needs distinct semantics.

Keep parse/tree/CLIF, raw pipeline tracing, mod compilation, runtime-kit
construction, raw fetch/lock/graph, LSP protocol serving, backend-emission inspection
and internal BSOL maintenance under `dev`. Ordinary `check/build/run` also validate
their manifests. Only introduce a public BSOL tool group if an everyday independent
document-validation journey needs it. Compiler tracing flags belong to inspection
commands; structured diagnostics and normal verbosity remain public.

`add` edits dependency intent and resolves the lock as one transaction. A resolution
failure leaves both files unchanged. Repeated adds are idempotent; conflicting
sources/version constraints get an actionable diagnostic. A workspace with several
candidate projects asks for `--project`, naming the candidates. Preserve comments
and unrelated BSOL content: canonical serialization alone cannot satisfy manifest
editing. Add a span-based edit/document preservation mechanism to R1/R3's shared
boundary rather than reformatting the whole file.

For bare `add <package>`, select a stable version under a specified policy and
record exact intent until range solving is specified and tested. Source flags
such as `--path` share the same resolver; do not advertise unsupported Git
materialization. `remove` changes direct dependency intent and recomputes reachable
lock entries; it does not blindly delete shared dependencies. `update <package>`
refreshes only the selected eligible closure; exact-intent changes require
`--version`. Broad upgrade requires `--all`; bare `update` prints guidance.
`build/run/test/check` must not silently upgrade dependency versions;
retain explicit locked/offline contracts and verify fresh-cache behavior.

Root help must show an add example and a create/add/run sequence. Error output
names the failed action, cause and next command. `doctor` reports actionable
installation/toolchain problems with redacted paths/details as needed; it does
not install software or mutate credentials. Non-interactive invocations never
wait for a picker. Machine output is versioned and distinct from progress output.

Prefer a clean 0.6 migration: remove duplicate old command handlers and migrate
all repo consumers together, with a published old-to-new command table. Editor
launch arguments and CLI capability negotiation are explicit migration consumers.
Preserve only deliberately useful spelling aliases, such as `format` for `fmt`,
if approved; do not maintain two independent command surfaces.

Beginner acceptance: from installed help alone, a new user finds dependency add
within 60 seconds and completes create/add/build/run without manually editing a
manifest. Automate the command journey and separately perform an observed human
help test; snapshots cannot prove discoverability.

## Generic serialization and native BSOL

Use three layers:

```text
Serialization Mod: eligibility, Collector, incremental typed-AST generation
                              |
Serialization library: shared data model, metadata, encode/decode contracts
                              |
BSOL corelib: syntax document, profile validation, format adapter, typed mapping
```

The separation is supported by the existing beskid specification. As an external
design comparison, [Serde separates data-type mapping from format encoding](https://serde.rs/data-model.html).
Adopt that separation rather than its whole API. Proposed Beskid API spellings
such as `Encode<T>` and `Decode<T>` remain to be specified in OpenSpec.

Known `T` uses generated typed adapters; schema-unknown content can use `dynamic`
through registered descriptors and checked operations. Dynamic is an optional
mechanism for runtime shape, not a requirement to box every field. BSOL syntax
documents retain distinctions between identifiers/strings, block kinds/labels,
references, attributes and source spans. They must not collapse into an unordered
dynamic dictionary.

Minimum shape matrix: primitive values, strings/bytes with explicit encoding,
nested records, instantiated generic records, arrays/lists, maps with explicitly
supported keys, enum variants with payloads, and optional values. Specify each
format's representation and reject unsupported shapes. JSON can be a small second
adapter/fixture to demonstrate that generic metadata is not BSOL-specific; a broad
new JSON product API is not an extra release requirement.

Required policies include duplicate/unknown/missing fields, defaults, numeric range
and precision, invalid UTF-8/escapes, enum discriminants, stable field ordering,
maximum input/depth/collection sizes, allocation failure, and cycles. Default to
bounded owned values and rejection of cycles; serializing arbitrary references,
resources, handles or closures is outside scope. Shape identity is not an unstable
AST node number; define registration, version compatibility and collision checks.
No unregistered runtime reflection or best-effort coercion.

Dynamic proof precedes typed BSOL acceptance: wrap values with a registered shape,
distinguish two nonzero shapes, reject wrong casts, map compatible fields into a
fresh destination, reject incompatible mappings, and retain nested references
through forced collection. Exercise repeated construction/drop and generic
instantiations. Preserve canonical allocation/descriptor and semantic-query
authority; do not restore retired lowering paths mentioned in old specs.

For full native BSOL, inventory and specify parity with
[v2 features](../../../beskid_bsol/docs/language/v2-features.md) and
[schema profiles](../../../beskid_bsol/docs/language/schema-profiles.md): nested
blocks, labels, assignments, lists/maps, attributes, references, schema imports,
profile inheritance/constraints and migration semantics. File/package import
resolution uses an explicit host adapter, controlled roots, cycle detection and
locked package identity; parsing does not perform implicit network access.

Use one normative grammar/profile contract and shared conformance corpus for Rust
tooling and native corelib. Rust tooling may remain the compiler bootstrap host;
the new corelib API itself must execute Beskid implementation without forwarding
to a Rust BSOL parser. Migrating all compiler bootstrap/editor consumers to Beskid
is a separate dependency review, not an implicit self-hosting requirement.

Round trips are semantic by default, with deterministic canonical output. Source
comments/format preservation require the separate edit/document contract. Test
BSOL reading real project/workspace/schema/runtime fixtures, schema self-validation,
typed records and collections, invalid input spans and profile diagnostics.
Provide a standalone installed Beskid program that reads a BSOL configuration,
decodes a generic record, validates it, updates it and writes it back.

## Rust Glue: manual basis, then equivalent generation

Retain Interop.Contracts as the common boundary vocabulary. Glue generates
integration code and build metadata; it does not translate arbitrary Beskid
programs into Rust. Ordinary Beskid execution remains the canonical AOT path.
Generated Rust wrappers use an explicit C ABI. The
[Rust FFI guide](https://doc.rust-lang.org/nomicon/ffi.html) explains why declarations
must match the foreign library and why safe wrappers need to contain unsafe calls.

Start with a hand-written Rust/Beskid fixture and a boundary manifest. Prove
import and export directions manually, then require generated artifacts to match
the same observable results and failure rules. Recover existing emitter/tool-probe
work only after reviewing its diff against the agreed baseline.

Freeze a primitive/ownership matrix before widening the emitter. Recommended
0.6 required profile includes available fixed-width signed/unsigned integers,
f32/f64, normalized Bool, a defined Unicode scalar representation for char,
UTF-8 string views, byte buffers, unit/void returns and checked opaque handles.
Inventory actual Beskid primitive types first; define native-width values relative
to the selected target, and keep raw pointer exposure an explicitly unsafe profile
or terminal rejection. Test nullability, zero length, embedded NUL, invalid Unicode,
float special values and limits. The recovered integer-only emitter is an early
milestone, not a substitute for this matrix.

Every binding records backend, canonical library identity, symbol, direction,
target/ABI, call and ownership shape. Extern and Glue annotations are mutually
exclusive before lowering. A structured artifact records relative generated files,
digests, tool identities, link inputs and outputs; reject path escape and unstable
ordering. Explicit tool configuration feeds discovery; bounded interrogation
proves version, hash policy and target before external build. A plain Beskid build
must not require Rust or .NET tooling unless it consumes that backend.

Specify runtime transport deliberately. Existing Glue design declares a stdio
bridge; if retained, its envelope needs protocol/version, library identity,
request ID, method identity, bounded payload, error and shutdown semantics. Reuse
Core.IO, fibers, existing wait/cancellation and lifetime machinery. Shared
serialization supplies value encoding; never serialize raw dynamic payload pointers
or GC addresses. A native in-process alternative requires an explicit OpenSpec
decision replacing the stdio obligation, not a second hidden path.

Acceptance includes generated Rust compiling on all three hosts, import/export
calls, deterministic regeneration, wrong ABI/library/shape rejection, missing or
changed tools, foreign failure, bridge process exit, partial I/O, cancellation,
late responses, close/dispose and no retained resources. Foreign panic/unwind must
not cross an incompatible ABI. Document precise supported forms and a working
manual example alongside the generated example.

.NET can share binding/serialization/artifact contracts, but gets its own profile,
tooling and acceptance cells. It remains unavailable until those cells pass.

## What earlier releases teach us

Conversation retrieval covered recent and paginated earlier turns from
[Audit v0.5 networking HTTP](codex://threads/01a0d334-5eee-70a2-bd14-725e008437bd),
[Glue and Interop Base](codex://threads/01a0c845-774b-7d81-a130-3cd2ea8d2582),
[Assess compiler gaps for 0.5](codex://threads/01a0b8cc-a3fe-7532-b804-2e9d46e9cc47)
and [Assess networking protocol gaps](codex://threads/01a0c8df-2dd1-7501-b958-e67037a9d055).
This is a targeted review, not an exhaustive search of every historical chat.
Historical instructions are context, not new permission to publish or delete.

| Observed failure pattern | Evidence | New control |
|---|---|---|
| The audit read a stale corelib checkout and reported implemented networking missing. | Networking audit opening message explicitly corrects the earlier result. | Print/record recursive gitlinks and resolved source origins before any audit/test. Refuse mixed checkouts. |
| A long compiler gate remained green while public Console/Fiber templates were broken. | Late 0.5.2 audit turns identify corrected local templates but stale registry versions; later consumer checks use template 0.1.3. | Installed candidate/template dependency closure is a required test from the first milestone, then public readback after publication. |
| Shared Cargo locks, ENOSPC and cache movement dominated progress. | Glue turns record shared-target waiting, under 1 GiB free, ENOSPC and moving a 28 GiB target into Trash without freeing space. | One resource admission check per worker, isolated caches, explicit build lock owner and authorized cache policy before starting. |
| Old open tasks included duplicates, stale failures and unrelated cleanup. | [0.4 boundary audit](../reports/2026-08-11-cyb-190-v04-release-boundary.md) classifies required, duplicate, beyond-release and reverify items. | One bounded disposition pass and one surviving owner per obligation. No implementation from a stale diagnosis. |
| Unintegrated work accumulated across worktrees. | [Worktree audit](../../research/2026-09-22-worktree-audit.md) and current Glue worktree inspection. | Deliver small dependency-complete slices with explicit handoff and integrate once; preserve/review useful drafts before replacement. |
| Release provider/version migration changed numbering and allowed insufficient evidence. | [September readiness audit](../../research/release-readiness-2026-09-11.md). This is historical AppVeyor evidence, not today's CI architecture. | Stable SemVer belongs to the release record; require source-bound, machine-verified complete evidence through existing Woodpecker authority. |
| Marketplace login automation became a new infrastructure project despite manual upload being available. | 0.5.2 audit's Entra/PAT discussion ends by recognizing manual verified VSIX upload. | Freeze a proven delivery route per required channel early. Optional automation does not hold qualified product bytes hostage. |
| Repeated continuations described the same approval/credential block. | Audit pagination contains repeated unchanged completion/blocked reports and empty final turns. | Record actionable blocker once; continue independent work; suspend dependent work until input changes. |
| A website update retried a publisher after an unrelated Nexus build failed. | Announcement turns report website passed while a Nexus archive extraction held publication. | Model artifact/channel dependency closures explicitly. Separate a website-only promotion if supported by reviewed policy; otherwise name the coupling and fix it once. |

## Release loop with bounded returns

```text
Baseline -> scope/spec freeze -> vertical slices -> integrated candidate
         -> native/install qualification -> promotion review
         -> publication and public readback -> release closure
```

### 0. Establish baseline and freeze scope

R0 records a single accepted source baseline, recursively pinned submodules,
catalog revision, known defects and 0.5 carryover dispositions. Review the useful
Glue draft and current CLI restructuring. Select required distribution channels
and their manual/automated routes; verify builder availability and non-secret
account access before they become the critical path. Do not require every
historically mentioned channel.

Before implementation, create real OpenSpec requirements/scenarios for R1–R5,
with links to existing capabilities and explicit supersession of old Glue/dynamic
scope. Rebuild the catalog through its generator. Tracker SQLite records owners,
dependencies, acceptance case IDs and version; Linear remains a projection and
existing `agent/cursor` / `agent/codex` ownership remains respected.

### 1. Deliver small vertical slices

First prove installed CLI create/add/build/run, dynamic wrap/cast/GC, and one
manual Rust call. These are feasibility checkpoints inside the release, not
permission to ship only scalars or an incomplete parser.

Serialization eligibility/metadata precedes typed BSOL and serialized Glue bridge
values. BSOL syntax/schema work and the Rust manual ABI/artifact seam can proceed
independently once contracts are stable. Integrate each complete slice before the
next dependent slice. Keep parallel work in isolated branches/worktrees/caches;
one integration owner reconciles gitlinks. Do not let every worker edit release
state, generated catalogs and shared ABI vocabulary.

Every slice has a failing reproduction or new acceptance scenario, focused proof,
integration proof and bounded review. Reopen it only for new failing evidence,
changed behavior or a changed dependency. No repeated review of unchanged code.

### 2. Freeze and qualify one candidate

Use a clean checkout. Freeze sources, packages/templates, docs command surface,
catalog and harness before expensive final runs. Candidate identity includes root,
compiler, corelib and other consumed gitlinks; package/template versions and
digests; toolchain and runtime-kit identity; target; test manifest; artifact hashes.

Run required semantic/ISLE/runtime/corelib gates and the same installed consumer
manifest on Linux x64, macOS arm64 and Windows x64. Consumer cases include
create/add/remove/update, locked/offline rebuild in another directory, application
arguments, CLI failures, BSOL generic round trip, Rust Glue import/export and editor
startup/capability negotiation. Installer install/upgrade/uninstall scenarios use
clean target environments and exact package bytes. A prior 0.5 waiver does not
waive 0.6 testing.

Extend the [existing evidence validator](../../../scripts/ci/woodpecker-release-evidence.mjs)
and aggregator with feature and consumer evidence; do not add a second acceptance
authority. Each required case records executed/pass/fail/timeout/blocked/skipped,
command, input identity, exit status and retained output digest. Missing,
unexecuted, mismatched-source and timeout cells cannot become pass.

### 3. Handle failures without restarting the whole program

Deduplicate by requirement, source/input identity, target and failure signature.
Classify the first failure as product, harness/environment, infrastructure or
external approval. Product failures create one bounded fix with reproduction;
harness failures correct provenance or execution without declaring product success.
Allow one retry for a demonstrated transient infrastructure fault. A repeated
identical failure requires diagnosis, not another blind full build.

After a change, rerun affected focused and integration gates. At final candidate
freeze, run all mandatory gates. Preserve prior successful artifact evidence;
never relabel it as proof of a new source SHA. Reuse unaffected components only
if the accepted evidence policy explicitly proves identical input closure and
records the original qualified identity. Until that exists, follow the current
exact-source policy.

Proposed investigation checkpoint: after two unsuccessful fix attempts or half a
working day without a narrower reproduction, stop speculative patches and report
the hypothesis, evidence and next experiment. This is a diagnosis checkpoint,
not automatic deferral of a required feature. Optional scope can be removed only
by an explicit scope revision; a required capability stays blocked until fixed
or the user changes the release definition.

### 4. Review promotion, publish once, read back

Woodpecker builds/validates and retains durable candidate artifacts without
publication/deployment credentials. The separately reviewed manual publisher uses
exact approved bytes; Watchtower reconciles production platform images. Seek
promotion approval only with a concrete qualification packet and named action.
The user's subsequent standing execution authorization covers realizing and
publishing this release after qualification. It supersedes the initial planning
phase's approval boundary; record the concrete promotion packet and action rather
than asking again for already authorized release work. Credential privacy and
preservation of unrelated user changes still apply.

Publish required dependency packages/templates before promoting native consumers
that require them, or use a reviewed staging/pinned artifact route for preflight.
After approval/publication, fresh public downloads, registry resolution, image
digests and marketplace readback confirm what users can actually obtain. A
checksum alone does not prove the create/build/run journey. Append derivative
installer/editor/channel evidence without rewriting frozen native evidence.

Track native qualification and each delivery channel separately. Recommended
statuses: candidate, qualified, approved, published, public-consumer-verified,
blocked-external. Mark 0.6.0 closed only when its agreed required channels and
capabilities satisfy their criteria. Optional externally held channels remain
named followups; release notes/downloads never imply they are already available.

### 5. End the loop

The coordinator publishes one final evidence summary and reconciles Tracker and
the catalog. A continuation must advance a named task, run a justified experiment,
integrate a changed slice or observe changed external state. Repeating an unchanged
blocker or rerunning green gates is not progress. Stop dependent work on a human
or external block; retain the exact artifact, reason, owner and required next step.
Preserve sources/evidence and archive caches/worktrees only under the applicable
authorization. No scheduled or overnight automation is created by this design.

## Suggested milestones and risk

| Milestone | Exit |
|---|---|
| M0 Release contract | Accepted baseline, scoped requirements, task/evidence matrix, builder/channel preflight. |
| M1 Developer journey | Installed CLI dependency workflow, manual Rust boundary, dynamic shape/GC proof. |
| M2 Reusable data | Serialization generation and full native BSOL behavior/typed parity. |
| M3 Glue integration | Required Rust primitive/ownership matrix, generated build/link/call and lifecycle across targets. |
| M4 Feature freeze | All required capability cells green; migrations/docs/consumer fixtures finalized. |
| M5 Candidate and closure | Frozen artifacts qualified, approved required channels published and public journeys verified. |

The critical risk is R2: safe generic shape metadata, typed-AST generation and
dynamic lifetime behavior may expose compiler prerequisites. R4 carries foreign
ABI, toolchain and bridge lifecycle risk. Discover these at M1. Assign confidence
and effort estimates only after the baseline and manual probes; calendar dates
now would disguise those uncertainties. Reserve capacity for reproduced stability
defects and final consumer qualification before considering .NET stretch work.

Next execution step: turn the accepted root command map, serialization/BSOL
behavior matrix and Rust boundary matrix into normative OpenSpec changes and a
dependency-linked Tracker plan. Select required existing delivery channels from
baseline evidence and record the ruling. Continue under standing authorization.
