# Verify audited vendor bytes against the checked-in prerequisite lock.
function Read-LockedVendorPayloads($lock, [string]$auditDir) {
  $ids = @('VcRedistX64','VsBuildTools2022','LlvmX64')
  if (-not (Test-Path -LiteralPath $auditDir -PathType Container)) { throw "Missing vendor audit directory: $auditDir" }
  $root = [IO.Path]::GetFullPath($auditDir)
  $rootItem = Get-Item -LiteralPath $root
  if (($rootItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Vendor audit directory must not be a link' }
  if ($lock.packages.Count -ne 3) { throw 'Expected exactly three locked vendor payloads' }
  for ($index = 0; $index -lt $ids.Count; $index++) {
    $item = $lock.packages[$index]
    $name = [string]$item.name
    if ($item.id -ne $ids[$index] -or $name -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]*\.exe$' -or
        [IO.Path]::GetFileName($name) -cne $name -or [IO.Path]::IsPathRooted($name)) {
      throw "Invalid locked vendor ID or payload basename: $($item.id)"
    }
    $path = [IO.Path]::GetFullPath((Join-Path $root $name))
    if (-not $path.StartsWith(($root.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar), [StringComparison]::OrdinalIgnoreCase)) {
      throw "Vendor payload path escaped audit directory: $name"
    }
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing vendor audit payload: $path" }
    $file = Get-Item -LiteralPath $path
    if (($file.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Vendor audit payload must not be a link: $name" }
    $actual = (Get-FileHash -LiteralPath $path -Algorithm SHA512).Hash.ToLowerInvariant()
    if ($actual -ne $item.sha512 -or $file.Length -ne $item.size) { throw "Vendor hash/size mismatch: $($item.id)" }
    [pscustomobject]@{ id=$item.id; version=$item.version; sha512=$actual; size=$file.Length }
  }
}
