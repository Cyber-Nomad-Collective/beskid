$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '..\windows-installer-vendor.ps1')
$dir = Join-Path ([IO.Path]::GetTempPath()) ('beskid-vendor-test-' + [guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory -Path $dir | Out-Null
try {
  $ids = @('VcRedistX64','VsBuildTools2022','LlvmX64')
  $packages = @()
  foreach ($id in $ids) {
    $name = "$id.exe"
    $path = Join-Path $dir $name
    [IO.File]::WriteAllText($path, $id)
    $packages += [pscustomobject]@{ id=$id; name=$name; version='1.2.3'; sha512=(Get-FileHash -LiteralPath $path -Algorithm SHA512).Hash.ToLowerInvariant(); size=(Get-Item $path).Length }
  }
  $actual = @(Read-LockedVendorPayloads ([pscustomobject]@{ packages=$packages }) $dir)
  if ($actual.Count -ne 3) { throw 'Valid vendor payloads were not accepted' }
  foreach ($badName in @('../escape.exe','C:\escape.exe','/tmp/escape.exe')) {
    $packages[0].name = $badName
    try { [void](Read-LockedVendorPayloads ([pscustomobject]@{ packages=$packages }) $dir); throw 'Unsafe vendor path was accepted' }
    catch { if ($_.Exception.Message -eq 'Unsafe vendor path was accepted') { throw } }
  }
} finally {
  Remove-Item -LiteralPath $dir -Recurse -Force
}
Write-Output 'Windows installer vendor payload tests OK'
