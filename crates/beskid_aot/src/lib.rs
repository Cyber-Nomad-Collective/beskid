pub mod api;
pub mod error;
pub mod linker;
pub mod object_module;
pub mod runtime;
pub mod target;

pub use api::{
    AotBuildRequest, AotBuildResult, BuildOutputKind, BuildProfile, ExportPolicy, LinkMode,
    RuntimeStrategy, build, emit_object_only,
};
pub use error::{AotError, AotResult};
