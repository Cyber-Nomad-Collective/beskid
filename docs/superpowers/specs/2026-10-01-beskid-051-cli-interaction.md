# Beskid 0.5.1 CLI interaction and template quality

## Intent and scope

Beskid 0.5.1 removes `beskid hi` and every full-screen terminal UI except
`beskid graph`. Ordinary commands use line-oriented prompts and output. TTY
users keep progress bars and nested phase trees; redirected output and
`--plain` remain deterministic. The release also repairs first-party templates
so a newly generated project can be built and, when executable, run without
manual renaming or lockfile repair. The pckg documentation browser must display
files already present in valid published artifacts instead of a false empty
state. These fixes ship through every maintained 0.5.1 distribution channel.

The existing 0.5.0 CLI is the regression baseline, not an acceptance target.
The source baseline is root `abfe7d6b`, compiler `44a07aed`, and first-party
templates `33fce0b`. Work happens in isolated branches/worktrees and does not
rewrite the user's generated projects.

## CLI interaction contract

1. `beskid hi` is absent from command discovery and dispatch. Its shell,
   palette, widgets, board editor, and exclusive dependencies are removed from
   production compilation. Old `hi` invocations fail with the ordinary unknown
   subcommand response; there is no compatibility alias or hidden fallback.
2. `new` uses ordinary line prompts for missing symbols and confirmation. A
   confirmed overwrite has the same scoped write authority as `--force`; a
   declined or noninteractive conflict leaves existing files unchanged. No
   `new --tui` picker remains.
3. Build, analyze, run, test, lock, fetch, update, package, and related project
   commands never enter the alternate screen, enable raw terminal input, or
   wait for a keypress after work finishes. Interactive stderr may show bounded
   in-place progress bars; phase/work-unit trees and final summaries remain
   readable after completion. `--plain`, non-TTY, and CI output are stable
   newline-delimited text with no cursor-control codes.
4. REPL uses line input and output in both TTY and non-TTY modes. `beskid graph`
   alone retains its current TUI and `--tui` behavior, including Mermaid and
   file-output alternatives. Shared CLI cleanup must not break graph display.
5. Telemetry/debug logging cannot interleave raw UI frames with prompts or
   progress. Command results and errors have correct exit status even after a
   prompt, cancelled operation, or child post-action.

## Template contract

1. Every first-party template substitutes symbols in both file contents and
   every output path component before writing. No generated filename may
   contain a `{{...}}` token. Unresolved or unsafe paths fail before any write.
2. `new` writes the final manifest name before `beskidLock` runs. A fresh v2
   `Project.lock` names that exact manifest and resolves the verified Corelib
   closure. After moving the project, locked replay still succeeds. Confirmed
   overwrite does not leave a lockfile for a different project.
3. `console`, `host`, `fiber-demo`, and the workspace-demo app use current
   Beskid syntax and build/run on each supported platform. `lib` builds as a
   library without requiring `Main`; item/project templates pass the appropriate
   parse/manifest contract. The release may repair compiler behavior where a
   valid template exposes a compiler defect; it must not weaken the template
   acceptance check to make a broken template appear green.
4. The template quality gate generates with non-default names, checks emitted
   filenames and lock ownership, parses/analyzes all applicable projects, then
   builds and runs executable examples. Packaging and publication depend on
   that gate. Tests distinguish template failures from unavailable Corelib,
   runtime kit, linker, or registry service.

## Package documentation contract

A validated package artifact may contain safe non-browsable entries such as
`Project.lock`, `tests/`, `grammars/`, icons, or build metadata. The browser
indexes only allowed documentation and source paths without rejecting the
entire artifact for those unrelated entries. Hidden or traversal paths under
browsable roots remain inaccessible. The pckg page displays loading and
request-failure states separately from a genuinely empty list. Published
`corelib` 0.1.2 README and docs must be browseable after deployment.

## Verification and release gates

- Automated unit/integration tests cover each changed path, including a
  previously failing 0.5.0 regression, graph-TUI preservation, PTY and pipe
  behavior, failed/cancelled prompts, filename substitution, v2 lock owner,
  valid Corelib resolution, artifact browsing, and pckg error presentation.
- Agents inventory all CLI command paths. Safe local paths run on Linux with
  exact exit/output evidence; authenticated or destructive paths use isolated
  fixtures/mocks and never mutate production during testing. A path is not
  called tested merely because `--help` works.
- Linux, macOS, and Windows native build/test gates, generated-template
  build/run smoke, and maintained distribution packaging pass against pinned
  source commits. The macOS machine must have at least 20 GiB free before
  builds; heavy Linux jobs stay on the NixOS builder with at most four in
  flight; Windows uses key-only VM access.
- Publish 0.5.1 only from verified release evidence and checksums. Update
  maintained installer/package channels and editor extensions where they
  bundle or point to the CLI, and verify installed `beskid --version` plus a
  generated-project smoke test from each platform's final artifact. No
  publication claim rests solely on source tests or an uninstalled archive.

## Specification impact

Before changing observable behavior, update normative OpenSpec CLI command,
Hi, REPL, template, and package-browsing requirements/scenarios and refresh
the catalog. Retain historical provenance only as explicitly non-normative
history; no active SHALL may continue to require the removed UI.
