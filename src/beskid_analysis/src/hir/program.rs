use crate::syntax::Spanned;

use super::{item::Item, phase::Phase};

#[derive(beskid_ast_derive::PhaseFromAst)]
#[phase(source = "crate::syntax::Program", phase = "crate::hir::AstPhase")]
pub struct Program<P: Phase> {
    pub items: Vec<Spanned<Item<P>>>,
}
