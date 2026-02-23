use crate::hir::{
    HirBlock, HirContractNode, HirExpressionNode, HirItem, HirPattern, HirProgram, HirStatementNode,
    HirType,
};
use crate::resolve::Resolution;
use crate::syntax::{SpanInfo, Spanned};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HirLegalityError {
    InvalidSpan { span: SpanInfo, context: &'static str },
    UnresolvedValuePath { span: SpanInfo },
    UnresolvedTypePath { span: SpanInfo },
    NonNormalizedControlFlow { span: SpanInfo, message: &'static str },
}

pub fn validate_hir_program(
    program: &Spanned<HirProgram>,
    resolution: &Resolution,
) -> Vec<HirLegalityError> {
    let mut validator = HirLegalityValidator::new(resolution);
    validator.validate_program(program);
    validator.errors
}

struct HirLegalityValidator<'a> {
    resolution: &'a Resolution,
    errors: Vec<HirLegalityError>,
}

impl<'a> HirLegalityValidator<'a> {
    fn new(resolution: &'a Resolution) -> Self {
        Self {
            resolution,
            errors: Vec::new(),
        }
    }

    fn validate_program(&mut self, program: &Spanned<HirProgram>) {
        self.check_span(program.span, "program");
        for item in &program.node.items {
            self.validate_item(item);
        }
    }

    fn validate_item(&mut self, item: &Spanned<HirItem>) {
        self.check_span(item.span, "item");
        match &item.node {
            HirItem::FunctionDefinition(def) => {
                self.check_span(def.span, "function_definition");
                self.validate_block(&def.node.body);
                for parameter in &def.node.parameters {
                    self.check_span(parameter.span, "parameter");
                    self.validate_type(&parameter.node.ty);
                }
                if let Some(return_type) = &def.node.return_type {
                    self.validate_type(return_type);
                }
            }
            HirItem::MethodDefinition(def) => {
                self.check_span(def.span, "method_definition");
                self.validate_type(&def.node.receiver_type);
                self.validate_block(&def.node.body);
                for parameter in &def.node.parameters {
                    self.check_span(parameter.span, "parameter");
                    self.validate_type(&parameter.node.ty);
                }
                if let Some(return_type) = &def.node.return_type {
                    self.validate_type(return_type);
                }
            }
            HirItem::TypeDefinition(def) => {
                self.check_span(def.span, "type_definition");
                for field in &def.node.fields {
                    self.check_span(field.span, "field");
                    self.validate_type(&field.node.ty);
                }
            }
            HirItem::EnumDefinition(def) => {
                self.check_span(def.span, "enum_definition");
                for variant in &def.node.variants {
                    self.check_span(variant.span, "enum_variant");
                    for field in &variant.node.fields {
                        self.check_span(field.span, "field");
                        self.validate_type(&field.node.ty);
                    }
                }
            }
            HirItem::ContractDefinition(def) => {
                self.check_span(def.span, "contract_definition");
                for node in &def.node.items {
                    self.check_span(node.span, "contract_node");
                    match &node.node {
                        HirContractNode::MethodSignature(signature) => {
                            self.check_span(signature.span, "contract_method_signature");
                            for parameter in &signature.node.parameters {
                                self.check_span(parameter.span, "parameter");
                                self.validate_type(&parameter.node.ty);
                            }
                            if let Some(return_type) = &signature.node.return_type {
                                self.validate_type(return_type);
                            }
                        }
                        HirContractNode::Embedding(embedding) => {
                            self.check_span(embedding.span, "contract_embedding");
                        }
                    }
                }
            }
            HirItem::ModuleDeclaration(def) => {
                self.check_span(def.span, "module_declaration");
            }
            HirItem::UseDeclaration(def) => {
                self.check_span(def.span, "use_declaration");
            }
        }
    }

    fn validate_block(&mut self, block: &Spanned<HirBlock>) {
        self.check_span(block.span, "block");
        for statement in &block.node.statements {
            self.validate_statement(statement);
        }
    }

    fn validate_statement(&mut self, statement: &Spanned<HirStatementNode>) {
        self.check_span(statement.span, "statement");
        match &statement.node {
            HirStatementNode::LetStatement(let_stmt) => {
                self.check_span(let_stmt.span, "let_statement");
                if let Some(type_annotation) = &let_stmt.node.type_annotation {
                    self.validate_type(type_annotation);
                }
                self.validate_expression(&let_stmt.node.value);
            }
            HirStatementNode::ReturnStatement(return_stmt) => {
                self.check_span(return_stmt.span, "return_statement");
                if let Some(value) = &return_stmt.node.value {
                    self.validate_expression(value);
                }
            }
            HirStatementNode::BreakStatement(break_stmt) => {
                self.check_span(break_stmt.span, "break_statement");
            }
            HirStatementNode::ContinueStatement(continue_stmt) => {
                self.check_span(continue_stmt.span, "continue_statement");
            }
            HirStatementNode::WhileStatement(while_stmt) => {
                self.check_span(while_stmt.span, "while_statement");
                self.validate_expression(&while_stmt.node.condition);
                self.validate_block(&while_stmt.node.body);
            }
            HirStatementNode::ForStatement(for_stmt) => {
                self.check_span(for_stmt.span, "for_statement");
                self.check_span(for_stmt.node.range.span, "range_expression");
                self.validate_expression(&for_stmt.node.range.node.start);
                self.validate_expression(&for_stmt.node.range.node.end);
                self.validate_block(&for_stmt.node.body);
            }
            HirStatementNode::IfStatement(if_stmt) => {
                self.check_span(if_stmt.span, "if_statement");
                self.validate_expression(&if_stmt.node.condition);
                self.validate_block(&if_stmt.node.then_block);
                if let Some(else_block) = &if_stmt.node.else_block {
                    self.validate_block(else_block);
                }
            }
            HirStatementNode::ExpressionStatement(expr_stmt) => {
                self.check_span(expr_stmt.span, "expression_statement");
                self.validate_expression(&expr_stmt.node.expression);
            }
        }
    }

    fn validate_expression(&mut self, expression: &Spanned<HirExpressionNode>) {
        self.check_span(expression.span, "expression");
        match &expression.node {
            HirExpressionNode::MatchExpression(match_expr) => {
                self.check_span(match_expr.span, "match_expression");
                if match_expr.node.arms.is_empty() {
                    self.errors.push(HirLegalityError::NonNormalizedControlFlow {
                        span: match_expr.span,
                        message: "match expression must contain at least one arm",
                    });
                }
                self.validate_expression(&match_expr.node.scrutinee);
                for arm in &match_expr.node.arms {
                    self.check_span(arm.span, "match_arm");
                    self.validate_pattern(&arm.node.pattern);
                    if let Some(guard) = &arm.node.guard {
                        self.validate_expression(guard);
                    }
                    self.validate_expression(&arm.node.value);
                }
            }
            HirExpressionNode::AssignExpression(assign_expr) => {
                self.check_span(assign_expr.span, "assign_expression");
                self.validate_expression(&assign_expr.node.target);
                self.validate_expression(&assign_expr.node.value);
            }
            HirExpressionNode::BinaryExpression(binary_expr) => {
                self.check_span(binary_expr.span, "binary_expression");
                self.check_span(binary_expr.node.op.span, "binary_operator");
                self.validate_expression(&binary_expr.node.left);
                self.validate_expression(&binary_expr.node.right);
            }
            HirExpressionNode::UnaryExpression(unary_expr) => {
                self.check_span(unary_expr.span, "unary_expression");
                self.check_span(unary_expr.node.op.span, "unary_operator");
                self.validate_expression(&unary_expr.node.expr);
            }
            HirExpressionNode::CallExpression(call_expr) => {
                self.check_span(call_expr.span, "call_expression");
                self.validate_expression(&call_expr.node.callee);
                for argument in &call_expr.node.args {
                    self.validate_expression(argument);
                }
            }
            HirExpressionNode::MemberExpression(member_expr) => {
                self.check_span(member_expr.span, "member_expression");
                self.validate_expression(&member_expr.node.target);
            }
            HirExpressionNode::LiteralExpression(literal_expr) => {
                self.check_span(literal_expr.span, "literal_expression");
                self.check_span(literal_expr.node.literal.span, "literal");
            }
            HirExpressionNode::PathExpression(path_expr) => {
                self.check_span(path_expr.span, "path_expression");
                self.check_span(path_expr.node.path.span, "path");
                if !self
                    .resolution
                    .tables
                    .resolved_values
                    .contains_key(&path_expr.node.path.span)
                {
                    self.errors.push(HirLegalityError::UnresolvedValuePath {
                        span: path_expr.node.path.span,
                    });
                }
            }
            HirExpressionNode::StructLiteralExpression(literal_expr) => {
                self.check_span(literal_expr.span, "struct_literal_expression");
                self.check_span(literal_expr.node.path.span, "struct_literal_path");
                if !self
                    .resolution
                    .tables
                    .resolved_types
                    .contains_key(&literal_expr.node.path.span)
                {
                    self.errors.push(HirLegalityError::UnresolvedTypePath {
                        span: literal_expr.node.path.span,
                    });
                }
                for field in &literal_expr.node.fields {
                    self.check_span(field.span, "struct_literal_field");
                    self.validate_expression(&field.node.value);
                }
            }
            HirExpressionNode::EnumConstructorExpression(constructor_expr) => {
                self.check_span(constructor_expr.span, "enum_constructor_expression");
                self.check_span(constructor_expr.node.path.span, "enum_path");
                if !self
                    .resolution
                    .tables
                    .resolved_types
                    .contains_key(&constructor_expr.node.path.span)
                {
                    self.errors.push(HirLegalityError::UnresolvedTypePath {
                        span: constructor_expr.node.path.span,
                    });
                }
                for argument in &constructor_expr.node.args {
                    self.validate_expression(argument);
                }
            }
            HirExpressionNode::BlockExpression(block_expr) => {
                self.check_span(block_expr.span, "block_expression");
                self.validate_block(&block_expr.node.block);
            }
            HirExpressionNode::GroupedExpression(grouped_expr) => {
                self.check_span(grouped_expr.span, "grouped_expression");
                self.validate_expression(&grouped_expr.node.expr);
            }
        }
    }

    fn validate_pattern(&mut self, pattern: &Spanned<HirPattern>) {
        self.check_span(pattern.span, "pattern");
        match &pattern.node {
            HirPattern::Wildcard => {}
            HirPattern::Identifier(identifier) => {
                self.check_span(identifier.span, "pattern_identifier");
            }
            HirPattern::Literal(literal) => {
                self.check_span(literal.span, "pattern_literal");
            }
            HirPattern::Enum(enum_pattern) => {
                self.check_span(enum_pattern.span, "enum_pattern");
                self.check_span(enum_pattern.node.path.span, "enum_pattern_path");
                if !self
                    .resolution
                    .tables
                    .resolved_types
                    .contains_key(&enum_pattern.node.path.span)
                {
                    self.errors.push(HirLegalityError::UnresolvedTypePath {
                        span: enum_pattern.node.path.span,
                    });
                }
                for child in &enum_pattern.node.items {
                    self.validate_pattern(child);
                }
            }
        }
    }

    fn validate_type(&mut self, ty: &Spanned<HirType>) {
        self.check_span(ty.span, "type");
        match &ty.node {
            HirType::Primitive(primitive) => self.check_span(primitive.span, "primitive_type"),
            HirType::Complex(path) => {
                self.check_span(path.span, "complex_type_path");
                if !self.resolution.tables.resolved_types.contains_key(&path.span) {
                    self.errors.push(HirLegalityError::UnresolvedTypePath { span: path.span });
                }
            }
            HirType::Array(inner) | HirType::Ref(inner) => self.validate_type(inner),
        }
    }

    fn check_span(&mut self, span: SpanInfo, context: &'static str) {
        let line_col_reversed = span.line_col_start.0 > span.line_col_end.0
            || (span.line_col_start.0 == span.line_col_end.0
                && span.line_col_start.1 > span.line_col_end.1);
        if span.start > span.end || line_col_reversed {
            self.errors
                .push(HirLegalityError::InvalidSpan { span, context });
        }
    }
}
