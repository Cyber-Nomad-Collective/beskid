use std::str::FromStr;

use beskid_lsp::server::backend::Backend;
use tower_lsp_server::LanguageServer;
use tower_lsp_server::ls_types::*;

pub fn uri(path: &str) -> Uri {
    Uri::from_str(path).expect("valid URI")
}

pub fn sample_source() -> String {
    [
        "i32 main() {",
        "    i32 mut value = 1;",
        "    i32 mut total = value + value;",
        "    return value;",
        "}",
    ]
    .join("\n")
}

pub fn semantic_tokens_params(uri: Uri) -> SemanticTokensParams {
    SemanticTokensParams {
        work_done_progress_params: WorkDoneProgressParams::default(),
        partial_result_params: PartialResultParams::default(),
        text_document: TextDocumentIdentifier { uri },
    }
}

pub async fn open_document(server: &Backend, uri: Uri, language_id: &str, text: String) {
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

pub async fn change_document(server: &Backend, uri: Uri, version: i32, text: String) {
    server
        .did_change(DidChangeTextDocumentParams {
            text_document: VersionedTextDocumentIdentifier { uri, version },
            content_changes: vec![TextDocumentContentChangeEvent {
                range: None,
                range_length: None,
                text,
            }],
        })
        .await;
}

pub async fn open_sample_document(server: &Backend, uri: Uri) {
    open_document(server, uri, "beskid", sample_source()).await;
}
