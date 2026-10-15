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

- pckg: `/packages` is a compact, filterable list: instant search over
  name, description and tags, kind filters with counts, sorting by name,
  update time or downloads (all in the URL), and direct Docs and Files
  links per package. Publisher and "my packages" pages use the same list.
- pckg: `/docs` is a documentation hub with a filter, the standard library
  as its own section, other libraries, project templates, and links to the
  language docs, the Book and the standard.
- pckg: the topbar shows the Beskid mark and a styled Docs / Registry
  switch; its stylesheet had never been committed, so the two modes
  rendered as plain text.

- pckg: the package page shows "Discuss on the forum" linking to the
  package's NodeBB thread with live reply/view counters and the newest
  forum posts; the client no longer
  guesses a NodeBB URL from the package name. README renders as Markdown.
- deploy: document the optional `PCKG_NODEBB_API_URL`,
  `PCKG_NODEBB_BOT_TOKEN`, `PCKG_NODEBB_PACKAGES_CID` and
  `PCKG_COMMUNITY_URL` variables for pckg community threads.

- Apply canonical Emerald Ridge branding to application icons and browser assets.

### Fixed

- pckg: the API reference shows only the package's own API. `api.json`
  carries the whole dependency closure (`declaringPackage`); dependency
  items now stay out of navigation and member tables, references to them
  open the declaring package's reference, unnamed root namespaces are not a
  tree level, and generated workspace-entry members are hidden.
- pckg: numbers and dates use a fixed locale and UTC, so server-rendered
  pages no longer differ from the browser render (React hydration error).
- pckg: the server render links the stylesheet the client build emits;
  Tailwind scans only `src`, so image builds no longer read `.output`.
