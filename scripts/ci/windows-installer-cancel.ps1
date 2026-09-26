# Monitor Burn acquisition and close its progress window. A failed monitor
# terminates the exact launched process tree before returning to the smoke.
function Invoke-BoundedCommand([string]$filePath, [string]$argumentLine, [int]$timeoutMs) {
  if ($timeoutMs -le 0) { throw 'Command timeout must be positive' }
  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $filePath
  $startInfo.Arguments = $argumentLine
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  $started = $false
  try {
    if (-not $process.Start()) { throw "Could not start $filePath" }
    $started = $true
    $stdout = $process.StandardOutput.ReadToEndAsync()
    $stderr = $process.StandardError.ReadToEndAsync()
    if (-not $process.WaitForExit($timeoutMs)) {
      $process.Kill()
      if (-not $process.WaitForExit(2000)) { throw "$filePath timed out and could not be stopped" }
      throw "$filePath timed out after $timeoutMs ms"
    }
    if (-not $stdout.Wait(2000) -or -not $stderr.Wait(2000)) { throw "$filePath output drain timed out" }
    return [pscustomobject]@{ ExitCode=$process.ExitCode; Stdout=$stdout.Result; Stderr=$stderr.Result }
  } finally {
    if ($started -and -not $process.HasExited) {
      $process.Kill()
      [void]$process.WaitForExit(2000)
    }
    $process.Dispose()
  }
}

function Get-CleanupRemainingMs([datetime]$deadline) {
  $remaining = [int]($deadline - [DateTime]::UtcNow).TotalMilliseconds
  if ($remaining -le 0) { throw 'Installer cleanup exceeded its deadline' }
  return [Math]::Min($remaining, 5000)
}

function Get-InstallerDescendantIds([int]$rootId, [int]$timeoutMs = 5000) {
  $script = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId | ConvertTo-Json -Compress'
  $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
  $snapshot = Invoke-BoundedCommand 'powershell.exe' "-NoProfile -NonInteractive -EncodedCommand $encoded" $timeoutMs
  if ($snapshot.ExitCode -ne 0) { throw "Process enumeration failed: $($snapshot.Stderr)" }
  $all = @($snapshot.Stdout | ConvertFrom-Json)
  $ids = @($rootId)
  for ($index = 0; $index -lt $ids.Count; $index++) {
    $parentId = $ids[$index]
    $ids += @($all | Where-Object { $_.ParentProcessId -eq $parentId } | Select-Object -ExpandProperty ProcessId)
  }
  return @($ids | Select-Object -Skip 1)
}

function Stop-InstallerProcessTree([System.Diagnostics.Process]$process) {
  if ($env:OS -eq 'Windows_NT') {
    $deadline = [DateTime]::UtcNow.AddSeconds(20)
    $ids = @($process.Id)
    $scanFailed = $false
    try { $ids += @(Get-InstallerDescendantIds $process.Id (Get-CleanupRemainingMs $deadline)) }
    catch { $scanFailed = $true }
    $killFailed = $false
    foreach ($id in @($ids | Select-Object -Unique | Sort-Object -Descending)) {
      try { [void](Invoke-BoundedCommand 'taskkill.exe' "/PID $id /T /F" (Get-CleanupRemainingMs $deadline)) }
      catch { $killFailed = $true }
    }
    if ($scanFailed) { throw 'Could not enumerate installer descendants during cleanup' }
    $remaining = @(Get-InstallerDescendantIds $process.Id (Get-CleanupRemainingMs $deadline))
    $process.Refresh()
    if ($killFailed -or -not $process.HasExited -or $remaining.Count) { throw "Could not stop installer process tree: $($remaining -join ',')" }
  } else {
    $process.Refresh()
    if (-not $process.HasExited) { $process.Kill($true) }
  }
  $waitMs = if ($env:OS -eq 'Windows_NT') { Get-CleanupRemainingMs $deadline } else { 10000 }
  if (-not $process.WaitForExit($waitMs)) { throw "Installer process $($process.Id) did not stop within cleanup deadline" }
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
