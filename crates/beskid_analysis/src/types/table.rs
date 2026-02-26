use crate::hir::HirPrimitiveType;
use crate::resolve::ItemId;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TypeId(pub usize);

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TypeInfo {
    Primitive(HirPrimitiveType),
    Named(ItemId),
    GenericParam(String),
    Applied {
        base: ItemId,
        args: Vec<TypeId>,
    },
}

#[derive(Debug, Default)]
pub struct TypeTable {
    types: Vec<TypeInfo>,
}

impl TypeTable {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn intern(&mut self, info: TypeInfo) -> TypeId {
        let id = TypeId(self.types.len());
        self.types.push(info);
        id
    }

    pub fn get(&self, id: TypeId) -> Option<&TypeInfo> {
        self.types.get(id.0)
    }
}
