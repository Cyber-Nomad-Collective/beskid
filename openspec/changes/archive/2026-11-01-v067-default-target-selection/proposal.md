## Why

On the 0.6.7 preview.8 toolchain, a command without `--target` selects a target by kind in the order App, Test, Lib. In a library project with a `lib` target and a `tests` target of `kind = Test`, `beskid build` builds the Test target as an executable and fails with `Missing entrypoint Main`. `beskid test` without `--target` takes the first Test or Lib target in manifest order: with `lib` first, it prints "No tests found." and exits with status 0, and the Test target does not run. The standard does not state a default target. Evidence: `v067-tc-corelib3` handoff, lib template probe.

## What Changes

- Without `--target`, `beskid build` and `beskid run` never select a Test target. `run` selects the App target. `build` selects the App target, or the Lib target when the manifest has no App target.
- Without `--target`, `beskid test` runs every Test target in manifest order and writes a combined summary. When the manifest has no Test target, it runs the Lib target. An App-only project runs no tests, as before.
- Two or more candidates of the selected kind, or no candidate, fail with one error that names the targets and says to pass `--target`. There is no fallback.

## Capabilities

### Modified Capabilities
- `tooling--cli--build-analyze-run-contract`, `language-meta--contracts-and-effects--testing`.

## Impact

`beskid_analysis` default target selection, `beskid build`, `beskid run` and `beskid test` in `beskid_cli`. The lib template gets a Test target. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. A project with two App targets, or two Lib targets and no App target, must now pass `--target` to `build` and `run`. A project with only Test targets must pass `--target` to `build`. There is no compatibility path.
