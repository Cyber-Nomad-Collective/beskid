use beskid_lsp::server::backend::Backend;
use tower_lsp_server::LanguageServer;
use tower_lsp_server::LspService;
use tower_lsp_server::ls_types::*;

use super::support::{open_document, uri};

#[tokio::test]
async fn returns_project_schema_hint_for_proj_document() {
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
