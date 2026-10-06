# v0.6 source-preserving dependency intent editor

## Bounded implementation

New `projects/dependency_edit.rs` provides DependencyIntent, DependencyIntentSource, DependencyMutation, EditManifest and SelectDependencyProject. The pure editor validates the original manifest through the authoritative parse_manifest pipeline, obtains ordered BSOL syntax spans, makes nonoverlapping reverse-order range edits, then validates the result. It performs no package resolution, network requests, lockfile rewrite or filesystem mutation.

`projects/manifest_edit.rs` privately owns exact dependency block/value ranges and escaping helpers; `projects/dependency_edit/selection.rs` owns project/workspace selection. Root owns `projects/mod.rs` declaration and resolver/transaction integration. No root normative/catalog or unrelated compiler files were edited by this worker; GitNexus is omitted under the user's explicit instruction. No Cargo builds, commits or pushes were performed by this worker.

## Contract decisions

- Add appends a BSOL dependency block using write_bsol_value for every quoted label/value. All existing bytes remain an exact prefix. The first existing newline selects LF/CRLF for appended text; existing mixed endings/comments/Unicode stay untouched.
- Exact same typed intent is a byte-identical no-op; an existing dependency with different source/path/registry/version rejects with explicit update/remove guidance.
- Registry intent requires a nonempty version. Bare add must be resolved before calling the pure editor; it does not invent a version. Optional registry name must be nonempty when supplied.
- Relative paths retain their exact Unicode spelling and are never canonicalized or materialized. Absolute/empty/non-Unicode paths reject at this pure intent boundary.
- Remove deletes exactly the parsed dependency block span. Surrounding comments/newlines and unrelated dependencies remain untouched; missing dependency removal is a no-op. Duplicate labels or invalid original manifest syntax/source fail before editing.
- Explicit Update changes exactly the selected registry dependency's quoted version value span, preserving comments and identical version strings elsewhere. It cannot change path/git source. Select exactly one package or --all; explicit version requires one package. Versionless targeted/--all update leaves source bytes unchanged for subsequent resolver-owned lock refresh.
- Project selection validates selected .bproj sources. Explicit paths resolve relative to the start directory. Automatic selection walks ancestors and never chooses a first member arbitrarily. Multiple local projects/workspaces or multiple workspace candidates produce sorted paths and --project guidance; a concrete member-directory context can select that member. Existing legacy manifest rejection remains active.

## Public interface for transaction integration

- DependencyIntent { name: String, source: DependencyIntentSource }
- DependencyIntentSource::Registry { registry: Option<String>, version: String }
- DependencyIntentSource::Path(PathBuf)
- DependencyMutation::Add(DependencyIntent), Remove(String), Update { package: Option<String>, version: Option<String>, all: bool }
- EditManifest(original: &str, mutation: &DependencyMutation) -> Result<String, ProjectError>
- SelectDependencyProject(start: &Path, explicit: Option<&Path>) -> Result<PathBuf, ProjectError>

The transaction owner must resolve bare registry intent first, obtain the current source bytes, call EditManifest, and keep plan/commit revalidation and manifest/lock pairing outside this pure function. A versionless source no-op can still require lock resolution. Source path metadata must remain the user's relative declaration; materialization coordinates belong to the resolver.

## Verification ownership and cases

Root observed initial RED `cargo test -p beskid_analysis --test dependency_edit_v06`: E0432, missing projects::dependency_edit. This worker supplied source and expanded the integration test to nine cases. Root then added the module declaration and ran `cargo test -p beskid_analysis --test dependency_edit_v06`: GREEN, 9 passed, 0 failed, 0 ignored. Root owns the serialized Cargo cache; this worker did not compile independently.

Cases: exact prefix/CRLF/comment preservation; removal around leading/trailing comments and an unrelated path intent; relative Unicode path and conflict; selected explicit version-only replacement and selector validation; sorted multi-project ambiguity; duplicate rejection; escaped labels/registry and unresolved/unknown-source rejection; identical strings in comments/unselected dependencies and versionless refresh no-op; workspace member ambiguity without first-member selection.

Source files were rustfmt-formatted (stable rustfmt reported pre-existing nightly-only configuration warnings) and diff whitespace checks passed. The root-observed focused integration gate passed. Planner/resolver/transaction and installed CLI gates remain separate required work; this result proves only the pure editor/selection milestone.
