# setup-beskid

Install the [Beskid](https://beskid-lang.org) compiler CLI in CI runners.

## Quickstart

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: ./.github/actions/setup-beskid
        with:
          version: '0.4.15'
      - run: beskid build
```

Pin to `stable` (default) to always use the [cli-stable](https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/tag/cli-stable) rolling release:

```yaml
- uses: ./.github/actions/setup-beskid
  # version defaults to 'stable'
```

## Inputs

| Input     | Default             | Description                                          |
|-----------|---------------------|------------------------------------------------------|
| `version` | `'stable'`          | Semver (`0.4.15`) or `'stable'` / `'unstable'` |
| `token`   | `${{ github.token }}` | GitHub token for release download (needs `contents: read`) |

## Outputs

| Output           | Description                     |
|------------------|---------------------------------|
| `beskid-version` | Installed version string        |
| `beskid-path`    | Absolute path to the binary     |

## Supported runners

| `runs-on`          | Target triple              |
|--------------------|----------------------------|
| `ubuntu-latest`    | `beskid-linux-amd64`       |
| `macos-latest`     | `beskid-darwin-arm64`      |
| `windows-latest`   | `beskid-windows-amd64.exe` |

## How it works

1. Detects `runner.os` → `linux` / `darwin` / `windows` with `amd64` / `arm64` arch.
2. Resolves the release tag: `cli-stable`, `cli-unstable`, or `cli-v<version>`.
3. Downloads the matching asset from `Cyber-Nomad-Collective/beskid_compiler` via `gh release download`.
4. Places the binary in `$RUNNER_TOOL_CACHE/beskid/<tag>/<arch>/` and appends to `PATH`.
5. Runs `beskid --version` to verify and expose the version output.

## Using the output

```yaml
- uses: ./.github/actions/setup-beskid
  id: beskid
- run: echo "Installed ${{ steps.beskid.outputs.beskid-version }} at ${{ steps.beskid.outputs.beskid-path }}"
```
