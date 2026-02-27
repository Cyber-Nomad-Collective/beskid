use anyhow::{Context, Result};
use beskid_analysis::services;
use clap::Args;
use std::fs;
use std::path::PathBuf;

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
    let program = services::parse_program(&source)?;

    match args.format.as_str() {
        _ => {
            println!("{:#?}", program.node);
        }
    }

    Ok(())
}
