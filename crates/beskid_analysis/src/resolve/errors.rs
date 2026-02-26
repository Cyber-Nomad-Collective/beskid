use crate::syntax::SpanInfo;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ResolveError {
    DuplicateItem { name: String, span: SpanInfo, previous: SpanInfo },
    DuplicateLocal { name: String, span: SpanInfo, previous: SpanInfo },
    UnknownValue { name: String, span: SpanInfo },
    UnknownType { name: String, span: SpanInfo },
    UnknownModulePath { path: String, span: SpanInfo },
    UnknownValueInModule {
        module_path: String,
        name: String,
        span: SpanInfo,
    },
    UnknownTypeInModule {
        module_path: String,
        name: String,
        span: SpanInfo,
    },
    PrivateItemInModule {
        module_path: String,
        name: String,
        span: SpanInfo,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ResolveWarning {
    ShadowedLocal { name: String, span: SpanInfo, previous: SpanInfo },
}

pub type ResolveResult<T> = Result<T, Vec<ResolveError>>;
