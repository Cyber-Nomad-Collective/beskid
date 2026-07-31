# wayfinder:research

## Question

What is the root cause of the missing `beskid` binary in the learn container? The error shows `ENOENT: no such file or directory, posix_spawn '/app/site/learn/beskid'` even though the Dockerfile (site/learn/Dockerfile) has a multi-stage Rust build that compiles `beskid_cli` and copies it via `COPY --from=rust /workspace/runtime-output/beskid /app/site/learn/beskid`.

Investigate:
1. Does the Rust build stage (`FROM rust:1.90`) complete successfully in CI?
2. Does `stage-native-runtime-kit.sh` produce the expected artifacts at `/workspace/runtime-output/`?
3. Is the `install -m 0755` command succeeding?
4. Are there any CI log clues about build failures?
5. Is the deployed image stale (i.e., built before the Dockerfile was updated)?

Output: root cause analysis with a concrete fix recommendation.
