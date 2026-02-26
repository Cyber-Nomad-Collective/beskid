use crate::api::BuildOutputKind;
use crate::error::{AotError, AotResult};

#[derive(Debug, Clone)]
pub struct TargetInfo {
    pub triple: String,
    pub object_ext: &'static str,
    pub static_lib_ext: &'static str,
    pub shared_lib_ext: &'static str,
    pub exe_ext: &'static str,
}

pub fn detect_target(triple_override: Option<&str>) -> AotResult<TargetInfo> {
    let triple = if let Some(explicit) = triple_override {
        explicit.to_owned()
    } else {
        format!(
            "{}-{}-{}",
            std::env::consts::ARCH,
            std::env::consts::OS,
            std::env::consts::FAMILY
        )
    };

    let lower = triple.to_ascii_lowercase();
    if lower.contains("windows") {
        return Ok(TargetInfo {
            triple,
            object_ext: "obj",
            static_lib_ext: "lib",
            shared_lib_ext: "dll",
            exe_ext: "exe",
        });
    }

    if lower.contains("darwin") || lower.contains("apple") || lower.contains("macos") {
        return Ok(TargetInfo {
            triple,
            object_ext: "o",
            static_lib_ext: "a",
            shared_lib_ext: "dylib",
            exe_ext: "",
        });
    }

    if lower.contains("linux") || lower.contains("gnu") || lower.contains("musl") {
        return Ok(TargetInfo {
            triple,
            object_ext: "o",
            static_lib_ext: "a",
            shared_lib_ext: "so",
            exe_ext: "",
        });
    }

    Err(AotError::UnsupportedOutputKind {
        target: triple,
        kind: BuildOutputKind::ObjectOnly,
    })
}

pub fn output_filename(base: &str, kind: BuildOutputKind, target: &TargetInfo) -> String {
    match kind {
        BuildOutputKind::ObjectOnly => format!("{base}.{}", target.object_ext),
        BuildOutputKind::Exe => {
            if target.exe_ext.is_empty() {
                base.to_string()
            } else {
                format!("{base}.{}", target.exe_ext)
            }
        }
        BuildOutputKind::StaticLib => {
            if target.static_lib_ext == "lib" {
                format!("{base}.lib")
            } else {
                format!("lib{base}.{}", target.static_lib_ext)
            }
        }
        BuildOutputKind::SharedLib => {
            if target.shared_lib_ext == "dll" {
                format!("{base}.dll")
            } else {
                format!("lib{base}.{}", target.shared_lib_ext)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn computes_linux_object_name() {
        let target = TargetInfo {
            triple: "x86_64-unknown-linux-gnu".to_string(),
            object_ext: "o",
            static_lib_ext: "a",
            shared_lib_ext: "so",
            exe_ext: "",
        };

        assert_eq!(
            output_filename("hello", BuildOutputKind::ObjectOnly, &target),
            "hello.o"
        );
    }

    #[test]
    fn computes_windows_static_name() {
        let target = TargetInfo {
            triple: "x86_64-pc-windows-msvc".to_string(),
            object_ext: "obj",
            static_lib_ext: "lib",
            shared_lib_ext: "dll",
            exe_ext: "exe",
        };

        assert_eq!(
            output_filename("hello", BuildOutputKind::StaticLib, &target),
            "hello.lib"
        );
    }
}
