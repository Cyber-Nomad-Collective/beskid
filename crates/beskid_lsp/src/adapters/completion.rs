use beskid_analysis::services::CompletionKind;
use tower_lsp_server::ls_types::CompletionItemKind;

pub fn analysis_completion_kind_to_lsp(kind: CompletionKind) -> CompletionItemKind {
    match kind {
        CompletionKind::Function => CompletionItemKind::FUNCTION,
        CompletionKind::Method => CompletionItemKind::METHOD,
        CompletionKind::Struct => CompletionItemKind::STRUCT,
        CompletionKind::Enum => CompletionItemKind::ENUM,
        CompletionKind::Interface => CompletionItemKind::INTERFACE,
        CompletionKind::Module => CompletionItemKind::MODULE,
        CompletionKind::EnumMember => CompletionItemKind::ENUM_MEMBER,
        CompletionKind::Variable => CompletionItemKind::VARIABLE,
        CompletionKind::Text => CompletionItemKind::TEXT,
    }
}
