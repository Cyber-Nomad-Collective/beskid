use crate::query::AstNode;

#[derive(Clone, Copy)]
pub struct DynNodeRef<'a>(pub &'a dyn AstNode);

impl<'a> DynNodeRef<'a> {
    pub fn children(self, mut push: impl FnMut(DynNodeRef<'a>)) {
        self.0.children(&mut push);
    }

    pub fn children_iter(self) -> impl Iterator<Item = DynNodeRef<'a>> {
        let mut items = Vec::new();
        self.children(|node| items.push(node));
        items.into_iter()
    }

    pub fn of<T: AstNode + 'static>(&self) -> Option<&'a T> {
        self.0.as_any().downcast_ref::<T>()
    }

    pub fn node_kind(self) -> crate::query::NodeKind {
        self.0.node_kind()
    }
}

impl<'a, T: AstNode + 'a> From<&'a T> for DynNodeRef<'a> {
    fn from(value: &'a T) -> Self {
        DynNodeRef(value)
    }
}
