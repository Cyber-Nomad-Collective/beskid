use crate::errors::CodegenError;
use crate::lowering::lowerable::{Lowerable, lower_node};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::{map_type_id_to_clif, pointer_type};
use beskid_analysis::hir::{HirBinaryExpression, HirBinaryOp, HirPrimitiveType};
use beskid_analysis::syntax::Spanned;
use beskid_analysis::types::TypeInfo;
use cranelift_codegen::ir::condcodes::{FloatCC, IntCC};
use cranelift_codegen::ir::{AbiParam, ExternalName, InstBuilder, Signature, Value};
use cranelift_codegen::isa::CallConv;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirBinaryExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, crate::errors::CodegenError> {
        let left = lower_node(&node.node.left, ctx)?.ok_or(CodegenError::UnsupportedNode {
            span: node.node.left.span,
            node: "unit-valued binary operand",
        })?;
        let right = lower_node(&node.node.right, ctx)?.ok_or(CodegenError::UnsupportedNode {
            span: node.node.right.span,
            node: "unit-valued binary operand",
        })?;

        let left_type = ctx
            .type_result
            .expr_types
            .get(&node.node.left.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: node.node.left.span,
            })?;
        let right_type = ctx
            .type_result
            .expr_types
            .get(&node.node.right.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: node.node.right.span,
            })?;
        if left_type != right_type {
            return Err(CodegenError::TypeMismatch {
                span: node.span,
                expected: left_type,
                actual: right_type,
            });
        }
        let operand_type = left_type;
        let operand_info = ctx.type_result.types.get(operand_type);
        let operand_clif_ty = map_type_id_to_clif(ctx.type_result, operand_type).ok_or(
            CodegenError::UnsupportedNode {
                span: node.span,
                node: "binary operand type",
            },
        )?;

        let value = match node.node.op.node {
            HirBinaryOp::Add => {
                if matches!(
                    operand_info,
                    Some(TypeInfo::Primitive(HirPrimitiveType::String))
                ) {
                    return lower_string_concat(node, left, right, ctx);
                }
                if operand_clif_ty.is_float() {
                    ctx.builder.ins().fadd(left, right)
                } else if operand_clif_ty.is_int() {
                    ctx.builder.ins().iadd(left, right)
                } else {
                    return Err(CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "binary add type",
                    });
                }
            }
            HirBinaryOp::Sub => {
                if operand_clif_ty.is_float() {
                    ctx.builder.ins().fsub(left, right)
                } else if operand_clif_ty.is_int() {
                    ctx.builder.ins().isub(left, right)
                } else {
                    return Err(CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "binary sub type",
                    });
                }
            }
            HirBinaryOp::Mul => {
                if operand_clif_ty.is_float() {
                    ctx.builder.ins().fmul(left, right)
                } else if operand_clif_ty.is_int() {
                    ctx.builder.ins().imul(left, right)
                } else {
                    return Err(CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "binary mul type",
                    });
                }
            }
            HirBinaryOp::Div => {
                if operand_clif_ty.is_float() {
                    ctx.builder.ins().fdiv(left, right)
                } else if operand_clif_ty.is_int() {
                    ctx.builder.ins().sdiv(left, right)
                } else {
                    return Err(CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "binary div type",
                    });
                }
            }
            HirBinaryOp::And | HirBinaryOp::Or => {
                let is_bool = matches!(
                    operand_info,
                    Some(TypeInfo::Primitive(HirPrimitiveType::Bool))
                );
                if !is_bool {
                    return Err(CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "binary logical type",
                    });
                }
                match node.node.op.node {
                    HirBinaryOp::And => ctx.builder.ins().band(left, right),
                    HirBinaryOp::Or => ctx.builder.ins().bor(left, right),
                    _ => unreachable!("checked operator"),
                }
            }
            HirBinaryOp::Eq
            | HirBinaryOp::NotEq
            | HirBinaryOp::Lt
            | HirBinaryOp::Lte
            | HirBinaryOp::Gt
            | HirBinaryOp::Gte => {
                let is_bool = matches!(
                    operand_info,
                    Some(TypeInfo::Primitive(HirPrimitiveType::Bool))
                );
                if is_bool && !matches!(node.node.op.node, HirBinaryOp::Eq | HirBinaryOp::NotEq) {
                    return Err(CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "binary comparison type",
                    });
                }

                let cmp = if operand_clif_ty.is_float() {
                    let cond = match node.node.op.node {
                        HirBinaryOp::Eq => FloatCC::Equal,
                        HirBinaryOp::NotEq => FloatCC::NotEqual,
                        HirBinaryOp::Lt => FloatCC::LessThan,
                        HirBinaryOp::Lte => FloatCC::LessThanOrEqual,
                        HirBinaryOp::Gt => FloatCC::GreaterThan,
                        HirBinaryOp::Gte => FloatCC::GreaterThanOrEqual,
                        _ => unreachable!("checked operator"),
                    };
                    ctx.builder.ins().fcmp(cond, left, right)
                } else if operand_clif_ty.is_int() {
                    let cond = match node.node.op.node {
                        HirBinaryOp::Eq => IntCC::Equal,
                        HirBinaryOp::NotEq => IntCC::NotEqual,
                        HirBinaryOp::Lt => IntCC::SignedLessThan,
                        HirBinaryOp::Lte => IntCC::SignedLessThanOrEqual,
                        HirBinaryOp::Gt => IntCC::SignedGreaterThan,
                        HirBinaryOp::Gte => IntCC::SignedGreaterThanOrEqual,
                        _ => unreachable!("checked operator"),
                    };
                    ctx.builder.ins().icmp(cond, left, right)
                } else {
                    return Err(CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "binary comparison type",
                    });
                };
                cmp
            }
        };

        Ok(Some(value))
    }
}

fn lower_string_concat(
    node: &Spanned<HirBinaryExpression>,
    left: Value,
    right: Value,
    ctx: &mut NodeLoweringContext<'_, '_>,
) -> Result<Option<Value>, CodegenError> {
    let mut signature = Signature::new(CallConv::SystemV);
    signature.params.push(AbiParam::new(pointer_type()));
    signature.params.push(AbiParam::new(pointer_type()));
    signature.returns.push(AbiParam::new(pointer_type()));
    let sig_ref = ctx.builder.func.import_signature(signature);
    let func_ref = ctx
        .builder
        .func
        .import_function(cranelift_codegen::ir::ExtFuncData {
            name: ExternalName::testcase("str_concat".to_string()),
            signature: sig_ref,
            colocated: false,
            patchable: false,
        });

    let call = ctx.builder.ins().call(func_ref, &[left, right]);
    let result = *ctx
        .builder
        .inst_results(call)
        .first()
        .ok_or(CodegenError::UnsupportedNode {
            span: node.span,
            node: "string concat result",
        })?;
    Ok(Some(result))
}
