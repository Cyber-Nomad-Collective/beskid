use anyhow::Result;
use clap::Args;
use std::path::PathBuf;

#[derive(Args, Debug)]
pub struct InteropArgs {
    /// Root directory containing Rust interop declaration spec files
    #[arg(long, default_value = "crates/beskid_runtime/interop_spec")]
    pub spec_root: PathBuf,

    /// Output directory for generated Beskid interop source files
    #[arg(long, default_value = "standard_library/Src/Interop")]
    pub output_dir: PathBuf,

    /// Generated stdlib prelude entry file (kept in sync with generated interop files)
    #[arg(long, default_value = "standard_library/Src/Prelude.bd")]
    pub prelude_output: PathBuf,

    /// Generated runtime tag/constants + dispatch mapping for runtime synchronization
    #[arg(long, default_value = "crates/beskid_runtime/src/interop_generated.rs")]
    pub runtime_output: PathBuf,

    /// Check mode: fail if generated files differ from current contents
    #[arg(long)]
    pub check: bool,

    /// Print what would be generated without writing files
    #[arg(long)]
    pub dry_run: bool,
}

pub fn execute(args: InteropArgs) -> Result<()> {
    beskid_interop_tooling::execute(beskid_interop_tooling::ToolingArgs {
        spec_root: args.spec_root,
        output_dir: args.output_dir,
        prelude_output: args.prelude_output,
        runtime_output: args.runtime_output,
        check: args.check,
        dry_run: args.dry_run,
    })
}
