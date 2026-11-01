## Why

CLI output mixes levels: informational logs appear by default, `--plain` changes verbosity, and progress writes to non-terminals. A closed pipe aborts the CLI. Evidence: wayfinder ticket 09 and the EPIPE item of the beskid-lings triage.

## What Changes

- Default output shows warnings and errors. `-v` adds information.
- `--plain` removes colour and animation only. `-q` shows errors and final results only.
- Progress appears only on a TTY and only for steps longer than about one second.
- Logs go to standard error, or to the file in `--log-file` or `BESKID_LOG`.
- A closed output pipe (EPIPE) ends the command quietly.

## Capabilities

### Modified Capabilities
- `tooling--cli--command-surface`.

## Impact

`beskid_cli` logging and progress. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Scripts that read information logs must pass `-v`.
