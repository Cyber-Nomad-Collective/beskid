use std::collections::HashMap;

use cranelift_codegen::ir::{AbiParam, Signature};
use cranelift_codegen::isa::CallConv;
use cranelift_codegen::settings;
use cranelift_jit::{JITBuilder, JITModule};
use cranelift_module::{default_libcall_names, FuncId, Linkage, Module, ModuleError};
use pecan_codegen::{emit_type_descriptors, CodegenArtifact};
use pecan_runtime::{alloc, gc_write_barrier, str_new};

#[derive(Debug)]
pub enum JitError {
    Isa(String),
    Module(ModuleError),
    MissingFunction(String),
}

impl From<ModuleError> for JitError {
    fn from(error: ModuleError) -> Self {
        Self::Module(error)
    }
}

pub struct PecanJitModule {
    module: JITModule,
    func_ids: HashMap<String, FuncId>,
    builtins_declared: bool,
}

impl PecanJitModule {
    pub fn new() -> Result<Self, JitError> {
        let isa_builder = cranelift_native::builder().map_err(|err| JitError::Isa(err.to_string()))?;
        let isa = isa_builder
            .finish(settings::Flags::new(settings::builder()))
            .map_err(|err| JitError::Isa(err.to_string()))?;
        let mut builder = JITBuilder::with_isa(isa, default_libcall_names());
        builder.symbol("alloc", alloc as *const u8);
        builder.symbol("str_new", str_new as *const u8);
        builder.symbol("gc_write_barrier", gc_write_barrier as *const u8);
        let module = JITModule::new(builder);
        Ok(Self {
            module,
            func_ids: HashMap::new(),
            builtins_declared: false,
        })
    }

    pub fn compile(&mut self, artifact: &CodegenArtifact) -> Result<(), JitError> {
        if !self.builtins_declared {
            self.declare_builtins()?;
            self.builtins_declared = true;
        }

        for function in &artifact.functions {
            let func_id = self
                .module
                .declare_function(&function.name, Linkage::Local, &function.function.signature)?;
            self.func_ids.insert(function.name.clone(), func_id);
        }

        emit_type_descriptors(&mut self.module, artifact)?;

        let mut ctx = self.module.make_context();
        for function in &artifact.functions {
            let func_id = self
                .func_ids
                .get(&function.name)
                .copied()
                .ok_or_else(|| JitError::MissingFunction(function.name.clone()))?;
            ctx.func = function.function.clone();
            self.module.define_function(func_id, &mut ctx)?;
            self.module.clear_context(&mut ctx);
        }

        self.module.finalize_definitions()?;
        Ok(())
    }

    pub fn get_func_id(&self, name: &str) -> Option<FuncId> {
        self.func_ids.get(name).copied()
    }

    pub unsafe fn get_finalized_function_ptr(&mut self, func_id: FuncId) -> *const u8 {
        self.module.get_finalized_function(func_id)
    }

    pub fn module(&mut self) -> &mut JITModule {
        &mut self.module
    }

    fn declare_builtins(&mut self) -> Result<(), JitError> {
        let pointer = self.module.isa().pointer_type();

        let alloc_sig = builtin_signature(pointer, 2, true);
        let str_new_sig = builtin_signature(pointer, 2, true);
        let write_barrier_sig = builtin_signature(pointer, 2, false);

        self.func_ids.insert(
            "alloc".to_string(),
            self.module
                .declare_function("alloc", Linkage::Import, &alloc_sig)?,
        );
        self.func_ids.insert(
            "str_new".to_string(),
            self.module
                .declare_function("str_new", Linkage::Import, &str_new_sig)?,
        );
        self.func_ids.insert(
            "gc_write_barrier".to_string(),
            self.module.declare_function(
                "gc_write_barrier",
                Linkage::Import,
                &write_barrier_sig,
            )?,
        );

        Ok(())
    }
}

fn builtin_signature(pointer: cranelift_codegen::ir::Type, params: usize, returns: bool) -> Signature {
    let mut sig = Signature::new(CallConv::SystemV);
    for _ in 0..params {
        sig.params.push(AbiParam::new(pointer));
    }
    if returns {
        sig.returns.push(AbiParam::new(pointer));
    }
    sig
}
