//! Runtime support for Pecan (allocation, builtins, GC hooks).

pub mod builtins;

pub use builtins::{array_new, panic, str_len, str_new};
