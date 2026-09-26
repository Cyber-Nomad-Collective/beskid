$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\windows-installer-process.ps1')
$psi = New-Object System.Diagnostics.ProcessStartInfo
$hostExe = if ($PSVersionTable.PSEdition -eq 'Desktop') { 'powershell.exe' } elseif ($env:OS -eq 'Windows_NT') { 'pwsh.exe' } else { 'pwsh' }
$psi.FileName = Join-Path $PSHOME $hostExe
$psi.Arguments = '-NoProfile -Command "[Console]::Error.Write((''e'' * 1048576)); [Console]::Out.Write((''o'' * 1048576))"'
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$result = Invoke-BoundedProcess $psi 20000
if ($result.ExitCode -ne 0 -or $result.TimedOut -or $result.Stdout.Length -ne 1048576 -or $result.Stderr.Length -ne 1048576) {
  throw 'Concurrent stdout/stderr drain failed'
}
$psi.Arguments = '-NoProfile -Command "Start-Sleep -Seconds 5"'
$timeout = Invoke-BoundedProcess $psi 100
if (-not $timeout.TimedOut) { throw 'Process timeout was not enforced' }
Write-Output 'Windows installer process helper tests OK'
