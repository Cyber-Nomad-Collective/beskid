use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

pub(super) use std::process::Command;

pub(super) use beskid_abi::{SYM_ABI_VERSION, SYM_INTEROP_DISPATCH_UNIT};
use beskid_analysis::analysis::diagnostics::Severity;
use beskid_analysis::hir::{
    AstProgram, HirProgram, lower_program as lower_hir_program, normalize_program,
};
use beskid_analysis::parser::{BeskidParser, Rule};
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::resolve::Resolver;
use beskid_analysis::syntax::{Program, Spanned};
use beskid_analysis::types::type_program;
use beskid_analysis::{AnalysisOptions, builtin_rules, run_rules};
pub(super) use beskid_aot::{
    AotBuildRequest, AotError, BuildOutputKind, BuildProfile, ExportPolicy, LinkMode,
    ProjectTargetKind, RuntimeStrategy, build, default_output_kind, resolve_entrypoint,
};
use beskid_codegen::lower_program;
use pest::Parser;

mod defaults;
mod entrypoint;
mod object_build;
mod runtime_symbols;
mod standalone;

fn temp_case_dir(name: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("time ok")
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "beskid_aot_tests_{name}_{}_{}",
        std::process::id(),
        nanos
    ));
    std::fs::create_dir_all(&dir).expect("create temp dir");
    dir
}

fn sample_program() -> &'static str {
    "unit main() { }"
}

fn lower_sample_artifact() -> beskid_codegen::CodegenArtifact {
    let source = sample_program();
    let mut pairs = BeskidParser::parse(Rule::Program, source).expect("parse program");
    let pair = pairs.next().expect("program pair");
    let program = Program::parse(pair).expect("ast parse");

    let diagnostics = run_rules(
        &program.node,
        "sample.bd",
        source,
        &builtin_rules(),
        AnalysisOptions::default(),
    )
    .diagnostics;
    assert!(
        !diagnostics
            .iter()
            .any(|diag| matches!(diag.severity, Severity::Error)),
        "expected no analysis errors"
    );

    let ast: Spanned<AstProgram> = program.into();
    let mut hir: Spanned<HirProgram> = lower_hir_program(&ast);
    normalize_program(&mut hir).expect("normalize hir");
    let resolution = Resolver::new()
        .resolve_program(&hir)
        .expect("resolve program");
    let typed = type_program(&hir, &resolution).expect("type program");
    lower_program(&hir, &resolution, &typed).expect("lower program")
}
