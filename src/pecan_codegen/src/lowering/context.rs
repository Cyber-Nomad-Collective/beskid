use crate::errors::CodegenError;

pub type CodegenResult<T> = Result<T, CodegenError>;

#[derive(Debug, Clone)]
pub struct LoweredFunction {
    pub name: String,
    pub clif: String,
}

#[derive(Debug, Clone, Default)]
pub struct CodegenArtifact {
    pub functions: Vec<LoweredFunction>,
}

#[derive(Debug, Default)]
pub struct CodegenContext {
    pub functions_emitted: usize,
    pub lowered_functions: Vec<LoweredFunction>,
}

impl CodegenContext {
    pub fn new() -> Self {
        Self::default()
    }
}
