# wayfinder:task

## Question

Fix the compiler binary deployment so the `beskid` binary is present and functional in the deployed learn container, and add graceful degradation when the compiler is unavailable.

Requirements:
1. Fix whatever root cause 001-research-compiler-build identifies (Dockerfile, build script, CI config)
2. Add a startup health check in server.ts that verifies `beskid --version` works on boot and logs a clear warning if unavailable
3. Add graceful degradation in the `/api/check` handler: when the binary is missing, return a structured error response instead of letting `posix_spawn` throw ENOENT
4. The terminal should display a clear "Compiler not available" message rather than a raw error
5. Verify with a local `docker compose -f site/docker-compose.build.yml up learn` test

Blocks on: 001-research-compiler-build
