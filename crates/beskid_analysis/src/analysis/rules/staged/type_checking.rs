use super::SemanticPipelineRule;
use crate::analysis::Severity;
use crate::analysis::rules::{RuleContext, types};
use crate::analysis::rules::staged::traversal::{
    HirChildNode, visit_expression_children, visit_statement_children,
};
use crate::hir::{HirBlock, HirExpressionNode, HirItem, HirProgram, HirStatementNode};
use crate::resolve::Resolution;
use crate::syntax::Spanned;
use crate::types::type_program_with_errors;
use std::collections::HashMap;

impl SemanticPipelineRule {
    pub(super) fn stage2_type_check(
        &self,
        ctx: &mut RuleContext,
        hir: &Spanned<HirProgram>,
        resolution: &Resolution,
    ) {
        self.check_immutable_assignments(ctx, hir);

        let (typed, errors) = type_program_with_errors(hir, resolution);
        if errors.is_empty() {
            types::emit_cast_intent_warnings(ctx, &typed);
            return;
        }
        for error in errors {
            types::emit_type_error(ctx, error, Some(&typed));
        }
    }

    fn check_immutable_assignments(&self, ctx: &mut RuleContext, hir: &Spanned<HirProgram>) {
        for item in &hir.node.items {
            match &item.node {
                HirItem::FunctionDefinition(definition) => {
                    self.walk_block_for_mutability(ctx, &definition.node.body, &mut HashMap::new());
                }
                HirItem::MethodDefinition(definition) => {
                    self.walk_block_for_mutability(ctx, &definition.node.body, &mut HashMap::new());
                }
                _ => {}
            }
        }
    }

    fn walk_block_for_mutability(
        &self,
        ctx: &mut RuleContext,
        block: &Spanned<HirBlock>,
        bindings: &mut HashMap<String, bool>,
    ) {
        let snapshot = bindings.clone();

        for statement in &block.node.statements {
            match &statement.node {
                HirStatementNode::LetStatement(let_statement) => {
                    self.walk_expr_for_mutability(ctx, &let_statement.node.value, bindings);
                    bindings.insert(
                        let_statement.node.name.node.name.clone(),
                        let_statement.node.mutable,
                    );
                }
                HirStatementNode::ReturnStatement(return_statement) => {
                    if let Some(value) = &return_statement.node.value {
                        self.walk_expr_for_mutability(ctx, value, bindings);
                    }
                }
                HirStatementNode::WhileStatement(while_statement) => {
                    self.walk_expr_for_mutability(ctx, &while_statement.node.condition, bindings);
                    self.walk_block_for_mutability(ctx, &while_statement.node.body, bindings);
                }
                HirStatementNode::ForStatement(for_statement) => {
                    self.walk_expr_for_mutability(
                        ctx,
                        &for_statement.node.range.node.start,
                        bindings,
                    );
                    self.walk_expr_for_mutability(
                        ctx,
                        &for_statement.node.range.node.end,
                        bindings,
                    );
                    bindings.insert(for_statement.node.iterator.node.name.clone(), false);
                    self.walk_block_for_mutability(ctx, &for_statement.node.body, bindings);
                }
                _ => {
                    let mut on_child = |child: HirChildNode<'_>| match child {
                        HirChildNode::Block(child_block) => {
                            self.walk_block_for_mutability(ctx, child_block, bindings);
                        }
                        HirChildNode::Expr(child_expr) => {
                            self.walk_expr_for_mutability(ctx, child_expr, bindings);
                        }
                    };
                    visit_statement_children(statement, &mut on_child);
                }
            }
        }

        *bindings = snapshot;
    }

    fn walk_expr_for_mutability(
        &self,
        ctx: &mut RuleContext,
        expression: &Spanned<HirExpressionNode>,
        bindings: &HashMap<String, bool>,
    ) {
        if let HirExpressionNode::AssignExpression(assign_expression) = &expression.node {
            if let HirExpressionNode::PathExpression(path_expr) =
                &assign_expression.node.target.node
                && path_expr.node.path.node.segments.len() == 1
                && let Some(name) = path_expr.node.path.node.segments.first()
            {
                let name_value = &name.node.name.node.name;
                if let Some(is_mutable) = bindings.get(name_value) && !is_mutable {
                    ctx.emit_simple(
                        assign_expression.node.target.span,
                        "E1214",
                        format!("cannot assign to immutable binding `{}`", name_value),
                        "immutable assignment",
                        Some("declare it as `let mut` to allow assignment".to_string()),
                        Severity::Error,
                    );
                }
            }
        }

        let mut on_child = |child: HirChildNode<'_>| match child {
            HirChildNode::Block(child_block) => {
                self.walk_block_for_mutability(ctx, child_block, &mut bindings.clone());
            }
            HirChildNode::Expr(child_expr) => {
                self.walk_expr_for_mutability(ctx, child_expr, bindings);
            }
        };
        visit_expression_children(expression, &mut on_child);
    }
}
