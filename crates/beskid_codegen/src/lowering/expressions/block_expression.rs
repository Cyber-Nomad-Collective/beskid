use crate::lowering::lowerable::Lowerable;
use crate::lowering::node_context::NodeLoweringContext;
use beskid_analysis::hir::HirBlockExpression;
use beskid_analysis::syntax::Spanned;
use cranelift_codegen::ir::Value;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirBlockExpression {
    type Output = Option<Value>;

    fn lower(
        _node: &Spanned<Self>,
        _ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, crate::errors::CodegenError> {
        Ok(None)
    }
}
