use crate::query::traversal_core;
use crate::query::{HirNodeRef, HirVisit};

pub struct HirWalker<'a> {
    visitors: Vec<Box<dyn HirVisit + 'a>>,
}

impl<'a> Default for HirWalker<'a> {
    fn default() -> Self {
        Self::new()
    }
}

impl<'a> HirWalker<'a> {
    pub fn new() -> Self {
        Self {
            visitors: Vec::new(),
        }
    }

    pub fn with_visitor(mut self, visitor: Box<dyn HirVisit + 'a>) -> Self {
        self.visitors.push(visitor);
        self
    }

    pub fn walk(&mut self, node: HirNodeRef<'a>) {
        traversal_core::walk_depth_first(
            node,
            |parent, children| parent.children(|child| children.push(child)),
            self,
            |walker, current| walker.notify_enter(current),
            |walker, current| walker.notify_exit(current),
        );
    }

    fn notify_enter(&mut self, node: HirNodeRef<'a>) {
        for visitor in &mut self.visitors {
            visitor.enter(node);
        }
    }

    fn notify_exit(&mut self, node: HirNodeRef<'a>) {
        for visitor in self.visitors.iter_mut().rev() {
            visitor.exit(node);
        }
    }
}
