use std::path::{Path, PathBuf};
use std::process::Command;

use beskid_abi::{BESKID_RUNTIME_ABI_VERSION, RUNTIME_EXPORT_SYMBOLS, SYM_ABI_VERSION};

use crate::api::{BuildProfile, RuntimeStrategy};
use crate::error::{AotError, AotResult};
use crate::target::detect_target;

#[derive(Debug, Clone)]
pub struct RuntimeArtifact {
    pub staticlib_path: PathBuf,
    pub exported_symbols: Vec<String>,
}

fn ensure_runtime_symbol_present(archive_path: &Path, symbol: &str) -> AotResult<()> {
    let mut command = Command::new("nm");
    command.arg("-g").arg(archive_path);
    let output = command.output().map_err(|err| AotError::RuntimeBuild {
        message: format!("failed to inspect runtime archive symbols: {err}"),
    })?;

    if !output.status.success() {
        return Err(AotError::RuntimeBuild {
            message: format!(
                "failed to inspect runtime archive symbols via `nm -g {}`",
                archive_path.display()
            ),
        });
    }

    let text = String::from_utf8_lossy(&output.stdout);
    if !text.contains(symbol) {
        return Err(AotError::RuntimeBuild {
            message: format!(
                "runtime archive `{}` does not expose required symbol `{symbol}`",
                archive_path.display()
            ),
        });
    }

    Ok(())
}

#[derive(Debug, Clone)]
pub struct RuntimeBuildRequest {
    pub strategy: RuntimeStrategy,
    pub target_triple: Option<String>,
    pub profile: BuildProfile,
    pub work_dir: PathBuf,
}

pub fn prepare_runtime(req: &RuntimeBuildRequest) -> AotResult<RuntimeArtifact> {
    match &req.strategy {
        RuntimeStrategy::UsePrebuilt { path, abi_version } => {
            if !path.exists() {
                return Err(AotError::RuntimeArchiveMissing { path: path.clone() });
            }
            let Some(version) = abi_version else {
                return Err(AotError::RuntimeAbiVersionRequired);
            };
            if *version != BESKID_RUNTIME_ABI_VERSION {
                return Err(AotError::RuntimeAbiMismatch {
                    expected: BESKID_RUNTIME_ABI_VERSION,
                    actual: *version,
                });
            }
            ensure_runtime_symbol_present(path, SYM_ABI_VERSION)?;
            Ok(RuntimeArtifact {
                staticlib_path: path.clone(),
                exported_symbols: runtime_symbols(),
            })
        }
        RuntimeStrategy::BuildOnTheFly => build_runtime_on_the_fly(req),
    }
}

fn build_runtime_on_the_fly(req: &RuntimeBuildRequest) -> AotResult<RuntimeArtifact> {
    std::fs::create_dir_all(&req.work_dir).map_err(|err| AotError::Io {
        path: req.work_dir.clone(),
        message: err.to_string(),
    })?;

    let target = detect_target(req.target_triple.as_deref())?;
    let target_key = req
        .target_triple
        .as_deref()
        .unwrap_or("host")
        .replace(['/', '\\', ':'], "_");
    let profile_key = if matches!(req.profile, BuildProfile::Release) {
        "release"
    } else {
        "debug"
    };
    let cache_key = format!("runtime_bridge_{target_key}_{profile_key}_abi{BESKID_RUNTIME_ABI_VERSION}");
    let package_root = req.work_dir.join(cache_key);
    let src_dir = package_root.join("src");
    std::fs::create_dir_all(&src_dir).map_err(|err| AotError::Io {
        path: src_dir.clone(),
        message: err.to_string(),
    })?;

    let runtime_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../beskid_runtime");
    let runtime_path = runtime_path.canonicalize().map_err(|err| AotError::Io {
        path: runtime_path.clone(),
        message: err.to_string(),
    })?;

    let cargo_toml = format!(
        "[package]\nname = \"beskid_runtime_bridge\"\nversion = \"0.1.0\"\nedition = \"2024\"\n\n[lib]\ncrate-type = [\"staticlib\"]\n\n[dependencies]\nbeskid_runtime = {{ path = \"{}\" }}\n",
        runtime_path.display()
    );
    let lib_rs = "
#[allow(unused_imports)]
use beskid_runtime::{
    alloc, array_new, gc_register_root, gc_root_handle, gc_unregister_root, gc_unroot_handle,
    gc_write_barrier, interop_dispatch_ptr, interop_dispatch_unit, interop_dispatch_usize,
    panic, panic_str, str_len, str_new,
};

#[unsafe(no_mangle)]
pub extern \"C\" fn beskid_runtime_link_anchor() {
    let _ = alloc as usize;
    let _ = str_new as usize;
    let _ = array_new as usize;
    let _ = panic as usize;
    let _ = panic_str as usize;
    let _ = gc_write_barrier as usize;
    let _ = gc_root_handle as usize;
    let _ = gc_unroot_handle as usize;
    let _ = gc_register_root as usize;
    let _ = gc_unregister_root as usize;
    let _ = interop_dispatch_unit as usize;
    let _ = interop_dispatch_ptr as usize;
    let _ = interop_dispatch_usize as usize;
    let _ = str_len as usize;
}
";

    let manifest_path = package_root.join("Cargo.toml");
    std::fs::write(&manifest_path, cargo_toml).map_err(|err| AotError::Io {
        path: manifest_path.clone(),
        message: err.to_string(),
    })?;
    let lib_path = src_dir.join("lib.rs");
    std::fs::write(&lib_path, lib_rs).map_err(|err| AotError::Io {
        path: lib_path.clone(),
        message: err.to_string(),
    })?;

    let profile_dir = if matches!(req.profile, BuildProfile::Release) {
        "release"
    } else {
        "debug"
    };

    let artifact_path = if let Some(triple) = &req.target_triple {
        package_root
            .join("target")
            .join(triple)
            .join(profile_dir)
            .join(if target.static_lib_ext == "lib" {
                "beskid_runtime_bridge.lib".to_string()
            } else {
                "libbeskid_runtime_bridge.a".to_string()
            })
    } else {
        package_root.join("target").join(profile_dir).join(if target.static_lib_ext == "lib" {
            "beskid_runtime_bridge.lib".to_string()
        } else {
            "libbeskid_runtime_bridge.a".to_string()
        })
    };

    if !artifact_path.exists() {
        let mut command = Command::new("cargo");
        command.arg("build").arg("--manifest-path").arg(&manifest_path);
        if matches!(req.profile, BuildProfile::Release) {
            command.arg("--release");
        }
        if let Some(triple) = &req.target_triple {
            command.arg("--target").arg(triple);
        }
        let output = command.output().map_err(|err| AotError::RuntimeBuild {
            message: err.to_string(),
        })?;

        if !output.status.success() {
            let mut message = String::new();
            message.push_str(&String::from_utf8_lossy(&output.stderr));
            if message.trim().is_empty() {
                message.push_str(&String::from_utf8_lossy(&output.stdout));
            }
            return Err(AotError::RuntimeBuild { message });
        }
    }

    if !artifact_path.exists() {
        return Err(AotError::RuntimeArchiveMissing {
            path: artifact_path,
        });
    }

    Ok(RuntimeArtifact {
        staticlib_path: artifact_path,
        exported_symbols: runtime_symbols(),
    })
}

fn runtime_symbols() -> Vec<String> {
    RUNTIME_EXPORT_SYMBOLS
        .iter()
        .map(|symbol| (*symbol).to_owned())
        .collect()
}
