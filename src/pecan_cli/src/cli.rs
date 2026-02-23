use clap::{Parser, Subcommand};
use crate::commands::analyze::AnalyzeArgs;
use crate::commands::clif::ClifArgs;
use crate::commands::parse::ParseArgs;
use crate::commands::tree::TreeArgs;
use crate::commands::{analyze, clif, parse, tree};
use std::env;

#[derive(Parser)]
#[command(name = "pekan")]
#[command(about = "Pecan CLI tool", version, author)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Parse a Pecan file and output the AST representation
    Parse(ParseArgs),

    /// Generate an AST visualization tree from a Pecan file
    Tree(TreeArgs),

    /// Analyze a Pecan file and print analysis results (STUB)
    Analyze(AnalyzeArgs),

    /// Lower a Pecan file into CLIF and print the resulting IR
    Clif(ClifArgs),
}

pub fn run() -> anyhow::Result<()> {
    let os_args = env::args_os();
    let all_args = argfile::expand_args_from(os_args, argfile::parse_fromfile, argfile::PREFIX).unwrap();
    let cli = Cli::parse_from(all_args);

    match cli.command {
        Commands::Parse(args) => parse::execute(args),
        Commands::Tree(args) => tree::execute(args),
        Commands::Analyze(args) => analyze::execute(args),
        Commands::Clif(args) => clif::execute(args),
    }
}
