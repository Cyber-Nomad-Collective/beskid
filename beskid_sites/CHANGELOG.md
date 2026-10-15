# Changelog

## [Unreleased]
### Added

- pckg: `/packages/$name/files` browses the verified release artifact with
  the shared file explorer, rendered Markdown, Shiki highlighting with the
  canonical `@beskid/trudoc` Beskid grammar (HCL for BSOL manifests), and
  binary/oversized guards.
- pckg: `/docs/$package` renders the packed `api.json` as an API reference
  (module tree, per-item pages with declaration, parameters, returns,
  remarks, examples, member tables, "In this article" outline) with README
  and guide tabs.

### Changed

- pckg: the package page shows "Discuss on the forum" linking to the
  package's NodeBB thread with live reply/view counters and the newest
  forum posts; the client no longer
  guesses a NodeBB URL from the package name. README renders as Markdown.
- deploy: document the optional `PCKG_NODEBB_API_URL`,
  `PCKG_NODEBB_BOT_TOKEN`, `PCKG_NODEBB_PACKAGES_CID` and
  `PCKG_COMMUNITY_URL` variables for pckg community threads.

- Apply canonical Emerald Ridge branding to application icons and browser assets.

### Fixed

- pckg: the server render links the stylesheet the client build emits;
  Tailwind scans only `src`, so image builds no longer read `.output`.
