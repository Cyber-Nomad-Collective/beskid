use beskid_analysis::services::{AnalysisSymbolKind, DocumentAnalysisSnapshot};
use tower_lsp_server::ls_types::{
    SemanticToken, SemanticTokenModifier, SemanticTokenType, SemanticTokensLegend,
};

const TOKEN_TYPE_FUNCTION: u32 = 0;
const TOKEN_TYPE_METHOD: u32 = 1;
const TOKEN_TYPE_STRUCT: u32 = 2;
const TOKEN_TYPE_ENUM: u32 = 3;
const TOKEN_TYPE_INTERFACE: u32 = 4;
const TOKEN_TYPE_NAMESPACE: u32 = 5;

const TOKEN_MODIFIER_DECLARATION: u32 = 1;

#[derive(Debug, Clone)]
pub(crate) struct SemanticTokenCandidate {
    start: usize,
    end: usize,
    token_type: u32,
    token_modifiers_bitset: u32,
    priority: u8,
}

pub(crate) trait SemanticTokenSource {
    fn collect(
        &self,
        text: &str,
        analysis: Option<&DocumentAnalysisSnapshot>,
        out: &mut Vec<SemanticTokenCandidate>,
    );
}

struct SymbolSource;

impl SemanticTokenSource for SymbolSource {
    fn collect(
        &self,
        _text: &str,
        analysis: Option<&DocumentAnalysisSnapshot>,
        out: &mut Vec<SemanticTokenCandidate>,
    ) {
        push_semantic_symbol_tokens(analysis, out);
    }
}

static SYMBOL_SOURCE: SymbolSource = SymbolSource;
const DEFAULT_SOURCES: [&dyn SemanticTokenSource; 1] = [&SYMBOL_SOURCE];

pub fn semantic_token_legend() -> SemanticTokensLegend {
    SemanticTokensLegend {
        token_types: vec![
            SemanticTokenType::FUNCTION,
            SemanticTokenType::METHOD,
            SemanticTokenType::STRUCT,
            SemanticTokenType::ENUM,
            SemanticTokenType::INTERFACE,
            SemanticTokenType::NAMESPACE,
        ],
        token_modifiers: vec![SemanticTokenModifier::DECLARATION],
    }
}

fn push_semantic_symbol_tokens(
    analysis: Option<&DocumentAnalysisSnapshot>,
    out: &mut Vec<SemanticTokenCandidate>,
) {
    let Some(analysis) = analysis else {
        return;
    };

    for symbol in beskid_analysis::services::collect_document_symbols(analysis) {
        let token_type = match symbol.kind {
            AnalysisSymbolKind::Function => TOKEN_TYPE_FUNCTION,
            AnalysisSymbolKind::Method => TOKEN_TYPE_METHOD,
            AnalysisSymbolKind::Type => TOKEN_TYPE_STRUCT,
            AnalysisSymbolKind::Enum => TOKEN_TYPE_ENUM,
            AnalysisSymbolKind::Contract => TOKEN_TYPE_INTERFACE,
            AnalysisSymbolKind::Module | AnalysisSymbolKind::Use => TOKEN_TYPE_NAMESPACE,
        };

        out.push(SemanticTokenCandidate {
            start: symbol.selection_start,
            end: symbol.selection_end,
            token_type,
            token_modifiers_bitset: TOKEN_MODIFIER_DECLARATION,
            priority: 10,
        });
    }
}

pub fn build_semantic_tokens(
    text: &str,
    analysis: Option<&DocumentAnalysisSnapshot>,
    offset_to_position: impl Fn(&str, usize) -> tower_lsp_server::ls_types::Position,
) -> Vec<SemanticToken> {
    build_semantic_tokens_with_sources(text, analysis, &DEFAULT_SOURCES, offset_to_position)
}

pub(crate) fn build_semantic_tokens_with_sources(
    text: &str,
    analysis: Option<&DocumentAnalysisSnapshot>,
    sources: &[&dyn SemanticTokenSource],
    offset_to_position: impl Fn(&str, usize) -> tower_lsp_server::ls_types::Position,
) -> Vec<SemanticToken> {
    let mut candidates = Vec::new();
    for source in sources {
        source.collect(text, analysis, &mut candidates);
    }

    candidates.sort_by_key(|candidate| (candidate.start, candidate.end, candidate.priority));

    let mut merged: Vec<SemanticTokenCandidate> = Vec::with_capacity(candidates.len());
    for candidate in candidates {
        if let Some(last) = merged.last_mut()
            && last.start == candidate.start
            && last.end == candidate.end
        {
            if candidate.priority >= last.priority {
                *last = candidate;
            }
            continue;
        }
        merged.push(candidate);
    }

    let mut tokens = Vec::with_capacity(merged.len());
    let mut prev_line = 0u32;
    let mut prev_char = 0u32;

    for candidate in merged {
        if candidate.end <= candidate.start || candidate.end > text.len() {
            continue;
        }

        let start = offset_to_position(text, candidate.start);
        let end = offset_to_position(text, candidate.end);
        if start.line != end.line || end.character <= start.character {
            continue;
        }

        let delta_line = start.line.saturating_sub(prev_line);
        let delta_start = if delta_line == 0 {
            start.character.saturating_sub(prev_char)
        } else {
            start.character
        };

        tokens.push(SemanticToken {
            delta_line,
            delta_start,
            length: end.character.saturating_sub(start.character),
            token_type: candidate.token_type,
            token_modifiers_bitset: candidate.token_modifiers_bitset,
        });

        prev_line = start.line;
        prev_char = start.character;
    }

    tokens
}
