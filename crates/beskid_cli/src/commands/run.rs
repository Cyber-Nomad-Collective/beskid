use anyhow::Result;
use beskid_analysis::services;
use beskid_engine::services::run_entrypoint;
use clap::Args;
use std::path::PathBuf;

#[derive(Args, Debug)]
pub struct RunArgs {
    /// The input Beskid file to JIT-compile and execute
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

    /// Entrypoint function name
    #[arg(long, default_value = "main")]
    pub entrypoint: String,
}

pub fn execute(args: RunArgs) -> Result<()> {
    let resolved = services::resolve_input(
        args.input.as_ref(),
        args.project.as_ref(),
        args.target.as_deref(),
        args.frozen,
        args.locked,
    )?;
    let output = run_entrypoint(&resolved.source_path, &resolved.source, &args.entrypoint)?;
    println!("{output}");

    Ok(())
}
