use crate::hir::{AstProgram, HirProgram};
use crate::syntax::Spanned;

pub fn lower_program(program: &Spanned<AstProgram>) -> Spanned<HirProgram> {
    program.lower()
}

pub(crate) trait Lowerable {
    type Output;

    fn lower(&self) -> Self::Output;
}

#[path = "items.rs"]
mod items;
#[path = "statements.rs"]
mod statements;
#[path = "expressions.rs"]
mod expressions;
#[path = "types.rs"]
mod types;

