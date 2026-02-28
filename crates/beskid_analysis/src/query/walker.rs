use crate::query::traversal_core;
use crate::query::{NodeRef, Visit};

pub struct AstWalker<'a> {
    visitors: Vec<Box<dyn Visit + 'a>>,
}

impl<'a> Default for AstWalker<'a> {
    fn default() -> Self {
        Self::new()
    }
}

impl<'a> AstWalker<'a> {
    pub fn new() -> Self {
        Self {
            visitors: Vec::new(),
        }
    }

    pub fn with_visitor(mut self, visitor: Box<dyn Visit + 'a>) -> Self {
        self.visitors.push(visitor);
        self
    }

    pub fn walk(&mut self, node: NodeRef<'a>) {
        traversal_core::walk_depth_first(
            node,
            |parent, children| parent.children(|child| children.push(child)),
            self,
            |walker, current| walker.notify_enter(current),
            |walker, current| walker.notify_exit(current),
        );
    }

    fn notify_enter(&mut self, node: NodeRef<'a>) {
        for visitor in &mut self.visitors {
            visitor.enter(node);
        }
    }

    fn notify_exit(&mut self, node: NodeRef<'a>) {
        for visitor in self.visitors.iter_mut().rev() {
            visitor.exit(node);
        }
    }
}
