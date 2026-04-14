"""Nox tasks for the aggregate Beskid repository (superrepo)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import nox

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from ci import open_vsx  # noqa: E402
from ci import submodules  # noqa: E402
from ci import proc  # noqa: E402


def _compiler_dir() -> Path:
    return ROOT / "compiler"


def _asan_env() -> dict[str, str]:
    return {
        # Keep sanitizer flags target-scoped so host proc-macro deps remain loadable.
        "CARGO_TARGET_X86_64_UNKNOWN_LINUX_GNU_RUSTFLAGS": "-Zsanitizer=address",
        "RUSTC_BOOTSTRAP": "1",
        "ASAN_OPTIONS": "detect_leaks=0",
    }


@nox.session(python=False, name="runtime_linux")
def runtime_linux(session: nox.Session) -> None:
    submodules.init_compiler(ROOT)
    cw = _compiler_dir()
    proc.run("cargo", "test", "-p", "beskid_tests", "runtime::", cwd=cw)
    proc.run("cargo", "test", "-p", "beskid_tests", "abi::contracts::", cwd=cw)
    proc.run("cargo", "bench", "-p", "beskid_runtime", "--no-run", cwd=cw)


@nox.session(python=False, name="runtime_e2e_linux")
def runtime_e2e_linux(session: nox.Session) -> None:
    submodules.init_compiler(ROOT)
    cw = _compiler_dir()
    proc.run("cargo", "build", "-p", "beskid_cli", cwd=cw)
    proc.run("cargo", "test", "-p", "beskid_e2e_tests", cwd=cw)


@nox.session(python=False, name="runtime_asan_linux")
def runtime_asan_linux(session: nox.Session) -> None:
    submodules.init_compiler(ROOT)
    cw = _compiler_dir()
    proc.run(
        "cargo",
        "test",
        "-p",
        "beskid_tests",
        "--target",
        "x86_64-unknown-linux-gnu",
        "runtime::",
        cwd=cw,
        env=_asan_env(),
    )


@nox.session(python=False, name="runtime_macos_check")
def runtime_macos_check(session: nox.Session) -> None:
    submodules.init_compiler(ROOT)
    cw = _compiler_dir()
    proc.run(
        "cargo",
        "test",
        "-p",
        "beskid_tests",
        "runtime::",
        "--no-run",
        cwd=cw,
    )


@nox.session(python=False, name="runtime_windows_check")
def runtime_windows_check(session: nox.Session) -> None:
    submodules.init_compiler(ROOT)
    cw = _compiler_dir()
    proc.run(
        "cargo",
        "test",
        "-p",
        "beskid_tests",
        "runtime::",
        "--no-run",
        cwd=cw,
    )


@nox.session(python=False, name="pckg_unit_tests")
def pckg_unit_tests(session: nox.Session) -> None:
    submodules.init_pckg(ROOT)
    proc.run(
        sys.executable,
        "-m",
        "nox",
        "--non-interactive",
        "-f",
        str(ROOT / "pckg" / "noxfile.py"),
        "-s",
        "unit_tests",
        cwd=ROOT,
    )


@nox.session(python=False, name="open_vsx_publish")
def open_vsx_publish(session: nox.Session) -> None:
    platform = os.environ.get("OPENVSX_PLATFORM", "").strip()
    bin_name = os.environ.get("OPENVSX_BIN_NAME", "").strip()
    if not platform or not bin_name:
        raise SystemExit(
            "Set OPENVSX_PLATFORM and OPENVSX_BIN_NAME (e.g. linux-x64, beskid_lsp)"
        )
    submodules.init_compiler(ROOT)
    proc.run("cargo", "build", "-p", "beskid_lsp", "--release", cwd=_compiler_dir())
    open_vsx.bundle_and_publish(ROOT, platform=platform, bin_name=bin_name)
