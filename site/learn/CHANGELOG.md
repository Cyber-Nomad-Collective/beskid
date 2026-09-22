# Changelog

## [Unreleased]
### Added

- Define the manifest-backed Markdown curriculum contract and deterministic
  generated Learn catalog pipeline.
- Surface source-backed reference-only lessons without exposing a misleading
  compiler check.

### Changed

- Apply canonical Emerald Ridge branding to application icons and browser assets.
- Require ordered prerequisite edges, explicit context briefs, and declared
  availability and acceptance metadata in the authored curriculum.
- Generate the Learn catalog through the repository's Biome formatter.

### Fixed

- Keep Learn smoke examples aligned with manifest lesson IDs and prevent
  reference-only material from being recorded as completed lessons.
