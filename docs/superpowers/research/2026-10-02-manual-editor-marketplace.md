# Manual prebuilt editor marketplace publication

## Bounded 0.5.2 source-binding implementation

The separately tracked `scripts/ci/editor-marketplace-approvals/0.5.2.json`
records the actual original VSIX and standalone LSP digests without changing any
artifact. Its `source.superrepo_commit` is the editor artifact root
`e06d6b4b1e7e06a602bcf0b575e9fc05d921106b`; mandatory
`source.native_superrepo_commit` is the original native build root
`2de50cdaef9b1f34e0b246eadad70a17fd43f6d8`. Both must be exact commit objects,
the native root must be an ancestor of the editor root, and both trees must pin
compiler `95c203ff12639b25e2c67b08da531e3715fef4c2`. Only the editor root must
pin editor `838d10b4606097e8fba8dc311c70dd9053607b9c`. The editor root and
publisher base must be ancestors of the trusted publisher HEAD. A sibling native
root reachable only through a later publisher merge cannot qualify.

Native state retains its original native-root provenance and must genuinely be
stable, publishable and gate-qualified for the complete target set. The native
release tag still resolves to the compiler commit; the editor tag resolves to
the editor artifact root. The Marketplace derivative packager requires these
freshly verified exact originals and qualified native evidence through `--native`
and `--root` for 0.5.2. It carries the complete source unchanged into its receipt,
permits only publisher and formatter self-ID changes, and preserves all other
payload inventories. Marketplace source, original/LSP digests, derivative digests,
actual raw host proof, sanitized qualification and publication attempt bind that
same complete source object. A raw 0.5.2 host receipt must additionally carry the
complete `source` and exact qualified `derivative_sha256`; old proof cannot be
restamped into qualification.

The manual Woodpecker editor and Marketplace lanes select only tracked 0.5.1 or
0.5.2 through `BESKID_EDITOR_PUBLISH_VERSION` (default 0.5.1). Open VSX accepts
`--version 0.5.2` after its command; Marketplace accepts it before its command.
There are no caller-selected production approval paths, source pins or hashes.
The 0.5.1 approval bytes and compiler-specific source hold remain unchanged.

This records completed qualification evidence, not publication eligibility.
Genuine full source gates and native aggregation passed, and the tracked contract
freezes the exact reviewed Marketplace approval sidecar, complete three-target
derivative digests, and actual Linux raw host-receipt digest. It still has
`publication_enabled: false`; production stops before transport or credential
use. Immutable public tags/assets, installer qualification or an exact owner
waiver, other channel conditions, and separate owner publication authorization
remain required. Existing historical sections below describe 0.5.1; they are not
authority to publish 0.5.2.

## Recommendation and scope

A root-repository, manual-only GitHub Actions publisher can use the existing
`OVSX_TOKEN` repository secret without reading, copying, or relocating its value.
Map it to the publishing step's `OVSX_PAT` environment variable. GitHub explicitly
supports secret references in step environments; missing secrets resolve empty,
so the publisher must reject an empty variable without printing it.
[GitHub secrets documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)

The release owner approved the bounded implementation through the active release
program on 2026-10-02. The initial research performed no external mutation; the
implementation described below adds local publisher files only. Staging, push,
merge, workflow dispatch, and marketplace publication remain separate approvals.
GitHub Actions would only verify and upload already packaged files; Woodpecker
remains the sole native builder, and Watchtower remains the sole platform deployer.
The root AGENTS.md explicitly reserves GitHub Actions for editor-marketplace and
repository-native maintenance work.

The dedicated `beskid_vscode` repository need not gain a secret or workflow.
Parent-supplied metadata confirms root `OVSX_TOKEN` exists and dedicated repository
secrets/workflows are absent. Metadata does not prove the token is unexpired or
that its account has `beskid` namespace rights.

## Frozen source and local artifacts

Native/root source: `f064de92777d36c249424a18f92c91abd6f3e248`.
Compiler source: `1bd7bdee81d59ef14339e6a6c2ce18eb36585238`.
VS Code gitlink: `270cc2b4caec843516fa5ad684a6e1eb1d1608e6`.
Publisher-only follow-up: `3179295444affc9a646a272c0a1ec677ce00acf5`;
it does not replace or relabel native source provenance.

The editor's canonical native LSP origin is
`Cyber-Nomad-Collective/beskid_compiler`'s immutable `lsp-v0.5.1` release; its tag must
resolve to compiler `1bd7bdee81d59ef14339e6a6c2ce18eb36585238`, while its qualified
`release-state.json` must declare root `f064de9` and compiler `1bd7bdee`. The bundle
release `v0.5.1` is separate. Its LSP binaries were built separately and differ in
hash from the standalone LSP files, despite having the same frozen source. Therefore
its tarball LSP digests must not be substituted for the approved standalone digests.
The LSP release contains the three direct `beskid_lsp-*` files,
`lsp-version.txt`, and `release-state.json`. The editor assets use the independently staged root
`editor-v0.5.1` release at `f064de9`; the publisher does not retarget either tag.

Read-only local inspection of `/private/tmp/beskid-v051-final-editors` produced:

| Target | VSIX SHA-256 | Bundled native LSP SHA-256 |
|---|---|---|
| linux-x64 | `fe04be50139e95d44bfe16636619d24f0f87a4486e8b62820e1de1e7120b2bb1` | `7c161fdd3e26fcb8099cc56f090c2224b33b52883b63bfb5dd36db7b4335097a` |
| darwin-arm64 | `68ea0c3518418cc6629b89f6f39f68efaec4856f5d1b0ada625d29ba5dbe1473` | `ecfc68d921d4b9539f090eb2de221f4cc616177e52e1f166198ba45c9ed143d7` |
| win32-x64 | `79d16b9215fa2e4324853153a32705279acf270252d049c92abefd3b1b577160` | `34e01e08d0dc9a4fd31d2c67929f3e4418b177fa4e6aa1d1d1bc4fb8d95d447a` |

Names are exactly `beskid-vscode-0.5.1-<target>.vsix`. Each ZIP's VSIX manifest
declares `Publisher=beskid`, `Id=beskid-vscode`, `Version=0.5.1`, and its matching
`TargetPlatform`. Each contains exactly one server payload at
`extension/server/<target>/beskid_lsp` (`beskid_lsp.exe` for Windows). Its streamed
digest matches the corresponding frozen native `SHA256SUMS` entry. These observations
bind the current VSIX bytes, not a future rebuild with the same version.

Local source authority is `scripts/ci/package-editor-release.mjs`: clean tracked
root/editor sources, committed editor gitlink, native root ancestor, unchanged
compiler pin, matching editor version, native source/version/target and LSP digest.
`scripts/ci/test/package-editor-release.test.mjs` tests drift rejection for source,
target, version, digest, unsupported/missing artifact, dirty sources and wrong pins.
Those are packaging/source-attestation tests, not yet marketplace publisher tests.
The publisher must not invoke `package-vsix.mjs`, which builds TypeScript and packages
files; it consumes the exact completed VSIXs above instead.

## Minimum fail-closed workflow design

1. Add one root `.github/workflows/editor-marketplace-publish.yml` only after design
   approval. Trigger only `workflow_dispatch`, require `refs/heads/main`, serialize
   publication per release, and use `permissions: contents: read`. Pin any external
   actions and publishing CLI version. No `id-token: write` is needed for the existing
   PAT route. Do not add native builds, source packaging, PR/tag/push auto-publication,
   generic input URLs, or credential-storage/login commands.
2. Keep a reviewed, tracked approval manifest describing the frozen source commits,
   editor gitlink, exact three asset names/targets, and the VSIX/native LSP digests
   above. Do not trust a downloaded manifest merely because it accompanies assets.
   Inputs select a reviewed record; they must not redefine its hashes/source identity.
3. After native gates and publication approval, the operator stages the three exact
   VSIXs as release assets in the root repository (a separate `editor-v0.5.1` release
   targeting frozen root `f064de9` is a concrete option requiring approval). Never
   overwrite mismatching existing assets, use rolling aliases, or retag native source.
   Asset staging requires external release-write permission; the consuming job only
   requires release read access. Asset SHA-256 and trusted reviewed hashes must both
   match before any publication.
4. Before exposing `OVSX_TOKEN` to a step, download all three files to an owned directory;
   validate regular files, exact names, digest, ZIP inventory (no duplicate/unsafe/link
   entries), JSON package identity and XML target identity, one expected server payload,
   and streamed LSP digest. Match the LSP against the qualified immutable native
   release asset/receipt for the stated compiler/source commits. Do not execute or
   extract the VSIX's extension code. Reject extra target/server payloads.
5. Validate the complete three-target set before the first mutation. The separate
   publish step receives `OVSX_PAT: ${{ secrets.OVSX_TOKEN }}` and runs the pinned
   `ovsx publish <exact-file.vsix>` for each file. No bare `ovsx publish`, no Open VSX
   `--packagePath`, no extension dependency install or prepublish hook. The Open VSX
   CLI documents positional files for already packaged extensions; this implementation
   uses that route exclusively. [Official Open VSX CLI](https://github.com/eclipse-openvsx/openvsx/blob/main/cli/README.md)
6. Save per-target publish results and verify public version/target metadata and
   downloaded package identity afterward. Publication is not atomic across three
   targets. On partial completion, do not unpublish or overwrite: verify already
   existing target bytes/identity and only resume missing targets. Registry signing
   may alter downloadable VSIX bytes, so unexpected post-publication digests require
   investigation, not an unconditional byte-identical assumption.

Needed offline tests: reject altered VSIX, wrong source/manifest, mismatching LSP,
wrong/extra target, unsafe or duplicate ZIP entry, incomplete target set, nonmanual
or nonmain invocation, missing secret, and accidental packaging/build command. Test
that all verification completes before the first mocked publish invocation and that
publication argv uses positional VSIX files and environment-only token delivery.

## Rights and remaining actions

GitHub requires the manual workflow file on the default branch and repository write
access to dispatch it. It can then be selected in the Actions UI or invoked with
`gh workflow run editor-marketplace-publish.yml --repo Cyber-Nomad-Collective/beskid
--ref main`; exact inputs depend on the approved implementation. Repository/org
Actions policy can impose additional restrictions. No dispatch was performed.
[GitHub manual workflow documentation](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)

Open VSX requires the existing token account to be an authorized member of the
`beskid` namespace (contributor or owner); token presence alone is insufficient.
No new namespace or token should be invented or created automatically.
[Open VSX namespace access](https://github.com/eclipse-openvsx/openvsx/wiki/Namespace-Access)
[Publishing guide](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions)

Visual Studio Marketplace remains separately blocked by missing `VSCE_PAT` and
unconfirmed publisher rights. An authorized human must provide an appropriate
credential and account access to publisher `beskid`, or upload the exact approved
files through its publisher management UI. Do not transfer `OVSX_TOKEN`, create a
credential, or assume OIDC configuration. The prebuilt command is
`vsce publish --packagePath <exact-file.vsix>` with `VSCE_PAT` environment delivery;
unlike Open VSX, this flag means prebuilt packages. Standard PAT setup requires
Marketplace Manage scope and publisher access.
[VS Code publishing documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
[VS Code CI credential documentation](https://code.visualstudio.com/api/working-with-extensions/continuous-integration)
[vsce CLI source](https://github.com/microsoft/vscode-vsce/blob/main/src/main.ts)

Before staging or dispatch: completed native gates and explicit publication authorization, reviewed
asset/source manifest, release-write rights for staging, workflow merge/push approval,
and existing Open VSX token validity/namespace rights. Do not change frozen native
source to make an editor-only publisher runnable.

## Implemented operator path

The reviewed record is `scripts/ci/editor-marketplace-approvals/0.5.1.json`.
The only workflow is `.github/workflows/editor-marketplace-publish.yml`, triggered
manually on root `main` with read-only GitHub permissions and serialized 0.5.1
publication. There are no URL, digest, commit, or target override inputs.
`scripts/ci/prebuilt-editor-publish.py prepare <new-owned-snapshot>` downloads the
exact three editor assets and the standalone LSP assets, native qualified state,
and LSP stream version. It checks
GitHub's asset SHA-256 as well as the reviewed hashes, resolves the immutable tags,
checks actual root source gitlinks and publisher ancestry, streams ZIP entries and
regular native files without extraction or execution, and verifies all targets before returning.
`verify <snapshot>` repeats offline verification. The workflow installs pinned
`ovsx@1.2.0` without lifecycle scripts in a separate step with no marketplace
credential, then verifies again before the publishing step receives `OVSX_PAT`.

The publisher preflights the complete public target set and rejects existing
mismatching bytes before uploading. Matching existing targets are verified and
skipped; missing targets use only `ovsx publish <file.vsix>`. It records each target
in `publish-results.json` and verifies public version/target metadata and the
downloaded package after each upload. On failure it stops and retains the result
artifact; it never unpublishes or overwrites. Registry signing or propagation that
changes or hides the expected public bytes requires investigation before resuming;
the publisher does not reinterpret an unexpected digest as approval.

For authorized staging, create root `editor-v0.5.1` at the exact frozen root commit
with precisely the three approved filenames above. Existing assets must be checked
against the approval digests; do not use `--clobber`, move a tag, or overwrite a
mismatch. The workflow deliberately refuses missing assets or missing GitHub asset
digests. After native qualification, staging, and an approved merge/push to `main`,
an authorized operator can dispatch the fixed workflow with the command above.
This implementation has not staged or dispatched anything, and token validity and
namespace rights remain unconfirmed. Visual Studio Marketplace still requires the
human-provided `VSCE_PAT` and confirmed publisher rights documented above.

CLI/action pins were checked against official sources on 2026-10-02:
[Open VSX CLI package metadata](https://github.com/eclipse-openvsx/openvsx/blob/master/cli/package.json),
[Open VSX prebuilt publication](https://github.com/eclipse-openvsx/openvsx/blob/master/cli/README.md),
[Open VSX target API](https://github.com/eclipse-openvsx/openvsx/blob/master/server/src/main/java/org/eclipse/openvsx/RegistryAPI.java),
[checkout v4.3.1](https://github.com/actions/checkout/releases/tag/v4.3.1),
[setup-node v4.4.0](https://github.com/actions/setup-node/releases/tag/v4.4.0), and
[upload-artifact v4.6.2](https://github.com/actions/upload-artifact/releases/tag/v4.6.2).

Diagnosis references remain `compiler/scripts/diagnose/` and
`compiler/docs/diagnose.md`; no compiler/build diagnosis or duplicate gate was needed
for this research.
