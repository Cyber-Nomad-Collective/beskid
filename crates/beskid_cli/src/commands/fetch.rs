use anyhow::Result;
use clap::Args;
use std::path::PathBuf;

use crate::commands::project_input::resolve_project;

#[derive(Args, Debug)]
pub struct FetchArgs {
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

pub fn execute(args: FetchArgs) -> Result<()> {
    let _ = resolve_project(
        None,
        args.project.as_ref(),
        args.target.as_deref(),
        args.frozen,
        args.locked,
    )?;
    println!("Dependencies resolved and materialized.");
    Ok(())
}
