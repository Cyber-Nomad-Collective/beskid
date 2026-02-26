use anyhow::Result;
use clap::Args;
use std::path::PathBuf;

use crate::commands::project_input::resolve_project;

#[derive(Args, Debug)]
pub struct UpdateArgs {
    /// Path to a project directory or Project.proj file
    #[arg(long)]
    pub project: Option<PathBuf>,

    /// Target name from Project.proj
    #[arg(long)]
    pub target: Option<String>,
}

pub fn execute(args: UpdateArgs) -> Result<()> {
    let _ = resolve_project(
        None,
        args.project.as_ref(),
        args.target.as_deref(),
        cfg!(feature = "stdlib-prelude-fallback"),
        false,
        false,
    )?;
    println!("Dependency lock and materialized workspace updated.");
    Ok(())
}
