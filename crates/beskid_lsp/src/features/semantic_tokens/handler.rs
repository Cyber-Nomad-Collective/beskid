use tower_lsp_server::ls_types::{SemanticTokens, SemanticTokensResult};

use crate::features::semantic_tokens::encoder::build_semantic_tokens;
use crate::position::offset_to_position;
use crate::session::store::Document;

pub fn handle_semantic_tokens(doc: &Document) -> SemanticTokensResult {
    SemanticTokensResult::Tokens(SemanticTokens {
        result_id: None,
        data: build_semantic_tokens(&doc.text, doc.analysis.as_ref(), offset_to_position),
    })
}
