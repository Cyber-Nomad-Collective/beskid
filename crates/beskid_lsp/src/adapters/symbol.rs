use beskid_analysis::services::AnalysisSymbolKind;
use tower_lsp_server::ls_types::SymbolKind;

pub fn analysis_symbol_kind_to_lsp(kind: AnalysisSymbolKind) -> SymbolKind {
    match kind {
        AnalysisSymbolKind::Function => SymbolKind::FUNCTION,
        AnalysisSymbolKind::Method => SymbolKind::METHOD,
        AnalysisSymbolKind::Type => SymbolKind::STRUCT,
        AnalysisSymbolKind::Enum => SymbolKind::ENUM,
        AnalysisSymbolKind::Contract => SymbolKind::INTERFACE,
        AnalysisSymbolKind::Module => SymbolKind::MODULE,
        AnalysisSymbolKind::Use => SymbolKind::NAMESPACE,
    }
}
