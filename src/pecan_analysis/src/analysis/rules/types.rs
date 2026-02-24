use crate::analysis::diagnostics::Severity;
use crate::analysis::rules::RuleContext;
use crate::types::{TypeError, TypeInfo, TypeResult};

pub(crate) fn emit_type_error(ctx: &mut RuleContext, error: TypeError, result: Option<&TypeResult>) {
    match error {
        TypeError::UnknownType { span } => {
            ctx.emit_simple(
                span,
                "E1201",
                "unknown type",
                "unknown type",
                None,
                Severity::Error,
            );
        }
        TypeError::UnknownValueType { span } => {
            ctx.emit_simple(
                span,
                "E1201",
                "unknown value type",
                "unknown value type",
                None,
                Severity::Error,
            );
        }
        TypeError::UnknownStructType { span } => {
            ctx.emit_simple(
                span,
                "E1201",
                "unknown struct type",
                "unknown struct type",
                None,
                Severity::Error,
            );
        }
        TypeError::InvalidMemberTarget { span } => {
            ctx.emit_simple(
                span,
                "E1213",
                "member access target is not a struct-like type",
                "invalid member access target",
                None,
                Severity::Error,
            );
        }
        TypeError::UnknownEnumType { span } => {
            ctx.emit_simple(
                span,
                "E1201",
                "unknown enum type",
                "unknown enum type",
                None,
                Severity::Error,
            );
        }
        TypeError::UnknownStructField { span, name } => {
            ctx.emit_simple(
                span,
                "E1211",
                format!("unknown struct field `{name}`"),
                "unknown struct field",
                None,
                Severity::Error,
            );
        }
        TypeError::UnknownEnumVariant { span, name } => {
            ctx.emit_simple(
                span,
                "E1301",
                format!("unknown enum variant `{name}`"),
                "unknown enum variant",
                None,
                Severity::Error,
            );
        }
        TypeError::MissingStructField { span, name } => {
            ctx.emit_simple(
                span,
                "E1212",
                format!("missing struct field `{name}`"),
                "missing struct field",
                None,
                Severity::Error,
            );
        }
        TypeError::MissingTypeAnnotation { span, name } => {
            ctx.emit_simple(
                span,
                "E1202",
                format!("missing type annotation for `{name}`"),
                "missing type annotation",
                None,
                Severity::Error,
            );
        }
        TypeError::TypeMismatch {
            span,
            expected,
            actual,
        } => {
            let expected_name = render_type(result, expected);
            let actual_name = render_type(result, actual);
            ctx.emit_simple(
                span,
                "E1206",
                format!("type mismatch: expected {expected_name}, got {actual_name}"),
                "type mismatch",
                None,
                Severity::Error,
            );
        }
        TypeError::MatchArmTypeMismatch {
            span,
            expected,
            actual,
        } => {
            let expected_name = render_type(result, expected);
            let actual_name = render_type(result, actual);
            ctx.emit_simple(
                span,
                "E1305",
                format!("match arm type mismatch: expected {expected_name}, got {actual_name}"),
                "match arm type mismatch",
                None,
                Severity::Error,
            );
        }
        TypeError::CallArityMismatch {
            span,
            expected,
            actual,
        } => {
            ctx.emit_simple(
                span,
                "E1204",
                format!("call arity mismatch: expected {expected}, got {actual}"),
                "call arity mismatch",
                None,
                Severity::Error,
            );
        }
        TypeError::CallArgumentMismatch {
            span,
            expected,
            actual,
        } => {
            let expected_name = render_type(result, expected);
            let actual_name = render_type(result, actual);
            ctx.emit_simple(
                span,
                "E1205",
                format!("call argument mismatch: expected {expected_name}, got {actual_name}"),
                "call argument mismatch",
                None,
                Severity::Error,
            );
        }
        TypeError::EnumConstructorMismatch {
            span,
            expected,
            actual,
        } => {
            ctx.emit_simple(
                span,
                "E1302",
                format!("enum constructor arity mismatch: expected {expected}, got {actual}"),
                "enum constructor arity mismatch",
                None,
                Severity::Error,
            );
        }
        TypeError::UnknownCallTarget { span } => {
            ctx.emit_simple(
                span,
                "E1606",
                "unknown call target",
                "unknown call target",
                None,
                Severity::Error,
            );
        }
        TypeError::InvalidBinaryOp { span } => {
            ctx.emit_simple(
                span,
                "E1209",
                "invalid binary operation",
                "invalid binary operation",
                None,
                Severity::Error,
            );
        }
        TypeError::InvalidUnaryOp { span } => {
            ctx.emit_simple(
                span,
                "E1210",
                "invalid unary operation",
                "invalid unary operation",
                None,
                Severity::Error,
            );
        }
        TypeError::NonBoolCondition { span } => {
            ctx.emit_simple(
                span,
                "E1208",
                "non-boolean condition",
                "condition must be boolean",
                None,
                Severity::Error,
            );
        }
        TypeError::UnsupportedExpression { span } => {
            ctx.emit_simple(
                span,
                "E1202",
                "unsupported expression",
                "unsupported expression",
                None,
                Severity::Error,
            );
        }
        TypeError::ReturnTypeMismatch {
            span,
            expected,
            actual,
        } => {
            let expected_name = render_type(result, expected);
            let actual_name = actual
                .map(|type_id| render_type(result, type_id))
                .unwrap_or_else(|| "unit".to_string());
            ctx.emit_simple(
                span,
                "E1207",
                format!("return type mismatch: expected {expected_name}, got {actual_name}"),
                "return type mismatch",
                None,
                Severity::Error,
            );
        }
    }
}

pub(crate) fn emit_cast_intent_warnings(ctx: &mut RuleContext, result: &TypeResult) {
    for intent in &result.cast_intents {
        let from = result
            .types
            .get(intent.from)
            .map(type_name)
            .unwrap_or_else(|| format!("{:?}", intent.from));
        let to = result
            .types
            .get(intent.to)
            .map(type_name)
            .unwrap_or_else(|| format!("{:?}", intent.to));
        ctx.emit_simple(
            intent.span,
            "W1203",
            format!("implicit numeric cast from {from} to {to}"),
            "implicit numeric cast",
            Some("add an explicit cast to make conversion intent clear".to_string()),
            Severity::Warning,
        );
    }
}

fn type_name(info: &TypeInfo) -> String {
    match info {
        TypeInfo::Primitive(primitive) => match primitive {
            crate::hir::HirPrimitiveType::Bool => "bool".to_string(),
            crate::hir::HirPrimitiveType::I32 => "i32".to_string(),
            crate::hir::HirPrimitiveType::I64 => "i64".to_string(),
            crate::hir::HirPrimitiveType::U8 => "u8".to_string(),
            crate::hir::HirPrimitiveType::F64 => "f64".to_string(),
            crate::hir::HirPrimitiveType::Char => "char".to_string(),
            crate::hir::HirPrimitiveType::String => "string".to_string(),
            crate::hir::HirPrimitiveType::Unit => "unit".to_string(),
        },
        TypeInfo::Named(item_id) => format!("Named({})", item_id.0),
    }
}

fn render_type(result: Option<&TypeResult>, type_id: crate::types::TypeId) -> String {
    let Some(result) = result else {
        return format!("type#{}", type_id.0);
    };
    let Some(info) = result.types.get(type_id) else {
        return format!("type#{}", type_id.0);
    };
    type_name(info)
}
