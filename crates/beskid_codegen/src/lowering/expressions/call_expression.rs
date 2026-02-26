use crate::errors::CodegenError;
use crate::lowering::cast_intent::ensure_type_compatibility;
use crate::lowering::function::{lower_function_with_name, mangle_function_name};
use crate::lowering::lowerable::{lower_node, Lowerable};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::{map_type_id_to_clif, pointer_type};
use cranelift_codegen::ir::{types, AbiParam, ExternalName, ExtFuncData, InstBuilder, Signature, Value};
use cranelift_codegen::isa::CallConv;
use beskid_analysis::builtins::{builtin_specs, BuiltinType};
use beskid_analysis::hir::{HirCallExpression, HirExpressionNode, HirPrimitiveType};
use beskid_analysis::resolve::ResolvedValue;
use beskid_analysis::syntax::Spanned;
use beskid_analysis::types::{TypeId, TypeInfo};
use std::collections::HashMap;

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

        let mut generic_args: Vec<TypeId> = Vec::new();
        if let Some(last_segment) = path_expr.node.path.node.segments.last() {
            for arg in &last_segment.node.type_args {
                let type_id = crate::lowering::types::type_id_for_type(
                    ctx.resolution,
                    ctx.type_result,
                    arg,
                )
                .ok_or(CodegenError::UnsupportedNode {
                    span: arg.span,
                    node: "generic type argument",
                })?;
                generic_args.push(type_id);
            }
        }

        let expected_generics = ctx
            .type_result
            .generic_items
            .get(item_id)
            .map(|names| names.len())
            .unwrap_or(0);

        if expected_generics != generic_args.len() {
            return Err(CodegenError::UnsupportedNode {
                span: node.span,
                node: "generic argument mismatch",
            });
        }

        let signature = ctx
            .type_result
            .function_signatures
            .get(item_id)
            .ok_or(CodegenError::MissingSymbol("function signature"))?;
        let builtin_param_kinds = ctx
            .resolution
            .builtin_items
            .get(item_id)
            .and_then(|index| builtin_specs().get(*index))
            .map(|spec| spec.params.to_vec());

        let mut mapping = HashMap::new();
        if expected_generics > 0 {
            if let Some(names) = ctx.type_result.generic_items.get(item_id) {
                for (name, arg) in names.iter().zip(generic_args.iter()) {
                    mapping.insert(name.clone(), *arg);
                }
            }
        }

        let substitute_type_id = |type_id: TypeId| -> TypeId {
            match ctx.type_result.types.get(type_id) {
                Some(TypeInfo::GenericParam(name)) => mapping.get(name).copied().unwrap_or(type_id),
                Some(TypeInfo::Applied { .. }) => type_id,
                _ => type_id,
            }
        };

        let substituted_params: Vec<TypeId> = signature
            .params
            .iter()
            .map(|param| substitute_type_id(*param))
            .collect();
        let substituted_return = substitute_type_id(signature.return_type);

        let expected_arity = builtin_param_kinds
            .as_ref()
            .map(std::vec::Vec::len)
            .unwrap_or(substituted_params.len());

        if expected_arity != node.node.args.len() {
            return Err(CodegenError::UnsupportedNode {
                span: node.span,
                node: "call arity mismatch",
            });
        }

        let mut args = Vec::with_capacity(node.node.args.len());
        if let Some(kinds) = builtin_param_kinds.as_ref() {
            let mut typed_index = 0usize;
            for (arg, kind) in node.node.args.iter().zip(kinds.iter()) {
                let mut value = lower_node(arg, ctx)?.ok_or(CodegenError::UnsupportedNode {
                    span: arg.span,
                    node: "unit-valued call argument",
                })?;
                if !matches!(kind, BuiltinType::Ptr) {
                    let expected = substituted_params.get(typed_index).ok_or(CodegenError::UnsupportedNode {
                        span: arg.span,
                        node: "typed builtin parameter mismatch",
                    })?;
                    let actual = ctx
                        .type_result
                        .expr_types
                        .get(&arg.span)
                        .copied()
                        .ok_or(CodegenError::MissingExpressionType { span: arg.span })?;
                    value = ensure_type_compatibility(
                        arg.span,
                        *expected,
                        actual,
                        ctx.type_result,
                        ctx.builder,
                        value,
                    )?;
                    typed_index += 1;
                }
                args.push(value);
            }
        } else {
            for (arg, expected) in node.node.args.iter().zip(substituted_params.iter()) {
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
                let value = ensure_type_compatibility(
                    arg.span,
                    *expected,
                    actual,
                    ctx.type_result,
                    ctx.builder,
                    value,
                )?;
                args.push(value);
            }
        }

        let mut signature_ir = Signature::new(CallConv::SystemV);
        if let Some(kinds) = builtin_param_kinds.as_ref() {
            let mut typed_index = 0usize;
            for kind in kinds {
                let clif_ty = match kind {
                    BuiltinType::Ptr => pointer_type(),
                    BuiltinType::String => pointer_type(),
                    BuiltinType::Usize | BuiltinType::U64 => types::I64,
                    BuiltinType::Unit | BuiltinType::Never => {
                        return Err(CodegenError::UnsupportedNode {
                            span: node.span,
                            node: "invalid builtin parameter type",
                        });
                    }
                };
                if !matches!(kind, BuiltinType::Ptr) {
                    let _ = substituted_params.get(typed_index).ok_or(CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "typed builtin parameter mismatch",
                    })?;
                    typed_index += 1;
                }
                signature_ir.params.push(AbiParam::new(clif_ty));
            }
        } else {
            for param in &substituted_params {
                let clif_ty = map_type_id_to_clif(ctx.type_result, *param).ok_or(
                    CodegenError::UnsupportedNode {
                        span: node.span,
                        node: "call parameter type",
                    },
                )?;
                signature_ir.params.push(AbiParam::new(clif_ty));
            }
        }

        let return_info = ctx.type_result.types.get(substituted_return);
        let returns_value = !matches!(return_info, Some(TypeInfo::Primitive(HirPrimitiveType::Unit)));
        if returns_value {
            let clif_ty = map_type_id_to_clif(ctx.type_result, substituted_return).ok_or(
                CodegenError::UnsupportedNode {
                    span: node.span,
                    node: "call return type",
                },
            )?;
            signature_ir.returns.push(AbiParam::new(clif_ty));
        }

        let is_builtin = ctx.resolution.builtin_items.get(item_id).is_some();
        let name = if let Some(index) = ctx.resolution.builtin_items.get(item_id) {
            builtin_specs()
                .get(*index)
                .map(|spec| spec.runtime_symbol.to_string())
                .ok_or(CodegenError::MissingSymbol("builtin symbol"))?
        } else {
            let base_name = ctx
                .resolution
                .items
                .get(item_id.0)
                .ok_or(CodegenError::MissingSymbol("function item"))?
                .name
                .clone();
            if generic_args.is_empty() {
                base_name
            } else {
                let key = crate::lowering::context::MonomorphKey {
                    item: *item_id,
                    args: generic_args.clone(),
                };
                if let Some(existing) = ctx.codegen.monomorphized_functions.get(&key) {
                    existing.clone()
                } else {
                    let def = ctx
                        .function_defs
                        .get(item_id)
                        .ok_or(CodegenError::MissingSymbol("function definition"))?;
                    let mangled = mangle_function_name(&base_name, &generic_args);
                    lower_function_with_name(
                        def,
                        ctx.resolution,
                        ctx.type_result,
                        ctx.function_defs,
                        ctx.codegen,
                        Some(mangled.clone()),
                        Some(mapping.clone()),
                    )?;
                    ctx.codegen
                        .monomorphized_functions
                        .insert(key, mangled.clone());
                    mangled
                }
            }
        };
        let sig_ref = ctx.builder.func.import_signature(signature_ir);
        let func_ref = ctx.builder.func.import_function(ExtFuncData {
            name: ExternalName::testcase(name),
            signature: sig_ref,
            colocated: !is_builtin,
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
