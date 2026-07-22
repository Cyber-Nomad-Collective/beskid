# Beskid Learn in GitHub Codespaces

This project is prepared for GitHub Codespaces and supports a rustlings-like flow:

1. Open the repo in Codespaces.
2. Wait for the container bootstrap:
   - `pnpm` installs `site/learn` dependencies.
   - `beskid_cli` compiles into `compiler/target/release/beskid`.
   - runtime-kit staging warms `compiler/target/native-runtime-kit` for `run` checks.
3. Open a terminal and run:
   - `cd /workspaces/beskid`
   - `just learn-server`
4. Open a second terminal and run:
   - `cd /workspaces/beskid/site/learn`
   - `just learn-runtime-kit` (if run checks fail in a fresh Codespace image)
   - `pnpm run lesson:check 06-parser-basics`
   - `pnpm run lesson:check 07-tree-view`
   - `pnpm run lesson:check 08-run-program`

To run all seeded lessons locally:

- `cd /workspaces/beskid/site/learn`
- `pnpm run check:all`

To validate edits:

- Edit `site/learn/curriculum/<lesson>/start.bd` directly.
- Run `pnpm run lesson:check <lesson-slug>`.
