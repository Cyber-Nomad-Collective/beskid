use crate::errors::CodegenError;
use crate::lowering::lowerable::{Lowerable, lower_node};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::map_type_id_to_clif;
use beskid_analysis::hir::{HirPrimitiveType, HirUnaryExpression, HirUnaryOp};
use beskid_analysis::syntax::Spanned;
use beskid_analysis::types::TypeInfo;
use cranelift_codegen::ir::{InstBuilder, Value, types};

impl Lowerable<NodeLoweringContext<'_, '_>> for HirUnaryExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let value = lower_node(&node.node.expr, ctx)?.ok_or(CodegenError::UnsupportedNode {
            span: node.node.expr.span,
            node: "unit-valued unary operand",
        })?;
        let type_id = ctx
            .type_result
            .expr_types
            .get(&node.node.expr.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: node.node.expr.span,
            })?;
        let type_info = ctx.type_result.types.get(type_id);
        let clif_ty =
            map_type_id_to_clif(ctx.type_result, type_id).ok_or(CodegenError::UnsupportedNode {
                span: node.span,
                node: "unary operand type",
            })?;

        let lowered = match node.node.op.node {
            HirUnaryOp::Neg => {
                if clif_ty.is_float() {
                    ctx.builder.ins().fneg(value)
                } else if clif_ty.is_int() {
                    ctx.builder.ins().ineg(value)
                } else {
                    return Err(CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "unary negation type",
                    });
                }
            }
            HirUnaryOp::Not => match type_info {
                Some(TypeInfo::Primitive(HirPrimitiveType::Bool)) => {
                    let one = ctx.builder.ins().iconst(types::I8, 1);
                    ctx.builder.ins().bxor(value, one)
                }
                _ => {
                    return Err(CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "unary not type",
                    });
                }
            },
        };

        Ok(Some(lowered))
    }
}
