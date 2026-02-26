use anyhow::{Context, Result};
use clap::Args;
use std::fs;
use std::path::PathBuf;
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::syntax::Program;
use beskid_analysis::parser::{BeskidParser, Rule};
use pest::Parser;
use crate::errors::{print_pretty_parse_error, print_pretty_pest_error};

#[derive(Args, Debug)]
pub struct ParseArgs {
    /// The input Beskid file to parse
    #[arg(required = true)]
    pub input: PathBuf,

    /// Output format: debug (json not yet supported)
    #[arg(long, value_parser = ["debug"], default_value = "debug")]
    pub format: String,
}

pub fn execute(args: ParseArgs) -> Result<()> {
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

    match args.format.as_str() {
        _ => {
            println!("{:#?}", program.node);
        }
    }

    Ok(())
}
