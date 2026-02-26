use anyhow::{Context, Result};
use clap::Args;
use miette::Report;
use beskid_analysis::hir::{
    lower_program as lower_hir_program, normalize_program, AstProgram, HirProgram,
};
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::parser::{BeskidParser, Rule};
use beskid_analysis::resolve::Resolver;
use beskid_analysis::syntax::{Program, Spanned};
use beskid_analysis::types::type_program;
use beskid_codegen::{codegen_errors_to_diagnostics, lower_program};
use pest::Parser;
use std::fs;
use std::path::PathBuf;

use crate::errors::{print_pretty_parse_error, print_pretty_pest_error};

#[derive(Args, Debug)]
pub struct ClifArgs {
    /// The input Beskid file to lower into CLIF
    #[arg(required = true)]
    pub input: PathBuf,
}

pub fn execute(args: ClifArgs) -> Result<()> {
    let source = fs::read_to_string(&args.input)
        .with_context(|| format!("Failed to read file: {}", args.input.display()))?;

    let mut pairs = match BeskidParser::parse(Rule::Program, &source) {
        Ok(pairs) => pairs,
        Err(err) => {
            print_pretty_pest_error(&args.input.display().to_string(), &source, &err);
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
            print_pretty_parse_error(&args.input.display().to_string(), &source, &err);
            std::process::exit(1);
        }
    };

    let ast: Spanned<AstProgram> = program.into();
    let mut hir: Spanned<HirProgram> = lower_hir_program(&ast);

    if let Err(errors) = normalize_program(&mut hir) {
        eprintln!("Normalization failed: {errors:?}");
        std::process::exit(1);
    }

    let resolution = match Resolver::new().resolve_program(&hir) {
        Ok(resolution) => resolution,
        Err(errors) => {
            eprintln!("Resolution failed: {errors:?}");
            std::process::exit(1);
        }
    };

    let typed = match type_program(&hir, &resolution) {
        Ok(typed) => typed,
        Err(errors) => {
            eprintln!("Type checking failed: {errors:?}");
            std::process::exit(1);
        }
    };

    match lower_program(&hir, &resolution, &typed) {
        Ok(artifact) => {
            for function in artifact.functions {
                println!(";; Function: {}", function.name);
                println!("{}", function.function.to_string());
            }
        }
        Err(errors) => {
            let diagnostics = codegen_errors_to_diagnostics(
                &args.input.display().to_string(),
                &source,
                &errors,
            );
            for diagnostic in diagnostics {
                eprintln!("{:?}", Report::new(diagnostic));
            }
            std::process::exit(1);
        }
    }

    Ok(())
}
