---
title: "Download Beskid CLI"
description: Download the Beskid CLI for your platform or install it with a script.
---

## Quick install

### macOS + Linux

```bash
curl -fsSL https://beskid-lang.org/install.sh | bash
```

### Windows (PowerShell)

```powershell
iwr https://beskid-lang.org/install.ps1 -useb | iex
```

## Direct downloads (latest)

- **Linux (x86_64):** `https://cdn.beskid-lang.org/releases/latest/beskid-linux-amd64`
- **macOS (Apple Silicon):** `https://cdn.beskid-lang.org/releases/latest/beskid-darwin-arm64`
- **Windows (x86_64):** `https://cdn.beskid-lang.org/releases/latest/beskid-windows-amd64.exe`

## Versioned downloads

Replace `<version>` with the tagged release (for example `0.1.0`):

- `https://cdn.beskid-lang.org/releases/<version>/beskid-linux-amd64`
- `https://cdn.beskid-lang.org/releases/<version>/beskid-darwin-arm64`
- `https://cdn.beskid-lang.org/releases/<version>/beskid-windows-amd64.exe`

## Install location

- macOS/Linux: `~/.beskid/bin/beskid`
- Windows: `%USERPROFILE%\.beskid\bin\beskid.exe`

## Notes

- `latest/` always tracks the newest tagged release.
- If you want reproducible downloads, use the versioned URLs.
