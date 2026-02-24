use crate::errors::CodegenError;
use crate::lowering::descriptor::{TypeDescriptorData, TypeLayout};
use cranelift_codegen::ir::Function;
use pecan_analysis::types::TypeId;
use std::collections::HashMap;

pub type CodegenResult<T> = Result<T, CodegenError>;

#[derive(Debug, Clone)]
pub struct LoweredFunction {
    pub name: String,
    pub function: Function,
}

#[derive(Debug, Clone, Default)]
pub struct CodegenArtifact {
    pub functions: Vec<LoweredFunction>,
    pub type_descriptors: HashMap<TypeId, TypeDescriptorData>,
}

#[derive(Debug, Default)]
pub struct CodegenContext {
    pub functions_emitted: usize,
    pub lowered_functions: Vec<LoweredFunction>,
    pub type_layouts: HashMap<TypeId, TypeLayout>,
    pub type_descriptors: HashMap<TypeId, TypeDescriptorData>,
}

impl CodegenContext {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn type_layout(
        &mut self,
        type_result: &pecan_analysis::types::TypeResult,
        type_id: TypeId,
    ) -> Option<TypeLayout> {
        crate::lowering::descriptor::get_or_compute_layout(
            &mut self.type_layouts,
            type_result,
            type_id,
        )
    }

    pub fn type_descriptor(
        &mut self,
        type_result: &pecan_analysis::types::TypeResult,
        type_id: TypeId,
    ) -> Option<TypeDescriptorData> {
        if let Some(existing) = self.type_descriptors.get(&type_id) {
            return Some(existing.clone());
        }
        let layout = self.type_layout(type_result, type_id)?;
        let descriptor = crate::lowering::descriptor::build_descriptor(&layout);
        self.type_descriptors.insert(type_id, descriptor.clone());
        Some(descriptor)
    }
}
