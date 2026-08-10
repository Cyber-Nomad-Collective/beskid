# Installs the Beskid CLI raw binary. Platform packages (.msi, .exe, .deb, .dmg, Snap, Homebrew)
# are also available — see https://beskid-lang.org/downloads/ for alternatives.
$ErrorActionPreference = "Stop"

if ($env:BESKID_RELEASE_TAG) {
    $releaseTag = $env:BESKID_RELEASE_TAG.Trim()
    } else {
        switch (($env:BESKID_RELEASE_CHANNEL ?? "stable").Trim().ToLower()) {
        "stable" { $releaseTag = "cli-stable" }
        "unstable" { $releaseTag = "cli-unstable" }
        default { $releaseTag = "cli-stable" }
    }
}
$baseUrl = "https://github.com/Cyber-Nomad-Collective/beskid_compiler/releases/download/$releaseTag"
$versionUrl = "$baseUrl/cli-version.txt"
$installDir = Join-Path $env:USERPROFILE ".beskid\bin"
$binaryName = "beskid-windows-amd64.exe"
$url = "$baseUrl/$binaryName"

Write-Output "Fetching version from $versionUrl"
try {
    $version = (Invoke-WebRequest -Uri $versionUrl -UseBasicParsing).Content.Trim()
} catch {
    Write-Output "Failed to download $versionUrl (release metadata)."
    Write-Output "If this persists, check that the $releaseTag release includes cli-version.txt."
    throw
}
if ([string]::IsNullOrWhiteSpace($version)) {
    throw "cli-version.txt from $versionUrl was empty."
}

if ($releaseTag -eq "cli-stable" -or $releaseTag -eq "cli-unstable") {
    Write-Output "Installing Beskid CLI $version (rolling build from $releaseTag)"
} else {
    Write-Output "Installing Beskid CLI $version (pinned release $releaseTag)"
}

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
