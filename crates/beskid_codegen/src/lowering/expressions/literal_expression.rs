use crate::lowering::expressions::literal::lower_literal;
use crate::lowering::lowerable::Lowerable;
use crate::lowering::node_context::NodeLoweringContext;
use cranelift_codegen::ir::Value;
use beskid_analysis::hir::HirLiteralExpression;
use beskid_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirLiteralExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, crate::errors::CodegenError> {
        lower_literal(
            &node.node.literal,
            node.span,
            ctx.type_result,
            ctx.codegen,
            ctx.builder,
        )
        .map(Some)
    }
}
