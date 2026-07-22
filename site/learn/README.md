# Beskid Learn

Interactive learning surface for the Beskid language.

## Public deployment target

`learn.beskid-lang.org` uses image `ghcr.io/cyber-nomad-collective/beskid-learn`.

## Local development

- Install packages:
  - `cd site/learn`
  - `pnpm install`
- Start frontend only (hot reload):
  - `pnpm run dev --port 4173`
- Start full compiler-backed loop (requires Rust toolchain once):
  - `cd ..`
  - `just learn-deps`
  - `just learn-server`

### GitHub Codespace workflow

- Edit lesson files directly in `site/learn/curriculum/<lesson>/start.bd`.
- Check a single lesson from terminal:
  - `cd site/learn`
  - `pnpm run lesson:check 01-hello-beskid`
- Check all seeded lessons:
  - `cd site/learn`
  - `pnpm run check:all`
- Start the browser UI using the checked binary:
  - `cd site/learn`
  - `BESKID_BINARY=../../compiler/target/release/beskid pnpm run start`

Run with `BESKID_BINARY` explicitly whenever possible so the endpoint uses the prebuilt
`beskid` CLI binary (faster and deterministic).

## Runtime modes

This lane is Rustlings-like:

- Monaco editor for edits.
- Xterm terminal for real compiler diagnostics.
- API-driven checks via `POST /api/check` backed by `beskid analyze`/`tree`/`parse` on demand.

The check request writes learner code to a temporary workspace file and runs the Beskid CLI.
If `BESKID_BINARY` is set, that binary is invoked directly; otherwise
`cargo run -p beskid_cli` is used.

If you use `cargo run`, ensure the server runs from the repo root or set `BESKID_REPO_ROOT`
to a checkout that contains both `/compiler/Cargo.toml` and `/site/learn`.

## Deploy and smoke test

- The service image is built by `site/learn/Dockerfile` and deployed via Coolify lane `learn`.
- Production domain is `https://learn.beskid-lang.org`.
- Smoke checks:
  - `curl -I https://learn.beskid-lang.org`
  - `curl -s https://learn.beskid-lang.org/api/health`
  - `curl -s https://learn.beskid-lang.org/api/check -H 'content-type: application/json' -d '{"exerciseId":"01_hello_beskid","code":"i32 Main() {\\n  return 0;\\n}","command":"analyze"}'`

For a guided setup in Codespaces, follow [CODESPACES.md](CODESPACES.md).

## Exercises

The exercise list lives in `src/data/learningCatalog.ts` and is mirrored by files in
`curriculum/`.

Each lesson uses a concrete command from the Beskid CLI:

- `analyze` (compiler mode)
- `parse` (syntax parse validation)
- `tree` (syntax-tree generation)
- `run` (runtime execution check with a simple exit code check)

The seeded project includes one lesson per command mode so the tour can be taught without
changing external tooling.

This mirrors rustlings-style validation: code must pass real diagnostics before moving on.

## Extensibility

- Add an exercise by appending to `src/data/learningCatalog.ts`.
- Add richer lesson files by adding a per-exercise folder and returning
  exercise-specific starter text + expected pass criteria.
