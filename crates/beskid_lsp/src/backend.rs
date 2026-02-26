use tokio::sync::RwLock;
use serde_json::json;
use std::path::{Path, PathBuf};
use std::str::FromStr;
use beskid_analysis::projects::parse_manifest;
use tower_lsp_server::jsonrpc::Result;
use tower_lsp_server::ls_types::*;
use tower_lsp_server::{Client, LanguageServer};

use crate::analysis::parse_program;
use crate::diagnostics::analyze_document;
use crate::navigation::{
    collect_top_level_symbols, semantic_completion_candidates, semantic_definition_span_at_offset,
    semantic_references_at_offset, semantic_target_at_offset, symbol_kind_name,
};
use crate::position::{offset_in_range, offset_range_to_lsp, offset_to_position, position_to_offset};
use crate::state::{Document, State};

pub struct Backend {
    client: Client,
    state: RwLock<State>,
}

const TOKEN_TYPE_FUNCTION: u32 = 0;
const TOKEN_TYPE_METHOD: u32 = 1;
const TOKEN_TYPE_STRUCT: u32 = 2;
const TOKEN_TYPE_ENUM: u32 = 3;
const TOKEN_TYPE_INTERFACE: u32 = 4;
const TOKEN_TYPE_NAMESPACE: u32 = 5;

const TOKEN_MODIFIER_DECLARATION: u32 = 1;

#[derive(Debug, Clone)]
struct SemanticTokenCandidate {
    start: usize,
    end: usize,
    token_type: u32,
    token_modifiers_bitset: u32,
    priority: u8,
}

fn semantic_token_legend() -> SemanticTokensLegend {
    SemanticTokensLegend {
        token_types: vec![
            SemanticTokenType::FUNCTION,
            SemanticTokenType::METHOD,
            SemanticTokenType::STRUCT,
            SemanticTokenType::ENUM,
            SemanticTokenType::INTERFACE,
            SemanticTokenType::NAMESPACE,
        ],
        token_modifiers: vec![SemanticTokenModifier::DECLARATION],
    }
}

fn push_semantic_symbol_tokens(text: &str, out: &mut Vec<SemanticTokenCandidate>) {
    let Some(program) = parse_program(text) else {
        return;
    };

    for symbol in collect_top_level_symbols(&program) {
        let token_type = match symbol.kind {
            SymbolKind::FUNCTION => TOKEN_TYPE_FUNCTION,
            SymbolKind::METHOD => TOKEN_TYPE_METHOD,
            SymbolKind::STRUCT => TOKEN_TYPE_STRUCT,
            SymbolKind::ENUM => TOKEN_TYPE_ENUM,
            SymbolKind::INTERFACE => TOKEN_TYPE_INTERFACE,
            SymbolKind::MODULE | SymbolKind::NAMESPACE => TOKEN_TYPE_NAMESPACE,
            _ => continue,
        };

        out.push(SemanticTokenCandidate {
            start: symbol.selection_start,
            end: symbol.selection_end,
            token_type,
            token_modifiers_bitset: TOKEN_MODIFIER_DECLARATION,
            priority: 10,
        });
    }
}

fn build_semantic_tokens(text: &str) -> Vec<SemanticToken> {
    let mut candidates = Vec::new();
    push_semantic_symbol_tokens(text, &mut candidates);

    candidates.sort_by_key(|candidate| (candidate.start, candidate.end, candidate.priority));

    let mut merged: Vec<SemanticTokenCandidate> = Vec::with_capacity(candidates.len());
    for candidate in candidates {
        if let Some(last) = merged.last_mut() {
            if last.start == candidate.start && last.end == candidate.end {
                if candidate.priority >= last.priority {
                    *last = candidate;
                }
                continue;
            }
        }
        merged.push(candidate);
    }

    let mut tokens = Vec::with_capacity(merged.len());
    let mut prev_line = 0u32;
    let mut prev_char = 0u32;

    for candidate in merged {
        if candidate.end <= candidate.start || candidate.end > text.len() {
            continue;
        }

        let start = offset_to_position(text, candidate.start);
        let end = offset_to_position(text, candidate.end);
        if start.line != end.line || end.character <= start.character {
            continue;
        }

        let delta_line = start.line.saturating_sub(prev_line);
        let delta_start = if delta_line == 0 {
            start.character.saturating_sub(prev_char)
        } else {
            start.character
        };

        tokens.push(SemanticToken {
            delta_line,
            delta_start,
            length: end.character.saturating_sub(start.character),
            token_type: candidate.token_type,
            token_modifiers_bitset: candidate.token_modifiers_bitset,
        });

        prev_line = start.line;
        prev_char = start.character;
    }

    tokens
}

fn is_ident_char(ch: char) -> bool {
    ch.is_alphanumeric() || ch == '_'
}

fn project_token_references(text: &str, offset: usize) -> Vec<(usize, usize)> {
    let Some(token) = token_at_offset(text, offset) else {
        return Vec::new();
    };

    let mut references = Vec::new();
    let mut cursor = 0usize;
    while cursor < text.len() {
        let Some(local_idx) = text[cursor..].find(token) else {
            break;
        };
        let start = cursor + local_idx;
        let end = start + token.len();

        let boundary_before = start == 0
            || text[..start]
                .chars()
                .next_back()
                .is_none_or(|ch| !is_ident_char(ch));
        let boundary_after = end >= text.len()
            || text[end..]
                .chars()
                .next()
                .is_none_or(|ch| !is_ident_char(ch));
        if boundary_before && boundary_after {
            references.push((start, end));
        }

        cursor = end;
    }

    references
}

fn first_match_range(text: &str, needle: &str) -> Option<Range> {
    let start = text.find(needle)?;
    let end = start + needle.len();
    Some(offset_range_to_lsp(text, start, end))
}

fn project_document_symbols(text: &str) -> Vec<DocumentSymbol> {
    let Ok(manifest) = parse_manifest(text) else {
        return Vec::new();
    };

    let mut symbols = Vec::new();
    if let Some(range) = first_match_range(text, "project") {
        symbols.push(build_document_symbol(
            manifest.project.name.clone(),
            Some("project".to_string()),
            SymbolKind::MODULE,
            None,
            range,
            range,
        ));
    }

    for target in manifest.targets {
        let needle = format!("target \"{}\"", target.name);
        let range = first_match_range(text, &needle)
            .unwrap_or_else(|| Range::new(Position::new(0, 0), Position::new(0, 0)));
        symbols.push(build_document_symbol(
            target.name,
            Some("target".to_string()),
            SymbolKind::CLASS,
            None,
            range,
            range,
        ));
    }

    for dependency in manifest.dependencies {
        let needle = format!("dependency \"{}\"", dependency.name);
        let range = first_match_range(text, &needle)
            .unwrap_or_else(|| Range::new(Position::new(0, 0), Position::new(0, 0)));
        symbols.push(build_document_symbol(
            dependency.name,
            Some("dependency".to_string()),
            SymbolKind::NAMESPACE,
            None,
            range,
            range,
        ));
    }

    symbols
}

fn completion_prefix_at_offset(text: &str, offset: usize) -> &str {
    let safe_offset = offset.min(text.len());
    let mut start = safe_offset;
    while start > 0 {
        let Some(ch) = text[..start].chars().next_back() else {
            break;
        };
        if ch.is_alphanumeric() || ch == '_' {
            start -= ch.len_utf8();
            continue;
        }
        break;
    }
    &text[start..safe_offset]
}

fn is_project_manifest_uri(uri: &Uri) -> bool {
    uri.to_string().to_lowercase().ends_with(".proj")
}

fn token_at_offset(text: &str, offset: usize) -> Option<&str> {
    let safe_offset = offset.min(text.len());
    let mut start = safe_offset;
    while start > 0 {
        let ch = text[..start].chars().next_back()?;
        if ch.is_alphanumeric() || ch == '_' {
            start -= ch.len_utf8();
            continue;
        }
        break;
    }

    let mut end = safe_offset;
    while end < text.len() {
        let ch = text[end..].chars().next()?;
        if ch.is_alphanumeric() || ch == '_' {
            end += ch.len_utf8();
            continue;
        }
        break;
    }

    if start == end {
        None
    } else {
        Some(&text[start..end])
    }
}

fn project_completion_candidates() -> [(&'static str, CompletionItemKind, &'static str); 14] {
    [
        ("project", CompletionItemKind::MODULE, "Top-level project block"),
        ("target", CompletionItemKind::MODULE, "Top-level target block"),
        ("dependency", CompletionItemKind::MODULE, "Top-level dependency block"),
        ("name", CompletionItemKind::FIELD, "Project or dependency name"),
        ("version", CompletionItemKind::FIELD, "Version string"),
        ("root", CompletionItemKind::FIELD, "Source root folder"),
        ("kind", CompletionItemKind::FIELD, "Target kind: App | Lib | Test"),
        ("entry", CompletionItemKind::FIELD, "Target entry file path"),
        ("source", CompletionItemKind::FIELD, "Dependency source kind"),
        ("path", CompletionItemKind::FIELD, "Local dependency path"),
        ("url", CompletionItemKind::FIELD, "Git dependency URL"),
        ("rev", CompletionItemKind::FIELD, "Git dependency revision"),
        ("App", CompletionItemKind::ENUM_MEMBER, "Application target kind"),
        ("Lib", CompletionItemKind::ENUM_MEMBER, "Library target kind"),
    ]
}

fn project_hover_markdown(token: &str) -> Option<&'static str> {
    match token {
        "project" => Some("`project { ... }` defines project metadata."),
        "target" => Some("`target \"Name\" { ... }` defines a build target."),
        "dependency" => Some("`dependency \"Alias\" { ... }` defines a dependency."),
        "name" => Some("`name` is required in the `project` block."),
        "version" => Some("`version` is required in the `project` block."),
        "root" => Some("`root` is optional and defaults to `Src`."),
        "kind" => Some("`kind` must be one of `App`, `Lib`, or `Test`."),
        "entry" => Some("`entry` is required and relative to `project.root`."),
        "source" => Some("`source` must be `path`, `git`, or `registry`."),
        "path" => Some("`path` is required when `source = \"path\"`."),
        "url" => Some("`url` is required when `source = \"git\"`."),
        "rev" => Some("`rev` is required when `source = \"git\"`."),
        _ => None,
    }
}

fn file_path_from_uri(uri: &Uri) -> Option<PathBuf> {
    let raw = uri.to_string();
    raw.strip_prefix("file://").map(PathBuf::from)
}

fn file_uri_from_path(path: &Path) -> Option<Uri> {
    let raw = format!("file://{}", path.display());
    Uri::from_str(&raw).ok()
}

fn project_dependency_path_location(uri: &Uri, text: &str, offset: usize) -> Option<Location> {
    let mut consumed = 0usize;
    for line in text.lines() {
        let line_start = consumed;
        let line_end = consumed + line.len();
        consumed = line_end.saturating_add(1);

        let trimmed = line.trim();
        if !trimmed.starts_with("path") || !trimmed.contains('=') {
            continue;
        }

        let quote_start = line.find('"')?;
        let quote_end = line[quote_start + 1..].find('"')? + quote_start + 1;
        let value_start = line_start + quote_start + 1;
        let value_end = line_start + quote_end;
        if !(value_start <= offset && offset <= value_end) {
            continue;
        }

        let dep_rel = &line[quote_start + 1..quote_end];
        let current = file_path_from_uri(uri)?;
        let parent = current.parent()?;
        let target = parent.join(dep_rel).join("Project.proj");
        let dep_uri = file_uri_from_path(&target)?;
        return Some(Location {
            uri: dep_uri,
            range: Range::new(Position::new(0, 0), Position::new(0, 0)),
        });
    }
    None
}

fn build_document_symbol(
    name: String,
    detail: Option<String>,
    kind: SymbolKind,
    tags: Option<Vec<SymbolTag>>,
    range: Range,
    selection_range: Range,
) -> DocumentSymbol {
    serde_json::from_value(json!({
        "name": name,
        "detail": detail,
        "kind": kind,
        "tags": tags,
        "range": range,
        "selectionRange": selection_range,
        "children": null
    }))
    .expect("valid DocumentSymbol payload")
}

impl Backend {
    pub fn new(client: Client) -> Self {
        Self {
            client,
            state: RwLock::new(State::default()),
        }
    }

    async fn set_document(&self, uri: Uri, version: i32, text: String) {
        self.state
            .write()
            .await
            .docs
            .insert(uri, Document { version, text });
    }

    async fn remove_document(&self, uri: &Uri) {
        self.state.write().await.docs.remove(uri);
    }

    async fn publish_diagnostics_for_uri(&self, uri: &Uri) {
        let snapshot = {
            let state = self.state.read().await;
            state.docs.get(uri).cloned()
        };

        let Some(doc) = snapshot else {
            return;
        };

        let diagnostics = analyze_document(uri, &doc.text);
        self.client
            .publish_diagnostics(uri.clone(), diagnostics, Some(doc.version))
            .await;
    }
}

impl LanguageServer for Backend {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        Ok(InitializeResult {
            capabilities: ServerCapabilities {
                text_document_sync: Some(TextDocumentSyncCapability::Kind(
                    TextDocumentSyncKind::FULL,
                )),
                hover_provider: Some(HoverProviderCapability::Simple(true)),
                definition_provider: Some(OneOf::Left(true)),
                references_provider: Some(OneOf::Left(true)),
                completion_provider: Some(CompletionOptions {
                    trigger_characters: Some(vec![".".to_string(), ":".to_string(), "_".to_string()]),
                    ..CompletionOptions::default()
                }),
                semantic_tokens_provider: Some(
                    SemanticTokensServerCapabilities::SemanticTokensOptions(
                        SemanticTokensOptions {
                            legend: semantic_token_legend(),
                            full: Some(SemanticTokensFullOptions::Bool(true)),
                            range: None,
                            work_done_progress_options: WorkDoneProgressOptions::default(),
                        },
                    ),
                ),
                document_symbol_provider: Some(OneOf::Left(true)),
                ..ServerCapabilities::default()
            },
            ..InitializeResult::default()
        })
    }

    async fn initialized(&self, _: InitializedParams) {
        self.client
            .log_message(MessageType::INFO, "Beskid LSP initialized")
            .await;
    }

    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }

    async fn did_open(&self, params: DidOpenTextDocumentParams) {
        let doc = params.text_document;
        self.set_document(doc.uri.clone(), doc.version, doc.text).await;
        self.publish_diagnostics_for_uri(&doc.uri).await;
    }

    async fn did_change(&self, params: DidChangeTextDocumentParams) {
        if let Some(change) = params.content_changes.into_iter().last() {
            self.set_document(
                params.text_document.uri.clone(),
                params.text_document.version,
                change.text,
            )
            .await;
            self.publish_diagnostics_for_uri(&params.text_document.uri).await;
        }
    }

    async fn did_save(&self, params: DidSaveTextDocumentParams) {
        self.publish_diagnostics_for_uri(&params.text_document.uri).await;
    }

    async fn did_close(&self, params: DidCloseTextDocumentParams) {
        self.remove_document(&params.text_document.uri).await;
        self.client
            .publish_diagnostics(params.text_document.uri, Vec::new(), None)
            .await;
    }

    async fn hover(&self, params: HoverParams) -> Result<Option<Hover>> {
        let text_document_position = params.text_document_position_params;
        let uri = text_document_position.text_document.uri;
        let Some(doc) = ({
            let state = self.state.read().await;
            state.docs.get(&uri).cloned()
        }) else {
            return Ok(None);
        };

        let offset = position_to_offset(&doc.text, text_document_position.position);

        if is_project_manifest_uri(&uri) {
            if let Some(token) = token_at_offset(&doc.text, offset) {
                if let Some(message) = project_hover_markdown(token) {
                    return Ok(Some(Hover {
                        contents: HoverContents::Markup(MarkupContent {
                            kind: MarkupKind::Markdown,
                            value: message.to_string(),
                        }),
                        range: None,
                    }));
                }
            }
            return Ok(None);
        }

        let Some(program) = parse_program(&doc.text) else {
            return Ok(None);
        };
        let symbols = collect_top_level_symbols(&program);

        if let Some(symbol) = symbols
            .iter()
            .find(|symbol| offset_in_range(offset, symbol.selection_start, symbol.selection_end))
        {
            return Ok(Some(Hover {
                contents: HoverContents::Markup(MarkupContent {
                    kind: MarkupKind::Markdown,
                    value: format!("**{}** `{}`", symbol_kind_name(symbol.kind), symbol.name),
                }),
                range: Some(offset_range_to_lsp(
                    &doc.text,
                    symbol.selection_start,
                    symbol.selection_end,
                )),
            }));
        }

        if let Some((label, start, end)) = semantic_target_at_offset(&program, offset) {
            return Ok(Some(Hover {
                contents: HoverContents::Markup(MarkupContent {
                    kind: MarkupKind::Markdown,
                    value: label,
                }),
                range: Some(offset_range_to_lsp(&doc.text, start, end)),
            }));
        }

        Ok(None)
    }

    async fn goto_definition(
        &self,
        params: GotoDefinitionParams,
    ) -> Result<Option<GotoDefinitionResponse>> {
        let text_document_position = params.text_document_position_params;
        let uri = text_document_position.text_document.uri;
        let Some(doc) = ({
            let state = self.state.read().await;
            state.docs.get(&uri).cloned()
        }) else {
            return Ok(None);
        };

        let offset = position_to_offset(&doc.text, text_document_position.position);
        if is_project_manifest_uri(&uri) {
            if let Some(location) = project_dependency_path_location(&uri, &doc.text, offset) {
                return Ok(Some(GotoDefinitionResponse::Scalar(location)));
            }
            return Ok(None);
        }

        let Some(program) = parse_program(&doc.text) else {
            return Ok(None);
        };
        let symbols = collect_top_level_symbols(&program);

        if let Some((start, end)) = semantic_definition_span_at_offset(&program, offset) {
            return Ok(Some(GotoDefinitionResponse::Scalar(Location {
                uri,
                range: offset_range_to_lsp(&doc.text, start, end),
            })));
        }

        if let Some(symbol) = symbols
            .iter()
            .find(|symbol| offset_in_range(offset, symbol.selection_start, symbol.selection_end))
        {
            return Ok(Some(GotoDefinitionResponse::Scalar(Location {
                uri,
                range: offset_range_to_lsp(&doc.text, symbol.selection_start, symbol.selection_end),
            })));
        }

        Ok(None)
    }

    async fn references(&self, params: ReferenceParams) -> Result<Option<Vec<Location>>> {
        let text_document_position = params.text_document_position;
        let uri = text_document_position.text_document.uri;
        let Some(doc) = ({
            let state = self.state.read().await;
            state.docs.get(&uri).cloned()
        }) else {
            return Ok(Some(Vec::new()));
        };

        let offset = position_to_offset(&doc.text, text_document_position.position);
        if is_project_manifest_uri(&uri) {
            let references = project_token_references(&doc.text, offset)
                .into_iter()
                .map(|(start, end)| Location {
                    uri: uri.clone(),
                    range: offset_range_to_lsp(&doc.text, start, end),
                })
                .collect();
            return Ok(Some(references));
        }

        let Some(program) = parse_program(&doc.text) else {
            return Ok(Some(Vec::new()));
        };

        let references = semantic_references_at_offset(&program, offset, params.context.include_declaration)
            .into_iter()
            .map(|(start, end)| Location {
                uri: uri.clone(),
                range: offset_range_to_lsp(&doc.text, start, end),
            })
            .collect();

        Ok(Some(references))
    }

    async fn completion(&self, params: CompletionParams) -> Result<Option<CompletionResponse>> {
        let text_document_position = params.text_document_position;
        let uri = text_document_position.text_document.uri;
        let Some(doc) = ({
            let state = self.state.read().await;
            state.docs.get(&uri).cloned()
        }) else {
            return Ok(Some(CompletionResponse::Array(Vec::new())));
        };

        let offset = position_to_offset(&doc.text, text_document_position.position);
        let prefix = completion_prefix_at_offset(&doc.text, offset).to_lowercase();

        if is_project_manifest_uri(&uri) {
            let mut items: Vec<CompletionItem> = project_completion_candidates()
                .into_iter()
                .filter(|(label, _, _)| prefix.is_empty() || label.to_lowercase().starts_with(prefix.as_str()))
                .map(|(label, kind, detail)| CompletionItem {
                    label: label.to_string(),
                    kind: Some(kind),
                    detail: Some(detail.to_string()),
                    ..CompletionItem::default()
                })
                .collect();
            items.sort_by(|a, b| a.label.cmp(&b.label));
            return Ok(Some(CompletionResponse::Array(items)));
        }

        let Some(program) = parse_program(&doc.text) else {
            return Ok(Some(CompletionResponse::Array(Vec::new())));
        };

        let mut items: Vec<CompletionItem> = semantic_completion_candidates(&program)
            .into_iter()
            .filter(|candidate| {
                prefix.is_empty() || candidate.label.to_lowercase().starts_with(prefix.as_str())
            })
            .map(|candidate| CompletionItem {
                label: candidate.label,
                kind: Some(candidate.kind),
                detail: candidate.detail,
                ..CompletionItem::default()
            })
            .collect();

        items.sort_by(|a, b| a.label.cmp(&b.label));
        items.dedup_by(|a, b| a.label == b.label && a.kind == b.kind);
        items.truncate(200);

        Ok(Some(CompletionResponse::Array(items)))
    }

    async fn document_symbol(
        &self,
        params: DocumentSymbolParams,
    ) -> Result<Option<DocumentSymbolResponse>> {
        let uri = params.text_document.uri;
        let Some(doc) = ({
            let state = self.state.read().await;
            state.docs.get(&uri).cloned()
        }) else {
            return Ok(Some(DocumentSymbolResponse::Nested(Vec::new())));
        };

        if is_project_manifest_uri(&uri) {
            return Ok(Some(DocumentSymbolResponse::Nested(project_document_symbols(
                &doc.text,
            ))));
        }

        let Some(program) = parse_program(&doc.text) else {
            return Ok(Some(DocumentSymbolResponse::Nested(Vec::new())));
        };

        let symbols = collect_top_level_symbols(&program);
        let document_symbols = symbols
            .into_iter()
            .map(|symbol| {
                let range = offset_range_to_lsp(&doc.text, symbol.selection_start, symbol.selection_end);
                build_document_symbol(
                    symbol.name,
                    Some(symbol_kind_name(symbol.kind).to_string()),
                    symbol.kind,
                    None,
                    range,
                    range,
                )
            })
            .collect();

        Ok(Some(DocumentSymbolResponse::Nested(document_symbols)))
    }

    async fn semantic_tokens_full(
        &self,
        params: SemanticTokensParams,
    ) -> Result<Option<SemanticTokensResult>> {
        let uri = params.text_document.uri;
        let Some(doc) = ({
            let state = self.state.read().await;
            state.docs.get(&uri).cloned()
        }) else {
            return Ok(None);
        };

        Ok(Some(SemanticTokensResult::Tokens(SemanticTokens {
            result_id: None,
            data: build_semantic_tokens(&doc.text),
        })))
    }
}
