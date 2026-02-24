use crate::errors::CodegenError;
use crate::lowering::cast_intent::ensure_type_compatibility;
use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use cranelift_codegen::ir::Value;
use pecan_analysis::hir::{HirAssignExpression, HirExpressionNode};
use pecan_analysis::resolve::ResolvedValue;
use pecan_analysis::syntax::Spanned;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirAssignExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let HirExpressionNode::PathExpression(path_expr) = &node.node.target.node else {
            return Err(CodegenError::UnsupportedNode {
                span: node.node.target.span,
                node: "non-path assignment target",
            });
        };
        if path_expr.node.path.node.segments.len() != 1 {
            return Err(CodegenError::UnsupportedNode {
                span: node.node.target.span,
                node: "multi-segment assignment target",
            });
        }

        let resolved = ctx
            .resolution
            .tables
            .resolved_values
            .get(&path_expr.node.path.span)
            .ok_or(CodegenError::MissingResolvedValue {
                span: path_expr.node.path.span,
            })?;
        let ResolvedValue::Local(local_id) = resolved else {
            return Err(CodegenError::UnsupportedNode {
                span: path_expr.node.path.span,
                node: "non-local assignment target",
            });
        };
        let var = ctx
            .state
            .locals
            .get(local_id)
            .copied()
            .ok_or(CodegenError::InvalidLocalBinding {
                span: path_expr.node.path.span,
            })?;

        let value = lower_node(&node.node.value, ctx)?.ok_or(CodegenError::UnsupportedNode {
            span: node.node.value.span,
            node: "unit-valued assignment",
        })?;

        let expected_type = ctx
            .type_result
            .local_types
            .get(local_id)
            .copied()
            .ok_or(CodegenError::MissingLocalType {
                span: path_expr.node.path.span,
            })?;
        let actual_type = ctx
            .type_result
            .expr_types
            .get(&node.node.value.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: node.node.value.span,
            })?;
        let value = ensure_type_compatibility(node.node.value.span, expected_type, actual_type, ctx.type_result, ctx.builder, value)?;

        ctx.builder.def_var(var, value);
        Ok(Some(value))
    }
}
