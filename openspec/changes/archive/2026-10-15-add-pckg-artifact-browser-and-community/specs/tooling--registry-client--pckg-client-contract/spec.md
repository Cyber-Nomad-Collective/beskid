## ADDED Requirements

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
discussion category. When the integration is configured
(`PCKG_NODEBB_API_URL`, `PCKG_NODEBB_ADMIN_TOKEN`,
`PCKG_NODEBB_PACKAGES_PARENT_CID`, `PCKG_COMMUNITY_URL` all set), the registry
SHALL create exactly one NodeBB category under the configured parent category
when a public package is created, SHALL persist the returned category id and slug on the package, and
SHALL expose the public category URL as `community` on package summaries. A
partially configured integration SHALL be a startup error. A NodeBB failure
SHALL NOT fail package creation; the registry SHALL record a
`community_sync_failed` activity and SHALL leave `community` absent. A
super-administrator SHALL be able to create missing categories for public
packages through `POST /api/admin/community/reconcile`; the route SHALL be
idempotent and SHALL never create a second category for a linked package.
`GET /api/packages/{name}/community` SHALL return the link with live
`topicCount` and `postCount`, which SHALL be `null` when NodeBB cannot be
read, and SHALL answer not-found for unlinked, private-to-others, or
unconfigured packages. Clients SHALL NOT derive community URLs from package
names.

**Stable ID:** `BSP-REQ-PCKG-COMMUNITY-CATEGORY-001`

#### Scenario: Public package creation links one category

- **GIVEN** the integration is configured with parent category `9`
- **WHEN** a publisher creates public package `Acme.Math`
- **THEN** the registry creates category `Acme.Math` under parent `9`, stores
  its id and slug, and `GET /api/packages/Acme.Math` reports
  `package.community.url` under `PCKG_COMMUNITY_URL`

#### Scenario: NodeBB outage never blocks creation and is repaired later

- **GIVEN** NodeBB rejects category creation
- **WHEN** a publisher creates public package `Late.Demo`
- **THEN** creation succeeds and `package.community` is absent
- **WHEN** a super-administrator calls `POST /api/admin/community/reconcile`
  after NodeBB recovers
- **THEN** the response lists `Late.Demo` under `linked` and a second call
  links nothing further
