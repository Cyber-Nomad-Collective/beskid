use std::any::Any;

use crate::query::{HirNodeKind, HirNodeRef};

pub trait HirNode: Any {
    fn as_any(&self) -> &dyn Any;
    fn children<'a>(&'a self, _push: &mut dyn FnMut(HirNodeRef<'a>)) {}
    fn node_kind(&self) -> HirNodeKind;
}
