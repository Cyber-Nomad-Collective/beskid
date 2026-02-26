use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use beskid_analysis::projects::{
    CompilePlan, PROJECT_FILE_NAME, PreparedProjectWorkspace, WorkspacePrepareOptions,
    build_compile_plan, discover_project_file, prepare_project_workspace_with_options,
};

pub struct ResolvedInput {
    pub source_path: PathBuf,
    pub source: String,
    pub compile_plan: Option<CompilePlan>,
    pub prepared_workspace: Option<PreparedProjectWorkspace>,
}

pub struct ResolvedProject {
    pub compile_plan: Option<CompilePlan>,
    pub prepared_workspace: Option<PreparedProjectWorkspace>,
}

pub fn resolve_project(
    input: Option<&PathBuf>,
    project: Option<&PathBuf>,
    target: Option<&str>,
    frozen: bool,
    locked: bool,
) -> Result<ResolvedProject> {
    let explicit_manifest = project.map(|path| resolve_project_manifest_path(path));
    let discovered_manifest = if explicit_manifest.is_none() {
        discover_from_input_or_cwd(input)
    } else {
        None
    };

    let manifest_path = explicit_manifest.or(discovered_manifest);
    let (compile_plan, prepared_workspace) = match manifest_path {
        Some(ref manifest) => {
            let plan = build_compile_plan(manifest, target)
                .map_err(|err| anyhow::anyhow!("{}: {err}", err.code()))?;
            let workspace = prepare_project_workspace_with_options(
                &plan,
                WorkspacePrepareOptions { frozen, locked },
            )
            .map_err(|err| anyhow::anyhow!("{}: {err}", err.code()))?;
            (Some(plan), Some(workspace))
        }
        None => (None, None),
    };

    Ok(ResolvedProject {
        compile_plan,
        prepared_workspace,
    })
}

pub fn resolve_input(
    input: Option<&PathBuf>,
    project: Option<&PathBuf>,
    target: Option<&str>,
    frozen: bool,
    locked: bool,
) -> Result<ResolvedInput> {
    let resolved_project = resolve_project(input, project, target, frozen, locked)?;
    let compile_plan = resolved_project.compile_plan;
    let prepared_workspace = resolved_project.prepared_workspace;

    let source_path = match (input, compile_plan.as_ref(), prepared_workspace.as_ref()) {
        (Some(input), _, _) => input.clone(),
        (None, Some(plan), Some(workspace)) => {
            workspace.materialized_source_root.join(&plan.target.entry)
        }
        (None, Some(plan), None) => plan.source_root.join(&plan.target.entry),
        (None, None, _) => {
            return Err(anyhow::anyhow!(
                "no input file provided and no `{}` discovered",
                PROJECT_FILE_NAME
            ));
        }
    };

    let source = fs::read_to_string(&source_path)
        .with_context(|| format!("Failed to read file: {}", source_path.display()))?;

    Ok(ResolvedInput {
        source_path,
        source,
        compile_plan,
        prepared_workspace,
    })
}

fn discover_from_input_or_cwd(input: Option<&PathBuf>) -> Option<PathBuf> {
    if let Some(input) = input {
        return discover_project_file(input);
    }

    let cwd = env::current_dir().ok()?;
    discover_project_file(&cwd)
}

fn resolve_project_manifest_path(project: &Path) -> PathBuf {
    if project.is_dir() {
        project.join(PROJECT_FILE_NAME)
    } else {
        project.to_path_buf()
    }
}
