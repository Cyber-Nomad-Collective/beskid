use tower_lsp_server::ls_types::{Location, Uri};

use crate::features::project_manifest::api as project_manifest;
use crate::position::offset_range_to_lsp;
use crate::session::store::Document;

pub fn handle_references(
    uri: &Uri,
    doc: &Document,
    offset: usize,
    include_declaration: bool,
) -> Vec<Location> {
    if project_manifest::is_manifest_uri(uri) {
        return project_manifest::token_references(&doc.text, offset)
            .into_iter()
            .map(|(start, end)| Location {
                uri: uri.clone(),
                range: offset_range_to_lsp(&doc.text, start, end),
            })
            .collect();
    }

    doc.analysis
        .as_ref()
        .map(|analysis| {
            beskid_analysis::services::references_at_offset(analysis, offset, include_declaration)
                .into_iter()
                .map(|reference| Location {
                    uri: uri.clone(),
                    range: offset_range_to_lsp(&doc.text, reference.start, reference.end),
                })
                .collect()
        })
        .unwrap_or_default()
}
