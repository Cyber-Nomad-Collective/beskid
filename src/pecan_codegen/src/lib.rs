//! Cranelift-based code generation for Pecan.

pub mod errors;
pub mod diagnostics;
pub mod lowering;

pub use errors::CodegenError;
pub use diagnostics::{codegen_error_to_diagnostic, codegen_errors_to_diagnostics};
pub use lowering::{
    CodegenArtifact, CodegenContext, CodegenResult, Lowerable, LoweredFunction,
    lower_node, lower_program,
};
