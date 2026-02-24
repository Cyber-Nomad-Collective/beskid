use crate::lowering::cast_intent::validate_cast_intents;
use crate::lowering::context::{CodegenArtifact, CodegenContext, CodegenResult};
use crate::lowering::function::lower_function;
use pecan_analysis::hir::HirProgram;
use pecan_analysis::resolve::Resolution;
use pecan_analysis::syntax::Spanned;
use pecan_analysis::types::{TypeId, TypeInfo, TypeResult};

pub trait Lowerable<Ctx>: Sized {
    type Output;

    fn lower(node: &Spanned<Self>, ctx: &mut Ctx) -> CodegenResult<Self::Output>;
}

pub fn lower_node<T, Ctx>(node: &Spanned<T>, ctx: &mut Ctx) -> CodegenResult<T::Output>
where
    T: Lowerable<Ctx>,
{
    T::lower(node, ctx)
}

pub fn lower_program(
    program: &Spanned<HirProgram>,
    resolution: &Resolution,
    type_result: &TypeResult,
) -> Result<CodegenArtifact, Vec<crate::errors::CodegenError>> {
    let mut errors = validate_cast_intents(type_result);
    let mut ctx = CodegenContext::new();

    let mut index = 0usize;
    loop {
        let type_id = TypeId(index);
        let Some(info) = type_result.types.get(type_id) else {
            break;
        };
        if matches!(info, TypeInfo::Named(_)) {
            let _ = ctx.type_descriptor(type_result, type_id);
        }
        index += 1;
    }

    for item in &program.node.items {
        if let pecan_analysis::hir::HirItem::FunctionDefinition(def) = &item.node {
            if let Err(error) = lower_function(def, resolution, type_result, &mut ctx) {
                errors.push(error);
            }
        }
    }

    if errors.is_empty() {
        Ok(CodegenArtifact {
            functions: ctx.lowered_functions,
            type_descriptors: ctx.type_descriptors,
            string_literals: ctx.string_literals,
        })
    } else {
        Err(errors)
    }
}
