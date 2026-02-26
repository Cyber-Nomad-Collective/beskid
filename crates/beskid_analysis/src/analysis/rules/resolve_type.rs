use crate::analysis::rules::{Rule, RuleContext, resolve, types};
use crate::hir::{AstProgram, HirProgram, lower_program};
use crate::resolve::Resolver;
use crate::syntax::{Program, SpanInfo, Spanned};
use crate::types::type_program_with_errors;

pub struct ResolveAndTypeRule;

impl Rule for ResolveAndTypeRule {
    fn name(&self) -> &'static str {
        "resolve_and_type"
    }

    fn run(&self, ctx: &mut RuleContext, program: &Program) {
        let span = program
            .items
            .first()
            .map(|item| item.span)
            .unwrap_or(SpanInfo {
                start: 0,
                end: 0,
                line_col_start: (1, 1),
                line_col_end: (1, 1),
            });
        let spanned_program = Spanned::new(program.clone(), span);
        let ast: Spanned<AstProgram> = spanned_program.into();
        let hir: Spanned<HirProgram> = lower_program(&ast);
        let mut resolver = Resolver::new();
        let resolution = match resolver.resolve_program(&hir) {
            Ok(resolution) => resolution,
            Err(errors) => {
                for error in errors {
                    resolve::emit_resolve_error(ctx, error);
                }
                return;
            }
        };
        for warning in &resolution.warnings {
            resolve::emit_resolve_warning(ctx, warning);
        }
        let (typed, errors) = type_program_with_errors(&hir, &resolution);
        if errors.is_empty() {
            types::emit_cast_intent_warnings(ctx, &typed);
            return;
        }
        for error in errors {
            types::emit_type_error(ctx, error, Some(&typed));
        }
    }
}
