use crate::errors::CodegenError;
use crate::lowering::lowerable::Lowerable;
use crate::lowering::node_context::NodeLoweringContext;
use pecan_analysis::hir::HirForStatement;
use pecan_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirForStatement {
    type Output = ();

    fn lower(
        node: &Spanned<Self>,
        _ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        Err(CodegenError::UnsupportedNode {
            span: node.span,
            node: "for statement",
        })
    }
}
