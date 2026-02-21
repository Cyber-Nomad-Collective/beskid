use crate::syntax::SpanInfo;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ResolveError {
    DuplicateItem { name: String, span: SpanInfo, previous: SpanInfo },
}

pub type ResolveResult<T> = Result<T, Vec<ResolveError>>;
