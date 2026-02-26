pub mod core;
pub mod normalizable;
pub mod statements;

pub use core::{HirNormalizeError, Normalizer, normalize_program};
pub use normalizable::Normalize;
