use crate::errors::CodegenError;
use crate::lowering::lowerable::Lowerable;
use crate::lowering::node_context::NodeLoweringContext;
use cranelift_codegen::ir::Value;
use pecan_analysis::hir::HirMatchExpression;
use pecan_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirMatchExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        _ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        Err(CodegenError::UnsupportedNode {
            span: node.span,
            node: "match expression",
        })
    }
}
