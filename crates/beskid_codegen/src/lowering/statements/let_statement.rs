use crate::errors::CodegenError;
use crate::lowering::cast_intent::ensure_type_compatibility;
use crate::lowering::lowerable::{Lowerable, lower_node};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::map_type_id_to_clif;
use beskid_analysis::hir::{HirExpressionNode, HirLetStatement};
use beskid_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirLetStatement {
    type Output = ();

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let local_id = ctx
            .resolution
            .tables
            .locals
            .iter()
            .find(|info| info.span == node.node.name.span)
            .map(|info| info.id)
            .ok_or(CodegenError::InvalidLocalBinding {
                span: node.node.name.span,
            })?;

        let type_id = ctx.type_result.local_types.get(&local_id).copied().ok_or(
            CodegenError::MissingLocalType {
                span: node.node.name.span,
            },
        )?;
        let clif_ty =
            map_type_id_to_clif(ctx.type_result, type_id).ok_or(CodegenError::UnsupportedNode {
                span: node.node.name.span,
                node: "unsupported local type",
            })?;

        if let HirExpressionNode::LambdaExpression(lambda) = &node.node.value.node {
            ctx.state
                .local_lambdas
                .insert(local_id, lambda as *const Spanned<_>);

            let lowered = match lower_node(&node.node.value, ctx) {
                Ok(value) => value,
                Err(CodegenError::InvalidLocalBinding { .. }) => {
                    // Capturing lambdas still flow through the inline local-lambda path.
                    return Ok(());
                }
                Err(err) => return Err(err),
            };

            let value = lowered.ok_or(CodegenError::UnsupportedNode {
                span: node.node.value.span,
                node: "unit-valued let initializer",
            })?;

            let actual_type = ctx
                .type_result
                .expr_types
                .get(&node.node.value.span)
                .copied()
                .ok_or(CodegenError::MissingExpressionType {
                    span: node.node.value.span,
                })?;
            let value = ensure_type_compatibility(
                node.node.value.span,
                type_id,
                actual_type,
                ctx.type_result,
                ctx.builder,
                value,
            )?;

            let var = ctx.builder.declare_var(clif_ty);
            ctx.builder.def_var(var, value);
            ctx.state.locals.insert(local_id, var);
            return Ok(());
        }

        let value = lower_node(&node.node.value, ctx)?.ok_or(CodegenError::UnsupportedNode {
            span: node.node.value.span,
            node: "unit-valued let initializer",
        })?;

        let actual_type = ctx
            .type_result
            .expr_types
            .get(&node.node.value.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: node.node.value.span,
            })?;
        let value = ensure_type_compatibility(
            node.node.value.span,
            type_id,
            actual_type,
            ctx.type_result,
            ctx.builder,
            value,
        )?;

        let var = ctx.builder.declare_var(clif_ty);
        ctx.builder.def_var(var, value);
        ctx.state.locals.insert(local_id, var);
        Ok(())
    }
}
