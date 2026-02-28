use crate::query::HirNode;

#[derive(Clone, Copy)]
pub struct HirNodeRef<'a>(pub &'a dyn HirNode);

impl<'a> HirNodeRef<'a> {
    pub fn children(self, mut push: impl FnMut(HirNodeRef<'a>)) {
        self.0.children(&mut push);
    }

    pub fn children_iter(self) -> impl Iterator<Item = HirNodeRef<'a>> {
        let mut items = Vec::new();
        self.children(|node| items.push(node));
        items.into_iter()
    }

    pub fn of<T: HirNode + 'static>(&self) -> Option<&'a T> {
        self.0.as_any().downcast_ref::<T>()
    }

    pub fn node_kind(self) -> crate::query::HirNodeKind {
        self.0.node_kind()
    }
}

impl<'a, T: HirNode + 'a> From<&'a T> for HirNodeRef<'a> {
    fn from(value: &'a T) -> Self {
        HirNodeRef(value)
    }
}
