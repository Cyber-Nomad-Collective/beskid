use crate::hir::{HirExpressionNode, HirPrimitiveType};
use crate::resolve::{ItemId, ItemKind};
use crate::syntax::SpanInfo;
use crate::types::{TypeId, TypeInfo};

use super::context::{CastIntent, TypeContext, TypeError};
use std::collections::HashMap;

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
            Some(TypeInfo::Applied { base, .. }) => Some(*base),
            _ => None,
        }
    }

    pub(super) fn method_item_for_receiver(
        &self,
        receiver_type: TypeId,
        method_name: &str,
    ) -> Option<ItemId> {
        let receiver_item = self.named_item_id(receiver_type)?;
        self.methods_by_receiver
            .get(&(receiver_item, method_name.to_string()))
            .copied()
    }

    pub(super) fn generic_mapping_for_type_id(&self, type_id: TypeId) -> HashMap<String, TypeId> {
        let Some(TypeInfo::Applied { base, args }) = self.type_table.get(type_id) else {
            return HashMap::new();
        };
        let Some(names) = self.generic_items.get(base) else {
            return HashMap::new();
        };
        if names.len() != args.len() {
            return HashMap::new();
        }
        names.iter().cloned().zip(args.iter().copied()).collect()
    }

    pub(super) fn substitute_type_id(
        &mut self,
        type_id: TypeId,
        mapping: &HashMap<String, TypeId>,
    ) -> TypeId {
        let info = self.type_table.get(type_id).cloned();
        match info {
            Some(TypeInfo::GenericParam(name)) => mapping.get(&name).copied().unwrap_or(type_id),
            Some(TypeInfo::Applied { base, args }) => {
                let mut changed = false;
                let new_args: Vec<TypeId> = args
                    .iter()
                    .map(|arg| {
                        let substituted = self.substitute_type_id(*arg, mapping);
                        if substituted != *arg {
                            changed = true;
                        }
                        substituted
                    })
                    .collect();
                if changed {
                    self.type_table.intern(TypeInfo::Applied {
                        base,
                        args: new_args,
                    })
                } else {
                    type_id
                }
            }
            _ => type_id,
        }
    }

    pub(super) fn require_same_type(&mut self, span: SpanInfo, expected: TypeId, actual: TypeId) {
        if expected == actual {
            return;
        }
        if self.is_numeric(expected) && self.is_numeric(actual) {
            if self
                .cast_intents
                .iter()
                .any(|intent| intent.span == span && intent.from == actual && intent.to == expected)
            {
                return;
            }
            if self
                .cast_intents
                .iter()
                .any(|intent| intent.span == span && intent.from == expected && intent.to == actual)
            {
                self.errors.push(TypeError::TypeMismatch {
                    span,
                    expected,
                    actual,
                });
                return;
            }
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

    pub(super) fn require_bool(
        &mut self,
        span: SpanInfo,
        expression: &crate::syntax::Spanned<HirExpressionNode>,
    ) {
        let type_id = self.type_expression(expression);
        let bool_id = self.primitive_type_id(HirPrimitiveType::Bool);
        if let (Some(type_id), Some(bool_id)) = (type_id, bool_id)
            && type_id != bool_id
        {
            self.errors.push(TypeError::NonBoolCondition { span });
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

    pub(super) fn map_primitive(&self, primitive: HirPrimitiveType) -> HirPrimitiveType {
        primitive
    }
}
