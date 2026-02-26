use pest::Span;

use crate::syntax::SpanInfo;

pub(crate) fn span_from_bounds(input: &str, start: usize, end: usize) -> Option<SpanInfo> {
    let span = Span::new(input, start, end)?;
    Some(SpanInfo::from_span(&span))
}

pub(crate) fn span_from_range(
    input: &str,
    start: usize,
    end: usize,
    op_text: &str,
) -> Option<SpanInfo> {
    let op_start = if op_text.is_empty() {
        start
    } else {
        let between = input.get(start..end)?;
        start + between.find(op_text)?
    };
    let op_end = if op_text.is_empty() {
        end
    } else {
        op_start + op_text.len()
    };
    let span = Span::new(input, op_start, op_end)?;
    Some(SpanInfo::from_span(&span))
}
