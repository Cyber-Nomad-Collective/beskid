## MODIFIED Requirements

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
