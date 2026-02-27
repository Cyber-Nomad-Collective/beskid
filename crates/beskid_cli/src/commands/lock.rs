use anyhow::Result;
use beskid_analysis::services;
use clap::Args;
use std::path::PathBuf;

#[derive(Args, Debug)]
pub struct LockArgs {
    /// Path to a project directory or Project.proj file
    #[arg(long)]
    pub project: Option<PathBuf>,

    /// Target name from Project.proj
    #[arg(long)]
    pub target: Option<String>,
}

pub fn execute(args: LockArgs) -> Result<()> {
    let _ = services::resolve_project(
        None,
        args.project.as_ref(),
        args.target.as_deref(),
        false,
        false,
    )?;
    println!("Project.lock synchronized.");
    Ok(())
}
