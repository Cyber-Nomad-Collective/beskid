use std::collections::HashMap;

use crate::syntax::SpanInfo;

use super::ids::{ItemId, LocalId};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResolvedValue {
    Item(ItemId),
    Local(LocalId),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LocalInfo {
    pub id: LocalId,
    pub name: String,
    pub span: SpanInfo,
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct ResolutionTables {
    pub resolved_values: HashMap<SpanInfo, ResolvedValue>,
    pub resolved_types: HashMap<SpanInfo, ItemId>,
    pub locals: Vec<LocalInfo>,
}

impl ResolutionTables {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert_value(&mut self, span: SpanInfo, value: ResolvedValue) {
        self.resolved_values.insert(span, value);
    }

    pub fn insert_type(&mut self, span: SpanInfo, item: ItemId) {
        self.resolved_types.insert(span, item);
    }

    pub fn intern_local(&mut self, name: String, span: SpanInfo) -> LocalId {
        let id = LocalId(self.locals.len());
        self.locals.push(LocalInfo { id, name, span });
        id
    }

    pub fn local_info(&self, id: LocalId) -> Option<&LocalInfo> {
        self.locals.get(id.0)
    }
}
