pub mod core;
pub mod normalizable;
pub mod statements;

pub use core::{normalize_program, HirNormalizeError, Normalizer};
pub use normalizable::Normalize;
