## MODIFIED Requirements

### Requirement: Registry-owned NodeBB discussion category

The registry SHALL own every link between a package and its NodeBB
discussion thread (topic). When the integration is configured
(`PCKG_NODEBB_API_URL`, `PCKG_NODEBB_ADMIN_TOKEN`, `PCKG_NODEBB_PACKAGES_CID`,
`PCKG_COMMUNITY_URL` all set), the registry SHALL open exactly one NodeBB
topic in the configured "Packages" category when a public package is created,
titled with the package name and carrying a Markdown opening post with the
package description (when present), its kind, and links to the package page,
its files page and its documentation page. The registry SHALL persist the
returned topic id and slug on the package and SHALL expose the public topic
URL (`<PCKG_COMMUNITY_URL>/topic/<id>/<slug>`) as `community.url`, with
`community.topicId` and `community.topicSlug`, on package summaries. A
partially configured integration SHALL be a startup error. A NodeBB failure
SHALL NOT fail package creation; the registry SHALL record a
`community_sync_failed` activity and SHALL leave `community` absent.

Every successfully created version of a linked public package SHALL be
announced as a reply to the package thread with links to that version's files
and documentation pages. A NodeBB failure SHALL NOT fail the publish; the
registry SHALL record a `community_sync_failed` activity for that version.
Private packages SHALL have no thread and no announcements; re-uploading an
identical version SHALL NOT post a second announcement.

A super-administrator SHALL be able to open missing threads for public
packages through `POST /api/admin/community/reconcile`; the route SHALL be
idempotent and SHALL never open a second thread for a linked package.
`GET /api/packages/{name}/community` SHALL return the link with live
`replyCount` and `viewCount` read from NodeBB, which SHALL be `null` when
NodeBB cannot be read, and SHALL answer not-found for unlinked,
private-to-others, or unconfigured packages. Clients SHALL NOT derive
community URLs from package names.

**Stable ID:** `BSP-REQ-PCKG-COMMUNITY-CATEGORY-001`

#### Scenario: Public package creation opens one thread

- **GIVEN** the integration is configured with category `9`
- **WHEN** a publisher creates public package `Acme.Math`
- **THEN** the registry opens topic `Acme.Math` in category `9`, stores its
  id and slug, and `GET /api/packages/Acme.Math` reports
  `package.community.url` as `<PCKG_COMMUNITY_URL>/topic/<id>/<slug>`

#### Scenario: Each release is announced in the thread

- **GIVEN** `Acme.Math` is linked to topic `41`
- **WHEN** versions `1.0.0` and `1.1.0` are published and `1.1.0` is uploaded
  again with identical bytes
- **THEN** exactly two replies are posted to topic `41`, each linking the
  version's files and documentation pages

#### Scenario: NodeBB outage never blocks creation or publication and is repaired later

- **GIVEN** NodeBB rejects topic creation and replies
- **WHEN** a publisher creates public package `Late.Demo` and publishes `1.0.0`
- **THEN** both succeed and `package.community` is absent
- **WHEN** a super-administrator calls `POST /api/admin/community/reconcile`
  after NodeBB recovers
- **THEN** the response lists `Late.Demo` under `linked` and a second call
  links nothing further
