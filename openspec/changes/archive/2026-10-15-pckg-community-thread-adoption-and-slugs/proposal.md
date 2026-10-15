## Why

In production the registry opened a NodeBB thread for `beskid.templates.console`
and then refused to persist its slug because the link validator did not allow
dots, which NodeBB keeps in slugs; the thread was orphaned. Any failure between
thread creation and persistence had the same effect, and a retry would have
opened a second thread.

## What Changes

- **MODIFY** the NodeBB discussion requirement: the persisted topic slug may
  use the RFC 3986 unreserved characters plus `/`; before opening a thread the
  registry adopts a thread in the Packages category whose title is the package
  name and whose author is the bot user, so creation is idempotent against
  NodeBB and never produces a second thread; threads by other users are never
  adopted.

## Impact

- `beskid_pckg_store::validate_community`, `beskid_pckg_server::community`.
- No API shape change; no legacy URL migration.
