use std::path::PathBuf;
use std::process::Command;

use crate::api::{BuildOutputKind, LinkMode};
use crate::error::{AotError, AotResult};

#[derive(Debug, Clone)]
pub struct LinkRequest {
    pub target_triple: Option<String>,
    pub output_kind: BuildOutputKind,
    pub output_path: PathBuf,
    pub object_path: PathBuf,
    pub runtime_staticlib: PathBuf,
    pub entrypoint_symbol: String,
    pub exported_symbols: Vec<String>,
    pub link_mode: LinkMode,
    pub verbose: bool,
}

#[derive(Debug, Clone)]
pub struct LinkResult {
    pub output_path: PathBuf,
    pub command_line: String,
    pub exported_symbols: Vec<String>,
}

pub fn link(req: &LinkRequest) -> AotResult<LinkResult> {
    if !req.object_path.exists() {
        return Err(AotError::Io {
            path: req.object_path.clone(),
            message: "object file does not exist".to_owned(),
        });
    }
    if !req.runtime_staticlib.exists() {
        return Err(AotError::RuntimeArchiveMissing {
            path: req.runtime_staticlib.clone(),
        });
    }

    if let Some(parent) = req.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|err| AotError::Io {
            path: parent.to_path_buf(),
            message: err.to_string(),
        })?;
    }

    if req.output_kind == BuildOutputKind::StaticLib {
        return archive_static(req);
    }

    if req.output_kind == BuildOutputKind::Exe && req.entrypoint_symbol != "main" {
        return Err(AotError::UnsupportedLinkerStrategy {
            target: req
                .target_triple
                .clone()
                .unwrap_or_else(|| std::env::consts::OS.to_owned()),
            message: "executable output currently requires entrypoint symbol `main`".to_owned(),
        });
    }

    let tool = cc::Build::new().get_compiler();
    let target = req
        .target_triple
        .as_deref()
        .unwrap_or(std::env::consts::OS)
        .to_ascii_lowercase();
    let mut cmd = Command::new(tool.path());
    cmd.arg(&req.object_path)
        .arg(&req.runtime_staticlib)
        .arg("-o")
        .arg(&req.output_path);

    if matches!(req.output_kind, BuildOutputKind::SharedLib) {
        cmd.arg("-shared");
        if let LinkMode::PreferStatic = req.link_mode {
            cmd.arg("-Wl,-Bstatic");
        }
        if let LinkMode::PreferDynamic = req.link_mode {
            cmd.arg("-Wl,-Bdynamic");
        }
        append_export_policy_flags(req, &target, &mut cmd)?;
    }

    if req.verbose {
        eprintln!("[aot] link command: {:?}", cmd);
    }

    let output = cmd.output().map_err(|_| AotError::LinkerUnavailable)?;

    if !output.status.success() {
        let mut command_line = format!(
            "{} {} {} -o {}",
            tool.path().display(),
            req.object_path.display(),
            req.runtime_staticlib.display(),
            req.output_path.display()
        );
        if req.output_kind == BuildOutputKind::SharedLib {
            command_line.push_str(" -shared");
        }
        return Err(AotError::LinkFailed {
            status: output.status.code().unwrap_or(-1),
            command: command_line,
        });
    }

    Ok(LinkResult {
        output_path: req.output_path.clone(),
        command_line: format!(
            "{} {} {} -o {}",
            tool.path().display(),
            req.object_path.display(),
            req.runtime_staticlib.display(),
            req.output_path.display()
        ),
        exported_symbols: req.exported_symbols.clone(),
    })
}

fn archive_static(req: &LinkRequest) -> AotResult<LinkResult> {
    let target = req
        .target_triple
        .as_deref()
        .unwrap_or(std::env::consts::OS)
        .to_ascii_lowercase();

    if target.contains("windows") {
        return Err(AotError::UnsupportedLinkerStrategy {
            target,
            message: "static archive merge currently supports unix ar/ranlib toolchains only"
                .to_owned(),
        });
    }

    let script_path = req.output_path.with_extension("mri");
    let script = format!(
        "CREATE {}\nADDLIB {}\nADDMOD {}\nSAVE\nEND\n",
        req.output_path.display(),
        req.runtime_staticlib.display(),
        req.object_path.display()
    );
    std::fs::write(&script_path, script).map_err(|err| AotError::Io {
        path: script_path.clone(),
        message: err.to_string(),
    })?;

    let mut shell_command = Command::new("sh");
    shell_command.arg("-c").arg(format!(
        "ar -M < {}",
        script_path.to_string_lossy()
    ));

    if req.verbose {
        eprintln!("[aot] archive command: {:?}", shell_command);
    }

    let output = shell_command
        .output()
        .map_err(|_| AotError::LinkerUnavailable)?;
    if !output.status.success() {
        return Err(AotError::LinkFailed {
            status: output.status.code().unwrap_or(-1),
            command: format!(
                "ar -M < {}",
                script_path.display()
            ),
        });
    }

    let ranlib_out = Command::new("ranlib")
        .arg(&req.output_path)
        .output()
        .map_err(|_| AotError::LinkerUnavailable)?;
    if !ranlib_out.status.success() {
        return Err(AotError::LinkFailed {
            status: ranlib_out.status.code().unwrap_or(-1),
            command: format!("ranlib {}", req.output_path.display()),
        });
    }

    Ok(LinkResult {
        output_path: req.output_path.clone(),
        command_line: format!("ar -M < {} && ranlib {}", script_path.display(), req.output_path.display()),
        exported_symbols: req.exported_symbols.clone(),
    })
}

fn append_export_policy_flags(req: &LinkRequest, target: &str, cmd: &mut Command) -> AotResult<()> {
    if req.exported_symbols.is_empty() {
        return Ok(());
    }

    if target.contains("linux") || target.contains("gnu") || target.contains("musl") {
        let script_path = req.output_path.with_extension("exports.map");
        let mut script = String::from("{\n  global:\n");
        for symbol in &req.exported_symbols {
            script.push_str(&format!("    {symbol};\n"));
        }
        script.push_str("  local: *;\n};\n");
        std::fs::write(&script_path, script).map_err(|err| AotError::Io {
            path: script_path.clone(),
            message: err.to_string(),
        })?;
        cmd.arg(format!("-Wl,--version-script={}", script_path.display()));
        return Ok(());
    }

    if target.contains("darwin") || target.contains("apple") || target.contains("macos") {
        for symbol in &req.exported_symbols {
            cmd.arg(format!("-Wl,-exported_symbol,_{}", symbol));
        }
        return Ok(());
    }

    if target.contains("windows") {
        for symbol in &req.exported_symbols {
            cmd.arg(format!("-Wl,/EXPORT:{symbol}"));
        }
        return Ok(());
    }

    Err(AotError::UnsupportedLinkerStrategy {
        target: target.to_owned(),
        message: "shared export policy flags are not implemented for this target".to_owned(),
    })
}
