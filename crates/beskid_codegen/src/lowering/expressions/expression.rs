use crate::errors::CodegenError;
use crate::lowering::lowerable::{Lowerable, lower_node};
use crate::lowering::node_context::NodeLoweringContext;
use beskid_analysis::hir::HirExpressionNode;
use beskid_analysis::syntax::Spanned;
use cranelift_codegen::ir::Value;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirExpressionNode {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        match &node.node {
            HirExpressionNode::MatchExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::AssignExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::BinaryExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::UnaryExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::CallExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::MemberExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::LiteralExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::PathExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::StructLiteralExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::EnumConstructorExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::BlockExpression(inner) => lower_node(inner, ctx),
            HirExpressionNode::GroupedExpression(inner) => lower_node(inner, ctx),
        }
    }
}
