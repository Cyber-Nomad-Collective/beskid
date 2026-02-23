use crate::analysis::rules::{resolve, types, Rule, RuleContext};
use crate::hir::{lower_program, AstProgram, HirProgram};
use crate::resolve::Resolver;
use crate::syntax::{Program, SpanInfo, Spanned};
use crate::types::type_program;

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
        match type_program(&hir, &resolution) {
            Ok(result) => {
                types::emit_cast_intent_warnings(ctx, &result);
            }
            Err(errors) => {
                for error in errors {
                    types::emit_type_error(ctx, error);
                }
            }
        }
    }
}
