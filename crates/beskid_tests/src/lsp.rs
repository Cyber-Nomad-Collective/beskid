use std::str::FromStr;

use beskid_lsp::backend::Backend;
use tower_lsp_server::LanguageServer;
use tower_lsp_server::LspService;
use tower_lsp_server::ls_types::*;

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

fn semantic_tokens_params(uri: Uri) -> SemanticTokensParams {
    SemanticTokensParams {
        work_done_progress_params: WorkDoneProgressParams::default(),
        partial_result_params: PartialResultParams::default(),
        text_document: TextDocumentIdentifier { uri },
    }
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

#[tokio::test]
async fn semantic_tokens_full_returns_highlights_for_open_document() {
    let (service, _socket) = LspService::new(Backend::new);
    let server = service.inner();
    let doc_uri = uri("file:///semantic_tokens_test.bd");
    open_sample_document(server, doc_uri.clone()).await;

    let response = server
        .semantic_tokens_full(semantic_tokens_params(doc_uri))
        .await
        .expect("semantic tokens request should succeed")
        .expect("semantic tokens should return result");

    let SemanticTokensResult::Tokens(tokens) = response else {
        panic!("expected full semantic tokens result");
    };

    assert!(!tokens.data.is_empty());
}
