use pecan_analysis::analysis::{AnalysisOptions, Rule, RuleContext, run_rules};
use pecan_analysis::syntax::SpanInfo;
use pecan_analysis::{diag, Severity};

use crate::syntax::util::parse_program_ast;

struct EmitOne;

impl Rule for EmitOne {
    fn name(&self) -> &'static str {
        "emit_one"
    }

    fn run(&self, ctx: &mut RuleContext, program: &pecan_analysis::syntax::Program) {
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
        diag!(ctx, span, "E0001", "example diagnostic", label = "example", severity = Severity::Error);
    }
}

#[test]
fn runs_rules_and_collects_diagnostics() {
    let program = parse_program_ast("fn main() { return; }");
    let result = run_rules(
        &program.node,
        "test.pn",
        "fn main() { return; }",
        &[Box::new(EmitOne)],
        AnalysisOptions::default(),
    );

    assert_eq!(result.diagnostics.len(), 1);
    assert_eq!(result.diagnostics[0].message, "example diagnostic");
}
