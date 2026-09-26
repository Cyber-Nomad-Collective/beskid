# Bounded child process execution with simultaneous pipe drains.
function Invoke-BoundedProcess([System.Diagnostics.ProcessStartInfo]$startInfo, [int]$timeoutMs) {
  if ($timeoutMs -le 0) { throw 'Process timeout must be positive' }
  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  try {
    if (-not $process.Start()) { throw "Could not start $($startInfo.FileName)" }
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()
    $timedOut = -not $process.WaitForExit($timeoutMs)
    if ($timedOut) {
      if ($env:OS -eq 'Windows_NT') {
        & taskkill.exe /PID $process.Id /T /F *> $null
      } else {
        $process.Kill()
      }
      [void]$process.WaitForExit(5000)
    }
    if (-not $stdoutTask.Wait(5000) -or -not $stderrTask.Wait(5000)) { throw 'Timed out draining child process output' }
    return [pscustomobject]@{
      ExitCode = if ($timedOut) { -1 } else { $process.ExitCode }
      TimedOut = $timedOut
      Stdout = $stdoutTask.Result
      Stderr = $stderrTask.Result
    }
  } finally {
    $process.Dispose()
  }
}
