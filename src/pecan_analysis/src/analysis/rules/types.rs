use crate::analysis::diagnostics::Severity;
use crate::analysis::rules::RuleContext;
use crate::types::TypeError;

pub(crate) fn emit_type_error(ctx: &mut RuleContext, error: TypeError) {
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
            ctx.emit_simple(
                span,
                "E1206",
                format!("type mismatch: expected {expected:?}, got {actual:?}"),
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
            ctx.emit_simple(
                span,
                "E1305",
                format!("match arm type mismatch: expected {expected:?}, got {actual:?}"),
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
            ctx.emit_simple(
                span,
                "E1205",
                format!("call argument mismatch: expected {expected:?}, got {actual:?}"),
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
            ctx.emit_simple(
                span,
                "E1207",
                format!("return type mismatch: expected {expected:?}, got {actual:?}"),
                "return type mismatch",
                None,
                Severity::Error,
            );
        }
    }
}
