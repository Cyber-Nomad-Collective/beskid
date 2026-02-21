use std::fmt;

#[derive(Debug)]
pub enum CodegenError {
    UnsupportedFeature(&'static str),
    MissingSymbol(&'static str),
}

impl fmt::Display for CodegenError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CodegenError::UnsupportedFeature(feature) => {
                write!(f, "unsupported feature: {feature}")
            }
            CodegenError::MissingSymbol(symbol) => write!(f, "missing symbol: {symbol}"),
        }
    }
}

impl std::error::Error for CodegenError {}
