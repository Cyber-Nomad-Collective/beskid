use super::SemanticPipelineRule;
use crate::analysis::Severity;
use crate::analysis::rules::{types, RuleContext};
use crate::hir::{AstItem, AstProgram};
use crate::resolve::Resolution;
use crate::syntax::{Block, Expression, Spanned, Statement};
use crate::types::type_program;
use std::collections::HashMap;

impl SemanticPipelineRule {
    pub(super) fn stage2_type_check(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<AstProgram>,
        resolution: &Resolution,
    ) {
        self.check_immutable_assignments(ctx, hir);

        if let Err(errors) = type_program(hir, resolution) {
            for error in errors {
                types::emit_type_error(ctx, error);
            }
        }
    }

    fn check_immutable_assignments(&self, ctx: &mut RuleContext, hir: &Spanned<AstProgram>) {
        for item in &hir.node.items {
            match &item.node {
                AstItem::FunctionDefinition(definition) => {
                    self.walk_block_for_mutability(ctx, &definition.node.body, &mut HashMap::new());
                }
                AstItem::MethodDefinition(definition) => {
                    self.walk_block_for_mutability(ctx, &definition.node.body, &mut HashMap::new());
                }
                _ => {}
            }
        }
    }

    fn walk_block_for_mutability(
        &self,
        ctx: &mut RuleContext,
        block: &Spanned<Block>,
        bindings: &mut HashMap<String, bool>,
    ) {
        let snapshot = bindings.clone();

        for statement in &block.node.statements {
            match &statement.node {
                Statement::Let(let_statement) => {
                    self.walk_expr_for_mutability(ctx, &let_statement.node.value, bindings);
                    bindings.insert(let_statement.node.name.node.name.clone(), let_statement.node.mutable);
                }
                Statement::Return(return_statement) => {
                    if let Some(value) = &return_statement.node.value {
                        self.walk_expr_for_mutability(ctx, value, bindings);
                    }
                }
                Statement::While(while_statement) => {
                    self.walk_expr_for_mutability(ctx, &while_statement.node.condition, bindings);
                    self.walk_block_for_mutability(ctx, &while_statement.node.body, bindings);
                }
                Statement::For(for_statement) => {
                    self.walk_expr_for_mutability(ctx, &for_statement.node.range.node.start, bindings);
                    self.walk_expr_for_mutability(ctx, &for_statement.node.range.node.end, bindings);
                    bindings.insert(for_statement.node.iterator.node.name.clone(), false);
                    self.walk_block_for_mutability(ctx, &for_statement.node.body, bindings);
                }
                Statement::If(if_statement) => {
                    self.walk_expr_for_mutability(ctx, &if_statement.node.condition, bindings);
                    self.walk_block_for_mutability(ctx, &if_statement.node.then_block, bindings);
                    if let Some(else_block) = &if_statement.node.else_block {
                        self.walk_block_for_mutability(ctx, else_block, bindings);
                    }
                }
                Statement::Expression(expression_statement) => {
                    self.walk_expr_for_mutability(ctx, &expression_statement.node.expression, bindings);
                }
                Statement::Break(_) | Statement::Continue(_) => {}
            }
        }

        *bindings = snapshot;
    }

    fn walk_expr_for_mutability(
        &self,
        ctx: &mut RuleContext,
        expression: &Spanned<Expression>,
        bindings: &HashMap<String, bool>,
    ) {
        match &expression.node {
            Expression::Assign(assign_expression) => {
                if let Expression::Path(path_expr) = &assign_expression.node.target.node {
                    if path_expr.node.path.node.segments.len() == 1 {
                        if let Some(name) = path_expr.node.path.node.segments.first() {
                            if let Some(is_mutable) = bindings.get(&name.node.name) {
                                if !is_mutable {
                                    ctx.emit_simple(
                                        assign_expression.node.target.span,
                                        "E1214",
                                        format!("cannot assign to immutable binding `{}`", name.node.name),
                                        "immutable assignment",
                                        Some("declare it as `let mut` to allow assignment".to_string()),
                                        Severity::Error,
                                    );
                                }
                            }
                        }
                    }
                }
                self.walk_expr_for_mutability(ctx, &assign_expression.node.target, bindings);
                self.walk_expr_for_mutability(ctx, &assign_expression.node.value, bindings);
            }
            Expression::Binary(binary_expression) => {
                self.walk_expr_for_mutability(ctx, &binary_expression.node.left, bindings);
                self.walk_expr_for_mutability(ctx, &binary_expression.node.right, bindings);
            }
            Expression::Unary(unary_expression) => {
                self.walk_expr_for_mutability(ctx, &unary_expression.node.expr, bindings);
            }
            Expression::Call(call_expression) => {
                self.walk_expr_for_mutability(ctx, &call_expression.node.callee, bindings);
                for arg in &call_expression.node.args {
                    self.walk_expr_for_mutability(ctx, arg, bindings);
                }
            }
            Expression::Member(member_expression) => {
                self.walk_expr_for_mutability(ctx, &member_expression.node.target, bindings);
            }
            Expression::StructLiteral(struct_literal) => {
                for field in &struct_literal.node.fields {
                    self.walk_expr_for_mutability(ctx, &field.node.value, bindings);
                }
            }
            Expression::EnumConstructor(constructor_expression) => {
                for arg in &constructor_expression.node.args {
                    self.walk_expr_for_mutability(ctx, arg, bindings);
                }
            }
            Expression::Match(match_expression) => {
                self.walk_expr_for_mutability(ctx, &match_expression.node.scrutinee, bindings);
                for arm in &match_expression.node.arms {
                    if let Some(guard) = &arm.node.guard {
                        self.walk_expr_for_mutability(ctx, guard, bindings);
                    }
                    self.walk_expr_for_mutability(ctx, &arm.node.value, bindings);
                }
            }
            Expression::Block(block_expression) => {
                self.walk_block_for_mutability(ctx, &block_expression.node.block, &mut bindings.clone());
            }
            Expression::Grouped(grouped_expression) => {
                self.walk_expr_for_mutability(ctx, &grouped_expression.node.expr, bindings);
            }
            Expression::Literal(_) | Expression::Path(_) => {}
        }
    }
}
