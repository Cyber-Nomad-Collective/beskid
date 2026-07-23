## Agent E — Corelib / real-program failures (read-only)

**Evidence pin:** root `c765ef51`, Actions [29977866969](https://github.com/Cyber-Nomad-Collective/beskid/actions/runs/29977866969), report exit **132**. Quality + CLI build + kit stage PASS; tests die in ~2s. Bootstrap ISLE selection succeeds before Corelib suites.

Gate order on tip:
1. `SystemSyscallWriteTests` — 3 FAIL (MissingRuleOrFact / TestDefinition)
2. `SystemSyscallApiTests` — 2 FAIL (MissingRuleOrFact / Syscall.Read Block)
3. `SystemSyscallErgonomicsTests` — 3 FAIL (MissingRuleOrFact / TestDefinition)
4. `SystemOutputWriteLineTests` — CLIF ok → Finalize JIT → **SIGILL / core dump** (process killed; later suites never run)

---

### Prioritized root-cause clusters (blast radius)

| P | Cluster | Category | Tip symptom | Blast radius |
|---|---|---|---|---|
| **P0** | **C1 — Syntax-ISLE gaps on Corelib Syscall surfaces** | ISLE missing-rule (not parser/semantic) | `isle.missing emit_item_statement` → `Lowering(MissingRuleOrFact … TestDefinition@…)` on Write/Ergonomics; `… Block@91` on `Syscall.Read` for ApiTests | All Syscall write/read/ergonomics tests (~8 named fails here); any test whose root set pulls unmatched Syscall bodies. Dozens of Corelib tests collapse here once the gate runs further. |
| **P0** | **C2 — Post-JIT native abort on OutputWriteLine** | Runtime / JIT capability (after successful CLIF) | `clif.end outcome=ok` (9 fns), Finalize JIT, then Illegal instruction / exit 132 | Any Corelib/runtime smoke that reaches JIT execute; blocks Linux proof (CYB-32) and CYB-41. |
| **P1** | **C3 — Latent ANSI / string / generic-ABI** | Runtime + ABI specialization | Not observed this run (SIGILL stops earlier). Historical: allocation overflow, null string handle, `no call-derived ABI specialization` | Console/ANSI/progress-bar modules; large secondary Corelib surface after C1+C2. |
| **P2** | **C4 — Semantic type-surface (historical CYB-132)** | Semantic (mostly retired on tip) | Tip suites reach Generate CLIF; no “missing generic arguments” flood in this log | Was blocking; CYB-135/139 Done. Parent CYB-132 title/description **stale** vs tip. |
| **—** | **Parser** | — | None in tip log | — |
| **—** | **Harness / session identity** | Secondary observation | OutputWriteLine lower logs `session_fingerprint=<none>` / `syntax_generation_id=0` while prepare had a fingerprint | Did not stop CLIF; investigate only if JIT abort attribution needs session bugs. |
| **—** | **Bootstrap / kit staging** | Expected fixture / non-failure | Bootstrap `isle.selected` ok; kit 3 files / 96K staged | Not the gate killer. |
| **—** | **Secondary cascades** | Cascade | Gate continues after suite FAIL until SIGILL kills CLI | CYB-134/140/156 never exercised on this run. |

**Important nuance for C1:** `TestDefinition` is **not** universally missing — `output_writeline_smoke`’s TestDefinition **selects** `emit_item_statement` successfully. Tip attributions to TestDefinition on SyscallWrite/Ergonomics are “item emission failed for this test body / root set,” often overlapping discard/binding matches and Assert/Result shapes (see CYB-137), not “no TestDefinition rule exists.”

**ApiTests vs Write path:** Api failures point at `Syscall.bd` `Read` body (`Block@91:87-99:2` — if + `Result::Error(SyscallError::…)`). OutputWriteLine’s dependency closure lowers Write/WriteWith enough for CLIF ok, so Read is a remaining foundation Block/shape gap (CYB-145 Done claimed ordinary Blocks; tip still fails Read).

---

### Mapping to Linear issues

| Cluster | Primary owners | Status | Fit to tip |
|---|---|---|---|
| C1 Write/Ergonomics TestDefinition + match bodies | **CYB-137** (discard-payload matches), parent **CYB-133**; related **CYB-141** (`__panic_str` / Output panic), **CYB-160/161** (Error match) | Backlog / In Progress | Strong — SyscallWrite tests are match-heavy; Output.Write already has discard match and lowers enough for WriteLine CLIF |
| C1 Syscall.Read Block | Parent **CYB-133**; leaf gap after **CYB-145/147/149/155** Done | Need leaf or reopen | Tip-confirmed on `syscall_read_rejects_*` |
| C1 parent umbrella | **CYB-132** In Progress | In Progress | Scope drifted: tip is ISLE, not semantic generics |
| C2 SIGILL | **No dedicated open issue** | — | CYB-133 original was Output **Block MissingRuleOrFact** (superseded); **CYB-134** is ANSI **allocation overflow**, not SIGILL |
| C3 latent | **CYB-134**, **CYB-138**, **CYB-156/157/158/159**, **CYB-140/162/163** | Backlog/Todo | Valid backlog; not tip-first |
| Linux kit proof dependant | **CYB-32** | In Progress | Blocked by C2 |

---

### Recommended additional issues (only if needed)

1. **Yes — new under CYB-9:** `W5.9d — Diagnose Linux JIT SIGILL after Finalize on SystemOutputWriteLineTests.output_writeline_smoke`  
   - Repro: gate / targeted `beskid_cli test --target SystemOutputWriteLineTests` with staged ABI-v5 kit.  
   - Do **not** fold into CYB-134 (different abort mode) or CYB-133 (CLIF now succeeds).

2. **Maybe — leaf under CYB-133:** `Lower Core.Syscall.Read if/error Block through syntax ISLE`  
   - Only if CYB-145 is treated closed and owners refuse to reopen; tip still fails `Read@91`.

3. **No new semantic issues** for CYB-132’s original generics story — update/close parent when leaves absorb tip ISLE work.

4. **No new parser / harness tickets** from this run.

---

### First-failing fixtures / minimal repros

| Cluster | First fail (tip) | Minimal source |
|---|---|---|
| C1a TestDefinition / Write suite | `syscall_write_empty_string_returns_non_negative` | `/Users/mikserek/Projects/beskid/compiler/corelib/beskid_corelib/tests/corelib_tests/src/system/SyscallWriteTests.bd` lines 8–18 (`Write` + `match` with `Ok(written)` / `Error(_)`) |
| C1b Syscall.Read Block | `syscall_read_rejects_unsupported_fd` | `SyscallApiTests.bd` → pulls `packages/foundation/src/Core/Syscall/Syscall.bd` `Read` lines 91–99 |
| C1c Ergonomics (same family) | `syscall_write_stdout_typed_smoke` | `SyscallErgonomicsTests.bd` lines 12–29 (`WriteWith` + match) |
| C2 JIT SIGILL | `output_writeline_smoke` | `OutputWriteLineTests.bd` lines 6–8 — one `Core.Output.WriteLine(...)` call |

**Targeted commands (from Linear / gate):**
```bash
# C1
target/release/beskid_cli test --project corelib_tests.bproj --target SystemSyscallWriteTests --plain
target/release/beskid_cli test --project corelib_tests.bproj --target SystemSyscallApiTests --plain

# C2
BESKID_RUNTIME_PREFIX=…/native-runtime-kit BESKID_RUNTIME_KIT_PROFILE=release \
  target/release/beskid_cli test --project corelib_tests.bproj --target SystemOutputWriteLineTests --plain
```

---

### Subsystem ownership map

| Cluster | Owning subsystem | Out of Agent E edit scope (for implementers) |
|---|---|---|
| C1 ISLE MissingRuleOrFact | `beskid_isle` item/statement selection + `beskid_codegen` SyntaxNodeFacts + enum-match facts (`beskid_queries`) | Compiler crates (Codex W5.9) |
| C2 SIGILL | Engine JIT finalize/execute + ABI-v5 kit symbols + Output→Syscall call ABI | `beskid_engine` / runtime kit / ISLE emit quality |
| C3 ANSI/strings | Aggregate layout emit + GC/string handles + specialization harvest | codegen + runtime (CYB-134 tree) |
| C4 (historical) | Type resolution / nested generics | Mostly Done (CYB-135/139) |
| Gate harness | `scripts/ci/corelib-gate.sh` + `beskid_cli test` | Report only tails last 40 lines — full taxonomy needs job log (as used here) |

---

### Assumptions

1. Report file’s failure diagnostics are a **sanitized 40-line tail**; full cluster evidence requires `gh run … --log-failed` (done).
2. Attribution of MissingRuleOrFact to `TestDefinition` often means **item-root failure**, not absence of every TestDefinition rule (counterexample: OutputWriteLine).
3. CYB-132 remaining “In Progress” work is assumed to absorb tip Syscall ISLE work or should be retitled; not treated as still primarily semantic.
4. C3 backlog remains valid but is **latent** until C2 stops killing the process mid-gate.
5. No tip evidence of parser failures, session-identity primary bugs, or Bootstrap selection failure.
6. Compiler SHA in user brief (`ec164ff9`) assumed aligned with submodule at CI commit `c765ef51`; not re-verified beyond Actions headSha.