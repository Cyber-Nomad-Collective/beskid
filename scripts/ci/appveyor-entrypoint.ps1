$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$lane = $env:BESKID_CI_LANE
if ($lane -ne 'windows-compiler') {
    throw "Unsupported Windows AppVeyor lane: $lane"
}

Set-Location $root
. (Join-Path $root 'scripts/ci/lib/AppVeyorRustToolchain.ps1')
Invoke-AppVeyorNativeCommand -Command bash -Arguments @('./scripts/ci/init-compiler-submodule.sh')

Enable-AppVeyorRustToolchain

$llvmVersion = '20.1.8'
choco install llvm --version=$llvmVersion --yes --no-progress --limit-output --allow-downgrade
$llvmBin = Join-Path $env:ProgramFiles 'LLVM\bin'
$requiredTools = @('llvm-nm.exe', 'llvm-readobj.exe', 'llvm-ml.exe', 'clang.exe')
foreach ($tool in $requiredTools) {
    $toolPath = Join-Path $llvmBin $tool
    if (-not (Test-Path -LiteralPath $toolPath -PathType Leaf)) {
        throw "Pinned LLVM $llvmVersion did not provide $toolPath"
    }
}
$reportedVersion = & (Join-Path $llvmBin 'clang.exe') --version | Select-Object -First 1
if ($reportedVersion -notmatch "clang version $([regex]::Escape($llvmVersion))(?:\s|$)") {
    throw "Expected LLVM $llvmVersion, got: $reportedVersion"
}
$env:LLVM_NM = Join-Path $llvmBin 'llvm-nm.exe'
$env:LLVM_READOBJ = Join-Path $llvmBin 'llvm-readobj.exe'
$env:PATH = "$llvmBin;$env:PATH"

$linker = Join-Path $env:VCToolsInstallDir 'bin\Hostx64\x64\link.exe'
if (-not (Test-Path -LiteralPath $linker -PathType Leaf)) {
    throw "MSVC linker not found: $linker"
}
$env:CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER = $linker
$env:BESKID_RUNTIME_PREFIX = Join-Path $root 'compiler\target\native-runtime-kit-windows-matrix'

bash ./compiler/scripts/stage-native-runtime-kit-matrix.sh
if ($LASTEXITCODE -ne 0) {
    throw "Windows ABI-v5 runtime-kit matrix failed with exit code $LASTEXITCODE"
}
