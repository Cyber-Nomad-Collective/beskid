use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use pecan_analysis::hir::HirExpressionStatement;
use pecan_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirExpressionStatement {
    type Output = ();

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, crate::errors::CodegenError> {
        let _ = lower_node(&node.node.expression, ctx)?;
        Ok(())
    }
}
