use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result};
use pest::Parser;
use pest::error::InputLocation;

use crate::analysis::diagnostics::SemanticDiagnostic;
use crate::hir::{AstProgram, HirProgram, lower_program as lower_hir_program, normalize_program};
use crate::parser::{BeskidParser, Rule};
use crate::parsing::error::ParseError;
use crate::parsing::parsable::Parsable;
use crate::projects::{
    CompilePlan, PROJECT_FILE_NAME, PreparedProjectWorkspace, ProjectError,
    WorkspacePrepareOptions, build_compile_plan, discover_project_file,
    prepare_project_workspace_with_options,
};
use crate::query::NodeRef;
use crate::resolve::{ItemKind, Resolution, ResolvedValue, Resolver};
use crate::syntax::{Node, Program, Spanned};
use crate::{AnalysisOptions, builtin_rules, run_rules};

pub struct ResolvedInput {
    pub source_path: PathBuf,
    pub source: String,
    pub compile_plan: Option<CompilePlan>,
    pub prepared_workspace: Option<PreparedProjectWorkspace>,
}

fn resolve_program(program: &Spanned<Program>) -> Option<Resolution> {
    let ast: Spanned<AstProgram> = program.clone().into();
    let mut hir: Spanned<HirProgram> = lower_hir_program(&ast);
    normalize_program(&mut hir).ok()?;
    Resolver::new().resolve_program(&hir).ok()
}

fn resolved_value_at_offset<'a>(
    resolution: &'a Resolution,
    offset: usize,
) -> Option<&'a ResolvedValue> {
    resolution
        .tables
        .resolved_values
        .iter()
        .filter(|(span, _)| span.start <= offset && offset <= span.end)
        .min_by_key(|(span, _)| span.end.saturating_sub(span.start))
        .map(|(_, resolved)| resolved)
}

fn completion_kind_from_item_kind(kind: ItemKind) -> CompletionKind {
    match kind {
        ItemKind::Function => CompletionKind::Function,
        ItemKind::Method => CompletionKind::Method,
        ItemKind::Type => CompletionKind::Struct,
        ItemKind::Enum => CompletionKind::Enum,
        ItemKind::EnumVariant => CompletionKind::EnumMember,
        ItemKind::Contract => CompletionKind::Interface,
        ItemKind::ContractNode => CompletionKind::Method,
        ItemKind::ContractMethodSignature => CompletionKind::Method,
        ItemKind::ContractEmbedding => CompletionKind::Module,
        ItemKind::Module => CompletionKind::Module,
        ItemKind::Use => CompletionKind::Module,
    }
}

fn completion_kind_from_symbol_kind(kind: AnalysisSymbolKind) -> CompletionKind {
    match kind {
        AnalysisSymbolKind::Function => CompletionKind::Function,
        AnalysisSymbolKind::Method => CompletionKind::Method,
        AnalysisSymbolKind::Type => CompletionKind::Struct,
        AnalysisSymbolKind::Enum => CompletionKind::Enum,
        AnalysisSymbolKind::Contract => CompletionKind::Interface,
        AnalysisSymbolKind::Module => CompletionKind::Module,
        AnalysisSymbolKind::Use => CompletionKind::Module,
    }
}

fn item_kind_name(kind: ItemKind) -> &'static str {
    match kind {
        ItemKind::Function => "function",
        ItemKind::Method => "method",
        ItemKind::Type => "type",
        ItemKind::Enum => "enum",
        ItemKind::EnumVariant => "enum variant",
        ItemKind::Contract => "contract",
        ItemKind::ContractNode => "contract node",
        ItemKind::ContractMethodSignature => "contract method",
        ItemKind::ContractEmbedding => "contract embedding",
        ItemKind::Module => "module",
        ItemKind::Use => "use",
    }
}

pub fn symbol_kind_name(kind: AnalysisSymbolKind) -> &'static str {
    match kind {
        AnalysisSymbolKind::Function => "function",
        AnalysisSymbolKind::Method => "method",
        AnalysisSymbolKind::Type => "type",
        AnalysisSymbolKind::Enum => "enum",
        AnalysisSymbolKind::Contract => "contract",
        AnalysisSymbolKind::Module => "module",
        AnalysisSymbolKind::Use => "use",
    }
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

pub fn pest_error_diagnostic(
    source_name: &str,
    source: &str,
    err: &pest::error::Error<Rule>,
) -> SemanticDiagnostic {
    let start = match err.location {
        InputLocation::Pos(pos) => pos,
        InputLocation::Span((start, _)) => start,
    };
    crate::analysis::diagnostics::make_diagnostic(
        source_name,
        source,
        crate::syntax::SpanInfo {
            start,
            end: start.saturating_add(1),
            line_col_start: (1, 1),
            line_col_end: (1, 1),
        },
        format!("parse error: {err}"),
        "parse",
        None,
        Some("parse".to_string()),
        crate::analysis::Severity::Error,
    )
}

pub fn parse_error_diagnostic(
    source_name: &str,
    source: &str,
    err: &ParseError,
) -> SemanticDiagnostic {
    match err {
        ParseError::UnexpectedRule {
            expected,
            found,
            span,
        } => {
            let message = match expected {
                Some(rule) => format!("parse error: expected {rule:?}, found {found:?}"),
                None => format!("parse error: unexpected {found:?}"),
            };
            crate::analysis::diagnostics::make_diagnostic(
                source_name,
                source,
                *span,
                message,
                "parse",
                None,
                Some("parse".to_string()),
                crate::analysis::Severity::Error,
            )
        }
        ParseError::MissingPair { expected } => crate::analysis::diagnostics::make_diagnostic(
            source_name,
            source,
            crate::syntax::SpanInfo {
                start: 0,
                end: 0,
                line_col_start: (1, 1),
                line_col_end: (1, 1),
            },
            format!("parse error: missing {expected:?}"),
            "parse",
            None,
            Some("parse".to_string()),
            crate::analysis::Severity::Error,
        ),
        ParseError::ForbiddenImplSelfParameter { span } => {
            crate::analysis::diagnostics::make_diagnostic(
                source_name,
                source,
                *span,
                "parse error: explicit `self` parameter is not allowed in impl methods",
                "parse",
                None,
                Some("parse".to_string()),
                crate::analysis::Severity::Error,
            )
        }
    }
}

pub fn project_error_diagnostic(
    source_name: &str,
    source: &str,
    error: &ProjectError,
) -> SemanticDiagnostic {
    crate::analysis::diagnostics::make_diagnostic(
        source_name,
        source,
        crate::syntax::SpanInfo {
            start: 0,
            end: 1,
            line_col_start: (1, 1),
            line_col_end: (1, 1),
        },
        error.to_string(),
        "project",
        None,
        Some("project".to_string()),
        crate::analysis::Severity::Error,
    )
}

#[derive(Debug, Clone)]
pub struct DocumentAnalysisSnapshot {
    pub program: Spanned<Program>,
    pub resolution: Option<Resolution>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AnalysisSymbolKind {
    Function,
    Method,
    Type,
    Enum,
    Contract,
    Module,
    Use,
}

#[derive(Debug, Clone)]
pub struct DocumentSymbolInfo {
    pub name: String,
    pub kind: AnalysisSymbolKind,
    pub selection_start: usize,
    pub selection_end: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompletionKind {
    Function,
    Method,
    Struct,
    Enum,
    Interface,
    Module,
    EnumMember,
    Variable,
    Text,
}

#[derive(Debug, Clone)]
pub struct CompletionInfo {
    pub label: String,
    pub kind: CompletionKind,
    pub detail: Option<String>,
}

#[derive(Debug, Clone)]
pub struct HoverInfo {
    pub markdown: String,
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Copy)]
pub struct DefinitionInfo {
    pub start: usize,
    pub end: usize,
}

#[derive(Debug, Clone, Copy)]
pub struct ReferenceInfo {
    pub start: usize,
    pub end: usize,
}

pub fn build_document_analysis(program: &Spanned<Program>) -> DocumentAnalysisSnapshot {
    DocumentAnalysisSnapshot {
        program: program.clone(),
        resolution: resolve_program(program),
    }
}

pub fn collect_document_symbols(snapshot: &DocumentAnalysisSnapshot) -> Vec<DocumentSymbolInfo> {
    snapshot
        .program
        .node
        .items
        .iter()
        .filter_map(|item| match &item.node {
            Node::Function(definition) => Some(DocumentSymbolInfo {
                name: definition.node.name.node.name.clone(),
                kind: AnalysisSymbolKind::Function,
                selection_start: definition.node.name.span.start,
                selection_end: definition.node.name.span.end,
            }),
            Node::Method(definition) => Some(DocumentSymbolInfo {
                name: definition.node.name.node.name.clone(),
                kind: AnalysisSymbolKind::Method,
                selection_start: definition.node.name.span.start,
                selection_end: definition.node.name.span.end,
            }),
            Node::TypeDefinition(definition) => Some(DocumentSymbolInfo {
                name: definition.node.name.node.name.clone(),
                kind: AnalysisSymbolKind::Type,
                selection_start: definition.node.name.span.start,
                selection_end: definition.node.name.span.end,
            }),
            Node::EnumDefinition(definition) => Some(DocumentSymbolInfo {
                name: definition.node.name.node.name.clone(),
                kind: AnalysisSymbolKind::Enum,
                selection_start: definition.node.name.span.start,
                selection_end: definition.node.name.span.end,
            }),
            Node::ContractDefinition(definition) => Some(DocumentSymbolInfo {
                name: definition.node.name.node.name.clone(),
                kind: AnalysisSymbolKind::Contract,
                selection_start: definition.node.name.span.start,
                selection_end: definition.node.name.span.end,
            }),
            Node::AttributeDeclaration(_) => None,
            Node::ModuleDeclaration(definition) => {
                let segment = definition.node.path.node.segments.last()?;
                Some(DocumentSymbolInfo {
                    name: segment.node.name.node.name.clone(),
                    kind: AnalysisSymbolKind::Module,
                    selection_start: segment.span.start,
                    selection_end: segment.span.end,
                })
            }
            Node::InlineModule(definition) => Some(DocumentSymbolInfo {
                name: definition.node.name.node.name.clone(),
                kind: AnalysisSymbolKind::Module,
                selection_start: definition.node.name.span.start,
                selection_end: definition.node.name.span.end,
            }),
            Node::UseDeclaration(definition) => {
                let segment = definition.node.path.node.segments.last()?;
                Some(DocumentSymbolInfo {
                    name: segment.node.name.node.name.clone(),
                    kind: AnalysisSymbolKind::Use,
                    selection_start: segment.span.start,
                    selection_end: segment.span.end,
                })
            }
        })
        .collect()
}

pub fn hover_at_offset(snapshot: &DocumentAnalysisSnapshot, offset: usize) -> Option<HoverInfo> {
    let resolved = resolved_value_at_offset(snapshot.resolution.as_ref()?, offset)?;
    match resolved {
        ResolvedValue::Item(item_id) => {
            let item = snapshot.resolution.as_ref()?.items.get(item_id.0)?;
            Some(HoverInfo {
                markdown: format!("**{}** `{}`", item_kind_name(item.kind), item.name),
                start: item.span.start,
                end: item.span.end,
            })
        }
        ResolvedValue::Local(local_id) => {
            let local = snapshot.resolution.as_ref()?.tables.local_info(*local_id)?;
            Some(HoverInfo {
                markdown: format!("**local** `{}`", local.name),
                start: local.span.start,
                end: local.span.end,
            })
        }
    }
}

pub fn definition_at_offset(
    snapshot: &DocumentAnalysisSnapshot,
    offset: usize,
) -> Option<DefinitionInfo> {
    let resolved = resolved_value_at_offset(snapshot.resolution.as_ref()?, offset)?;
    match resolved {
        ResolvedValue::Item(item_id) => {
            let span = snapshot.resolution.as_ref()?.items.get(item_id.0)?.span;
            Some(DefinitionInfo {
                start: span.start,
                end: span.end,
            })
        }
        ResolvedValue::Local(local_id) => {
            let span = snapshot
                .resolution
                .as_ref()?
                .tables
                .local_info(*local_id)?
                .span;
            Some(DefinitionInfo {
                start: span.start,
                end: span.end,
            })
        }
    }
}

pub fn references_at_offset(
    snapshot: &DocumentAnalysisSnapshot,
    offset: usize,
    include_declaration: bool,
) -> Vec<ReferenceInfo> {
    let Some(resolution) = snapshot.resolution.as_ref() else {
        return Vec::new();
    };

    let Some(target) = resolved_value_at_offset(resolution, offset).copied() else {
        return Vec::new();
    };

    let mut references: Vec<ReferenceInfo> = resolution
        .tables
        .resolved_values
        .iter()
        .filter_map(|(span, resolved)| {
            if *resolved == target {
                Some(ReferenceInfo {
                    start: span.start,
                    end: span.end,
                })
            } else {
                None
            }
        })
        .collect();

    if include_declaration {
        match target {
            ResolvedValue::Item(item_id) => {
                if let Some(item) = resolution.items.get(item_id.0) {
                    references.push(ReferenceInfo {
                        start: item.span.start,
                        end: item.span.end,
                    });
                }
            }
            ResolvedValue::Local(local_id) => {
                if let Some(local) = resolution.tables.local_info(local_id) {
                    references.push(ReferenceInfo {
                        start: local.span.start,
                        end: local.span.end,
                    });
                }
            }
        }
    }

    references.sort_by_key(|reference| (reference.start, reference.end));
    references.dedup_by(|left, right| left.start == right.start && left.end == right.end);
    references
}

pub fn completion_candidates(snapshot: &DocumentAnalysisSnapshot) -> Vec<CompletionInfo> {
    let Some(resolution) = snapshot.resolution.as_ref() else {
        return collect_document_symbols(snapshot)
            .into_iter()
            .map(|symbol| CompletionInfo {
                label: symbol.name,
                kind: completion_kind_from_symbol_kind(symbol.kind),
                detail: Some(symbol_kind_name(symbol.kind).to_string()),
            })
            .collect();
    };

    let mut candidates = Vec::new();
    for item in &resolution.items {
        candidates.push(CompletionInfo {
            label: item.name.clone(),
            kind: completion_kind_from_item_kind(item.kind),
            detail: Some(item_kind_name(item.kind).to_string()),
        });
    }
    for local in &resolution.tables.locals {
        candidates.push(CompletionInfo {
            label: local.name.clone(),
            kind: CompletionKind::Variable,
            detail: Some("local".to_string()),
        });
    }

    candidates.sort_by(|left, right| left.label.cmp(&right.label));
    candidates.dedup_by(|left, right| left.label == right.label && left.kind == right.kind);
    candidates
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
