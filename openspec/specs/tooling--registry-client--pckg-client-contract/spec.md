<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# pckg client contract Specification

## Purpose

Contract surface for the Beskid package registry client crate used by tooling workflows.
## Requirements
### Requirement: Browse validated artifact documentation
The package browser SHALL index documentation and source paths from a validated artifact without rejecting the artifact solely because it contains safe unrelated entries such as lockfiles, icons, tests, grammars, or build metadata. Hidden or traversal paths under browsable roots MUST remain inaccessible. A request failure MUST be distinguishable from a genuinely empty documentation or source list in the pckg UI.

#### Scenario: Corelib artifact has documentation and metadata
- **GIVEN** a validated Corelib package artifact containing `README.md`, documentation, `Project.lock`, and tests
- **WHEN** the package browser requests its documentation list
- **THEN** the documentation entries are returned while unrelated safe entries are ignored

#### Scenario: Documentation request fails
- **GIVEN** the browser endpoint returns an error
- **WHEN** the pckg documentation page renders
- **THEN** it displays an error state rather than claiming no documentation was published

### Requirement: Hub authority: Decision [D-TOOL-PCKG-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> Hub owns HTTP and auth.

**Stable ID:** `BSP-REQ-4C374A0F8991`  
**Legacy source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/adr/0001-hub-authority/content.md`  
**Source SHA-256:** `16eeeaea148e9201cc4c515fbb8b107ed86466a2f99bd5781411990eaa2c1b63`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Artifact-bound versions: Decision [D-TOOL-PCKG-0002]
The Beskid standard SHALL enforce one immutable coordinate for each published
artifact. The publisher SHALL read the package id and semantic version from the
validated artifact-root `package.json`, and SHALL send that exact version with
the checksum and `.bpk` bytes to
`POST /api/packages/<name>/versions`. The registry SHALL reject different bytes
for an existing package/version coordinate. A workspace publisher SHALL package
and validate every member before its first registry mutation and SHALL publish
each member through this same per-package route; the registry SHALL NOT expose
a separate workspace-bundle publication path.

**Stable ID:** `BSP-REQ-96F30E1AED03`  
**Legacy source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/adr/0002-registry-assigned-versions/content.md`  
**Source SHA-256:** `b202b1e7377a19ac989aefe5f1b07e702cf42377fa2db20c4d287616385c0a84`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: api.json symbolKey pack validation: Decision [D-TOOL-PCKG-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> `validate_packed_api_doc` **must** run **`validate_symbol_keys`** for `schemaVersion >= 4` graph artifacts. When `symbolKey` is present on an item:
> 
> | Check | Rule |
> | --- | --- |
> | Non-empty | Reject blank strings |
> | Package prefix | Must contain `::` (package-prefixed canonical form) |
> | Uniqueness | Reject duplicate `symbolKey` values across items |
> | Leaf consistency | Lenient check: obvious mismatch between `symbolKey` leaf segment and `qualifiedName` leaf **may** reject when unambiguous |
> 
> Absence of `symbolKey` on any row **remains valid** (backward compatibility with pre-registry emitters).

**Stable ID:** `BSP-REQ-BBEFDCD80BA7`  
**Legacy source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/adr/0005-api-json-symbol-key-validation/content.md`  
**Source SHA-256:** `dd618229faa546df91192be63fb37ac8dc9a4e66451d51f81bca590fd6bf5aa9`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Verified artifact file browsing

The registry SHALL expose every file of a stored package version only after
re-verifying the artifact checksum and re-validating the `.bpk` format. The
registry SHALL list files through
`GET /api/packages/{name}/versions/{version}/files` and SHALL serve one file
through `GET /api/packages/{name}/versions/{version}/files/content?path=`.
`version` MAY be `latest`, which SHALL resolve to the greatest non-yanked
release and SHALL be echoed as the concrete version in the listing. The
registry SHALL exclude any entry with a dot-prefixed path segment, except the
generated `.beskid/docs/` tree, from listings and reads. When an entry inside
`docs/`, `src/`, `content/`, `workspace/`, `item/`, or `.beskid/docs/` has a
dot-prefixed segment below that root, the registry SHALL refuse to browse the
artifact, and every browse route for that version SHALL answer not-found. A
traversal path, a
hidden path, an unknown path, a yanked version, or a private package requested
by a non-owner SHALL answer with the same not-found response. A file read SHALL
report `encoding: "utf-8"` with its text, `encoding: "binary"` without bytes
when the entry contains a NUL byte or is not UTF-8, or `encoding: "too-large"`
with the byte limit when the entry exceeds the 1 MiB browse read limit.

**Stable ID:** `BSP-REQ-PCKG-ARTIFACT-FILES-001`

#### Scenario: Listing follows `latest` to the concrete release

- **GIVEN** package `Public.Demo` has releases `1.0.0` and a yanked `2.0.0`
- **WHEN** a client requests `/api/packages/Public.Demo/versions/latest/files`
- **THEN** the response lists every visible entry of the `1.0.0` artifact and
  reports `version: "1.0.0"`

#### Scenario: Binary and traversal reads are guarded

- **GIVEN** the artifact contains `assets/logo.bin` with a NUL byte
- **WHEN** a client reads `files/content?path=assets%2Flogo.bin`
- **THEN** the response carries `encoding: "binary"` and `content: null`
- **WHEN** a client reads `files/content?path=src%2F..%2Fpackage.json`
- **THEN** the registry answers not-found

### Requirement: Registry-owned NodeBB discussion category

The registry SHALL own every link between a package and its NodeBB
discussion thread (topic). When the integration is configured
(`PCKG_NODEBB_API_URL`, `PCKG_NODEBB_BOT_TOKEN`, `PCKG_NODEBB_PACKAGES_CID`,
`PCKG_COMMUNITY_URL` all set), the registry SHALL ensure exactly one NodeBB
topic in the configured "Packages" category when a public package is created:
it SHALL first adopt an existing topic of that category whose title equals
the package name and whose author is the bot user (looked up through the
token's own identity), and SHALL open a new topic only when none exists.
Topics authored by other users SHALL never be adopted. A new topic is titled
with the package name and carries a Markdown opening post with the package
description (when present), its kind, and links to the package page, its
files page and its documentation page. `PCKG_NODEBB_BOT_TOKEN` SHALL be the
user-bound Write API token of a dedicated bot user, sent as a bearer token;
the registry SHALL serialize every bot write. The registry SHALL persist the
topic id and slug on the package; the slug SHALL accept ASCII alphanumerics
and `-`, `.`, `_`, `~`, `/` (NodeBB keeps dots), be at most 255 bytes and
carry a positive topic id. The registry SHALL expose the public topic URL
(`<PCKG_COMMUNITY_URL>/topic/<id>/<slug>`) as `community.url`, with
`community.topicId` and `community.topicSlug`, on package summaries. A
partially configured integration SHALL be a startup error. A NodeBB failure
SHALL NOT fail package creation; the registry SHALL record a
`community_sync_failed` activity and SHALL leave `community` absent. A write
that NodeBB answers with HTTP 202 (post queue) SHALL be treated as a failure
of that kind: no identity SHALL be persisted and the reconcile path SHALL
retry it.

Every successfully created version of a linked public package SHALL be
announced as a reply to the package thread with links to that version's files
and documentation pages. A NodeBB failure SHALL NOT fail the publish; the
registry SHALL record a `community_sync_failed` activity for that version.
Private packages SHALL have no thread and no announcements; re-uploading an
identical version SHALL NOT post a second announcement.

A super-administrator SHALL be able to link missing threads for public
packages through `POST /api/admin/community/reconcile`, with the same
adopt-before-create rule; the route SHALL be idempotent and SHALL never open
a second thread for a linked package. `GET /api/packages/{name}/community`
SHALL return the link with live `replyCount` and `viewCount` and the newest
posts (`recentPosts`: at most three entries, newest first, each with `pid`,
`author`, `postedAtUtc`, a plain-text `excerpt` of at most 200 characters
with HTML and Markdown stripped, and a `url` permalink
`<PCKG_COMMUNITY_URL>/post/<pid>`), all read server-side from the NodeBB
Read API and reused for about one minute per topic. Counters SHALL be `null`
and `recentPosts` empty when NodeBB cannot be read. The route SHALL answer
not-found for unlinked, private-to-others, or unconfigured packages. Clients
SHALL NOT derive community URLs from package names and SHALL NOT call NodeBB
directly.

**Stable ID:** `BSP-REQ-PCKG-COMMUNITY-CATEGORY-001`

#### Scenario: Public package creation opens one thread

- **GIVEN** the integration is configured with category `9` and no thread
  titled `Acme.Math` exists
- **WHEN** a publisher creates public package `Acme.Math`
- **THEN** the registry opens topic `Acme.Math` in category `9`, stores its
  id and slug, and `GET /api/packages/Acme.Math` reports
  `package.community.url` as `<PCKG_COMMUNITY_URL>/topic/<id>/<slug>`

#### Scenario: An existing bot thread is adopted, a human thread is not

- **GIVEN** category `9` already holds topic `13/acme.math` titled
  `Acme.Math` by the bot user and topic `11/acme.math` titled `Acme.Math` by
  another user
- **WHEN** a publisher creates public package `Acme.Math`
- **THEN** no topic is created and the package is linked to topic `13`

#### Scenario: Dotted slugs persist

- **GIVEN** NodeBB answers topic creation with slug `41/beskid.templates.console`
- **WHEN** public package `beskid.templates.console` is created
- **THEN** `package.community.topicSlug` is `41/beskid.templates.console`

#### Scenario: Each release is announced in the thread

- **GIVEN** `Acme.Math` is linked to topic `41`
- **WHEN** versions `1.0.0` and `1.1.0` are published and `1.1.0` is uploaded
  again with identical bytes
- **THEN** exactly two replies are posted to topic `41`, each linking the
  version's files and documentation pages

#### Scenario: Recent posts are served from the registry

- **GIVEN** topic `41` has posts by `octocat` and the bot
- **WHEN** a client requests `GET /api/packages/Acme.Math/community`
- **THEN** `recentPosts` lists the newest posts with author, timestamp,
  plain-text excerpt and `<PCKG_COMMUNITY_URL>/post/<pid>` permalinks, and a
  second request within a minute is served from the registry cache

#### Scenario: Queued writes are not linked until reconcile succeeds

- **GIVEN** NodeBB answers topic creation with HTTP 202
- **WHEN** a publisher creates public package `Queued.Demo`
- **THEN** creation succeeds, `package.community` is absent and a
  `community_sync_failed` activity names the post queue
- **WHEN** a super-administrator calls `POST /api/admin/community/reconcile`
  after the bot user is exempted from the queue
- **THEN** the response lists `Queued.Demo` under `linked`

#### Scenario: NodeBB outage never blocks creation or publication and is repaired later

- **GIVEN** NodeBB rejects topic creation and replies
- **WHEN** a publisher creates public package `Late.Demo` and publishes `1.0.0`
- **THEN** both succeed and `package.community` is absent
- **WHEN** a super-administrator calls `POST /api/admin/community/reconcile`
  after NodeBB recovers
- **THEN** the response lists `Late.Demo` under `linked` (adopting the
  thread if NodeBB had opened it) and a second call links nothing further

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

The migrated records name files of the retired .NET registry (`Services/*.cs`, `Components/Pages/**/*.razor.cs`, `tests/Unit/*Tests.cs`). Those files no longer exist. The current implementation anchors are:

| Area | Location |
| --- | --- |
| Client API, CLI, pack | `compiler/crates/beskid_pckg/src/` (`lib.rs`, `client.rs`, `cli.rs`, `pack.rs`, `api_doc.rs`) |
| Artifact validation and browsing | `compiler/crates/beskid_pckg_artifacts/src/` (`browse.rs`, `zip_support.rs`) |
| HTTP routes | `compiler/crates/beskid_pckg_server/src/` (`artifact_routes.rs`, `packages.rs`, `community.rs`, `admin_routes.rs`) |
| Persistence | `compiler/crates/beskid_pckg_store/` |
| Wire contract types | `compiler/crates/beskid_pckg_contract/` |
| Server verification | `compiler/crates/beskid_pckg_server/tests/` (`artifact_http.rs`, `community_http.rs`, `package_contract.rs`) |
| Website | `beskid_sites/apps/pckg/src/` (`routes/_public/packages/`, `routes/_public/docs/`, `components/docs/`, `components/files/`) |

### Source Record: pckg client contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/registry-client/pckg-client-contract/`  
**Source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/content.md`  
**SHA-256:** `864c73fb43cef0388cc6a8fdae95bf25be89d371da8ce07c4bd527bf283b6145`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`pckg client contract` defines one operational contract that a newcomer can follow end-to-end: first the model, then execution flow, then strict guarantees, concrete examples, and verification guidance.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Public client API in `compiler/crates/beskid_pckg/src/lib.rs`
- HTTP and auth flows in `compiler/crates/beskid_pckg/src/client.rs`
- CLI integration in `compiler/crates/beskid_pckg/src/cli.rs`
- Package dashboard behavior in `compiler/crates/beskid_pckg_server/Components/Pages/Dashboard/Packages.razor.cs`
</SpecSection>

<SpecSection title="Decisions" id="decisions">
No open decisions. **`D-TOOL-PCKG-0001`** (hub authority), **`0002`** (registry-assigned versions), **`0005`** (`api.json` **`symbolKey`** validation)—see **`adr/`** and the **ADRs** tab.
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-TOOL-PCKG-0001` … `D-TOOL-PCKG-0005`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Contracts and edge cases](./articles/contracts-and-edge-cases/)
- [Design model](./articles/design-model/)
- [Examples](./articles/examples/)
- [FAQ and troubleshooting](./articles/faq-and-troubleshooting/)
- [Flow and algorithm](./articles/flow-and-algorithm/)
- [Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Hub authority

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/registry-client/pckg-client-contract/adr/0001-hub-authority/`  
**Source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/adr/0001-hub-authority/content.md`  
**SHA-256:** `16eeeaea148e9201cc4c515fbb8b107ed86466a2f99bd5781411990eaa2c1b63`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

One client story.

## Decision

Hub owns HTTP and auth.

## Consequences

Extension defers.

## Verification anchors

beskid_pckg; pckgClient.
``````

</details>

### Source Record: Registry versions

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/registry-client/pckg-client-contract/adr/0002-registry-assigned-versions/`  
**Source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/adr/0002-registry-assigned-versions/content.md`  
**SHA-256:** `b202b1e7377a19ac989aefe5f1b07e702cf42377fa2db20c4d287616385c0a84`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Manual semver drift.

## Decision

Registry-assigned publish versions in routine flows.

## Consequences

UI shows server version.

## Verification anchors

publish API tests.
``````

</details>

### Source Record: api.json symbolKey pack validation

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/registry-client/pckg-client-contract/adr/0005-api-json-symbol-key-validation/`  
**Source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/adr/0005-api-json-symbol-key-validation/content.md`  
**SHA-256:** `dd618229faa546df91192be63fb37ac8dc9a4e66451d51f81bca590fd6bf5aa9`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Registry ingestion already validates graph navigation (`parentId`, `refItemId`, package-relative paths). With registry-backed **`symbolKey`** on v4 rows, pack-time validation must catch malformed or duplicated keys before artifacts reach the docs UI.

## Decision

`validate_packed_api_doc` **must** run **`validate_symbol_keys`** for `schemaVersion >= 4` graph artifacts. When `symbolKey` is present on an item:

| Check | Rule |
| --- | --- |
| Non-empty | Reject blank strings |
| Package prefix | Must contain `::` (package-prefixed canonical form) |
| Uniqueness | Reject duplicate `symbolKey` values across items |
| Leaf consistency | Lenient check: obvious mismatch between `symbolKey` leaf segment and `qualifiedName` leaf **may** reject when unambiguous |

Absence of `symbolKey` on any row **remains valid** (backward compatibility with pre-registry emitters).

## Consequences

- Implementation: `compiler/crates/beskid_pckg/src/api_doc.rs`
- Operators re-pack with a current `beskid doc` / CLI to populate keys on new publishes; old `.bpk` files without keys still ingest.

## Verification anchors

- `compiler/crates/beskid_pckg/src/api_doc.rs` unit tests (accept distinct keys, reject duplicate / malformed, accept omitted field)
``````

</details>

### Source Record: Contracts and edge cases

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/registry-client/pckg-client-contract/articles/contracts-and-edge-cases/`  
**Source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/articles/contracts-and-edge-cases/content.md`  
**SHA-256:** `a3542b970f3ebed643de20b370ee2db7151d7ff25634288586abcf0887d76556`

<details>
<summary>Migrated source text</summary>

``````markdown
## Contracts

- **HTTPS in production** — Operators **should** configure `BESKID_PCKG_URL` with TLS endpoints; clients honor redirects per reqwest defaults.
- **Auth mutual exclusion** — Bearer and API key flags **must not** be combined on one invocation.
- **Structured `api.json`** — Library packs **should** include compiler-emitted `.beskid/docs/api.json` as the docs UI contract (see **[api.json contract](/platform-spec/tooling/cli/api-json-contract/)**). When **`symbolKey`** is present on v4 rows, pack validation **must** enforce registry invariants ([D-TOOL-PCKG-0005](/platform-spec/tooling/registry-client/pckg-client-contract/adr/0005-api-json-symbol-key-validation/)).
- **Readme artifact name** — Packed readmes **must** appear as root `README.md` in the zip for dashboard listing.
- **Template discriminator** — Template packs **must** set `packageKind: template` and ship `.beskid/template.json`.

## Edge cases

| Case | Behavior |
| --- | --- |
| Missing `Project.proj` at pack root | Defaults to library profile without template metadata |
| Invalid `api.json` graph / symbolKey | `validate_packed_api_doc` rejects before ingest (duplicate or malformed **`symbolKey`**, broken `parentId`, absolute paths) |
| Missing auth on publish | `MissingAuthToken` before HTTP |
| Large trees | Walkdir-based collection; operators exclude build outputs via manifest/layout conventions |
| `iconUrl` on publish | Server validates HTTP(S) URLs and length caps (`PackageManifestMetadata`) |

## Server rejection mirrors

Client-side pack **should** prevalidate paths the server will reject (docs layout, workspace member consistency) to avoid wasted uploads; integration tests live in `compiler/crates/beskid_pckg_server/tests/`.
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/registry-client/pckg-client-contract/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/articles/design-model/content.md`  
**SHA-256:** `4529f877e3e6f438814b57a2b46d888128d3103dbc42f1df1fb8391b37c56184`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

`beskid_pckg` is the single HTTP client for the **pckg** registry service. The CLI exposes it as `beskid pckg <subcommand>`; analysis-time fetch uses the same `PckgClient` types. Server behavior for published artifacts is implemented in `compiler/crates/beskid_pckg_server/` (validation, docs ingestion, workspace bundles).

## Component model

```mermaid
flowchart LR
  CLI[beskid pckg CLI]
  Client[PckgClient]
  CFG[PckgClientConfig]
  HTTP[reqwest]
  SVC[pckg Server API]
  CLI --> Client
  CFG --> Client
  Client --> HTTP --> SVC
```

| Piece | Role |
| --- | --- |
| **`PckgClientConfig`** | `base_url`, timeout, `user_agent`, auth (`BearerToken` or `PublisherApiKey`) |
| **`PckgClient`** | JSON and multipart request builders with unified `PckgError` mapping |
| **`pack` module** | Walk tree → zip `.bpk`, inject `README.md`, build `package.json` (`PackProfile`) |
| **Repository config** | `.beskid/pckg/repositories.json` maps registry aliases to API keys |

## Authentication

Authenticated routes **must** receive either:

- `BESKID_PCKG_TOKEN` / `--bearer-token`, or
- `BESKID_PCKG_API_KEY` / `--api-key` (header name from config, used for publisher keys)

Missing auth on `require_auth` endpoints returns `PckgError::MissingAuthToken` without contacting the network.

## Pack profiles

| Profile | Detection | `package.json` |
| --- | --- | --- |
| **Library** | Default or non-`Template` `Project.proj` | Includes docs paths, `api.json` when present under `.beskid/docs/` |
| **Template** | `project.type = Template` | `packageKind: template` + summary from `.beskid/template.json` |

Readme resolution uses `discover_readme_for_package_root` from `beskid_analysis` (optional `readme` key or default `readme.md`).

## Server-side counterparts

| Concern | pckg path |
| --- | --- |
| Publish validation | `compiler/crates/beskid_pckg_server/Services/PackageArtifactValidator.cs` |
| Docs + `api.json` | `compiler/crates/beskid_pckg_server/Services/PackagePublishDocumentation.cs` |
| Workspace bundles | `compiler/crates/beskid_pckg_server/Services/Workspace/WorkspacePublishService.cs` |
| Dashboard listing | `compiler/crates/beskid_pckg_server/Components/Pages/Dashboard/Packages.razor.cs` |

## Implementation anchors

- `compiler/crates/beskid_pckg/src/lib.rs`, `client.rs`, `cli.rs`, `pack.rs`
- Models: `compiler/crates/beskid_pckg/src/models.rs`, `packages.rs`
``````

</details>

### Source Record: Examples

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/registry-client/pckg-client-contract/articles/examples/`  
**Source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/articles/examples/content.md`  
**SHA-256:** `49200f8160b8136fe34413f7c7cc42b2418f99e58d5d229d35072ef8100b1ca7`

<details>
<summary>Migrated source text</summary>

``````markdown
## Pack a library project

```bash
beskid pckg pack --project compiler/corelib/beskid_corelib/Project.proj
```

Produces a `.bpk` with `README.md`, sources, and `.beskid/docs/` when present.

## Publish with API key

```bash
export BESKID_PCKG_URL=https://pckg.example/
export BESKID_PCKG_API_KEY=...
beskid pckg upload path/to/package.bpk
```

Exact subcommand names follow `PckgCommand` in `cli.rs` (use `beskid pckg --help` in installed CLI).

## Repository config file

`.beskid/pckg/repositories.json`:

```json
{
  "repositories": {
    "default": { "api_key": "..." }
  }
}
```

Maps to registry aliases in `Workspace.proj`.

## Corelib publication

The **`corelib`** package identity uses the same `beskid pckg` client stack as other package publication.
``````

</details>

### Source Record: FAQ and troubleshooting

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/registry-client/pckg-client-contract/articles/faq-and-troubleshooting/`  
**Source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/articles/faq-and-troubleshooting/content.md`  
**SHA-256:** `c1d06f1d6a9b0f052e0f489797e1a2296627434922e47ec7307e08758a5e3b7a`

<details>
<summary>Migrated source text</summary>

``````markdown
## 401 / MissingAuthToken

Set `BESKID_PCKG_API_KEY` or bearer token. For multi-registry setups, ensure `.beskid/pckg/repositories.json` keys match `Workspace.proj` registry alias names.

## Pack missing docs on pckg site

Run `beskid doc --project ...` before pack so `.beskid/docs/api.json` exists. Server ingestion (`PackagePublishDocumentation`) treats that tree as first-class.

## Template pack rejected

Verify `project.type = Template`, `.beskid/template.json` (`beskid.template.v1`), and `packageKind: template` in generated `package.json`.

## Wrong package version after publish

Registry assigns versions in normal flows—do not expect local `project.version` alone to drive the published label. Query the server for the assigned version summary.

## Local dev server URL

Default `https://pckg.beskid-lang.org` points at the public registry; override with `BESKID_PCKG_URL` for local compose (`http://127.0.0.1:8082`) or other hosts.
``````

</details>

### Source Record: Flow and algorithm

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/registry-client/pckg-client-contract/articles/flow-and-algorithm/`  
**Source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/articles/flow-and-algorithm/content.md`  
**SHA-256:** `6527900c9219ba5eca67eaba2986a017114026bb60278198a4937764a857fbaa`

<details>
<summary>Migrated source text</summary>

``````markdown
## `beskid pckg pack` algorithm

```mermaid
flowchart TD
  A[Resolve source root] --> B[detect_pack_profile]
  B --> C[collect_pack_entries walk]
  C --> D[apply_pack_readme]
  D --> E[build_package_json]
  E --> F[ZipWriter + SHA256]
  F --> G[.bpk artifact]
```

1. Read `Project.proj` when present; choose `PackProfile::Library` or `Template`.
2. Walk files (respect template exclude strips via `strip_template_pack_excludes`).
3. Include `.beskid/docs/**` and package docs for library profiles.
4. Copy resolved readme to zip root `README.md` when not already present.
5. Emit `package.json` metadata with the exact artifact version selected by the pack or coordinated release plan.

## Publish / upload

1. Build or locate `.bpk` bytes.
2. `PckgClient::send_multipart` sends artifact-bound `version`, `checksumSha256`, and `.bpk` bytes to `POST /api/packages/{name}/versions` with publisher auth.
3. Server runs `PackageArtifactValidator` + documentation ingestion; failures return structured API errors mapped to `PckgError::Api`.

## Fetch into workspace

`beskid fetch` (CLI command in `beskid_cli`) uses registry URLs from the `.bws` workspace manifest and downloads through `PckgClient`, writing materialized roots recorded later in `Project.lock`. Resolution selects published artifact versions and records exact pins in the lockfile.

## Version state file

Pack may persist local version hints in `.beskid/pckg` state (`PackVersionState`) for iterative development. A publisher must choose exact versions before packing and upload those artifact-bound versions unchanged.

## Error handling

All HTTP failures surface as `PckgError` with status, message, and optional body text suitable for `--verbose` CLI output.
``````

</details>

### Source Record: Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/registry-client/pckg-client-contract/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/tooling/registry-client/pckg-client-contract/articles/verification-and-traceability/content.md`  
**SHA-256:** `8e3169375c1155d615be1d82d05ebef8f793ad3726d97a4431ed6aee2cc6535a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Client / compiler

| Area | Location |
| --- | --- |
| Pack profile detection | `beskid_pckg/src/pack.rs` unit tests |
| CLI wiring | `beskid_pckg/src/cli.rs` |
| Workspace fetch integration | `beskid_tests` pipeline + fetch scenarios |

## pckg server

| Area | Location |
| --- | --- |
| Artifact validation | `compiler/crates/beskid_pckg_server/tests/Unit/PackageArtifactValidatorTests.cs` |
| Publish documentation | `compiler/crates/beskid_pckg_server/tests/Unit/PackagePublishDocumentationTests.cs` |
| Workspace publish | `compiler/crates/beskid_pckg_server/tests/Integration/WorkspacePublishIntegrationTests.cs` |
| Manifest metadata | `compiler/crates/beskid_pckg_server/tests/Unit/PackageManifestMetadataReaderTests.cs` |

## Traceability

| Contract | Verification |
| --- | --- |
| `README.md` zip entry | Pack tests + server doc browser smoke |
| `api.json` primary docs model | Publish documentation tests |
| Template `packageKind` | `detect_pack_profile` + server template validators |
| Registry-assigned versions | Server API integration (no client-side version override during publication) |

Spec edits **must** stay aligned with `PackageManifestMetadata` and workspace provisioning changes in `compiler/crates/beskid_pckg_server/Services/Workspace/`.
``````

</details>
