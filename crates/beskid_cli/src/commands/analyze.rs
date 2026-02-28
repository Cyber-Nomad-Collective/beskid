use anyhow::Result;
use beskid_analysis::services;
use clap::Args;
use std::path::PathBuf;

use crate::errors;

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
    let resolved = services::resolve_input(
        args.input.as_ref(),
        args.project.as_ref(),
        args.target.as_deref(),
        args.frozen,
        args.locked,
    )?;
    let diagnostics = services::analyze_program(&resolved.source_path, &resolved.source)?;

    if diagnostics.is_empty() {
        println!("No diagnostics.");
    } else {
        errors::print_semantic_diagnostics(diagnostics);
    }

    Ok(())
}
