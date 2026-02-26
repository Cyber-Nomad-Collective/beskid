use crate::errors::CodegenError;
use crate::lowering::context::{CodegenContext, CodegenResult, LoweredFunction};
use crate::lowering::lowerable::lower_node;
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::{map_type_id_to_clif, type_id_for_type};
use cranelift_codegen::ir::{AbiParam, Block, Function, InstBuilder, Signature};
use cranelift_codegen::isa::CallConv;
use cranelift_codegen::settings;
use cranelift_codegen::verify_function;
use cranelift_frontend::{FunctionBuilder, FunctionBuilderContext, Variable};
use beskid_analysis::hir::HirFunctionDefinition;
use beskid_analysis::resolve::{ItemId, LocalId, Resolution};
use beskid_analysis::syntax::Spanned;
use beskid_analysis::types::{TypeInfo, TypeResult};
use std::collections::HashMap;

pub(crate) fn lower_function(
    def: &Spanned<HirFunctionDefinition>,
    resolution: &Resolution,
    type_result: &TypeResult,
    function_defs: &HashMap<ItemId, &Spanned<HirFunctionDefinition>>,
    ctx: &mut CodegenContext,
) -> CodegenResult<()> {
    lower_function_with_name(def, resolution, type_result, function_defs, ctx, None, None)
}

pub(crate) fn mangle_function_name(base: &str, args: &[beskid_analysis::types::TypeId]) -> String {
    if args.is_empty() {
        return base.to_string();
    }
    let suffix = args
        .iter()
        .map(|arg| arg.0.to_string())
        .collect::<Vec<_>>()
        .join("_");
    format!("{base}#{suffix}")
}

fn substitute_type_id(
    type_result: &TypeResult,
    type_id: beskid_analysis::types::TypeId,
    mapping: &HashMap<String, beskid_analysis::types::TypeId>,
) -> beskid_analysis::types::TypeId {
    let info = type_result.types.get(type_id).cloned();
    match info {
        Some(TypeInfo::GenericParam(name)) => mapping.get(&name).copied().unwrap_or(type_id),
        Some(TypeInfo::Applied { .. }) => type_id,
        _ => type_id,
    }
}

pub(crate) fn lower_function_with_name(
    def: &Spanned<HirFunctionDefinition>,
    resolution: &Resolution,
    type_result: &TypeResult,
    function_defs: &HashMap<ItemId, &Spanned<HirFunctionDefinition>>,
    ctx: &mut CodegenContext,
    name_override: Option<String>,
    generic_args: Option<HashMap<String, beskid_analysis::types::TypeId>>,
) -> CodegenResult<()> {
    let generic_args = generic_args.unwrap_or_default();
    let substitute = |type_id: beskid_analysis::types::TypeId| -> beskid_analysis::types::TypeId {
        substitute_type_id(type_result, type_id, &generic_args)
    };
    let item_id = resolution
        .items
        .iter()
        .find(|info| info.span == def.span)
        .map(|info| info.id);
    let signature_types = item_id.and_then(|id| type_result.function_signatures.get(&id));
    let mut signature = Signature::new(CallConv::SystemV);
    for (index, param) in def.node.parameters.iter().enumerate() {
        if param.node.modifier.is_some() {
            return Err(CodegenError::UnsupportedNode {
                span: param.span,
                node: "function parameter modifier",
            });
        }
        let type_id = signature_types
            .and_then(|sig| sig.params.get(index).copied())
            .or_else(|| type_id_for_type(resolution, type_result, &param.node.ty))
            .map(substitute)
            .ok_or(CodegenError::UnsupportedNode {
                span: param.span,
                node: "function parameter type",
            })?;
        let clif_ty = map_type_id_to_clif(type_result, type_id).ok_or(CodegenError::UnsupportedNode {
            span: param.span,
            node: "function parameter type",
        })?;
        signature.params.push(AbiParam::new(clif_ty));
    }
    let return_type_id = signature_types
        .map(|sig| sig.return_type)
        .or_else(|| def.node.return_type.as_ref().and_then(|ty| type_id_for_type(resolution, type_result, ty)))
        .map(substitute);
    if let Some(type_id) = return_type_id {
        if let Some(clif_ty) = map_type_id_to_clif(type_result, type_id) {
            signature.returns.push(AbiParam::new(clif_ty));
        }
    }
    let expects_return = signature_has_return(&signature);
    let expected_return_type = return_type_id;

    let mut function = Function::new();
    function.signature = signature;

    let mut fb_ctx = FunctionBuilderContext::new();
    let mut builder = FunctionBuilder::new(&mut function, &mut fb_ctx);
    let entry = builder.create_block();
    builder.append_block_params_for_function_params(entry);
    builder.switch_to_block(entry);
    builder.seal_block(entry);

    let mut state = FunctionLoweringState::default();
    let param_values = builder.block_params(entry).to_vec();
    for (index, (param, value)) in def
        .node
        .parameters
        .iter()
        .zip(param_values.into_iter())
        .enumerate()
    {
        let local_id = resolution
            .tables
            .locals
            .iter()
            .find(|info| info.span == param.node.name.span)
            .map(|info| info.id)
            .ok_or(CodegenError::InvalidLocalBinding {
                span: param.node.name.span,
            })?;
        let type_id = type_result
            .local_types
            .get(&local_id)
            .copied()
            .or_else(|| signature_types.and_then(|sig| sig.params.get(index).copied()))
            .or_else(|| type_id_for_type(resolution, type_result, &param.node.ty))
            .map(substitute)
            .ok_or(CodegenError::MissingLocalType {
                span: param.node.name.span,
            })?;
        let clif_ty = map_type_id_to_clif(type_result, type_id).ok_or(CodegenError::UnsupportedNode {
            span: param.node.name.span,
            node: "function parameter type",
        })?;
        let var = builder.declare_var(clif_ty);
        builder.def_var(var, value);
        state.locals.insert(local_id, var);
    }

    let mut node_ctx = NodeLoweringContext {
        resolution,
        type_result,
        codegen: ctx,
        function_defs,
        builder: &mut builder,
        state: &mut state,
        expected_return_type,
    };

    for statement in &def.node.body.node.statements {
        lower_node(statement, &mut node_ctx)?;
        if node_ctx.state.block_terminated {
            break;
        }
    }

    if !node_ctx.state.return_emitted {
        if expects_return {
            return Err(CodegenError::UnsupportedNode {
                span: def.span,
                node: "implicit non-unit return",
            });
        }
        node_ctx.builder.ins().return_(&[]);
    }

    drop(node_ctx);

    builder.finalize();

    let flags = settings::Flags::new(settings::builder());
    if let Err(err) = verify_function(&function, &flags) {
        return Err(CodegenError::VerificationFailed {
            function: def.node.name.node.name.clone(),
            message: err.to_string(),
        });
    }

    ctx.functions_emitted += 1;
    let function_name = name_override.unwrap_or_else(|| def.node.name.node.name.clone());
    ctx.lowered_functions.push(LoweredFunction {
        name: function_name,
        function,
    });

    Ok(())
}

#[derive(Default)]
pub(crate) struct FunctionLoweringState {
    pub(crate) locals: HashMap<LocalId, Variable>,
    pub(crate) return_emitted: bool,
    pub(crate) block_terminated: bool,
    pub(crate) loop_stack: Vec<LoopControl>,
}

#[derive(Debug, Clone, Copy)]
pub(crate) struct LoopControl {
    pub(crate) continue_block: Block,
    pub(crate) break_block: Block,
}

fn signature_has_return(signature: &Signature) -> bool {
    !signature.returns.is_empty()
}
