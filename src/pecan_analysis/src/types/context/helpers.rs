use crate::hir::HirPrimitiveType;
use crate::syntax::{Expression, PrimitiveType, SpanInfo};
use crate::resolve::{ItemId, ItemKind};
use crate::types::{TypeId, TypeInfo};

use super::context::{CastIntent, TypeContext, TypeError};

impl<'a> TypeContext<'a> {
    pub(super) fn seed_types(&mut self) {
        for primitive in [
            HirPrimitiveType::Bool,
            HirPrimitiveType::I32,
            HirPrimitiveType::I64,
            HirPrimitiveType::U8,
            HirPrimitiveType::F64,
            HirPrimitiveType::Char,
            HirPrimitiveType::String,
            HirPrimitiveType::Unit,
        ] {
            let id = self.type_table.intern(TypeInfo::Primitive(primitive));
            self.primitive_types.insert(primitive, id);
        }

        for item in &self.resolution.items {
            match item.kind {
                crate::resolve::ItemKind::Type
                | crate::resolve::ItemKind::Enum
                | crate::resolve::ItemKind::Contract => {
                    let id = self.type_table.intern(TypeInfo::Named(item.id));
                    self.named_types.insert(item.id, id);
                }
                _ => {}
            }
        }
    }

    pub(super) fn insert_local_type(&mut self, span: SpanInfo, type_id: TypeId) {
        if let Some(local_id) = self.local_id_for_span(span) {
            self.local_types.insert(local_id, type_id);
        }
    }

    pub(super) fn local_id_for_span(&self, span: SpanInfo) -> Option<crate::resolve::LocalId> {
        self.resolution
            .tables
            .locals
            .iter()
            .find(|info| info.span == span)
            .map(|info| info.id)
    }

    pub(super) fn item_id_for_span(&self, span: SpanInfo) -> Option<crate::resolve::ItemId> {
        self.resolution
            .items
            .iter()
            .find(|info| info.span == span)
            .map(|info| info.id)
    }

    pub(super) fn item_id_for_name(&self, name: &str, kind: ItemKind) -> Option<ItemId> {
        self.resolution
            .items
            .iter()
            .find(|info| info.name == name && info.kind == kind)
            .map(|info| info.id)
    }

    pub(super) fn named_item_id(&self, type_id: TypeId) -> Option<ItemId> {
        match self.type_table.get(type_id) {
            Some(TypeInfo::Named(item_id)) => Some(*item_id),
            _ => None,
        }
    }

    pub(super) fn require_same_type(&mut self, span: SpanInfo, expected: TypeId, actual: TypeId) {
        if expected == actual {
            return;
        }
        if self.is_numeric(expected) && self.is_numeric(actual) {
            self.cast_intents.push(CastIntent {
                span,
                from: actual,
                to: expected,
            });
            return;
        }
        self.errors.push(TypeError::TypeMismatch {
            span,
            expected,
            actual,
        });
    }

    pub(super) fn require_bool(&mut self, span: SpanInfo, expression: &crate::syntax::Spanned<Expression>) {
        let type_id = self.type_expression(expression);
        let bool_id = self.primitive_type_id(HirPrimitiveType::Bool);
        if let (Some(type_id), Some(bool_id)) = (type_id, bool_id) {
            if type_id != bool_id {
                self.errors.push(TypeError::NonBoolCondition { span });
            }
        }
    }

    pub(super) fn primitive_type_id(&self, primitive: HirPrimitiveType) -> Option<TypeId> {
        self.primitive_types.get(&primitive).copied()
    }

    pub(super) fn is_numeric(&self, type_id: TypeId) -> bool {
        matches!(
            self.type_table.get(type_id),
            Some(TypeInfo::Primitive(
                HirPrimitiveType::I32
                    | HirPrimitiveType::I64
                    | HirPrimitiveType::U8
                    | HirPrimitiveType::F64
            ))
        )
    }

    pub(super) fn is_bool(&self, type_id: TypeId) -> bool {
        matches!(
            self.type_table.get(type_id),
            Some(TypeInfo::Primitive(HirPrimitiveType::Bool))
        )
    }

    pub(super) fn is_comparable(&self, type_id: TypeId) -> bool {
        self.is_numeric(type_id) || self.is_bool(type_id)
    }

    pub(super) fn map_primitive(&self, primitive: PrimitiveType) -> HirPrimitiveType {
        match primitive {
            PrimitiveType::Bool => HirPrimitiveType::Bool,
            PrimitiveType::I32 => HirPrimitiveType::I32,
            PrimitiveType::I64 => HirPrimitiveType::I64,
            PrimitiveType::U8 => HirPrimitiveType::U8,
            PrimitiveType::F64 => HirPrimitiveType::F64,
            PrimitiveType::Char => HirPrimitiveType::Char,
            PrimitiveType::String => HirPrimitiveType::String,
            PrimitiveType::Unit => HirPrimitiveType::Unit,
        }
    }
}
