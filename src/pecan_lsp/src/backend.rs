use tokio::sync::RwLock;
use serde_json::json;
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

    async fn open_sample_document(server: &Backend, uri: Uri) {
        server
            .did_open(DidOpenTextDocumentParams {
                text_document: TextDocumentItem {
                    uri,
                    language_id: "pecan".to_string(),
                    version: 1,
                    text: sample_source(),
                },
            })
            .await;
    }

    #[tokio::test]
    async fn references_include_declaration_returns_all_occurrences() {
        let (service, _socket) = LspService::new(Backend::new);
        let server = service.inner();
        let doc_uri = uri("file:///references_test.pn");
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
        let doc_uri = uri("file:///completion_test.pn");
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
            .log_message(MessageType::INFO, "Pecan LSP initialized")
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

        let Some(program) = parse_program(&doc.text) else {
            return Ok(None);
        };
        let symbols = collect_top_level_symbols(&program);
        let offset = position_to_offset(&doc.text, text_document_position.position);

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

        let Some(program) = parse_program(&doc.text) else {
            return Ok(None);
        };
        let symbols = collect_top_level_symbols(&program);
        let offset = position_to_offset(&doc.text, text_document_position.position);

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

        let Some(program) = parse_program(&doc.text) else {
            return Ok(Some(CompletionResponse::Array(Vec::new())));
        };

        let offset = position_to_offset(&doc.text, text_document_position.position);
        let prefix = completion_prefix_at_offset(&doc.text, offset).to_lowercase();

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
