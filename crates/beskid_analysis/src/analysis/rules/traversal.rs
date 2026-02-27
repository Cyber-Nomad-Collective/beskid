use crate::hir::{HirBlock, HirExpressionNode, HirStatementNode};
use crate::syntax::Spanned;

pub enum HirChildNode<'a> {
    Block(&'a Spanned<HirBlock>),
    Expr(&'a Spanned<HirExpressionNode>),
}

pub fn visit_statement_children(
    statement: &Spanned<HirStatementNode>,
    on_child: &mut dyn FnMut(HirChildNode<'_>),
) {
    match &statement.node {
        HirStatementNode::LetStatement(let_statement) => {
            on_child(HirChildNode::Expr(&let_statement.node.value));
        }
        HirStatementNode::ReturnStatement(return_statement) => {
            if let Some(value) = &return_statement.node.value {
                on_child(HirChildNode::Expr(value));
            }
        }
        HirStatementNode::WhileStatement(while_statement) => {
            on_child(HirChildNode::Expr(&while_statement.node.condition));
            on_child(HirChildNode::Block(&while_statement.node.body));
        }
        HirStatementNode::ForStatement(for_statement) => {
            on_child(HirChildNode::Expr(&for_statement.node.range.node.start));
            on_child(HirChildNode::Expr(&for_statement.node.range.node.end));
            on_child(HirChildNode::Block(&for_statement.node.body));
        }
        HirStatementNode::IfStatement(if_statement) => {
            on_child(HirChildNode::Expr(&if_statement.node.condition));
            on_child(HirChildNode::Block(&if_statement.node.then_block));
            if let Some(else_block) = &if_statement.node.else_block {
                on_child(HirChildNode::Block(else_block));
            }
        }
        HirStatementNode::ExpressionStatement(expression_statement) => {
            on_child(HirChildNode::Expr(&expression_statement.node.expression));
        }
        HirStatementNode::BreakStatement(_) | HirStatementNode::ContinueStatement(_) => {}
    }
}

pub fn visit_expression_children(
    expression: &Spanned<HirExpressionNode>,
    on_child: &mut dyn FnMut(HirChildNode<'_>),
) {
    match &expression.node {
        HirExpressionNode::PathExpression(_) | HirExpressionNode::LiteralExpression(_) => {}
        HirExpressionNode::AssignExpression(assign_expression) => {
            on_child(HirChildNode::Expr(&assign_expression.node.target));
            on_child(HirChildNode::Expr(&assign_expression.node.value));
        }
        HirExpressionNode::BinaryExpression(binary_expression) => {
            on_child(HirChildNode::Expr(&binary_expression.node.left));
            on_child(HirChildNode::Expr(&binary_expression.node.right));
        }
        HirExpressionNode::UnaryExpression(unary_expression) => {
            on_child(HirChildNode::Expr(&unary_expression.node.expr));
        }
        HirExpressionNode::CallExpression(call_expression) => {
            on_child(HirChildNode::Expr(&call_expression.node.callee));
            for arg in &call_expression.node.args {
                on_child(HirChildNode::Expr(arg));
            }
        }
        HirExpressionNode::MemberExpression(member_expression) => {
            on_child(HirChildNode::Expr(&member_expression.node.target));
        }
        HirExpressionNode::StructLiteralExpression(struct_literal) => {
            for field in &struct_literal.node.fields {
                on_child(HirChildNode::Expr(&field.node.value));
            }
        }
        HirExpressionNode::EnumConstructorExpression(constructor_expression) => {
            for arg in &constructor_expression.node.args {
                on_child(HirChildNode::Expr(arg));
            }
        }
        HirExpressionNode::MatchExpression(match_expression) => {
            on_child(HirChildNode::Expr(&match_expression.node.scrutinee));
            for arm in &match_expression.node.arms {
                if let Some(guard) = &arm.node.guard {
                    on_child(HirChildNode::Expr(guard));
                }
                on_child(HirChildNode::Expr(&arm.node.value));
            }
        }
        HirExpressionNode::BlockExpression(block_expression) => {
            on_child(HirChildNode::Block(&block_expression.node.block));
        }
        HirExpressionNode::GroupedExpression(grouped_expression) => {
            on_child(HirChildNode::Expr(&grouped_expression.node.expr));
        }
    }
}
