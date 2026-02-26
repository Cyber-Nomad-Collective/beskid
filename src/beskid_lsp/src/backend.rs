use tokio::sync::RwLock;
use serde_json::json;
use std::path::{Path, PathBuf};
use std::str::FromStr;
use tower_lsp_server::jsonrpc::Result;
use tower_lsp_server::ls_types::*;
use tower_lsp_server::{Client, LanguageServer};

use crate::analysis::parse_program;
use crate::diagnostics::analyze_document;
use crate::navigation::{
    collect_top_level_symbols, semantic_completion_candidates, semantic_definition_span_at_offset,
    semantic_references_at_offset, semantic_target_at_offset, symbol_kind_name,
};
use crate::position::{offset_in_range, offset_range_to_lsp, position_to_offset};
use crate::state::{Document, State};

pub struct Backend {
    client: Client,
    state: RwLock<State>,
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use tower_lsp_server::LspService;

    use super::*;

    fn uri(path: &str) -> Uri {
        Uri::from_str(path).expect("valid URI")
    }

    fn sample_source() -> String {
        [
            "i32 main() {",
            "    i32 mut value = 1;",
            "    i32 mut total = value + value;",
            "    return value;",
            "}",
        ]
        .join("\n")
    }

    async fn open_document(server: &Backend, uri: Uri, language_id: &str, text: String) {
        server
            .did_open(DidOpenTextDocumentParams {
                text_document: TextDocumentItem {
                    uri,
                    language_id: language_id.to_string(),
                    version: 1,
                    text,
                },
            })
            .await;
    }

    async fn open_sample_document(server: &Backend, uri: Uri) {
        open_document(server, uri, "beskid", sample_source()).await;
    }

    #[tokio::test]
    async fn references_include_declaration_returns_all_occurrences() {
        let (service, _socket) = LspService::new(Backend::new);
        let server = service.inner();
        let doc_uri = uri("file:///references_test.bd");
        open_sample_document(server, doc_uri.clone()).await;

        let response = server
            .references(ReferenceParams {
                text_document_position: TextDocumentPositionParams {
                    text_document: TextDocumentIdentifier {
                        uri: doc_uri.clone(),
                    },
                    position: Position::new(3, 12),
                },
                work_done_progress_params: WorkDoneProgressParams::default(),
                partial_result_params: PartialResultParams::default(),
                context: ReferenceContext {
                    include_declaration: true,
                },
            })
            .await
            .expect("references request should succeed")
            .expect("references should return result");

        assert_eq!(response.len(), 4);
        assert!(response.iter().all(|location| location.uri == doc_uri));
    }

    #[tokio::test]
    async fn completion_returns_matching_local_candidate() {
        let (service, _socket) = LspService::new(Backend::new);
        let server = service.inner();
        let doc_uri = uri("file:///completion_test.bd");
        open_sample_document(server, doc_uri.clone()).await;

        let response = server
            .completion(CompletionParams {
                text_document_position: TextDocumentPositionParams {
                    text_document: TextDocumentIdentifier {
                        uri: doc_uri.clone(),
                    },
                    position: Position::new(3, 16),
                },
                work_done_progress_params: WorkDoneProgressParams::default(),
                partial_result_params: PartialResultParams::default(),
                context: None,
            })
            .await
            .expect("completion request should succeed")
            .expect("completion should return result");

        let CompletionResponse::Array(items) = response else {
            panic!("expected array completion response");
        };

        assert!(items.iter().any(|item| item.label == "value"));
        assert!(items.iter().all(|item| !item.label.is_empty()));
    }

    #[tokio::test]
    async fn completion_returns_project_candidates_for_proj_document() {
        let (service, _socket) = LspService::new(Backend::new);
        let server = service.inner();
        let doc_uri = uri("file:///Project.proj");
        open_document(server, doc_uri.clone(), "hcl", "pro".to_string()).await;

        let response = server
            .completion(CompletionParams {
                text_document_position: TextDocumentPositionParams {
                    text_document: TextDocumentIdentifier { uri: doc_uri },
                    position: Position::new(0, 3),
                },
                work_done_progress_params: WorkDoneProgressParams::default(),
                partial_result_params: PartialResultParams::default(),
                context: None,
            })
            .await
            .expect("completion request should succeed")
            .expect("completion should return result");

        let CompletionResponse::Array(items) = response else {
            panic!("expected array completion response");
        };

        assert!(items.iter().any(|item| item.label == "project"));
    }

    #[tokio::test]
    async fn hover_returns_project_schema_hint_for_proj_document() {
        let (service, _socket) = LspService::new(Backend::new);
        let server = service.inner();
        let doc_uri = uri("file:///Project.proj");
        open_document(server, doc_uri.clone(), "hcl", "project {\n}".to_string()).await;

        let response = server
            .hover(HoverParams {
                text_document_position_params: TextDocumentPositionParams {
                    text_document: TextDocumentIdentifier { uri: doc_uri },
                    position: Position::new(0, 1),
                },
                work_done_progress_params: WorkDoneProgressParams::default(),
            })
            .await
            .expect("hover request should succeed")
            .expect("hover should return result");

        let HoverContents::Markup(content) = response.contents else {
            panic!("expected markdown hover content");
        };

        assert!(content.value.contains("project"));
    }
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

        let Some(program) = parse_program(&doc.text) else {
            return Ok(Some(Vec::new()));
        };

        let offset = position_to_offset(&doc.text, text_document_position.position);
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

}
