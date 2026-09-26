# Monitor Burn acquisition and close its progress window. A failed monitor
# terminates the exact launched process tree before returning to the smoke.
function Get-InstallerDescendantIds([int]$rootId) {
  $all = @(Get-CimInstance Win32_Process)
  $ids = @($rootId)
  for ($index = 0; $index -lt $ids.Count; $index++) {
    $parentId = $ids[$index]
    $ids += @($all | Where-Object { $_.ParentProcessId -eq $parentId } | Select-Object -ExpandProperty ProcessId)
  }
  return @($ids | Select-Object -Skip 1)
}

function Stop-InstallerProcessTree([System.Diagnostics.Process]$process) {
  if ($env:OS -eq 'Windows_NT') {
    $ids = @($process.Id)
    $scanFailed = $false
    try { $ids += @(Get-InstallerDescendantIds $process.Id) }
    catch { $scanFailed = $true }
    foreach ($id in @($ids | Select-Object -Unique | Sort-Object -Descending)) {
      & taskkill.exe /PID $id /T /F *> $null
    }
    if ($scanFailed) { throw 'Could not enumerate installer descendants during cleanup' }
    $remaining = @(Get-CimInstance Win32_Process | Where-Object { $ids -contains $_.ProcessId })
    if ($remaining.Count) { throw "Could not stop installer process tree: $($remaining.ProcessId -join ',')" }
  } else {
    $process.Refresh()
    if (-not $process.HasExited) { $process.Kill($true) }
  }
  if (-not $process.WaitForExit(10000)) { throw "Installer process $($process.Id) did not stop within ten seconds" }
}

function Invoke-DownloadCancellation(
  [System.Diagnostics.Process]$process,
  [string]$logPath,
  [int]$acquisitionTimeoutMs = 600000,
  [int]$exitTimeoutMs = 120000
) {
  if ($acquisitionTimeoutMs -le 0 -or $exitTimeoutMs -le 0) { throw 'Cancel timeouts must be positive' }
  $completed = $false
  try {
    $deadline = [DateTime]::UtcNow.AddMilliseconds($acquisitionTimeoutMs)
    $acquisition = $null
    while ([DateTime]::UtcNow -lt $deadline) {
      $process.Refresh()
      if ($process.HasExited) { throw "Cancel fixture exited before a bundle download began: $($process.ExitCode)" }
      if (Test-Path -LiteralPath $logPath -PathType Leaf) {
        $body = Get-Content -LiteralPath $logPath -Raw
        $matches = [regex]::Matches($body, 'i338: Acquiring package: (VcRedistX64|VsBuildTools2022|LlvmX64), payload: ([A-Za-z0-9._-]+)')
        if ($matches.Count) {
          $acquisition = $matches[$matches.Count - 1]
          $payload = $acquisition.Groups[2].Value
          if ($body -match ('i336: Acquired payload: ' + [regex]::Escape($payload))) {
            throw "Cancel fixture download completed before UI cancellation: $payload"
          }
          break
        }
      }
      Start-Sleep -Milliseconds 100
    }
    if (-not $acquisition) { throw "Cancel fixture did not reach a Burn download within $acquisitionTimeoutMs ms; see $logPath" }
    $process.Refresh()
    if ($process.HasExited -or $process.MainWindowHandle -eq [IntPtr]::Zero -or -not $process.CloseMainWindow()) {
      throw 'Cancel fixture could not close the visible Burn progress window during download'
    }
    if (-not $process.WaitForExit($exitTimeoutMs)) { throw "Burn did not exit within $exitTimeoutMs ms after UI cancellation; see $logPath" }
    if ($env:OS -eq 'Windows_NT') {
      $children = @(Get-InstallerDescendantIds $process.Id)
      if ($children.Count) { throw "Burn exited while installer descendants remain: $($children -join ',')" }
    }
    $completed = $true
    return [pscustomobject]@{
      ExitCode=$process.ExitCode;
      Package=$acquisition.Groups[1].Value;
      Payload=$acquisition.Groups[2].Value
    }
  } finally {
    if (-not $completed) { Stop-InstallerProcessTree $process }
  }
}
