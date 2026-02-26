use std::collections::HashMap;

use crate::hir::{HirItem, HirPrimitiveType, HirProgram};
use crate::resolve::{ItemId, LocalId, Resolution};
use crate::syntax::{SpanInfo, Spanned};
use crate::types::{TypeId, TypeTable};
use crate::builtins::{builtin_specs, BuiltinType};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TypeError {
    UnknownType { span: SpanInfo },
    UnknownValueType { span: SpanInfo },
    UnknownStructType { span: SpanInfo },
    InvalidMemberTarget { span: SpanInfo },
    UnknownEnumType { span: SpanInfo },
    UnknownStructField { span: SpanInfo, name: String },
    UnknownEnumVariant { span: SpanInfo, name: String },
    MissingStructField { span: SpanInfo, name: String },
    MissingTypeAnnotation { span: SpanInfo, name: String },
    TypeMismatch { span: SpanInfo, expected: TypeId, actual: TypeId },
    MatchArmTypeMismatch { span: SpanInfo, expected: TypeId, actual: TypeId },
    CallArityMismatch { span: SpanInfo, expected: usize, actual: usize },
    CallArgumentMismatch { span: SpanInfo, expected: TypeId, actual: TypeId },
    EnumConstructorMismatch { span: SpanInfo, expected: usize, actual: usize },
    UnknownCallTarget { span: SpanInfo },
    InvalidBinaryOp { span: SpanInfo },
    InvalidUnaryOp { span: SpanInfo },
    NonBoolCondition { span: SpanInfo },
    UnsupportedExpression { span: SpanInfo },
    ReturnTypeMismatch { span: SpanInfo, expected: TypeId, actual: Option<TypeId> },
    MissingTypeArguments { span: SpanInfo },
    GenericArgumentMismatch { span: SpanInfo, expected: usize, actual: usize },
}

#[derive(Debug)]
pub struct TypeResult {
    pub types: TypeTable,
    pub named_type_names: HashMap<ItemId, String>,
    pub expr_types: HashMap<SpanInfo, TypeId>,
    pub local_types: HashMap<LocalId, TypeId>,
    pub function_signatures: HashMap<ItemId, FunctionSignature>,
    pub struct_fields_ordered: HashMap<ItemId, Vec<(String, TypeId)>>,
    pub enum_variants_ordered: HashMap<ItemId, Vec<(String, Vec<TypeId>)>>,
    pub generic_items: HashMap<ItemId, Vec<String>>,
    // Canonical output contract for safe implicit numeric conversions.
    // Invariants (normalized in `TypeContext::type_program`):
    // - sorted by (span.start, span.end, from, to)
    // - exact duplicates removed
    // - conflicting reverse intents for the same span are rejected upstream
    pub cast_intents: Vec<CastIntent>,
}

impl TypeResult {
    pub fn cast_intent_for_span(&self, span: SpanInfo) -> Option<&CastIntent> {
        self.cast_intents.iter().find(|intent| intent.span == span)
    }

    pub fn cast_intents_for_span(
        &self,
        span: SpanInfo,
    ) -> impl Iterator<Item = &CastIntent> {
        self.cast_intents.iter().filter(move |intent| intent.span == span)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FunctionSignature {
    pub params: Vec<TypeId>,
    pub return_type: TypeId,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CastIntent {
    pub span: SpanInfo,
    pub from: TypeId,
    pub to: TypeId,
}

pub struct TypeContext<'a> {
    pub(super) resolution: &'a Resolution,
    pub(super) type_table: TypeTable,
    pub(super) primitive_types: HashMap<HirPrimitiveType, TypeId>,
    pub(super) named_types: HashMap<ItemId, TypeId>,
    pub(super) struct_fields: HashMap<ItemId, HashMap<String, TypeId>>,
    pub(super) struct_fields_ordered: HashMap<ItemId, Vec<(String, TypeId)>>,
    pub(super) enum_variants: HashMap<ItemId, HashMap<String, Vec<TypeId>>>,
    pub(super) enum_variants_ordered: HashMap<ItemId, Vec<(String, Vec<TypeId>)>>,
    pub(super) expr_types: HashMap<SpanInfo, TypeId>,
    pub(super) local_types: HashMap<LocalId, TypeId>,
    pub(super) function_signatures: HashMap<ItemId, FunctionSignature>,
    pub(super) cast_intents: Vec<CastIntent>,
    pub(super) errors: Vec<TypeError>,
    pub(super) current_return_type: Option<TypeId>,
    pub(super) generic_params: HashMap<String, TypeId>,
    pub(super) generic_items: HashMap<ItemId, Vec<String>>,
}

impl<'a> TypeContext<'a> {
    pub fn new(resolution: &'a Resolution) -> Self {
        let mut context = Self {
            resolution,
            type_table: TypeTable::new(),
            primitive_types: HashMap::new(),
            named_types: HashMap::new(),
            struct_fields: HashMap::new(),
            struct_fields_ordered: HashMap::new(),
            enum_variants: HashMap::new(),
            enum_variants_ordered: HashMap::new(),
            expr_types: HashMap::new(),
            local_types: HashMap::new(),
            function_signatures: HashMap::new(),
            cast_intents: Vec::new(),
            errors: Vec::new(),
            current_return_type: None,
            generic_params: HashMap::new(),
            generic_items: HashMap::new(),
        };
        context.seed_types();
        context.seed_builtin_signatures();
        context
    }

    fn seed_builtin_signatures(&mut self) {
        for (item_id, index) in &self.resolution.builtin_items {
            let Some(spec) = builtin_specs().get(*index) else {
                continue;
            };
            let mut params = Vec::with_capacity(spec.params.len());
            for param in spec.params {
                if let Some(type_id) = self.builtin_type_id(*param) {
                    params.push(type_id);
                }
            }
            let return_type = self.builtin_type_id(spec.returns);
            let Some(return_type) = return_type else {
                continue;
            };
            self.function_signatures.insert(
                *item_id,
                FunctionSignature {
                    params,
                    return_type,
                },
            );
        }
    }

    fn builtin_type_id(&self, builtin: BuiltinType) -> Option<TypeId> {
        match builtin {
            BuiltinType::String => self.primitive_type_id(HirPrimitiveType::String),
            BuiltinType::Unit => self.primitive_type_id(HirPrimitiveType::Unit),
            BuiltinType::Never => self.primitive_type_id(HirPrimitiveType::Unit),
            BuiltinType::Usize | BuiltinType::U64 => {
                self.primitive_type_id(HirPrimitiveType::I64)
            }
            BuiltinType::Ptr => None,
        }
    }

    pub fn type_program(
        self,
        program: &Spanned<HirProgram>,
    ) -> Result<TypeResult, Vec<TypeError>> {
        let (result, errors) = self.type_program_with_errors(program);
        if errors.is_empty() {
            Ok(result)
        } else {
            Err(errors)
        }
    }

    pub fn type_program_with_errors(
        mut self,
        program: &Spanned<HirProgram>,
    ) -> (TypeResult, Vec<TypeError>) {
        for item in &program.node.items {
            let (span, generics) = match &item.node {
                HirItem::FunctionDefinition(def) => (item.span, &def.node.generics),
                HirItem::TypeDefinition(def) => (item.span, &def.node.generics),
                HirItem::EnumDefinition(def) => (item.span, &def.node.generics),
                _ => continue,
            };
            if let Some(item_id) = self.item_id_for_span(span) {
                let names = generics
                    .iter()
                    .map(|generic| generic.node.name.clone())
                    .collect::<Vec<_>>();
                self.generic_items.insert(item_id, names);
            }
        }
        for item in &program.node.items {
            self.type_item(item);
        }
        self.cast_intents.sort_by_key(|intent| {
            (
                intent.span.start,
                intent.span.end,
                intent.from.0,
                intent.to.0,
            )
        });
        self.cast_intents
            .dedup_by(|left, right| left.span == right.span && left.from == right.from && left.to == right.to);
        let result = TypeResult {
            types: self.type_table,
            named_type_names: self
                .resolution
                .items
                .iter()
                .map(|item| (item.id, item.name.clone()))
                .collect(),
            expr_types: self.expr_types,
            local_types: self.local_types,
            function_signatures: self.function_signatures,
            struct_fields_ordered: self.struct_fields_ordered,
            enum_variants_ordered: self.enum_variants_ordered,
            generic_items: self.generic_items,
            cast_intents: self.cast_intents,
        };
        let errors = std::mem::take(&mut self.errors);
        (result, errors)
    }
}

pub fn type_program(
    program: &Spanned<HirProgram>,
    resolution: &Resolution,
) -> Result<TypeResult, Vec<TypeError>> {
    TypeContext::new(resolution).type_program(program)
}

pub fn type_program_with_errors(
    program: &Spanned<HirProgram>,
    resolution: &Resolution,
) -> (TypeResult, Vec<TypeError>) {
    TypeContext::new(resolution).type_program_with_errors(program)
}
