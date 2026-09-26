import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const helper = new URL("../windows-installer-cancel.ps1", import.meta.url);

test("cancel monitor terminates a launched process when acquisition times out", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "beskid-cancel-monitor-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const fixture = join(dir, "idle.ps1");
  const runner = join(dir, "runner.ps1");
  writeFileSync(fixture, "Start-Sleep -Seconds 30\n");
  writeFileSync(runner, `
. '${helper.pathname}'
$child = Start-Process -FilePath 'pwsh' -ArgumentList @('-NoProfile','-File','${fixture}') -PassThru
try {
  Invoke-DownloadCancellation -Process $child -LogPath '${join(dir, "missing.log")}' -AcquisitionTimeoutMs 300 | Out-Null
  throw 'monitor unexpectedly succeeded'
} catch {
  if ($_.Exception.Message -notmatch 'did not reach a Burn download') { throw }
  $child.Refresh()
  if (-not $child.HasExited) { throw 'launched process survived failed cancel monitor' }
}
`);
  const result = spawnSync("pwsh", ["-NoProfile", "-File", runner], { encoding: "utf8", timeout: 10000 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("cancel monitor terminates a launched process when no Burn window is available", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "beskid-cancel-window-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const fixture = join(dir, "idle.ps1");
  const log = join(dir, "cancel.log");
  const runner = join(dir, "runner.ps1");
  writeFileSync(fixture, "Start-Sleep -Seconds 30\n");
  writeFileSync(log, "i338: Acquiring package: VcRedistX64, payload: VcRedistX64\n");
  writeFileSync(runner, `
. '${helper.pathname}'
$child = Start-Process -FilePath 'pwsh' -ArgumentList @('-NoProfile','-File','${fixture}') -PassThru
try {
  Invoke-DownloadCancellation -Process $child -LogPath '${log}' -AcquisitionTimeoutMs 1000 | Out-Null
  throw 'monitor unexpectedly succeeded'
} catch {
  if ($_.Exception.Message -notmatch 'visible Burn progress window') { throw }
  $child.Refresh()
  if (-not $child.HasExited) { throw 'launched process survived missing-window failure' }
}
`);
  const result = spawnSync("pwsh", ["-NoProfile", "-File", runner], { encoding: "utf8", timeout: 10000 });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
