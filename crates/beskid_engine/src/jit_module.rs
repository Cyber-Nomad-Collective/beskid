use std::collections::HashMap;

use cranelift_codegen::ir::{types, AbiParam, ExternalName, Signature, UserExternalName};
use cranelift_codegen::isa::CallConv;
use cranelift_codegen::settings;
use cranelift_jit::{JITBuilder, JITModule};
use cranelift_module::{default_libcall_names, FuncId, FuncOrDataId, Linkage, Module, ModuleError};
use beskid_abi::{
    AbiParamKind, AbiReturnKind, BUILTIN_SPECS, SYM_ALLOC, SYM_ARRAY_NEW, SYM_GC_REGISTER_ROOT,
    SYM_GC_ROOT_HANDLE, SYM_GC_UNREGISTER_ROOT, SYM_GC_UNROOT_HANDLE, SYM_GC_WRITE_BARRIER,
    SYM_INTEROP_DISPATCH_PTR, SYM_INTEROP_DISPATCH_UNIT, SYM_INTEROP_DISPATCH_USIZE,
    SYM_PANIC, SYM_PANIC_STR, SYM_STR_NEW,
};
use beskid_codegen::{emit_string_literals, emit_type_descriptors, CodegenArtifact};
use beskid_runtime::{
    alloc, array_new, gc_register_root, gc_root_handle, gc_unregister_root, gc_unroot_handle,
    gc_write_barrier, panic, panic_str, str_new,
    interop_dispatch_unit, interop_dispatch_ptr, interop_dispatch_usize,
};

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

pub struct BeskidJitModule {
    module: JITModule,
    func_ids: HashMap<String, FuncId>,
    builtins_declared: bool,
}

impl BeskidJitModule {
    pub fn new() -> Result<Self, JitError> {
        let isa_builder = cranelift_native::builder().map_err(|err| JitError::Isa(err.to_string()))?;
        let isa = isa_builder
            .finish(settings::Flags::new(settings::builder()))
            .map_err(|err| JitError::Isa(err.to_string()))?;
        let mut builder = JITBuilder::with_isa(isa, default_libcall_names());
        builder.symbol(SYM_ALLOC, alloc as *const u8);
        builder.symbol(SYM_STR_NEW, str_new as *const u8);
        builder.symbol(SYM_ARRAY_NEW, array_new as *const u8);
        builder.symbol(SYM_PANIC, panic as *const u8);
        builder.symbol(SYM_PANIC_STR, panic_str as *const u8);
        builder.symbol(SYM_INTEROP_DISPATCH_UNIT, interop_dispatch_unit as *const u8);
        builder.symbol(SYM_INTEROP_DISPATCH_PTR, interop_dispatch_ptr as *const u8);
        builder.symbol(SYM_INTEROP_DISPATCH_USIZE, interop_dispatch_usize as *const u8);
        builder.symbol(SYM_GC_WRITE_BARRIER, gc_write_barrier as *const u8);
        builder.symbol(SYM_GC_ROOT_HANDLE, gc_root_handle as *const u8);
        builder.symbol(SYM_GC_UNROOT_HANDLE, gc_unroot_handle as *const u8);
        builder.symbol(SYM_GC_REGISTER_ROOT, gc_register_root as *const u8);
        builder.symbol(SYM_GC_UNREGISTER_ROOT, gc_unregister_root as *const u8);

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

        emit_string_literals(&mut self.module, artifact)?;
        emit_type_descriptors(&mut self.module, artifact)?;

        let mut ctx = self.module.make_context();
        for function in &artifact.functions {
            let func_id = self
                .func_ids
                .get(&function.name)
                .copied()
                .ok_or_else(|| JitError::MissingFunction(function.name.clone()))?;
            ctx.func = function.function.clone();
            remap_external_testcase_names(&mut ctx, &self.module, &self.func_ids)?;
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

        let call_conv = self.module.isa().default_call_conv();
        for spec in BUILTIN_SPECS {
            let signature = builtin_signature(pointer, call_conv, spec.params, spec.returns);
            let id = self
                .module
                .declare_function(spec.symbol, Linkage::Import, &signature)?;
            self.func_ids.insert(spec.symbol.to_owned(), id);
        }

        Ok(())
    }
}

fn builtin_signature(
    pointer: cranelift_codegen::ir::Type,
    call_conv: CallConv,
    params: &[AbiParamKind],
    returns: AbiReturnKind,
) -> Signature {
    let mut sig = Signature::new(call_conv);
    for param in params {
        let ty = match param {
            AbiParamKind::Ptr => pointer,
            AbiParamKind::I64 => types::I64,
        };
        sig.params.push(AbiParam::new(ty));
    }
    match returns {
        AbiReturnKind::Void | AbiReturnKind::Never => {}
        AbiReturnKind::Ptr => sig.returns.push(AbiParam::new(pointer)),
        AbiReturnKind::I64 => sig.returns.push(AbiParam::new(types::I64)),
        AbiReturnKind::I32 => sig.returns.push(AbiParam::new(types::I32)),
    }
    sig
}

fn remap_external_testcase_names(
    ctx: &mut cranelift_codegen::Context,
    module: &JITModule,
    func_ids: &HashMap<String, FuncId>,
) -> Result<(), JitError> {
    let mut func_remaps = Vec::new();
    for (func_ref, ext_func) in ctx.func.dfg.ext_funcs.iter() {
        let ExternalName::TestCase(name) = &ext_func.name else {
            continue;
        };
        let symbol = String::from_utf8_lossy(name.raw()).to_string();
        func_remaps.push((func_ref, symbol));
    }
    for (func_ref, symbol) in func_remaps {
        let func_id = func_ids
            .get(&symbol)
            .copied()
            .ok_or_else(|| JitError::MissingFunction(symbol.clone()))?;
        let user_ref = ctx.func.declare_imported_user_function(UserExternalName {
            namespace: 0,
            index: func_id.as_u32(),
        });
        ctx.func.dfg.ext_funcs[func_ref].name = ExternalName::user(user_ref);
    }

    let mut data_remaps = Vec::new();
    for (gv, data) in ctx.func.global_values.iter() {
        let cranelift_codegen::ir::GlobalValueData::Symbol { name, .. } = data else {
            continue;
        };
        let ExternalName::TestCase(test_name) = name else {
            continue;
        };
        let symbol = String::from_utf8_lossy(test_name.raw()).to_string();
        data_remaps.push((gv, symbol));
    }
    for (gv, symbol) in data_remaps {
        let id = module
            .get_name(&symbol)
            .ok_or_else(|| JitError::MissingFunction(symbol.clone()))?;
        let FuncOrDataId::Data(data_id) = id else {
            return Err(JitError::MissingFunction(symbol));
        };
        let user_ref = ctx.func.declare_imported_user_function(UserExternalName {
            namespace: 1,
            index: data_id.as_u32(),
        });
        let cranelift_codegen::ir::GlobalValueData::Symbol { name, .. } = &mut ctx.func.global_values[gv] else {
            return Err(JitError::MissingFunction(symbol));
        };
        *name = ExternalName::user(user_ref);
    }
    Ok(())
}
