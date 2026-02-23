use crate::analysis::diagnostics::Severity;
use crate::analysis::rules::RuleContext;
use crate::resolve::{ResolveError, ResolveWarning};

pub(crate) fn emit_resolve_error(ctx: &mut RuleContext, error: ResolveError) {
    match error {
        ResolveError::DuplicateItem {
            name,
            span,
            previous,
        } => {
            let help = Some(format!(
                "previously defined at line {}, column {}",
                previous.line_col_start.0, previous.line_col_start.1
            ));
            ctx.emit_simple(
                span,
                "E1102",
                format!("duplicate item `{name}`"),
                "duplicate item",
                help,
                Severity::Error,
            );
        }
        ResolveError::DuplicateLocal {
            name,
            span,
            previous,
        } => {
            let help = Some(format!(
                "previously defined at line {}, column {}",
                previous.line_col_start.0, previous.line_col_start.1
            ));
            ctx.emit_simple(
                span,
                "E1102",
                format!("duplicate local `{name}`"),
                "duplicate local",
                help,
                Severity::Error,
            );
        }
        ResolveError::UnknownValue { name, span } => {
            ctx.emit_simple(
                span,
                "E1101",
                format!("unknown value `{name}`"),
                "unknown value",
                None,
                Severity::Error,
            );
        }
        ResolveError::UnknownType { name, span } => {
            ctx.emit_simple(
                span,
                "E1201",
                format!("unknown type `{name}`"),
                "unknown type",
                None,
                Severity::Error,
            );
        }
    }
}

pub(crate) fn emit_resolve_warning(ctx: &mut RuleContext, warning: &ResolveWarning) {
    match warning {
        ResolveWarning::ShadowedLocal {
            name,
            span,
            previous,
        } => {
            let help = Some(format!(
                "previously defined at line {}, column {}",
                previous.line_col_start.0, previous.line_col_start.1
            ));
            ctx.emit_simple(
                *span,
                "W1103",
                format!("shadowed local `{name}`"),
                "shadowed local",
                help,
                Severity::Warning,
            );
        }
    }
}
