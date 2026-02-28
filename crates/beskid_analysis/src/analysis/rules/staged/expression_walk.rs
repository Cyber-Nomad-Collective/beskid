use crate::hir::{HirBlock, HirExpressionNode};
use crate::syntax::Spanned;

pub enum ExprChild<'a> {
    Expr(&'a Spanned<HirExpressionNode>),
    Block(&'a Spanned<HirBlock>),
}

pub fn visit_expression_children<'a>(
    expression: &'a Spanned<HirExpressionNode>,
    visit: &mut impl FnMut(ExprChild<'a>),
) {
    match &expression.node {
        HirExpressionNode::MatchExpression(expr) => {
            visit(ExprChild::Expr(&expr.node.scrutinee));
            for arm in &expr.node.arms {
                if let Some(guard) = &arm.node.guard {
                    visit(ExprChild::Expr(guard));
                }
                visit(ExprChild::Expr(&arm.node.value));
            }
        }
        HirExpressionNode::AssignExpression(expr) => {
            visit(ExprChild::Expr(&expr.node.target));
            visit(ExprChild::Expr(&expr.node.value));
        }
        HirExpressionNode::BinaryExpression(expr) => {
            visit(ExprChild::Expr(&expr.node.left));
            visit(ExprChild::Expr(&expr.node.right));
        }
        HirExpressionNode::UnaryExpression(expr) => {
            visit(ExprChild::Expr(&expr.node.expr));
        }
        HirExpressionNode::CallExpression(expr) => {
            visit(ExprChild::Expr(&expr.node.callee));
            for arg in &expr.node.args {
                visit(ExprChild::Expr(arg));
            }
        }
        HirExpressionNode::MemberExpression(expr) => {
            visit(ExprChild::Expr(&expr.node.target));
        }
        HirExpressionNode::LiteralExpression(_) => {}
        HirExpressionNode::PathExpression(_) => {}
        HirExpressionNode::StructLiteralExpression(expr) => {
            for field in &expr.node.fields {
                visit(ExprChild::Expr(&field.node.value));
            }
        }
        HirExpressionNode::EnumConstructorExpression(expr) => {
            for arg in &expr.node.args {
                visit(ExprChild::Expr(arg));
            }
        }
        HirExpressionNode::BlockExpression(expr) => {
            visit(ExprChild::Block(&expr.node.block));
        }
        HirExpressionNode::GroupedExpression(expr) => {
            visit(ExprChild::Expr(&expr.node.expr));
        }
    }
}
