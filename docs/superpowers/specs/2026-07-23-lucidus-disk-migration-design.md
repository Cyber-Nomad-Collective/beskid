# Lucidus disk migration — design

**Date:** 2026-07-23  
**Goal:** Free ≥200 GB on internal APFS while keeping hot paths on SSD.  
**Volume:** `/Volumes/Lucidus_1T` (ExFAT, ~403 GB free). Symlinks live on APFS; targets on Lucidus.

## Approach

Cold bulk + symlinks (option A). Lucidus is almost always mounted.

## Layout

```
/Volumes/Lucidus_1T/MacHome/
  Projects/      # cold clones/worktrees (not active beskid)
  local-share/   # ~/.local/share/containers (+ optional shares)
  nuget/         # ~/.nuget
  models/        # GPT4All, ollama, lmstudio
  Archives/      # Bdziam, bdziam_home, Nexus 5, Soulseek, FP, apprenticevr
```

Existing `/Volumes/Lucidus_1T/SteamLibrary` remains the Steam library; internal `steamapps` migrates or is removed after Steam points at Lucidus.

## Hot (stay on SSD)

- `~/Projects/beskid` (primary checkout)
- Cursor / IDE app support and active caches
- `~/.rustup`, `~/.cargo`
- Homebrew (`/opt/homebrew`)

## Method

1. `rsync -avh --progress` source → Lucidus (no `-H`; ExFAT)
2. Size/spot-check verify
3. Remove/rename source; `ln -s` from APFS home to Lucidus path
4. Purge regenerable Library caches (do not migrate)
5. Log moves under `MacHome/Caches-purge-log/`

## Safety

- No delete until rsync verify
- Do not touch iCloud / Google Drive mounts
- Stop Podman/Steam as needed before moving their data
