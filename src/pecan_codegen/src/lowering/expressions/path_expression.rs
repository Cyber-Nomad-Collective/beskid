use crate::errors::CodegenError;
use crate::lowering::lowerable::Lowerable;
use crate::lowering::node_context::NodeLoweringContext;
use cranelift_codegen::ir::Value;
use pecan_analysis::hir::HirPathExpression;
use pecan_analysis::resolve::ResolvedValue;
use pecan_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirPathExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, crate::errors::CodegenError> {
        if node.node.path.node.segments.len() != 1 {
            return Err(CodegenError::UnsupportedNode {
                span: node.span,
                node: "multi-segment path expression",
            });
        }

        let resolved = ctx
            .resolution
            .tables
            .resolved_values
            .get(&node.node.path.span)
            .ok_or(CodegenError::MissingResolvedValue {
                span: node.node.path.span,
            })?;

        match resolved {
            ResolvedValue::Local(local_id) => {
                let var = ctx.state.locals.get(local_id).copied().ok_or(CodegenError::InvalidLocalBinding {
                    span: node.node.path.span,
                })?;
                Ok(Some(ctx.builder.use_var(var)))
            }
            ResolvedValue::Item(_) => Err(CodegenError::UnsupportedNode {
                span: node.node.path.span,
                node: "item-valued path expression",
            }),
        }
    }
}
