$ErrorActionPreference = "Stop"

$baseUrl = "https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/cli-latest"
$versionUrl = "$baseUrl/cli-version.txt"
$installDir = Join-Path $env:USERPROFILE ".beskid\bin"
$binaryName = "beskid-windows-amd64.exe"
$url = "$baseUrl/$binaryName"

Write-Output "Fetching version from $versionUrl"
try {
    $version = (Invoke-WebRequest -Uri $versionUrl -UseBasicParsing).Content.Trim()
} catch {
    Write-Output "Failed to download $versionUrl (rolling release metadata)."
    Write-Output "If this persists, check that the cli-latest release includes cli-version.txt."
    throw
}
if ([string]::IsNullOrWhiteSpace($version)) {
    throw "cli-version.txt from $versionUrl was empty."
}

Write-Output "Installing Beskid CLI $version (rolling build)"

if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
}

$targetPath = Join-Path $installDir "beskid.exe"
Write-Output "Downloading $url"
Invoke-WebRequest -Uri $url -OutFile $targetPath

$pathEntries = [Environment]::GetEnvironmentVariable("Path", "User")
if ($null -eq $pathEntries) { $pathEntries = "" }

if ($pathEntries -notlike "*$installDir*") {
    $newPath = if ($pathEntries) { "$pathEntries;$installDir" } else { $installDir }
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Output "Added $installDir to user PATH. Restart your terminal to use beskid."
} else {
    Write-Output "User PATH already contains $installDir"
}

Write-Output "Installed to $targetPath"
