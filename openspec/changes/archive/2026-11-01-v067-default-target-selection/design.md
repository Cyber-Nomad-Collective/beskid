## Context

A manifest can declare App, Lib and Test targets in any order. `check` without `--target` already checks every target. The language server and `check` use the project's default compile plan only as analysis context, and that context does not change here.

## Decision

The selection is a function of the command and the target kinds, not of the manifest order. `build` and `run` select one target: a Test target has no `Main`, and an executable built from it is never what a plain `build` means. `test` selects every Test target, because a project can split its tests over several targets and one omitted target is a silent coverage loss.

A command that names a source file uses that file as the entry, so the rule does not apply to it.

Rejected: the first target in manifest order. The result then depends on the order of blocks in the manifest. Rejected: a fallback to the first candidate when two candidates of one kind exist. The selection then hides the choice from the user.
