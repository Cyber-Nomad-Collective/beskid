## What and why

<!-- What does this change, and what problem does it solve? Link the Tracker item or issue. -->

## Kind of change

- [ ] Bug fix
- [ ] Behaviour change (needs an OpenSpec change)
- [ ] Standard only (`openspec/`)
- [ ] Documentation (Book, Docs, guides)
- [ ] CI, scripts or infrastructure
- [ ] Submodule pointer bump

## Standard

- [ ] No observable behaviour changes, or
- [ ] OpenSpec change: `openspec/changes/<name>/`

## Checks run locally

<!-- Paste the commands you ran and their result. Say what you did not run. -->

- [ ] `just gate`
- [ ] `pnpm openspec:validate`
- [ ] Focused tests of the owning repository: <!-- which -->
- [ ] `./validate-ci-local.sh` (web and docs changes)

## Bookkeeping

- [ ] `CHANGELOG.md` entry
- [ ] Glossary wiki updated, or no canonical term changed
- [ ] `pnpm openspec:catalog` run after editing a catalogued root document
- [ ] Submodule changes are pushed to their own repositories first
- [ ] No secrets, no `Co-authored-by` trailers

## Notes for reviewers

<!-- Risks, follow-ups, anything you want a second pair of eyes on. -->
