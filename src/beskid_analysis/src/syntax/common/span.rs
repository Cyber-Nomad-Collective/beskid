use pest::Span;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct SpanInfo {
    pub start: usize,
    pub end: usize,
    pub line_col_start: (usize, usize),
    pub line_col_end: (usize, usize),
}

impl SpanInfo {
    pub fn from_span(span: &Span) -> Self {
        let start_pos = span.start_pos();
        let end_pos = span.end_pos();
        Self {
            start: start_pos.pos(),
            end: end_pos.pos(),
            line_col_start: start_pos.line_col(),
            line_col_end: end_pos.line_col(),
        }
    }
}

pub trait HasSpan {
    fn span(&self) -> &SpanInfo;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Spanned<T> {
    pub node: T,
    pub span: SpanInfo,
}

impl<T> Spanned<T> {
    pub fn new(node: T, span: SpanInfo) -> Self {
        Self { node, span }
    }
}

impl<T> HasSpan for Spanned<T> {
    fn span(&self) -> &SpanInfo {
        &self.span
    }
}
