pub mod api;
pub mod error;
pub mod linker;
pub mod object_module;
pub mod runtime;
pub mod target;

pub use api::{
    AotBuildRequest, AotBuildResult, BuildOutputKind, BuildProfile, ExportPolicy, LinkMode,
    ProjectTargetKind, RuntimeStrategy, build, default_output_kind, emit_object_only,
    resolve_entrypoint,
};
pub use error::{AotError, AotResult};
