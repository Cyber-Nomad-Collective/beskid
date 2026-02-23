use crate::lowering::lowerable::Lowerable;
use crate::lowering::node_context::NodeLoweringContext;
use cranelift_codegen::ir::Value;
use pecan_analysis::hir::HirBlockExpression;
use pecan_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirBlockExpression {
    type Output = Option<Value>;

    fn lower(
        _node: &Spanned<Self>,
        _ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, crate::errors::CodegenError> {
        Ok(None)
    }
}
