---
title: FAQ and troubleshooting
description: Workspace and lockfile troubleshooting for tooling users.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
---

## `Project.lock` out of date

Run `beskid lock` or `beskid update` from the project root. If manifests changed on another branch, merge lock conflicts explicitly—do not hand-edit `materialized_root` without understanding fetch layout.

## Registry alias not found

Add the alias to `Workspace.proj` `registry { }` blocks or use the `default` URL. Verify `beskid pckg` config points at the same host (`PckgClientConfig`).

## Member project not in graph

Check `member.path` is relative to the workspace root and ends with `Project.proj`. Typos in `member.id` break `--workspace-member` CLI flags.

## LSP uses wrong dependency roots

Delete `.beskid` cache only when documentation recommends it; otherwise refresh lock and rescan workspace. Ensure focused project matches the lock’s `root_manifest`.

## Workspace publish rejected by pckg

Server validators (`WorkspacePackageManifest`, `PackageArtifactValidator`) enforce readme, docs, and member consistency—align local `beskid pckg pack` output with **[pckg client contract](/platform-spec/tooling/registry-client/pckg-client-contract/)** before retrying upload.
