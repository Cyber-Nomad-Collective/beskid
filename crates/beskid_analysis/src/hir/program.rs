use crate::query::{HirNode, HirNodeKind, HirNodeRef};
use crate::syntax::Spanned;

use super::{
    item::Item,
    phase::{HirPhase, Phase},
};

#[derive(beskid_ast_derive::PhaseFromAst)]
#[phase(source = "crate::syntax::Program", phase = "crate::hir::AstPhase")]
pub struct Program<P: Phase> {
    pub items: Vec<Spanned<Item<P>>>,
}

impl HirNode for Program<HirPhase> {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        for item in &self.items {
            push(HirNodeRef(&item.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Program
    }
}
