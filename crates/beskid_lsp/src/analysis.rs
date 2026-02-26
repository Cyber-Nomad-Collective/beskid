use beskid_analysis::hir::{
    AstProgram, HirProgram, lower_program as lower_hir_program, normalize_program,
};
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::parser::{BeskidParser, Rule};
use beskid_analysis::resolve::{Resolution, Resolver};
use beskid_analysis::syntax::{Program, Spanned};
use pest::Parser;

pub fn parse_program(source: &str) -> Option<Spanned<Program>> {
    let mut pairs = BeskidParser::parse(Rule::Program, source).ok()?;
    let pair = pairs.next()?;
    Program::parse(pair).ok()
}

pub fn resolve_program(program: &Spanned<Program>) -> Option<Resolution> {
    let ast: Spanned<AstProgram> = program.clone().into();
    let mut hir: Spanned<HirProgram> = lower_hir_program(&ast);
    normalize_program(&mut hir).ok()?;
    Resolver::new().resolve_program(&hir).ok()
}
