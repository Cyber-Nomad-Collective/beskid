use beskid_analysis::hir::{
    AstProgram, HirProgram, lower_program as lower_hir_program, normalize_program,
};
use beskid_analysis::resolve::{Resolution, Resolver};
use beskid_analysis::services;
use beskid_analysis::syntax::{Program, Spanned};

pub fn parse_program(source: &str) -> Option<Spanned<Program>> {
    services::parse_program(source).ok()
}

pub fn resolve_program(program: &Spanned<Program>) -> Option<Resolution> {
    let ast: Spanned<AstProgram> = program.clone().into();
    let mut hir: Spanned<HirProgram> = lower_hir_program(&ast);
    normalize_program(&mut hir).ok()?;
    Resolver::new().resolve_program(&hir).ok()
}
