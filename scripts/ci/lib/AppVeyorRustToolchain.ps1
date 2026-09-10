function Invoke-AppVeyorNativeCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    $previousErrorAction = $ErrorActionPreference
    try {
        # Native tools routinely use stderr for progress. Preserve their output and make the
        # process exit code, rather than the output stream, the sole failure authority.
        $ErrorActionPreference = 'Continue'
        & $Command @Arguments 2>&1 | ForEach-Object { Write-Host $_ }
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorAction
    }

    if ($exitCode -ne 0) {
        throw "Native command failed with exit code ${exitCode}: $Command $($Arguments -join ' ')"
    }
}

function Enable-AppVeyorRustToolchain {
    if (-not (Get-Command rustup -ErrorAction SilentlyContinue)) {
        $rustupInit = Join-Path ([System.IO.Path]::GetTempPath()) "rustup-init-$PID.exe"
        try {
            Invoke-WebRequest -UseBasicParsing -Uri 'https://win.rustup.rs/x86_64' -OutFile $rustupInit
            Invoke-AppVeyorNativeCommand -Command $rustupInit -Arguments @(
                '-y', '--profile', 'minimal', '--default-toolchain', 'none'
            )
        }
        finally {
            Remove-Item -LiteralPath $rustupInit -Force -ErrorAction SilentlyContinue
        }

        $cargoHome = if ($env:CARGO_HOME) { $env:CARGO_HOME } else { Join-Path $env:USERPROFILE '.cargo' }
        $cargoBin = Join-Path $cargoHome 'bin'
        if (-not (($env:PATH -split ';') -contains $cargoBin)) {
            $env:PATH = "$cargoBin;$env:PATH"
        }
    }

    if (-not (Get-Command rustup -ErrorAction SilentlyContinue)) {
        throw 'rustup is unavailable after AppVeyor bootstrap'
    }
    Invoke-AppVeyorNativeCommand -Command rustup -Arguments @('toolchain', 'install', 'stable', '--profile', 'minimal')
    Invoke-AppVeyorNativeCommand -Command rustup -Arguments @('default', 'stable')
    Invoke-AppVeyorNativeCommand -Command rustup -Arguments @('target', 'add', 'x86_64-pc-windows-msvc')
}
