use tower_lsp_server::ls_types::{GotoDefinitionResponse, Location, Uri};

use crate::features::project_manifest::api as project_manifest;
use crate::position::{offset_in_range, offset_range_to_lsp};
use crate::session::store::Document;

pub fn handle_definition(
    uri: &Uri,
    doc: &Document,
    offset: usize,
) -> Option<GotoDefinitionResponse> {
    if project_manifest::is_manifest_uri(uri) {
        let location = project_manifest::dependency_path_location(uri, &doc.text, offset)?;
        return Some(GotoDefinitionResponse::Scalar(location));
    }

    let analysis = doc.analysis.as_ref()?;
    if let Some(definition) = beskid_analysis::services::definition_at_offset(analysis, offset) {
        return Some(GotoDefinitionResponse::Scalar(Location {
            uri: uri.clone(),
            range: offset_range_to_lsp(&doc.text, definition.start, definition.end),
        }));
    }

    let symbols = beskid_analysis::services::collect_document_symbols(analysis);
    symbols
        .iter()
        .find(|symbol| offset_in_range(offset, symbol.selection_start, symbol.selection_end))
        .map(|symbol| {
            GotoDefinitionResponse::Scalar(Location {
                uri: uri.clone(),
                range: offset_range_to_lsp(&doc.text, symbol.selection_start, symbol.selection_end),
            })
        })
}
