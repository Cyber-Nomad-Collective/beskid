# Upstream maintainer

Who owns Beskid upstream, and the working preferences recorded from sessions
with them. Most of these preferences were first written into the root
`AGENTS.md` as "Learned User Preferences". That heading probably came from an
editor's memory feature (inferred, not verified). They describe the upstream
maintainer, not every person who opens an agent session in a checkout.

## Who

- **Piotr Mikstacki** (GitHub `@pmikstacki`), author of nearly all of the
  history, under the **Cyber-Nomad-Collective** organisation.
- Public contact, as published in the Book's contributing chapter:
  `pmikstacki@cybernomad.it`, <https://pmikstacki.me>.
- Code ownership is enforced through `.github/CODEOWNERS`, with teams
  `@Cyber-Nomad-Collective/beskid-core` (compiler, standard, CI, agent files)
  and `@Cyber-Nomad-Collective/beskid-web` (sites, shared web packages).

## Recorded preferences

These come from the maintainer's sessions. When you work for someone else,
treat them as the house style of the project, not as that person's wishes.
Topic-specific preferences live in the file that owns the topic, linked
below.

- **Spelling.** The project name is `beskid`, never `beschid`.
- **Verify before pushing.** Run builds and gates locally until they pass.
  Do not stop at the first remote CI failure.
- **Complete refactors.** See [../topics/refactoring-policy.md](../topics/refactoring-policy.md).
- **Parallel agents and tools.** See [../topics/multi-agent-work.md](../topics/multi-agent-work.md).
- **Branches and merges.** See [../topics/git-and-submodules.md](../topics/git-and-submodules.md).
- **Readable compiler traces.** See [../scopes/compiler.md](../scopes/compiler.md).
- **Dialog and keyboard UX.** See [../scopes/sites-and-web.md](../scopes/sites-and-web.md)
  and [../scopes/editors.md](../scopes/editors.md).
- **Promoting provisional specs.** See [../scopes/openspec-standard.md](../scopes/openspec-standard.md).
- **External services.** See [../scopes/build-release-infra.md](../scopes/build-release-infra.md).
- **v0.5 authorizations.** See [../topics/release-program-v0.5.md](../topics/release-program-v0.5.md).

## Things to know when you are not working for the maintainer

- Pushing, merging, publishing and anything that reaches an external service
  need the approval of whoever owns the target, not only the person in the
  session.
- `AGENTS.md` and `CLAUDE.md` belong to `beskid-core` in `CODEOWNERS`. Changes
  to them go through review upstream.
