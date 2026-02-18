use pest_derive::Parser;

#[derive(Parser)]
#[grammar = "pecan.pest"]
pub struct PecanParser;
