use crate::query::HirNodeRef;
use crate::query::traversal_core;

pub struct HirDescendants<'a> {
    stack: Vec<HirNodeRef<'a>>,
}

impl<'a> HirDescendants<'a> {
    pub fn new(start: HirNodeRef<'a>) -> Self {
        Self { stack: vec![start] }
    }
}

impl<'a> Iterator for HirDescendants<'a> {
    type Item = HirNodeRef<'a>;

    fn next(&mut self) -> Option<Self::Item> {
        traversal_core::next_descendant(&mut self.stack, |node, children| {
            node.children(|child| children.push(child));
        })
    }
}
