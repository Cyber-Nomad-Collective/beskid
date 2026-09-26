# Run on an approved disposable Windows VM only. Each invocation records one scenario.
param(
  [Parameter(Mandatory)][ValidateSet('runtime','developer','community','preexisting','offline','hash-failure','cancel','repair-deselect','upgrade','uninstall')][string]$Scenario,
  [Parameter(Mandatory)][string]$SetupExe,
  [Parameter(Mandatory)][string]$Msi,
  [Parameter(Mandatory)][string]$LockFile,
  [Parameter(Mandatory)][string]$VendorAuditDir,
  [Parameter(Mandatory)][string]$OutputDir,
  [string]$TestProject,
  [string]$ProgramProject,
  [string]$PriorVersion,
  [string]$ObservedSetupExe,
  [string]$ObservedLog,
  [int]$ObservedExitCode = 0,
  [string]$InstallRoot = "${env:ProgramFiles}\Beskid"
)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'Windows installer smoke requires a real Windows VM' }
if (-not [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent().IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Run installer smoke from an elevated shell on a disposable VM'
}
$failure = @('offline','hash-failure','cancel') -contains $Scenario
foreach ($path in @($SetupExe,$Msi,$LockFile)) { if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing input: $path" } }
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$setupHash = (Get-FileHash -LiteralPath $SetupExe -Algorithm SHA256).Hash.ToLowerInvariant()
$msiHash = (Get-FileHash -LiteralPath $Msi -Algorithm SHA256).Hash.ToLowerInvariant()
$lock = Get-Content -LiteralPath $LockFile -Raw | ConvertFrom-Json
$vendor = @()
foreach ($item in $lock.packages) {
  $path = Join-Path $VendorAuditDir $item.name
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing vendor audit payload: $path" }
  $actual = (Get-FileHash -LiteralPath $path -Algorithm SHA512).Hash.ToLowerInvariant()
  $size = (Get-Item -LiteralPath $path).Length
  if ($actual -ne $item.sha512 -or $size -ne $item.size) { throw "Vendor hash/size mismatch: $($item.id)" }
  $vendor += [ordered]@{ id=$item.id; version=$item.version; sha512=$actual; size=$size }
}
if ($vendor.Count -ne 3) { throw 'Expected exactly three locked vendor payloads' }

function Get-State {
  $installedExe = Join-Path $InstallRoot 'bin\beskid.exe'
  $vcKey = 'HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64'
  $vc = Get-ItemProperty -Path $vcKey -ErrorAction SilentlyContinue
  $vcVersion = if ($vc -and $vc.Installed -eq 1) { [string]$vc.Version -replace '^v','' } else { '' }
  $vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
  $buildTools = @()
  $community = @()
  if (Test-Path -LiteralPath $vswhere) {
    $buildTools = @(& $vswhere -products Microsoft.VisualStudio.Product.BuildTools -format json | ConvertFrom-Json | Where-Object { $_ -and $_.installationPath })
    $community = @(& $vswhere -products Microsoft.VisualStudio.Product.Community -format json | ConvertFrom-Json | Where-Object { $_ -and $_.installationPath })
  }
  $msvcVersion = ''
  foreach ($instance in $buildTools) {
    if (-not $instance.installationPath) { continue }
    $versions = @(Get-ChildItem -LiteralPath (Join-Path $instance.installationPath 'VC\Tools\MSVC') -Directory -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)
    if ($versions.Count) { $msvcVersion = ($versions | Sort-Object -Descending)[0]; break }
  }
  $sdkRoot = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits\10\Lib'
  $sdkVersions = @(Get-ChildItem -LiteralPath $sdkRoot -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName 'um\x64\kernel32.lib') } | Select-Object -ExpandProperty Name)
  $sdkVersion = if ($sdkVersions.Count) { ($sdkVersions | Sort-Object -Descending)[0] } else { '' }
  $lld = Join-Path ${env:ProgramFiles} 'LLVM\bin\lld-link.exe'
  $llvmVersion = ''
  $lldExecuted = $false
  if (Test-Path -LiteralPath $lld) {
    $versionText = (& $lld --version 2>&1 | Out-String)
    $lldExecuted = $LASTEXITCODE -eq 0
    if ($versionText -match '(\d+\.\d+\.\d+)') { $llvmVersion = $Matches[1] }
  }
  $communitySignature = @($community | ForEach-Object { "$($_.installationPath)|$($_.installationVersion)" } | Sort-Object) -join ';'
  return [ordered]@{ installed=(Test-Path -LiteralPath $installedExe -PathType Leaf); vc=$vcVersion; msvc=$msvcVersion; sdk=$sdkVersion; llvm=$llvmVersion; lld=$lldExecuted; community=($community.Count -gt 0); community_signature=$communitySignature }
}

function Invoke-FreshCli([string]$verb) {
  $project = if ($verb -eq 'test') { $TestProject } else { $ProgramProject }
  if (-not $project -or -not (Test-Path -LiteralPath $project -PathType Leaf)) { throw "$verb smoke requires a real fixture project/file" }
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = Join-Path $InstallRoot 'bin\beskid.exe'
  $psi.Arguments = if ($verb -eq 'test') { "$verb `"$project`" --json --plain" } else { "$verb `"$project`"" }
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.EnvironmentVariables['PATH'] = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
  foreach ($name in @('INCLUDE','LIB','LIBPATH','VCToolsInstallDir','VCINSTALLDIR','WindowsSdkDir','WindowsSDKVersion')) { $psi.EnvironmentVariables.Remove($name) }
  $process = [System.Diagnostics.Process]::Start($psi)
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  Set-Content -LiteralPath (Join-Path $OutputDir "$Scenario-$verb.log") -Value ($stdout + $stderr)
  if ($process.ExitCode -ne 0) { return $false }
  if ($verb -eq 'test') { return $stdout -match '"passed"\s*:\s*[1-9][0-9]*' }
  return $true
}

$before = Get-State
if ($Scenario -in @('runtime','developer','offline','hash-failure','cancel') -and $before.installed) { throw "$Scenario requires a VM without Beskid installed" }
if ($Scenario -eq 'runtime' -and ($before.msvc -or $before.sdk -or $before.llvm)) { throw 'Runtime-only scenario requires no preexisting developer tools' }
if ($Scenario -eq 'developer' -and ($before.msvc -or $before.sdk -or $before.llvm)) { throw 'Developer scenario requires no preexisting developer tools' }
if ($Scenario -eq 'community' -and (-not $before.community -or $before.msvc)) { throw 'Community-only scenario requires VS Community and no Build Tools product' }
if ($Scenario -eq 'preexisting' -and (-not $before.msvc -or -not $before.sdk -or -not $before.llvm)) { throw 'Preexisting scenario requires the complete native toolchain' }
if ($Scenario -eq 'repair-deselect' -and (-not $before.installed -or -not $before.msvc -or -not $before.llvm)) { throw 'Repair scenario requires a prior opt-in install' }
if ($Scenario -eq 'upgrade' -and (-not $before.installed -or -not $PriorVersion)) { throw 'Upgrade scenario requires an installed prior version and -PriorVersion' }
if ($Scenario -eq 'uninstall' -and -not $before.installed) { throw 'Uninstall scenario requires an installed Beskid' }
$priorVersionText = ''
if ($Scenario -eq 'upgrade') {
  $priorVersionText = (& (Join-Path $InstallRoot 'bin\beskid.exe') --version | Out-String)
  if ($priorVersionText -notmatch [regex]::Escape($PriorVersion)) { throw "Installed Beskid version does not match -PriorVersion $PriorVersion" }
}

$log = Join-Path $OutputDir "$Scenario.log"
if ($failure) {
  if (-not $ObservedSetupExe -or -not (Test-Path -LiteralPath $ObservedSetupExe -PathType Leaf) -or
      -not $ObservedLog -or -not (Test-Path -LiteralPath $ObservedLog -PathType Leaf) -or $ObservedExitCode -eq 0) {
    throw "$Scenario requires the actual setup EXE, failure log, and nonzero exit code from the prepared fault run"
  }
  $observedSetupHash = (Get-FileHash -LiteralPath $ObservedSetupExe -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($Scenario -eq 'hash-failure' -and $observedSetupHash -eq $setupHash) { throw 'Hash-failure scenario requires an altered fixture bundle' }
  if ($Scenario -ne 'hash-failure' -and $observedSetupHash -ne $setupHash) { throw "$Scenario must run the released setup EXE" }
  Copy-Item -LiteralPath $ObservedLog -Destination $log -Force
  $body = Get-Content -LiteralPath $log -Raw
  $marker = switch ($Scenario) { 'offline' { 'download|network|internet' } 'hash-failure' { 'hash|checksum|digest' } 'cancel' { 'cancel|user exit' } }
  if ($body -notmatch $marker) { throw "$Scenario log lacks the expected failure marker" }
  $exitCode = $ObservedExitCode
} else {
  $observedSetupHash = $setupHash
  $arguments = @('/quiet','/norestart','/log',"`"$log`"")
  if ($Scenario -eq 'uninstall') { $arguments += '/uninstall' }
  elseif ($Scenario -eq 'repair-deselect') { $arguments += @('/repair','InstallDeveloperTools=0') }
  else { $arguments += '/install'; $arguments += $(if ($Scenario -in @('developer','community','preexisting','upgrade')) { 'InstallDeveloperTools=1' } else { 'InstallDeveloperTools=0' }) }
  $result = Start-Process -FilePath $SetupExe -ArgumentList $arguments -Wait -PassThru
  $exitCode = $result.ExitCode
  if ($exitCode -ne 0) { throw "$Scenario setup failed with exit code $exitCode; see $log" }
}
$after = Get-State
$shouldInstall = -not $failure -and $Scenario -ne 'uninstall'
if ($after.installed -ne $shouldInstall) { throw "$Scenario left unexpected Beskid installation state" }
if ($before.vc -and -not $after.vc) { throw "$Scenario removed the shared VC++ runtime" }
if ($before.msvc -and -not $after.msvc) { throw "$Scenario removed MSVC Build Tools" }
if ($before.sdk -and -not $after.sdk) { throw "$Scenario removed Windows SDK" }
if ($before.llvm -and -not $after.llvm) { throw "$Scenario removed LLVM" }
if (-not $failure -and $Scenario -ne 'uninstall' -and -not $after.vc) { throw 'VC++ runtime is missing after setup' }
if ($Scenario -eq 'runtime' -and ($after.msvc -or $after.sdk -or $after.llvm)) { throw 'Runtime-only setup installed developer tools' }
$developer = $Scenario -in @('developer','community','preexisting','repair-deselect','upgrade')
if ($developer -and (-not $after.msvc -or -not $after.sdk -or -not $after.llvm -or -not $after.lld)) { throw "$Scenario native toolchain is incomplete" }
if ($Scenario -eq 'community' -and $after.community_signature -ne $before.community_signature) { throw 'VS Community changed during Build Tools setup' }
$installedVersionText = ''
if ($Scenario -eq 'upgrade') {
  $installedVersionText = (& (Join-Path $InstallRoot 'bin\beskid.exe') --version | Out-String)
  if ($installedVersionText -eq $priorVersionText) { throw 'Upgrade did not change the installed Beskid version' }
}
$cli = [ordered]@{ test=$false; build=$false; run=$false }
if ($shouldInstall) {
  $cli.test = Invoke-FreshCli 'test'
  if (-not $cli.test) { throw "$Scenario fresh-environment beskid test failed" }
  if ($developer) {
    $cli.build = Invoke-FreshCli 'build'
    $cli.run = Invoke-FreshCli 'run'
    if (-not $cli.build -or -not $cli.run) { throw "$Scenario fresh-environment build/run failed" }
  }
}
$report = [ordered]@{
  schema_version=1; scenario=$Scenario; real_windows_vm=$true; passed=$true;
  machine_name=$env:COMPUTERNAME; recorded_utc=[DateTime]::UtcNow.ToString('o');
  setup_sha256=$setupHash; msi_sha256=$msiHash; observed_setup_sha256=$observedSetupHash; vendor=$vendor;
  setup_log="$Scenario.log"; setup_exit_code=$exitCode; beskid_installed=$after.installed;
  vendor_retained=$true; community_unchanged=($after.community_signature -eq $before.community_signature);
  vc_version=$after.vc; msvc_version=$after.msvc;
  sdk_version=$after.sdk; llvm_version=$after.llvm; lld_link_executed=$after.lld;
  cli=$cli; fresh_environment=$true; prior_version=$PriorVersion;
  installed_version=$installedVersionText
}
$json = $report | ConvertTo-Json -Depth 8
[System.IO.File]::WriteAllText((Join-Path $OutputDir "$Scenario.json"), $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "$Scenario passed; evidence: $OutputDir"
