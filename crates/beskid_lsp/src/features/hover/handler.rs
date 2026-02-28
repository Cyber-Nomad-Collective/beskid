use tower_lsp_server::ls_types::{Hover, HoverContents, MarkupContent, MarkupKind, Uri};

use crate::features::project_manifest::api as project_manifest;
use crate::position::{offset_in_range, offset_range_to_lsp};
use crate::session::store::Document;

pub fn handle_hover(uri: &Uri, doc: &Document, offset: usize) -> Option<Hover> {
    if project_manifest::is_manifest_uri(uri) {
        if let Some(token) = project_manifest::token_at_offset(&doc.text, offset)
            && let Some(message) = project_manifest::hover_markdown(token)
        {
            return Some(Hover {
                contents: HoverContents::Markup(MarkupContent {
                    kind: MarkupKind::Markdown,
                    value: message.to_string(),
                }),
                range: None,
            });
        }
        return None;
    }

    let analysis = doc.analysis.as_ref()?;
    let symbols = beskid_analysis::services::collect_document_symbols(analysis);
    if let Some(symbol) = symbols
        .iter()
        .find(|symbol| offset_in_range(offset, symbol.selection_start, symbol.selection_end))
    {
        return Some(Hover {
            contents: HoverContents::Markup(MarkupContent {
                kind: MarkupKind::Markdown,
                value: format!(
                    "**{}** `{}`",
                    beskid_analysis::services::symbol_kind_name(symbol.kind),
                    symbol.name
                ),
            }),
            range: Some(offset_range_to_lsp(
                &doc.text,
                symbol.selection_start,
                symbol.selection_end,
            )),
        });
    }

    let hover = beskid_analysis::services::hover_at_offset(analysis, offset)?;
    Some(Hover {
        contents: HoverContents::Markup(MarkupContent {
            kind: MarkupKind::Markdown,
            value: hover.markdown,
        }),
        range: Some(offset_range_to_lsp(&doc.text, hover.start, hover.end)),
    })
}
