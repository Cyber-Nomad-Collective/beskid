use crate::errors::CodegenError;
use crate::lowering::lowerable::Lowerable;
use crate::lowering::node_context::NodeLoweringContext;
use cranelift_codegen::ir::InstBuilder;
use pecan_analysis::hir::HirContinueStatement;
use pecan_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirContinueStatement {
    type Output = ();

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let control = ctx.state.loop_stack.last().copied().ok_or(
            CodegenError::UnsupportedNode {
                span: node.span,
                node: "continue outside loop",
            },
        )?;
        ctx.builder.ins().jump(control.continue_block, &[]);
        ctx.state.block_terminated = true;
        Ok(())
    }
}
