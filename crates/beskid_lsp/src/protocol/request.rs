use tokio::sync::RwLock;
use tower_lsp_server::ls_types::{TextDocumentPositionParams, Uri};

use crate::position::position_to_offset;
use crate::protocol::params::IntoTextDocumentPosition;
use crate::session::store::{Document, State};

#[derive(Debug, Clone)]
pub struct DocumentRequestSnapshot {
    pub uri: Uri,
    pub document: Document,
    pub offset: usize,
}

pub async fn snapshot_document(state: &RwLock<State>, uri: &Uri) -> Option<Document> {
    let state = state.read().await;
    state.docs.get(uri).cloned()
}

pub async fn snapshot_request(
    state: &RwLock<State>,
    request: TextDocumentPositionParams,
) -> Option<DocumentRequestSnapshot> {
    let uri = request.text_document.uri;
    let document = snapshot_document(state, &uri).await?;
    let offset = position_to_offset(&document.text, request.position);
    Some(DocumentRequestSnapshot {
        uri,
        document,
        offset,
    })
}

pub async fn snapshot_lsp_request<P>(
    state: &RwLock<State>,
    request: P,
) -> Option<DocumentRequestSnapshot>
where
    P: IntoTextDocumentPosition,
{
    snapshot_request(state, request.into_text_document_position()).await
}
