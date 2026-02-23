use crate::errors::CodegenError;
use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use pecan_analysis::hir::HirStatementNode;
use pecan_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirStatementNode {
    type Output = ();

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        match &node.node {
            HirStatementNode::LetStatement(inner) => lower_node(inner, ctx),
            HirStatementNode::ReturnStatement(inner) => lower_node(inner, ctx),
            HirStatementNode::BreakStatement(inner) => lower_node(inner, ctx),
            HirStatementNode::ContinueStatement(inner) => lower_node(inner, ctx),
            HirStatementNode::WhileStatement(inner) => lower_node(inner, ctx),
            HirStatementNode::ForStatement(inner) => lower_node(inner, ctx),
            HirStatementNode::IfStatement(inner) => lower_node(inner, ctx),
            HirStatementNode::ExpressionStatement(inner) => lower_node(inner, ctx),
        }
    }
}
