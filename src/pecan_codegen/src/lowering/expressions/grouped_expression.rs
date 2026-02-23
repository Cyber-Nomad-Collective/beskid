use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use cranelift_codegen::ir::Value;
use pecan_analysis::hir::HirGroupedExpression;
use pecan_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirGroupedExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, crate::errors::CodegenError> {
        lower_node(&node.node.expr, ctx)
    }
}
