---
title: "beskid runtime-kit"
description: "Build and publish exact ABI-v5 native runtime kits."
---

`beskid runtime-kit` prepares an ABI-v5 runtime kit under an installation prefix. The command has three operations:

- `build` validates and publishes supplied native artifacts for one target and profile.
- `build-native-host` builds one debug or release kit for the current host.
- `build-matrix` publishes the debug and release artifacts for one target.

```bash
beskid runtime-kit build-native-host --prefix ./toolchain --profile debug
```

The installed layout starts at `lib/beskid-runtime/abi-5/`. Artifact and provenance inputs must match the exact target and profile. The command fails if validation does not succeed.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
