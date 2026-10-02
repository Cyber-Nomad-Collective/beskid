# GitHub metadata

GitHub hosts source and release assets. Native build automation lives in
`.woodpecker/`; commands and authority boundaries are documented in
`docs/operations/woodpecker.md`. Native builders have no publication credentials;
stable compiler publication remains a separate reviewed manual operation.

Editor marketplace publication remains an explicit operator action. The manual
`editor-marketplace-publish.yml` workflow verifies the approved source identities,
native LSP assets and prebuilt VSIX files before publishing to Open VSX. It does
not rebuild extensions or native binaries, and exposes the marketplace credential
only to its publishing step. See
`docs/superpowers/research/2026-10-02-manual-editor-marketplace.md` for staging and
dispatch instructions. Marketplace publication is separate from native release
qualification; a complete multi-channel release still requires its editor listings.
