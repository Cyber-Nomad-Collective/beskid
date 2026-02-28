use crate::query::HirNodeRef;

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
        let node = self.stack.pop()?;
        let mut children = Vec::new();
        node.children(|child| children.push(child));
        self.stack.extend(children.into_iter().rev());
        Some(node)
    }
}
