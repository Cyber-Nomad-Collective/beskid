use crate::errors::CodegenError;
use crate::lowering::context::CodegenResult;
use cranelift_codegen::ir::{InstBuilder, Value};
use cranelift_frontend::FunctionBuilder;
use pecan_analysis::hir::HirPrimitiveType;
use pecan_analysis::syntax::SpanInfo;
use pecan_analysis::types::{TypeId, TypeInfo, TypeResult};
use std::collections::HashSet;

pub(crate) fn ensure_type_compatibility(
    span: SpanInfo,
    expected: TypeId,
    actual: TypeId,
    type_result: &TypeResult,
    builder: &mut FunctionBuilder,
    mut value: Value,
) -> CodegenResult<Value> {
    if expected == actual {
        return Ok(value);
    }

    let expected_info = type_result.types.get(expected);
    let actual_info = type_result.types.get(actual);
    
    if is_numeric_type(expected_info) && is_numeric_type(actual_info) {
        if let (
            Some(TypeInfo::Primitive(expected_prim)),
            Some(TypeInfo::Primitive(actual_prim)),
        ) = (expected_info, actual_info)
        {
            let expected_width = expected_prim.bit_width();
            let actual_width = actual_prim.bit_width();
            let target_ty = crate::lowering::types::map_primitive_to_clif(*expected_prim)
                .expect("expected clif type for numeric cast");
                
            if expected_width > actual_width {
                value = builder.ins().sextend(target_ty, value);
            } else if expected_width < actual_width {
                value = builder.ins().ireduce(target_ty, value);
            }
            return Ok(value);
        }
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
