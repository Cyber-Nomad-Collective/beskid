# Corelib linked-worktree recovery research

## Finding

The broken checkout is `compiler-v05-foundations-runtime/corelib`, not the
primary `compiler/corelib` checkout.  The compiler worktree pins corelib at
`16533d4b1ccb47cc8f3b9561f5f70c9f47c3243e` and reports it as uninitialized
(`-16533d4…`).  Its populated directory has no `.git` gitfile.

The correct administrative repository is worktree-specific:

```
.git/modules/compiler/worktrees/compiler-v05-foundations-runtime/modules/corelib
```

It contains the pinned commit, has `HEAD` on
`refs/heads/codex/v05-foundations-io`, and its `core.worktree` points at the
populated directory.  This is distinct from
`.git/modules/compiler/modules/corelib`, which backs `compiler/corelib`; that
repository does *not* contain `16533d4…` and is at `742c0d1…`.

The configured `beskid_standard` remote advertises `main` at `ad8d0b5…` and
does not advertise the v0.5 branch.  GitHub's commit endpoint also returned
422 for `16533d4…`.  No fetch is necessary for the v0.5 repair because the
needed object is already present in its worktree-specific module repository.
Do not try to fetch, initialize, or copy objects through the primary module
repository.

## Content-risk assessment

Against the v0.5 module's present index, the populated directory has 19
modified/deleted tracked entries, two non-`obj/` untracked entries, and 523
`obj/` untracked build artifacts.  This comparison is only a diagnostic
baseline; without its `.git` gitfile it cannot establish which changes are
intentional.  Preserve the entire directory before initialization and restore
nothing automatically.

## Recoverable procedure

Run from the repository root.  Every prerequisite is read-only and must pass;
if one fails, stop without changing files.

```bash
parent=compiler-v05-foundations-runtime
path="$parent/corelib"
module_gitdir="$(git -C "$parent" rev-parse --git-path modules/corelib)"
pin=16533d4b1ccb47cc8f3b9561f5f70c9f47c3243e

test -d "$path" && test ! -e "$path/.git"
test "$(git -C "$parent" ls-tree HEAD corelib | awk '{print $3}')" = "$pin"
test "$(git --git-dir="$module_gitdir" rev-parse HEAD)" = "$pin"
git --git-dir="$module_gitdir" cat-file -e "$pin^{commit}"
test "$(git --git-dir="$module_gitdir" config --get core.worktree)" = '../../../../../../../compiler-v05-foundations-runtime/corelib'
```

First create an independent, byte-preserving copy, then quarantine the
original with a rename; neither command removes the only copy of content.
Choose a new timestamp rather than reusing an existing path.

```bash
stamp=$(date +%Y%m%d-%H%M%S)
backup="../corelib-v05-pre-repair-$stamp"
quarantine="$parent/corelib.pre-repair-$stamp"
test ! -e "$backup" && test ! -e "$quarantine"
ditto "$path" "$backup"
mv "$path" "$quarantine"
```

Only after both preserved copies exist, recreate the submodule worktree using
the locally verified object.  `--no-fetch` is deliberate: it prevents an
unrelated remote update and fails closed if the object is not local.

```bash
git -C "$parent" submodule update --init --no-fetch corelib
test -f "$path/.git"
git -C "$path" rev-parse HEAD
git -C "$path" status --short
```

The expected `HEAD` is the pin and the new checkout should be clean.  Review
the preserved content before selectively reapplying source changes; do not
copy back `obj/` artifacts:

```bash
git diff --no-index --no-ext-diff -- "$path" "$quarantine" || true
```

Retain both `$backup` and `$quarantine` until a maintainer has reviewed the
diff and validated the worktree.  They are the rollback path: rename the new
`$path` aside and rename `$quarantine` back if initialization is wrong.

## If the target object is actually absent

Do not substitute an available commit or change the compiler gitlink.  Obtain
an advertised ref or a bundle containing the exact full SHA from the corelib
maintainer, then fetch only that ref/SHA into the *worktree-specific*
`$module_gitdir`, verify `cat-file -e "$pin^{commit}"`, and resume at the
preservation step.  The current evidence does not require that path.

## Evidence

Primary evidence was local Git metadata: `git -C compiler-v05-foundations-runtime
submodule status corelib`, `git ls-tree HEAD corelib`, the worktree module's
`config`, `show-ref`, and `cat-file`.  Remote availability was checked with
`git ls-remote https://github.com/Cyber-Nomad-Collective/beskid_standard.git`
and GitHub's commit API for the abbreviated SHA.
