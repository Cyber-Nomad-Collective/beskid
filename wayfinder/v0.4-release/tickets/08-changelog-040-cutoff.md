## Question

Cut the v0.4.0 CHANGELOG — move the Unreleased section into a `[0.4.0]` release entry, date-stamp it, and ensure all notable changes since the last release are accurately captured.

The root `CHANGELOG.md` has a long Unreleased section. For the 0.4.0 release:
1. Review the Unreleased entries for accuracy and completeness
2. Move them under a `[0.4.0] - YYYY-MM-DD` heading
3. Ensure the format follows Keep a Changelog
4. Add any missing entries from the v0.4 closure window (up to the final commit)

## Constraints

- Follow Keep a Changelog format (the file already uses it)
- Version number is `0.4.0`
- Date should be the actual release date, not a placeholder
- Do not remove any entry that belongs to 0.4; defer anything post-0.4 to a new Unreleased section

## Resolution

**Resolved 2026-08-11.** `CHANGELOG.md` contains:

- `[0.4.0] - 2026-08-06` entry with grouped `Added`/`Fixed` sections
- Retained `Unreleased` for post-0.4 changes
- v0.4 scope text present for compiler, runtime, corelib, and tracker/platform-spec work

This ticket satisfies the "cut-and-date" requirement; remaining cleanup is constrained to correctness review of scope-owned entries, not format shape.
