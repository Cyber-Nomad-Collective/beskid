use std::path::PathBuf;

use beskid_codegen::CodegenArtifact;

use crate::error::{AotError, AotResult};
use crate::linker::{LinkRequest, link};
use crate::object_module::BeskidObjectModule;
use crate::runtime::{RuntimeBuildRequest, prepare_runtime};
use crate::target::detect_target;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuildOutputKind {
    Exe,
    StaticLib,
    SharedLib,
    ObjectOnly,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuildProfile {
    Debug,
    Release,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LinkMode {
    Auto,
    PreferStatic,
    PreferDynamic,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RuntimeStrategy {
    BuildOnTheFly,
    UsePrebuilt {
        path: PathBuf,
        abi_version: Option<u32>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExportPolicy {
    PublicOnly,
    Explicit(Vec<String>),
    AllDefined,
}

#[derive(Debug, Clone)]
pub struct AotBuildRequest {
    pub artifact: CodegenArtifact,
    pub output_kind: BuildOutputKind,
    pub output_path: PathBuf,
    pub object_path: Option<PathBuf>,
    pub target_triple: Option<String>,
    pub profile: BuildProfile,
    pub entrypoint: String,
    pub export_policy: ExportPolicy,
    pub link_mode: LinkMode,
    pub runtime: RuntimeStrategy,
    pub verbose_link: bool,
}

#[derive(Debug, Clone)]
pub struct AotBuildResult {
    pub object_path: PathBuf,
    pub final_path: Option<PathBuf>,
    pub exported_symbols: Vec<String>,
    pub linker_invocation: Option<String>,
}

#[derive(Debug, Clone)]
struct ObjectStageResult {
    object_path: PathBuf,
    exported_symbols: Vec<String>,
}

pub fn emit_object_only(req: AotBuildRequest) -> AotResult<AotBuildResult> {
    if req.output_kind != BuildOutputKind::ObjectOnly {
        return Err(AotError::InvalidRequest {
            message: "emit_object_only requires BuildOutputKind::ObjectOnly".to_owned(),
        });
    }
    build(req)
}

pub fn build(req: AotBuildRequest) -> AotResult<AotBuildResult> {
    validate_request(&req)?;

    let object_stage = emit_object_stage(&req)?;

    if req.output_kind == BuildOutputKind::ObjectOnly {
        return Ok(AotBuildResult {
            object_path: object_stage.object_path,
            final_path: None,
            exported_symbols: object_stage.exported_symbols,
            linker_invocation: None,
        });
    }

    ensure_entrypoint_exported(&req, &object_stage.exported_symbols)?;
    let runtime = prepare_runtime_stage(&req)?;
    let link_result = link_stage(&req, &object_stage, runtime.staticlib_path)?;

    Ok(AotBuildResult {
        object_path: object_stage.object_path,
        final_path: Some(link_result.output_path),
        exported_symbols: link_result.exported_symbols,
        linker_invocation: Some(link_result.command_line),
    })
}

fn emit_object_stage(req: &AotBuildRequest) -> AotResult<ObjectStageResult> {
    let target = detect_target(req.target_triple.as_deref())?;
    let object_path = req
        .object_path
        .clone()
        .unwrap_or_else(|| req.output_path.with_extension(target.object_ext));

    let mut object_module = BeskidObjectModule::new(req.target_triple.as_deref())?;
    object_module.compile_artifact(&req.artifact)?;

    let all_symbols = object_module.declared_symbols();
    let exported_symbols = apply_export_policy(all_symbols, &req.export_policy);

    object_module.finalize_to_path(&object_path)?;

    Ok(ObjectStageResult {
        object_path,
        exported_symbols,
    })
}

fn ensure_entrypoint_exported(req: &AotBuildRequest, exported_symbols: &[String]) -> AotResult<()> {
    if exported_symbols.iter().any(|sym| sym == &req.entrypoint) {
        return Ok(());
    }

    Err(AotError::MissingEntrypoint {
        symbol: req.entrypoint.clone(),
    })
}

fn prepare_runtime_stage(req: &AotBuildRequest) -> AotResult<crate::runtime::RuntimeArtifact> {
    prepare_runtime(&RuntimeBuildRequest {
        strategy: req.runtime.clone(),
        target_triple: req.target_triple.clone(),
        profile: req.profile,
        work_dir: std::env::temp_dir().join("beskid_aot_runtime"),
    })
}

fn link_stage(
    req: &AotBuildRequest,
    object_stage: &ObjectStageResult,
    runtime_staticlib: PathBuf,
) -> AotResult<crate::linker::LinkResult> {
    link(&LinkRequest {
        target_triple: req.target_triple.clone(),
        output_kind: req.output_kind,
        output_path: req.output_path.clone(),
        object_path: object_stage.object_path.clone(),
        runtime_staticlib,
        entrypoint_symbol: req.entrypoint.clone(),
        exported_symbols: object_stage.exported_symbols.clone(),
        link_mode: req.link_mode,
        verbose: req.verbose_link,
    })
}

fn validate_request(req: &AotBuildRequest) -> AotResult<()> {
    if req.artifact.functions.is_empty() {
        return Err(AotError::InvalidRequest {
            message: "codegen artifact has no lowered functions".to_owned(),
        });
    }
    if req.entrypoint.trim().is_empty() {
        return Err(AotError::InvalidRequest {
            message: "entrypoint must not be empty".to_owned(),
        });
    }
    Ok(())
}

fn apply_export_policy(symbols: Vec<String>, policy: &ExportPolicy) -> Vec<String> {
    match policy {
        ExportPolicy::AllDefined => symbols,
        ExportPolicy::PublicOnly => symbols
            .into_iter()
            .filter(|name| !name.starts_with("__"))
            .collect(),
        ExportPolicy::Explicit(expected) => symbols
            .into_iter()
            .filter(|name| expected.iter().any(|wanted| wanted == name))
            .collect(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn public_only_excludes_internal_symbols() {
        let symbols = vec!["main".to_owned(), "__beskid_type_desc_0".to_owned()];
        let filtered = apply_export_policy(symbols, &ExportPolicy::PublicOnly);
        assert_eq!(filtered, vec!["main".to_owned()]);
    }
}
