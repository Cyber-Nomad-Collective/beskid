use std::fmt;

use pecan_analysis::syntax::SpanInfo;
use pecan_analysis::types::TypeId;

#[derive(Debug)]
pub enum CodegenError {
    UnsupportedNode {
        span: SpanInfo,
        node: &'static str,
    },
    UnsupportedFeature(&'static str),
    MissingSymbol(&'static str),
    MissingResolvedValue {
        span: SpanInfo,
    },
    MissingLocalType {
        span: SpanInfo,
    },
    InvalidLocalBinding {
        span: SpanInfo,
    },
    MissingExpressionType {
        span: SpanInfo,
    },
    MissingCastIntent {
        span: SpanInfo,
        expected: TypeId,
        actual: TypeId,
    },
    InvalidCastIntent {
        span: SpanInfo,
        message: String,
    },
    TypeMismatch {
        span: SpanInfo,
        expected: TypeId,
        actual: TypeId,
    },
    VerificationFailed {
        function: String,
        message: String,
    },
}

impl fmt::Display for CodegenError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CodegenError::UnsupportedNode { node, .. } => {
                write!(f, "unsupported node for kickoff lowering: {node}")
            }
            CodegenError::UnsupportedFeature(feature) => {
                write!(f, "unsupported feature: {feature}")
            }
            CodegenError::MissingSymbol(symbol) => write!(f, "missing symbol: {symbol}"),
            CodegenError::MissingResolvedValue { .. } => {
                write!(f, "missing resolved value entry")
            }
            CodegenError::MissingLocalType { .. } => {
                write!(f, "missing local type information")
            }
            CodegenError::InvalidLocalBinding { .. } => {
                write!(f, "invalid local binding for kickoff lowering")
            }
            CodegenError::MissingExpressionType { .. } => {
                write!(f, "missing expression type information")
            }
            CodegenError::MissingCastIntent {
                expected, actual, ..
            } => {
                write!(
                    f,
                    "missing cast intent for numeric mismatch (expected {expected:?}, actual {actual:?})"
                )
            }
            CodegenError::InvalidCastIntent { message, .. } => {
                write!(f, "invalid cast intent: {message}")
            }
            CodegenError::TypeMismatch {
                expected, actual, ..
            } => {
                write!(
                    f,
                    "type mismatch during codegen (expected {expected:?}, actual {actual:?})"
                )
            }
            CodegenError::VerificationFailed { function, message } => {
                write!(f, "CLIF verification failed for `{function}`: {message}")
            }
        }
    }
}

impl std::error::Error for CodegenError {}
