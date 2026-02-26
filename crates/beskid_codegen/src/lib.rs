//! Cranelift-based code generation for Beskid.

pub mod errors;
pub mod diagnostics;
pub mod lowering;
pub mod module_emission;

pub use errors::CodegenError;
pub use diagnostics::{codegen_error_to_diagnostic, codegen_errors_to_diagnostics};
pub use lowering::{
    CodegenArtifact, CodegenContext, CodegenResult, Lowerable, LoweredFunction,
    lower_node, lower_program,
};
pub use module_emission::{emit_string_literals, emit_type_descriptors, DescriptorHandles};
