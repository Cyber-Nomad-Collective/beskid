$ErrorActionPreference = "Stop"

$baseUrl = "https://cdn.beskid-lang.org/releases/latest"
$installDir = Join-Path $env:USERPROFILE ".beskid\bin"
$binaryName = "beskid-windows-amd64.exe"
$url = "$baseUrl/$binaryName"

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
