use crate::errors::CodegenError;
use crate::lowering::context::{CodegenContext, CodegenResult, LoweredFunction};
use crate::lowering::lowerable::lower_node;
use crate::lowering::node_context::NodeLoweringContext;
use crate::lowering::types::{map_hir_type_to_clif, map_hir_type_to_type_id};
use cranelift_codegen::ir::{AbiParam, Block, Function, InstBuilder, Signature};
use cranelift_codegen::isa::CallConv;
use cranelift_codegen::settings;
use cranelift_codegen::verify_function;
use cranelift_frontend::{FunctionBuilder, FunctionBuilderContext, Variable};
use pecan_analysis::hir::HirFunctionDefinition;
use pecan_analysis::resolve::{LocalId, Resolution};
use pecan_analysis::syntax::Spanned;
use pecan_analysis::types::TypeResult;
use std::collections::HashMap;

pub(crate) fn lower_function(
    def: &Spanned<HirFunctionDefinition>,
    resolution: &Resolution,
    type_result: &TypeResult,
    ctx: &mut CodegenContext,
) -> CodegenResult<()> {
    if !def.node.parameters.is_empty() {
        return Err(CodegenError::UnsupportedNode {
            span: def.span,
            node: "function parameters",
        });
    }

    let mut signature = Signature::new(CallConv::SystemV);
    if let Some(return_type) = &def.node.return_type {
        if let Some(clif_ty) = map_hir_type_to_clif(&return_type.node) {
            signature.returns.push(AbiParam::new(clif_ty));
        }
    }
    let expects_return = signature_has_return(&signature);
    let expected_return_type = def
        .node
        .return_type
        .as_ref()
        .and_then(|ty| map_hir_type_to_type_id(type_result, &ty.node));

    let mut function = Function::new();
    function.signature = signature;

    let mut fb_ctx = FunctionBuilderContext::new();
    let mut builder = FunctionBuilder::new(&mut function, &mut fb_ctx);
    let entry = builder.create_block();
    builder.switch_to_block(entry);
    builder.seal_block(entry);

    let mut state = FunctionLoweringState::default();
    let mut node_ctx = NodeLoweringContext {
        resolution,
        type_result,
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
    ctx.lowered_functions.push(LoweredFunction {
        name: def.node.name.node.name.clone(),
        clif: function.to_string(),
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
