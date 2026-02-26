pub mod api;
pub mod error;
pub mod linker;
pub mod object_module;
pub mod runtime;
pub mod target;

pub use api::{
    build, emit_object_only, AotBuildRequest, AotBuildResult, BuildOutputKind, BuildProfile,
    ExportPolicy, LinkMode, RuntimeStrategy,
};
pub use error::{AotError, AotResult};
