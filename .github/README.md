# GitHub metadata

Community files for people arriving through GitHub, and notes on what GitHub
does and does not do for this repository.

## Community files

| File | Purpose |
| --- | --- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to set up, change the standard, test and open a pull request |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Expected behaviour and how incidents are handled |
| [SECURITY.md](SECURITY.md) | Supported versions and private vulnerability reporting |
| [SUPPORT.md](SUPPORT.md) | Where to ask which question |
| [PULL_REQUEST_TEMPLATE.md](PULL_REQUEST_TEMPLATE.md) | Checklist every pull request fills in |
| [ISSUE_TEMPLATE/](ISSUE_TEMPLATE/) | Bug and documentation forms; features go to the Tracker |
| [CODEOWNERS](CODEOWNERS) | Required reviewers per path |
| [Taskfile.yml](Taskfile.yml) | `task -t .github/Taskfile.yml check` verifies these files |

## Automation

GitHub hosts source and release assets. Native build automation lives in
`.woodpecker/`; commands and authority boundaries are documented in
`docs/operations/woodpecker.md`. Native builders have no publication credentials;
stable compiler publication runs only in the manual `main`-only Woodpecker
`release-publish` lane, whose final step alone receives the scoped GitHub secret.

Editor marketplace publication remains an explicit operator action through the
manual Woodpecker `editor.yml` lane. It verifies the approved source identities,
native LSP assets and prebuilt VSIX files before publishing to Open VSX; it does
not rebuild extensions or native binaries, and exposes the existing
`open_vsx_token` credential only to its final publishing step. Marketplace
publication is separate from native release qualification; a complete
multi-channel release still requires its editor listings.
