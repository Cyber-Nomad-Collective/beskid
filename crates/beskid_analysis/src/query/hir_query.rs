use crate::query::{HirDescendants, HirNode, HirNodeRef};

#[derive(Clone, Copy)]
pub struct HirQuery<'a> {
    start: HirNodeRef<'a>,
}

impl<'a> HirQuery<'a> {
    pub fn from<T: Into<HirNodeRef<'a>>>(start: T) -> Self {
        Self {
            start: start.into(),
        }
    }

    pub fn descendants(self) -> HirDescendants<'a> {
        HirDescendants::new(self.start)
    }

    pub fn of<T: HirNode + 'static>(self) -> impl Iterator<Item = &'a T> + 'a {
        self.descendants().filter_map(|node| node.of::<T>())
    }

    pub fn filter(
        self,
        predicate: impl Fn(&HirNodeRef<'a>) -> bool + 'a,
    ) -> impl Iterator<Item = HirNodeRef<'a>> + 'a {
        self.descendants().filter(predicate)
    }

    pub fn filter_typed<T: HirNode + 'static>(
        self,
        predicate: impl Fn(&T) -> bool + 'a,
    ) -> impl Iterator<Item = &'a T> + 'a {
        self.of::<T>().filter(move |item| predicate(*item))
    }

    pub fn find_first<T: HirNode + 'static>(self) -> Option<&'a T> {
        self.of::<T>().next()
    }

    pub fn expect_one<T: HirNode + 'static>(self, message: &str) -> &'a T {
        self.of::<T>().next().expect(message)
    }
}
