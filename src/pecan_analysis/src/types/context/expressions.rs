use crate::hir::{
    HirBinaryExpression, HirBinaryOp, HirCallExpression, HirEnumConstructorExpression,
    HirExpressionNode, HirLiteral, HirMatchArm, HirMatchExpression, HirMemberExpression,
    HirPath, HirPattern, HirPrimitiveType, HirStructLiteralExpression, HirUnaryExpression,
    HirUnaryOp,
};
use crate::resolve::{ItemKind, ResolvedValue};
use crate::syntax::Spanned;
use crate::types::TypeId;

use super::context::{TypeContext, TypeError};

impl<'a> TypeContext<'a> {
    pub(super) fn type_expression(
        &mut self,
        expression: &Spanned<HirExpressionNode>,
    ) -> Option<TypeId> {
        let type_id = match &expression.node {
            HirExpressionNode::LiteralExpression(literal) => {
                self.type_id_for_literal(&literal.node.literal)
            }
            HirExpressionNode::PathExpression(path_expr) => {
                self.type_id_for_path(path_expr.node.path.span, &path_expr.node.path)
            }
            HirExpressionNode::StructLiteralExpression(literal) => {
                self.type_struct_literal_expression(literal)
            }
            HirExpressionNode::EnumConstructorExpression(constructor) => {
                self.type_enum_constructor_expression(constructor)
            }
            HirExpressionNode::AssignExpression(assign) => {
                let target = self.type_expression(&assign.node.target);
                let value = self.type_expression(&assign.node.value);
                if let (Some(target), Some(value)) = (target, value) {
                    self.require_same_type(assign.span, target, value);
                    Some(target)
                } else {
                    None
                }
            }
            HirExpressionNode::BinaryExpression(binary) => self.type_binary_expression(binary),
            HirExpressionNode::UnaryExpression(unary) => self.type_unary_expression(unary),
            HirExpressionNode::GroupedExpression(grouped) => self.type_expression(&grouped.node.expr),
            HirExpressionNode::BlockExpression(block_expr) => {
                self.type_block(&block_expr.node.block);
                self.primitive_type_id(HirPrimitiveType::Unit)
            }
            HirExpressionNode::CallExpression(call) => self.type_call_expression(call),
            HirExpressionNode::MemberExpression(member) => self.type_member_expression(member),
            HirExpressionNode::MatchExpression(match_expr) => self.type_match_expression(match_expr),
        };

        if let Some(type_id) = type_id {
            self.expr_types.insert(expression.span, type_id);
        }
        type_id
    }

    fn type_call_expression(&mut self, call: &Spanned<HirCallExpression>) -> Option<TypeId> {
        let signature = match &call.node.callee.node {
            HirExpressionNode::PathExpression(path_expr) => {
                let span = path_expr.node.path.span;
                match self.resolution.tables.resolved_values.get(&span) {
                    Some(ResolvedValue::Item(item_id)) => {
                        self.function_signatures.get(item_id).cloned()
                    }
                    _ => None,
                }
            }
            _ => None,
        };

        let Some(signature) = signature else {
            self.errors
                .push(TypeError::UnknownCallTarget { span: call.span });
            return None;
        };

        if call.node.args.len() != signature.params.len() {
            self.errors.push(TypeError::CallArityMismatch {
                span: call.span,
                expected: signature.params.len(),
                actual: call.node.args.len(),
            });
            return Some(signature.return_type);
        }

        for (arg, expected) in call.node.args.iter().zip(signature.params.iter()) {
            if let Some(actual) = self.type_expression(arg) {
                self.require_same_type(arg.span, *expected, actual);
            }
        }

        Some(signature.return_type)
    }

    fn type_struct_literal_expression(
        &mut self,
        literal: &Spanned<HirStructLiteralExpression>,
    ) -> Option<TypeId> {
        let mut type_id = self.type_id_for_type_path(literal.node.path.span);
        if type_id.is_none() {
            if let Some(segment) = literal.node.path.node.segments.last() {
                let fallback = self
                    .item_id_for_name(&segment.node.name, ItemKind::Type)
                    .and_then(|item_id| self.named_types.get(&item_id).copied());
                type_id = fallback;
            }
        }
        let type_id = type_id?;
        let Some(item_id) = self.named_item_id(type_id) else {
            self.errors
                .push(TypeError::UnknownStructType { span: literal.span });
            return None;
        };
        let fields = self.struct_fields.get(&item_id).cloned().or_else(|| {
            self.resolution
                .items
                .iter()
                .find(|info| info.id == item_id)
                .and_then(|info| self.item_id_for_name(&info.name, ItemKind::Type))
                .and_then(|item_id| self.struct_fields.get(&item_id).cloned())
        });
        let Some(fields) = fields else {
            self.errors
                .push(TypeError::UnknownStructType { span: literal.span });
            return None;
        };

        let mut seen = std::collections::HashSet::new();
        for field in &literal.node.fields {
            let name = field.node.name.node.name.clone();
            seen.insert(name.clone());
            let Some(expected) = fields.get(&name) else {
                self.errors.push(TypeError::UnknownStructField {
                    span: field.node.name.span,
                    name,
                });
                continue;
            };
            if let Some(actual) = self.type_expression(&field.node.value) {
                self.require_same_type(field.node.value.span, *expected, actual);
            }
        }

        for (name, _) in fields.iter() {
            if seen.contains(name) {
                continue;
            }
            self.errors.push(TypeError::MissingStructField {
                span: literal.span,
                name: name.clone(),
            });
        }

        Some(type_id)
    }

    fn type_enum_constructor_expression(
        &mut self,
        constructor: &Spanned<HirEnumConstructorExpression>,
    ) -> Option<TypeId> {
        let mut type_id =
            self.type_id_for_enum_path(constructor.node.path.span, &constructor.node.path);
        if type_id.is_none() {
            let type_name = constructor.node.path.node.type_name.node.name.as_str();
            let fallback = self
                .item_id_for_name(type_name, ItemKind::Enum)
                .and_then(|item_id| self.named_types.get(&item_id).copied());
            type_id = fallback;
        }
        let type_id = type_id?;
        let Some(item_id) = self.named_item_id(type_id) else {
            self.errors.push(TypeError::UnknownEnumType {
                span: constructor.span,
            });
            return None;
        };
        let variants = self.enum_variants.get(&item_id).cloned().or_else(|| {
            self.resolution
                .items
                .iter()
                .find(|info| info.id == item_id)
                .and_then(|info| self.item_id_for_name(&info.name, ItemKind::Enum))
                .and_then(|item_id| self.enum_variants.get(&item_id).cloned())
        });
        let Some(variants) = variants else {
            self.errors.push(TypeError::UnknownEnumType {
                span: constructor.span,
            });
            return None;
        };
        let variant_name = constructor.node.path.node.variant.node.name.clone();
        let Some(fields) = variants.get(&variant_name) else {
            self.errors.push(TypeError::UnknownEnumVariant {
                span: constructor.node.path.node.variant.span,
                name: variant_name,
            });
            return Some(type_id);
        };

        if constructor.node.args.len() != fields.len() {
            self.errors.push(TypeError::EnumConstructorMismatch {
                span: constructor.span,
                expected: fields.len(),
                actual: constructor.node.args.len(),
            });
            return Some(type_id);
        }

        for (arg, expected) in constructor.node.args.iter().zip(fields.iter()) {
            if let Some(actual) = self.type_expression(arg) {
                self.require_same_type(arg.span, *expected, actual);
            }
        }

        Some(type_id)
    }

    fn type_member_expression(&mut self, member: &Spanned<HirMemberExpression>) -> Option<TypeId> {
        let target_type = self.type_expression(&member.node.target)?;
        let Some(item_id) = self.named_item_id(target_type) else {
            self.errors
                .push(TypeError::InvalidMemberTarget { span: member.span });
            return None;
        };
        let fields = self.struct_fields.get(&item_id).cloned().or_else(|| {
            self.resolution
                .items
                .iter()
                .find(|info| info.id == item_id)
                .and_then(|info| self.item_id_for_name(&info.name, ItemKind::Type))
                .and_then(|item_id| self.struct_fields.get(&item_id).cloned())
        });
        let Some(fields) = fields else {
            self.errors
                .push(TypeError::UnknownStructType { span: member.span });
            return None;
        };
        let name = member.node.member.node.name.clone();
        let Some(field_type) = fields.get(&name) else {
            self.errors.push(TypeError::UnknownStructField {
                span: member.node.member.span,
                name,
            });
            return None;
        };
        Some(*field_type)
    }

    fn type_match_expression(&mut self, match_expr: &Spanned<HirMatchExpression>) -> Option<TypeId> {
        let scrutinee_type = self.type_expression(&match_expr.node.scrutinee);
        let mut expected: Option<TypeId> = None;
        for arm in &match_expr.node.arms {
            self.type_match_arm(scrutinee_type, arm, &mut expected);
        }
        expected
    }

    fn type_match_arm(
        &mut self,
        scrutinee_type: Option<TypeId>,
        arm: &Spanned<HirMatchArm>,
        expected: &mut Option<TypeId>,
    ) {
        if let Some(guard) = &arm.node.guard {
            self.require_bool(guard.span, guard);
        }
        self.type_pattern(scrutinee_type, &arm.node.pattern);
        let arm_type = self.type_expression(&arm.node.value);
        if let Some(actual) = arm_type {
            if let Some(expected_type) = *expected {
                if expected_type != actual {
                    self.errors.push(TypeError::MatchArmTypeMismatch {
                        span: arm.span,
                        expected: expected_type,
                        actual,
                    });
                }
            } else {
                *expected = Some(actual);
            }
        }
    }

    fn type_pattern(&mut self, scrutinee_type: Option<TypeId>, pattern: &Spanned<HirPattern>) {
        let Some(scrutinee_type) = scrutinee_type else {
            return;
        };
        match &pattern.node {
            HirPattern::Enum(enum_pattern) => {
                let enum_type = self
                    .type_id_for_enum_path(enum_pattern.node.path.span, &enum_pattern.node.path);
                if let Some(enum_type) = enum_type {
                    if enum_type != scrutinee_type {
                        self.errors.push(TypeError::TypeMismatch {
                            span: pattern.span,
                            expected: scrutinee_type,
                            actual: enum_type,
                        });
                    }
                    if let Some(item_id) = self.named_item_id(enum_type) {
                        if let Some(variants) = self.enum_variants.get(&item_id) {
                            let variant_name =
                                enum_pattern.node.path.node.variant.node.name.as_str();
                            if let Some(fields) = variants.get(variant_name).cloned() {
                                if fields.len() != enum_pattern.node.items.len() {
                                    self.errors.push(TypeError::EnumConstructorMismatch {
                                        span: pattern.span,
                                        expected: fields.len(),
                                        actual: enum_pattern.node.items.len(),
                                    });
                                }
                                for (item, expected_type) in
                                    enum_pattern.node.items.iter().zip(fields.iter())
                                {
                                    self.type_pattern_with_expected(*expected_type, item);
                                }
                            } else {
                                self.errors.push(TypeError::UnknownEnumVariant {
                                    span: enum_pattern.node.path.node.variant.span,
                                    name: enum_pattern
                                        .node
                                        .path
                                        .node
                                        .variant
                                        .node
                                        .name
                                        .clone(),
                                });
                            }
                        }
                    }
                }
            }
            HirPattern::Identifier(_) | HirPattern::Wildcard | HirPattern::Literal(_) => {
                self.type_pattern_with_expected(scrutinee_type, pattern);
            }
        }
    }

    fn type_pattern_with_expected(
        &mut self,
        expected_type: TypeId,
        pattern: &Spanned<HirPattern>,
    ) {
        match &pattern.node {
            HirPattern::Identifier(identifier) => {
                self.insert_local_type(identifier.span, expected_type);
            }
            HirPattern::Literal(literal) => {
                if let Some(actual) = self.type_id_for_literal(literal) {
                    self.require_same_type(pattern.span, expected_type, actual);
                }
            }
            HirPattern::Wildcard => {}
            HirPattern::Enum(enum_pattern) => {
                let enum_type = self
                    .type_id_for_enum_path(enum_pattern.node.path.span, &enum_pattern.node.path);
                if let Some(enum_type) = enum_type {
                    self.require_same_type(pattern.span, expected_type, enum_type);
                }
                for item in &enum_pattern.node.items {
                    self.type_pattern(None, item);
                }
            }
        }
    }

    pub(super) fn type_binary_expression(
        &mut self,
        binary: &Spanned<HirBinaryExpression>,
    ) -> Option<TypeId> {
        let left = self.type_expression(&binary.node.left);
        let right = self.type_expression(&binary.node.right);
        let (left, right) = match (left, right) {
            (Some(left), Some(right)) => (left, right),
            _ => return None,
        };
        if left != right {
            self.errors.push(TypeError::TypeMismatch {
                span: binary.span,
                expected: left,
                actual: right,
            });
            return None;
        }
        match binary.node.op.node {
            HirBinaryOp::Or | HirBinaryOp::And => {
                if self.is_bool(left) {
                    Some(left)
                } else {
                    self.errors
                        .push(TypeError::InvalidBinaryOp { span: binary.span });
                    None
                }
            }
            HirBinaryOp::Eq
            | HirBinaryOp::NotEq
            | HirBinaryOp::Lt
            | HirBinaryOp::Lte
            | HirBinaryOp::Gt
            | HirBinaryOp::Gte => {
                if self.is_comparable(left) {
                    self.primitive_type_id(HirPrimitiveType::Bool)
                } else {
                    self.errors
                        .push(TypeError::InvalidBinaryOp { span: binary.span });
                    None
                }
            }
            HirBinaryOp::Add
            | HirBinaryOp::Sub
            | HirBinaryOp::Mul
            | HirBinaryOp::Div => {
                if self.is_numeric(left) {
                    Some(left)
                } else {
                    self.errors
                        .push(TypeError::InvalidBinaryOp { span: binary.span });
                    None
                }
            }
        }
    }

    pub(super) fn type_unary_expression(
        &mut self,
        unary: &Spanned<HirUnaryExpression>,
    ) -> Option<TypeId> {
        let expr = self.type_expression(&unary.node.expr)?;
        match unary.node.op.node {
            HirUnaryOp::Neg => {
                if self.is_numeric(expr) {
                    Some(expr)
                } else {
                    self.errors
                        .push(TypeError::InvalidUnaryOp { span: unary.span });
                    None
                }
            }
            HirUnaryOp::Not => {
                if self.is_bool(expr) {
                    Some(expr)
                } else {
                    self.errors
                        .push(TypeError::InvalidUnaryOp { span: unary.span });
                    None
                }
            }
        }
    }

    pub(super) fn type_id_for_literal(&mut self, literal: &Spanned<HirLiteral>) -> Option<TypeId> {
        match &literal.node {
            HirLiteral::Integer(_) => self.primitive_type_id(HirPrimitiveType::I32),
            HirLiteral::Float(_) => self.primitive_type_id(HirPrimitiveType::F64),
            HirLiteral::String(_) => self.primitive_type_id(HirPrimitiveType::String),
            HirLiteral::Char(_) => self.primitive_type_id(HirPrimitiveType::Char),
            HirLiteral::Bool(_) => self.primitive_type_id(HirPrimitiveType::Bool),
        }
    }

    pub(super) fn type_id_for_path(
        &mut self,
        span: crate::syntax::SpanInfo,
        path: &Spanned<HirPath>,
    ) -> Option<TypeId> {
        if path.node.segments.len() > 1 {
            return self.type_struct_field_path(span, path);
        }
        match self.resolution.tables.resolved_values.get(&span) {
            Some(ResolvedValue::Local(local)) => {
                self.local_types.get(local).copied().or_else(|| {
                    self.errors.push(TypeError::UnknownValueType { span });
                    None
                })
            }
            Some(ResolvedValue::Item(_)) => {
                self.errors.push(TypeError::UnknownValueType { span });
                None
            }
            None => {
                self.errors.push(TypeError::UnknownValueType { span });
                None
            }
        }
    }

    fn type_struct_field_path(
        &mut self,
        span: crate::syntax::SpanInfo,
        path: &Spanned<HirPath>,
    ) -> Option<TypeId> {
        let segments = &path.node.segments;
        let base_name = segments.first()?.node.name.clone();
        let field_name = segments.get(1)?.node.name.clone();
        let local_id = self
            .resolution
            .tables
            .locals
            .iter()
            .rev()
            .find(|info| info.name == base_name)
            .map(|info| info.id);
        let Some(local_id) = local_id else {
            self.errors.push(TypeError::UnknownValueType { span });
            return None;
        };
        let Some(base_type) = self.local_types.get(&local_id).copied() else {
            self.errors.push(TypeError::UnknownValueType { span });
            return None;
        };
        let Some(item_id) = self.named_item_id(base_type) else {
            self.errors.push(TypeError::InvalidMemberTarget { span });
            return None;
        };
        let fields = self.struct_fields.get(&item_id).cloned().or_else(|| {
            self.resolution
                .items
                .iter()
                .find(|info| info.id == item_id)
                .and_then(|info| self.item_id_for_name(&info.name, ItemKind::Type))
                .and_then(|item_id| self.struct_fields.get(&item_id).cloned())
        });
        let Some(fields) = fields else {
            self.errors.push(TypeError::UnknownStructType { span });
            return None;
        };
        let Some(field_type) = fields.get(&field_name) else {
            self.errors.push(TypeError::UnknownStructField {
                span,
                name: field_name,
            });
            return None;
        };
        Some(*field_type)
    }

    pub(super) fn type_id_for_enum_path(
        &mut self,
        span: crate::syntax::SpanInfo,
        _path: &Spanned<crate::hir::HirEnumPath>,
    ) -> Option<TypeId> {
        self.type_id_for_type_path(span)
    }
}
