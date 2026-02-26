use crate::errors::CodegenError;
use crate::lowering::lowerable::{Lowerable, lower_node};
use crate::lowering::node_context::NodeLoweringContext;
use beskid_analysis::hir::HirStatementNode;
use beskid_analysis::syntax::Spanned;

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
            HirStatementNode::ForStatement(_) => {
                unreachable!("For statements should be normalized out before codegen")
            }
            HirStatementNode::IfStatement(inner) => lower_node(inner, ctx),
            HirStatementNode::ExpressionStatement(inner) => lower_node(inner, ctx),
        }
    }
}
