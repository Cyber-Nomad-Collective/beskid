# GitHub metadata

GitHub hosts source and release assets, but no longer executes this repository's
workflows. Build automation lives in `.woodpecker/`; commands and authority
boundaries are documented in `docs/operations/woodpecker.md`.

Editor marketplace publication remains an explicit operator action using the
existing packaging scripts. It is not a compiler-release dependency and no
replacement marketplace pipeline is required for the Woodpecker cutover.
