# Woodpecker migration ledger

Woodpecker on `bdziam.dev` is beskid's build runner. The approved design is
small: Linux validates; the three native workers build and package their own
target; a release operator runs one protected manual release command after
reviewing the target outputs.

## Approved flow

- Linux validation is one Docker workflow and never publishes.
- Linux, macOS, and Windows native jobs write flat SHA-named durable output and
  use their approved SSH transport account.
- The manual release command prepares the existing aggregate by default. Only
  explicit opt-in from `main` with the release token publishes; immutable
  streams precede rolling aliases.
- Rootless platform-image building is an optional manual job, not deployment.
- Existing canonical manual packaging, OpenVSX, Zed, Homebrew, and OCI recipes
  remain optional operator work. They are not release acceptance gates.

There is no custom signing controller, gate-evidence protocol, or requirement
to reproduce every old provider workflow.

## Preconditions and limits

Windows AWS authentication and its Woodpecker service must be restored before
a Windows build is claimed. Native workers need their documented toolchains,
durable-output paths, and approved SSH transport. Keep publisher credentials
outside Git, bind each only to its publisher, and rotate them in the host secret
store. Final `main` promotion requires human approval after inspecting all
three target outputs and their source/version/checksum records.

The complete-release bundle contract has fixture-tested repair, but no real
three-native-target release is verified. If the old flat bundle reappears,
packaging must reject it. Manual task selectors choose work only; they do not
grant publishing authority.
