# Lazygit (Beskid)

## What lazygit can do natively

| Action | In lazygit |
|--------|------------|
| Init / update submodules | **Submodules** tab → `i` / `u`, or bulk menu `b` (includes recursive update) |
| Push already-committed submodule SHAs | Git only: `git push --recurse-submodules=on-demand` (bound to `<c-p>` in our config) |
| Stage + commit + push **all** dirty submodules | **Not built-in** — use `P` (runs [`git-commit-push-recursive.sh`](../git-commit-push-recursive.sh); lazygit is the only supported workflow) |

Upstream discussion: [lazygit #2095](https://github.com/jesseduffield/lazygit/issues/2095) (parent push after submodule) and [PR #4259](https://github.com/jesseduffield/lazygit/pull/4259) (recursive bulk init/update only).

## Install

```bash
brew install lazygit   # if needed
chmod +x scripts/git-commit-push-recursive.sh
mkdir -p ~/.config/lazygit
cp scripts/lazygit/config.yml ~/.config/lazygit/config.yml
```

Run `lazygit` from the Beskid superrepo root (`/path/to/beskid`).

## Keybindings (custom)

| Key | Action |
|-----|--------|
| `P` | Commit message → stage, commit, push every dirty repo (recursive, deepest first) |
| `C` | Same, commit only (`--no-push`) |
| `D` | Dry-run (status per repo) |
| `U` | `git submodule update --init --recursive` |
| `<c-p>` | `git push --recurse-submodules=on-demand` (superrepo push helper) |

Press `?` in lazygit to see all bindings.
