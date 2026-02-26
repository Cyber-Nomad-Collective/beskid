use crate::syntax::SpanInfo;
use crate::hir::HirVisibility;

use super::ids::ItemId;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ItemKind {
    Function,
    Method,
    Type,
    Enum,
    EnumVariant,
    Contract,
    ContractNode,
    ContractMethodSignature,
    ContractEmbedding,
    Module,
    Use,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ItemInfo {
    pub id: ItemId,
    pub name: String,
    pub kind: ItemKind,
    pub visibility: HirVisibility,
    pub span: SpanInfo,
}
