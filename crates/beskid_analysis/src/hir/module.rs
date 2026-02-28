use crate::syntax::Spanned;
use crate::query::{HirNode, HirNodeKind, HirNodeRef};

use super::{item::Item, phase::{HirPhase, Phase}};

pub struct Module<P: Phase> {
    pub items: Vec<Spanned<Item<P>>>,
}

impl HirNode for Module<HirPhase> {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }

    fn children<'a>(&'a self, push: &mut dyn FnMut(HirNodeRef<'a>)) {
        for item in &self.items {
            push(HirNodeRef(&item.node));
        }
    }

    fn node_kind(&self) -> HirNodeKind {
        HirNodeKind::Module
    }
}
