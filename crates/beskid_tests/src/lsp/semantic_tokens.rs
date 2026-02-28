use beskid_lsp::server::backend::Backend;
use tower_lsp_server::LanguageServer;
use tower_lsp_server::LspService;
use tower_lsp_server::ls_types::*;

use super::support::{open_sample_document, semantic_tokens_params, uri};

#[tokio::test]
async fn full_returns_highlights_for_open_document() {
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

#[tokio::test]
async fn full_returns_none_after_document_close() {
    let (service, _socket) = LspService::new(Backend::new);
    let server = service.inner();
    let doc_uri = uri("file:///semantic_tokens_closed_test.bd");
    open_sample_document(server, doc_uri.clone()).await;

    server
        .did_close(DidCloseTextDocumentParams {
            text_document: TextDocumentIdentifier {
                uri: doc_uri.clone(),
            },
        })
        .await;

    let response = server
        .semantic_tokens_full(semantic_tokens_params(doc_uri))
        .await
        .expect("semantic tokens request should succeed");

    assert!(response.is_none());
}
