use anyhow::Result;
use beskid_analysis::hir::HirPrimitiveType;
use beskid_analysis::resolve::ItemKind;
use beskid_analysis::types::TypeInfo;

use crate::Engine;

pub fn run_entrypoint(
    source_path: &std::path::Path,
    source: &str,
    entrypoint: &str,
) -> Result<String> {
    let lowered = beskid_codegen::lower_source(source_path, source, true)?;

    let mut engine = Engine::new();
    engine
        .compile_artifact(&lowered.artifact)
        .map_err(|err| anyhow::anyhow!("JIT compile failed: {err:?}"))?;

    let entrypoint_info = lowered
        .resolution
        .items
        .iter()
        .find(|item| item.name == entrypoint && item.kind == ItemKind::Function)
        .ok_or_else(|| anyhow::anyhow!("Missing entrypoint `{entrypoint}`"))?;

    let signature = lowered
        .typed
        .function_signatures
        .get(&entrypoint_info.id)
        .ok_or_else(|| anyhow::anyhow!("Missing signature for `{entrypoint}`"))?;

    if !signature.params.is_empty() {
        return Err(anyhow::anyhow!(
            "Entrypoint `{entrypoint}` must take no parameters"
        ));
    }

    let return_info = lowered
        .typed
        .types
        .get(signature.return_type)
        .ok_or_else(|| anyhow::anyhow!("Missing return type for `{entrypoint}`"))?;

    let ptr = unsafe { engine.entrypoint_ptr(entrypoint) }
        .map_err(|err| anyhow::anyhow!("Entrypoint lookup failed: {err:?}"))?;
    if ptr.is_null() {
        return Err(anyhow::anyhow!(
            "Entrypoint `{entrypoint}` returned null pointer"
        ));
    }

    let output = engine.with_arena(|_, _| match return_info {
        TypeInfo::Primitive(HirPrimitiveType::Unit) => {
            let main_fn: extern "C" fn() = unsafe { std::mem::transmute(ptr) };
            main_fn();
            "ok".to_owned()
        }
        TypeInfo::Primitive(HirPrimitiveType::String)
        | TypeInfo::Named(_)
        | TypeInfo::GenericParam(_)
        | TypeInfo::Applied { .. } => {
            let main_fn: extern "C" fn() -> u64 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            format!("0x{value:016x}")
        }
        TypeInfo::Primitive(HirPrimitiveType::I64) => {
            let main_fn: extern "C" fn() -> i64 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            value.to_string()
        }
        TypeInfo::Primitive(HirPrimitiveType::I32) => {
            let main_fn: extern "C" fn() -> i32 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            value.to_string()
        }
        TypeInfo::Primitive(HirPrimitiveType::U8) => {
            let main_fn: extern "C" fn() -> u8 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            value.to_string()
        }
        TypeInfo::Primitive(HirPrimitiveType::Bool) => {
            let main_fn: extern "C" fn() -> u8 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn() != 0;
            value.to_string()
        }
        TypeInfo::Primitive(HirPrimitiveType::F64) => {
            let main_fn: extern "C" fn() -> f64 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            value.to_string()
        }
        TypeInfo::Primitive(HirPrimitiveType::Char) => {
            let main_fn: extern "C" fn() -> u32 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            std::char::from_u32(value).unwrap_or('\u{FFFD}').to_string()
        }
    });

    Ok(output)
}
