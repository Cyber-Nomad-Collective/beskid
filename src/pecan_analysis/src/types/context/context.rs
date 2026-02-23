use std::collections::HashMap;

use crate::hir::{HirPrimitiveType, HirProgram};
use crate::resolve::{ItemId, LocalId, Resolution};
use crate::syntax::{SpanInfo, Spanned};
use crate::types::{TypeId, TypeTable};

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
}

#[derive(Debug)]
pub struct TypeResult {
    pub types: TypeTable,
    pub expr_types: HashMap<SpanInfo, TypeId>,
    pub local_types: HashMap<LocalId, TypeId>,
    pub function_signatures: HashMap<ItemId, FunctionSignature>,
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
    pub(super) enum_variants: HashMap<ItemId, HashMap<String, Vec<TypeId>>>,
    pub(super) expr_types: HashMap<SpanInfo, TypeId>,
    pub(super) local_types: HashMap<LocalId, TypeId>,
    pub(super) function_signatures: HashMap<ItemId, FunctionSignature>,
    pub(super) cast_intents: Vec<CastIntent>,
    pub(super) errors: Vec<TypeError>,
    pub(super) current_return_type: Option<TypeId>,
}

impl<'a> TypeContext<'a> {
    pub fn new(resolution: &'a Resolution) -> Self {
        let mut context = Self {
            resolution,
            type_table: TypeTable::new(),
            primitive_types: HashMap::new(),
            named_types: HashMap::new(),
            struct_fields: HashMap::new(),
            enum_variants: HashMap::new(),
            expr_types: HashMap::new(),
            local_types: HashMap::new(),
            function_signatures: HashMap::new(),
            cast_intents: Vec::new(),
            errors: Vec::new(),
            current_return_type: None,
        };
        context.seed_types();
        context
    }

    pub fn type_program(
        mut self,
        program: &Spanned<HirProgram>,
    ) -> Result<TypeResult, Vec<TypeError>> {
        for item in &program.node.items {
            self.type_item(item);
        }
        if self.errors.is_empty() {
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
            Ok(TypeResult {
                types: self.type_table,
                expr_types: self.expr_types,
                local_types: self.local_types,
                function_signatures: self.function_signatures,
                cast_intents: self.cast_intents,
            })
        } else {
            Err(self.errors)
        }
    }
}

pub fn type_program(
    program: &Spanned<HirProgram>,
    resolution: &Resolution,
) -> Result<TypeResult, Vec<TypeError>> {
    TypeContext::new(resolution).type_program(program)
}
