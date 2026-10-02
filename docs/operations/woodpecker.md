# Woodpecker build workers

Woodpecker 3.18.1 on `bdziam.dev` runs beskid builds. Linux performs normal
validation. Linux, macOS, and Windows perform native target builds and local
installer packaging; their output is durable and named by pipeline and source
SHA. A manual `main` Woodpecker release prepares the existing aggregate; it
has no publication credentials.

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

Keep agent handoff keys in host-managed files. Keep publisher credentials
outside Woodpecker and never place them in tracked files or pipeline variables.

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
After reviewing the prepared state and exact artifact hashes, run
`scripts/ci/woodpecker-release.sh <build-run> <version>` from a clean local
`main` checkout on the trusted manual release host, with
`BESKID_MANUAL_PUBLISH=1`, `BESKID_PUBLISH_RELEASE=1`, and `GH_TOKEN` supplied
to that process outside Woodpecker. The host must have the selected handoffs
at `/woodpecker-handoff` and a durable `/woodpecker-output` directory. The
script checks the source SHA, compiler/distribution
gitlinks, version, all three targets, upload completion, and checksums before
calling the existing stream publisher. A changed `main` cannot consume an older
build: rebuild from the selected revision. Immutable release retries must be
byte-identical; conflicting assets are not overwritten.

### Owner-scoped Windows installer test waiver

The Windows installer scenario matrix is normally a release gate. For a release
where the owner explicitly waives that matrix, the external manual `main`
publisher accepts one decision record via
`BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_JSON` or
`BESKID_WINDOWS_INSTALLER_OWNER_WAIVER_FILE`. This is a waiver, **not** a claim
of VM attestation or passing tests. It does not bypass the three-platform build
results, source identity, handoff checksums, package-result checksums, or the
manual-only publisher guard. Without a matching record, publication remains
blocked; structural smoke evidence alone is not trusted VM provenance.

Review the final `main` commit and the exact setup executable in the Windows
handoff from the chosen build run. Supply this JSON to the manual publisher,
replacing the example values with the reviewed facts:

```json
{"schema_version":1,"decision":"release-owner-installer-test-waiver","scope":"windows-installer-scenario-tests-only","source_commit":"<40-character final main SHA>","version":"<stable version>","installer_sha256":"<64-character SHA-256 of the Windows setup EXE>","approved_utc":"<UTC timestamp, YYYY-MM-DDTHH:MM:SSZ>"}
```

The script validates exact fields, source commit, version, and SHA-256 against
the checksum-validated setup file, then embeds the decision in
`release-state.json` as `windows_installer_acceptance`. This record carries no
credential and should never be represented as completed installer-test evidence.

### Open VSX extension publication

Prepare target-specific editor packages on the trusted manual release host
from the checksum-verified native release evidence. The root and VS Code
tracked source must be clean, and the checked-out editor revision must match
the committed root gitlink. The native source revision must be an ancestor of
the editor release revision with the same compiler pin. No marketplace workflow
runs in Woodpecker; the former source-rebuild publisher has been removed.

The native evidence root contains its canonical `linux`, `macos`, and `windows`
directories. Package each target from a separate clean editor checkout:

```bash
node scripts/ci/package-editor-release.mjs linux-x64 \
  /absolute/native-evidence-root <reviewed-native-root-commit>
```

The versioned VSIX under `beskid_vscode/dist` embeds the exact verified native
LSP and declares its marketplace target. Review its digest and contents before
submitting that file to Open VSX or Visual Studio Marketplace. Supply the
existing publisher credential only to the external manual publication process;
never transfer it into Woodpecker, tracked files, or pipeline variables.

After authorized publication, verify the exact registry version and target:

```bash
curl --fail --silent --show-error \
  https://open-vsx.org/api/beskid/beskid-vscode/0.5.1 | jq -e \
  '.version == "0.5.1" and (.files.download | contains("linux-x64"))'
```

### Marketplace-only publisher derivative

The verified VSIX files remain `beskid` artifacts for Open VSX. To prepare a
separate Visual Studio Marketplace upload for the owner-created `beskid-lang`
publisher, run the bounded metadata-stage transform into a new, nonexistent
directory:

```bash
python3 scripts/ci/package-marketplace-editor.py \
  /absolute/approved-editors \
  scripts/ci/editor-marketplace-approvals/0.5.1.json \
  /absolute/new-marketplace-derivatives
```

The command validates each original digest, target platform, embedded LSP
digest, safe ZIP inventory, and original self-formatter ID before writing
`*-marketplace.vsix` files and `marketplace-approval.json`. Only the package
publisher, the `[beskid]` formatter self-ID, and the VSIX manifest publisher
change. The receipt records separate original and derivative hashes,
inventory hashes, target/version, LSP digest, and source pins. It is not an
Open VSX approval and does not authorize upload or claim Marketplace host
acceptance; a release owner must perform the fresh install, activation, and
formatter check before publication.

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
