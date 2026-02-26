use anyhow::Result;
use clap::Args;
use std::path::PathBuf;
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::parser::{BeskidParser, Rule};
use beskid_analysis::syntax::Program;
use beskid_analysis::{builtin_rules, AnalysisOptions, run_rules};
use miette::Report;
use pest::Parser;
use crate::commands::project_input::resolve_input;
use crate::errors::{print_pretty_parse_error, print_pretty_pest_error};

#[derive(Args, Debug)]
pub struct AnalyzeArgs {
    /// The input Beskid file to analyze
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
}

pub fn execute(args: AnalyzeArgs) -> Result<()> {
    let resolved = resolve_input(
        args.input.as_ref(),
        args.project.as_ref(),
        args.target.as_deref(),
        cfg!(feature = "stdlib-prelude-fallback"),
        args.frozen,
        args.locked,
    )?;
    let source = resolved.source;
    let input_path = resolved.source_path;
    let _compile_plan = resolved.compile_plan;

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

    let diagnostics = run_rules(
        &program.node,
        input_path.display().to_string(),
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
