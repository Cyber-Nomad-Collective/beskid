# CLI06-06 usability check for Beskid 0.6.0

This folder is the kit for the five-participant observation required by the CLI06-06 requirement ("Installed beginner workflow acceptance", scenario `CLI06-06-OBS Uncoached observation`) in `openspec/changes/v06-cli-dependencies/specs/tooling--cli--command-surface/spec.md`. The release owner runs it once per candidate, before publication.

Files here:

- `participant-task.md`: the sheet you give each participant.
- `observer-sheet.md`: one copy per participant, filled in during the session.
- `record-template.json`: the empty record with placeholders.
- `record-example.json` and `example-validated-evidence.json`: a filled example that passes the validator, with fake commits and digests. Never submit it.

## What is verified

Five fresh users receive the installed `beskid` CLI and its help, and nothing else. The spec requires:

- At least 4 of 5 find the `add` command within 60 seconds.
- At least 4 of 5 complete create, add, use, run within 5 minutes (300 seconds).
- The result is one observer-attested record per candidate (`verification: "observer-attested"`). It is an attestation, never machine evidence. It retains, per participant, a transcript with command, time, exit status and output, and it must include the output of `beskid --version` for the candidate. It also holds the candidate CLI digests of every target, the failures and the observer identity.
- Coaching or snapshots do not count as observations.
- A record below either threshold, or no record, blocks publication.

The scripted version of the same journey runs separately as the native release test `cli06_06_create_add_use_check_build_run_outside_checkout` (in `compiler/crates/beskid_tests_release/tests/cli_journeys_v06.rs`). This kit does not replace it.

## Who can take part

- Participants: five different people with no prior Beskid exposure. They get the installed CLI and its help only. The validator requires exactly five participants with unique ids, `help_only: true`, and each on one of the three candidate targets (`x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, `x86_64-pc-windows-msvc`). Use all three targets across the group if you can (for example 2 Linux, 2 macOS, 1 Windows). The spec does not require a mix.
- Observer: one named person who watches, times and records, and gives no help. The spec only requires the observer identity in the record. The observer should be someone who is not a participant. The release owner may be the observer.
- Do not use people who helped build Beskid or who saw the CLI help, docs or this task before.

## Before the sessions

1. Freeze the candidate. Note the two 40-character commits: the superrepo commit and the compiler commit (`git rev-parse HEAD` and `git rev-parse HEAD:compiler` in the release checkout). The record must carry these exactly.
2. Get the CI build artifacts of that candidate from the Woodpecker builds (one packet per platform). For each target you need the bundle `beskid-0.6.0-<target>.tar.gz` and the CLI file (`beskid-linux-amd64`, `beskid-darwin-arm64`, `beskid-windows-amd64.exe`). Check them against the packet `SHA256SUMS`.
3. Get the digests that the validator will compare against. They are the `sha256` of the three CLI files above, as listed in `validated-evidence.json` of the aggregated release (`<release>/qualified/validated-evidence.json`, produced by `scripts/ci/woodpecker-aggregate-release.mjs`). If you do not have that file yet, take the digests from `SHA256SUMS`, and re-check them against `validated-evidence.json` before you validate.
4. Prepare a clean machine or a fresh user account for each participant, with no Beskid, no Rust, no checkout and no prior shell history. Use a real machine of the target (the spec checks the CLI digest of the target the participant uses). Remove any `beskid` already on the PATH.
5. Install the candidate: extract the bundle `beskid-0.6.0-<target>.tar.gz` into a folder, and add its `bin` folder to the PATH of the participant's terminal. Do not use a source build or a checkout. Verify that the installed `bin/beskid` (`bin\beskid.exe` on Windows) has the same sha256 as the target's CLI digest. If the digests differ, stop: this is not the candidate.
6. Create the work area outside any checkout, for example `~/cli06-06/work`. Place the fixture library `Greeter` beside it (`~/cli06-06/Greeter`), so that `../Greeter` from the work folder is correct. The library is exactly what the scripted test writes:
   - `Greeter/Greeter.bproj`:
     ```
     Greeter { name = "Greeter" version = "0.1.0" }
     target "Greeter" { kind = "Lib" entry = "Greeter.bd" }
     ```
   - `Greeter/Src/Greeter.bd`:
     ```
     pub i32 Answer() { return 42; }
     ```
7. Print `participant-task.md` or have it on screen. Print one `observer-sheet.md` per participant. Do not give the participant this README.
8. Set up a way to capture the terminal (screen recording or a saved shell session) so the transcript can be checked. Use a stopwatch or the system clock in UTC.

## Procedure per participant

Run the five sessions one after another, each on a fresh account or machine. Each takes about 10 minutes.

1. Tell the participant: "I will not answer questions or give hints. You may use the `beskid` command and its help. Please say what you are thinking aloud if you like." Confirm that they have not seen Beskid before.
2. In the participant's terminal, before the clock starts, run `beskid --version` (`beskid.exe --version` on Windows). It must print `beskid 0.6.0`. Record it as the first transcript entry. If it prints anything else, stop.
3. Hand over `participant-task.md`. Start the clock (T0) at that moment and note the UTC time.
4. Observe silently. Do not answer questions, point at the screen, or react to errors. If the participant asks for help, say "I can't help with that" and note it. If anyone gives help beyond the CLI and its help, the participant is invalid. Replace them with another person; do not set `help_only` to false and submit.
5. Write each command exactly as typed, with UTC time, exit code and output. Record failed and mistyped commands too.
6. Add found: record the time the participant first runs a command starting with `beskid add`. `add_found_seconds` is that time minus T0. The spec does not define the start of the 60 seconds, so this kit uses T0 (the moment the task sheet is handed over), which is the stricter reading. Use null if they never ran it.
7. Journey done: the moment `beskid run` exits 0 at the end of the task. `journey_seconds` is that time minus T0 and must be at most 300 to count. If the participant stops, gives up, or 300 seconds pass without a successful run, set `journey_completed` to false and `journey_seconds` to null, and write the reason in the failures list. Allow the participant to continue past 300 seconds if they wish, but note that it does not count; the validator does not accept a completed journey above 300 for the threshold.
8. After the session, ask for free comments and note the confusing points in the failures list.

## Pass and fail criteria

The check passes only if the validator accepts the record:

- Exactly 5 participants, unique ids, each `help_only: true`.
- `add_found_seconds` is non-null and at most 60 for at least 4 participants.
- `journey_completed` is true and `journey_seconds` is at most 300 for at least 4 participants. A completed participant must have a `beskid run` entry with exit code 0.
- Every transcript contains `beskid --version` (or `beskid.exe --version`) with exit code 0 and output `beskid 0.6.0`.
- The record names the right version, superrepo commit and compiler commit, and its three CLI digests equal the candidate's digests.

Anything else fails and blocks publication. Do not edit times or flags to reach four of five. If the check fails, fix the CLI or help and observe five new participants on the next candidate. The fallback is the dated release-owner waiver, valid for 0.6.0 only, which records the unmet requirement and a 0.6.1 obligation. It is outside this kit; see `scripts/ci/release-user-observation.mjs` (`cli06-06-uncoached-observation-waiver`).

## Turn the notes into the record

1. Copy `record-template.json` to the file you will submit, for example `cli06-06-record-0.6.0.json`. Keep it outside the repository unless the release owner decides otherwise.
2. Fill the top fields: `version` `0.6.0`, `superrepo_commit`, `compiler_commit`, `recorded_utc` (the time you finish the record), `observer` (name and role), and `candidate_cli_sha256` for the three targets (lowercase hex, 64 characters).
3. Copy the template participant object five times, one per person, and fill it from the observer sheet:
   - `id`: P1 to P5.
   - `target`: the participant's target triple.
   - `help_only`: true.
   - `add_found_seconds`, `journey_completed`, `journey_seconds`: as defined above, whole seconds.
   - `transcript`: one object per command in the order typed, with `utc` as `YYYY-MM-DDTHH:MM:SSZ` (no fractions), `command`, integer `exit_code`, and `output` as text (up to 65536 characters; use `""` for no output). Times must not go backwards. Do not add or remove fields; the validator rejects unknown fields.
   - `failures`: list of strings, `[]` if none.
4. A participant on a target other than the three is not valid. Every participant's target must be one of the three candidate targets.

## Validate locally and hand it to the release

Run from the repository root with Node (no build needed):

```
node scripts/ci/release-user-observation.mjs <record.json> 0.6.0 <superrepo-sha> <compiler-sha> <validated-evidence.json>
```

`<validated-evidence.json>` is `<release>/qualified/validated-evidence.json` from the aggregated candidate. The command prints the record with the added thresholds and exits 0 when valid. On failure it prints one `CLI06-06 user observation: ...` line to stderr and exits 1. The record file and the evidence file must be regular files, not symlinks.

You can check the format with the example in this folder:

```
node scripts/ci/release-user-observation.mjs docs/release/cli06-06-usability-check/record-example.json 0.6.0 aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb docs/release/cli06-06-usability-check/example-validated-evidence.json
```

The repository test is `node --test scripts/ci/test/release-user-observation.test.mjs`.

Hand-off: `scripts/ci/woodpecker-release.sh` requires the environment variable `BESKID_V06_USER_OBSERVATION_FILE` for every 0.6 version. Set it to the path of the record file as the release step sees it. The script runs the same validator against `$qualified/validated-evidence.json` with the checkout's commits, stores the result in `release-state.json` as `user_observation`, and exits 1 when the variable is missing or the record is invalid. This happens before any installer work, so a bad record stops the release.
