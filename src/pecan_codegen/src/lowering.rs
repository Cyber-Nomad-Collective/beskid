use crate::errors::CodegenError;
use pecan_analysis::syntax::Spanned;

pub type CodegenResult<T> = Result<T, CodegenError>;

pub trait Lowerable: Sized {
    type Output;

    fn lower(node: &Spanned<Self>, ctx: &mut CodegenContext) -> CodegenResult<Self::Output>;
}

pub fn lower_node<T: Lowerable>(
    node: &Spanned<T>,
    ctx: &mut CodegenContext,
) -> CodegenResult<T::Output> {
    T::lower(node, ctx)
}

#[derive(Debug, Default)]
pub struct CodegenContext {
    pub functions_emitted: usize,
}

impl CodegenContext {
    pub fn new() -> Self {
        Self::default()
    }
}
