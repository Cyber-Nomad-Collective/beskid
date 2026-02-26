use std::any::Any;

use crate::query::{DynNodeRef, NodeKind};

pub trait AstNode: Any {
    fn as_any(&self) -> &dyn Any;
    fn children<'a>(&'a self, _push: &mut dyn FnMut(DynNodeRef<'a>)) {}
    fn node_kind(&self) -> NodeKind;
}

pub type NodeRef<'a> = DynNodeRef<'a>;
