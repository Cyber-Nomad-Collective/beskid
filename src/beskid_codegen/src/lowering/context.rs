use crate::errors::CodegenError;
use crate::lowering::descriptor::{TypeDescriptorData, TypeLayout};
use cranelift_codegen::ir::Function;
use beskid_analysis::resolve::ItemId;
use beskid_analysis::types::TypeId;
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
    pub string_literals: HashMap<String, Vec<u8>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct MonomorphKey {
    pub item: ItemId,
    pub args: Vec<TypeId>,
}

#[derive(Default)]
pub struct CodegenContext {
    pub functions_emitted: usize,
    pub lowered_functions: Vec<LoweredFunction>,
    pub type_layouts: HashMap<TypeId, TypeLayout>,
    pub type_descriptors: HashMap<TypeId, TypeDescriptorData>,
    pub string_literals: HashMap<String, Vec<u8>>,
    pub monomorphized_functions: HashMap<MonomorphKey, String>,
    next_string_literal_id: usize,
}

impl CodegenContext {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn type_layout(
        &mut self,
        type_result: &beskid_analysis::types::TypeResult,
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
        type_result: &beskid_analysis::types::TypeResult,
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

    pub fn intern_string_literal(&mut self, bytes: &[u8]) -> String {
        for (symbol, data) in &self.string_literals {
            if data.as_slice() == bytes {
                return symbol.clone();
            }
        }
        let symbol = format!("__beskid_str_lit_{}", self.next_string_literal_id);
        self.next_string_literal_id += 1;
        self.string_literals.insert(symbol.clone(), bytes.to_vec());
        symbol
    }
}
