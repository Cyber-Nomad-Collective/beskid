use serde_json::json;
use tower_lsp_server::ls_types::{
    DocumentSymbol, DocumentSymbolResponse, Range, SymbolKind, SymbolTag, Uri,
};

use crate::adapters::symbol::analysis_symbol_kind_to_lsp;
use crate::features::project_manifest::api as project_manifest;
use crate::position::offset_range_to_lsp;
use crate::session::store::Document;

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

pub fn handle_document_symbols(uri: &Uri, doc: &Document) -> DocumentSymbolResponse {
    if project_manifest::is_manifest_uri(uri) {
        return DocumentSymbolResponse::Nested(project_manifest::document_symbols(&doc.text));
    }

    let symbols = doc
        .analysis
        .as_ref()
        .map(beskid_analysis::services::collect_document_symbols)
        .unwrap_or_default();

    let mapped = symbols
        .into_iter()
        .map(|symbol| {
            let range =
                offset_range_to_lsp(&doc.text, symbol.selection_start, symbol.selection_end);
            build_document_symbol(
                symbol.name,
                Some(beskid_analysis::services::symbol_kind_name(symbol.kind).to_string()),
                analysis_symbol_kind_to_lsp(symbol.kind),
                Option::<Vec<SymbolTag>>::None,
                range,
                range,
            )
        })
        .collect();

    DocumentSymbolResponse::Nested(mapped)
}
