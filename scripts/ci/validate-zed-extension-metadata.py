#!/usr/bin/env python3
"""Validate the Zed extension SDK contract through parsed TOML values."""

from pathlib import Path
import sys
import tomllib


if len(sys.argv) != 3:
    raise SystemExit("usage: validate-zed-extension-metadata.py EXTENSION_TOML CARGO_TOML")

extension_path = Path(sys.argv[1])
cargo_path = Path(sys.argv[2])

with extension_path.open("rb") as extension_file:
    extension = tomllib.load(extension_file)
with cargo_path.open("rb") as cargo_file:
    cargo = tomllib.load(cargo_file)

manifest_sdk = extension.get("lib", {}).get("version")
if manifest_sdk != "0.7.0":
    raise SystemExit(
        f"{extension_path}: [lib].version must be exactly 0.7.0, got {manifest_sdk!r}"
    )

cargo_sdk = cargo.get("dependencies", {}).get("zed_extension_api")
if cargo_sdk != "0.7.0":
    raise SystemExit(
        f"{cargo_path}: dependencies.zed_extension_api must be the exact string "
        f"0.7.0, got {cargo_sdk!r}"
    )
