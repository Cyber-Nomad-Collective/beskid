use std::path::PathBuf;

use crate::api::BuildOutputKind;

pub type AotResult<T> = Result<T, AotError>;

#[derive(Debug, thiserror::Error)]
pub enum AotError {
    #[error("[E4001] ISA initialization failed: {message}")]
    IsaInit { message: String },

    #[error("[E4002] Object module error: {message}")]
    ObjectModule { message: String },

    #[error("[E4003] Missing function during object finalize: {name}")]
    MissingFunction { name: String },

    #[error("[E4010] Runtime build failed: {message}")]
    RuntimeBuild { message: String },

    #[error("[E4011] Runtime archive not found at: {path}")]
    RuntimeArchiveMissing { path: PathBuf },

    #[error("[E4012] Runtime ABI version mismatch (expected {expected}, got {actual})")]
    RuntimeAbiMismatch { expected: u32, actual: u32 },

    #[error("[E4013] Runtime ABI version is required for prebuilt runtime archive")]
    RuntimeAbiVersionRequired,

    #[error("[E4020] Linker tool not available")]
    LinkerUnavailable,

    #[error("[E4021] Link step failed (exit {status}): {command}")]
    LinkFailed { status: i32, command: String },

    #[error("[E4022] Unsupported output kind for target {target}: {kind:?}")]
    UnsupportedOutputKind {
        target: String,
        kind: BuildOutputKind,
    },

    #[error("[E4023] Unsupported linker strategy for target {target}: {message}")]
    UnsupportedLinkerStrategy { target: String, message: String },

    #[error("[E4030] Entrypoint symbol not found: {symbol}")]
    MissingEntrypoint { symbol: String },

    #[error("[E4040] IO error at {path}: {message}")]
    Io { path: PathBuf, message: String },

    #[error("[E4041] Invalid build request: {message}")]
    InvalidRequest { message: String },
}

impl From<cranelift_module::ModuleError> for AotError {
    fn from(value: cranelift_module::ModuleError) -> Self {
        Self::ObjectModule {
            message: value.to_string(),
        }
    }
}
