use crate::query::{AstNode, Descendants, NodeRef};

#[derive(Clone, Copy)]
pub struct Query<'a> {
    start: NodeRef<'a>,
}

impl<'a> Query<'a> {
    pub fn from<T: Into<NodeRef<'a>>>(start: T) -> Self {
        Self { start: start.into() }
    }

    pub fn descendants(self) -> Descendants<'a> {
        Descendants::new(self.start)
    }

    pub fn of<T: AstNode + 'static>(self) -> impl Iterator<Item = &'a T> + 'a {
        self.descendants().filter_map(|node| node.of::<T>())
    }

    pub fn filter(self, predicate: impl Fn(&NodeRef<'a>) -> bool + 'a) -> impl Iterator<Item = NodeRef<'a>> + 'a {
        self.descendants().filter(predicate)
    }

    pub fn filter_typed<T: AstNode + 'static>(
        self,
        predicate: impl Fn(&T) -> bool + 'a,
    ) -> impl Iterator<Item = &'a T> + 'a {
        self.of::<T>().filter(move |item| predicate(*item))
    }

    pub fn find_first<T: AstNode + 'static>(self) -> Option<&'a T> {
        self.of::<T>().next()
    }

    pub fn expect_one<T: AstNode + 'static>(self, message: &str) -> &'a T {
        self.of::<T>().next().expect(message)
    }
}
