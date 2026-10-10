# GitHub metadata

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
