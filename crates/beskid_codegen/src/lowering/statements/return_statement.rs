use crate::errors::CodegenError;
use crate::lowering::cast_intent::ensure_type_compatibility;
use crate::lowering::lowerable::{Lowerable, lower_node};
use crate::lowering::node_context::NodeLoweringContext;
use beskid_analysis::hir::HirReturnStatement;
use beskid_analysis::syntax::Spanned;
use cranelift_codegen::ir::InstBuilder;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirReturnStatement {
    type Output = ();

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        match &node.node.value {
            Some(value_expr) => {
                let mut value =
                    lower_node(value_expr, ctx)?.ok_or(CodegenError::UnsupportedNode {
                        span: value_expr.span,
                        node: "unit return value",
                    })?;
                if let Some(expected) = ctx.expected_return_type {
                    let actual = ctx
                        .type_result
                        .expr_types
                        .get(&value_expr.span)
                        .copied()
                        .ok_or(CodegenError::MissingExpressionType {
                            span: value_expr.span,
                        })?;
                    value = ensure_type_compatibility(
                        value_expr.span,
                        expected,
                        actual,
                        ctx.type_result,
                        ctx.builder,
                        value,
                    )?;
                }
                ctx.builder.ins().return_(&[value]);
            }
            None => {
                ctx.builder.ins().return_(&[]);
            }
        }

        ctx.state.return_emitted = true;
        ctx.state.block_terminated = true;
        Ok(())
    }
}
