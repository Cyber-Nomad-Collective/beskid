# Woodpecker build workers

Woodpecker 3.18.1 on `bdziam.dev` runs beskid builds. Linux performs normal
validation. Linux, macOS, and Windows perform native target builds and local
installer packaging; their output is durable and named by pipeline and source
SHA. A manual `main` Woodpecker release prepares the existing aggregate; it
has no publication credentials.

No workflow deploys production services. The rootless platform-image job is
optional.
Open VSX and Microsoft Marketplace publication have separate protected manual
Woodpecker routes. Only the final Open VSX publish step receives the existing
`open_vsx_token` repository secret. Homebrew and OCI publishing use the
existing canonical manual recipes.
None of these publication routes is a native release gate.

Further 0.5.1 editor and package publication is held: clean-consumer testing
found that its compiler/LSP depends on its original build-checkout path for
Corelib intrinsic authority. Preserve the immutable published artifacts; a
corrected release requires fresh source, artifact and relocation qualification.

## Worker prerequisites

The Linux Docker agent has one workflow slot and its durable output bind. The
Windows AWS worker needs restored AWS authentication, the Woodpecker Windows
service, Git Bash, Git, Node, jq, tar, Rust 1.98.1, LLVM, ImageMagick, WiX, and VS
Build Tools. Its service account writes `C:\woodpecker-output\beskid`.

The macOS worker needs the official arm64 agent, Git, Node, jq,
tar, Rust 1.98.1, Xcode tools, and Homebrew LLVM; it writes under
`~/Library/Application Support/Woodpecker/beskid-output`.

Keep agent handoff keys in host-managed files. Keep publisher credentials out of
tracked files and ordinary pipeline variables. Open VSX binds the existing
`open_vsx_token` only in its final publish step; Microsoft Marketplace binds
`vsce_pat` only in its separate final bounded publisher step. Other publisher
credentials follow their own reviewed routes.

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

Run the reviewed prebuilt publisher on the trusted manual Woodpecker lane:

```bash
woodpecker-cli pipeline create Cyber-Nomad-Collective/beskid --branch main \
  --var BESKID_TASK=editor-publish
```

The lane uses a full-history clone and accepts only Woodpecker's built-in
`CI_PIPELINE_EVENT=manual`, `CI_COMMIT_BRANCH=main`, exact `CI_REPO`, and
`CI_COMMIT_SHA` equal to the checked-out root `HEAD`. It requires the
`BESKID_TASK=editor-publish` gate, verifies the approved source identities,
native LSP assets, and the three original VSIX byte digests, and never rebuilds
editor or native sources. Preparation and verification run without a publisher
credential; only the final publish step receives `OVSX_PAT` from the existing
repository secret `open_vsx_token`. npm installs pinned `ovsx@1.2.0` with
`--ignore-scripts`, and the step writes durable `publish-results.json` evidence
under `/woodpecker-output/editor-<pipeline>-<commit>/`.

The native build workflows accept only exact stable semantic-version `vX.Y.Z`
tags (or their explicit manual build task); editor staging tags such as
`editor-v0.5.1` never enter a native build path.

The native evidence root contains its canonical `linux`, `macos`, and `windows`
directories. Package each target from a separate clean editor checkout:

```bash
node scripts/ci/package-editor-release.mjs linux-x64 \
  /absolute/native-evidence-root <reviewed-native-root-commit>
```

The versioned VSIX under `beskid_vscode/dist` embeds the exact verified native
LSP and declares its marketplace target. The publisher preserves the original
`beskid` Open VSX identity and checks each public target before and after any
publication. Review the resulting durable evidence and exact registry version
and target after the authorized run.

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
digest, exact approved source pins, raw-path symlink safety, safe ZIP
inventory, and original self-formatter ID before writing
`*-marketplace.vsix` files and `marketplace-approval.json`. Only the package
publisher, the `[beskid]` formatter self-ID, and the VSIX manifest publisher
change. The receipt records separate original and derivative hashes,
inventory hashes, target/version, LSP digest, and source pins. It is not an
Open VSX approval and does not authorize upload or claim Marketplace host
acceptance; a release owner must perform the fresh install, activation, and
formatter check before publication. Repeating the transform with the same
inputs produces byte-identical derivatives; the receipt also requires equal
non-metadata entry inventories.

### Microsoft Marketplace publication

> **Release hold (2026-10-02):** do not stage or dispatch this task for 0.5.1.
> The qualified compiler/LSP does not preserve Corelib intrinsic authority
> after relocation to a clean consumer host, so the 0.5.1 Marketplace
> publication gate is disabled in code. A corrected new immutable version must
> supply a new approval record, derivative hashes, and host qualification. Do
> not retag, overwrite, or reuse the 0.5.1 artifacts.

The separate manual Woodpecker task `marketplace-publish` publishes only the
approved 0.5.1 derivatives under the immutable `beskid-lang` identity. It does
not build the editor or compiler, rewrite archives, override targets or
versions, skip duplicates, or alter the Open VSX `beskid` packages.

Before dispatch, create a new mode-0700 directory at
`/var/lib/woodpecker/beskid-output/marketplace/staged/editor-marketplace-v0.5.1`
on the Linux worker host. Copy exactly these assets from the immutable root
release `editor-marketplace-v0.5.1`:

- `beskid-vscode-0.5.1-linux-x64-marketplace.vsix`
- `beskid-vscode-0.5.1-darwin-arm64-marketplace.vsix`
- `beskid-vscode-0.5.1-win32-x64-marketplace.vsix`
- `marketplace-approval.json`
- `marketplace-host-qualification.json`

Generate the final file from the reviewed qM3 host receipt without carrying
its private local paths into the staged proof:

```bash
python3 scripts/ci/marketplace-publish.py sanitize-host-receipt \
  /absolute/qM3/receipt.json \
  /absolute/derivatives/marketplace-approval.json \
  /absolute/derivatives/beskid-vscode-0.5.1-darwin-arm64-marketplace.vsix \
  /absolute/new/marketplace-host-qualification.json
```

The sanitizer requires the reviewed original receipt SHA-256 and records it in
the normalized proof. The preflight verifies the exact approval and derivative
hashes, source pins, identity, targets, embedded LSPs, ZIP safety, inventory,
formatter self-ID, and strict applied-formatter evidence. It snapshots the
five files into
`/var/lib/woodpecker/beskid-output/marketplace/attempts/<pipeline>-<checkout>`;
the attempt receipt remains there after success, validation failure, missing
credentials, or publisher failure.

Only after a corrected release updates this bounded contract and removes the
tracked hold, configure the manual-only protected Woodpecker secret `vsce_pat`
and dispatch the exact reviewed `main` checkout:

```bash
woodpecker-cli pipeline create Cyber-Nomad-Collective/beskid --branch main \
  --var BESKID_TASK=marketplace-publish
```

The token-free steps hydrate and verify the official root origin, require full
history and the selected checkout SHA, snapshot the staged release, and install
lockfile-pinned `@vscode/vsce@4.0.0`. Only the final step receives `VSCE_PAT`.
It invokes one prebuilt-package command with the three exact `--packagePath`
values. A duplicate version/target is a release conflict. A failed publisher
may have accepted a prefix of the target list, so the durable receipt reports
all targets as unconfirmed until an operator checks the Marketplace. Hosted
Marketplace bytes can be service-signed; do not claim their hashes equal the
staged VSIX hashes.

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
