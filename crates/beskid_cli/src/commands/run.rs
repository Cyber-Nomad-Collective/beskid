use anyhow::Result;
use clap::Args;
use miette::Report;
use beskid_analysis::hir::{
    lower_program as lower_hir_program, normalize_program, AstProgram, HirProgram, HirPrimitiveType,
};
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::parser::{BeskidParser, Rule};
use beskid_analysis::resolve::{ItemKind, Resolver};
use beskid_analysis::syntax::{Program, Spanned};
use beskid_analysis::types::{type_program, TypeInfo};
use beskid_analysis::{builtin_rules, AnalysisOptions, run_rules};
use beskid_analysis::analysis::diagnostics::Severity;
use beskid_codegen::{codegen_errors_to_diagnostics, lower_program};
use beskid_engine::Engine;
use pest::Parser;
use std::path::PathBuf;

use crate::commands::project_input::resolve_input;
use crate::errors::{print_pretty_parse_error, print_pretty_pest_error};

#[derive(Args, Debug)]
pub struct RunArgs {
    /// The input Beskid file to JIT-compile and execute
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
}

pub fn execute(args: RunArgs) -> Result<()> {
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
        None => {
            return Err(anyhow::anyhow!("No program found"));
        }
    };

    let program = match Program::parse(pair) {
        Ok(program) => program,
        Err(err) => {
            print_pretty_parse_error(&input_path.display().to_string(), &source, &err);
            std::process::exit(1);
        }
    };

    let combined_program = program;

    let diagnostics = run_rules(
        &combined_program.node,
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

    let ast: Spanned<AstProgram> = combined_program.into();
    let mut hir: Spanned<HirProgram> = lower_hir_program(&ast);

    if let Err(errors) = normalize_program(&mut hir) {
        eprintln!("Normalization failed: {errors:?}");
        std::process::exit(1);
    }

    let resolution = match Resolver::new().resolve_program(&hir) {
        Ok(resolution) => resolution,
        Err(errors) => {
            eprintln!("{:?}", miette::miette!(
                "resolution failed after diagnostics: {errors:?}"
            ));
            std::process::exit(1);
        }
    };

    let typed = match type_program(&hir, &resolution) {
        Ok(typed) => typed,
        Err(errors) => {
            eprintln!("{:?}", miette::miette!(
                "type checking failed after diagnostics: {errors:?}"
            ));
            std::process::exit(1);
        }
    };

    let artifact = match lower_program(&hir, &resolution, &typed) {
        Ok(artifact) => artifact,
        Err(errors) => {
            let diagnostics = codegen_errors_to_diagnostics(
                &input_path.display().to_string(),
                &source,
                &errors,
            );
            for diagnostic in diagnostics {
                eprintln!("{:?}", Report::new(diagnostic));
            }
            std::process::exit(1);
        }
    };

    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .map_err(|err| anyhow::anyhow!("JIT compile failed: {err:?}"))?;

    let entrypoint = resolution
        .items
        .iter()
        .find(|item| item.name == args.entrypoint && item.kind == ItemKind::Function)
        .ok_or_else(|| anyhow::anyhow!("Missing entrypoint `{}`", args.entrypoint))?;
    let signature = typed
        .function_signatures
        .get(&entrypoint.id)
        .ok_or_else(|| anyhow::anyhow!("Missing signature for `{}`", args.entrypoint))?;
    if !signature.params.is_empty() {
        return Err(anyhow::anyhow!(
            "Entrypoint `{}` must take no parameters",
            args.entrypoint
        ));
    }

    let return_info = typed.types.get(signature.return_type).ok_or_else(|| {
        anyhow::anyhow!("Missing return type for `{}`", args.entrypoint)
    })?;

    let ptr = unsafe { engine.entrypoint_ptr(&args.entrypoint) }
        .map_err(|err| anyhow::anyhow!("Entrypoint lookup failed: {err:?}"))?;
    if ptr.is_null() {
        return Err(anyhow::anyhow!("Entrypoint `{}` returned null pointer", args.entrypoint));
    }

    engine.with_arena(|_, _| match return_info {
        TypeInfo::Primitive(HirPrimitiveType::Unit) => {
            let main_fn: extern "C" fn() = unsafe { std::mem::transmute(ptr) };
            main_fn();
            println!("ok");
        }
        TypeInfo::Primitive(HirPrimitiveType::String)
        | TypeInfo::Named(_)
        | TypeInfo::GenericParam(_)
        | TypeInfo::Applied { .. } => {
            let main_fn: extern "C" fn() -> u64 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            println!("0x{value:016x}");
        }
        TypeInfo::Primitive(HirPrimitiveType::I64) => {
            let main_fn: extern "C" fn() -> i64 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            println!("{value}");
        }
        TypeInfo::Primitive(HirPrimitiveType::I32) => {
            let main_fn: extern "C" fn() -> i32 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            println!("{value}");
        }
        TypeInfo::Primitive(HirPrimitiveType::U8) => {
            let main_fn: extern "C" fn() -> u8 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            println!("{value}");
        }
        TypeInfo::Primitive(HirPrimitiveType::Bool) => {
            let main_fn: extern "C" fn() -> u8 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn() != 0;
            println!("{value}");
        }
        TypeInfo::Primitive(HirPrimitiveType::F64) => {
            let main_fn: extern "C" fn() -> f64 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            println!("{value}");
        }
        TypeInfo::Primitive(HirPrimitiveType::Char) => {
            let main_fn: extern "C" fn() -> u32 = unsafe { std::mem::transmute(ptr) };
            let value = main_fn();
            let rendered = std::char::from_u32(value).unwrap_or('\u{FFFD}');
            println!("{rendered}");
        }
    });

    Ok(())
}
