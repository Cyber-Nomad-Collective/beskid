use tower_lsp_server::ls_types::{CompletionItem, CompletionResponse, Uri};

use crate::adapters::completion::analysis_completion_kind_to_lsp;
use crate::features::project_manifest::api as project_manifest;
use crate::session::store::Document;

pub fn handle_completion(uri: &Uri, doc: &Document, offset: usize) -> CompletionResponse {
    let prefix = project_manifest::completion_prefix_at_offset(&doc.text, offset).to_lowercase();

    if project_manifest::is_manifest_uri(uri) {
        let mut items: Vec<CompletionItem> = project_manifest::completion_candidates()
            .into_iter()
            .filter(|(label, _, _)| {
                prefix.is_empty() || label.to_lowercase().starts_with(prefix.as_str())
            })
            .map(|(label, kind, detail)| CompletionItem {
                label: label.to_string(),
                kind: Some(kind),
                detail: Some(detail.to_string()),
                ..CompletionItem::default()
            })
            .collect();
        items.sort_by(|left, right| left.label.cmp(&right.label));
        return CompletionResponse::Array(items);
    }

    let mut items: Vec<CompletionItem> = doc
        .analysis
        .as_ref()
        .map(|analysis| {
            beskid_analysis::services::completion_candidates(analysis)
                .into_iter()
                .filter(|candidate| {
                    prefix.is_empty() || candidate.label.to_lowercase().starts_with(prefix.as_str())
                })
                .map(|candidate| CompletionItem {
                    label: candidate.label,
                    kind: Some(analysis_completion_kind_to_lsp(candidate.kind)),
                    detail: candidate.detail,
                    ..CompletionItem::default()
                })
                .collect()
        })
        .unwrap_or_default();

    items.sort_by(|left, right| left.label.cmp(&right.label));
    items.dedup_by(|left, right| left.label == right.label && left.kind == right.kind);
    items.truncate(200);
    CompletionResponse::Array(items)
}
