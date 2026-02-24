use super::lower_program;
use crate::errors::CodegenError;
use pecan_analysis::hir::{lower_program as lower_hir_program, AstProgram, HirProgram};
use pecan_analysis::parsing::parsable::Parsable;
use pecan_analysis::resolve::Resolver;
use pecan_analysis::syntax::{Program, Spanned};
use pecan_analysis::types::type_program;
use pecan_analysis::{PecanParser, Rule};
use pest::Parser;

fn parse_program_ast(input: &str) -> Spanned<Program> {
    let mut pairs = PecanParser::parse(Rule::Program, input)
        .unwrap_or_else(|error| panic!("expected parse success: {input}\n{error}"));
    let pair = pairs.next().expect("expected parse pair");
    Program::parse(pair).expect("expected AST program")
}

fn lower_resolve_type(source: &str) -> (
    Spanned<HirProgram>,
    pecan_analysis::resolve::Resolution,
    pecan_analysis::types::TypeResult,
) {
    let program = parse_program_ast(source);
    let ast: Spanned<AstProgram> = program.into();
    let hir = lower_hir_program(&ast);
    let resolution = Resolver::new()
        .resolve_program(&hir)
        .unwrap_or_else(|errors| panic!("expected resolution success: {errors:?}"));
    let typed = type_program(&hir, &resolution)
        .unwrap_or_else(|errors| panic!("expected type success: {errors:?}"));
    (hir, resolution, typed)
}

#[test]
fn codegen_lowers_basic_function_to_clif() {
    let (hir, resolution, typed) =
        lower_resolve_type("i64 main() { let x: i64 = 1; return x; }");
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected kickoff codegen lowering to succeed");
    assert_eq!(artifact.functions.len(), 1);
    assert!(artifact.functions[0].clif.contains("iconst"));
    assert!(artifact.functions[0].clif.contains("return"));
}

#[test]
fn codegen_rejects_unsupported_expression_nodes_with_span() {
    let (hir, resolution, typed) = lower_resolve_type("i64 main() { return 1 + 2; }");
    let errors = lower_program(&hir, &resolution, &typed)
        .expect_err("expected unsupported binary node to fail kickoff codegen");
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, CodegenError::UnsupportedNode { .. })),
        "expected UnsupportedNode error, got: {errors:?}"
    );
}

#[test]
fn codegen_requires_cast_intent_for_numeric_mismatch() {
    let (hir, resolution, mut typed) =
        lower_resolve_type("i32 main() { let x: i64 = 1; return x; }");
    typed.cast_intents.clear();
    let errors = lower_program(&hir, &resolution, &typed)
        .expect_err("expected missing cast intent to fail codegen");
    assert!(
        errors
            .iter()
            .any(|error| matches!(error, CodegenError::MissingCastIntent { .. })),
        "expected MissingCastIntent error, got: {errors:?}"
    );
}

#[test]
fn codegen_lowers_for_loop_with_assignment() {
    let source = "i64 main() { let mut sum: i64 = 0; for i in range(0, 4) { sum = sum + i; } return sum; }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected for loop lowering to succeed");
    let clif = &artifact.functions[0].clif;
    assert!(clif.contains("brif"), "expected loop branching in CLIF: {clif}");
    assert!(clif.contains("iadd"), "expected loop increment in CLIF: {clif}");
}

#[test]
fn codegen_lowers_while_with_break_and_continue() {
    let source = "i64 main() { let mut i: i64 = 0; let mut sum: i64 = 0; while i < 5 { i = i + 1; if i == 2 { continue; } if i == 4 { break; } sum = sum + i; } return sum; }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected while/break/continue lowering to succeed");
    let clif = &artifact.functions[0].clif;
    assert!(clif.contains("brif"), "expected branching in CLIF: {clif}");
    assert!(clif.contains("jump"), "expected jumps for loop control in CLIF: {clif}");
}
