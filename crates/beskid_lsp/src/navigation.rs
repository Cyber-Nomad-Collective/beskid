use beskid_analysis::resolve::{ItemKind, ResolvedValue};
use beskid_analysis::syntax::{Node, Program, Spanned};
use tower_lsp_server::ls_types::{CompletionItemKind, SymbolKind};

use crate::analysis::resolve_program;
use crate::position::offset_in_range;

#[derive(Debug, Clone)]
pub struct TopLevelSymbol {
    pub name: String,
    pub kind: SymbolKind,
    pub selection_start: usize,
    pub selection_end: usize,
}

#[derive(Debug, Clone)]
pub struct CompletionCandidate {
    pub label: String,
    pub kind: CompletionItemKind,
    pub detail: Option<String>,
}

pub fn collect_top_level_symbols(program: &Spanned<Program>) -> Vec<TopLevelSymbol> {
    program
        .node
        .items
        .iter()
        .filter_map(|item| match &item.node {
            Node::Function(def) => Some(TopLevelSymbol {
                name: def.node.name.node.name.clone(),
                kind: SymbolKind::FUNCTION,
                selection_start: def.node.name.span.start,
                selection_end: def.node.name.span.end,
            }),
            Node::Method(def) => Some(TopLevelSymbol {
                name: def.node.name.node.name.clone(),
                kind: SymbolKind::METHOD,
                selection_start: def.node.name.span.start,
                selection_end: def.node.name.span.end,
            }),
            Node::TypeDefinition(def) => Some(TopLevelSymbol {
                name: def.node.name.node.name.clone(),
                kind: SymbolKind::STRUCT,
                selection_start: def.node.name.span.start,
                selection_end: def.node.name.span.end,
            }),
            Node::EnumDefinition(def) => Some(TopLevelSymbol {
                name: def.node.name.node.name.clone(),
                kind: SymbolKind::ENUM,
                selection_start: def.node.name.span.start,
                selection_end: def.node.name.span.end,
            }),
            Node::ContractDefinition(def) => Some(TopLevelSymbol {
                name: def.node.name.node.name.clone(),
                kind: SymbolKind::INTERFACE,
                selection_start: def.node.name.span.start,
                selection_end: def.node.name.span.end,
            }),
            Node::ModuleDeclaration(def) => {
                let segment = def.node.path.node.segments.last()?;
                Some(TopLevelSymbol {
                    name: segment.node.name.node.name.clone(),
                    kind: SymbolKind::MODULE,
                    selection_start: segment.span.start,
                    selection_end: segment.span.end,
                })
            }
            Node::InlineModule(def) => Some(TopLevelSymbol {
                name: def.node.name.node.name.clone(),
                kind: SymbolKind::MODULE,
                selection_start: def.node.name.span.start,
                selection_end: def.node.name.span.end,
            }),
            Node::UseDeclaration(def) => {
                let segment = def.node.path.node.segments.last()?;
                Some(TopLevelSymbol {
                    name: segment.node.name.node.name.clone(),
                    kind: SymbolKind::NAMESPACE,
                    selection_start: segment.span.start,
                    selection_end: segment.span.end,
                })
            }
        })
        .collect()
}

pub fn semantic_definition_span_at_offset(
    program: &Spanned<Program>,
    offset: usize,
) -> Option<(usize, usize)> {
    let resolution = resolve_program(program)?;

    let (_, resolved) = resolution
        .tables
        .resolved_values
        .iter()
        .filter(|(span, _)| offset_in_range(offset, span.start, span.end))
        .min_by_key(|(span, _)| span.end.saturating_sub(span.start))?;

    match resolved {
        ResolvedValue::Item(item_id) => {
            let span = resolution.items.get(item_id.0)?.span;
            Some((span.start, span.end))
        }
        ResolvedValue::Local(local_id) => {
            let span = resolution.tables.local_info(*local_id)?.span;
            Some((span.start, span.end))
        }
    }
}

pub fn semantic_target_at_offset(
    program: &Spanned<Program>,
    offset: usize,
) -> Option<(String, usize, usize)> {
    let resolution = resolve_program(program)?;

    let (_, resolved) = resolution
        .tables
        .resolved_values
        .iter()
        .filter(|(span, _)| offset_in_range(offset, span.start, span.end))
        .min_by_key(|(span, _)| span.end.saturating_sub(span.start))?;

    match resolved {
        ResolvedValue::Item(item_id) => {
            let item = resolution.items.get(item_id.0)?;
            let label = format!("**{}** `{}`", item_kind_name(item.kind), item.name);
            Some((label, item.span.start, item.span.end))
        }
        ResolvedValue::Local(local_id) => {
            let local = resolution.tables.local_info(*local_id)?;
            Some((
                format!("**local** `{}`", local.name),
                local.span.start,
                local.span.end,
            ))
        }
    }
}

pub fn semantic_references_at_offset(
    program: &Spanned<Program>,
    offset: usize,
    include_declaration: bool,
) -> Vec<(usize, usize)> {
    let Some(resolution) = resolve_program(program) else {
        return Vec::new();
    };

    let Some((_, target)) = resolution
        .tables
        .resolved_values
        .iter()
        .filter(|(span, _)| offset_in_range(offset, span.start, span.end))
        .min_by_key(|(span, _)| span.end.saturating_sub(span.start))
    else {
        return Vec::new();
    };

    let target = *target;
    let mut references: Vec<(usize, usize)> = resolution
        .tables
        .resolved_values
        .iter()
        .filter_map(|(span, resolved)| {
            if *resolved == target {
                Some((span.start, span.end))
            } else {
                None
            }
        })
        .collect();

    if include_declaration {
        match target {
            ResolvedValue::Item(item_id) => {
                if let Some(item) = resolution.items.get(item_id.0) {
                    references.push((item.span.start, item.span.end));
                }
            }
            ResolvedValue::Local(local_id) => {
                if let Some(local) = resolution.tables.local_info(local_id) {
                    references.push((local.span.start, local.span.end));
                }
            }
        }
    }

    references.sort_unstable();
    references.dedup();
    references
}

pub fn semantic_completion_candidates(program: &Spanned<Program>) -> Vec<CompletionCandidate> {
    let Some(resolution) = resolve_program(program) else {
        return collect_top_level_symbols(program)
            .into_iter()
            .map(|symbol| CompletionCandidate {
                label: symbol.name,
                kind: completion_kind_from_symbol_kind(symbol.kind),
                detail: Some(symbol_kind_name(symbol.kind).to_string()),
            })
            .collect();
    };

    let mut candidates = Vec::new();
    for item in &resolution.items {
        candidates.push(CompletionCandidate {
            label: item.name.clone(),
            kind: completion_kind_from_item_kind(item.kind),
            detail: Some(item_kind_name(item.kind).to_string()),
        });
    }
    for local in &resolution.tables.locals {
        candidates.push(CompletionCandidate {
            label: local.name.clone(),
            kind: CompletionItemKind::VARIABLE,
            detail: Some("local".to_string()),
        });
    }

    candidates.sort_by(|a, b| a.label.cmp(&b.label));
    candidates.dedup_by(|a, b| a.label == b.label && a.kind == b.kind);
    candidates
}

fn completion_kind_from_item_kind(kind: ItemKind) -> CompletionItemKind {
    match kind {
        ItemKind::Function => CompletionItemKind::FUNCTION,
        ItemKind::Method => CompletionItemKind::METHOD,
        ItemKind::Type => CompletionItemKind::STRUCT,
        ItemKind::Enum => CompletionItemKind::ENUM,
        ItemKind::EnumVariant => CompletionItemKind::ENUM_MEMBER,
        ItemKind::Contract => CompletionItemKind::INTERFACE,
        ItemKind::ContractNode => CompletionItemKind::METHOD,
        ItemKind::ContractMethodSignature => CompletionItemKind::METHOD,
        ItemKind::ContractEmbedding => CompletionItemKind::MODULE,
        ItemKind::Module => CompletionItemKind::MODULE,
        ItemKind::Use => CompletionItemKind::MODULE,
    }
}

fn completion_kind_from_symbol_kind(kind: SymbolKind) -> CompletionItemKind {
    match kind {
        SymbolKind::FUNCTION => CompletionItemKind::FUNCTION,
        SymbolKind::METHOD => CompletionItemKind::METHOD,
        SymbolKind::STRUCT => CompletionItemKind::STRUCT,
        SymbolKind::ENUM => CompletionItemKind::ENUM,
        SymbolKind::INTERFACE => CompletionItemKind::INTERFACE,
        SymbolKind::MODULE => CompletionItemKind::MODULE,
        SymbolKind::NAMESPACE => CompletionItemKind::MODULE,
        _ => CompletionItemKind::TEXT,
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

pub fn symbol_kind_name(kind: SymbolKind) -> &'static str {
    match kind {
        SymbolKind::FUNCTION => "function",
        SymbolKind::METHOD => "method",
        SymbolKind::STRUCT => "type",
        SymbolKind::ENUM => "enum",
        SymbolKind::INTERFACE => "contract",
        SymbolKind::MODULE => "module",
        SymbolKind::NAMESPACE => "use",
        _ => "symbol",
    }
}
