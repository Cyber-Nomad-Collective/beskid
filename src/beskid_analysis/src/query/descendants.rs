use crate::query::NodeRef;

pub struct Descendants<'a> {
    stack: Vec<NodeRef<'a>>,
}

impl<'a> Descendants<'a> {
    pub fn new(start: NodeRef<'a>) -> Self {
        Self { stack: vec![start] }
    }
}

impl<'a> Iterator for Descendants<'a> {
    type Item = NodeRef<'a>;

    fn next(&mut self) -> Option<Self::Item> {
        let node = self.stack.pop()?;
        let mut children = Vec::new();
        node.children(|child| children.push(child));
        self.stack.extend(children.into_iter().rev());
        Some(node)
    }
}
