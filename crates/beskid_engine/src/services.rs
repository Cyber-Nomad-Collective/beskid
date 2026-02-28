use anyhow::Result;
use beskid_analysis::resolve::ItemKind;

use crate::Engine;
use crate::jit_callable::JitCallable;

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

    let output = engine.with_arena(|_, _| JitCallable::execute_and_format(ptr, return_info));

    Ok(output)
}
