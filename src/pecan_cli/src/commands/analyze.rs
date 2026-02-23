use anyhow::{Context, Result};
use clap::Args;
use std::fs;
use std::path::PathBuf;
use pecan_analysis::parsing::parsable::Parsable;
use pecan_analysis::parser::{PecanParser, Rule};
use pecan_analysis::syntax::Program;
use pecan_analysis::{builtin_rules, AnalysisOptions, run_rules};
use miette::Report;
use pest::Parser;
use crate::errors::{print_pretty_parse_error, print_pretty_pest_error};

#[derive(Args, Debug)]
pub struct AnalyzeArgs {
    /// The input Pecan file to analyze
    #[arg(required = true)]
    pub input: PathBuf,
}

pub fn execute(args: AnalyzeArgs) -> Result<()> {
    let source = fs::read_to_string(&args.input)
        .with_context(|| format!("Failed to read file: {}", args.input.display()))?;

    let mut pairs = match PecanParser::parse(Rule::Program, &source) {
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

    let diagnostics = run_rules(
        &program.node,
        args.input.display().to_string(),
        &source,
        &builtin_rules(),
        AnalysisOptions::default(),
    )
    .diagnostics;

    if diagnostics.is_empty() {
        println!("No diagnostics.");
    } else {
        for diagnostic in diagnostics {
            eprintln!("{:?}", Report::new(diagnostic));
        }
    }
    
    Ok(())
}
