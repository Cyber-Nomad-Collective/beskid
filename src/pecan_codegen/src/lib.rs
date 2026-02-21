//! Cranelift-based code generation for Pecan.

pub mod errors;
pub mod lowering;

pub use errors::CodegenError;
pub use lowering::{CodegenContext, CodegenResult};
