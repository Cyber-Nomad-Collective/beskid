use crate::analysis::diagnostic_kinds::SemanticIssueKind;
use crate::analysis::rules::RuleContext;
use crate::resolve::{ResolveError, ResolveWarning};

pub(crate) fn emit_resolve_error(ctx: &mut RuleContext, error: ResolveError) {
    match error {
        ResolveError::DuplicateItem {
            name,
            span,
            previous,
        } => {
            ctx.emit_issue(
                span,
                SemanticIssueKind::ResolveDuplicateItem { name, previous },
            );
        }
        ResolveError::DuplicateLocal {
            name,
            span,
            previous,
        } => {
            ctx.emit_issue(
                span,
                SemanticIssueKind::ResolveDuplicateLocal { name, previous },
            );
        }
        ResolveError::UnknownValue { name, span } => {
            ctx.emit_issue(span, SemanticIssueKind::ResolveUnknownValue { name });
        }
        ResolveError::UnknownType { name, span } => {
            ctx.emit_issue(span, SemanticIssueKind::ResolveUnknownType { name });
        }
        ResolveError::UnknownModulePath { path, span } => {
            ctx.emit_issue(span, SemanticIssueKind::ResolveUnknownModulePath { path });
        }
        ResolveError::UnknownValueInModule {
            module_path,
            name,
            span,
        } => {
            ctx.emit_issue(
                span,
                SemanticIssueKind::ResolveUnknownValueInModule { module_path, name },
            );
        }
        ResolveError::UnknownTypeInModule {
            module_path,
            name,
            span,
        } => {
            ctx.emit_issue(
                span,
                SemanticIssueKind::ResolveUnknownTypeInModule { module_path, name },
            );
        }
        ResolveError::PrivateItemInModule {
            module_path,
            name,
            span,
        } => {
            ctx.emit_issue(
                span,
                SemanticIssueKind::ResolvePrivateItemInModule { module_path, name },
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
            ctx.emit_issue(
                *span,
                SemanticIssueKind::ResolveShadowedLocal {
                    name: name.clone(),
                    previous: *previous,
                },
            );
        }
    }
}
