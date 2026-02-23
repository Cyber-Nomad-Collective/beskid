use crate::syntax::SpanInfo;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ResolveError {
    DuplicateItem { name: String, span: SpanInfo, previous: SpanInfo },
    DuplicateLocal { name: String, span: SpanInfo, previous: SpanInfo },
    UnknownValue { name: String, span: SpanInfo },
    UnknownType { name: String, span: SpanInfo },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ResolveWarning {
    ShadowedLocal { name: String, span: SpanInfo, previous: SpanInfo },
}

pub type ResolveResult<T> = Result<T, Vec<ResolveError>>;
