use beskid_lsp::server::backend::Backend;
use tower_lsp_server::LanguageServer;
use tower_lsp_server::LspService;
use tower_lsp_server::ls_types::*;

use super::support::{open_sample_document, uri};

#[tokio::test]
async fn include_declaration_returns_all_occurrences() {
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
