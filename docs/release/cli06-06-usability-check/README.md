# CLI06-06 usability check for Beskid 0.6.0

This folder is the kit for the five-participant observation required by the CLI06-06 requirement ("Installed beginner workflow acceptance", scenario `CLI06-06-OBS Uncoached observation`) in `openspec/changes/v06-cli-dependencies/specs/tooling--cli--command-surface/spec.md`. The release owner runs it once per candidate, before publication.

Files here:

- `participant-task.md`: the sheet you give each participant.
- `language-rules.md`: the language-rules handout you give each participant with the task sheet. Its sha256 is pinned (see below).
- `observer-sheet.md`: one copy per participant, filled in during the session.
- `record-template.json`: the empty record with placeholders.
- `record-example.json` and `example-validated-evidence.json`: a filled example that passes the validator, with fake commits and digests. Never submit it.

## What is verified

Five fresh users receive the installed `beskid` CLI, its help and the pinned language-rules handout, and nothing else. The task sheet, including its `Main.bd` line, is task material, not coaching. The spec requires:

- At least 4 of 5 find the `add` command within 60 seconds.
- At least 4 of 5 complete create, add, use, run within 5 minutes (300 seconds).
- The result is one observer-attested record per candidate (`verification: "observer-attested"`). It is an attestation, never machine evidence. It retains, per participant, a transcript with command, time, exit status and output, and it must include the output of `beskid --version` for the candidate. It also holds the candidate CLI digests of every target, the failures and the observer identity.
- Coaching, snapshots or any other material do not count as observations.
- A record below either threshold, or no record, blocks publication.

The scripted version of the same journey runs separately as the native release test `cli06_06_create_add_use_check_build_run_outside_checkout` (in `compiler/crates/beskid_tests_release/tests/cli_journeys_v06.rs`). This kit does not replace it.

## Who can take part

- Participants: five different people with no prior Beskid exposure. They get the installed CLI, its help, the task sheet and the language-rules handout only. The validator requires exactly five participants with unique ids, `materials: "cli-help+language-rules"`, `language_rules_sha256` equal to the committed handout, and each on one of the three candidate targets (`x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, `x86_64-pc-windows-msvc`). Use all three targets across the group if you can (for example 2 Linux, 2 macOS, 1 Windows). The spec does not require a mix.
- Observer: one named person who watches, times and records, and gives no help. The spec only requires the observer identity in the record. The observer should be someone who is not a participant. The release owner may be the observer.
- Do not use people who helped build Beskid or who saw the CLI help, docs, the handout or this task before.

## The language-rules handout

`language-rules.md` is a short summary of the language rules for the task: files and modules, names, types, functions, local values, `pub`, `use`, libraries and the entry point. It does not name CLI commands or steps. Give it unchanged, printed or on screen, at the same moment as the task sheet.

Its pinned sha256 is:

```
8f0e0ebb4f8c180cecc09ee63d1e85e57c14b744068d984a157127cb005993ed
```

Check the file before the sessions with `shasum -a 256 docs/release/cli06-06-usability-check/language-rules.md` (`sha256sum` on Linux). If the digest differs, stop: the handout changed and the validator will reject the record. A change to the handout needs a new digest in this README, the observer sheet and the record template, and it invalidates every record made with the old handout.

## Before the sessions

1. Freeze the candidate. Note the two 40-character commits: the superrepo commit and the compiler commit (`git rev-parse HEAD` and `git rev-parse HEAD:compiler` in the release checkout). The record must carry these exactly.
2. Get the CI build artifacts of that candidate. Each platform is built by its own Woodpecker pipeline of the candidate commit (`BESKID_TASK=build-linux`, `build-macos` and `build-windows`, or `build` for all three), so each platform packet can come from a different pipeline. Note the pipeline number of each platform packet: the release ships exactly these builds (`BESKID_LINUX_BUILD`, `BESKID_MACOS_BUILD`, `BESKID_WINDOWS_BUILD`). For each target you need the bundle `beskid-0.6.0-<target>.tar.gz` and the CLI file (`beskid-linux-amd64`, `beskid-darwin-arm64`, `beskid-windows-amd64.exe`). Check them against the packet `SHA256SUMS`.
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
7. Print `participant-task.md` and `language-rules.md`, or have them on screen. Print one `observer-sheet.md` per participant. Do not give the participant this README.
8. Set up a way to capture the terminal (screen recording or a saved shell session) so the transcript can be checked. Use a stopwatch or the system clock in UTC.

## Procedure per participant

Run the five sessions one after another, each on a fresh account or machine. Each takes about 10 minutes.

1. Tell the participant: "I will not answer questions or give hints. You may use the `beskid` command, its help and the language rules sheet. Please say what you are thinking aloud if you like." Confirm that they have not seen Beskid before.
2. In the participant's terminal, before the clock starts, run `beskid --version` (`beskid.exe --version` on Windows). It must print `beskid 0.6.0`. Record it as the first transcript entry. If it prints anything else, stop.
3. Hand over `participant-task.md` and `language-rules.md` together. Start the clock (T0) at that moment and note the UTC time.
4. Observe silently. Do not answer questions, point at the screen, or react to errors. If the participant asks for help, say "I can't help with that" and note it. If anyone gives help or material beyond the CLI, its help, the task sheet and the handout, the participant is invalid. Replace them with another person; do not submit the participant with other `materials`.
5. Write each command exactly as typed, with UTC time, exit code and output. Record failed and mistyped commands too.
6. Add found: record the time the participant first runs a command starting with `beskid add`. `add_found_seconds` is that time minus T0. The spec does not define the start of the 60 seconds, so this kit uses T0 (the moment the task sheet is handed over), which is the stricter reading. Use null if they never ran it.
7. Journey done: the moment `beskid run` exits 0 at the end of the task. `journey_seconds` is that time minus T0 and must be at most 300 to count. If the participant stops, gives up, or 300 seconds pass without a successful run, set `journey_completed` to false and `journey_seconds` to null, and write the reason in the failures list. Allow the participant to continue past 300 seconds if they wish, but note that it does not count; the validator does not accept a completed journey above 300 for the threshold.
8. After the session, ask for free comments and note the confusing points in the failures list.

## Pass and fail criteria

The check passes only if the validator accepts the record:

- Exactly 5 participants, unique ids, each with `materials: "cli-help+language-rules"` and `language_rules_sha256` equal to the committed handout.
- `add_found_seconds` is non-null and at most 60 for at least 4 participants.
- `journey_completed` is true and `journey_seconds` is at most 300 for at least 4 participants. A completed participant must have a `beskid run` entry with exit code 0.
- Every transcript contains `beskid --version` (or `beskid.exe --version`) with exit code 0 and output `beskid 0.6.0`.
- The record names the right version, superrepo commit and compiler commit, and its three CLI digests equal the candidate's digests.

Anything else fails and blocks publication. Do not edit times or flags to reach four of five. If the check fails, fix the CLI or help and observe five new participants on the next candidate. The fallback is the dated release-owner waiver, valid for 0.6.0 only, which records the unmet requirement and a 0.6.1 obligation. It is outside this kit; see `scripts/ci/release-user-observation.mjs` (`cli06-06-uncoached-observation-waiver`).

## Turn the notes into the record

1. Copy `record-template.json` to `docs/release/cli06-06-record-v0.6.0.json` (the general form is `docs/release/cli06-06-record-v<version>.json`). This is the only path the release reads.
2. Fill the top fields: `version` `0.6.0`, `superrepo_commit`, `compiler_commit`, `recorded_utc` (the time you finish the record), `observer` (name and role), and `candidate_cli_sha256` for the three targets (lowercase hex, 64 characters).
3. Copy the template participant object five times, one per person, and fill it from the observer sheet:
   - `id`: P1 to P5.
   - `target`: the participant's target triple.
   - `materials`: `"cli-help+language-rules"`.
   - `language_rules_sha256`: the pinned handout digest above.
   - `add_found_seconds`, `journey_completed`, `journey_seconds`: as defined above, whole seconds.
   - `transcript`: one object per command in the order typed, with `utc` as `YYYY-MM-DDTHH:MM:SSZ` (no fractions), `command`, integer `exit_code`, and `output` as text (up to 65536 characters; use `""` for no output). Times must not go backwards. Do not add or remove fields; the validator rejects unknown fields.
   - `failures`: list of strings, `[]` if none.
4. A participant on a target other than the three is not valid. Every participant's target must be one of the three candidate targets.

## Validate locally and hand it to the release

Run from the repository root with Node (no build needed):

```
node scripts/ci/release-user-observation.mjs docs/release/cli06-06-record-v0.6.0.json 0.6.0 <candidate-superrepo-sha> <compiler-sha> <validated-evidence.json>
```

`<validated-evidence.json>` is `<release>/qualified/validated-evidence.json` from the aggregated candidate. The command prints the record with the added thresholds and exits 0 when valid. On failure it prints one `CLI06-06 user observation: ...` line to stderr and exits 1. The record file and the evidence file must be regular files, not symlinks.

You can check the format with the example in this folder:

```
node scripts/ci/release-user-observation.mjs docs/release/cli06-06-usability-check/record-example.json 0.6.0 aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb docs/release/cli06-06-usability-check/example-validated-evidence.json
```

The repository test is `node --test scripts/ci/test/release-user-observation.test.mjs`.

## Commit the record and release

The record names the frozen candidate in `superrepo_commit`. A commit cannot contain its own sha, so the record goes into a separate record commit on top of the candidate. The release then ships the candidate's own Woodpecker build, the same files the participants installed. Nothing is rebuilt.

1. Check out the candidate commit (the `superrepo_commit` of the record).
2. Add only `docs/release/cli06-06-record-v<version>.json` and commit it. Change no other file in that commit.
3. Start the manual release pipeline on the record commit (`BESKID_TASK=release`). Set `BESKID_LINUX_BUILD`, `BESKID_MACOS_BUILD` and `BESKID_WINDOWS_BUILD` to the Woodpecker build pipelines of the candidate whose artifacts you installed for the participants. Without a pin, the release takes the newest complete handoff of the candidate for that platform; if that platform was rebuilt after the sessions, the newer CLI can differ from the one in the record, and the release then fails. Do not build the record commit.

The release resolves its source commit with:

```
node scripts/ci/release-user-observation.mjs --source <repo> <version> <head-sha>
```

For a 0.6 version this prints the candidate that the committed record names. `.woodpecker/release.yml` collects one build handoff `<pipeline>-<candidate>` per platform with `scripts/ci/woodpecker-fetch-handoffs.sh`, and `scripts/ci/woodpecker-release.sh` validates, aggregates and publishes those handoffs with the candidate as the source identity (`release-state.json` provenance, installers, streams). `validated-evidence.json` records the pipeline number and the `UPLOAD_SHA256SUMS` digest of each platform handoff in `handoffs`. Then the release checks the record:

```
node scripts/ci/release-user-observation.mjs --release <repo> <version> <head-sha> <compiler-sha> <validated-evidence.json>
```

The release fails, and stops before any installer work, when:

- no record is committed at `docs/release/cli06-06-record-v<version>.json`, or the record is a symlink;
- the candidate of the record is not an ancestor of the record commit, or the record commit changes any file other than the record;
- a platform has no complete handoff of the candidate, or a selected handoff is not a build of the candidate (the handoff capsule, `UPLOAD_COMPLETE` and the aggregated evidence all carry the candidate commit), or its checksums do not match;
- the compiler pointer of the candidate differs from the release identity;
- the record is invalid, below a threshold, or its CLI digests differ from the CLI files of the collected platform builds (`$qualified/validated-evidence.json`, which is checked against each packet's `SHA256SUMS`).

The validated record is stored in `release-state.json` as `user_observation`. The dated owner waiver goes at the same path and follows the same rules.
