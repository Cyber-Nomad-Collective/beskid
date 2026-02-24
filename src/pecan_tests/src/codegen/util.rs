use pecan_analysis::hir::{
    lower_program as lower_hir_program, normalize_program, AstProgram, HirProgram,
};
use pecan_analysis::parsing::parsable::Parsable;
use pecan_analysis::resolve::Resolver;
use pecan_analysis::syntax::{Program, Spanned};
use pecan_analysis::types::type_program;
use pecan_analysis::{PecanParser, Rule};
use pest::Parser;

pub fn parse_program_ast(input: &str) -> Spanned<Program> {
    let mut pairs = PecanParser::parse(Rule::Program, input)
        .unwrap_or_else(|error| panic!("expected parse success: {input}\n{error}"));
    let pair = pairs.next().expect("expected parse pair");
    Program::parse(pair).expect("expected AST program")
}

pub fn lower_resolve_type(source: &str) -> (
    Spanned<HirProgram>,
    pecan_analysis::resolve::Resolution,
    pecan_analysis::types::TypeResult,
) {
    let program = parse_program_ast(source);
    let ast: Spanned<AstProgram> = program.into();
    let mut hir = lower_hir_program(&ast);
    normalize_program(&mut hir).expect("normalization failed");
    let resolution = Resolver::new()
        .resolve_program(&hir)
        .unwrap_or_else(|errors| panic!("expected resolution success: {errors:?}"));
    let typed = type_program(&hir, &resolution)
        .unwrap_or_else(|errors| panic!("expected type success: {errors:?}"));
    (hir, resolution, typed)
}
