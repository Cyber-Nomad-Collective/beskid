use beskid_lsp::server::backend::Backend;
use tower_lsp_server::LanguageServer;
use tower_lsp_server::LspService;
use tower_lsp_server::ls_types::*;

use super::support::{change_document, open_document, open_sample_document, uri};

#[tokio::test]
async fn returns_matching_local_candidate() {
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
async fn returns_project_candidates_for_proj_document() {
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
async fn ignores_stale_document_change_version() {
    let (service, _socket) = LspService::new(Backend::new);
    let server = service.inner();
    let doc_uri = uri("file:///completion_stale_version_test.bd");
    open_sample_document(server, doc_uri.clone()).await;

    change_document(
        server,
        doc_uri.clone(),
        0,
        "i32 main() { return 0; }".to_string(),
    )
    .await;

    let response = server
        .completion(CompletionParams {
            text_document_position: TextDocumentPositionParams {
                text_document: TextDocumentIdentifier { uri: doc_uri },
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

    assert!(!items.is_empty());
    assert!(items.iter().any(|item| item.label == "value"));
}
