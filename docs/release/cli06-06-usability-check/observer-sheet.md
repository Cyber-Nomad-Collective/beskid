# CLI06-06 observer sheet (one copy per participant)

Fill this in during the session. The record file is built from it. Use UTC times. Copy commands exactly as the participant typed them.

| Field | Value |
|---|---|
| Participant id (P1 to P5, unique) | |
| Target (`x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, `x86_64-pc-windows-msvc`) | |
| No prior Beskid exposure confirmed (yes/no) | |
| Participant received only the installed CLI and its help (yes/no) -> `help_only` | |
| Observer name | |
| `beskid --version` output (must be `beskid 0.6.0`) | |
| sha256 of installed `bin/beskid` equals the candidate digest for this target (yes/no) | |

## Clock

| Event | UTC time | Seconds |
|---|---|---|
| Task sheet handed over, clock T0 starts | | 0 |
| Participant first runs a command starting `beskid add` (add found) | | `add_found_seconds` = this minus T0 (see README for the exact start) |
| Run exits 0 (journey done) | | `journey_seconds` = this minus T0 |
| Participant stops or 300 s pass without a successful run | | |

`add_found_seconds`: null if add was never found. `journey_completed`: true only if `beskid run` exited 0. `journey_seconds`: null if not completed.

## Transcript (every command, in order)

| # | UTC | Command exactly as typed | Exit code | Output (paste, or file name of the saved output) |
|---|---|---|---|---|
| 1 | | `beskid --version` | 0 | `beskid 0.6.0` |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | |
| 10 | | | | |

Add rows as needed. Include failed and mistyped commands.

## Failures and difficulties

One line per item (becomes `failures`). Empty if none. Record any hesitation, wrong command, error message, or point where the participant gave up.

-

## Outcome

- Found add within 60 s: yes / no
- Completed create/add/use/run within 300 s: yes / no
- Any help given by the observer or anyone else (if yes, this participant is invalid and must be replaced): yes / no
