# F6 Source-Origin Provenance Design

## Outcome

Corelib service authority must be granted only to the compiler-owned source
selected through a trusted origin, exact embedded bytes, and the corresponding
canonical physical file. A user-controlled file or directory symlink, copied
file, altered file, or a content-cache hit must never inherit that authority.
The fix must continue to accept the compiler's own normal and Windows
extended-length spellings, and it must retain the explicit materialized
dependency route.

## Design

`beskid_analysis::projects::SourceUnit` gains request-scoped `origin_path` in
addition to its existing canonical `path`. `path` remains the semantic key and
is still produced by `unit_path_key`; changing it would split semantic
identities. `origin_path` records the path selected before symlink resolution.

One analysis-owned request binder constructs/rebinds a unit from parsed syntax,
the current request path, and the current logical name. Cold parsing, disk-AST
cache hits, Salsa materializer hits, and public content-addressed parse queries
must use it. Cached syntax is reusable; cached source authority is not.

The entry loader keeps the raw entry spelling for loading/origin while using a
separate canonical key solely for de-duplication and entry matching. Imports
and workspace scan paths remain uncanonicalized until the binder. The ABI
Corelib source inventory owns both the declared trusted location and canonical
physical target; no logical-name or suffix inference is permitted.

`build_typed_program_with_corelib_services` remains the only service-authority
owner. For a direct Corelib unit it requires exact embedded bytes, a trusted
origin, expected canonical physical identity, a regular final target, and a
single candidate. For a materialized dependency it additionally requires the
loader-issued trusted materialized destination to match both origin and
physical identity. Resolver failure or incomplete provenance fails closed.

## Boundaries

- Do not change `unit_path_key`, Core.IO, ISLE, syscall descriptor admission,
  native worker fixtures, ABI manifests, or public source APIs.
- Do not mint a service capability in the builder or attach a cached boolean
  authority bit to syntax.
- Do not canonicalize a user origin for eligibility, add a path-suffix rule,
  use `same_file`, or add a call-lowering fallback.
- This work closes source-unit aliases. Path-dependency declaration aliases are
  graph-level provenance and are explicitly outside this workstream.

## Proof obligations

1. Direct real Corelib Syscall source is allowed under both normal and Windows
   canonical physical spellings.
2. Normal builder and loader entry user file/directory symlinks are denied.
3. Copied and altered sources are denied even with matching logical names.
4. Disk and Salsa/public-query cache hits rebind origin for every request in
   both request orders.
5. The materialized Corelib dependency path remains allowed, including the
   Windows physical-path representation; a user alias to it is denied.
6. The Windows Foundation source/AOT/shared routes stay green; the already
   recorded Cranelift JIT relocation limitation stays separately unavailable.
