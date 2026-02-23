use crate::errors::CodegenError;
use crate::lowering::context::CodegenResult;
use pecan_analysis::hir::HirPrimitiveType;
use pecan_analysis::syntax::SpanInfo;
use pecan_analysis::types::{TypeId, TypeInfo, TypeResult};
use std::collections::HashSet;

pub(crate) fn ensure_type_compatibility(
    span: SpanInfo,
    expected: TypeId,
    actual: TypeId,
    type_result: &TypeResult,
) -> CodegenResult<()> {
    if expected == actual {
        return Ok(());
    }

    let expected_info = type_result.types.get(expected);
    let actual_info = type_result.types.get(actual);
    if is_numeric_type(expected_info) && is_numeric_type(actual_info) {
        let has_intent = type_result
            .cast_intents_for_span(span)
            .any(|intent| intent.from == actual && intent.to == expected);
        if has_intent {
            return Ok(());
        }
        return Err(CodegenError::MissingCastIntent {
            span,
            expected,
            actual,
        });
    }

    Err(CodegenError::TypeMismatch {
        span,
        expected,
        actual,
    })
}

pub(crate) fn validate_cast_intents(type_result: &TypeResult) -> Vec<CodegenError> {
    let mut errors = Vec::new();
    let mut seen = HashSet::new();
    let mut reverse_seen = HashSet::new();

    for intent in &type_result.cast_intents {
        let from_info = type_result.types.get(intent.from);
        let to_info = type_result.types.get(intent.to);

        if !is_numeric_type(from_info) || !is_numeric_type(to_info) {
            errors.push(CodegenError::InvalidCastIntent {
                span: intent.span,
                message: "cast intents must be numeric-to-numeric".to_string(),
            });
        }

        let key = (intent.span.start, intent.span.end, intent.from.0, intent.to.0);
        let reverse_key = (intent.span.start, intent.span.end, intent.to.0, intent.from.0);
        if !seen.insert(key) {
            errors.push(CodegenError::InvalidCastIntent {
                span: intent.span,
                message: "duplicate cast intent for span".to_string(),
            });
        }
        if reverse_seen.contains(&key) || seen.contains(&reverse_key) {
            errors.push(CodegenError::InvalidCastIntent {
                span: intent.span,
                message: "conflicting reverse cast intents for same span".to_string(),
            });
        }
        reverse_seen.insert(reverse_key);
    }

    errors
}

fn is_numeric_type(info: Option<&TypeInfo>) -> bool {
    matches!(
        info,
        Some(TypeInfo::Primitive(
            HirPrimitiveType::I32
                | HirPrimitiveType::I64
                | HirPrimitiveType::U8
                | HirPrimitiveType::F64
        ))
    )
}
