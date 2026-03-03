use crate::hir::{HirItem, HirPrimitiveType};
use crate::syntax::Spanned;
use crate::types::TypeId;

use super::context::{FunctionSignature, TypeContext};

impl<'a> TypeContext<'a> {
    pub(super) fn type_item(&mut self, item: &Spanned<HirItem>) {
        match &item.node {
            HirItem::FunctionDefinition(def) => {
                let mut inserted = Vec::new();
                for generic in &def.node.generics {
                    let name = generic.node.name.clone();
                    let type_id = self
                        .type_table
                        .intern(crate::types::TypeInfo::GenericParam(name.clone()));
                    self.generic_params.insert(name.clone(), type_id);
                    inserted.push(name);
                }
                let return_type = def
                    .node
                    .return_type
                    .as_ref()
                    .and_then(|ty| self.type_id_for_type(ty))
                    .or_else(|| self.primitive_type_id(HirPrimitiveType::Unit));
                self.current_return_type = return_type;
                let mut params = Vec::new();
                for param in &def.node.parameters {
                    if let Some(type_id) = self.type_id_for_type(&param.node.ty) {
                        params.push(type_id);
                        self.insert_local_type(param.node.name.span, type_id);
                    }
                }
                self.record_signature(item.span, params, return_type);
                self.type_block(&def.node.body);
                for name in inserted {
                    self.generic_params.remove(&name);
                }
            }
            HirItem::MethodDefinition(def) => {
                let receiver_type = self.type_id_for_type(&def.node.receiver_type);
                let return_type = def
                    .node
                    .return_type
                    .as_ref()
                    .and_then(|ty| self.type_id_for_type(ty))
                    .or_else(|| self.primitive_type_id(HirPrimitiveType::Unit));
                self.current_return_type = return_type;
                if let Some(receiver_type) = receiver_type {
                    self.insert_local_type(def.node.receiver_type.span, receiver_type);
                }
                let mut params = Vec::new();
                for param in &def.node.parameters {
                    if let Some(type_id) = self.type_id_for_type(&param.node.ty) {
                        params.push(type_id);
                        self.insert_local_type(param.node.name.span, type_id);
                    }
                }
                self.record_signature(item.span, params, return_type);
                self.type_block(&def.node.body);
            }
            HirItem::TypeDefinition(def) => {
                let mut inserted = Vec::new();
                for generic in &def.node.generics {
                    let name = generic.node.name.clone();
                    let type_id = self
                        .type_table
                        .intern(crate::types::TypeInfo::GenericParam(name.clone()));
                    self.generic_params.insert(name.clone(), type_id);
                    inserted.push(name);
                }
                let mut fields = std::collections::HashMap::new();
                let mut ordered = Vec::new();
                for field in &def.node.fields {
                    if let Some(type_id) = self.type_id_for_type(&field.node.ty) {
                        fields.insert(field.node.name.node.name.clone(), type_id);
                        ordered.push((field.node.name.node.name.clone(), type_id));
                    }
                }
                let type_name = def.node.name.node.name.as_str();
                let item_id = self
                    .item_id_for_name(type_name, crate::resolve::ItemKind::Type)
                    .or_else(|| self.item_id_for_span(item.span));
                if let Some(item_id) = item_id {
                    self.struct_fields.insert(item_id, fields);
                    self.struct_fields_ordered.insert(item_id, ordered);
                }
                for name in inserted {
                    self.generic_params.remove(&name);
                }
            }
            HirItem::EnumDefinition(def) => {
                let mut inserted = Vec::new();
                for generic in &def.node.generics {
                    let name = generic.node.name.clone();
                    let type_id = self
                        .type_table
                        .intern(crate::types::TypeInfo::GenericParam(name.clone()));
                    self.generic_params.insert(name.clone(), type_id);
                    inserted.push(name);
                }
                let mut variants = std::collections::HashMap::new();
                let mut ordered = Vec::new();
                for variant in &def.node.variants {
                    let mut fields = Vec::new();
                    for field in &variant.node.fields {
                        if let Some(type_id) = self.type_id_for_type(&field.node.ty) {
                            fields.push(type_id);
                        }
                    }
                    variants.insert(variant.node.name.node.name.clone(), fields.clone());
                    ordered.push((variant.node.name.node.name.clone(), fields));
                }
                let enum_name = def.node.name.node.name.as_str();
                let item_id = self
                    .item_id_for_name(enum_name, crate::resolve::ItemKind::Enum)
                    .or_else(|| self.item_id_for_span(item.span));
                if let Some(item_id) = item_id {
                    self.enum_variants.insert(item_id, variants);
                    self.enum_variants_ordered.insert(item_id, ordered);
                }
                for name in inserted {
                    self.generic_params.remove(&name);
                }
            }
            HirItem::ContractDefinition(_) => {}
            HirItem::AttributeDeclaration(_) => {}
            HirItem::InlineModule(def) => {
                for item in &def.node.items {
                    self.type_item(item);
                }
            }
            HirItem::ModuleDeclaration(_) | HirItem::UseDeclaration(_) => {}
        }
        self.current_return_type = None;
    }

    fn record_signature(
        &mut self,
        item_span: crate::syntax::SpanInfo,
        params: Vec<TypeId>,
        return_type: Option<TypeId>,
    ) {
        let Some(item_id) = self.item_id_for_span(item_span) else {
            return;
        };
        let Some(return_type) = return_type else {
            return;
        };
        self.function_signatures.insert(
            item_id,
            FunctionSignature {
                params,
                return_type,
            },
        );
    }
}
