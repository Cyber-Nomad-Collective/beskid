use anyhow::Result;
use beskid_analysis::services;
use beskid_codegen::{lower_source, render_clif};
use clap::Args;
use std::path::PathBuf;

#[derive(Args, Debug)]
pub struct ClifArgs {
    /// The input Beskid file to lower into CLIF
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

pub fn execute(args: ClifArgs) -> Result<()> {
    let resolved = services::resolve_input(
        args.input.as_ref(),
        args.project.as_ref(),
        args.target.as_deref(),
        args.frozen,
        args.locked,
    )?;
    let lowered = lower_source(&resolved.source_path, &resolved.source, false)?;
    print!("{}", render_clif(&lowered.artifact));

    Ok(())
}
