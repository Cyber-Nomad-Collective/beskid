use crate::errors::CodegenError;
use crate::lowering::cast_intent::ensure_type_compatibility;
use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::map_type_id_to_clif;
use cranelift_codegen::ir::{AbiParam, ExternalName, ExtFuncData, InstBuilder, Signature, Value};
use cranelift_codegen::isa::CallConv;
use pecan_analysis::hir::{HirCallExpression, HirExpressionNode, HirPrimitiveType};
use pecan_analysis::resolve::ResolvedValue;
use pecan_analysis::syntax::Spanned;
use pecan_analysis::types::TypeInfo;

impl Lowerable<NodeLoweringContext<'_, '_>> for HirCallExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        let HirExpressionNode::PathExpression(path_expr) = &node.node.callee.node else {
            return Err(CodegenError::UnsupportedNode {
                span: node.node.callee.span,
                node: "non-path call callee",
            });
        };
        if path_expr.node.path.node.segments.len() != 1 {
            return Err(CodegenError::UnsupportedNode {
                span: node.node.callee.span,
                node: "multi-segment call path",
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
        let ResolvedValue::Item(item_id) = resolved else {
            return Err(CodegenError::UnsupportedNode {
                span: path_expr.node.path.span,
                node: "non-item call target",
            });
        };

        let signature = ctx
            .type_result
            .function_signatures
            .get(item_id)
            .ok_or(CodegenError::MissingSymbol("function signature"))?;

        if signature.params.len() != node.node.args.len() {
            return Err(CodegenError::UnsupportedNode {
                span: node.span,
                node: "call arity mismatch",
            });
        }

        let mut args = Vec::with_capacity(node.node.args.len());
        for (arg, expected) in node.node.args.iter().zip(signature.params.iter()) {
            let value = lower_node(arg, ctx)?.ok_or(CodegenError::UnsupportedNode {
                span: arg.span,
                node: "unit-valued call argument",
            })?;
            let actual = ctx
                .type_result
                .expr_types
                .get(&arg.span)
                .copied()
                .ok_or(CodegenError::MissingExpressionType { span: arg.span })?;
            ensure_type_compatibility(arg.span, *expected, actual, ctx.type_result)?;
            args.push(value);
        }

        let mut signature_ir = Signature::new(CallConv::SystemV);
        for param in &signature.params {
            let clif_ty = map_type_id_to_clif(ctx.type_result, *param).ok_or(
                CodegenError::UnsupportedNode {
                    span: node.span,
                    node: "call parameter type",
                },
            )?;
            signature_ir.params.push(AbiParam::new(clif_ty));
        }

        let return_info = ctx.type_result.types.get(signature.return_type);
        let returns_value = !matches!(return_info, Some(TypeInfo::Primitive(HirPrimitiveType::Unit)));
        if returns_value {
            let clif_ty = map_type_id_to_clif(ctx.type_result, signature.return_type).ok_or(
                CodegenError::UnsupportedNode {
                    span: node.span,
                    node: "call return type",
                },
            )?;
            signature_ir.returns.push(AbiParam::new(clif_ty));
        }

        let name = ctx
            .resolution
            .items
            .get(item_id.0)
            .ok_or(CodegenError::MissingSymbol("function item"))?
            .name
            .clone();
        let sig_ref = ctx.builder.func.import_signature(signature_ir);
        let func_ref = ctx.builder.func.import_function(ExtFuncData {
            name: ExternalName::testcase(name),
            signature: sig_ref,
            colocated: true,
            patchable: false,
        });

        let call = ctx.builder.ins().call(func_ref, &args);
        if !returns_value {
            return Ok(None);
        }
        let results = ctx.builder.inst_results(call);
        let value = *results
            .get(0)
            .ok_or(CodegenError::UnsupportedNode {
                span: node.span,
                node: "call result",
            })?;
        Ok(Some(value))
    }
}
