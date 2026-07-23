# Lucidus disk migration — plan

> **For agentic workers:** execute sequentially; verify free space after each major move.

**Goal:** ≥200 GB free on internal APFS via cold data → `/Volumes/Lucidus_1T/MacHome/`.

**Helper pattern:**
```bash
SRC="$1"; DST="$2"
rsync -avh --progress "$SRC/" "$DST/"
# verify du roughly matches
mv "$SRC" "${SRC}.__pre_symlink_bak"
ln -s "$DST" "$SRC"
# after smoke test: rm -rf "${SRC}.__pre_symlink_bak"
```
When free space is tight, delete after verify instead of keeping bak (ExFAT copy does not need internal headroom).

## Tasks

1. Migrate `~/.local/share/containers` → `MacHome/local-share/containers`
2. Migrate `~/.nuget` → `MacHome/nuget`
3. Migrate models (nomic GPT4All, `.ollama`, `.lmstudio`) → `MacHome/models/`
4. Migrate cold `~/Projects/*` except `beskid` → `MacHome/Projects/`
5. Migrate archives: Bdziam, bdziam_home, Nexus 5 Content, Soulseek Downloads, FP, apprenticevr
6. Point Steam at existing `SteamLibrary`; clear internal steamapps if redundant
7. Purge safe Library caches; `df -h` verify ≥200 GB free target
