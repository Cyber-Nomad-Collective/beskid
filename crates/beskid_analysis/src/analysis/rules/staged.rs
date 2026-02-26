use crate::analysis::rules::{Rule, RuleContext};
use crate::hir::{lower_program, AstProgram, HirProgram};
use crate::syntax::{Program, SpanInfo, Spanned};

mod contracts;
mod control_flow;
mod definitions;
mod error_handling;
mod meta_programming;
mod name_resolution;
mod type_checking;
mod visibility;

pub struct SemanticPipelineRule;

impl Rule for SemanticPipelineRule {
    fn name(&self) -> &'static str {
        "semantic_pipeline"
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

        self.stage0_collect_definitions(ctx, &hir);
        self.stage3_control_flow_and_patterns(ctx, &hir);

        let Some(resolution) = self.stage1_name_resolution(ctx, &hir) else {
            return;
        };

        self.stage2_type_check(ctx, &hir, &resolution);
        self.stage5_modules_and_visibility(ctx, &hir);
        self.stage6_contracts_and_methods(ctx, &hir);
        self.stage7_error_handling(ctx, &hir);
        self.stage8_metaprogramming(ctx, &hir);
    }
}
