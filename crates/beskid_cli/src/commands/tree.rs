use anyhow::{Context, Result};
use beskid_analysis::services;
use clap::Args;
use std::fs;
use std::path::PathBuf;

#[derive(Args, Debug)]
pub struct TreeArgs {
    /// The input Beskid file to visualize
    #[arg(required = true)]
    pub input: PathBuf,
}

pub fn execute(args: TreeArgs) -> Result<()> {
    let source = fs::read_to_string(&args.input)
        .with_context(|| format!("Failed to read file: {}", args.input.display()))?;
    let program = services::parse_program(&source)?;
    print!("{}", services::render_program_tree(&program));

    Ok(())
}
