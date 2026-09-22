# NixOS developer build box

Use the NixOS build box for a local Linux compiler check when the Mac's
resources or local build cache are constrained. The box runs the same pinned
Rust base image as the Woodpecker Linux gate and adds only that gate's build
prerequisites.

Create a private SSH alias for the build box outside this repository, then run:

```sh
BESKID_BUILDBOX_SSH=your-private-ssh-alias \
  ./scripts/dev/run-nixos-buildbox.sh
```

The command streams a deterministic closure containing `compiler/` (including
Corelib) and `beskid_bsol/`. It omits Git metadata, generated targets, agent
material, and Corelib `obj/` caches. The server accepts one forced request:
`cargo check --locked --offline --workspace`.

The request uses an immutable CI-base-derived image, a rootless Podman
container, no network, a read-only dependency cache, a content-addressed
target directory, and a resource-limited user systemd slice. Compiler source
is staged writable only because its ABI generation build script writes generated
source during the check; that staging directory is removed when the request
ends.
