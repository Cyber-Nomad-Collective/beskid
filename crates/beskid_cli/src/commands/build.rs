use std::path::PathBuf;

use anyhow::Result;
use beskid_analysis::analysis::diagnostics::Severity;
use beskid_analysis::hir::{
    lower_program as lower_hir_program, normalize_program, AstProgram, HirProgram,
};
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::parser::{BeskidParser, Rule};
use beskid_analysis::resolve::Resolver;
use beskid_analysis::syntax::{Program, Spanned};
use beskid_analysis::types::type_program;
use beskid_analysis::{builtin_rules, run_rules, AnalysisOptions};
use beskid_aot::{
    build, AotBuildRequest, BuildOutputKind, BuildProfile, ExportPolicy, LinkMode,
    RuntimeStrategy,
};
use beskid_codegen::{codegen_errors_to_diagnostics, lower_program};
use clap::{Args, ValueEnum};
use miette::Report;
use pest::Parser;

use crate::commands::project_input::resolve_input;
use crate::errors::{print_pretty_parse_error, print_pretty_pest_error};

#[derive(Debug, Clone, Copy, ValueEnum)]
pub enum BuildKind {
    Exe,
    Shared,
    Static,
    Object,
}

#[derive(Args, Debug)]
pub struct BuildArgs {
    /// The input Beskid file to compile
    pub input: Option<PathBuf>,

    /// Path to a project directory or Project.proj file
    #[arg(long)]
    pub project: Option<PathBuf>,

    /// Target name from Project.proj
    #[arg(long)]
    pub target: Option<String>,

    /// Require lockfile to be up to date and forbid lockfile updates
    #[arg(long)]
    pub frozen: bool,

    /// Require lockfile to exist and match resolution
    #[arg(long)]
    pub locked: bool,

    /// Entrypoint function name
    #[arg(long, default_value = "main")]
    pub entrypoint: String,

    /// Build output kind
    #[arg(long, value_enum, default_value_t = BuildKind::Exe)]
    pub kind: BuildKind,

    /// Build profile
    #[arg(long)]
    pub release: bool,

    /// Target triple override (e.g. x86_64-unknown-linux-gnu)
    #[arg(long)]
    pub target_triple: Option<String>,

    /// Final artifact output path. Defaults to <input-stem>.<ext>
    #[arg(long)]
    pub output: Option<PathBuf>,

    /// Optional object-file output path
    #[arg(long)]
    pub object_output: Option<PathBuf>,

    /// Runtime archive path to reuse instead of building runtime on the fly
    #[arg(long)]
    pub runtime_archive: Option<PathBuf>,

    /// ABI version for prebuilt runtime archive
    #[arg(long)]
    pub runtime_abi_version: Option<u32>,

    /// Explicit symbols to export in shared/static artifacts
    #[arg(long = "export")]
    pub export_symbols: Vec<String>,

    /// Prefer static dependencies while linking
    #[arg(long)]
    pub prefer_static: bool,

    /// Prefer dynamic dependencies while linking
    #[arg(long)]
    pub prefer_dynamic: bool,

    /// Print linker invocations
    #[arg(long)]
    pub verbose_link: bool,
}

pub fn execute(args: BuildArgs) -> Result<()> {
    let resolved = resolve_input(
        args.input.as_ref(),
        args.project.as_ref(),
        args.target.as_deref(),
        args.frozen,
        args.locked,
    )?;
    let source = resolved.source;
    let input_path = resolved.source_path;

    let mut pairs = match BeskidParser::parse(Rule::Program, &source) {
        Ok(pairs) => pairs,
        Err(err) => {
            print_pretty_pest_error(&input_path.display().to_string(), &source, &err);
            std::process::exit(1);
        }
    };

    let pair = match pairs.next() {
        Some(pair) => pair,
        None => return Err(anyhow::anyhow!("No program found")),
    };

    let program = match Program::parse(pair) {
        Ok(program) => program,
        Err(err) => {
            print_pretty_parse_error(&input_path.display().to_string(), &source, &err);
            std::process::exit(1);
        }
    };

    let diagnostics = run_rules(
        &program.node,
        input_path.display().to_string(),
        &source,
        &builtin_rules(),
        AnalysisOptions::default(),
    )
    .diagnostics;

    let has_errors = diagnostics
        .iter()
        .any(|diagnostic| matches!(diagnostic.severity, Severity::Error));
    if !diagnostics.is_empty() {
        for diagnostic in diagnostics {
            eprintln!("{:?}", Report::new(diagnostic));
        }
    }
    if has_errors {
        std::process::exit(1);
    }

    let ast: Spanned<AstProgram> = program.into();
    let mut hir: Spanned<HirProgram> = lower_hir_program(&ast);
    if let Err(errors) = normalize_program(&mut hir) {
        return Err(anyhow::anyhow!("Normalization failed: {errors:?}"));
    }

    let resolution = Resolver::new()
        .resolve_program(&hir)
        .map_err(|errors| anyhow::anyhow!("Resolution failed: {errors:?}"))?;
    let typed = type_program(&hir, &resolution)
        .map_err(|errors| anyhow::anyhow!("Type checking failed: {errors:?}"))?;

    let artifact = match lower_program(&hir, &resolution, &typed) {
        Ok(artifact) => artifact,
        Err(errors) => {
            let diagnostics =
                codegen_errors_to_diagnostics(&input_path.display().to_string(), &source, &errors);
            for diagnostic in diagnostics {
                eprintln!("{:?}", Report::new(diagnostic));
            }
            std::process::exit(1);
        }
    };

    let output_kind = match args.kind {
        BuildKind::Exe => BuildOutputKind::Exe,
        BuildKind::Shared => BuildOutputKind::SharedLib,
        BuildKind::Static => BuildOutputKind::StaticLib,
        BuildKind::Object => BuildOutputKind::ObjectOnly,
    };

    let target = beskid_aot::target::detect_target(args.target_triple.as_deref())?;
    let output = if let Some(path) = args.output {
        path
    } else {
        let stem = input_path
            .file_stem()
            .and_then(|part| part.to_str())
            .unwrap_or("aot_out");
        let file_name = beskid_aot::target::output_filename(stem, output_kind, &target);
        let parent = input_path
            .parent()
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from("."));
        parent.join(file_name)
    };

    let runtime = if let Some(path) = args.runtime_archive {
        RuntimeStrategy::UsePrebuilt {
            path,
            abi_version: args.runtime_abi_version,
        }
    } else {
        RuntimeStrategy::BuildOnTheFly
    };

    let link_mode = match (args.prefer_static, args.prefer_dynamic) {
        (true, false) => LinkMode::PreferStatic,
        (false, true) => LinkMode::PreferDynamic,
        (true, true) => {
            return Err(anyhow::anyhow!(
                "`--prefer-static` and `--prefer-dynamic` are mutually exclusive"
            ));
        }
        (false, false) => LinkMode::Auto,
    };

    let export_policy = if args.export_symbols.is_empty() {
        ExportPolicy::PublicOnly
    } else {
        ExportPolicy::Explicit(args.export_symbols)
    };

    let result = build(AotBuildRequest {
        artifact,
        output_kind,
        output_path: output.clone(),
        object_path: args.object_output,
        target_triple: args.target_triple,
        profile: if args.release {
            BuildProfile::Release
        } else {
            BuildProfile::Debug
        },
        entrypoint: args.entrypoint,
        export_policy,
        link_mode,
        runtime,
        verbose_link: args.verbose_link,
    })?;

    println!("object: {}", result.object_path.display());
    if let Some(final_path) = result.final_path {
        println!("output: {}", final_path.display());
    }
    if let Some(cmd) = result.linker_invocation {
        println!("link: {cmd}");
    }

    Ok(())
}
