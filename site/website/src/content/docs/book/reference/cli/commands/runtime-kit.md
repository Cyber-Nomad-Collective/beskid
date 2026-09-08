---
title: "beskid runtime-kit"
description: "Build and publish exact ABI-v5 native runtime kits."
---

`beskid runtime-kit` prepares an ABI-v5 runtime kit under an installation prefix. The installed layout starts at `lib/beskid-runtime/abi-5/`. The command fails if validation does not succeed.

## `build`

`beskid runtime-kit build` validates and publishes prebuilt artifacts for one target and profile.

Required flags: `--prefix`, `--target`, `--profile`, `--static-library`, and `--shared-library`. Windows targets also require `--shared-import-library`.

```bash
beskid runtime-kit build --prefix ./toolchain --target x86_64-unknown-linux-gnu --profile release --static-library ./out/libbeskid_runtime.a --shared-library ./out/libbeskid_runtime.so
```

## `build-native-host`

`beskid runtime-kit build-native-host` builds one kit for the current host. Both `--prefix` and `--profile` are required.

```bash
beskid runtime-kit build-native-host --prefix ./toolchain --profile debug
```

## `build-matrix`

`beskid runtime-kit build-matrix` publishes debug and release artifacts for one target. These flags are required: `--prefix`, `--target`, `--debug-static-library`, `--debug-shared-library`, `--release-static-library`, `--release-shared-library`, `--debug-static-provenance-symbol-list`, `--debug-shared-provenance-symbol-list`, `--release-static-provenance-symbol-list`, and `--release-shared-provenance-symbol-list`. Windows targets also require `--debug-shared-import-library` and `--release-shared-import-library`.

Artifact and provenance inputs must match the exact target and profile.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
