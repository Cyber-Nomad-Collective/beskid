use crate::lowering::context::CodegenContext;
use crate::lowering::function::FunctionLoweringState;
use beskid_analysis::hir::HirFunctionDefinition;
use beskid_analysis::resolve::ItemId;
use beskid_analysis::resolve::Resolution;
use beskid_analysis::syntax::Spanned;
use beskid_analysis::types::{TypeId, TypeResult};
use cranelift_frontend::FunctionBuilder;
use std::collections::HashMap;

pub(crate) struct NodeLoweringContext<'a, 'b> {
    pub(crate) resolution: &'a Resolution,
    pub(crate) type_result: &'a TypeResult,
    pub(crate) codegen: &'a mut CodegenContext,
    pub(crate) function_defs: &'a HashMap<ItemId, &'a Spanned<HirFunctionDefinition>>,
    pub(crate) builder: &'a mut FunctionBuilder<'b>,
    pub(crate) state: &'a mut FunctionLoweringState,
    pub(crate) expected_return_type: Option<TypeId>,
}
