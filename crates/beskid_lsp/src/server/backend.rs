use tokio::sync::RwLock;
use tower_lsp_server::jsonrpc::Result;
use tower_lsp_server::ls_types::*;
use tower_lsp_server::{Client, LanguageServer};

use crate::features::{
    completion, definition, document_symbols, hover, references, semantic_tokens,
};
use crate::protocol::request::{snapshot_document, snapshot_lsp_request};
use crate::server::init::initialize_result;
use crate::session::lifecycle::{publish_diagnostics_for_uri, remove_document, set_document};
use crate::session::store::State;

pub struct Backend {
    client: Client,
    state: RwLock<State>,
}

impl Backend {
    pub fn new(client: Client) -> Self {
        Self {
            client,
            state: RwLock::new(State::default()),
        }
    }
}

impl LanguageServer for Backend {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        Ok(initialize_result())
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
        set_document(&self.state, doc.uri.clone(), doc.version, doc.text).await;
        publish_diagnostics_for_uri(&self.client, &self.state, &doc.uri).await;
    }

    async fn did_change(&self, params: DidChangeTextDocumentParams) {
        if let Some(change) = params.content_changes.into_iter().last() {
            set_document(
                &self.state,
                params.text_document.uri.clone(),
                params.text_document.version,
                change.text,
            )
            .await;
            publish_diagnostics_for_uri(&self.client, &self.state, &params.text_document.uri).await;
        }
    }

    async fn did_save(&self, params: DidSaveTextDocumentParams) {
        publish_diagnostics_for_uri(&self.client, &self.state, &params.text_document.uri).await;
    }

    async fn did_close(&self, params: DidCloseTextDocumentParams) {
        remove_document(&self.state, &params.text_document.uri).await;
        self.client
            .publish_diagnostics(params.text_document.uri, Vec::new(), None)
            .await;
    }

    async fn hover(&self, params: HoverParams) -> Result<Option<Hover>> {
        let Some(snapshot) = snapshot_lsp_request(&self.state, params).await else {
            return Ok(None);
        };
        Ok(hover::handler::handle_hover(
            &snapshot.uri,
            &snapshot.document,
            snapshot.offset,
        ))
    }

    async fn goto_definition(
        &self,
        params: GotoDefinitionParams,
    ) -> Result<Option<GotoDefinitionResponse>> {
        let Some(snapshot) = snapshot_lsp_request(&self.state, params).await else {
            return Ok(None);
        };
        Ok(definition::handler::handle_definition(
            &snapshot.uri,
            &snapshot.document,
            snapshot.offset,
        ))
    }

    async fn references(&self, params: ReferenceParams) -> Result<Option<Vec<Location>>> {
        let include_declaration = params.context.include_declaration;
        let Some(snapshot) = snapshot_lsp_request(&self.state, params).await else {
            return Ok(Some(Vec::new()));
        };
        Ok(Some(references::handler::handle_references(
            &snapshot.uri,
            &snapshot.document,
            snapshot.offset,
            include_declaration,
        )))
    }

    async fn completion(&self, params: CompletionParams) -> Result<Option<CompletionResponse>> {
        let Some(snapshot) = snapshot_lsp_request(&self.state, params).await else {
            return Ok(Some(CompletionResponse::Array(Vec::new())));
        };
        Ok(Some(completion::handler::handle_completion(
            &snapshot.uri,
            &snapshot.document,
            snapshot.offset,
        )))
    }

    async fn document_symbol(
        &self,
        params: DocumentSymbolParams,
    ) -> Result<Option<DocumentSymbolResponse>> {
        let uri = params.text_document.uri;
        let Some(document) = snapshot_document(&self.state, &uri).await else {
            return Ok(Some(DocumentSymbolResponse::Nested(Vec::new())));
        };
        Ok(Some(document_symbols::handler::handle_document_symbols(
            &uri, &document,
        )))
    }

    async fn semantic_tokens_full(
        &self,
        params: SemanticTokensParams,
    ) -> Result<Option<SemanticTokensResult>> {
        let uri = params.text_document.uri;
        let Some(document) = snapshot_document(&self.state, &uri).await else {
            return Ok(None);
        };
        Ok(Some(semantic_tokens::handler::handle_semantic_tokens(
            &document,
        )))
    }
}
