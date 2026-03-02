use crate::errors::CodegenError;
use crate::lowering::cast_intent::ensure_type_compatibility;
use crate::lowering::function::{lower_function_with_name, mangle_function_name};
use crate::lowering::lowerable::{Lowerable, lower_node};
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::{map_type_id_to_clif, pointer_type};
use beskid_analysis::builtins::{BuiltinType, builtin_specs};
use beskid_analysis::hir::{
    HirCallExpression, HirExpressionNode, HirLambdaExpression, HirPrimitiveType,
};
use beskid_analysis::resolve::ResolvedValue;
use beskid_analysis::syntax::Spanned;
use beskid_analysis::types::{TypeId, TypeInfo};
use cranelift_codegen::ir::{
    AbiParam, ExtFuncData, ExternalName, Function, InstBuilder, Signature, Value, types,
};
use cranelift_codegen::isa::CallConv;
use cranelift_codegen::settings;
use cranelift_codegen::verify_function;
use cranelift_frontend::{FunctionBuilder, FunctionBuilderContext, Variable};
use std::collections::HashMap;

fn lambda_signature_type_ids(
    lambda: &Spanned<HirLambdaExpression>,
    ctx: &NodeLoweringContext<'_, '_>,
) -> Result<(Vec<TypeId>, TypeId), CodegenError> {
    let mut params = Vec::with_capacity(lambda.node.parameters.len());
    for parameter in &lambda.node.parameters {
        let local_id = ctx
            .resolution
            .tables
            .locals
            .iter()
            .find(|info| info.span == parameter.node.name.span)
            .map(|info| info.id)
            .ok_or(CodegenError::InvalidLocalBinding {
                span: parameter.node.name.span,
            })?;
        let type_id = ctx.type_result.local_types.get(&local_id).copied().ok_or(
            CodegenError::MissingLocalType {
                span: parameter.node.name.span,
            },
        )?;
        params.push(type_id);
    }

    let return_type = ctx
        .type_result
        .expr_types
        .get(&lambda.node.body.span)
        .copied()
        .ok_or(CodegenError::MissingExpressionType {
            span: lambda.node.body.span,
        })?;

    Ok((params, return_type))
}

fn lambda_signature_from_types(
    params: &[TypeId],
    return_type: TypeId,
    span: beskid_analysis::syntax::SpanInfo,
    ctx: &NodeLoweringContext<'_, '_>,
) -> Result<(Signature, bool), CodegenError> {
    let mut signature = Signature::new(CallConv::SystemV);
    for param in params {
        let clif_ty = map_type_id_to_clif(ctx.type_result, *param).ok_or(CodegenError::UnsupportedNode {
            span,
            node: "lambda parameter type",
        })?;
        signature.params.push(AbiParam::new(clif_ty));
    }
    let returns_value = !matches!(
        ctx.type_result.types.get(return_type),
        Some(TypeInfo::Primitive(HirPrimitiveType::Unit))
    );
    if returns_value {
        let clif_ty = map_type_id_to_clif(ctx.type_result, return_type).ok_or(CodegenError::UnsupportedNode {
            span,
            node: "lambda return type",
        })?;
        signature.returns.push(AbiParam::new(clif_ty));
    }
    Ok((signature, returns_value))
}

fn lower_lambda_to_symbol(
    lambda: &Spanned<HirLambdaExpression>,
    ctx: &mut NodeLoweringContext<'_, '_>,
) -> Result<String, CodegenError> {
    let lambda_key = lambda as *const Spanned<HirLambdaExpression>;
    if let Some(existing) = ctx.state.emitted_lambda_symbols.get(&lambda_key) {
        return Ok(existing.clone());
    }

    let (param_types, return_type) = lambda_signature_type_ids(lambda, ctx)?;
    let (signature, returns_value) =
        lambda_signature_from_types(&param_types, return_type, lambda.span, ctx)?;

    let name = format!("__beskid_lambda_{}", ctx.codegen.functions_emitted + ctx.codegen.lowered_functions.len());

    let mut function = Function::new();
    function.signature = signature.clone();
    let mut fb_ctx = FunctionBuilderContext::new();
    let mut builder = FunctionBuilder::new(&mut function, &mut fb_ctx);

    let entry = builder.create_block();
    builder.append_block_params_for_function_params(entry);
    builder.switch_to_block(entry);
    builder.seal_block(entry);

    let mut state = crate::lowering::function::FunctionLoweringState::default();
    let param_values = builder.block_params(entry).to_vec();
    for (parameter, value) in lambda.node.parameters.iter().zip(param_values.into_iter()) {
        let local_id = ctx
            .resolution
            .tables
            .locals
            .iter()
            .find(|info| info.span == parameter.node.name.span)
            .map(|info| info.id)
            .ok_or(CodegenError::InvalidLocalBinding {
                span: parameter.node.name.span,
            })?;
        let type_id = ctx.type_result.local_types.get(&local_id).copied().ok_or(
            CodegenError::MissingLocalType {
                span: parameter.node.name.span,
            },
        )?;
        let clif_ty = map_type_id_to_clif(ctx.type_result, type_id).ok_or(CodegenError::UnsupportedNode {
            span: parameter.node.name.span,
            node: "lambda parameter type",
        })?;
        let var = builder.declare_var(clif_ty);
        builder.def_var(var, value);
        state.locals.insert(local_id, var);
    }

    let mut lambda_ctx = NodeLoweringContext {
        resolution: ctx.resolution,
        type_result: ctx.type_result,
        codegen: ctx.codegen,
        function_defs: ctx.function_defs,
        builder: &mut builder,
        state: &mut state,
        expected_return_type: Some(return_type),
    };

    let lowered = lower_node(&lambda.node.body, &mut lambda_ctx)?;
    if !lambda_ctx.state.return_emitted {
        if returns_value {
            let value = lowered.ok_or(CodegenError::UnsupportedNode {
                span: lambda.node.body.span,
                node: "unit-valued lambda body",
            })?;
            lambda_ctx.builder.ins().return_(&[value]);
        } else {
            lambda_ctx.builder.ins().return_(&[]);
        }
    }

    drop(lambda_ctx);
    builder.finalize();

    let flags = settings::Flags::new(settings::builder());
    if let Err(err) = verify_function(&function, &flags) {
        return Err(CodegenError::VerificationFailed {
            function: name.clone(),
            message: err.to_string(),
        });
    }

    ctx.codegen.functions_emitted += 1;
    ctx.codegen.lowered_functions.push(crate::lowering::context::LoweredFunction {
        name: name.clone(),
        function,
    });
    ctx.state
        .emitted_lambda_symbols
        .insert(lambda_key, name.clone());
    Ok(name)
}

pub(crate) fn lower_lambda_function_value(
    lambda: &Spanned<HirLambdaExpression>,
    span: beskid_analysis::syntax::SpanInfo,
    ctx: &mut NodeLoweringContext<'_, '_>,
) -> Result<Value, CodegenError> {
    let (param_types, return_type) = lambda_signature_type_ids(lambda, ctx)?;
    let (signature, _) = lambda_signature_from_types(&param_types, return_type, span, ctx)?;
    let name = lower_lambda_to_symbol(lambda, ctx)?;

    let sig_ref = ctx.builder.func.import_signature(signature);
    let func_ref = ctx.builder.func.import_function(ExtFuncData {
        name: ExternalName::testcase(name),
        signature: sig_ref,
        colocated: true,
        patchable: false,
    });

    let _ = span;
    Ok(ctx.builder.ins().func_addr(pointer_type(), func_ref))
}

fn lower_lambda_function_value_checked(
    lambda: &Spanned<HirLambdaExpression>,
    span: beskid_analysis::syntax::SpanInfo,
    ctx: &mut NodeLoweringContext<'_, '_>,
) -> Result<Value, CodegenError> {
    match lower_lambda_function_value(lambda, span, ctx) {
        Ok(value) => Ok(value),
        Err(CodegenError::InvalidLocalBinding { .. }) => {
            Err(CodegenError::UnsupportedFeature(
                "capturing lambda escape requires closure environment fat pointer",
            ))
        }
        Err(err) => Err(err),
    }
}

fn lower_function_typed_argument(
    arg_expr: &Spanned<HirExpressionNode>,
    expected_type: TypeId,
    ctx: &mut NodeLoweringContext<'_, '_>,
) -> Result<Option<Value>, CodegenError> {
    if !matches!(
        ctx.type_result.types.get(expected_type),
        Some(TypeInfo::Function { .. })
    ) {
        return Ok(None);
    }

    match &arg_expr.node {
        HirExpressionNode::LambdaExpression(lambda) => {
            Ok(Some(lower_lambda_function_value_checked(
                lambda,
                arg_expr.span,
                ctx,
            )?))
        }
        HirExpressionNode::GroupedExpression(grouped) => {
            lower_function_typed_argument(&grouped.node.expr, expected_type, ctx)
        }
        HirExpressionNode::PathExpression(path_expr) => {
            match ctx
                .resolution
                .tables
                .resolved_values
                .get(&path_expr.node.path.span)
            {
                Some(ResolvedValue::Local(local_id)) => {
                    if let Some(lambda_ptr) = ctx.state.local_lambdas.get(local_id).copied() {
                        // SAFETY: pointer originates from immutable HIR nodes owned by lowering context.
                        let lambda = unsafe { lambda_ptr.as_ref() }.ok_or(CodegenError::UnsupportedNode {
                            span: arg_expr.span,
                            node: "dangling lambda binding",
                        })?;
                        Ok(Some(lower_lambda_function_value_checked(
                            lambda,
                            arg_expr.span,
                            ctx,
                        )?))
                    } else {
                        Ok(None)
                    }
                }
                _ => Ok(None),
            }
        }
        _ => Ok(None),
    }
}

fn lower_indirect_function_call(
    node: &Spanned<HirCallExpression>,
    local_id: beskid_analysis::resolve::LocalId,
    ctx: &mut NodeLoweringContext<'_, '_>,
) -> Result<Option<Value>, CodegenError> {
    let callee_type = ctx
        .type_result
        .local_types
        .get(&local_id)
        .copied()
        .ok_or(CodegenError::MissingLocalType {
            span: node.node.callee.span,
        })?;

    let TypeInfo::Function {
        params,
        return_type,
    } = ctx
        .type_result
        .types
        .get(callee_type)
        .cloned()
        .ok_or(CodegenError::MissingLocalType {
            span: node.node.callee.span,
        })?
    else {
        return Err(CodegenError::UnsupportedNode {
            span: node.node.callee.span,
            node: "non-function local call target",
        });
    };

    if params.len() != node.node.args.len() {
        return Err(CodegenError::UnsupportedNode {
            span: node.span,
            node: "call arity mismatch",
        });
    }

    let callee_var = ctx
        .state
        .locals
        .get(&local_id)
        .copied()
        .ok_or(CodegenError::InvalidLocalBinding {
            span: node.node.callee.span,
        })?;
    let callee_ptr = ctx.builder.use_var(callee_var);

    lower_indirect_function_call_with_signature(node, callee_ptr, &params, return_type, ctx)
}

fn lower_indirect_function_call_with_signature(
    node: &Spanned<HirCallExpression>,
    callee_ptr: Value,
    params: &[TypeId],
    return_type: TypeId,
    ctx: &mut NodeLoweringContext<'_, '_>,
) -> Result<Option<Value>, CodegenError> {
    if params.len() != node.node.args.len() {
        return Err(CodegenError::UnsupportedNode {
            span: node.span,
            node: "call arity mismatch",
        });
    }

    let mut args = Vec::with_capacity(node.node.args.len());
    for (arg, expected) in node.node.args.iter().zip(params.iter()) {
        let value = if let Some(fn_value) = lower_function_typed_argument(arg, *expected, ctx)? {
            fn_value
        } else {
            let lowered = lower_node(arg, ctx)?.ok_or(CodegenError::UnsupportedNode {
                span: arg.span,
                node: "unit-valued call argument",
            })?;
            let actual = ctx
                .type_result
                .expr_types
                .get(&arg.span)
                .copied()
                .ok_or(CodegenError::MissingExpressionType { span: arg.span })?;
            ensure_type_compatibility(
                arg.span,
                *expected,
                actual,
                ctx.type_result,
                ctx.builder,
                lowered,
            )?
        };
        args.push(value);
    }

    let (signature_ir, returns_value) =
        lambda_signature_from_types(&params, return_type, node.span, ctx)?;

    let sig_ref = ctx.builder.func.import_signature(signature_ir);
    let call = ctx.builder.ins().call_indirect(sig_ref, callee_ptr, &args);
    if !returns_value {
        return Ok(None);
    }
    let value = *ctx
        .builder
        .inst_results(call)
        .first()
        .ok_or(CodegenError::UnsupportedNode {
            span: node.span,
            node: "call result",
        })?;
    Ok(Some(value))
}

fn lower_local_lambda_call(
    node: &Spanned<HirCallExpression>,
    lambda: &Spanned<HirLambdaExpression>,
    ctx: &mut NodeLoweringContext<'_, '_>,
) -> Result<Option<Value>, CodegenError> {
    if lambda.node.parameters.len() != node.node.args.len() {
        return Err(CodegenError::UnsupportedNode {
            span: node.span,
            node: "lambda call arity mismatch",
        });
    }

    let mut previous_bindings: Vec<(beskid_analysis::resolve::LocalId, Option<Variable>)> =
        Vec::with_capacity(lambda.node.parameters.len());
    let mut previous_lambda_bindings: Vec<(
        beskid_analysis::resolve::LocalId,
        Option<*const Spanned<HirLambdaExpression>>,
    )> = Vec::with_capacity(lambda.node.parameters.len());

    for (parameter, arg_expr) in lambda.node.parameters.iter().zip(node.node.args.iter()) {
        let local_id = ctx
            .resolution
            .tables
            .locals
            .iter()
            .find(|info| info.span == parameter.node.name.span)
            .map(|info| info.id)
            .ok_or(CodegenError::InvalidLocalBinding {
                span: parameter.node.name.span,
            })?;

        let expected_type = ctx.type_result.local_types.get(&local_id).copied().ok_or(
            CodegenError::MissingLocalType {
                span: parameter.node.name.span,
            },
        )?;

        let expected_is_function = matches!(
            ctx.type_result.types.get(expected_type),
            Some(TypeInfo::Function { .. })
        );
        if expected_is_function {
            let lambda_binding = match &arg_expr.node {
                HirExpressionNode::PathExpression(path_expr) => {
                    match ctx
                        .resolution
                        .tables
                        .resolved_values
                        .get(&path_expr.node.path.span)
                    {
                        Some(ResolvedValue::Local(arg_local_id)) => {
                            ctx.state.local_lambdas.get(arg_local_id).copied()
                        }
                        _ => None,
                    }
                }
                HirExpressionNode::LambdaExpression(arg_lambda) => {
                    Some(arg_lambda as *const Spanned<_>)
                }
                HirExpressionNode::GroupedExpression(grouped) => match &grouped.node.expr.node {
                    HirExpressionNode::LambdaExpression(arg_lambda) => {
                        Some(arg_lambda as *const Spanned<_>)
                    }
                    HirExpressionNode::PathExpression(path_expr) => {
                        match ctx
                            .resolution
                            .tables
                            .resolved_values
                            .get(&path_expr.node.path.span)
                        {
                            Some(ResolvedValue::Local(arg_local_id)) => {
                                ctx.state.local_lambdas.get(arg_local_id).copied()
                            }
                            _ => None,
                        }
                    }
                    _ => None,
                },
                _ => None,
            };

            if let Some(lambda_binding) = lambda_binding {
                let previous = ctx.state.local_lambdas.insert(local_id, lambda_binding);
                previous_lambda_bindings.push((local_id, previous));
                continue;
            }
        }

        let arg_value = lower_node(arg_expr, ctx)?.ok_or(CodegenError::UnsupportedNode {
            span: arg_expr.span,
            node: "unit-valued lambda argument",
        })?;
        let actual_type = ctx
            .type_result
            .expr_types
            .get(&arg_expr.span)
            .copied()
            .ok_or(CodegenError::MissingExpressionType {
                span: arg_expr.span,
            })?;
        let arg_value = ensure_type_compatibility(
            arg_expr.span,
            expected_type,
            actual_type,
            ctx.type_result,
            ctx.builder,
            arg_value,
        )?;

        let clif_ty = map_type_id_to_clif(ctx.type_result, expected_type).ok_or(
            CodegenError::UnsupportedNode {
                span: parameter.node.name.span,
                node: "lambda parameter type",
            },
        )?;

        let var = ctx.builder.declare_var(clif_ty);
        ctx.builder.def_var(var, arg_value);

        let previous = ctx.state.locals.insert(local_id, var);
        previous_bindings.push((local_id, previous));
    }

    let result = lower_node(&lambda.node.body, ctx);

    for (local_id, previous) in previous_bindings {
        if let Some(var) = previous {
            ctx.state.locals.insert(local_id, var);
        } else {
            ctx.state.locals.remove(&local_id);
        }
    }
    for (local_id, previous) in previous_lambda_bindings {
        if let Some(lambda_ptr) = previous {
            ctx.state.local_lambdas.insert(local_id, lambda_ptr);
        } else {
            ctx.state.local_lambdas.remove(&local_id);
        }
    }

    result
}

impl Lowerable<NodeLoweringContext<'_, '_>> for HirCallExpression {
    type Output = Option<Value>;

    fn lower(
        node: &Spanned<Self>,
        ctx: &mut NodeLoweringContext<'_, '_>,
    ) -> Result<Self::Output, CodegenError> {
        fn lambda_from_callee<'a>(
            callee: &'a Spanned<HirExpressionNode>,
            ctx: &NodeLoweringContext<'_, '_>,
        ) -> Result<Option<&'a Spanned<HirLambdaExpression>>, CodegenError> {
            match &callee.node {
                HirExpressionNode::LambdaExpression(lambda) => Ok(Some(lambda)),
                HirExpressionNode::GroupedExpression(grouped) => {
                    lambda_from_callee(&grouped.node.expr, ctx)
                }
                HirExpressionNode::PathExpression(path_expr) => {
                    let resolved = ctx
                        .resolution
                        .tables
                        .resolved_values
                        .get(&path_expr.node.path.span)
                        .ok_or(CodegenError::MissingResolvedValue {
                            span: path_expr.node.path.span,
                        })?;
                    let ResolvedValue::Local(local_id) = resolved else {
                        return Ok(None);
                    };
                    let Some(lambda_ptr) = ctx.state.local_lambdas.get(local_id).copied() else {
                        return Ok(None);
                    };
                    // SAFETY: pointer originates from an immutable borrow of HIR owned by the lowering context.
                    let lambda = unsafe { lambda_ptr.as_ref() }.ok_or(CodegenError::UnsupportedNode {
                        span: path_expr.node.path.span,
                        node: "dangling lambda binding",
                    })?;
                    Ok(Some(lambda))
                }
                _ => Ok(None),
            }
        }

        if let Some(lambda) = lambda_from_callee(&node.node.callee, ctx)? {
            return lower_local_lambda_call(node, lambda, ctx);
        }

        if let Some(callee_type_id) = ctx.type_result.expr_types.get(&node.node.callee.span).copied()
            && let Some(TypeInfo::Function {
                params,
                return_type,
            }) = ctx.type_result.types.get(callee_type_id).cloned()
        {
            let callee_is_item_path = if let HirExpressionNode::PathExpression(path_expr) =
                &node.node.callee.node
            {
                matches!(
                    ctx.resolution
                        .tables
                        .resolved_values
                        .get(&path_expr.node.path.span),
                    Some(ResolvedValue::Item(_))
                )
            } else {
                false
            };

            if !callee_is_item_path {
                let callee_value = lower_node(&node.node.callee, ctx)?.ok_or(
                    CodegenError::UnsupportedNode {
                        span: node.node.callee.span,
                        node: "unit-valued function callee",
                    },
                )?;
                return lower_indirect_function_call_with_signature(
                    node,
                    callee_value,
                    &params,
                    return_type,
                    ctx,
                );
            }
        }

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

        let item_id = match resolved {
            ResolvedValue::Item(item_id) => *item_id,
            ResolvedValue::Local(local_id) => {
                let local_type = ctx.type_result.local_types.get(local_id).copied();
                let local_is_function = local_type
                    .and_then(|type_id| ctx.type_result.types.get(type_id))
                    .is_some_and(|info| matches!(info, TypeInfo::Function { .. }));
                if local_is_function {
                    return lower_indirect_function_call(node, *local_id, ctx);
                }
                return Err(CodegenError::UnsupportedNode {
                    span: path_expr.node.path.span,
                    node: "non-item call target",
                });
            }
        };

        let mut generic_args: Vec<TypeId> = Vec::new();
        if let Some(last_segment) = path_expr.node.path.node.segments.last() {
            for arg in &last_segment.node.type_args {
                let type_id =
                    crate::lowering::types::type_id_for_type(ctx.resolution, ctx.type_result, arg)
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
            .get(&item_id)
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
            .get(&item_id)
            .ok_or(CodegenError::MissingSymbol("function signature"))?;
        let builtin_param_kinds = ctx
            .resolution
            .builtin_items
            .get(&item_id)
            .and_then(|index| builtin_specs().get(*index))
            .map(|spec| spec.params.to_vec());

        let mut mapping = HashMap::new();
        if expected_generics > 0
            && let Some(names) = ctx.type_result.generic_items.get(&item_id)
        {
            for (name, arg) in names.iter().zip(generic_args.iter()) {
                mapping.insert(name.clone(), *arg);
            }
        }

        let substitute_type_id = |type_id: TypeId| -> TypeId {
            match ctx.type_result.types.get(type_id) {
                Some(TypeInfo::GenericParam(name)) => mapping.get(name).copied().unwrap_or(type_id),
                Some(TypeInfo::Applied { .. }) | Some(TypeInfo::Function { .. }) => type_id,
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
                    let expected = substituted_params.get(typed_index).ok_or(
                        CodegenError::UnsupportedNode {
                            span: arg.span,
                            node: "typed builtin parameter mismatch",
                        },
                    )?;
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
                let value = if let Some(fn_value) = lower_function_typed_argument(arg, *expected, ctx)? {
                    fn_value
                } else {
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
                    ensure_type_compatibility(
                        arg.span,
                        *expected,
                        actual,
                        ctx.type_result,
                        ctx.builder,
                        value,
                    )?
                };
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
                    let _ = substituted_params.get(typed_index).ok_or(
                        CodegenError::UnsupportedNode {
                            span: node.span,
                            node: "typed builtin parameter mismatch",
                        },
                    )?;
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
        let returns_value = !matches!(
            return_info,
            Some(TypeInfo::Primitive(HirPrimitiveType::Unit))
        );
        if returns_value {
            let clif_ty = map_type_id_to_clif(ctx.type_result, substituted_return).ok_or(
                CodegenError::UnsupportedNode {
                    span: node.span,
                    node: "call return type",
                },
            )?;
            signature_ir.returns.push(AbiParam::new(clif_ty));
        }

        let is_builtin = ctx.resolution.builtin_items.get(&item_id).is_some();
        let name = if let Some(index) = ctx.resolution.builtin_items.get(&item_id) {
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
                    item: item_id,
                    args: generic_args.clone(),
                };
                if let Some(existing) = ctx.codegen.monomorphized_functions.get(&key) {
                    existing.clone()
                } else {
                    let def = ctx
                        .function_defs
                        .get(&item_id)
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
        let value = *results.get(0).ok_or(CodegenError::UnsupportedNode {
            span: node.span,
            node: "call result",
        })?;
        Ok(Some(value))
    }
}
