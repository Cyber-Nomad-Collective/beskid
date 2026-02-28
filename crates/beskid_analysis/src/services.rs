use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use pest::Parser;

use crate::analysis::diagnostics::SemanticDiagnostic;
use crate::parser::{BeskidParser, Rule};
use crate::parsing::parsable::Parsable;
use crate::projects::{
    CompilePlan, PROJECT_FILE_NAME, PreparedProjectWorkspace, WorkspacePrepareOptions,
    build_compile_plan, discover_project_file, prepare_project_workspace_with_options,
};
use crate::query::NodeRef;
use crate::syntax::{Program, Spanned};
use crate::{AnalysisOptions, builtin_rules, run_rules};

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
    let explicit_manifest = project
        .map(|path| resolve_project_manifest_path(path))
        .or_else(|| input.and_then(|path| infer_manifest_from_input(path)));
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
    let input_is_manifest = input
        .map(|path| infer_manifest_from_input(path).is_some())
        .unwrap_or(false);

    let source_path = match (
        input,
        input_is_manifest,
        compile_plan.as_ref(),
        prepared_workspace.as_ref(),
    ) {
        (Some(input), false, _, _) => input.clone(),
        (_, _, Some(plan), Some(workspace)) => {
            workspace.materialized_source_root.join(&plan.target.entry)
        }
        (_, _, Some(plan), None) => plan.source_root.join(&plan.target.entry),
        (_, _, None, _) => {
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

pub fn parse_program(source: &str) -> Result<Spanned<Program>> {
    let mut pairs = BeskidParser::parse(Rule::Program, source)?;
    let pair = pairs
        .next()
        .ok_or_else(|| anyhow::anyhow!("No program found"))?;
    Program::parse(pair).map_err(|err| anyhow::anyhow!("{err:?}"))
}

pub fn analyze_program(path: &Path, source: &str) -> Result<Vec<SemanticDiagnostic>> {
    let program = parse_program(source)?;
    Ok(run_rules(
        &program.node,
        path.display().to_string(),
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    )
    .diagnostics)
}

pub fn render_program_tree(program: &Spanned<Program>) -> String {
    let mut out = String::new();
    render_tree_node(NodeRef::from(&program.node), 0, &mut out);
    out
}

fn render_tree_node(node: NodeRef, indent: usize, out: &mut String) {
    let prefix = "  ".repeat(indent);
    let kind = node.node_kind();

    let extra = if let Some(ident) = node.of::<crate::syntax::Identifier>() {
        format!(" ({})", ident.name)
    } else if let Some(lit) = node.of::<crate::syntax::Literal>() {
        format!(" ({lit:?})")
    } else {
        String::new()
    };

    out.push_str(&format!("{}{:?}{}\n", prefix, kind, extra));
    node.children(|child| {
        render_tree_node(child, indent + 1, out);
    });
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

fn infer_manifest_from_input(input: &Path) -> Option<PathBuf> {
    if input
        .file_name()
        .and_then(|name| name.to_str())
        .is_some_and(|name| name == PROJECT_FILE_NAME)
    {
        return Some(input.to_path_buf());
    }

    if input.extension().and_then(|ext| ext.to_str()) == Some("proj") {
        return Some(input.to_path_buf());
    }

    None
}
