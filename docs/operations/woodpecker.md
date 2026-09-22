# Woodpecker build workers

Woodpecker 3.18.1 on `bdziam.dev` runs beskid builds. Linux performs normal
validation. Linux, macOS, and Windows perform native target builds and local
installer packaging; their output is durable and named by pipeline and source
SHA. A protected manual `main` release prepares the existing aggregate by
default and publishes only when explicitly opted in.

No workflow deploys production. The rootless platform-image job is optional.
Marketplace, Homebrew, and OCI publishing use the existing canonical manual
recipes and are not release gates.

## Worker prerequisites

The Linux Docker agent has one workflow slot and its durable output bind. The
Windows AWS worker needs restored AWS authentication, the Woodpecker Windows
service, Git Bash, Git, Node, jq, tar, Rust 1.98.1, LLVM, ImageMagick, WiX, and VS
Build Tools. Its service account writes `C:\woodpecker-output\beskid`.

The macOS worker needs the official arm64 agent, Git, Node, jq,
tar, Rust 1.98.1, Xcode tools, and Homebrew LLVM; it writes under
`~/Library/Application Support/Woodpecker/beskid-output`.

Keep agent secrets in host-managed files and publisher credentials in protected
Woodpecker secrets, never tracked files or custom pipeline variables. Publisher
secrets are bound only to the manual step that needs them.

Native clone uses the `plugin-git` executable from Woodpecker plugin-git 2.10.1
on each account's PATH, not a Docker image. Agents connect with TLS to
`woodpecker-agent.beskid-lang.org:443`, use one workflow slot, and advertise
`role=beskid-macos` or `role=beskid-windows` with the local backend.

Each native job initializes the pinned distribution recipes, packages its own
verified bundle, and uploads through `beskid-<role>@bdziam.dev`. The SFTP keys
and pinned `known_hosts` file live in `/etc/woodpecker/handoff` on Linux,
`~/Library/Application Support/Woodpecker/handoff` on macOS, and
`C:/ProgramData/Woodpecker/handoff` on Windows. Keys are named `<role>.sftp`.
Install Windows credentials through a protected file transfer, not SSM command
text. `setup-handoff-sftp.sh` provisions the restricted server-side inboxes.

## Operator commands

The CLI uses its authenticated context for `https://ci.beskid-lang.org`.
Run all targets from one branch revision; retain that exact source for release
preparation. Replace the example version and build number with reviewed values.

```bash
woodpecker-cli pipeline create Cyber-Nomad-Collective/beskid --branch main \
  --var BESKID_TASK=validate
woodpecker-cli pipeline create Cyber-Nomad-Collective/beskid --branch main \
  --var BESKID_TASK=build --var BESKID_RELEASE_VERSION=0.4.744
woodpecker-cli pipeline create Cyber-Nomad-Collective/beskid --branch main \
  --var BESKID_TASK=release --var BESKID_RELEASE_VERSION=0.4.744 \
  --var BESKID_BUILD_PIPELINE_NUMBER=41
```

`release` only prepares local output and needs no publisher credential.
After reviewing it, use the same arguments with `BESKID_TASK=release-publish`
to explicitly publish from `main`. The workflow binds `compiler_release_token`
only to that step. The script checks the source SHA, compiler/distribution
gitlinks, version, all three targets, upload completion, and checksums before
calling the existing stream publisher. A changed `main` cannot consume an older
build: rebuild from the selected revision. Immutable release retries must be
byte-identical; conflicting assets are not overwritten.

### Open VSX extension publication

Open VSX is a separate protected manual publisher. It builds the Linux x64 LSP
from the checked-out compiler gitlink and publishes the matching target-specific
VSIX. It never runs for push, tag, pull-request, or ordinary build workflows.

Create the Woodpecker repository secret named `open_vsx_token` from the Open VSX
publisher credential. Keep it restricted to the repository and do not expose it
to pull requests. The workflow reads it only in the `publish-open-vsx` step;
the token must never be placed in a pipeline variable, tracked file, or build
log.

Use the stable compiler release version that matches the checked-out compiler
gitlink. For the current release this is `0.4.746`:

```bash
woodpecker-cli pipeline create Cyber-Nomad-Collective/beskid --branch main \
  --var BESKID_TASK=open-vsx-publish --var BESKID_RELEASE_VERSION=0.4.746
```

After a successful pipeline, verify the exact registry version instead of
relying solely on the job result:

```bash
curl --fail --silent --show-error \
  https://open-vsx.org/api/beskid/beskid-vscode/0.4.746 | jq -e \
  '.version == "0.4.746" and .files.download | contains("linux-x64")'
```

The SFTP inbox is `/var/lib/woodpecker-handoff/<role>/incoming/<build>-<sha>/<role>`.
Prepared output is `/var/lib/woodpecker/beskid-output/releases/<release-run>-<sha>`.
Each invocation creates a new private snapshot; interrupted output remains for
inspection. No separate controller, signing keys, or gate protocol is required.

`BESKID_TASK=platform` builds images on the isolated rootless worker.
`BESKID_TASK=platform-publish` explicitly builds and publishes from `main`, with
protected `registry_username` and `registry_password` secrets. All five
immutable images must succeed before production tags move. A partial rolling
promotion is reported as failure and can be retried; it is not atomic across
registries/tags. Watchtower alone reconciles production containers.

## Release acceptance

Use an exact stable release version for native release work. A human reviews
the three native outputs for source, version, checksums, CLI/LSP assets, and
bundles before approving `main` publication. The bundle contract has fixture
coverage, but a real end-to-end three-worker release is not yet verified.
Failed packaging or an old flat bundle is a failure, never a release result.
