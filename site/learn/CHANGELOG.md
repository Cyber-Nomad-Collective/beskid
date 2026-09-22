# Changelog

## [Unreleased]
### Added

- Define the manifest-backed Markdown curriculum contract and deterministic
  generated Learn catalog pipeline.
- Surface source-backed reference-only lessons without exposing a misleading
  compiler check.
- Add an evidence-informed curriculum-authoring research note covering the
  Predict–Run–Investigate–Modify–Make lesson progression, worked examples,
  subgoal labels, retrieval, and compiler-feedback design.

### Changed

- Make the Learn workspace fill the viewport and combine course progress with
  lesson selection in one responsive learning navigator.
- Apply canonical Emerald Ridge branding to application icons and browser assets.
- Require ordered prerequisite edges, explicit context briefs, and declared
  availability and acceptance metadata in the authored curriculum.
- Generate the Learn catalog through the repository's Biome formatter.

### Fixed

- Keep Learn smoke examples aligned with manifest lesson IDs and prevent
  reference-only material from being recorded as completed lessons.
