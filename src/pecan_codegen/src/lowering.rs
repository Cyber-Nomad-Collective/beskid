use crate::errors::CodegenError;

pub type CodegenResult<T> = Result<T, CodegenError>;

#[derive(Debug, Default)]
pub struct CodegenContext {
    pub functions_emitted: usize,
}

impl CodegenContext {
    pub fn new() -> Self {
        Self::default()
    }
}
