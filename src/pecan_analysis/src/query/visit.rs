use crate::query::NodeRef;

pub trait Visit {
    fn enter(&mut self, _node: NodeRef) {}
    fn exit(&mut self, _node: NodeRef) {}
}
