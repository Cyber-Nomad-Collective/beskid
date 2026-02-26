use crate::lowering::lowerable::{Lowerable, lower_node};
use crate::lowering::node_context::NodeLoweringContext;
use beskid_analysis::hir::HirGroupedExpression;
use beskid_analysis::syntax::Spanned;
use cranelift_codegen::ir::Value;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirGroupedExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, crate::errors::CodegenError> {
        lower_node(&node.node.expr, ctx)
    }
}
