use anyhow::{Context, Result};
use clap::Args;
use std::fs;
use std::path::PathBuf;
use beskid_analysis::parsing::parsable::Parsable;
use beskid_analysis::syntax::Program;
use beskid_analysis::parser::{BeskidParser, Rule};
use beskid_analysis::query::NodeRef;
use pest::Parser;
use crate::errors::{print_pretty_parse_error, print_pretty_pest_error};

#[derive(Args, Debug)]
pub struct TreeArgs {
    /// The input Beskid file to visualize
    #[arg(required = true)]
    pub input: PathBuf,
}

pub fn execute(args: TreeArgs) -> Result<()> {
    let source = fs::read_to_string(&args.input)
        .with_context(|| format!("Failed to read file: {}", args.input.display()))?;

    let mut pairs = match BeskidParser::parse(Rule::Program, &source) {
        Ok(pairs) => pairs,
        Err(err) => {
            print_pretty_pest_error(&args.input.display().to_string(), &source, &err);
            std::process::exit(1);
        }
    };

    let pair = match pairs.next() {
        Some(pair) => pair,
        None => {
            return Err(anyhow::anyhow!("No program found"));
        }
    };

    let program = match Program::parse(pair) {
        Ok(program) => program,
        Err(err) => {
            print_pretty_parse_error(&args.input.display().to_string(), &source, &err);
            std::process::exit(1);
        }
    };

    print_tree(NodeRef::from(&program.node), 0);

    Ok(())
}

fn print_tree(node: NodeRef, indent: usize) {
    let prefix = "  ".repeat(indent);
    let kind = node.node_kind();
    
    // Some nodes might have interesting values to show in the tree
    let extra = if let Some(ident) = node.of::<beskid_analysis::syntax::Identifier>() {
        format!(" ({})", ident.name)
    } else if let Some(lit) = node.of::<beskid_analysis::syntax::Literal>() {
        format!(" ({:?})", lit)
    } else {
        String::new()
    };

    println!("{}{:?}{}", prefix, kind, extra);

    node.children(|child| {
        print_tree(child, indent + 1);
    });
}
