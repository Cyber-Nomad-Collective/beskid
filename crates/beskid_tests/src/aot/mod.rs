use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

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
use beskid_abi::{SYM_ABI_VERSION, SYM_INTEROP_DISPATCH_UNIT};
use beskid_aot::{
    AotBuildRequest, BuildOutputKind, BuildProfile, ExportPolicy, LinkMode, RuntimeStrategy, build,
};
use beskid_codegen::lower_program;
use pest::Parser;

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

#[test]
fn object_only_build_emits_object_file() {
    let artifact = lower_sample_artifact();
    let dir = temp_case_dir("object_only");
    let output = dir.join("sample.o");

    let result = build(AotBuildRequest {
        artifact,
        output_kind: BuildOutputKind::ObjectOnly,
        output_path: output.clone(),
        object_path: None,
        target_triple: None,
        profile: BuildProfile::Debug,
        entrypoint: "main".to_owned(),
        export_policy: ExportPolicy::PublicOnly,
        link_mode: LinkMode::Auto,
        runtime: RuntimeStrategy::BuildOnTheFly,
        verbose_link: false,
    })
    .expect("aot object build");

    assert!(result.object_path.exists(), "expected object file to exist");
    assert!(
        result.final_path.is_none(),
        "object-only build must not link"
    );

    let _ = std::fs::remove_dir_all(dir);
}

#[test]
fn static_build_contains_required_runtime_symbols() {
    let artifact = lower_sample_artifact();
    let dir = temp_case_dir("static_with_runtime_symbols");
    let output = dir.join("libsample.a");

    let result = build(AotBuildRequest {
        artifact,
        output_kind: BuildOutputKind::StaticLib,
        output_path: output,
        object_path: None,
        target_triple: None,
        profile: BuildProfile::Debug,
        entrypoint: "main".to_owned(),
        export_policy: ExportPolicy::PublicOnly,
        link_mode: LinkMode::Auto,
        runtime: RuntimeStrategy::BuildOnTheFly,
        verbose_link: false,
    })
    .expect("aot static build");

    let final_path = result
        .final_path
        .expect("static build should emit final archive");
    assert!(final_path.exists(), "expected final static archive to exist");

    let output = Command::new("nm")
        .arg("-g")
        .arg(&final_path)
        .output()
        .expect("nm should inspect linked archive");
    assert!(output.status.success(), "expected nm to succeed");
    let symbols = String::from_utf8_lossy(&output.stdout);
    assert!(
        symbols.contains(SYM_ABI_VERSION),
        "expected final static artifact to expose ABI version symbol"
    );
    assert!(
        symbols.contains(SYM_INTEROP_DISPATCH_UNIT),
        "expected final static artifact to expose interop dispatch symbol"
    );

    let _ = std::fs::remove_dir_all(dir);
}
