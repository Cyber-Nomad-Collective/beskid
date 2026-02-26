use std::collections::HashMap;

use cranelift_codegen::ir::{types, AbiParam, ExternalName, Signature, UserExternalName};
use cranelift_codegen::isa::CallConv;
use cranelift_codegen::settings;
use cranelift_jit::{JITBuilder, JITModule};
use cranelift_module::{default_libcall_names, FuncId, FuncOrDataId, Linkage, Module, ModuleError};
use beskid_codegen::{emit_string_literals, emit_type_descriptors, CodegenArtifact};
use beskid_runtime::{
    alloc, array_new, gc_register_root, gc_root_handle, gc_unregister_root, gc_unroot_handle,
    gc_write_barrier, panic, panic_str, str_len, str_new, sys_print, sys_println,
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
        builder.symbol("alloc", alloc as *const u8);
        builder.symbol("str_new", str_new as *const u8);
        builder.symbol("str_len", str_len as *const u8);
        builder.symbol("array_new", array_new as *const u8);
        builder.symbol("panic", panic as *const u8);
        builder.symbol("panic_str", panic_str as *const u8);
        builder.symbol("sys_print", sys_print as *const u8);
        builder.symbol("sys_println", sys_println as *const u8);
        builder.symbol("interop_dispatch_unit", interop_dispatch_unit as *const u8);
        builder.symbol("interop_dispatch_ptr", interop_dispatch_ptr as *const u8);
        builder.symbol("interop_dispatch_usize", interop_dispatch_usize as *const u8);
        builder.symbol("gc_write_barrier", gc_write_barrier as *const u8);
        builder.symbol("gc_root_handle", gc_root_handle as *const u8);
        builder.symbol("gc_unroot_handle", gc_unroot_handle as *const u8);
        builder.symbol("gc_register_root", gc_register_root as *const u8);
        builder.symbol("gc_unregister_root", gc_unregister_root as *const u8);

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

        let alloc_sig = builtin_signature(pointer, &[pointer, pointer], Some(pointer));
        let str_new_sig = builtin_signature(pointer, &[pointer, pointer], Some(pointer));
        let str_len_sig = builtin_signature(pointer, &[pointer], Some(pointer));
        let array_new_sig = builtin_signature(pointer, &[pointer, pointer], Some(pointer));
        let panic_sig = builtin_signature(pointer, &[pointer, pointer], None);
        let panic_str_sig = builtin_signature(pointer, &[pointer], None);
        let sys_print_sig = builtin_signature(pointer, &[pointer], None);
        let write_barrier_sig = builtin_signature(pointer, &[pointer, pointer], None);
        let root_handle_sig = builtin_signature(pointer, &[pointer], Some(types::I64));
        let unroot_handle_sig = builtin_signature(pointer, &[types::I64], None);
        let register_root_sig = builtin_signature(pointer, &[pointer], None);
        let dispatch_unit_sig = builtin_signature(pointer, &[pointer], None);
        let dispatch_ptr_sig = builtin_signature(pointer, &[pointer], Some(pointer));
        let dispatch_usize_sig = builtin_signature(pointer, &[pointer], Some(pointer)); // usize is pointer sized

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
            "str_len".to_string(),
            self.module
                .declare_function("str_len", Linkage::Import, &str_len_sig)?,
        );
        self.func_ids.insert(
            "array_new".to_string(),
            self.module
                .declare_function("array_new", Linkage::Import, &array_new_sig)?,
        );
        self.func_ids.insert(
            "panic".to_string(),
            self.module
                .declare_function("panic", Linkage::Import, &panic_sig)?,
        );
        self.func_ids.insert(
            "panic_str".to_string(),
            self.module
                .declare_function("panic_str", Linkage::Import, &panic_str_sig)?,
        );
        self.func_ids.insert(
            "sys_print".to_string(),
            self.module
                .declare_function("sys_print", Linkage::Import, &sys_print_sig)?,
        );
        self.func_ids.insert(
            "sys_println".to_string(),
            self.module
                .declare_function("sys_println", Linkage::Import, &sys_print_sig)?,
        );
        self.func_ids.insert(
            "gc_write_barrier".to_string(),
            self.module.declare_function(
                "gc_write_barrier",
                Linkage::Import,
                &write_barrier_sig,
            )?,
        );
        self.func_ids.insert(
            "gc_root_handle".to_string(),
            self.module.declare_function(
                "gc_root_handle",
                Linkage::Import,
                &root_handle_sig,
            )?,
        );
        self.func_ids.insert(
            "gc_unroot_handle".to_string(),
            self.module.declare_function(
                "gc_unroot_handle",
                Linkage::Import,
                &unroot_handle_sig,
            )?,
        );
        self.func_ids.insert(
            "gc_register_root".to_string(),
            self.module.declare_function(
                "gc_register_root",
                Linkage::Import,
                &register_root_sig,
            )?,
        );
        self.func_ids.insert(
            "gc_unregister_root".to_string(),
            self.module.declare_function(
                "gc_unregister_root",
                Linkage::Import,
                &register_root_sig,
            )?,
        );
        self.func_ids.insert(
            "interop_dispatch_unit".to_string(),
            self.module.declare_function(
                "interop_dispatch_unit",
                Linkage::Import,
                &dispatch_unit_sig,
            )?,
        );
        self.func_ids.insert(
            "interop_dispatch_ptr".to_string(),
            self.module.declare_function(
                "interop_dispatch_ptr",
                Linkage::Import,
                &dispatch_ptr_sig,
            )?,
        );
        self.func_ids.insert(
            "interop_dispatch_usize".to_string(),
            self.module.declare_function(
                "interop_dispatch_usize",
                Linkage::Import,
                &dispatch_usize_sig,
            )?,
        );

        Ok(())
    }
}

fn builtin_signature(
    pointer: cranelift_codegen::ir::Type,
    params: &[cranelift_codegen::ir::Type],
    returns: Option<cranelift_codegen::ir::Type>,
) -> Signature {
    let mut sig = Signature::new(CallConv::SystemV);
    for param in params {
        let ty = if *param == types::INVALID {
            pointer
        } else {
            *param
        };
        sig.params.push(AbiParam::new(ty));
    }
    if let Some(ret) = returns {
        sig.returns.push(AbiParam::new(ret));
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
