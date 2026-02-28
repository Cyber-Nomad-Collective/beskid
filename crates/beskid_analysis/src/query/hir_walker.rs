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
        self.notify_enter(node);

        node.children(|child| {
            self.walk(child);
        });

        self.notify_exit(node);
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
