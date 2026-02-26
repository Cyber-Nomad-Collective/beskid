use beskid_analysis::analysis::{AnalysisOptions, Rule, RuleContext, run_rules};
use beskid_analysis::builtin_rules;
use beskid_analysis::syntax::SpanInfo;
use beskid_analysis::{Severity, diag};

use crate::syntax::util::parse_program_ast;

mod legality;
mod lowering;
mod resolve;
mod types;

struct EmitOne;

impl Rule for EmitOne {
    fn name(&self) -> &'static str {
        "emit_one"
    }

    fn run(&self, ctx: &mut RuleContext, program: &beskid_analysis::syntax::Program) {
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
        diag!(
            ctx,
            span,
            "E0001",
            "example diagnostic",
            label = "example",
            severity = Severity::Error
        );
    }
}

#[test]
fn analysis_type_mismatch_renders_named_type_names() {
    let source =
        "type User { i64 id } type Order { i64 id } unit main() { User u = Order { id: 1 }; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    let mismatch = result
        .diagnostics
        .iter()
        .find(|diag| diag.code.as_deref() == Some("E1206"))
        .expect("expected type mismatch diagnostic");
    assert!(
        mismatch.message.contains("User") && mismatch.message.contains("Order"),
        "expected named type names in mismatch message, got: {}",
        mismatch.message
    );
}

#[test]
fn analysis_emits_resolve_errors() {
    let program = parse_program_ast("unit main() { let x = y; }");
    let result = run_rules(
        &program.node,
        "test.bd",
        "unit main() { let x = y; }",
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1101"))
    );
}

#[test]
fn analysis_emits_type_errors() {
    let program = parse_program_ast("unit main() { bool x = 1; }");
    let result = run_rules(
        &program.node,
        "test.bd",
        "unit main() { bool x = 1; }",
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1206"))
    );
}

#[test]
fn analysis_emits_cast_intent_warnings() {
    let source = "unit main() { i64 x = 1; i32 y = x; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    let cast_diag = result
        .diagnostics
        .iter()
        .find(|diag| diag.code.as_deref() == Some("W1203"))
        .expect("expected cast-intent warning");
    assert!(
        cast_diag.message.contains("i64") && cast_diag.message.contains("i32"),
        "expected readable cast types in warning message, got: {}",
        cast_diag.message
    );
}

#[test]
fn analysis_suppresses_cast_intent_warnings_when_warnings_disabled() {
    let source = "unit main() { i64 x = 1; i32 y = x; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions {
            emit_warnings: false,
        },
    );

    assert!(
        !result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("W1203"))
    );
}

#[test]
fn analysis_pipeline_succeeds_after_lowering() {
    let source = "type User { i64 id } unit main() { User u = User { id: 1 }; i64 x = u.id; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .all(|diag| diag.severity != Severity::Error),
        "expected no error diagnostics"
    );
}

#[test]
fn analysis_emits_duplicate_enum_variant_errors() {
    let source = "enum Option { Some, Some }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1002"))
    );
}

#[test]
fn analysis_emits_duplicate_contract_method_errors() {
    let source = "contract Storage { unit put(key: string); unit put(value: string); }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1003"))
    );
}

#[test]
fn analysis_emits_duplicate_definition_name_errors() {
    let source = "type User { i64 id } enum User { One }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1001"))
    );
}

#[test]
fn analysis_emits_break_outside_loop_errors() {
    let source = "unit main() { break; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1401"))
    );
}

#[test]
fn analysis_emits_continue_outside_loop_errors() {
    let source = "unit main() { continue; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1402"))
    );
}

#[test]
fn analysis_emits_unreachable_code_warnings() {
    let source = "unit main() { return; i64 x = 1; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("W1403"))
    );
}

#[test]
fn analysis_emits_duplicate_pattern_binding_errors() {
    let source = "enum Choice { Pair(i64 a, i64 b) } unit main() { Choice c = Choice::Pair(1, 2); i64 x = match c { Choice::Pair(v, v) => v, }; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1306"))
    );
}

#[test]
fn analysis_emits_unknown_type_in_definition_errors() {
    let source = "type User { Missing id }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1005"))
    );
}

#[test]
fn analysis_emits_duplicate_non_type_item_name_errors() {
    let source = "unit foo() { return; } mod foo;";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1006"))
    );
}

#[test]
fn analysis_emits_conflicting_embedded_contract_errors() {
    let source = "contract A { unit put(key: string); } contract B { unit put(key: i64); } contract C { A; B; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1004"))
    );
}

#[test]
fn analysis_emits_unknown_enum_path_errors() {
    let source = "unit main() { i64 x = Missing::None(); }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1301"))
    );
}

#[test]
fn analysis_emits_enum_constructor_arity_mismatch_errors() {
    let source = "enum Option { Some(i64 value) } unit main() { Option x = Option::Some(); }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1302"))
    );
}

#[test]
fn analysis_emits_pattern_arity_mismatch_errors() {
    let source = "enum Option { Some(i64 value) } unit main() { Option x = Option::Some(1); i64 y = match x { Option::Some() => 1, }; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1307"))
    );
}

#[test]
fn analysis_emits_ambiguous_import_errors() {
    let source = "mod dep.foo; mod other.foo; use dep.foo; use other.foo;";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1104"))
    );
}

#[test]
fn analysis_emits_unknown_import_path_errors() {
    let source = "use missing.path;";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1105"))
    );
}

#[test]
fn analysis_emits_private_item_in_module_access_errors() {
    let source = "mod dep.secret; unit main() { let x = dep.secret; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1107"))
    );
}

#[test]
fn analysis_emits_use_before_declaration_errors() {
    let source = "unit main() { i64 x = y; i64 y = 1; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1106"))
    );
}

#[test]
fn analysis_emits_immutable_assignment_errors() {
    let source = "unit main() { i64 x = 1; x = 2; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1214"))
    );
}

#[test]
fn analysis_emits_invalid_member_target_errors() {
    let source = "unit main() { i64 x = 1; i64 y = x.foo; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1213"))
    );
}

#[test]
fn analysis_emits_unqualified_enum_constructor_errors() {
    let source = "enum Option { Some(i64 value) } unit main() { Option x = Some(1); }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1303"))
    );
}

#[test]
fn analysis_emits_non_exhaustive_match_errors() {
    let source = "enum Option { Some(i64 value), None } unit main() { Option x = Option::Some(1); i64 y = match x { Option::Some(v) => v, }; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1304"))
    );
}

#[test]
fn analysis_emits_match_arm_type_mismatch_errors() {
    let source = "enum Option { Some(i64 value), None } unit main() { Option x = Option::Some(1); let y = match x { Option::Some(_) => 1, Option::None => true, }; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1305"))
    );
}

#[test]
fn analysis_emits_guard_type_mismatch_errors() {
    let source = "enum Option { Some(i64 value) } unit main() { Option x = Option::Some(1); let y = match x { Option::Some(v) when 1 => v, }; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1308"))
    );
}

#[test]
fn analysis_emits_module_not_found_errors() {
    let source = "mod missing.module;";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1502"))
    );
}

#[test]
fn analysis_emits_unused_import_warnings() {
    let source = "mod dep.core; use dep.foo; unit main() { return; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("W1503"))
    );
}

#[test]
fn analysis_emits_unused_private_item_warnings() {
    let source = "unit helper() { return; } unit main() { return; }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("W1504"))
    );
}

#[test]
fn analysis_emits_contract_method_missing_impl_errors() {
    let source = "contract Service { unit run(); }";
    let program = parse_program_ast(source);
    let result = run_rules(
        &program.node,
        "test.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    );

    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code.as_deref() == Some("E1601"))
    );
}

#[test]
fn runs_rules_and_collects_diagnostics() {
    let program = parse_program_ast("unit main() { return; }");
    let result = run_rules(
        &program.node,
        "test.bd",
        "unit main() { return; }",
        &[Box::new(EmitOne)],
        AnalysisOptions::default(),
    );

    assert_eq!(result.diagnostics.len(), 1);
    assert_eq!(result.diagnostics[0].message, "example diagnostic");
}
