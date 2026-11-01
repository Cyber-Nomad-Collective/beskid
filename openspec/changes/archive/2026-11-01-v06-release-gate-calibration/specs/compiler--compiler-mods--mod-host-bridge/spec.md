## ADDED Requirements

### Requirement: Native Mod cache key length
The directory that holds a published native Mod cache entry, `<workspaceRoot>/.beskid/obj/mods/<packageId>/<artifactKey>/<targetTriple>/`, SHALL be named by an `artifactKey` of exactly 32 lowercase hex digits: the first 128 bits of the SHA-256 of the serialized descriptor identity. A host SHALL recompute the key from the descriptor before it uses an entry and SHALL refuse an entry whose directory name differs from the recomputed key. A release bundle SHALL ship only these sealed entries of its Corelib Mods; the working state that a Mod build leaves beside them (`obj/` trees, cache and materialization locks) SHALL NOT be in the bundle.

#### Scenario: A built Mod entry is named by a 32-digit key
- **GIVEN** a native Mod built for `x86_64-pc-windows-msvc`
- **WHEN** the host publishes its cache entry
- **THEN** the entry directory below `.beskid/obj/mods/<packageId>/` is named by 32 lowercase hex digits followed by the target triple directory
- **AND** a later build that recomputes the same key reuses the entry

#### Scenario: A renamed entry is refused
- **GIVEN** a published cache entry whose directory name no longer matches the key recomputed from its descriptor
- **WHEN** the host qualifies the entry
- **THEN** the host refuses the entry and names it as failing integrity verification

#### Scenario: A release bundle carries no Mod build caches
- **GIVEN** the release bundle assembly prebuilds each Corelib Mod inside the bundle
- **WHEN** the bundle is archived
- **THEN** the archive holds each sealed Mod entry and no `obj/` tree, `.cache-lock` or `.materialize-lock`
