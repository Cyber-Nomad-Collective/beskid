use std::collections::HashMap;
use std::path::Path;

use beskid_abi::{AbiParamKind, AbiReturnKind, BUILTIN_SPECS};
use beskid_codegen::{emit_string_literals, emit_type_descriptors, CodegenArtifact};
use cranelift_codegen::ir::{types, AbiParam, ExternalName, Signature, UserExternalName};
use cranelift_codegen::isa::CallConv;
use cranelift_codegen::settings;
use cranelift_codegen::settings::Configurable;
use cranelift_module::{
    default_libcall_names, DataId, FuncId, FuncOrDataId, Linkage, Module,
};
use cranelift_object::{ObjectBuilder, ObjectModule};

use crate::error::{AotError, AotResult};

pub struct BeskidObjectModule {
    module: Option<ObjectModule>,
    func_ids: HashMap<String, FuncId>,
    data_ids: HashMap<String, DataId>,
    builtins_declared: bool,
    declared_symbols: Vec<String>,
}

impl BeskidObjectModule {
    pub fn new(target_triple: Option<&str>) -> AotResult<Self> {
        let mut flag_builder = settings::builder();
        flag_builder.set("is_pic", "true").map_err(|err| AotError::IsaInit {
            message: err.to_string(),
        })?;
        let flags = settings::Flags::new(flag_builder);

        let isa_builder = if let Some(triple) = target_triple {
            cranelift_codegen::isa::lookup_by_name(triple).map_err(|err| AotError::IsaInit {
                message: err.to_string(),
            })?
        } else {
            cranelift_native::builder().map_err(|err| AotError::IsaInit {
                message: err.to_string(),
            })?
        };

        let isa = isa_builder.finish(flags).map_err(|err| AotError::IsaInit {
            message: err.to_string(),
        })?;

        let builder = ObjectBuilder::new(isa, "beskid", default_libcall_names()).map_err(
            |err| AotError::ObjectModule {
                message: err.to_string(),
            },
        )?;

        Ok(Self {
            module: Some(ObjectModule::new(builder)),
            func_ids: HashMap::new(),
            data_ids: HashMap::new(),
            builtins_declared: false,
            declared_symbols: Vec::new(),
        })
    }

    pub fn compile_artifact(&mut self, artifact: &CodegenArtifact) -> AotResult<()> {
        let module = self
            .module
            .as_mut()
            .ok_or_else(|| AotError::InvalidRequest {
                message: "object module already finalized".to_owned(),
            })?;

        if !self.builtins_declared {
            declare_builtins(module, &mut self.func_ids)?;
            self.builtins_declared = true;
        }

        for function in &artifact.functions {
            let func_id = module.declare_function(
                &function.name,
                Linkage::Export,
                &function.function.signature,
            )?;
            self.func_ids.insert(function.name.clone(), func_id);
            self.declared_symbols.push(function.name.clone());
        }

        self.data_ids = emit_string_literals(module, artifact)?;
        let descriptor_ids = emit_type_descriptors(module, artifact)?;
        for handles in descriptor_ids.values() {
            let descriptor_name = format!("__data_{}", handles.descriptor.as_u32());
            let offsets_name = format!("__data_{}", handles.offsets.as_u32());
            self.data_ids
                .entry(descriptor_name)
                .or_insert(handles.descriptor);
            self.data_ids.entry(offsets_name).or_insert(handles.offsets);
        }

        let mut ctx = module.make_context();
        for function in &artifact.functions {
            let func_id = self
                .func_ids
                .get(&function.name)
                .copied()
                .ok_or_else(|| AotError::MissingFunction {
                    name: function.name.clone(),
                })?;
            ctx.func = function.function.clone();
            remap_external_names(module, &mut ctx, &self.func_ids)?;
            module.define_function(func_id, &mut ctx)?;
            module.clear_context(&mut ctx);
        }

        Ok(())
    }

    pub fn get_func_id(&self, name: &str) -> Option<FuncId> {
        self.func_ids.get(name).copied()
    }

    pub fn declared_symbols(&self) -> Vec<String> {
        self.declared_symbols.clone()
    }

    pub fn finalize_to_path(mut self, output_object: &Path) -> AotResult<()> {
        let module = self
            .module
            .take()
            .ok_or_else(|| AotError::InvalidRequest {
                message: "object module already finalized".to_owned(),
            })?;
        let product = module.finish();
        let bytes = product.emit().map_err(|err| AotError::ObjectModule {
            message: err.to_string(),
        })?;
        if let Some(parent) = output_object.parent() {
            std::fs::create_dir_all(parent).map_err(|err| AotError::Io {
                path: parent.to_path_buf(),
                message: err.to_string(),
            })?;
        }
        std::fs::write(output_object, bytes).map_err(|err| AotError::Io {
            path: output_object.to_path_buf(),
            message: err.to_string(),
        })
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

fn declare_builtins(
    module: &mut ObjectModule,
    func_ids: &mut HashMap<String, FuncId>,
) -> AotResult<()> {
    let pointer = module.isa().pointer_type();

    let call_conv = module.isa().default_call_conv();
    for spec in BUILTIN_SPECS {
        let sig = builtin_signature(pointer, call_conv, spec.params, spec.returns);
        let id = module.declare_function(spec.symbol, Linkage::Import, &sig)?;
        func_ids.insert(spec.symbol.to_owned(), id);
    }

    Ok(())
}

fn remap_external_names(
    module: &ObjectModule,
    ctx: &mut cranelift_codegen::Context,
    func_ids: &HashMap<String, FuncId>,
) -> AotResult<()> {
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
            .ok_or_else(|| AotError::MissingFunction {
                name: symbol.clone(),
            })?;
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
            .ok_or_else(|| AotError::MissingFunction {
                name: symbol.clone(),
            })?;
        let FuncOrDataId::Data(data_id) = id else {
            return Err(AotError::MissingFunction { name: symbol });
        };
        let user_ref = ctx.func.declare_imported_user_function(UserExternalName {
            namespace: 1,
            index: data_id.as_u32(),
        });
        let cranelift_codegen::ir::GlobalValueData::Symbol { name, .. } =
            &mut ctx.func.global_values[gv]
        else {
            return Err(AotError::InvalidRequest {
                message: "expected symbol global value".to_owned(),
            });
        };
        *name = ExternalName::user(user_ref);
    }

    Ok(())
}
