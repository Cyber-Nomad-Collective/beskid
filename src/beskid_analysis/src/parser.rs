use pest_derive::Parser;

#[derive(Parser)]
#[grammar = "beskid.pest"]
pub struct BeskidParser;
