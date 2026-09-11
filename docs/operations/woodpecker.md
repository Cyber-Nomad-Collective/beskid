# Woodpecker build workers

Woodpecker 3.18.1 is the repository build solution. It validates Linux pushes
and can build the three native release targets, but it does not publish a
release, deploy applications, or move rolling tags. The 0.4.744 manual-release
procedure remains the release path.

The canonical repository surfaces are:

- `.woodpecker/linux.yml`: Linux Docker validation on pushes, plus Linux builds
  for manual and `v*` tag events.
- `.woodpecker/windows.yml`: Windows amd64 builds on the native local worker.
- `.woodpecker/macos.yml`: macOS arm64 builds on the native local worker.
- `scripts/ci/woodpecker-build-platform.sh`: the single target mapping,
  structured-result validation, version smoke, bundle inventory, checksum, and
  durable-output contract shared by all workers.
- `deploy/woodpecker/compose.yml`: the reviewed server and Linux Docker agent
  template to copy to `/opt/woodpecker` on `bdziam.dev`.

Pull-request workflows are intentionally absent: the Linux Docker agent injects
a durable host output bind into every step container, so untrusted fork code
must never execute there. The native workflows run only for a version tag
matching `refs/tags/v*` or a
manual event. A manual run must provide the custom pipeline variable
`BESKID_RELEASE_VERSION` as an exact stable semantic version such as `0.4.744`.
Tag builds derive the version from `CI_COMMIT_TAG`. Each build is independent;
operators compare the three `woodpecker-build-result.json` files before using
the separate manual-release procedure.

## Server and Linux Docker agent on bdziam.dev

Do not run these commands on the live host until the Compose change has been
reviewed. The checked-in template is deliberately separate from
`beskid_sites/deploy`; Woodpecker is build infrastructure, not a production
application managed by that Compose project.

The template pins Woodpecker server and agent 3.18.1 by their Linux amd64 image
digests. It attaches to the existing external `coolify` network and exposes no
host ports. Caddy Docker Proxy receives two HTTPS routes:

- `https://ci.beskid-lang.org` to the server UI on port 8000.
- `https://woodpecker-agent.beskid-lang.org` to the agent gRPC listener on port
  9000 using an HTTP transport with the `h2c` version.

Before deployment, an administrator must:

1. Point both DNS names at `bdziam.dev` and confirm the shared Caddy container
   is attached to the external Docker network named `coolify`.
2. Create a GitHub OAuth application, not a GitHub App. Set the homepage to
   `https://ci.beskid-lang.org` and the callback to
   `https://ci.beskid-lang.org/authorize`.
3. Generate the initial server/agent secret and a distinct gRPC JWT signing
   secret with two separate `openssl rand -hex 32` invocations. Store the OAuth
   client ID, OAuth client secret, agent secret, and gRPC secret outside Git;
   never paste their values into documentation or Compose. Persist the gRPC
   secret: rotating it invalidates the server's outstanding gRPC JWTs.
4. After review, copy `deploy/woodpecker/compose.yml` to
   `/opt/woodpecker/compose.yml`, copy `.env.example` to
   `/opt/woodpecker/.env`, fill the three values, and protect it with mode
   `0600`.
5. Create `/opt/woodpecker/data`, `/opt/woodpecker/agent`, and
   `/var/lib/woodpecker/beskid-output`, owned by the account that runs the
   Docker daemon. The first two are visible bind mounts for the server database
   and agent identity. The agent's
   `WOODPECKER_BACKEND_DOCKER_VOLUMES` mounts that host directory at
   `/woodpecker-output` in every Linux step container.
6. Validate without starting services:

   ```bash
   cd /opt/woodpecker
   docker compose --env-file .env config --quiet
   ```

7. Start with `docker compose up -d`, sign in as the configured administrator
   `pmikstacki` through the GitHub OAuth flow, enable only
   `Cyber-Nomad-Collective/beskid`, and leave the repository untrusted. Closed
   registration, organization/repository-owner filters, public-only GitHub
   OAuth scope, and disabled user-created agent registration are enforced by
   Compose. The workflow needs no privileged step or repository secret.
8. Confirm the connected Linux agent reports the automatic labels
   `platform=linux/amd64`, `backend=docker`, plus
   `role=beskid-linux`. Keep `WOODPECKER_MAX_WORKFLOWS=1` so native release
   output cannot overlap on this worker.

The Compose `.env` has exactly four secret-bearing inputs:
`WOODPECKER_GITHUB_CLIENT`, `WOODPECKER_GITHUB_SECRET`, and
`WOODPECKER_AGENT_SECRET`, plus the separately generated and persisted
`WOODPECKER_GRPC_SECRET`. There are no Woodpecker repository secrets for these
build-only workflows.

Back up `/opt/woodpecker/data` and `/opt/woodpecker/agent` together while the
Compose project is stopped, and back up `/opt/woodpecker/.env` through the
host's secret backup mechanism. Restore all three before starting the pinned
server/agent pair; never restore the SQLite database without its matching
agent identity and secrets.

## Native Windows AWS agent

Use the existing x86_64 Windows AWS build host and the Woodpecker
`woodpecker-agent_windows_amd64.zip` asset from the official 3.18.1 release.
Verify it against the release's `checksums.txt` before installation. Register a
dedicated agent in **Settings -> Agents -> Add agent**; do not reuse the Linux
system token. Write that agent token to
`C:\ProgramData\Woodpecker\agent-secret`, grant read access only to the service
account, and configure:

```text
WOODPECKER_SERVER=woodpecker-agent.beskid-lang.org:443
WOODPECKER_GRPC_SECURE=true
WOODPECKER_AGENT_SECRET_FILE=C:\ProgramData\Woodpecker\agent-secret
WOODPECKER_BACKEND=local
WOODPECKER_MAX_WORKFLOWS=1
WOODPECKER_HOSTNAME=beskid-windows-aws
WOODPECKER_AGENT_LABELS=role=beskid-windows
WOODPECKER_BACKEND_LOCAL_TEMP_DIR=C:\Woodpecker\tmp
```

Install the official `windows-amd64_plugin-git.exe` from Woodpecker
`plugin-git` 2.10.1 as `plugin-git.exe` on the service account's `PATH`; the
local backend needs it for the default clone step. Git Bash must also be on
`PATH`, because `image: bash` is the workflow shell and the shared build wrapper
is Bash. The account additionally needs Git, Node.js, jq, tar, Rust 1.98.1 with
`x86_64-pc-windows-msvc`, LLVM tools, Visual Studio Build Tools 2022, and write
access to `C:\woodpecker-output\beskid`. The shared wrapper uses the installed
`vswhere.exe` to resolve the Visual Studio `Hostx64/x64/link.exe` explicitly;
this prevents Git Bash's unrelated `/usr/bin/link.exe` from being selected.

Install the agent executable as a Windows service under that non-administrator
build account. Before enabling it, open Git Bash as the same account and verify:

```bash
command -v bash git jq node tar cargo rustc llvm-nm llvm-readobj plugin-git
rustc --version
cargo --version
```

The workflow's durable result is
`C:/woodpecker-output/beskid/<pipeline>-<commit>/windows`. The final log line
prints the exact `WOODPECKER_OUTPUT_PATH`.

## Native macOS agent

Use the official `woodpecker-agent_darwin_arm64.tar.gz` asset from Woodpecker
3.18.1 and verify it against the release `checksums.txt`. Register a separate
agent in the server UI. Store its token in
`~/.config/woodpecker/agent-secret` with mode `0600`, then configure the agent's
launchd service with:

```text
WOODPECKER_SERVER=woodpecker-agent.beskid-lang.org:443
WOODPECKER_GRPC_SECURE=true
WOODPECKER_AGENT_SECRET_FILE=/Users/mikserek/.config/woodpecker/agent-secret
WOODPECKER_BACKEND=local
WOODPECKER_MAX_WORKFLOWS=1
WOODPECKER_HOSTNAME=beskid-macos-arm64
WOODPECKER_AGENT_LABELS=role=beskid-macos
WOODPECKER_BACKEND_LOCAL_TEMP_DIR=/Users/mikserek/Library/Caches/Woodpecker/tmp
```

Install the official `darwin-arm64_plugin-git` from Woodpecker `plugin-git`
2.10.1 as `plugin-git` on the launchd service's `PATH`. That PATH must also
contain Bash, Git, Node.js, jq, tar, Rust 1.98.1, Xcode command-line tools, and
Homebrew LLVM tools. Verify these commands as the launchd account before
loading the service:

```bash
command -v bash git jq node tar cargo rustc llvm-nm llvm-readobj plugin-git
xcodebuild -version
rustc --version
cargo --version
```

The macOS workflow fixes `MACOSX_DEPLOYMENT_TARGET=11.0`. Its durable output is
`~/Library/Application Support/Woodpecker/beskid-output/<pipeline>-<commit>/macos`,
and the final log line prints the exact `WOODPECKER_OUTPUT_PATH`.

## Why macOS is not containerized on bdziam.dev

`bdziam.dev` is Linux x86_64 and currently has no `/dev/kvm`. Docker-OSX needs
KVM-backed virtualization to run macOS guests at usable speed and with the
required virtualization semantics; a Docker container does not turn a Linux
kernel into a Darwin build host. Docker-OSX is therefore not a viable macOS
worker on this server. The current supported path is the native arm64 macOS
local-backend agent described above.

## Build acceptance

Every target wrapper invocation must finish with a printed
`WOODPECKER_OUTPUT_PATH` and leave:

- the CLI and LSP assets for that target;
- the target bundle containing CLI, LSP, updater, and ABI-v5 runtime metadata;
- `platform-result-<target>.json` with all three build statuses successful and
  no diagnostics;
- `woodpecker-build-result.json`, `artifact-version-smoke.log`,
  `bundle-contents.log`, component logs, and `SHA256SUMS`.

Woodpecker does not make these builds a release. A release operator must review
all three output directories, copy their platform result JSON files into the
manual release workspace, and run the existing fail-closed aggregate before
following the manual release process:

```bash
bash scripts/ci/build-release-state.sh \
  stable "$version" "$compiler_sha" "$superrepo_sha" success \
  release-state.json \
  platform-result-x86_64-unknown-linux-gnu.json \
  platform-result-x86_64-pc-windows-msvc.json \
  platform-result-aarch64-apple-darwin.json
```

`release-state.json` must report `publishable: true`. This is the mandatory
three-platform existence/status check; no Woodpecker workflow publishes or
advances a stable alias itself.
